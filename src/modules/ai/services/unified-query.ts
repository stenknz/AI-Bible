import { prisma } from "@/lib/db"
import { verseExplanationHandler } from "@/modules/ai/tasks/verse-explanation"
import { enforceCitations, persistCitations } from "@/modules/ai/services/citation-engine"
import { persistTrace, type ReasoningStep } from "@/modules/ai/services/reasoning-tracer"

export type UnifiedQuery = {
  naturalLanguage: string
  verseIds?: string[]
  requireCitations: boolean
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

  let answer: string
  if (request.verseIds && request.verseIds.length > 0) {
    const verses = await prisma.verse.findMany({
      where: { id: { in: request.verseIds } },
      include: { chapter: { include: { book: { include: { translation: true } } } } },
    })

    const passageText = verses
      .map((v) => `${v.chapter.book.name} ${v.chapter.number}:${v.number} — ${v.text}`)
      .join("\n")

    steps.push({
      step: 2,
      action: "analyze",
      input: passageText,
      output: `Analyzing ${verses.length} verses`,
      sourcesUsed: request.verseIds,
      timestamp: new Date(),
    })

    answer = await verseExplanationHandler.handle({
      query: request.naturalLanguage,
      verseIds: request.verseIds,
      passageText,
    })
  } else {
    answer = await verseExplanationHandler.handle({
      query: request.naturalLanguage,
    })
  }

  steps.push({
    step: 3,
    action: "synthesize",
    input: request.naturalLanguage,
    output: answer.slice(0, 200),
    sourcesUsed: request.verseIds ?? [],
    timestamp: new Date(),
  })

  let citations: { reference: string; text: string }[] = []
  if (request.requireCitations && request.verseIds) {
    const citationResult = await enforceCitations(answer, request.verseIds.map((id) => ({ verseId: id })))
    citations = citationResult.citations.map((c) => ({ reference: c.reference, text: c.text }))

    steps.push({
      step: 4,
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
    domainsUsed: ["scripture"],
  }
}
