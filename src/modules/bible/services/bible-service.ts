import { prisma } from "@/lib/db"
import type { ChapterData, BookData, TranslationData } from "@/modules/bible/types/bible"

export async function getTranslations(): Promise<TranslationData[]> {
  return prisma.translation.findMany({ orderBy: { code: "asc" } })
}

export async function getBooks(translationId: string): Promise<BookData[]> {
  return prisma.book.findMany({
    where: { translationId },
    orderBy: { number: "asc" },
    select: { id: true, number: true, name: true, testament: true },
  })
}

export async function getChapter(bookNumber: number, chapterNumber: number, translationCode: string = "KJV"): Promise<ChapterData | null> {
  const chapter = await prisma.chapter.findFirst({
    where: {
      book: { number: bookNumber, translation: { code: translationCode } },
      number: chapterNumber,
    },
    select: {
      id: true,
      number: true,
      verses: {
        orderBy: { number: "asc" },
        select: { id: true, number: true, text: true, isRedLetter: true },
      },
    },
  })
  return chapter
}

export async function getChapterById(chapterId: string): Promise<ChapterData | null> {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: {
      id: true,
      number: true,
      verses: {
        orderBy: { number: "asc" },
        select: { id: true, number: true, text: true, isRedLetter: true },
      },
    },
  })
  return chapter
}

export async function getChapterCounts() {
  const books = await prisma.book.findMany({
    select: {
      number: true,
      name: true,
      chapters: { select: { number: true } },
    },
    orderBy: { number: "asc" },
  })
  return books.map((b) => ({
    name: b.name,
    number: b.number,
    chapters: b.chapters.length,
  }))
}
