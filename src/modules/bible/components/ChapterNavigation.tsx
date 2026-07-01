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
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">{bookName} {chapterNumber}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => goTo(bookNumber, chapterNumber - 1)}
          disabled={chapterNumber <= 1}
          className="rounded-lg border px-3 py-1 text-sm disabled:opacity-30"
        >
          ← Prev
        </button>
        <span className="text-sm text-muted-foreground">
          {chapterNumber} / {totalChapters}
        </span>
        <button
          onClick={() => goTo(bookNumber, chapterNumber + 1)}
          disabled={chapterNumber >= totalChapters}
          className="rounded-lg border px-3 py-1 text-sm disabled:opacity-30"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
