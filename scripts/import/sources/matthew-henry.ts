import { prisma } from "@/lib/db"
import { BaseImporter, downloadJSONL, parseJSONL } from "../base-importer"
import type { NormalizedEntry, ImportStats, ValidationError } from "../types"
import { generateSlug } from "../validate-source"

const MH_URL = "https://huggingface.co/datasets/OpenChristianDataOrg/open-christian-data/resolve/main/data/commentary/matthew-henry/matthew-henry-complete.jsonl"

type MHRaw = {
  entry_id: string
  book: string
  chapter: number
  verse_range: string
  verse_range_osis: string
  commentary_text: string
  summary?: string
  word_count?: number
}

export class MatthewHenryImporter extends BaseImporter {
  readonly source = "matthew-henry"
  readonly version = "1.0"

  async load(): Promise<NormalizedEntry[]> {
    const lines = await downloadJSONL(MH_URL)
    const raw = parseJSONL<MHRaw>(lines)
    return raw.map((entry) => ({
      source: this.source,
      title: `${entry.book} ${entry.chapter}:${entry.verse_range}`,
      slug: generateSlug(`${entry.book}-${entry.chapter}-${entry.verse_range}`),
      content: entry.commentary_text,
      summary: entry.summary || entry.commentary_text.slice(0, 200),
      category: "commentary",
      scriptureRefs: [entry.verse_range_osis],
      keywords: [entry.book.toLowerCase(), entry.verse_range],
      metadata: {
        book: entry.book,
        chapter: entry.chapter,
        verseRange: entry.verse_range,
        wordCount: entry.word_count,
        entryId: entry.entry_id,
      } as Record<string, unknown>,
    }))
  }

  validate(entries: NormalizedEntry[]): ValidationError[] {
    const errors: ValidationError[] = []
    for (let i = 0; i < entries.length; i++) {
      if (!entries[i].content) errors.push({ line: i + 1, field: "content", message: "Missing commentary text" })
      if (!entries[i].title) errors.push({ line: i + 1, field: "title", message: "Missing title" })
    }
    return errors
  }

  async persist(entries: NormalizedEntry[]): Promise<ImportStats> {
    const stats: ImportStats = { total: entries.length, inserted: 0, updated: 0, skipped: 0, errors: 0, duration: 0 }
    for (const entry of entries) {
      try {
        const existing = await prisma.commentaryEntry.findUnique({ where: { slug: entry.slug } })
        if (existing) {
          await prisma.commentaryEntry.update({
            where: { slug: entry.slug },
            data: {
              title: entry.title,
              content: entry.content,
              summary: entry.summary,
              scriptureRefs: entry.scriptureRefs || [],
              keywords: entry.keywords || [],
              metadata: (entry.metadata || {}) as any,
            },
          })
          stats.updated++
        } else {
          await prisma.commentaryEntry.create({
            data: {
              source: entry.source,
              title: entry.title,
              slug: entry.slug,
              content: entry.content,
              summary: entry.summary,
              scriptureRefs: entry.scriptureRefs || [],
              keywords: entry.keywords || [],
              metadata: (entry.metadata || {}) as any,
            },
          })
          stats.inserted++
        }
      } catch (e) {
        console.error(`[matthew-henry] Error persisting "${entry.title}":`, e)
        stats.errors++
      }
    }
    return stats
  }
}
