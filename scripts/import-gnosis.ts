import { PrismaClient } from "@prisma/client"
import initSqlJs from "sql.js"
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

  const SQL = await initSqlJs()
  const dbBuffer = fs.readFileSync(GNOSIS_PATH)
  const db = new SQL.Database(dbBuffer)

  // Build verse cache
  console.log("Building verse reference cache...")
  const allVerses = await prisma.verse.findMany({
    include: { chapter: { include: { book: true } } },
  })
  const osisToVerseId = new Map<string, string>()
  for (const v of allVerses) {
    const bn = v.chapter.book.name.toLowerCase().replace(/[^a-z0-9]/g, "")
    const key = `${bn}.${v.chapter.number}.${v.number}`
    osisToVerseId.set(key, v.id)
  }
  console.log(`  Cached ${osisToVerseId.size} verses`)

  // Pre-load OSIS refs for all verses in Gnosis
  console.log("Loading Gnosis verse refs...")
  const verseRows = db.exec("SELECT id, osis_ref FROM verse")
  const cols = verseRows[0]?.columns || []
  const idIdx = cols.indexOf("id")
  const refIdx = cols.indexOf("osis_ref")
  const gnosisVerses = new Map<number, string>()
  for (const row of verseRows[0]?.values || []) {
    gnosisVerses.set(row[idIdx] as number, row[refIdx] as string)
  }
  console.log(`  Loaded ${gnosisVerses.size} Gnosis verses`)

  // Import cross-references
  console.log("Importing cross-references...")
  const xrefRows = db.exec("SELECT from_verse_id, to_verse_start_id, votes FROM cross_reference")
  const xCols = xrefRows[0]?.columns || []
  const fromIdx = xCols.indexOf("from_verse_id")
  const toIdx = xCols.indexOf("to_verse_start_id")
  const votesIdx = xCols.indexOf("votes")
  const allXrefs = xrefRows[0]?.values || []

  let xrefInserted = 0
  let xrefSkipped = 0
  for (const x of allXrefs) {
    const fromOsis = gnosisVerses.get(x[fromIdx] as number)
    const toOsis = gnosisVerses.get(x[toIdx] as number)
    if (!fromOsis || !toOsis) { xrefSkipped++; continue }
    const fromRef = parseOsisRef(fromOsis)
    const toRef = parseOsisRef(toOsis)
    if (!fromRef || !toRef) { xrefSkipped++; continue }
    const fromId = osisToVerseId.get(osisKey(fromRef))
    const toId = osisToVerseId.get(osisKey(toRef))
    if (!fromId || !toId) { xrefSkipped++; continue }
    try {
      await prisma.crossReference.upsert({
        where: { fromVerseId_toVerseId: { fromVerseId: fromId, toVerseId: toId } },
        update: { weight: (x[votesIdx] as number) || 1 },
        create: { fromVerseId: fromId, toVerseId: toId, weight: (x[votesIdx] as number) || 1, source: "gnosis" },
      })
      xrefInserted++
      if (xrefInserted % 10000 === 0) console.log(`  ${xrefInserted} cross-refs inserted...`)
    } catch { xrefSkipped++ }
  }
  console.log(`  Inserted ${xrefInserted} cross-references (skipped ${xrefSkipped})`)

  // Import places
  console.log("Importing places...")
  const placeRows = db.exec("SELECT slug, name, kjv_name, latitude, longitude, feature_type, feature_sub_type, modern_name FROM place WHERE latitude IS NOT NULL")
  const pCols = placeRows[0]?.columns || []
  const slugIdx = pCols.indexOf("slug")
  const nameIdx = pCols.indexOf("name")
  const kjvIdx = pCols.indexOf("kjv_name")
  const latIdx = pCols.indexOf("latitude")
  const lngIdx = pCols.indexOf("longitude")
  const ftIdx = pCols.indexOf("feature_type")
  const modernIdx = pCols.indexOf("modern_name")
  const allPlaces = placeRows[0]?.values || []

  let placeInserted = 0
  for (const p of allPlaces) {
    const name = (p[kjvIdx] || p[nameIdx]) as string
    const lat = p[latIdx] as number
    const lng = p[lngIdx] as number
    const existing = await prisma.place.findFirst({ where: { name } })
    if (existing) {
      await prisma.place.update({
        where: { id: existing.id },
        data: { latitude: lat, longitude: lng, placeType: (p[ftIdx] as string) || existing.placeType },
      })
    } else {
      await prisma.place.create({
        data: {
          name,
          latitude: lat,
          longitude: lng,
          placeType: (p[ftIdx] as string) || "unknown",
          description: p[modernIdx] ? `Modern: ${p[modernIdx]}` : null,
        },
      })
    }
    placeInserted++
  }
  console.log(`  Imported ${placeInserted} places`)

  // Slug mapping: Gnosis slug → our person.id
  const PERSON_SLUG_MAP: Record<string, string> = {
    "jesus-son-of-joseph": "jesus",
    "jesus-christ": "jesus",
    "god": "god",
    "israel": "israel",
    "aaron": "aaron",
    "saul": "saul",
    "holy-spirit": "holy-spirit",
  }

  // Ensure key persons exist in DB
  const MISSING_PERSONS = [
    { id: "god", name: "God", personType: "divine", description: "The one true God, Creator of heaven and earth" },
    { id: "israel", name: "Israel", personType: "nation", description: "The nation of Israel, descendants of Jacob" },
    { id: "aaron", name: "Aaron", personType: "priest", description: "First high priest of Israel, brother of Moses" },
    { id: "saul", name: "Saul", personType: "king", description: "First king of Israel" },
    { id: "holy-spirit", name: "Holy Spirit", personType: "divine", description: "The third person of the Trinity" },
  ]
  for (const p of MISSING_PERSONS) {
    await prisma.person.upsert({
      where: { id: p.id },
      update: {},
      create: { id: p.id, name: p.name, personType: p.personType, description: p.description },
    })
  }

  // Import person→verse links into EntityRelation
  console.log("Importing person→verse links...")
  const pvRows = db.exec(`
    SELECT pv.person_id, pv.verse_id, p.slug
    FROM person_verse pv
    JOIN person p ON p.id = pv.person_id
  `)
  const pvCols = pvRows[0]?.columns || []
  const pvVerseId = pvCols.indexOf("verse_id")
  const pvSlug = pvCols.indexOf("slug")
  const allPV = pvRows[0]?.values || []

  let personLinks = 0
  let personSkipped = 0
  for (const row of allPV) {
    const gnosisSlug = row[pvSlug] as string
    const dbSlug = PERSON_SLUG_MAP[gnosisSlug] || gnosisSlug
    const gnosisVerseId = row[pvVerseId] as number
    const osisRef = gnosisVerses.get(gnosisVerseId)
    if (!osisRef) { personSkipped++; continue }
    const ref = parseOsisRef(osisRef)
    if (!ref) { personSkipped++; continue }
    const verseId = osisToVerseId.get(osisKey(ref))
    if (!verseId) { personSkipped++; continue }
    const existingPerson = await prisma.person.findUnique({ where: { id: dbSlug } })
    if (!existingPerson) { personSkipped++; continue }
    try {
      await prisma.entityRelation.create({
        data: {
          subjectId: dbSlug,
          subjectType: "person",
          predicate: "mentioned_in",
          objectId: verseId,
          objectType: "verse",
          sourceVerseId: verseId,
        },
      }).catch(() => {})
      personLinks++
      if (personLinks % 5000 === 0) console.log(`  ${personLinks} person links...`)
    } catch { personSkipped++ }
  }
  console.log(`  Linked ${personLinks} persons to verses (skipped ${personSkipped})`)

  // Import place→verse links into EntityRelation
  console.log("Importing place→verse links...")
  const plcVRes = db.exec(`
    SELECT pv.place_id, pv.verse_id, p.slug
    FROM place_verse pv
    JOIN place p ON p.id = pv.place_id
  `)
  const plcVCols = plcVRes[0]?.columns || []
  const plcVPlaceId = plcVCols.indexOf("place_id")
  const plcVVerseId = plcVCols.indexOf("verse_id")
  const plcVSlug = plcVCols.indexOf("slug")
  const allPlcV = plcVRes[0]?.values || []

  let placeLinks = 0
  let placeSkipped = 0
  for (const row of allPlcV) {
    const slug = row[plcVSlug] as string
    const gnosisVerseId = row[plcVVerseId] as number
    const osisRef = gnosisVerses.get(gnosisVerseId)
    if (!osisRef) { placeSkipped++; continue }
    const ref = parseOsisRef(osisRef)
    if (!ref) { placeSkipped++; continue }
    const verseId = osisToVerseId.get(osisKey(ref))
    if (!verseId) { placeSkipped++; continue }
    try {
      await prisma.entityRelation.create({
        data: {
          subjectId: slug,
          subjectType: "place",
          predicate: "mentioned_in",
          objectId: verseId,
          objectType: "verse",
          sourceVerseId: verseId,
        },
      }).catch(() => {})
      placeLinks++
      if (placeLinks % 2000 === 0) console.log(`  ${placeLinks} place links...`)
    } catch { placeSkipped++ }
  }
  console.log(`  Linked ${placeLinks} places to verses (skipped ${placeSkipped})`)

  await prisma.$disconnect()
  db.close()
  console.log("Gnosis import complete")
}

main().catch((e) => {
  console.error("Import failed:", e)
  prisma.$disconnect().catch(() => {})
  process.exit(1)
})
