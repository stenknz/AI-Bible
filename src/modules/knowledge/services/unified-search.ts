import { prisma } from "@/lib/db"
import type { KnowledgeEntityType, KnowledgeSearchResult } from "../types/knowledge"

export async function unifiedSearch(
  query: string,
  types?: KnowledgeEntityType[]
): Promise<KnowledgeSearchResult[]> {
  const q = query.toLowerCase()
  const results: KnowledgeSearchResult[] = []

  const searchable: { type: KnowledgeEntityType; model: any; strFields: string[]; arrFields: string[]; titleField: string; textField: string }[] = [
    { type: "verse", model: prisma.verse, strFields: ["text"], arrFields: [], titleField: "id", textField: "text" },
    { type: "dictionary", model: prisma.dictionaryEntry, strFields: ["title", "content"], arrFields: ["aliases"], titleField: "title", textField: "content" },
    { type: "commentary", model: prisma.commentaryEntry, strFields: ["title", "content"], arrFields: [], titleField: "title", textField: "content" },
    { type: "topic", model: prisma.topicEntry, strFields: ["topic", "description"], arrFields: [], titleField: "topic", textField: "description" },
    { type: "bible_event", model: prisma.bibleEvent, strFields: ["name", "description"], arrFields: [], titleField: "name", textField: "description" },
    { type: "nation", model: prisma.nation, strFields: ["name", "description"], arrFields: ["alternateNames"], titleField: "name", textField: "description" },
    { type: "person", model: prisma.person, strFields: ["name", "description"], arrFields: ["alternateNames"], titleField: "name", textField: "description" },
    { type: "place", model: prisma.place, strFields: ["name", "description"], arrFields: [], titleField: "name", textField: "description" },
  ]

  const filtered = types ? searchable.filter((s) => types.includes(s.type)) : searchable

  for (const entity of filtered) {
    const orConditions: any[] = [
      ...entity.strFields.map((field) => ({
        [field]: { contains: q, mode: "insensitive" as const },
      })),
      ...entity.arrFields.map((field) => ({
        [field]: { has: q },
      })),
    ]

    const records = await entity.model.findMany({
      where: { OR: orConditions },
      take: 20,
    })

    for (const record of records) {
      results.push({
        id: record.id,
        entityType: entity.type,
        title: record[entity.titleField] || "",
        slug: record.slug || record.id,
        snippet: (record[entity.textField] || "").slice(0, 150),
        score: 1.0,
      })
    }
  }

  return results.sort((a, b) => b.score - a.score)
}
