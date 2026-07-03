# Knowledge Platform — Phase 3: Search Enhancement

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the search page to show results from dictionaries, commentaries, and topics alongside verses, with entity detail links and semantic search support.

**Architecture:** The existing search page calls `GET /api/search` (verses + notes only). We add a parallel call to `GET /api/knowledge/search` and display results grouped by entity type below the existing verse results. The old search API is untouched. Embedding source types extend to cover all knowledge entities.

**Tech Stack:** TypeScript, Next.js 16 App Router, Tailwind CSS v4, Prisma ORM, pgvector

---

## File Structure

### Files to Create

| File | Purpose |
|------|---------|
| `src/modules/knowledge/components/KnowledgeSearchResults.tsx` | Renders grouped results by entity type |
| `src/modules/knowledge/components/EntityBadge.tsx` | Type-colored badge for entity type |

### Files to Modify

| File | Change |
|------|--------|
| `src/app/(dashboard)/search/page.tsx` | Add call to `/api/knowledge/search`, render grouped results below existing |
| `src/modules/ai/embeddings/service.ts` | Extend `EmbeddingSourceType` to include dictionary, commentary, topic, bible_event, nation |

---

### Task 1: Create EntityBadge component

**Files:**
- Create: `src/modules/knowledge/components/EntityBadge.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client"

import type { KnowledgeEntityType } from "@/modules/knowledge/types/knowledge"

const BADGE_STYLES: Record<string, string> = {
  verse: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  dictionary: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  commentary: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  topic: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  bible_event: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  nation: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  person: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  place: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  timeline: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
}

const LABELS: Record<string, string> = {
  verse: "Verse",
  dictionary: "Dictionary",
  commentary: "Commentary",
  topic: "Topic",
  bible_event: "Event",
  nation: "Nation",
  person: "Person",
  place: "Place",
  timeline: "Timeline",
}

type Props = {
  type: KnowledgeEntityType
}

export default function EntityBadge({ type }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
        BADGE_STYLES[type] || "bg-muted text-muted-foreground"
      }`}
    >
      {LABELS[type] || type}
    </span>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/modules/knowledge/components/EntityBadge.tsx
git commit -m "feat(search): add EntityBadge component for knowledge entity types"
git push
```

---

### Task 2: Create KnowledgeSearchResults component

**Files:**
- Create: `src/modules/knowledge/components/KnowledgeSearchResults.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client"

import { useRouter } from "next/navigation"
import EntityBadge from "./EntityBadge"
import type { KnowledgeSearchResult } from "@/modules/knowledge/types/knowledge"

type Props = {
  results: Record<string, KnowledgeSearchResult[]>
}

const SECTION_ORDER = ["dictionary", "topic", "commentary", "bible_event", "nation", "person", "place", "verse", "timeline"]

const SECTION_LABELS: Record<string, string> = {
  dictionary: "Dictionary Entries",
  topic: "Topics",
  commentary: "Commentaries",
  bible_event: "Bible Events",
  nation: "Nations",
  person: "People",
  place: "Places",
  verse: "Verses",
  timeline: "Timeline",
}

export default function KnowledgeSearchResults({ results }: Props) {
  const router = useRouter()

  const sections = SECTION_ORDER
    .filter((type) => (results[type]?.length || 0) > 0)
    .map((type) => ({ type, items: results[type]!, label: SECTION_LABELS[type] || type }))

  if (sections.length === 0) return null

  return (
    <div className="mt-8 space-y-8">
      {sections.map(({ type, items, label }) => (
        <section key={type}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
            <span className="ml-2 text-xs font-normal opacity-60">({items.length})</span>
          </h3>
          <div className="space-y-2">
            {items.slice(0, 10).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (type === "verse") {
                    router.push(`/bible?search=${encodeURIComponent(item.reference || item.title)}`)
                  } else {
                    router.push(`/search?entity=${item.entityType}&slug=${item.slug}`)
                  }
                }}
                className="w-full rounded-xl bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/50"
              >
                <div className="mb-1 flex items-center gap-2">
                  <EntityBadge type={item.entityType} />
                  <span className="text-xs text-muted-foreground">
                    {item.source && `via ${item.source}`}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                {item.snippet && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {item.snippet}
                  </p>
                )}
              </button>
            ))}
            {items.length > 10 && (
              <p className="text-xs text-muted-foreground">
                +{items.length - 10} more results
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/modules/knowledge/components/KnowledgeSearchResults.tsx
git commit -m "feat(search): add KnowledgeSearchResults component for grouped knowledge results"
git push
```

---

### Task 3: Update search page

**Files:**
- Modify: `src/app/(dashboard)/search/page.tsx`

- [ ] **Step 1: Rewrite the search page**

Replace the entire file:

```typescript
"use client"

import { useState, useCallback } from "react"
import KnowledgeSearchResults from "@/modules/knowledge/components/KnowledgeSearchResults"
import EntityBadge from "@/modules/knowledge/components/EntityBadge"

type LegacySearchResult = {
  id: string
  type: "verse" | "note" | "highlight"
  text: string
  reference?: string
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [legacyResults, setLegacyResults] = useState<LegacySearchResult[]>([])
  const [knowledgeResults, setKnowledgeResults] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)

    const [legacyRes, knowledgeRes] = await Promise.all([
      fetch(`/api/search?q=${encodeURIComponent(query)}`).then((r) => r.json()).catch(() => []),
      fetch(`/api/knowledge/search?q=${encodeURIComponent(query)}`).then((r) => r.json()).catch(() => ({ results: {} })),
    ])

    setLegacyResults(legacyRes || [])
    setKnowledgeResults(knowledgeRes.results || {})
    setLoading(false)
  }, [query])

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Bible, dictionaries, commentaries, topics..."
            className="w-full rounded-xl border border-border bg-card px-12 py-4 text-lg text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
            autoFocus
          />
        </div>
      </form>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
          </svg>
          <span className="text-sm">Searching...</span>
        </div>
      )}

      {/* Knowledge results (dictionaries, commentaries, topics, etc.) */}
      <KnowledgeSearchResults results={knowledgeResults} />

      {/* Legacy results (verses + notes) */}
      {legacyResults.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Verses & Notes
            <span className="ml-2 text-xs font-normal opacity-60">({legacyResults.length})</span>
          </h3>
          {legacyResults.map((r, i) => (
            <div key={`${r.type}-${r.id}-${i}`} className="rounded-xl bg-card p-6 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                  r.type === "verse" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                  r.type === "note" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {r.type === "verse" ? "Verse" : r.type === "note" ? "Note" : "Highlight"}
                </span>
                {r.reference && <span className="text-xs text-muted-foreground">{r.reference}</span>}
              </div>
              <p className="text-sm leading-relaxed text-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && legacyResults.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">No results found.</p>
        </div>
      )}
    </div>
  )
}
```

Note: The empty check `legacyResults.length === 0` preserves the "No results found" message while still showing knowledge results if they exist (knowledge results may appear even when legacy results are empty).

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/search/page.tsx
git commit -m "feat(search): enhance search page with knowledge entity results from dictionaries, commentaries, topics"
git push
```

---

### Task 4: Extend embedding source types

**Files:**
- Modify: `src/modules/ai/embeddings/service.ts`

- [ ] **Step 1: Extend EmbeddingSourceType**

```typescript
export type EmbeddingSourceType = "verse" | "note" | "highlight" | "dictionary" | "commentary" | "topic" | "bible_event" | "nation" | "person" | "place" | "timeline"
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/modules/ai/embeddings/service.ts
git commit -m "feat(search): extend EmbeddingSourceType to cover all knowledge entity types"
git push
```

---

### Task 5: Rebuild Docker and verify

- [ ] **Step 1: Build and run**

```bash
docker compose -f docker/docker-compose.dev.yml up -d --build 2>&1 | tail -3
```

- [ ] **Step 2: Verify search page loads**

```bash
curl -s http://localhost:3000/search | grep -o "KnowledgeSearchResults\|EntityBadge\|Dictionaries\|Commentaries\|Topics" | head -5
```
Expected: Shows that the new components are referenced in the page.

- [ ] **Step 3: Verify knowledge search API returns results**

```bash
curl -s "http://localhost:3000/api/knowledge/search?q=Moses" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Query: {d[\"query\"]}')
print(f'Total: {d[\"totalResults\"]}')
for k, v in sorted(d['results'].items()):
    print(f'  {k}: {len(v)}')
"
```
Expected: Shows results across all entity types with data.

- [ ] **Step 4: Run existing tests**

```bash
docker exec docker-app-1 npx vitest run
```
Expected: `13 passed`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: rebuild Docker with enhanced search, verify all tests pass"
git push
```
