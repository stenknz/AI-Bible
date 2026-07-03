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

const HIGHLIGHT_BG: Record<string, string> = {
  yellow: "bg-yellow-100 dark:bg-yellow-900/20",
  green: "bg-green-100 dark:bg-green-900/20",
  blue: "bg-blue-100 dark:bg-blue-900/20",
  pink: "bg-pink-100 dark:bg-pink-900/20",
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
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 017.5 17H20" />
            <path d="M7.5 17H20V3H7.5A2.5 2.5 0 005 5.5v14A2.5 2.5 0 017.5 17" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground/60 font-medium">No verses found</p>
        <p className="text-xs text-muted-foreground/40 mt-1">Select a different chapter to begin reading.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3 px-4">
      {verses.map((verse) => {
        const highlightColor = highlightedVerses.get(verse.id) || null
        const isBookmarked = bookmarkedVerses.has(verse.id)

        return (
          <div key={verse.id} className="group" id={`v-${verse.number}`}>
            <div
              className={`flex gap-4 rounded-xl px-3 py-2 transition-colors hover:bg-muted ${
                highlightColor ? HIGHLIGHT_BG[highlightColor] || "" : ""
              }`}
            >
              <span
                className="mt-0.5 min-w-[2ch] text-right text-xs text-muted-foreground/60 select-none cursor-pointer font-medium"
                onClick={() => setSelectedVerse(selectedVerse === verse.id ? null : verse.id)}
              >
                {verse.number}
              </span>
              <span
                className={`flex-1 text-[var(--reader-font-size,16px)] leading-[var(--reader-line-height,1.6)] ${
                  verse.isRedLetter ? "text-red-letter" : ""
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
              <div className="ml-10">
                <CrossReferencePanel verseId={verse.id} onNavigate={onNavigate} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
