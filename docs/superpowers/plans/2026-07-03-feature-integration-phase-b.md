# Feature Integration — Phase B: Data Enrichment (Gnosis Import)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the Gnosis biblical knowledge graph dataset (3,000+ people, 1,600+ places, 345K cross-references, 28K person→verse links) into the PostgreSQL database to power connected features across the Bible reader, maps, and knowledge graph.

**Architecture:** A standalone TypeScript import script (`scripts/import-gnosis.ts`) downloads the Gnosis SQLite database, maps OSIS verse references to the existing KJV verse IDs, and inserts cross-references, places, and entity→verse links into the PostgreSQL tables. The existing seed script is updated to optionally call this import.

**Tech Stack:** TypeScript, Prisma ORM, Node.js `better-sqlite3` (to read Gnosis SQLite), node-fetch (to download the dataset)

**Gnosis Dataset:** https://github.com/spearssoftware/gnosis — CC-BY-SA 4.0. Available as SQLite database via GitHub Releases.

---

## File Map

### New Files
- `scripts/import-gnosis.ts` — Main import script
- `scripts/tsconfig.json` — tsconfig for scripts directory (extends root, but allows CommonJS if needed)

### Modified Files
- `prisma/seed.ts` — Call gnosis import if data is empty
- `package.json` — Add `better-sqlite3` dependency, add `import:gnosis` script

---

### Task 1: Add better-sqlite3 dependency and configure scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install better-sqlite3**

```bash
npm install --save-dev better-sqlite3 @types/better-sqlite3
```

- [ ] **Step 2: Add script to package.json**

Add to the `"scripts"` section:
```json
"import:gnosis": "tsx scripts/import-gnosis.ts"
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add better-sqlite3 for Gnosis data import"
```

---

### Task 2: Create the Gnosis import script — cross-references

**Files:**
- Create: `scripts/import-gnosis.ts`

- [ ] **Step 1: Write the import script**

This script:
1. Downloads Gnosis `gnosis-lite.db` from GitHub Releases (or uses a cached copy at `/tmp/gnosis/`)
2. Maps OSIS verse refs (e.g. `"Gen.1.1"`) to our KJV `Verse.id` values
3. Imports cross-references into `CrossReference` table
4. Imports places into `Place` table
5. Imports person→verse links into `EntityRelation.sourceVerseId`
6. Imports place→verse links

```typescript
import { PrismaClient } from "@prisma/client"
import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

const prisma = new PrismaClient()
const GNOSIS_URL = "https://github.com/spearssoftware/gnosis/releases/latest/download/gnosis-lite.db"
const GNOSIS_PATH = "/tmp/gnosis/gnosis-lite.db"

/** Map OSIS book abbreviation to our book number (1-66) */
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
  // Format: "Gen.1.1" or "1Chr.1.1" or "Gen.1.1-5" (range — take start)
  const clean = osis.split("-")[0] // take start of range
  const match = clean.match(/^(\d?\s*[A-Za-z]+)\.(\d+)\.(\d+)$/)
  if (!match) return null
  const bookName = match[1].toLowerCase().replace(/\s/g, "").replace(/^(\d)([a-z])/, "$1$2")
  const book = OSIS_TO_BOOK[bookName]
  if (!book) return null
  return { book, chapter: parseInt(match[2]), verse: parseInt(match[3]) }
}

async function main() {
  console.log("📥 Downloading Gnosis dataset...")
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
  
  // Build a cache of osis_ref → our verseId
  console.log("🔗 Building verse reference cache...")
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
  console.log("📖 Importing cross-references...")
  const xrefs = db.prepare("SELECT from_verse_id, to_verse_start_id, to_verse_end_id, votes FROM cross_reference").all() as any[]
  let xrefInserted = 0
  let xrefSkipped = 0
  for (const x of xrefs) {
    const fromOsis = db.prepare("SELECT osis_ref FROM verse WHERE id = ?").get(x.from_verse_id) as any
    const toOsis = db.prepare("SELECT osis_ref FROM verse WHERE id = ?").get(x.to_verse_start_id) as any
    if (!fromOsis || !toOsis) { xrefSkipped++; continue }
    const fromRef = parseOsisRef(fromOsis.osis_ref)
    const toRef = parseOsisRef(toOsis.osis_ref)
    if (!fromRef || !toRef) { xrefSkipped++; continue }
    const fromId = osisToVerseId.get(`${osisKey(fromRef)}`)
    const toId = osisToVerseId.get(`${osisKey(toRef)}`)
    if (!fromId || !toId) { xrefSkipped++; continue }
    try {
      await prisma.crossReference.upsert({
        where: { fromVerseId_toVerseId: { fromVerseId: fromId, toVerseId: toId } },
        update: { weight: x.votes || 1 },
        create: { fromVerseId: fromId, toVerseId: toId, weight: x.votes || 1, source: "gnosis" },
      })
      xrefInserted++
      if (xrefInserted % 10000 === 0) process.stdout.write(`  ${xrefInserted}...\r`)
    } catch { xrefSkipped++ }
  }
  console.log(`  Inserted ${xrefInserted} cross-references (skipped ${xrefSkipped})`)

  // Import places
  console.log("🗺️  Importing places...")
  const places = db.prepare("SELECT slug, name, kjv_name, latitude, longitude, feature_type, feature_sub_type, modern_name FROM place WHERE latitude IS NOT NULL").all() as any[]
  let placeInserted = 0
  for (const p of places) {
    try {
      await prisma.place.upsert({
        where: { id: p.slug },
        update: { latitude: p.latitude, longitude: p.longitude, placeType: p.feature_type || "unknown" },
        create: {
          id: p.slug,
          name: p.kjv_name || p.name,
          latitude: p.latitude,
          longitude: p.longitude,
          placeType: p.feature_type || "unknown",
          description: p.modern_name ? `Modern: ${p.modern_name}` : null,
        },
      })
      placeInserted++
    } catch { /* skip duplicates */ }
  }
  console.log(`  Imported ${placeInserted} places`)

  await prisma.$disconnect()
  db.close()
  console.log("✅ Gnosis import complete")
}

function osisKey(ref: { book: number; chapter: number; verse: number }): string {
  const bookAbbr = Object.entries(OSIS_TO_BOOK).find(([, n]) => n === ref.book)?.[0] || ""
  return `${bookAbbr}.${ref.chapter}.${ref.verse}`
}

main().catch((e) => {
  console.error("❌ Import failed:", e)
  prisma.$disconnect().catch(() => {})
  process.exit(1)
})
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --project tsconfig.json`
If scripts directory needs its own tsconfig, create `scripts/tsconfig.json`:
```json
{
  "extends": "../tsconfig.json",
  "include": ["./**/*.ts"]
}
```

- [ ] **Step 3: Run the import script to test**

```bash
npx tsx scripts/import-gnosis.ts
```
Expected: Downloads Gnosis DB, imports cross-refs and places.

- [ ] **Step 4: Commit**

```bash
git add scripts/ package.json package-lock.json
git commit -m "feat: add Gnosis dataset import script for cross-references and places"
```

---

### Task 3: Add person→verse and place→verse links to EntityRelation

**Files:**
- Modify: `scripts/import-gnosis.ts`

- [ ] **Step 1: Add person→verse import to the script**

After the places import section, add:

```typescript
  // Import person→verse links into EntityRelation
  console.log("👤 Importing person→verse links...")
  const personVerseRows = db.prepare(`
    SELECT pv.person_id, pv.verse_id, p.slug, p.name, v.osis_ref
    FROM person_verse pv
    JOIN person p ON p.id = pv.person_id
    JOIN verse v ON v.id = pv.verse_id
  `).all() as any[]
  let personLinks = 0
  let personSkipped = 0
  for (const row of personVerseRows) {
    const ref = parseOsisRef(row.osis_ref)
    if (!ref) { personSkipped++; continue }
    const verseId = osisToVerseId.get(`${osisKey(ref)}`)
    if (!verseId) { personSkipped++; continue }
    // Check if person exists in our DB
    const existingPerson = await prisma.person.findUnique({ where: { id: row.slug } })
    if (!existingPerson) { personSkipped++; continue }
    try {
      await prisma.entityRelation.create({
        data: {
          subjectId: row.slug,
          subjectType: "person",
          predicate: "mentioned_in",
          objectId: verseId,
          objectType: "verse",
          sourceVerseId: verseId,
        },
      }).catch(() => {}) // ignore duplicates
      personLinks++
      if (personLinks % 5000 === 0) process.stdout.write(`  ${personLinks}...\r`)
    } catch { personSkipped++ }
  }
  console.log(`  Linked ${personLinks} persons to verses (skipped ${personSkipped})`)

  // Import place→verse links into EntityRelation
  console.log("📍 Importing place→verse links...")
  const placeVerseRows = db.prepare(`
    SELECT pv.place_id, pv.verse_id, p.slug, p.name, v.osis_ref
    FROM place_verse pv
    JOIN place p ON p.id = pv.place_id
    JOIN verse v ON v.id = pv.verse_id
  `).all() as any[]
  let placeLinks = 0
  let placeSkipped = 0
  for (const row of placeVerseRows) {
    const ref = parseOsisRef(row.osis_ref)
    if (!ref) { placeSkipped++; continue }
    const verseId = osisToVerseId.get(`${osisKey(ref)}`)
    if (!verseId) { placeSkipped++; continue }
    try {
      await prisma.entityRelation.create({
        data: {
          subjectId: row.slug,
          subjectType: "place",
          predicate: "mentioned_in",
          objectId: verseId,
          objectType: "verse",
          sourceVerseId: verseId,
        },
      }).catch(() => {})
      placeLinks++
      if (placeLinks % 2000 === 0) process.stdout.write(`  ${placeLinks}...\r`)
    } catch { placeSkipped++ }
  }
  console.log(`  Linked ${placeLinks} places to verses (skipped ${placeSkipped})`)
```

These use `"mentioned_in"` as the predicate to distinguish from existing `EntityRelation` predicates.

- [ ] **Step 2: Run the import script to test**

```bash
npx tsx scripts/import-gnosis.ts
```
Expected: Person and place verse links are imported.

- [ ] **Step 3: Commit**

```bash
git add scripts/import-gnosis.ts
git commit -m "feat: import person→verse and place→verse links from Gnosis"
```

---

### Task 4: Update seed script to call gnosis import

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Add optional gnosis import call to seed**

Find the `seedKnowledgeGraph()` call in the main seed function. After it, add:

```typescript
  // Import Gnosis data if cross-references are empty
  const xrefCount = await prisma.crossReference.count()
  if (xrefCount === 0) {
    console.log("  🔗 Importing Gnosis dataset (cross-references, places, entity→verse links)...")
    try {
      const { execSync } = require("child_process")
      execSync("npx tsx scripts/import-gnosis.ts", { stdio: "inherit" })
      console.log("  ✅ Gnosis import complete")
    } catch (e) {
      console.error("  ⚠️  Gnosis import failed (non-fatal):", (e as Error).message)
    }
  } else {
    console.log(`  🔗 Skipping Gnosis import — ${xrefCount} cross-references already exist`)
  }
```

- [ ] **Step 2: Run seed to verify**

```bash
npx prisma db seed
```
Expected: Seed completes successfully, may skip Gnosis import if already run.

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: integrate Gnosis import into seed script"
```

---

## Verification

After all tasks:

1. Run the import: `npx tsx scripts/import-gnosis.ts`
2. Verify data was imported:
   - `SELECT COUNT(*) FROM "CrossReference"` → should have ~340K rows
   - `SELECT COUNT(*) FROM "Place"` → should have ~1,600 rows (was 15)
   - `SELECT COUNT(*) FROM "EntityRelation" WHERE predicate = 'mentioned_in'` → should have ~35K rows
3. Open `/bible/1/1` and click a verse → cross-reference panel should show references
4. Open `/maps/explore` → should show many more place markers
