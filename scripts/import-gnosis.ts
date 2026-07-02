import { PrismaClient } from "@prisma/client"
import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

const prisma = new PrismaClient()
const GNOSIS_URL = "https://github.com/spearssoftware/gnosis/releases/latest/download/gnosis-lite.db"
const GNOSIS_PATH = "/tmp/gnosis/gnosis-lite.db"

const OSIS_TO_BOOK: Record<string, number> = {
  gen: 1, exod: 2, lev: 3, num: 4, deut: 5, josh: 6, judg: 7, ruth: 8,
  "1sam": 9, "2sam": 10, "1kgs": 11, "2kgs": 12, "1chr": 13, "2chr": 14, ezra: 15, neh: 16,
  esth: 17, job: 18, ps: 19, prov: 20, eccl: 21, song: 22,
  isa: 23, jer: 24, lam: 25, ezek: 26, dan: 27, hos: 28, jl: 29, amos: 30, obad: 31, jonah: 32, mic: 33, nah: 34, hab: 35, zeph: 36, hag: 37, zech: 38, mal: 39,
  matt: 40, mark: 41, luke: 42, john: 43, acts: 44,
  rom: 45, "1cor": 46, "2cor": 47, gal: 48, eph: 49, phil: 50, col: 51,
  "1thess": 52, "2thess": 53, "1tim": 54, "2tim": 55, titus: 56, phlm: 57,
  heb: 58, jas: 59, "1pet": 60, "2pet": 61, "1john": 62, "2john": 63, "3john": 64, jude: 65, rev: 66,
}

function parseOsisRef(osis: string): { book: number; chapter: number; verse: number } | null {
  const clean = osis.split("-")[0]
  const match = clean.match(/^(\d?\s*[A-Za-z]+)\.(\d+)\.(\d+)$/)
  if (!match) return null
  const bookName = match[1].toLowerCase().replace(/\s/g, "").replace(/^(\d)([a-z])/, "$1$2")
  const book = OSIS_TO_BOOK[bookName]
  if (!book) return null
  return { book, chapter: parseInt(match[2]), verse: parseInt(match[3]) }
}

function osisKey(ref: { book: number; chapter: number; verse: number }): string {
  const bookAbbr = Object.entries(OSIS_TO_BOOK).find(([, n]) => n === ref.book)?.[0] || ""
  return `${bookAbbr}.${ref.chapter}.${ref.verse}`
}

async function main() {
  console.log("Downloading Gnosis dataset...")
  if (!fs.existsSync(GNOSIS_PATH)) {
    fs.mkdirSync(path.dirname(GNOSIS_PATH), { recursive: true })
    const response = await fetch(GNOSIS_URL)
    if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    fs.writeFileSync(GNOSIS_PATH, buffer)
    console.log("  Downloaded to", GNOSIS_PATH)
  } else {
    console.log("  Using cached copy at", GNOSIS_PATH)
  }

  const db = new Database(GNOSIS_PATH)

  // Build verse cache
  console.log("Building verse reference cache...")
  const allVerses = await prisma.verse.findMany({
    include: { chapter: { include: { book: true } } },
  })
  const osisToVerseId = new Map<string, string>()
  for (const v of allVerses) {
    const bookAbbr = v.chapter.book.name.toLowerCase().replace(/\s/g, "").replace(/^(\d)([a-z])/, "$1$2")
    const key = `${bookAbbr}.${v.chapter.number}.${v.number}`
    osisToVerseId.set(key, v.id)
  }
  console.log(`  Cached ${osisToVerseId.size} verses`)

  // Import cross-references
  console.log("Importing cross-references...")
  const xrefs = db.prepare("SELECT from_verse_id, to_verse_start_id, votes FROM cross_reference").all() as any[]
  let xrefInserted = 0
  let xrefSkipped = 0
  for (const x of xrefs) {
    const fromOsis = db.prepare("SELECT osis_ref FROM verse WHERE id = ?").get(x.from_verse_id) as any
    const toOsis = db.prepare("SELECT osis_ref FROM verse WHERE id = ?").get(x.to_verse_start_id) as any
    if (!fromOsis || !toOsis) { xrefSkipped++; continue }
    const fromRef = parseOsisRef(fromOsis.osis_ref)
    const toRef = parseOsisRef(toOsis.osis_ref)
    if (!fromRef || !toRef) { xrefSkipped++; continue }
    const fromId = osisToVerseId.get(osisKey(fromRef))
    const toId = osisToVerseId.get(osisKey(toRef))
    if (!fromId || !toId) { xrefSkipped++; continue }
    try {
      await prisma.crossReference.upsert({
        where: { fromVerseId_toVerseId: { fromVerseId: fromId, toVerseId: toId } },
        update: { weight: x.votes || 1 },
        create: { fromVerseId: fromId, toVerseId: toId, weight: x.votes || 1, source: "gnosis" },
      })
      xrefInserted++
      if (xrefInserted % 10000 === 0) console.log(`  ${xrefInserted} cross-refs inserted...`)
    } catch { xrefSkipped++ }
  }
  console.log(`  Inserted ${xrefInserted} cross-references (skipped ${xrefSkipped})`)

  // Import places — use findFirst + update/create since Place uses cuid() id
  console.log("Importing places...")
  const places = db.prepare("SELECT slug, name, kjv_name, latitude, longitude, feature_type, feature_sub_type, modern_name FROM place WHERE latitude IS NOT NULL").all() as any[]
  let placeInserted = 0
  for (const p of places) {
    const existing = await prisma.place.findFirst({ where: { name: p.kjv_name || p.name } })
    if (existing) {
      await prisma.place.update({
        where: { id: existing.id },
        data: { latitude: p.latitude, longitude: p.longitude, placeType: p.feature_type || existing.placeType },
      })
    } else {
      await prisma.place.create({
        data: {
          name: p.kjv_name || p.name,
          latitude: p.latitude,
          longitude: p.longitude,
          placeType: p.feature_type || "unknown",
          description: p.modern_name ? `Modern: ${p.modern_name}` : null,
        },
      })
    }
    placeInserted++
  }
  console.log(`  Imported ${placeInserted} places`)

  await prisma.$disconnect()
  db.close()
  console.log("Gnosis import complete")
}

main().catch((e) => {
  console.error("Import failed:", e)
  prisma.$disconnect().catch(() => {})
  process.exit(1)
})
