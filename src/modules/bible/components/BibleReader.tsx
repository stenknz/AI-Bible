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
  const { chapter, loading } = useBible(bookNumber, chapterNumber, translation)

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>
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
        {chapter.verses.map((verse) => (
          <VerseDisplay key={verse.id} verse={verse} />
        ))}
      </div>
    </div>
  )
}
