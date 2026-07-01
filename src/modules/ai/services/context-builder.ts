import { prisma } from "@/lib/db"
import { retrieveRAGContext } from "@/modules/ai/services/rag-pipeline"

export type AIContextRequest = {
  verseIds?: string[]
  chapterId?: string
  noteIds?: string[]
  query: string
  includeChapterContext?: boolean
  includeCrossReferences?: boolean
  includeUserNotes?: boolean
}

export type AssembledContext = {
  scripture: string
  notes: string
  crossReferences: string
  metadata: {
    translation: string
    book: string
    chapter: number
    verses: number[]
  }
}

export async function buildContext(request: AIContextRequest): Promise<AssembledContext> {
  let scripture = ""
  let notes = ""
  let crossReferences = ""
  let metadata = { translation: "", book: "", chapter: 0, verses: [] as number[] }

  if (request.verseIds && request.verseIds.length > 0) {
    const verses = await prisma.verse.findMany({
      where: { id: { in: request.verseIds } },
      include: {
        chapter: {
          include: { book: { include: { translation: true } } },
        },
      },
      orderBy: { number: "asc" },
    })

    if (verses.length > 0) {
      const first = verses[0]
      metadata = {
        translation: first.chapter.book.translation.code,
        book: first.chapter.book.name,
        chapter: first.chapter.number,
        verses: verses.map((v) => v.number),
      }
      scripture = verses
        .map((v) => `${v.number} ${v.text}`)
        .join("\n")
    }
  }

  if (request.includeUserNotes && request.verseIds) {
    const userNotes = await prisma.note.findMany({
      where: { verseId: { in: request.verseIds } },
      take: 5,
    })
    if (userNotes.length > 0) {
      const noteTexts = userNotes.map((n) => {
        const title = n.title ? `**${n.title}**\n` : ""
        const content =
          typeof n.content === "object" && n.content !== null
            ? JSON.stringify(n.content)
            : String(n.content)
        return `${title}${content.slice(0, 500)}`
      })
      notes = `Your notes:\n${noteTexts.join("\n---\n")}`
    }
  }

  return {
    scripture,
    notes,
    crossReferences,
    metadata,
  }
}
