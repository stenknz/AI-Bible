"use client"

import { useState, useEffect } from "react"

type HighlightItem = {
  id: string
  verseId: string
  color: string
  reference: string | null
  text: string | null
}

const COLOR_MAP: Record<string, string> = {
  yellow: "border-l-yellow-400 bg-yellow-50",
  green: "border-l-green-400 bg-green-50",
  blue: "border-l-blue-400 bg-blue-50",
  pink: "border-l-pink-400 bg-pink-50",
}

export function HighlightsList() {
  const [highlights, setHighlights] = useState<HighlightItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/highlights")
      .then((r) => r.json())
      .then(setHighlights)
      .catch(() => console.error("Failed to load highlights"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="py-4 text-sm text-muted-foreground animate-fade-in">Loading highlights...</p>

  if (highlights.length === 0) return null

  async function removeHighlight(verseId: string) {
    await fetch(`/api/highlights/${verseId}`, { method: "DELETE" })
    setHighlights((prev) => prev.filter((h) => h.verseId !== verseId))
  }

  return (
    <div className="mt-10 animate-fade-in">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Highlights ({highlights.length})</h2>
      <div className="space-y-2">
        {highlights.map((h) => (
          <div
            key={h.id}
            className={`flex items-start justify-between rounded-xl border-l-4 bg-card p-4 shadow-sm ${COLOR_MAP[h.color] || "border-l-yellow-400 bg-yellow-50"}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{h.reference}</p>
              {h.text && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{h.text}</p>}
            </div>
            <button
              onClick={() => removeHighlight(h.verseId)}
              className="ml-2 rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50"
              title="Remove highlight"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
