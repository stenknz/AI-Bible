"use client"

import { useState, useEffect } from "react"

type CrossRef = { toVerseId: string; reference: string; text: string; weight: number }

type Props = {
  verseId: string | null
  onNavigate?: (verseId: string) => void
}

export default function CrossReferencePanel({ verseId, onNavigate }: Props) {
  const [refs, setRefs] = useState<CrossRef[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!verseId) { setRefs([]); return }
    setLoading(true)
    fetch(`/api/cross-references?verseId=${verseId}`)
      .then((r) => r.json())
      .then(setRefs)
      .catch(() => setRefs([]))
      .finally(() => setLoading(false))
  }, [verseId])

  if (!verseId || refs.length === 0) return null

  return (
    <div className="mt-4 rounded-lg border p-3">
      <h4 className="mb-2 text-xs font-semibold text-muted-foreground">Cross References</h4>
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : (
        <ul className="space-y-1">
          {refs.map((ref) => (
            <li key={ref.toVerseId}>
              <button onClick={() => onNavigate?.(ref.toVerseId)} className="text-left text-xs text-blue-600 hover:underline">
                {ref.reference}
              </button>
              <p className="text-xs text-muted-foreground">{ref.text}…</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
