"use client"

type Props = {
  bookNumber: number
  chapterNumber: number
  totalChapters: number
  bookName: string
  onNavigate: (book: number, chapter: number) => void
}

export default function BottomNav({ bookNumber, chapterNumber, totalChapters, bookName, onNavigate }: Props) {
  const hasPrev = bookNumber > 1 || chapterNumber > 1
  const hasNext = bookNumber < 66 || chapterNumber < totalChapters

  function goPrev() {
    if (chapterNumber > 1) onNavigate(bookNumber, chapterNumber - 1)
    else if (bookNumber > 1) onNavigate(bookNumber - 1, 1)
  }

  function goNext() {
    if (chapterNumber < totalChapters) onNavigate(bookNumber, chapterNumber + 1)
    else if (bookNumber < 66) onNavigate(bookNumber + 1, 1)
  }

  return (
    <div className="sticky bottom-0 flex items-center justify-between border-t bg-background px-4 py-3">
      <button onClick={goPrev} disabled={!hasPrev} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-30">
        ← Previous
      </button>
      <span className="text-xs text-muted-foreground">
        {bookName} {chapterNumber} — Chapter {chapterNumber} of {totalChapters}
      </span>
      <button onClick={goNext} disabled={!hasNext} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-30">
        Next →
      </button>
    </div>
  )
}
