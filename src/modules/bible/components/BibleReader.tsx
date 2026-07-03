"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useReadingProgress } from "@/modules/bible/hooks/useReadingProgress"
import ChapterSelector from "./ChapterSelector"
import BottomNav from "./BottomNav"
import VerseDisplay from "./VerseDisplay"
import type { ChapterData } from "@/modules/bible/types/bible"

type Props = {
  bookNumber: number
  chapterNumber: number
  bookName: string
  totalChapters: number
  initialChapter?: ChapterData | null
  initialHighlightColors?: Record<string, string>
  initialBookmarkedIds?: string[]
  books?: { id: string; number: number; name: string; testament: string }[]
}

export default function BibleReader({
  bookNumber,
  chapterNumber,
  bookName,
  totalChapters,
  initialChapter,
  initialHighlightColors = {},
  initialBookmarkedIds = [],
  books,
}: Props) {
  const router = useRouter()
  const { markVisited } = useReadingProgress()
  const [showChapterGrid, setShowChapterGrid] = useState(false)

  // Local state for immediate UI updates
  const [highlightColors, setHighlightColors] = useState<Record<string, string>>(initialHighlightColors)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set(initialBookmarkedIds))

  useEffect(() => {
    markVisited(bookNumber, chapterNumber)
  }, [bookNumber, chapterNumber, markVisited])

  function navigate(book: number, chapter: number) {
    router.push(`/bible/${book}/${chapter}`)
  }

  const handleHighlight = useCallback(async (verseId: string, color: string) => {
    setHighlightColors((prev) => ({ ...prev, [verseId]: color }))
    try {
      await fetch("/api/highlights", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verseId, color }),
      })
    } catch {}
  }, [])

  const handleRemoveHighlight = useCallback(async (verseId: string) => {
    setHighlightColors((prev) => {
      const next = { ...prev }
      delete next[verseId]
      return next
    })
    try {
      await fetch(`/api/highlights/${verseId}`, { method: "DELETE" })
    } catch {}
  }, [])

  const handleBookmark = useCallback(async (verseId: string) => {
    setBookmarkedIds((prev) => new Set(prev).add(verseId))
    try {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verseId }),
      })
    } catch {}
  }, [])

  const handleRemoveBookmark = useCallback(async (verseId: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev)
      next.delete(verseId)
      return next
    })
    try {
      await fetch(`/api/bookmarks/${verseId}`, { method: "DELETE" })
    } catch {}
  }, [])

  function handleAddNote(verseId: string) {
    router.push(`/notes/new?verseId=${verseId}`)
  }

  return (
    <div className="mx-auto max-w-4xl px-4">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-4 bg-card rounded-xl shadow-sm mb-6">
        {books && (
          <select
            value={bookNumber}
            onChange={(e) => navigate(parseInt(e.target.value), 1)}
            className="w-52 rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground transition-all cursor-pointer focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
          >
            <optgroup label="Old Testament">
              {books.filter((b) => b.testament === "OT").map((b) => (
                <option key={b.number} value={b.number}>{b.name}</option>
              ))}
            </optgroup>
            <optgroup label="New Testament">
              {books.filter((b) => b.testament === "NT").map((b) => (
                <option key={b.number} value={b.number}>{b.name}</option>
              ))}
            </optgroup>
          </select>
        )}
        <div className="relative">
          <button
            onClick={() => setShowChapterGrid(!showChapterGrid)}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground font-medium hover:bg-muted transition-colors"
          >
            Ch. {chapterNumber}
          </button>
          {showChapterGrid && (
            <div className="absolute right-0 top-full z-10 mt-2 w-[320px] max-w-[90vw] rounded-xl border border-border bg-card p-4 shadow-xl animate-fade-in">
              <ChapterSelector
                totalChapters={totalChapters}
                currentChapter={chapterNumber}
                onSelect={(ch) => { setShowChapterGrid(false); navigate(bookNumber, ch) }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Verses */}
      <VerseDisplay
        verses={initialChapter?.verses || []}
        highlightedVerses={new Map(Object.entries(highlightColors))}
        bookmarkedVerses={bookmarkedIds}
        onHighlight={handleHighlight}
        onRemoveHighlight={handleRemoveHighlight}
        onBookmark={handleBookmark}
        onRemoveBookmark={handleRemoveBookmark}
        onAddNote={handleAddNote}
      />

      {/* Bottom navigation */}
      <BottomNav
        bookNumber={bookNumber}
        chapterNumber={chapterNumber}
        totalChapters={totalChapters}
        bookName={bookName}
        onNavigate={navigate}
      />
    </div>
  )
}
