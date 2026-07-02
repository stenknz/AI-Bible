"use client"

import { useEffect, useState } from "react"
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
  highlightedVerses?: string[]
  bookmarkedVerses?: string[]
  highlightedColors?: Record<string, string>
  books?: { id: string; number: number; name: string; testament: string }[]
}

export default function BibleReader({
  bookNumber,
  chapterNumber,
  bookName,
  totalChapters,
  initialChapter,
  highlightedVerses = [],
  bookmarkedVerses = [],
  highlightedColors = {},
  books,
}: Props) {
  const router = useRouter()
  const { markVisited } = useReadingProgress()
  const [showChapterGrid, setShowChapterGrid] = useState(false)

  const bookmarkSet = new Set(bookmarkedVerses)
  const highlightMap = new Map(Object.entries(highlightedColors))

  useEffect(() => {
    markVisited(bookNumber, chapterNumber)
  }, [bookNumber, chapterNumber, markVisited])

  function navigate(book: number, chapter: number) {
    router.push(`/bible/${book}/${chapter}`)
  }

  async function handleHighlight(verseId: string, color: string) {
    try {
      await fetch("/api/highlights", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verseId, color }),
      })
    } catch {}
  }

  async function handleRemoveHighlight(verseId: string) {
    try {
      await fetch(`/api/highlights/${verseId}`, { method: "DELETE" })
    } catch {}
  }

  async function handleBookmark(verseId: string) {
    try {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verseId }),
      })
    } catch {}
  }

  async function handleRemoveBookmark(verseId: string) {
    try {
      await fetch(`/api/bookmarks/${verseId}`, { method: "DELETE" })
    } catch {}
  }

  function handleAddNote(verseId: string) {
    router.push(`/notes/new?verseId=${verseId}`)
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3">
        {books && (
          <select
            value={bookNumber}
            onChange={(e) => navigate(parseInt(e.target.value), 1)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
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
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Ch. {chapterNumber}
          </button>
          {showChapterGrid && (
            <div className="absolute left-0 top-full z-10 mt-1 rounded-lg border bg-background p-2 shadow-lg">
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
        highlightedVerses={highlightMap}
        bookmarkedVerses={bookmarkSet}
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
