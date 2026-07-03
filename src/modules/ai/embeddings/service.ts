import { prisma } from "@/lib/db"
import { providerRegistry } from "@/modules/ai/services/provider"
import { getActiveProvider } from "@/modules/ai/services/router"

export type EmbeddingSourceType = "verse" | "note" | "highlight" | "dictionary" | "commentary" | "topic" | "bible_event" | "nation" | "person" | "place" | "timeline"

export type EmbeddingRecord = {
  id: string
  entityId: string
  entityType: EmbeddingSourceType
  vector: number[]
  text: string
  model: string
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const provider = providerRegistry.get(getActiveProvider())
  const results = await provider.embeddings([text])
  return results[0]
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const provider = providerRegistry.get(getActiveProvider())
  return provider.embeddings(texts)
}

export async function indexEntity(
  entityType: EmbeddingSourceType,
  entityId: string,
  text: string
): Promise<void> {
  const vector = await generateEmbedding(text)
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Embedding" ("entityType", "entityId", text, vector, model)
     VALUES ($1, $2, $3, $4::vector, $5)
     ON CONFLICT ("entityType", "entityId")
     DO UPDATE SET text = $3, vector = $4::vector, model = $5`,
    entityType,
    entityId,
    text,
    vector,
    "text-embedding-3-small"
  )
}

export async function searchSimilar(
  query: string,
  options: { limit?: number; minScore?: number; sourceTypes?: EmbeddingSourceType[] } = {}
): Promise<EmbeddingRecord[]> {
  const vector = await generateEmbedding(query)
  const limit = options.limit ?? 10

  if (!query.trim()) return []

  let sql = `
    SELECT id, "entityId", "entityType", text, model,
           1 - (vector <=> $1::vector) AS score
    FROM "Embedding"
    WHERE 1 - (vector <=> $1::vector) >= $2
  `

  const params: any[] = [vector, options.minScore ?? 0.7]

  if (options.sourceTypes && options.sourceTypes.length > 0) {
    const placeholders = options.sourceTypes.map((_, i) => `$${i + 3}`)
    sql += ` AND "entityType" IN (${placeholders.join(", ")})`
    params.push(...options.sourceTypes)
  }

  sql += ` ORDER BY score DESC LIMIT $${params.length + 1}`
  params.push(limit)

  const results = await prisma.$queryRawUnsafe<EmbeddingRecord[]>(sql, ...params)
  return results
}
