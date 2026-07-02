"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type HighlightItem = {
  id: string
  verseId: string
  color: string
  reference: string | null
  text: string | null
}

const COLOR_MAP: Record<string, string> = {
  yellow: "bg-yellow-100 border-yellow-300",
  green: "bg-green-100 border-green-300",
  blue: "bg-blue-100 border-blue-300",
  pink: "bg-pink-100 border-pink-300",
}

export function HighlightsList() {
  const [highlights, setHighlights] = useState<HighlightItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/highlights")
      .then((r) => r.json())
      .then(setHighlights)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-muted-foreground">Loading highlights...</p>

  if (highlights.length === 0) return null

  async function removeHighlight(verseId: string) {
    await fetch(`/api/highlights/${verseId}`, { method: "DELETE" })
    setHighlights((prev) => prev.filter((h) => h.verseId !== verseId))
  }

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-semibold">Highlights ({highlights.length})</h2>
      <div className="space-y-2">
        {highlights.map((h) => (
          <div
            key={h.id}
            className={`flex items-start justify-between rounded-lg border-l-4 p-3 ${COLOR_MAP[h.color] || "bg-yellow-100 border-yellow-300"}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{h.reference}</p>
              {h.text && <p className="mt-1 text-xs text-muted-foreground truncate">{h.text}</p>}
            </div>
            <button
              onClick={() => removeHighlight(h.verseId)}
              className="ml-2 rounded p-1 text-xs text-red-500 hover:bg-red-50"
              title="Remove highlight"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
