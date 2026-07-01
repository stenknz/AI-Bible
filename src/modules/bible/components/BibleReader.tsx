"use client"

import { useBible } from "@/modules/bible/hooks/useBible"
import { VerseDisplay } from "./VerseDisplay"
import { ChapterNavigation } from "./ChapterNavigation"

type Props = {
  bookNumber: number
  chapterNumber: number
  bookName: string
  totalChapters: number
  translation?: string
}

export function BibleReader({ bookNumber, chapterNumber, bookName, totalChapters, translation = "KJV" }: Props) {
  const { chapter, loading, error, refetch } = useBible(bookNumber, chapterNumber, translation)

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{error}</p>
        <button onClick={refetch} className="mt-4 rounded-lg border px-3 py-1 text-sm hover:bg-muted">
          Try again
        </button>
      </div>
    )
  }

  if (!chapter) {
    return <div className="p-8 text-center text-muted-foreground">Chapter not found</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ChapterNavigation
        bookNumber={bookNumber}
        chapterNumber={chapterNumber}
        totalChapters={totalChapters}
        bookName={bookName}
      />
      <div className="space-y-1">
        {chapter.verses?.map((verse) => (
          <VerseDisplay key={verse.id} verse={verse} />
        ))}
      </div>
    </div>
  )
}
