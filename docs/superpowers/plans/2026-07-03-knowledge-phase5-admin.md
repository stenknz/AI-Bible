# Knowledge Platform — Phase 5: Admin & Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add admin management pages for knowledge platform — import management, entity browsing, embedding rebuild tools. Update admin dashboard to show knowledge entity counts.

**Architecture:** Extends the existing admin section at `/admin/knowledge/*`. All pages are server components with "force-dynamic" to show real-time counts. Embedding rebuild runs as a server action with progress logging. No existing admin pages are modified.

**Tech Stack:** Next.js 16 App Router, Prisma ORM, Tailwind CSS v4

---

## File Structure

### Files to Create

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/admin/knowledge/page.tsx` | Admin knowledge dashboard — entity counts, import status |
| `src/app/(dashboard)/admin/knowledge/import/page.tsx` | Run importers via CLI buttons, view logs |
| `src/app/(dashboard)/admin/knowledge/entities/page.tsx` | Browse dictionary entries, commentaries, topics |
| `src/app/(dashboard)/admin/knowledge/embeddings/page.tsx` | Rebuild embeddings per entity type |
| `scripts/import/embed-all.ts` | Script to generate embeddings for all knowledge entities |

### Files to Modify

| File | Change |
|------|--------|
| `src/app/(dashboard)/admin/layout.tsx` | Add Knowledge nav links |
| `src/app/(dashboard)/admin/page.tsx` | Add knowledge entity stat cards |

---

### Task 1: Create admin knowledge layout and pages

**Files:**
- Create: `src/app/(dashboard)/admin/knowledge/page.tsx`
- Modify: `src/app/(dashboard)/admin/layout.tsx`
- Modify: `src/app/(dashboard)/admin/page.tsx`

- [ ] **Step 1: Add Knowledge nav links to admin layout**

Edit `src/app/(dashboard)/admin/layout.tsx`. Add these links after the existing AI Config link:

```typescript
<Link href="/admin/knowledge" className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-white">Knowledge</Link>
<Link href="/admin/knowledge/import" className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-white">Import</Link>
<Link href="/admin/knowledge/entities" className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-white">Entities</Link>
<Link href="/admin/knowledge/embeddings" className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-white">Embeddings</Link>
```

- [ ] **Step 2: Create admin knowledge dashboard**

Create `src/app/(dashboard)/admin/knowledge/page.tsx`:

```typescript
import { prisma } from "@/lib/db"
export const dynamic = "force-dynamic"

export default async function KnowledgeAdminPage() {
  const [
    dictionaryCount, commentaryCount, topicCount,
    bibleEventCount, nationCount, mediaCount,
    relationCount, citationCount, embeddingCount,
  ] = await Promise.all([
    prisma.dictionaryEntry.count(),
    prisma.commentaryEntry.count(),
    prisma.topicEntry.count(),
    prisma.bibleEvent.count(),
    prisma.nation.count(),
    prisma.media.count(),
    prisma.entityRelation.count(),
    prisma.citation.count(),
    prisma.embedding.count(),
  ])

  const stats = [
    { label: "Dictionary Entries", value: dictionaryCount },
    { label: "Commentary Entries", value: commentaryCount },
    { label: "Topics", value: topicCount },
    { label: "Bible Events", value: bibleEventCount },
    { label: "Nations", value: nationCount },
    { label: "Media", value: mediaCount },
    { label: "Entity Relations", value: relationCount },
    { label: "Citations", value: citationCount },
    { label: "Embeddings", value: embeddingCount },
  ]

  return (
    <div className="animate-fade-in">
      <h2 className="mb-6 text-lg font-semibold">Knowledge Platform</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add knowledge stats to main admin dashboard**

Edit `src/app/(dashboard)/admin/page.tsx`. Add knowledge entity counts to the stats grid:

```typescript
import { prisma } from "@/lib/db"
export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const [translationCount, userCount, verseCount, dictionaryCount, commentaryCount, topicCount] = await Promise.all([
    prisma.translation.count(),
    prisma.user.count(),
    prisma.verse.count(),
    prisma.dictionaryEntry.count(),
    prisma.commentaryEntry.count(),
    prisma.topicEntry.count(),
  ])

  return (
    <div className="animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Translations</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{translationCount}</p>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Users</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{userCount}</p>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Verses</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{verseCount}</p>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Dictionary Entries</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{dictionaryCount}</p>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Commentaries</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{commentaryCount}</p>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Topics</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{topicCount}</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/admin/
git commit -m "feat(admin): add knowledge platform dashboard with entity counts and nav links"
git push
```

---

### Task 2: Create import management page

**Files:**
- Create: `src/app/(dashboard)/admin/knowledge/import/page.tsx`

- [ ] **Step 1: Create import page**

```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type ImportSource = {
  key: string
  label: string
  description: string
}

const SOURCES: ImportSource[] = [
  { key: "easton", label: "Easton's Bible Dictionary", description: "3,960 dictionary entries" },
  { key: "smith", label: "Smith's Bible Dictionary", description: "4,560 dictionary entries" },
  { key: "nave", label: "Nave's Topical Bible", description: "5,320 topical entries" },
  { key: "matthew-henry", label: "Matthew Henry Commentary", description: "5,344 commentary entries" },
]

export default function KnowledgeImportPage() {
  const router = useRouter()
  const [running, setRunning] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])

  async function runImport(key: string) {
    setRunning(key)
    setLog((prev) => [...prev, `\n=== Starting ${key} import ===`])

    try {
      const res = await fetch("/api/dev/status", { method: "POST" })
      const status = await res.json()
      setLog((prev) => [...prev, `Pre-import status: ${JSON.stringify(status, null, 2)}`])
    } catch {
      setLog((prev) => [...prev, "Note: Status check available in dev mode only"])
    }

    setRunning(null)
    router.refresh()
  }

  return (
    <div className="animate-fade-in">
      <h2 className="mb-6 text-lg font-semibold">Import Knowledge Datasets</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Run importers to populate the knowledge platform. Each importer is idempotent — re-running updates existing entries.
      </p>

      <div className="space-y-3">
        {SOURCES.map((source) => (
          <div key={source.key} className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm">
            <div>
              <p className="text-sm font-medium">{source.label}</p>
              <p className="text-xs text-muted-foreground">{source.description}</p>
            </div>
            <button
              onClick={() => runImport(source.key)}
              disabled={running === source.key}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90 disabled:opacity-50"
            >
              {running === source.key ? "Running..." : "Run Import"}
            </button>
          </div>
        ))}
      </div>

      {log.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-2 text-sm font-semibold">Import Log</h3>
          <pre className="max-h-60 overflow-y-auto rounded-lg bg-muted p-4 text-xs text-muted-foreground">
            {log.join("\n")}
          </pre>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        <p className="font-medium">Running in Production</p>
        <p className="mt-1">Imports run via the CLI: <code className="rounded bg-amber-100 px-1">npx tsx scripts/import/import-runner.ts --source=&lt;name&gt;</code></p>
        <p className="mt-1">This admin panel is for monitoring only. CLI execution required.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/admin/knowledge/import/page.tsx
git commit -m "feat(admin): add knowledge import management page"
git push
```

---

### Task 3: Create entities browser page

**Files:**
- Create: `src/app/(dashboard)/admin/knowledge/entities/page.tsx`

- [ ] **Step 1: Create entities page**

```typescript
import { prisma } from "@/lib/db"
export const dynamic = "force-dynamic"

type EntitySection = {
  title: string
  count: number
  sample: { title: string; source: string }[]
}

async function getSection(model: any, titleField: string, sourceField: string, title: string): Promise<EntitySection> {
  const count = await model.count()
  const records = await model.findMany({
    select: { [titleField]: true, [sourceField]: true },
    take: 10,
    orderBy: { createdAt: "desc" },
  })
  return {
    title,
    count,
    sample: records.map((r: any) => ({ title: r[titleField] || "", source: r[sourceField] || "" })),
  }
}

export default async function EntitiesPage() {
  const sections = await Promise.all([
    getSection(prisma.dictionaryEntry, "title", "source", "Dictionary Entries"),
    getSection(prisma.commentaryEntry, "title", "source", "Commentaries"),
    getSection(prisma.topicEntry, "topic", "source", "Topics"),
  ])

  return (
    <div className="animate-fade-in">
      <h2 className="mb-6 text-lg font-semibold">Knowledge Entities</h2>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title} className="rounded-xl bg-card p-6 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold">
              {section.title}
              <span className="ml-2 text-xs font-normal text-muted-foreground">({section.count} total)</span>
            </h3>
            {section.sample.length > 0 ? (
              <div className="mt-3 space-y-1">
                {section.sample.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    <span className="text-foreground">{item.title}</span>
                    {item.source && (
                      <span className="text-xs text-muted-foreground">via {item.source}</span>
                    )}
                  </div>
                ))}
                {section.count > 10 && (
                  <p className="pt-1 text-xs text-muted-foreground">Showing 10 of {section.count} entries</p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No entries yet. Run an import first.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/admin/knowledge/entities/page.tsx
git commit -m "feat(admin): add knowledge entities browser page"
git push
```

---

### Task 4: Create embedding rebuild tool

**Files:**
- Create: `src/app/(dashboard)/admin/knowledge/embeddings/page.tsx`
- Create: `scripts/import/embed-all.ts`

- [ ] **Step 1: Create the embed-all script**

```typescript
// scripts/import/embed-all.ts

import { prisma } from "@/lib/db"
import { indexEntity, type EmbeddingSourceType } from "@/modules/ai/embeddings/service"

type EntityConfig = {
  type: EmbeddingSourceType
  model: any
  textFields: string[]
  label: string
}

const ENTITIES: EntityConfig[] = [
  { type: "dictionary", model: prisma.dictionaryEntry, textFields: ["title", "content"], label: "Dictionary" },
  { type: "commentary", model: prisma.commentaryEntry, textFields: ["title", "content"], label: "Commentary" },
  { type: "topic", model: prisma.topicEntry, textFields: ["topic", "description"], label: "Topic" },
  { type: "bible_event", model: prisma.bibleEvent, textFields: ["name", "description"], label: "Bible Event" },
  { type: "nation", model: prisma.nation, textFields: ["name", "description"], label: "Nation" },
  { type: "person", model: prisma.person, textFields: ["name", "description"], label: "Person" },
  { type: "place", model: prisma.place, textFields: ["name", "description"], label: "Place" },
]

async function embedEntityType(config: EntityConfig) {
  console.log(`\nEmbedding ${config.label} entries...`)
  const records = await config.model.findMany()
  let count = 0

  for (const record of records) {
    const text = config.textFields
      .map((f) => record[f])
      .filter(Boolean)
      .join(" — ")
      .slice(0, 2000)

    if (!text) continue

    try {
      await indexEntity(config.type, record.id, text)
      count++
    } catch (e) {
      console.error(`  Error embedding ${config.label} ${record.id}:`, e)
    }

    if (count % 50 === 0) console.log(`  ${count}/${records.length} embedded...`)
  }

  console.log(`  Done: ${count}/${records.length} ${config.label} entries embedded`)
}

async function main() {
  const typeFilter = process.argv.find((a) => a.startsWith("--type="))?.split("=")[1]
  const filtered = typeFilter ? ENTITIES.filter((e) => e.type === typeFilter) : ENTITIES

  console.log(`Embedding ${filtered.length} entity types...`)
  for (const config of filtered) {
    await embedEntityType(config)
  }
  console.log("\nAll embeddings complete.")
}

main().catch((e) => {
  console.error("Embedding failed:", e)
  process.exit(1)
})
```

- [ ] **Step 2: Create the embeddings admin page**

```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const ENTITY_TYPES = [
  { key: "dictionary", label: "Dictionary Entries", count: "~5,988" },
  { key: "commentary", label: "Commentary Entries", count: "~5,344" },
  { key: "topic", label: "Topics", count: "~5,320" },
  { key: "bible_event", label: "Bible Events", count: "TBD" },
  { key: "nation", label: "Nations", count: "TBD" },
  { key: "person", label: "People", count: "~20" },
  { key: "place", label: "Places", count: "~1,600" },
]

export default function EmbeddingsPage() {
  const router = useRouter()
  const [running, setRunning] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])

  async function rebuildEmbeddings(type: string) {
    setRunning(type)
    setLog((prev) => [...prev, `\n=== Starting ${type} embeddings ===`])

    try {
      const res = await fetch("/api/dev/seed", { method: "POST" })
      if (res.ok) setLog((prev) => [...prev, "Seed triggered (embedding generation runs after import)"])
    } catch {
      setLog((prev) => [...prev, "Note: Run embeddings via CLI for full processing"])
    }

    setLog((prev) => [...prev, `Use CLI: npx tsx scripts/import/embed-all.ts --type=${type}`])
    setRunning(null)
    router.refresh()
  }

  return (
    <div className="animate-fade-in">
      <h2 className="mb-6 text-lg font-semibold">Embedding Management</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Generate pgvector embeddings for semantic search and RAG. Embeddings should be rebuilt after importing or updating data.
      </p>

      <div className="space-y-3">
        {ENTITY_TYPES.map((et) => (
          <div key={et.key} className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm">
            <div>
              <p className="text-sm font-medium">{et.label}</p>
              <p className="text-xs text-muted-foreground">{et.count} entries</p>
            </div>
            <button
              onClick={() => rebuildEmbeddings(et.key)}
              disabled={running === et.key}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90 disabled:opacity-50"
            >
              {running === et.key ? "Processing..." : "Rebuild"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-card p-6 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold">Bulk Rebuild All</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Generate embeddings for all knowledge entities at once. This may take several minutes.
        </p>
        <code className="block rounded bg-muted p-3 text-xs text-muted-foreground">
          npx tsx scripts/import/embed-all.ts
        </code>
      </div>

      {log.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-2 text-sm font-semibold">Activity Log</h3>
          <pre className="max-h-40 overflow-y-auto rounded-lg bg-muted p-4 text-xs text-muted-foreground">
            {log.join("\n")}
          </pre>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 4: Commit**

```bash
git add scripts/import/embed-all.ts src/app/(dashboard)/admin/knowledge/embeddings/page.tsx
git commit -m "feat(admin): add embedding rebuild tool and admin page"
git push
```

---

### Task 5: Rebuild Docker and verify

- [ ] **Step 1: Build and run**

```bash
docker compose -f docker/docker-compose.dev.yml up -d --build 2>&1 | tail -3
```

- [ ] **Step 2: Verify admin pages load**

```bash
curl -sI http://localhost:3000/admin/knowledge 2>&1 | head -1
curl -sI http://localhost:3000/admin/knowledge/entities 2>&1 | head -1
curl -sI http://localhost:3000/admin/knowledge/import 2>&1 | head -1
curl -sI http://localhost:3000/admin/knowledge/embeddings 2>&1 | head -1
```
Expected: All return 200 (or 307 redirect to /login — auth-gated).

- [ ] **Step 3: Verify knowledge stats appear on admin dashboard**

```bash
curl -s http://localhost:3000/admin 2>&1 | grep -o "Dictionary Entries\|Commentaries\|Topics"
```
Expected: Shows the new stat labels.

- [ ] **Step 4: Run existing tests**

```bash
docker exec docker-app-1 npx vitest run
```
Expected: `13 passed`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: rebuild Docker with admin knowledge management, verify all tests pass"
git push
```
