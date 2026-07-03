import { prisma } from "@/lib/db"
import { BaseImporter, downloadJSONL, parseJSONL } from "../base-importer"
import type { NormalizedEntry, ImportStats, ValidationError } from "../types"
import { generateSlug } from "../validate-source"

const NAVES_URL = "https://huggingface.co/datasets/OpenChristianDataOrg/open-christian-data/resolve/main/data/topical_reference.jsonl"

type NaveReference = {
  raw: string
  osis: string[]
}

type NaveSubTopic = {
  label: string
  references: NaveReference[]
}

type NaveRaw = {
  _source_id: string
  topic: string
  alt_topics: string[]
  subtopics: NaveSubTopic[]
  related_topics: string[]
}

export class NavesImporter extends BaseImporter {
  readonly source = "nave"
  readonly version = "1.0"

  async load(): Promise<NormalizedEntry[]> {
    const lines = await downloadJSONL(NAVES_URL)
    const raw = parseJSONL<NaveRaw>(lines)
    return raw
      .filter((e) => e._source_id === "naves-topical-bible")
      .filter((e): e is NaveRaw => !!e.topic)
      .map((entry) => {
        const contentParts = entry.subtopics.map(
          (st) => `${st.label}: ${st.references.map((r) => r.raw).join(", ")}`
        )
        const content = contentParts.join("\n")
        const scriptureRefs = entry.subtopics.flatMap((st) =>
          st.references.flatMap((r) => r.osis.filter(Boolean))
        )
        return {
          source: this.source,
          title: entry.topic,
          slug: generateSlug(entry.topic),
          content,
          summary: content.slice(0, 200),
          category: "topic",
          scriptureRefs,
          keywords: [entry.topic.toLowerCase(), ...entry.related_topics.map((r: string) => r.toLowerCase())],
          metadata: {
            relatedTopics: entry.related_topics || [],
            subTopics: entry.subtopics.map((st) => st.label),
            altTopics: entry.alt_topics || [],
          } as Record<string, unknown>,
        }
      })
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
