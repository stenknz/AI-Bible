import { prisma } from "@/lib/db"
import { BOOKS_66, GOSPELS } from "@/modules/bible/constants/books"

type TSVLine = {
  bookName: string
  chapter: number
  verse: number
  text: string
}

export function parseTSVLine(line: string): TSVLine | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^(.+?)\s(\d+):(\d+)\t(.+)$/)
  if (!match) return null

  return {
    bookName: match[1].trim(),
    chapter: parseInt(match[2], 10),
    verse: parseInt(match[3], 10),
    text: match[4].trim(),
  }
}

export function isRedLetterVerse(bookName: string, text: string): boolean {
  if (!GOSPELS.has(bookName)) return false
  return text.startsWith('"') || text.startsWith("And he said") || text.startsWith("Jesus said") || text.startsWith("He said")
}

export async function importBibleTSV(
  content: string,
  translationCode: string,
  translationName: string
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const lines = content.split("\n").filter((l) => l.trim())
  let imported = 0
  let skipped = 0
  const errors: string[] = []

  const translation = await prisma.translation.upsert({
    where: { code: translationCode },
    update: { name: translationName },
    create: { code: translationCode, name: translationName },
  })

  const verseData: { bookName: string; chapterNum: number; verseNum: number; text: string }[] = []

  for (const line of lines) {
    const parsed = parseTSVLine(line)
    if (!parsed) {
      skipped++
      continue
    }
    verseData.push({
      bookName: parsed.bookName,
      chapterNum: parsed.chapter,
      verseNum: parsed.verse,
      text: parsed.text,
    })
  }

  const books = new Map<string, typeof verseData>()
  for (const v of verseData) {
    const existing = books.get(v.bookName) || []
    existing.push(v)
    books.set(v.bookName, existing)
  }

  for (const [bookName, verses] of books) {
    const bookIndex = BOOKS_66.indexOf(bookName as typeof BOOKS_66[number])
    if (bookIndex === -1) {
      errors.push(`Unknown book: ${bookName}`)
      continue
    }

    const book = await prisma.book.upsert({
      where: { translationId_number: { translationId: translation.id, number: bookIndex + 1 } },
      update: { name: bookName, testament: bookIndex < 39 ? "OLD" : "NEW" },
      create: {
        translationId: translation.id,
        number: bookIndex + 1,
        name: bookName,
        testament: bookIndex < 39 ? "OLD" : "NEW",
      },
    })

    const chapters = new Map<number, typeof verses>()
    for (const v of verses) {
      const existing = chapters.get(v.chapterNum) || []
      existing.push(v)
      chapters.set(v.chapterNum, existing)
    }

    for (const [chapterNum, chapterVerses] of chapters) {
      const chapter = await prisma.chapter.upsert({
        where: { bookId_number: { bookId: book.id, number: chapterNum } },
        update: {},
        create: { bookId: book.id, number: chapterNum },
      })

      for (const v of chapterVerses) {
        const isRed = isRedLetterVerse(bookName, v.text)
        await prisma.verse.upsert({
          where: { chapterId_number: { chapterId: chapter.id, number: v.verseNum } },
          update: { text: v.text, isRedLetter: isRed },
          create: {
            chapterId: chapter.id,
            number: v.verseNum,
            text: v.text,
            isRedLetter: isRed,
          },
        })
        imported++
      }
    }
  }

  return { imported, skipped, errors }
}
