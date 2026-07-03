import { prisma } from "@/lib/db"
import { verseExplanationHandler } from "@/modules/ai/tasks/verse-explanation"
import { enforceCitations, persistCitations, type ContextSource } from "@/modules/ai/services/citation-engine"
import { persistTrace, type ReasoningStep } from "@/modules/ai/services/reasoning-tracer"
import { retrieveRAGContext } from "@/modules/ai/services/rag-pipeline"

export type UnifiedQuery = {
  naturalLanguage: string
  verseIds?: string[]
  requireCitations: boolean
  ragSources?: string[]
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
