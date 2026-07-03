import { prisma } from "@/lib/db"
import { BaseImporter, downloadJSONL, parseJSONL } from "../base-importer"
import type { NormalizedEntry, ImportStats, ValidationError } from "../types"
import { generateSlug } from "../validate-source"

const NAVES_URL = "https://huggingface.co/datasets/OpenChristianDataOrg/open-christian-data/resolve/main/data/topical_reference/naves/naves-topical-bible.jsonl"

type NaveRaw = {
  topic: string
  description?: string
  related_topics?: string[]
  sub_topics?: string[]
  scripture_refs?: string[]
}

export class NavesImporter extends BaseImporter {
  readonly source = "nave"
  readonly version = "1.0"

  async load(): Promise<NormalizedEntry[]> {
    const lines = await downloadJSONL(NAVES_URL)
    const raw = parseJSONL<NaveRaw>(lines)
    return raw.map((entry) => ({
      source: this.source,
      title: entry.topic,
      slug: generateSlug(entry.topic),
      content: entry.description || entry.topic,
      summary: entry.description?.slice(0, 200),
      category: "topic",
      scriptureRefs: entry.scripture_refs || [],
      keywords: [entry.topic.toLowerCase(), ...(entry.related_topics || []).map((r: string) => r.toLowerCase())],
      metadata: {
        relatedTopics: entry.related_topics || [],
        subTopics: entry.sub_topics || [],
      } as Record<string, unknown>,
    }))
  }

  validate(entries: NormalizedEntry[]): ValidationError[] {
    const errors: ValidationError[] = []
    for (let i = 0; i < entries.length; i++) {
      if (!entries[i].title) errors.push({ line: i + 1, field: "title", message: "Missing topic" })
    }
    return errors
  }

  async persist(entries: NormalizedEntry[]): Promise<ImportStats> {
    const stats: ImportStats = { total: entries.length, inserted: 0, updated: 0, skipped: 0, errors: 0, duration: 0 }
    for (const entry of entries) {
      try {
        const metadata = entry.metadata as Record<string, unknown> | undefined
        const existing = await prisma.topicEntry.findUnique({ where: { slug: entry.slug } })
        if (existing) {
          await prisma.topicEntry.update({
            where: { slug: entry.slug },
            data: {
              topic: entry.title,
              description: entry.summary,
              scriptureRefs: entry.scriptureRefs || [],
              subTopics: (metadata?.subTopics as string[]) || [],
              relatedTopics: (metadata?.relatedTopics as string[]) || [],
              keywords: entry.keywords || [],
            },
          })
          stats.updated++
        } else {
          await prisma.topicEntry.create({
            data: {
              source: entry.source,
              topic: entry.title,
              slug: entry.slug,
              description: entry.summary,
              scriptureRefs: entry.scriptureRefs || [],
              subTopics: (metadata?.subTopics as string[]) || [],
              relatedTopics: (metadata?.relatedTopics as string[]) || [],
              keywords: entry.keywords || [],
            },
          })
          stats.inserted++
        }
      } catch (e) {
        console.error(`[nave] Error persisting "${entry.title}":`, e)
        stats.errors++
      }
    }
    return stats
  }
}
