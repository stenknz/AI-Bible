"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect } from "react"

type Props = {
  bookNumber: number
  chapterNumber: number
  totalChapters: number
  bookName: string
}

export function ChapterNavigation({ bookNumber, chapterNumber, totalChapters, bookName }: Props) {
  const router = useRouter()

  const goTo = useCallback((book: number, chapter: number) => {
    router.push(`/bible/${book}/${chapter}`)
  }, [router])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && chapterNumber > 1) {
        goTo(bookNumber, chapterNumber - 1)
      } else if (e.key === "ArrowRight" && chapterNumber < totalChapters) {
        goTo(bookNumber, chapterNumber + 1)
      } else if (e.key === "ArrowUp" && bookNumber > 1) {
        goTo(bookNumber - 1, 1)
      } else if (e.key === "ArrowDown" && bookNumber < 66) {
        goTo(bookNumber + 1, 1)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [bookNumber, chapterNumber, totalChapters, goTo])

  return (
    <div className="mb-8 flex items-center justify-between px-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{bookName} {chapterNumber}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => goTo(bookNumber, chapterNumber - 1)}
          disabled={chapterNumber <= 1}
          className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block mr-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          Prev
        </button>
        <span className="text-sm text-muted-foreground/60 font-medium">
          {chapterNumber} / {totalChapters}
        </span>
        <button
          onClick={() => goTo(bookNumber, chapterNumber + 1)}
          disabled={chapterNumber >= totalChapters}
          className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block ml-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  )
}
