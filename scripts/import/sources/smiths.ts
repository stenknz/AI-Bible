import { prisma } from "@/lib/db"
import { BaseImporter, downloadJSONL, parseJSONL } from "../base-importer"
import type { NormalizedEntry, ImportStats, ValidationError } from "../types"
import { generateSlug } from "../validate-source"

const SMITHS_URL = "https://huggingface.co/datasets/JWBickel/BibleDictionaries/resolve/main/Smith%27s%20Bible%20Dictionary.jsonl"

type SmithRaw = {
  word: string
  definition: string
  scripture_refs?: string[]
}

export class SmithsImporter extends BaseImporter {
  readonly source = "smith"
  readonly version = "1.0"

  async load(): Promise<NormalizedEntry[]> {
    const lines = await downloadJSONL(SMITHS_URL)
    const raw = parseJSONL<SmithRaw>(lines)
    return raw.map((entry) => ({
      source: this.source,
      title: entry.word,
      slug: generateSlug(entry.word),
      content: entry.definition,
      summary: entry.definition.slice(0, 200),
      aliases: [],
      category: "term",
      scriptureRefs: entry.scripture_refs || [],
      keywords: [entry.word.toLowerCase()],
    }))
  }

  validate(entries: NormalizedEntry[]): ValidationError[] {
    const errors: ValidationError[] = []
    for (let i = 0; i < entries.length; i++) {
      if (!entries[i].title) errors.push({ line: i + 1, field: "title", message: "Missing title" })
      if (!entries[i].content) errors.push({ line: i + 1, field: "content", message: "Missing content" })
    }
    return errors
  }

  async persist(entries: NormalizedEntry[]): Promise<ImportStats> {
    const stats: ImportStats = { total: entries.length, inserted: 0, updated: 0, skipped: 0, errors: 0, duration: 0 }
    for (const entry of entries) {
      try {
        const existing = await prisma.dictionaryEntry.findUnique({ where: { slug: entry.slug } })
        if (existing) {
          await prisma.dictionaryEntry.update({
            where: { slug: entry.slug },
            data: {
              title: entry.title,
              content: entry.content,
              summary: entry.summary,
              scriptureRefs: entry.scriptureRefs || [],
              keywords: entry.keywords || [],
              aliases: entry.aliases || [],
              category: entry.category || "term",
              metadata: (entry.metadata || {}) as any,
            },
          })
          stats.updated++
        } else {
          await prisma.dictionaryEntry.create({
            data: {
              source: entry.source,
              title: entry.title,
              slug: entry.slug,
              content: entry.content,
              summary: entry.summary,
              scriptureRefs: entry.scriptureRefs || [],
              keywords: entry.keywords || [],
              aliases: entry.aliases || [],
              category: entry.category || "term",
              metadata: (entry.metadata || {}) as any,
            },
          })
          stats.inserted++
        }
      } catch (e) {
        console.error(`[smith] Error persisting "${entry.title}":`, e)
        stats.errors++
      }
    }
    return stats
  }
}
