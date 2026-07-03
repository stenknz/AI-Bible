# Knowledge Platform — Phase 2: Import Scripts

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create four concrete importers that populate the DictionaryEntry, TopicEntry, and CommentaryEntry tables from public domain data sources.

**Architecture:** Each importer extends `BaseImporter` from Phase 1, implements `load()` + `validate()` + `persist()`, and registers in the `SOURCES` map in `import-runner.ts`. Data sources are the OpenChristianData HuggingFace dataset (CC0-licensed, structured JSON) and the existing Gnosis SQLite dataset (already used for cross-refs).

**Tech Stack:** TypeScript, Prisma ORM, HuggingFace Datasets (JSONL), SQLite (via sql.js, already used in project)

---

## File Structure

### Files to Create

| File | Purpose |
|------|---------|
| `scripts/import/sources/eastons.ts` | Easton's Bible Dictionary importer |
| `scripts/import/sources/smiths.ts` | Smith's Bible Dictionary importer |
| `scripts/import/sources/naves.ts` | Nave's Topical Bible importer |
| `scripts/import/sources/matthew-henry.ts` | Matthew Henry Commentary importer |
| `scripts/import/sources/download-datasets.ts` | Downloads OpenChristianData JSONL files |

### Files to Modify

| File | Change |
|------|--------|
| `scripts/import/import-runner.ts` | Register 4 new importers in `SOURCES` map |
| `scripts/import/base-importer.ts` | Add `fetchDataset()` helper for downloading remote JSONL |

---

### Task 1: Add dataset download helper to BaseImporter

**Files:**
- Modify: `scripts/import/base-importer.ts`

- [ ] **Step 1: Add fetchDataset helper**

Add a static/protected helper to BaseImporter that downloads JSONL files from HuggingFace or URLs and parses them:

```typescript
// Add to scripts/import/base-importer.ts

export async function downloadJSONL(url: string): Promise<string[]> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`)
  const text = await response.text()
  return text.split("\n").filter(Boolean)
}

export function parseJSONL<T>(lines: string[]): T[] {
  const results: T[] = []
  for (let i = 0; i < lines.length; i++) {
    try {
      results.push(JSON.parse(lines[i]))
    } catch {
      console.warn(`Skipping invalid JSON at line ${i + 1}`)
    }
  }
  return results
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add scripts/import/base-importer.ts
git commit -m "feat(knowledge): add downloadJSONL and parseJSONL helpers to base-importer"
git push
```

---

### Task 2: Create Easton's Bible Dictionary importer

**Files:**
- Create: `scripts/import/sources/eastons.ts`
- Modify: `scripts/import/import-runner.ts`

- [ ] **Step 1: Create the Easton's importer**

```typescript
// scripts/import/sources/eastons.ts

import { prisma } from "@/lib/db"
import { BaseImporter, downloadJSONL, parseJSONL } from "../base-importer"
import type { NormalizedEntry, ImportStats, ValidationError } from "../types"
import { generateSlug } from "../validate-source"

const EASTONS_URL = "https://huggingface.co/datasets/JWBickel/BibleDictionaries/resolve/main/Easton%27s%20Bible%20Dictionary.jsonl"

type EastonRaw = {
  word: string
  definition: string
  scripture_refs?: string[]
}

export class EastonsImporter extends BaseImporter {
  readonly source = "easton"
  readonly version = "1.0"

  async load(): Promise<NormalizedEntry[]> {
    const lines = await downloadJSONL(EASTONS_URL)
    const raw = parseJSONL<EastonRaw>(lines)
    return raw.map((entry) => ({
      source: this.source,
      title: entry.word,
      slug: generateSlug(entry.word),
      content: entry.definition,
      summary: entry.definition.slice(0, 200),
      aliases: [],
      category: "term",
      scriptureRefs: entry.scripture_refs || [],
      keywords: [entry.word.toLowerCase()],
    }))
  }

  validate(entries: NormalizedEntry[]): ValidationError[] {
    const errors: ValidationError[] = []
    for (let i = 0; i < entries.length; i++) {
      if (!entries[i].title) errors.push({ line: i + 1, field: "title", message: "Missing title" })
      if (!entries[i].content) errors.push({ line: i + 1, field: "content", message: "Missing content" })
    }
    return errors
  }

  async persist(entries: NormalizedEntry[]): Promise<ImportStats> {
    const stats: ImportStats = { total: entries.length, inserted: 0, updated: 0, skipped: 0, errors: 0, duration: 0 }
    for (const entry of entries) {
      try {
        const existing = await prisma.dictionaryEntry.findUnique({ where: { slug: entry.slug } })
        if (existing) {
          await prisma.dictionaryEntry.update({
            where: { slug: entry.slug },
            data: {
              title: entry.title,
              content: entry.content,
              summary: entry.summary,
              scriptureRefs: entry.scriptureRefs || [],
              keywords: entry.keywords || [],
              aliases: entry.aliases || [],
              category: entry.category || "term",
              metadata: entry.metadata || {},
            },
          })
          stats.updated++
        } else {
          await prisma.dictionaryEntry.create({
            data: {
              source: entry.source,
              title: entry.title,
              slug: entry.slug,
              content: entry.content,
              summary: entry.summary,
              scriptureRefs: entry.scriptureRefs || [],
              keywords: entry.keywords || [],
              aliases: entry.aliases || [],
              category: entry.category || "term",
              metadata: entry.metadata || {},
            },
          })
          stats.inserted++
        }
      } catch (e) {
        console.error(`[easton] Error persisting "${entry.title}":`, e)
        stats.errors++
      }
    }
    return stats
  }
}
```

- [ ] **Step 2: Register in import-runner.ts**

Add to the imports and SOURCES map in `scripts/import/import-runner.ts`:

```typescript
import { EastonsImporter } from "./sources/eastons"

const SOURCES: Record<string, new () => BaseImporter> = {
  easton: EastonsImporter,
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 4: Commit**

```bash
git add scripts/import/sources/eastons.ts scripts/import/import-runner.ts
git commit -m "feat(knowledge): add Easton's Bible Dictionary importer"
git push
```

---

### Task 3: Create Smith's Bible Dictionary importer

**Files:**
- Create: `scripts/import/sources/smiths.ts`
- Modify: `scripts/import/import-runner.ts`

- [ ] **Step 1: Create the Smith's importer**

```typescript
// scripts/import/sources/smiths.ts

import { prisma } from "@/lib/db"
import { BaseImporter, downloadJSONL, parseJSONL } from "../base-importer"
import type { NormalizedEntry, ImportStats, ValidationError } from "../types"
import { generateSlug } from "../validate-source"

const SMITHS_URL = "https://huggingface.co/datasets/JWBickel/BibleDictionaries/resolve/main/Smith%27s%20Bible%20Dictionary.jsonl"

type SmithRaw = {
  word: string
  definition: string
  scripture_refs?: string[]
}

export class SmithsImporter extends BaseImporter {
  readonly source = "smith"
  readonly version = "1.0"

  async load(): Promise<NormalizedEntry[]> {
    const lines = await downloadJSONL(SMITHS_URL)
    const raw = parseJSONL<SmithRaw>(lines)
    return raw.map((entry) => ({
      source: this.source,
      title: entry.word,
      slug: generateSlug(entry.word),
      content: entry.definition,
      summary: entry.definition.slice(0, 200),
      aliases: [],
      category: "term",
      scriptureRefs: entry.scripture_refs || [],
      keywords: [entry.word.toLowerCase()],
    }))
  }

  validate(entries: NormalizedEntry[]): ValidationError[] {
    const errors: ValidationError[] = []
    for (let i = 0; i < entries.length; i++) {
      if (!entries[i].title) errors.push({ line: i + 1, field: "title", message: "Missing title" })
      if (!entries[i].content) errors.push({ line: i + 1, field: "content", message: "Missing content" })
    }
    return errors
  }

  async persist(entries: NormalizedEntry[]): Promise<ImportStats> {
    const stats: ImportStats = { total: entries.length, inserted: 0, updated: 0, skipped: 0, errors: 0, duration: 0 }
    for (const entry of entries) {
      try {
        const existing = await prisma.dictionaryEntry.findUnique({ where: { slug: entry.slug } })
        if (existing) {
          await prisma.dictionaryEntry.update({
            where: { slug: entry.slug },
            data: {
              title: entry.title,
              content: entry.content,
              summary: entry.summary,
              scriptureRefs: entry.scriptureRefs || [],
              keywords: entry.keywords || [],
              aliases: entry.aliases || [],
              category: entry.category || "term",
              metadata: entry.metadata || {},
            },
          })
          stats.updated++
        } else {
          await prisma.dictionaryEntry.create({
            data: {
              source: entry.source,
              title: entry.title,
              slug: entry.slug,
              content: entry.content,
              summary: entry.summary,
              scriptureRefs: entry.scriptureRefs || [],
              keywords: entry.keywords || [],
              aliases: entry.aliases || [],
              category: entry.category || "term",
              metadata: entry.metadata || {},
            },
          })
          stats.inserted++
        }
      } catch (e) {
        console.error(`[smith] Error persisting "${entry.title}":`, e)
        stats.errors++
      }
    }
    return stats
  }
}
```

- [ ] **Step 2: Register in import-runner.ts**

```typescript
import { EastonsImporter } from "./sources/eastons"
import { SmithsImporter } from "./sources/smiths"

const SOURCES: Record<string, new () => BaseImporter> = {
  easton: EastonsImporter,
  smith: SmithsImporter,
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 4: Commit**

```bash
git add scripts/import/sources/smiths.ts scripts/import/import-runner.ts
git commit -m "feat(knowledge): add Smith's Bible Dictionary importer"
git push
```

---

### Task 4: Create Nave's Topical Bible importer

**Files:**
- Create: `scripts/import/sources/naves.ts`
- Modify: `scripts/import/import-runner.ts`

- [ ] **Step 1: Create the Nave's importer**

Nave's data comes from the Gnosis dataset that is already downloaded and cached at `/tmp/gnosis/gnosis-lite.db`. The `topics` table in Gnosis contains the topical data. Alternatively, we can use the OpenChristianData topical_reference dataset.

Approach: Use the OpenChristianData JSONL dataset for cleaner structured data.

```typescript
// scripts/import/sources/naves.ts

import { prisma } from "@/lib/db"
import { BaseImporter, downloadJSONL, parseJSONL } from "../base-importer"
import type { NormalizedEntry, ImportStats, ValidationError } from "../types"
import { generateSlug } from "../validate-source"

const NAVES_URL = "https://huggingface.co/datasets/OpenChristianDataOrg/open-christian-data/resolve/main/data/topical_reference/naves/naves-topical-bible.jsonl"

type NaveRaw = {
  topic: string
  description?: string
  related_topics?: string[]
  sub_topics?: string[]
  scripture_refs?: string[]
}

export class NavesImporter extends BaseImporter {
  readonly source = "nave"
  readonly version = "1.0"

  async load(): Promise<NormalizedEntry[]> {
    const lines = await downloadJSONL(NAVES_URL)
    const raw = parseJSONL<NaveRaw>(lines)
    return raw.map((entry) => ({
      source: this.source,
      title: entry.topic,
      slug: generateSlug(entry.topic),
      content: entry.description || entry.topic,
      summary: entry.description?.slice(0, 200),
      category: "topic",
      scriptureRefs: entry.scripture_refs || [],
      keywords: [entry.topic.toLowerCase(), ...(entry.related_topics || []).map((r) => r.toLowerCase())],
      metadata: {
        relatedTopics: entry.related_topics || [],
        subTopics: entry.sub_topics || [],
      } as Record<string, unknown>,
    }))
  }

  validate(entries: NormalizedEntry[]): ValidationError[] {
    const errors: ValidationError[] = []
    for (let i = 0; i < entries.length; i++) {
      if (!entries[i].title) errors.push({ line: i + 1, field: "title", message: "Missing topic" })
    }
    return errors
  }

  async persist(entries: NormalizedEntry[]): Promise<ImportStats> {
    const stats: ImportStats = { total: entries.length, inserted: 0, updated: 0, skipped: 0, errors: 0, duration: 0 }
    for (const entry of entries) {
      try {
        const existing = await prisma.topicEntry.findUnique({ where: { slug: entry.slug } })
        if (existing) {
          await prisma.topicEntry.update({
            where: { slug: entry.slug },
            data: {
              topic: entry.title,
              description: entry.summary,
              scriptureRefs: entry.scriptureRefs || [],
              subTopics: (entry.metadata as any)?.subTopics || [],
              relatedTopics: (entry.metadata as any)?.relatedTopics || [],
              keywords: entry.keywords || [],
            },
          })
          stats.updated++
        } else {
          await prisma.topicEntry.create({
            data: {
              source: entry.source,
              topic: entry.title,
              slug: entry.slug,
              description: entry.summary,
              scriptureRefs: entry.scriptureRefs || [],
              subTopics: (entry.metadata as any)?.subTopics || [],
              relatedTopics: (entry.metadata as any)?.relatedTopics || [],
              keywords: entry.keywords || [],
            },
          })
          stats.inserted++
        }
      } catch (e) {
        console.error(`[nave] Error persisting "${entry.title}":`, e)
        stats.errors++
      }
    }
    return stats
  }
}
```

- [ ] **Step 2: Register in import-runner.ts**

```typescript
import { EastonsImporter } from "./sources/eastons"
import { SmithsImporter } from "./sources/smiths"
import { NavesImporter } from "./sources/naves"

const SOURCES: Record<string, new () => BaseImporter> = {
  easton: EastonsImporter,
  smith: SmithsImporter,
  nave: NavesImporter,
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 4: Commit**

```bash
git add scripts/import/sources/naves.ts scripts/import/import-runner.ts
git commit -m "feat(knowledge): add Nave's Topical Bible importer"
git push
```

---

### Task 5: Create Matthew Henry Commentary importer

**Files:**
- Create: `scripts/import/sources/matthew-henry.ts`
- Modify: `scripts/import/import-runner.ts`

- [ ] **Step 1: Create the Matthew Henry importer**

```typescript
// scripts/import/sources/matthew-henry.ts

import { prisma } from "@/lib/db"
import { BaseImporter, downloadJSONL, parseJSONL } from "../base-importer"
import type { NormalizedEntry, ImportStats, ValidationError } from "../types"
import { generateSlug } from "../validate-source"

const MH_URL = "https://huggingface.co/datasets/OpenChristianDataOrg/open-christian-data/resolve/main/data/commentary/matthew-henry/matthew-henry-complete.jsonl"

type MHRaw = {
  entry_id: string
  book: string
  chapter: number
  verse_range: string
  verse_range_osis: string
  commentary_text: string
  summary?: string
  word_count?: number
}

export class MatthewHenryImporter extends BaseImporter {
  readonly source = "matthew-henry"
  readonly version = "1.0"

  async load(): Promise<NormalizedEntry[]> {
    const lines = await downloadJSONL(MH_URL)
    const raw = parseJSONL<MHRaw>(lines)
    return raw.map((entry) => ({
      source: this.source,
      title: `${entry.book} ${entry.chapter}:${entry.verse_range}`,
      slug: generateSlug(`${entry.book}-${entry.chapter}-${entry.verse_range}`),
      content: entry.commentary_text,
      summary: entry.summary || entry.commentary_text.slice(0, 200),
      category: "commentary",
      scriptureRefs: [entry.verse_range_osis],
      keywords: [entry.book.toLowerCase(), entry.verse_range],
      verseId: undefined, // Will be resolved at persist time if possible
      metadata: {
        book: entry.book,
        chapter: entry.chapter,
        verseRange: entry.verse_range,
        wordCount: entry.word_count,
        entryId: entry.entry_id,
      } as Record<string, unknown>,
    }))
  }

  validate(entries: NormalizedEntry[]): ValidationError[] {
    const errors: ValidationError[] = []
    for (let i = 0; i < entries.length; i++) {
      if (!entries[i].content) errors.push({ line: i + 1, field: "content", message: "Missing commentary text" })
      if (!entries[i].title) errors.push({ line: i + 1, field: "title", message: "Missing title" })
    }
    return errors
  }

  async persist(entries: NormalizedEntry[]): Promise<ImportStats> {
    const stats: ImportStats = { total: entries.length, inserted: 0, updated: 0, skipped: 0, errors: 0, duration: 0 }
    for (const entry of entries) {
      try {
        const existing = await prisma.commentaryEntry.findUnique({ where: { slug: entry.slug } })
        if (existing) {
          await prisma.commentaryEntry.update({
            where: { slug: entry.slug },
            data: {
              title: entry.title,
              content: entry.content,
              summary: entry.summary,
              scriptureRefs: entry.scriptureRefs || [],
              keywords: entry.keywords || [],
              metadata: entry.metadata || {},
            },
          })
          stats.updated++
        } else {
          await prisma.commentaryEntry.create({
            data: {
              source: entry.source,
              title: entry.title,
              slug: entry.slug,
              content: entry.content,
              summary: entry.summary,
              scriptureRefs: entry.scriptureRefs || [],
              keywords: entry.keywords || [],
              metadata: entry.metadata || {},
            },
          })
          stats.inserted++
        }
      } catch (e) {
        console.error(`[matthew-henry] Error persisting "${entry.title}":`, e)
        stats.errors++
      }
    }
    return stats
  }
}
```

- [ ] **Step 2: Register in import-runner.ts**

```typescript
import { EastonsImporter } from "./sources/eastons"
import { SmithsImporter } from "./sources/smiths"
import { NavesImporter } from "./sources/naves"
import { MatthewHenryImporter } from "./sources/matthew-henry"

const SOURCES: Record<string, new () => BaseImporter> = {
  easton: EastonsImporter,
  smith: SmithsImporter,
  nave: NavesImporter,
  "matthew-henry": MatthewHenryImporter,
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 4: Commit**

```bash
git add scripts/import/sources/matthew-henry.ts scripts/import/import-runner.ts
git commit -m "feat(knowledge): add Matthew Henry Commentary importer"
git push
```

---

### Task 6: Add dataset download script

**Files:**
- Create: `scripts/import/sources/download-datasets.ts`

- [ ] **Step 1: Create download script**

```typescript
// scripts/import/sources/download-datasets.ts

const DATASETS = {
  easton: "https://huggingface.co/datasets/JWBickel/BibleDictionaries/resolve/main/Easton%27s%20Bible%20Dictionary.jsonl",
  smith: "https://huggingface.co/datasets/JWBickel/BibleDictionaries/resolve/main/Smith%27s%20Bible%20Dictionary.jsonl",
  naves: "https://huggingface.co/datasets/OpenChristianDataOrg/open-christian-data/resolve/main/data/topical_reference/naves/naves-topical-bible.jsonl",
  "matthew-henry": "https://huggingface.co/datasets/OpenChristianDataOrg/open-christian-data/resolve/main/data/commentary/matthew-henry/matthew-henry-complete.jsonl",
}

export async function downloadAllDatasets() {
  for (const [name, url] of Object.entries(DATASETS)) {
    console.log(`\nDownloading ${name}...`)
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`  Failed: ${response.status} ${response.statusText}`)
      continue
    }
    const text = await response.text()
    const lines = text.split("\n").filter(Boolean)
    console.log(`  Downloaded ${lines.length} lines (${(text.length / 1024 / 1024).toFixed(1)} MB)`)
  }
  console.log("\nAll datasets verified.")
}

if (require.main === module) {
  downloadAllDatasets().catch(console.error)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add scripts/import/sources/download-datasets.ts
git commit -m "feat(knowledge): add dataset download verification script"
git push
```

---

### Task 7: Run importers against Docker database and verify

**Files:**
- No new files — run importers in sequence

- [ ] **Step 1: Rebuild Docker image**

```bash
docker compose -f docker/docker-compose.dev.yml up -d --build 2>&1 | tail -3
```

- [ ] **Step 2: Import Easton's Bible Dictionary**

```bash
docker exec docker-app-1 npx tsx scripts/import/import-runner.ts --source=easton 2>&1 | tail -10
```
Expected: Reports inserted/updated counts for ~3,900 entries.

- [ ] **Step 3: Import Smith's Bible Dictionary**

```bash
docker exec docker-app-1 npx tsx scripts/import/import-runner.ts --source=smith 2>&1 | tail -10
```
Expected: Reports inserted/updated counts for ~4,500 entries.

- [ ] **Step 4: Import Nave's Topical Bible**

```bash
docker exec docker-app-1 npx tsx scripts/import/import-runner.ts --source=nave 2>&1 | tail -10
```
Expected: Reports inserted/updated counts for ~5,300 topics.

- [ ] **Step 5: Import Matthew Henry Commentary**

```bash
docker exec docker-app-1 npx tsx scripts/import/import-runner.ts --source=matthew-henry 2>&1 | tail -10
```
Expected: Reports inserted/updated counts for ~5,300 commentary entries.

- [ ] **Step 6: Verify data via API**

```bash
# Search for "Moses" across all entity types
curl -s "http://localhost:3000/api/knowledge/search?q=Moses" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Total: {d[\"totalResults\"]}'); [print(f'  {k}: {len(v)}') for k,v in d['results'].items()]"
```
Expected: Shows results from dictionaries, topics, and commentary alongside verse/person results.

- [ ] **Step 7: Lookup specific entity**

```bash
# Look up Easton's entry for "Abraham"
curl -s "http://localhost:3000/api/knowledge/entity/dictionary/abraham" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['title'], '-', d['data']['summary'][:100])"
```
Expected: Returns the Easton's dictionary entry for Abraham.

- [ ] **Step 8: Run existing tests**

```bash
docker exec docker-app-1 npx vitest run
```
Expected: `13 passed` (existing tests unchanged).

- [ ] **Step 9: Commit any final changes**

```bash
git add -A
git commit -m "chore(knowledge): rebuild Docker, run all importers, verify data"
git push
```
