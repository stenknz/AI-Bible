import { getChapterCounts } from "@/modules/bible/services/bible-service"
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

  return (
    <BibleReader
      bookNumber={bookNumber}
      chapterNumber={chapterNumber}
      bookName={bookName}
      totalChapters={totalChapters}
    />
  )
}
