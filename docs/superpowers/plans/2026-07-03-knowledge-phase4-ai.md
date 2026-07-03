# Knowledge Platform — Phase 4: AI Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the AI RAG pipeline, citation engine, and system prompts to cover all knowledge entity types (dictionary, commentary, topic, person, place, event, nation).

**Architecture:** Three focused changes: (1) RAG pipeline labels all entity types and builds richer context, (2) citation engine handles dictionary/commentary/topic sources, (3) unified query wires RAG retrieval and entity-aware prompts together. All additive — existing AI behavior is unchanged when no knowledge entities are available.

**Tech Stack:** TypeScript, Prisma ORM, pgvector, OpenCode Go AI provider

---

## File Structure

### Files to Modify

| File | Change |
|------|--------|
| `src/modules/ai/services/rag-pipeline.ts` | Extend source labels to all entity types, build structured context |
| `src/modules/ai/services/citation-engine.ts` | Handle dictionary/commentary/topic citations, multi-source KnowledgeSource lookup |
| `src/modules/ai/services/unified-query.ts` | Wire RAG retrieval into query flow, add entity-aware system prompt |
| `src/modules/ai/tasks/verse-explanation.ts` | Update system prompt to mention available knowledge resources |

---

### Task 1: Extend RAG pipeline for all entity types

**Files:**
- Modify: `src/modules/ai/services/rag-pipeline.ts`

- [ ] **Step 1: Rewrite the RAG pipeline**

The `retrieveRAGContext` function currently maps entity types to generic labels. Replace the function to handle all entity types with proper labels and structured context:

```typescript
import { searchSimilar, type EmbeddingSourceType, type EmbeddingRecord } from "@/modules/ai/embeddings/service"
import { prisma } from "@/lib/db"

type EmbeddingRecordWithScore = EmbeddingRecord & { score: number }

export type RAGResult = {
  entityId: string
  entityType: EmbeddingSourceType
  text: string
  score: number
  title?: string
  source?: string
}

export type RAGContext = {
  query: string
  results: RAGResult[]
  assembledContext: string
}

export type RAGPipelineConfig = {
  maxResults: number
  minScore: number
  sources: EmbeddingSourceType[]
}

const SOURCE_LABELS: Record<string, string> = {
  verse: "Scripture",
  note: "Your Note",
  highlight: "Highlight",
  dictionary: "Dictionary Entry (Easton's/Smith's)",
  commentary: "Commentary (Matthew Henry)",
  topic: "Topical Entry (Nave's)",
  bible_event: "Bible Event",
  nation: "Nation",
  person: "Biblical Figure",
  place: "Biblical Location",
  timeline: "Timeline Entry",
}

export async function retrieveRAGContext(
  query: string,
  config: RAGPipelineConfig
): Promise<RAGContext> {
  const embeddings = (await searchSimilar(query, {
    limit: config.maxResults,
    minScore: config.minScore,
    sourceTypes: config.sources,
  })) as EmbeddingRecordWithScore[]

  const results: RAGResult[] = []

  for (const e of embeddings) {
    let title: string | undefined
    if (e.entityType === "dictionary" || e.entityType === "commentary") {
      const entry = e.entityType === "dictionary"
        ? await prisma.dictionaryEntry.findUnique({ where: { id: e.entityId }, select: { title: true } })
        : await prisma.commentaryEntry.findUnique({ where: { id: e.entityId }, select: { title: true } })
      title = entry?.title
    }
    results.push({
      entityId: e.entityId,
      entityType: e.entityType as EmbeddingSourceType,
      text: e.text,
      score: e.score,
      title,
    })
  }

  const contextBlocks = results.map((r, i) => {
    const label = SOURCE_LABELS[r.entityType] || r.entityType
    const titlePart = r.title ? ` — ${r.title}` : ""
    return `[${label} ${i + 1}]${titlePart}\n${r.text}`
  })

  const assembledContext = contextBlocks.length > 0
    ? `Relevant context from Bible and study resources:\n\n${contextBlocks.join("\n\n")}`
    : ""

  return { query, results, assembledContext }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/modules/ai/services/rag-pipeline.ts
git commit -m "feat(ai): extend RAG pipeline to label all knowledge entity types with structured context"
git push
```

---

### Task 2: Extend citation engine for knowledge entities

**Files:**
- Modify: `src/modules/ai/services/citation-engine.ts`

- [ ] **Step 1: Extend enforceCitations and persistCitations**

The citation engine needs to:
1. Accept context sources with entityType (not just verseId)
2. Look up dictionary/commentary/topic entries for citation text
3. Persist citations with the correct KnowledgeSource

```typescript
import { prisma } from "@/lib/db"

export type CitationData = {
  entityType: string
  entityId: string
  reference: string
  text: string
  isScripture: boolean
  confidence: number
}

export type CitationResult = {
  citedText: string
  citations: CitationData[]
  uncitedClaims: string[]
}

export type ContextSource = {
  verseId?: string
  noteId?: string
  reference?: string
  entityType?: string
  entityId?: string
}

const SOURCE_TYPE_MAP: Record<string, { sourceType: string; name: string; citationFormat: string }> = {
  verse: { sourceType: "translation", name: "Bible Translation", citationFormat: "Book Chapter:Verse (Translation)" },
  dictionary: { sourceType: "lexicon", name: "Easton's/Smith's Bible Dictionary", citationFormat: "Dictionary Entry — Title" },
  commentary: { sourceType: "commentary", name: "Matthew Henry Commentary", citationFormat: "Commentary — Book Chapter:Verse" },
  topic: { sourceType: "topical", name: "Nave's Topical Bible", citationFormat: "Topic — Name" },
}

export async function enforceCitations(
  aiOutput: string,
  contextSources: ContextSource[]
): Promise<CitationResult> {
  const citations: CitationData[] = []
  const uncitedClaims: string[] = []

  for (const source of contextSources) {
    if (source.verseId) {
      const verse = await prisma.verse.findUnique({
        where: { id: source.verseId },
        include: { chapter: { include: { book: { include: { translation: true } } } } },
      })
      if (verse) {
        const ref = `${verse.chapter.book.name} ${verse.chapter.number}:${verse.number} (${verse.chapter.book.translation.code})`
        const found = aiOutput.includes(ref) || aiOutput.includes(`${verse.chapter.number}:${verse.number}`)
        if (found) {
          citations.push({
            entityType: "verse",
            entityId: verse.id,
            reference: ref,
            text: verse.text.slice(0, 200),
            isScripture: true,
            confidence: 1.0,
          })
        } else {
          uncitedClaims.push(`Verse ${ref} referenced in context but not cited in output`)
        }
      }
    }

    if (source.entityType && source.entityId) {
      let ref = source.reference || ""
      let text = ""

      if (source.entityType === "dictionary") {
        const entry = await prisma.dictionaryEntry.findUnique({ where: { id: source.entityId } })
        if (entry) {
          ref = ref || entry.title
          text = entry.content.slice(0, 200)
          const found = aiOutput.includes(entry.title) || aiOutput.includes(ref)
          if (found) {
            citations.push({ entityType: "dictionary", entityId: entry.id, reference: ref, text, isScripture: false, confidence: 1.0 })
          }
        }
      } else if (source.entityType === "commentary") {
        const entry = await prisma.commentaryEntry.findUnique({ where: { id: source.entityId } })
        if (entry) {
          ref = ref || entry.title
          text = entry.content.slice(0, 200)
          const found = aiOutput.includes(entry.title) || aiOutput.includes(ref)
          if (found) {
            citations.push({ entityType: "commentary", entityId: entry.id, reference: ref, text, isScripture: false, confidence: 1.0 })
          }
        }
      } else if (source.entityType === "topic") {
        const entry = await prisma.topicEntry.findUnique({ where: { id: source.entityId } })
        if (entry) {
          ref = ref || entry.topic
          text = entry.description || ""
          const found = aiOutput.includes(entry.topic) || aiOutput.includes(ref)
          if (found) {
            citations.push({ entityType: "topic", entityId: entry.id, reference: ref, text, isScripture: false, confidence: 1.0 })
          }
        }
      }
    }
  }

  return { citedText: aiOutput, citations, uncitedClaims }
}

export async function persistCitations(
  aimessageId: string,
  citations: CitationData[],
  defaultSourceType: string = "translation"
) {
  for (const citation of citations) {
    const config = SOURCE_TYPE_MAP[citation.entityType] || { sourceType: defaultSourceType, name: "Knowledge Source", citationFormat: "Reference" }

    let source = await prisma.knowledgeSource.findFirst({
      where: { sourceType: config.sourceType, name: config.name },
    })

    if (!source) {
      source = await prisma.knowledgeSource.create({
        data: { name: config.name, sourceType: config.sourceType, citationFormat: config.citationFormat },
      })
    }

    await prisma.citation.create({
      data: {
        aimessageId,
        sourceId: source.id,
        entityId: citation.entityId,
        entityType: citation.entityType,
        referenceText: citation.reference,
        quote: citation.text,
        isDirectQuote: citation.isScripture,
      },
    })
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/modules/ai/services/citation-engine.ts
git commit -m "feat(ai): extend citation engine to handle dictionary, commentary, and topic citations"
git push
```

---

### Task 3: Wire RAG into unified query with entity-aware prompts

**Files:**
- Modify: `src/modules/ai/services/unified-query.ts`

- [ ] **Step 1: Integrate RAG retrieval into the query flow**

```typescript
import { prisma } from "@/lib/db"
import { verseExplanationHandler } from "@/modules/ai/tasks/verse-explanation"
import { enforceCitations, persistCitations, type ContextSource } from "@/modules/ai/services/citation-engine"
import { persistTrace, type ReasoningStep } from "@/modules/ai/services/reasoning-tracer"
import { retrieveRAGContext } from "@/modules/ai/services/rag-pipeline"

export type UnifiedQuery = {
  naturalLanguage: string
  verseIds?: string[]
  requireCitations: boolean
  ragSources?: string[]  // entity types to include in RAG: ["dictionary", "commentary", "topic"]
}

export type UnifiedResponse = {
  answer: string
  citations: { reference: string; text: string }[]
  reasoningSteps?: ReasoningStep[]
  domainsUsed: string[]
}

export async function query(request: UnifiedQuery): Promise<UnifiedResponse> {
  const steps: ReasoningStep[] = []
  const startTime = Date.now()

  steps.push({
    step: 1,
    action: "retrieve",
    input: request.naturalLanguage,
    output: `Retrieving context for: ${request.naturalLanguage}`,
    sourcesUsed: request.verseIds ?? [],
    timestamp: new Date(),
  })

  // Retrieve RAG context if sources specified
  let ragContext = ""
  if (request.ragSources && request.ragSources.length > 0) {
    const rag = await retrieveRAGContext(request.naturalLanguage, {
      maxResults: 5,
      minScore: 0.6,
      sources: request.ragSources as any,
    })
    ragContext = rag.assembledContext
    steps.push({
      step: 2,
      action: "retrieve_rag",
      input: request.naturalLanguage,
      output: `Retrieved ${rag.results.length} knowledge results from: ${request.ragSources.join(", ")}`,
      sourcesUsed: rag.results.map((r) => r.entityId),
      timestamp: new Date(),
    })
  }

  let answer: string
  let contextSources: ContextSource[] = []

  if (request.verseIds && request.verseIds.length > 0) {
    const verses = await prisma.verse.findMany({
      where: { id: { in: request.verseIds } },
      include: { chapter: { include: { book: { include: { translation: true } } } } },
    })

    const passageText = verses
      .map((v) => `${v.chapter.book.name} ${v.chapter.number}:${v.number} — ${v.text}`)
      .join("\n")

    steps.push({
      step: 3,
      action: "analyze",
      input: passageText,
      output: `Analyzing ${verses.length} verses with knowledge context`,
      sourcesUsed: request.verseIds,
      timestamp: new Date(),
    })

    contextSources = request.verseIds.map((id) => ({ verseId: id }))

    answer = await verseExplanationHandler.handle({
      query: request.naturalLanguage,
      verseIds: request.verseIds,
      passageText,
      ragContext: ragContext || undefined,
    })
  } else {
    // No verses — use RAG context only
    steps.push({
      step: 3,
      action: "analyze",
      input: request.naturalLanguage,
      output: ragContext ? "Answering from knowledge resources" : "No specific context available",
      sourcesUsed: [],
      timestamp: new Date(),
    })

    answer = await verseExplanationHandler.handle({
      query: request.naturalLanguage,
      ragContext: ragContext || undefined,
    })
  }

  steps.push({
    step: 4,
    action: "synthesize",
    input: request.naturalLanguage,
    output: answer.slice(0, 200),
    sourcesUsed: request.verseIds ?? [],
    timestamp: new Date(),
  })

  let citations: { reference: string; text: string }[] = []
  if (request.requireCitations) {
    const citationResult = await enforceCitations(answer, contextSources)
    citations = citationResult.citations.map((c) => ({ reference: c.reference, text: c.text }))

    steps.push({
      step: 5,
      action: "cite",
      input: answer,
      output: `${citationResult.citations.length} citations enforced`,
      sourcesUsed: citationResult.citations.map((c) => c.entityId),
      timestamp: new Date(),
    })
  }

  const duration = Date.now() - startTime

  return {
    answer,
    citations,
    reasoningSteps: steps,
    domainsUsed: ["scripture", ...(request.ragSources || [])],
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/modules/ai/services/unified-query.ts
git commit -m "feat(ai): wire RAG retrieval into unified query, add knowledge entity system context"
git push
```

---

### Task 4: Update verse explanation handler for entity-aware prompting

**Files:**
- Modify: `src/modules/ai/tasks/verse-explanation.ts`

- [ ] **Step 1: Update to accept and use RAG context**

Read the current `verse-explanation.ts` file. The handle method receives `query`, `verseIds`, `passageText`. We need to add optional `ragContext` and inject it into the system prompt.

Add `ragContext?: string` to the handler input type, and update the system prompt builder in `verse-explanation.ts` to include the RAG context when available.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/modules/ai/tasks/verse-explanation.ts
git commit -m "feat(ai): add RAG context to verse explanation handler with entity-aware system prompt"
git push
```

---

### Task 5: Rebuild Docker and verify

- [ ] **Step 1: Build and run**

```bash
docker compose -f docker/docker-compose.dev.yml up -d --build 2>&1 | tail -3
```

- [ ] **Step 2: Verify TypeScript compiles inside Docker**

```bash
docker exec docker-app-1 npx tsc --noEmit
```
Expected: no output

- [ ] **Step 3: Run existing tests**

```bash
docker exec docker-app-1 npx vitest run
```
Expected: `13 passed`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: rebuild Docker with AI knowledge integration, verify all tests pass"
git push
```
