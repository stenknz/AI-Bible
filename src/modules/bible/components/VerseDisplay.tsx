"use client"

import { useState } from "react"
import VerseToolbar from "./VerseToolbar"
import CrossReferencePanel from "./CrossReferencePanel"
import type { VerseData } from "@/modules/bible/types/bible"

type Props = {
  verses: VerseData[]
  highlightedVerses: Map<string, string>
  bookmarkedVerses: Set<string>
  onHighlight: (verseId: string, color: string) => void
  onRemoveHighlight: (verseId: string) => void
  onBookmark: (verseId: string) => void
  onRemoveBookmark: (verseId: string) => void
  onAddNote: (verseId: string) => void
  onNavigate?: (verseId: string) => void
}

export default function VerseDisplay({
  verses,
  highlightedVerses,
  bookmarkedVerses,
  onHighlight,
  onRemoveHighlight,
  onBookmark,
  onRemoveBookmark,
  onAddNote,
  onNavigate,
}: Props) {
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null)

  if (verses.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No verses found.</p>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-1">
      {verses.map((verse) => {
        const highlightColor = highlightedVerses.get(verse.id) || null
        const isBookmarked = bookmarkedVerses.has(verse.id)

        return (
          <div key={verse.id} className="group" id={`v-${verse.number}`}>
            <div
              className={`flex gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-muted/50 ${
                highlightColor ? `bg-${highlightColor}-100 dark:bg-${highlightColor}-900/20` : ""
              }`}
            >
              <span
                className="mt-0.5 min-w-[2ch] text-right text-xs text-muted-foreground select-none cursor-pointer"
                onClick={() => setSelectedVerse(selectedVerse === verse.id ? null : verse.id)}
              >
                {verse.number}
              </span>
              <span
                className={`flex-1 text-[var(--reader-font-size,16px)] leading-[var(--reader-line-height,1.6)] ${
                  verse.isRedLetter ? "text-red-600 dark:text-red-400" : ""
                }`}
              >
                {verse.text}
              </span>
              <VerseToolbar
                verseId={verse.id}
                verseNumber={verse.number}
                isHighlighted={highlightColor}
                isBookmarked={isBookmarked}
                onHighlight={(color) => onHighlight(verse.id, color)}
                onRemoveHighlight={() => onRemoveHighlight(verse.id)}
                onBookmark={() => onBookmark(verse.id)}
                onRemoveBookmark={() => onRemoveBookmark(verse.id)}
                onAddNote={() => onAddNote(verse.id)}
              />
            </div>
            {selectedVerse === verse.id && (
              <div className="ml-8">
                <CrossReferencePanel verseId={verse.id} onNavigate={onNavigate} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
