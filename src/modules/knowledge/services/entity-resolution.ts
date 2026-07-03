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

  const record = await config.model.findUnique({ where: { [config.slugField]: slug } })
  if (!record) return null

  return {
    id: record.id,
    type,
    title: record[config.titleField] || "",
    slug: record[config.slugField] || slug,
    data: record as Record<string, unknown>,
  }
}
