"use client"

import { useState } from "react"

const COLORS = [
  { name: "yellow", class: "bg-yellow-200" },
  { name: "green", class: "bg-green-200" },
  { name: "blue", class: "bg-blue-200" },
  { name: "pink", class: "bg-pink-200" },
]

type Props = {
  verseId: string
  verseNumber: number
  isHighlighted: string | null | undefined
  isBookmarked: boolean
  onHighlight: (color: string) => void
  onRemoveHighlight: () => void
  onBookmark: () => void
  onRemoveBookmark: () => void
  onAddNote: () => void
}

export default function VerseToolbar({
  verseId,
  verseNumber,
  isHighlighted,
  isBookmarked,
  onHighlight,
  onRemoveHighlight,
  onBookmark,
  onRemoveBookmark,
  onAddNote,
}: Props) {
  const [showColors, setShowColors] = useState(false)

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={() => setShowColors(!showColors)} className="rounded p-1 text-xs hover:bg-muted" title="Highlight">
        {isHighlighted ? (
          <span className={`inline-block h-3 w-3 rounded ${COLORS.find(c => c.name === isHighlighted)?.class || "bg-yellow-200"}`} />
        ) : (
          <span>🖍</span>
        )}
      </button>
      {showColors && (
        <div className="flex gap-0.5">
          {COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => { onHighlight(c.name); setShowColors(false) }}
              className={`h-4 w-4 rounded-full ${c.class} border`}
              title={c.name}
            />
          ))}
          {isHighlighted && (
            <button onClick={() => { onRemoveHighlight(); setShowColors(false) }} className="text-xs text-red-500">✕</button>
          )}
        </div>
      )}
      <button onClick={() => isBookmarked ? onRemoveBookmark() : onBookmark()} className="rounded p-1 text-xs hover:bg-muted" title={isBookmarked ? "Remove bookmark" : "Bookmark"}>
        {isBookmarked ? "★" : "☆"}
      </button>
      <button onClick={onAddNote} className="rounded p-1 text-xs hover:bg-muted" title="Add note">
        ✏
      </button>
    </div>
  )
}
