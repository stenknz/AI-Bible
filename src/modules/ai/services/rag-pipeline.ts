import { searchSimilar, type EmbeddingSourceType, type EmbeddingRecord } from "@/modules/ai/embeddings/service"

type EmbeddingRecordWithScore = EmbeddingRecord & { score: number }

export type RAGResult = {
  entityId: string
  entityType: EmbeddingSourceType
  text: string
  score: number
  verseReference?: string
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

export async function retrieveRAGContext(
  query: string,
  config: RAGPipelineConfig
): Promise<RAGContext> {
  const embeddings = (await searchSimilar(query, {
    limit: config.maxResults,
    minScore: config.minScore,
    sourceTypes: config.sources,
  })) as EmbeddingRecordWithScore[]

  const results: RAGResult[] = embeddings.map((e) => ({
    entityId: e.entityId,
    entityType: e.entityType as EmbeddingSourceType,
    text: e.text,
    score: e.score,
  }))

  const contextBlocks = results.map((r, i) => {
    const source = r.entityType === "verse" ? "Scripture" : r.entityType === "note" ? "Your Note" : "Highlight"
    return `[${source} ${i + 1}] ${r.text}`
  })

  const assembledContext = contextBlocks.length > 0
    ? `Relevant context from Bible and your notes:\n\n${contextBlocks.join("\n\n")}`
    : ""

  return { query, results, assembledContext }
}
