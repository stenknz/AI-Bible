import { prisma } from "@/lib/db"
import { BaseImporter, downloadJSONL, parseJSONL } from "../base-importer"
import type { NormalizedEntry, ImportStats, ValidationError } from "../types"
import { generateSlug } from "../validate-source"

const EASTONS_URL = "https://huggingface.co/datasets/JWBickel/BibleDictionaries/resolve/main/Easton%27s%20Bible%20Dictionary.jsonl"

type EastonRaw = {
  term: string
  definitions: string[]
}

export class EastonsImporter extends BaseImporter {
  readonly source = "easton"
  readonly version = "1.0"

  async load(): Promise<NormalizedEntry[]> {
    const lines = await downloadJSONL(EASTONS_URL)
    const raw = parseJSONL<EastonRaw>(lines)
    return raw.filter((e): e is EastonRaw => !!e.term).map((entry) => ({
      source: this.source,
      title: entry.term,
      slug: generateSlug(entry.term),
      content: entry.definitions.join("\n\n"),
      summary: entry.definitions.join("\n\n").slice(0, 200),
      aliases: [],
      category: "term",
      scriptureRefs: [],
      keywords: [entry.term.toLowerCase()],
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
        console.error(`[easton] Error persisting "${entry.title}":`, e)
        stats.errors++
      }
    }
    return stats
  }
}
