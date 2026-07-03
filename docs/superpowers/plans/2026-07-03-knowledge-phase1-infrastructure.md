# Knowledge Platform — Phase 1: Infrastructure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add 6 new Prisma models, create base importer framework, and build knowledge API routes. Zero changes to existing features.

**Architecture:** All work is additive — new models are standalone tables, new files are in new directories, new API routes are under `/api/knowledge/`. Existing database, APIs, and pages are untouched.

**Tech Stack:** Prisma ORM, PostgreSQL + pgvector, TypeScript, Next.js 16 App Router

---

## File Structure

### Files to Create

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | **MODIFY** — add 6 new models (DictionaryEntry, CommentaryEntry, TopicEntry, BibleEvent, Nation, Media) + Person field additions |
| `scripts/import/base-importer.ts` | Abstract base class for all importers — validation, normalization, dedup, merge, logging |
| `scripts/import/import-runner.ts` | CLI orchestrator: `npx tsx scripts/import/import-runner.ts --source=easton` |
| `scripts/import/validate-source.ts` | Format validators for JSON, CSV, TSV, XML, TXT, YAML |
| `scripts/import/types.ts` | Shared types: ImportOptions, ImportStats, NormalizedEntry |
| `src/modules/knowledge/types/knowledge.ts` | TypeScript types for knowledge entities |
| `src/modules/knowledge/services/entity-resolution.ts` | Resolve entity by slug, type, or ID |
| `src/modules/knowledge/services/unified-search.ts` | Unified search across all entity types |
| `src/app/api/knowledge/search/route.ts` | `GET /api/knowledge/search?q=...` |
| `src/app/api/knowledge/entity/[type]/[slug]/route.ts` | `GET /api/knowledge/entity/dictionary/abraham` |
| `src/app/api/knowledge/related/[type]/[id]/route.ts` | `GET /api/knowledge/related/verse/GEN.1.1` |

---

### Task 1: Add new Prisma models

**Files:**
- Modify: `prisma/schema.prisma` — append 6 new models after line 571 (end of existing schema)

- [ ] **Step 1: Read the existing schema end**

Read `/Users/stenkroonenberg/AI-BIBLE/prisma/schema.prisma` to confirm the last line.

- [ ] **Step 2: Append DictionaryEntry model**

```prisma
// ─── Knowledge Platform — Dictionary ──────────────────────

model DictionaryEntry {
  id            String   @id @default(cuid())
  source        String
  title         String
  slug          String   @unique
  content       String
  summary       String?
  aliases       String[]
  category      String?
  scriptureRefs String[]
  keywords      String[]
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([source])
  @@index([slug])
  @@index([category])
}
```

- [ ] **Step 3: Append CommentaryEntry model**

```prisma
model CommentaryEntry {
  id            String   @id @default(cuid())
  source        String
  title         String
  slug          String   @unique
  verseId       String?
  verseStartId  String?
  verseEndId    String?
  content       String
  summary       String?
  language      String   @default("en")
  scriptureRefs String[]
  keywords      String[]
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([source])
  @@index([verseId])
  @@index([slug])
}
```

- [ ] **Step 4: Append TopicEntry model**

```prisma
model TopicEntry {
  id            String   @id @default(cuid())
  source        String   @default("nave")
  topic         String
  slug          String   @unique
  description   String?
  scriptureRefs String[]
  subTopics     String[]
  relatedTopics String[]
  keywords      String[]
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([topic])
  @@index([slug])
}
```

- [ ] **Step 5: Append BibleEvent model**

```prisma
model BibleEvent {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  description   String?
  category      String
  subCategory   String?
  scriptureRefs String[]
  persons       String[]
  places        String[]
  eventDate     String?
  keywords      String[]
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([slug])
  @@index([category])
}
```

- [ ] **Step 6: Append Nation model**

```prisma
model Nation {
  id             String   @id @default(cuid())
  name           String
  slug           String   @unique
  alternateNames String[]
  description    String?
  regionId       String?
  scriptureRefs  String[]
  kings          String[]
  capital        String?
  timePeriod     String?
  metadata       Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([slug])
}
```

- [ ] **Step 7: Append Media model**

```prisma
model Media {
  id         String   @id @default(cuid())
  entityType String
  entityId   String
  url        String
  type       String
  caption    String?
  credit     String?
  license    String?
  width      Int?
  height     Int?
  metadata   Json?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
}
```

- [ ] **Step 8: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output (clean compile)

- [ ] **Step 9: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(knowledge): add 6 new Prisma models — DictionaryEntry, CommentaryEntry, TopicEntry, BibleEvent, Nation, Media"
git push
```

---

### Task 2: Push schema to database

**Files:**
- No new files — just run Prisma commands

- [ ] **Step 1: Enable pgvector extension in Docker DB**

Run:
```bash
docker exec docker-db-1 psql -U biblehub -c "CREATE EXTENSION IF NOT EXISTS vector"
```

Expected: `CREATE EXTENSION`

- [ ] **Step 2: Push the new schema**

Run:
```bash
docker exec docker-app-1 npx prisma db push --accept-data-loss
```

Expected: `Your database is now in sync with your Prisma schema. Done in Xms`

- [ ] **Step 3: Verify new tables exist**

Run:
```bash
docker exec docker-db-1 psql -U biblehub -c "\dt" | grep -E "DictionaryEntry|CommentaryEntry|TopicEntry|BibleEvent|Nation|Media"
```

Expected: 6 table names printed

---

### Task 3: Create shared types

**Files:**
- Create: `scripts/import/types.ts`
- Create: `src/modules/knowledge/types/knowledge.ts`

- [ ] **Step 1: Create import types**

```typescript
// scripts/import/types.ts

export interface ImportOptions {
  source: string
  version: string
  incremental?: boolean
  batchSize?: number
  onProgress?: (stats: ImportStats) => void
}

export interface ImportStats {
  total: number
  inserted: number
  updated: number
  skipped: number
  errors: number
  duration: number
}

export interface NormalizedEntry {
  source: string
  title: string
  slug: string
  content: string
  summary?: string
  aliases?: string[]
  category?: string
  scriptureRefs?: string[]
  keywords?: string[]
  metadata?: Record<string, unknown>
  verseId?: string
  verseStartId?: string
  verseEndId?: string
}

export interface ValidationError {
  line?: number
  field: string
  message: string
}
```

- [ ] **Step 2: Create knowledge types**

```typescript
// src/modules/knowledge/types/knowledge.ts

export type KnowledgeEntityType =
  | "dictionary"
  | "commentary"
  | "topic"
  | "bible_event"
  | "nation"
  | "person"
  | "place"
  | "verse"
  | "timeline"

export interface KnowledgeSearchResult {
  id: string
  entityType: KnowledgeEntityType
  title: string
  slug: string
  snippet: string
  score: number
  source?: string
  category?: string
  reference?: string
}

export interface KnowledgeSearchResponse {
  query: string
  results: Record<string, KnowledgeSearchResult[]>
  totalResults: number
}

export interface EntityDetail<T = unknown> {
  id: string
  type: KnowledgeEntityType
  data: T
  related: EntityRelation[]
}

export interface EntityRelation {
  predicate: string
  subjectId: string
  subjectType: string
  objectId: string
  objectType: string
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 4: Commit**

```bash
git add scripts/import/types.ts src/modules/knowledge/types/knowledge.ts
git commit -m "feat(knowledge): add shared types for import framework and knowledge entities"
git push
```

---

### Task 4: Create base importer

**Files:**
- Create: `scripts/import/base-importer.ts`
- Create: `scripts/import/validate-source.ts`

- [ ] **Step 1: Create validate-source.ts**

```typescript
// scripts/import/validate-source.ts

import type { ValidationError } from "./types"

export function validateJSON(raw: unknown): ValidationError[] {
  const errors: ValidationError[] = []
  if (typeof raw !== "object" || raw === null) {
    errors.push({ field: "root", message: "Expected a JSON object or array" })
  }
  return errors
}

export function validateCSV(headers: string[], requiredColumns: string[]): ValidationError[] {
  const errors: ValidationError[] = []
  for (const col of requiredColumns) {
    if (!headers.includes(col)) {
      errors.push({ field: col, message: `Missing required column: ${col}` })
    }
  }
  return errors
}

export function validateXML(xml: string): ValidationError[] {
  const errors: ValidationError[] = []
  if (!xml.trim().startsWith("<")) {
    errors.push({ field: "root", message: "Expected XML content" })
  }
  return errors
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
```

- [ ] **Step 2: Create base-importer.ts**

```typescript
// scripts/import/base-importer.ts

import type { ImportOptions, ImportStats, NormalizedEntry } from "./types"

export abstract class BaseImporter {
  abstract readonly source: string
  abstract readonly version: string

  abstract load(input: string): Promise<NormalizedEntry[]>
  abstract validate(entries: NormalizedEntry[]): string[]
  abstract persist(entries: NormalizedEntry[]): Promise<ImportStats>

  async run(options: ImportOptions): Promise<ImportStats> {
    const startTime = Date.now()
    const stats: ImportStats = { total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0, duration: 0 }

    console.log(`[${this.source}] Loading...`)
    const entries = await this.load(options.source)

    stats.total = entries.length
    console.log(`[${this.source}] Loaded ${entries.length} entries`)

    options.onProgress?.(stats)

    const validationErrors = this.validate(entries)
    if (validationErrors.length > 0) {
      console.error(`[${this.source}] ${validationErrors.length} validation errors`)
      for (const err of validationErrors.slice(0, 10)) {
        console.error(`  ${err}`)
      }
      stats.errors = validationErrors.length
    }

    const persistStats = await this.persist(entries)
    stats.inserted = persistStats.inserted
    stats.updated = persistStats.updated
    stats.skipped = persistStats.skipped
    stats.errors += persistStats.errors

    stats.duration = Date.now() - startTime
    console.log(`[${this.source}] Done: ${stats.inserted} inserted, ${stats.updated} updated, ${stats.skipped} skipped, ${stats.errors} errors in ${stats.duration}ms`)

    return stats
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 4: Commit**

```bash
git add scripts/import/base-importer.ts scripts/import/validate-source.ts
git commit -m "feat(knowledge): add base importer framework with validation"
git push
```

---

### Task 5: Create import runner CLI

**Files:**
- Create: `scripts/import/import-runner.ts`

- [ ] **Step 1: Create import-runner.ts**

```typescript
// scripts/import/import-runner.ts

import { BaseImporter } from "./base-importer"

const SOURCES: Record<string, new () => BaseImporter> = {
  // Will be populated as importers are written
}

async function main() {
  const args = process.argv.slice(2)
  const sourceFlag = args.find((a) => a.startsWith("--source="))
  const sourceName = sourceFlag?.split("=")[1]

  if (!sourceName || !SOURCES[sourceName]) {
    console.log("Usage: npx tsx scripts/import/import-runner.ts --source=<name>")
    console.log("Available sources:", Object.keys(SOURCES).join(", "))
    process.exit(1)
  }

  const ImporterClass = SOURCES[sourceName]
  const importer = new ImporterClass()

  console.log(`Starting import: ${importer.source} v${importer.version}`)

  const stats = await importer.run({
    source: importer.source,
    version: importer.version,
    batchSize: 100,
  })

  console.log(`\nImport complete:`)
  console.log(`  Total:    ${stats.total}`)
  console.log(`  Inserted: ${stats.inserted}`)
  console.log(`  Updated:  ${stats.updated}`)
  console.log(`  Skipped:  ${stats.skipped}`)
  console.log(`  Errors:   ${stats.errors}`)
  console.log(`  Duration: ${(stats.duration / 1000).toFixed(1)}s`)
}

main().catch((e) => {
  console.error("Import failed:", e)
  process.exit(1)
})
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add scripts/import/import-runner.ts
git commit -m "feat(knowledge): add import runner CLI"
git push
```

---

### Task 6: Create knowledge service layer

**Files:**
- Create: `src/modules/knowledge/services/entity-resolution.ts`
- Create: `src/modules/knowledge/services/unified-search.ts`

- [ ] **Step 1: Create entity-resolution.ts**

```typescript
// src/modules/knowledge/services/entity-resolution.ts

import { prisma } from "@/lib/db"
import type { KnowledgeEntityType } from "../types/knowledge"

type EntityResult = {
  id: string
  type: string
  title: string
  slug: string
  data: Record<string, unknown>
}

export async function resolveEntity(type: KnowledgeEntityType, slug: string): Promise<EntityResult | null> {
  const lookup = async (model: any, slugField: string) => {
    return (model as any).findUnique({ where: { [slugField]: slug } })
  }

  const models: Record<string, { model: any; slugField: string; titleField: string }> = {
    dictionary: { model: prisma.dictionaryEntry, slugField: "slug", titleField: "title" },
    commentary: { model: prisma.commentaryEntry, slugField: "slug", titleField: "title" },
    topic: { model: prisma.topicEntry, slugField: "slug", titleField: "topic" },
    bible_event: { model: prisma.bibleEvent, slugField: "slug", titleField: "name" },
    nation: { model: prisma.nation, slugField: "slug", titleField: "name" },
    person: { model: prisma.person, slugField: "id", titleField: "name" },
    place: { model: prisma.place, slugField: "id", titleField: "name" },
  }

  const config = models[type]
  if (!config) return null

  const record = await lookup(config.model, config.slugField)
  if (!record) return null

  return {
    id: record.id,
    type,
    title: record[config.titleField] || "",
    slug: record[config.slugField] || slug,
    data: record as Record<string, unknown>,
  }
}
```

- [ ] **Step 2: Create unified-search.ts**

```typescript
// src/modules/knowledge/services/unified-search.ts

import { prisma } from "@/lib/db"
import type { KnowledgeEntityType, KnowledgeSearchResult } from "../types/knowledge"

export async function unifiedSearch(
  query: string,
  types?: KnowledgeEntityType[]
): Promise<KnowledgeSearchResult[]> {
  const q = query.toLowerCase()
  const results: KnowledgeSearchResult[] = []

  const searchable: { type: KnowledgeEntityType; model: any; searchFields: string[]; titleField: string }[] = [
    { type: "verse", model: prisma.verse, searchFields: ["text"], titleField: "id" },
    { type: "dictionary", model: prisma.dictionaryEntry, searchFields: ["title", "content", "aliases"], titleField: "title" },
    { type: "commentary", model: prisma.commentaryEntry, searchFields: ["title", "content"], titleField: "title" },
    { type: "topic", model: prisma.topicEntry, searchFields: ["topic", "description"], titleField: "topic" },
    { type: "bible_event", model: prisma.bibleEvent, searchFields: ["name", "description"], titleField: "name" },
    { type: "nation", model: prisma.nation, searchFields: ["name", "alternateNames", "description"], titleField: "name" },
    { type: "person", model: prisma.person, searchFields: ["name", "alternateNames", "description"], titleField: "name" },
    { type: "place", model: prisma.place, searchFields: ["name", "description"], titleField: "name" },
  ]

  const filtered = types ? searchable.filter((s) => types.includes(s.type)) : searchable

  for (const entity of filtered) {
    const orConditions = entity.searchFields.map((field) => ({
      [field]: { contains: q, mode: "insensitive" as const },
    }))

    const records = await (entity.model as any).findMany({
      where: { OR: orConditions },
      take: 20,
    })

    for (const record of records) {
      results.push({
        id: record.id,
        entityType: entity.type,
        title: record[entity.titleField] || "",
        slug: record.slug || record.id,
        snippet: (record.content || record.description || record.text || "").slice(0, 150),
        score: 1.0,
      })
    }
  }

  return results.sort((a, b) => b.score - a.score)
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 4: Commit**

```bash
git add src/modules/knowledge/services/unified-search.ts src/modules/knowledge/services/entity-resolution.ts
git commit -m "feat(knowledge): add knowledge service layer — entity resolution and unified search"
git push
```

---

### Task 7: Create knowledge API routes

**Files:**
- Create: `src/app/api/knowledge/search/route.ts`
- Create: `src/app/api/knowledge/entity/[type]/[slug]/route.ts`
- Create: `src/app/api/knowledge/related/[type]/[id]/route.ts`

- [ ] **Step 1: Create search API**

```typescript
// src/app/api/knowledge/search/route.ts

import { NextRequest, NextResponse } from "next/server"
import { unifiedSearch } from "@/modules/knowledge/services/unified-search"
import type { KnowledgeEntityType } from "@/modules/knowledge/types/knowledge"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")
  const typesParam = searchParams.get("includeTypes")

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
  }

  const types = typesParam
    ? (typesParam.split(",") as KnowledgeEntityType[])
    : undefined

  const results = await unifiedSearch(q, types)

  const grouped: Record<string, typeof results> = {}
  for (const r of results) {
    if (!grouped[r.entityType]) grouped[r.entityType] = []
    grouped[r.entityType].push(r)
  }

  return NextResponse.json({
    query: q,
    results: grouped,
    totalResults: results.length,
  })
}
```

- [ ] **Step 2: Create entity detail API**

```typescript
// src/app/api/knowledge/entity/[type]/[slug]/route.ts

import { NextResponse } from "next/server"
import { resolveEntity } from "@/modules/knowledge/services/entity-resolution"
import type { KnowledgeEntityType } from "@/modules/knowledge/types/knowledge"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; slug: string }> }
) {
  const { type, slug } = await params

  const entity = await resolveEntity(type as KnowledgeEntityType, slug)
  if (!entity) {
    return NextResponse.json({ error: "Entity not found" }, { status: 404 })
  }

  return NextResponse.json(entity)
}
```

- [ ] **Step 3: Create related entities API**

```typescript
// src/app/api/knowledge/related/[type]/[id]/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params

  const relations = await prisma.entityRelation.findMany({
    where: {
      OR: [
        { subjectId: id, subjectType: type },
        { objectId: id, objectType: type },
      ],
    },
    take: 50,
  })

  return NextResponse.json({ relations })
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 5: Commit**

```bash
git add src/app/api/knowledge/
git commit -m "feat(knowledge): add knowledge API routes — search, entity detail, related entities"
git push
```

---

### Task 8: Rebuild Docker and verify

**Files:**
- No new files — just rebuild and verify

- [ ] **Step 1: Build Docker image**

```bash
docker compose -f docker/docker-compose.dev.yml up -d --build 2>&1 | tail -5
```

- [ ] **Step 2: Push schema to fresh DB**

```bash
docker exec docker-db-1 psql -U biblehub -c "CREATE EXTENSION IF NOT EXISTS vector"
docker exec docker-app-1 npx prisma db push --accept-data-loss
```

- [ ] **Step 3: Reseed the database**

```bash
docker exec docker-app-1 npx tsx prisma/seed.ts 2>&1 | tail -15
```

Expected: `✅ All checks passed!`

- [ ] **Step 4: Verify new API works**

```bash
curl -s "http://localhost:3000/api/knowledge/search?q=Moses" | python3 -m json.tool
```

Expected: JSON response with results grouped by entity type (may be empty until importers run, but should return `{ query, results: {}, totalResults: 0 }`)

- [ ] **Step 5: Run existing tests to confirm nothing broke**

```bash
docker exec docker-app-1 npx vitest run
```

Expected: `13 passed`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(knowledge): rebuild Docker with new schema, verify all tests pass"
git push
```
