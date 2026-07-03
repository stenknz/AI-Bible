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
