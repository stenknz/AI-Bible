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
    <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-card px-6 py-4 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <button onClick={goPrev} disabled={!hasPrev} className="rounded-xl border border-border px-4 py-2.5 text-sm text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block mr-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        Previous
      </button>
      <span className="text-xs text-muted-foreground/60 font-medium tracking-tight">
        {bookName} {chapterNumber} — Chapter {chapterNumber} of {totalChapters}
      </span>
      <button onClick={goNext} disabled={!hasNext} className="rounded-xl border border-border px-4 py-2.5 text-sm text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        Next
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block ml-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
  )
}
