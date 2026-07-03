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
    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={() => setShowColors(!showColors)} className="rounded-lg p-1.5 text-xs hover:bg-muted/70 transition-colors" title="Highlight">
        {isHighlighted ? (
          <span className={`inline-block h-4 w-4 rounded-full ${COLORS.find(c => c.name === isHighlighted)?.class || "bg-yellow-200"} ring-1 ring-offset-1 ring-border`} />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        )}
      </button>
      {showColors && (
        <div className="flex gap-1 items-center">
          {COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => { onHighlight(c.name); setShowColors(false) }}
              className={`h-5 w-5 rounded-full ${c.class} border-2 border-border hover:scale-110 transition-transform cursor-pointer`}
              title={c.name}
            />
          ))}
          {isHighlighted && (
            <button onClick={() => { onRemoveHighlight(); setShowColors(false) }} className="text-xs text-red-500 hover:text-red-600 transition-colors p-0.5" title="Remove highlight">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
        </div>
      )}
      <button onClick={() => isBookmarked ? onRemoveBookmark() : onBookmark()} className="rounded-lg p-1.5 text-xs hover:bg-muted/70 transition-colors" title={isBookmarked ? "Remove bookmark" : "Bookmark"}>
        {isBookmarked ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        )}
      </button>
      <button onClick={onAddNote} className="rounded-lg p-1.5 text-xs hover:bg-muted/70 transition-colors" title="Add note">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      </button>
    </div>
  )
}
