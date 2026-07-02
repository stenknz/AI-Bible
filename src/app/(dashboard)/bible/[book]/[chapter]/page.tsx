import { getChapterCounts } from "@/modules/bible/services/bible-service"
import { prisma } from "@/lib/db"
import { getSession } from "@/modules/auth/services/session"
export const dynamic = "force-dynamic"
import BibleReader from "@/modules/bible/components/BibleReader"

type Props = {
  params: Promise<{ book: string; chapter: string }>
}

export default async function BibleChapterPage({ params }: Props) {
  const { book, chapter } = await params
  const bookNumber = parseInt(book, 10)
  const chapterNumber = parseInt(chapter, 10)
  const chapterCounts = await getChapterCounts()
  const bookInfo = chapterCounts[bookNumber - 1]
  const bookName = bookInfo?.name || `Book ${bookNumber}`
  const totalChapters = bookInfo?.chapters || 150

  const chapterData = await prisma.chapter.findFirst({
    where: { book: { number: bookNumber }, number: chapterNumber },
    include: {
      verses: { orderBy: { number: "asc" } },
      book: true,
    },
  })

  const session = await getSession()

  let highlightedVerses: string[] = []
  let bookmarkedVerses: string[] = []
  let highlightedColors: Record<string, string> = {}

  if (session) {
    const [highlights, bookmarks] = await Promise.all([
      prisma.highlight.findMany({ where: { userId: session.userId } }),
      prisma.bookmark.findMany({ where: { userId: session.userId } }),
    ])
    highlightedVerses = highlights.map((h) => h.verseId)
    bookmarkedVerses = bookmarks.map((b) => b.verseId)
    highlights.forEach((h) => { highlightedColors[h.verseId] = h.color })
  }

  return (
    <BibleReader
      bookNumber={bookNumber}
      chapterNumber={chapterNumber}
      bookName={bookName}
      totalChapters={totalChapters}
      initialChapter={chapterData || undefined}
      books={chapterCounts.map((b, i) => ({ id: String(i + 1), number: i + 1, name: b.name, testament: i < 39 ? "OT" : "NT" }))}
      initialHighlightColors={highlightedColors}
      initialBookmarkedIds={bookmarkedVerses}
    />
  )
}
