"use client"

import { useState, useCallback } from "react"
import KnowledgeSearchResults from "@/modules/knowledge/components/KnowledgeSearchResults"

type LegacySearchResult = {
  id: string
  type: "verse" | "note" | "highlight"
  text: string
  reference?: string
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [legacyResults, setLegacyResults] = useState<LegacySearchResult[]>([])
  const [knowledgeResults, setKnowledgeResults] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)

    const [legacyRes, knowledgeRes] = await Promise.all([
      fetch(`/api/search?q=${encodeURIComponent(query)}`).then((r) => r.json()).catch(() => []),
      fetch(`/api/knowledge/search?q=${encodeURIComponent(query)}`).then((r) => r.json()).catch(() => ({ results: {} })),
    ])

    setLegacyResults(legacyRes || [])
    setKnowledgeResults(knowledgeRes.results || {})
    setLoading(false)
  }, [query])

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Bible, dictionaries, commentaries, topics..."
            className="w-full rounded-xl border border-border bg-card px-12 py-4 text-lg text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
            autoFocus
          />
        </div>
      </form>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
          </svg>
          <span className="text-sm">Searching...</span>
        </div>
      )}

      <KnowledgeSearchResults results={knowledgeResults} />

      {legacyResults.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Verses & Notes
            <span className="ml-2 text-xs font-normal opacity-60">({legacyResults.length})</span>
          </h3>
          {legacyResults.map((r, i) => (
            <div key={`${r.type}-${r.id}-${i}`} className="rounded-xl bg-card p-6 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                  r.type === "verse" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                  r.type === "note" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {r.type === "verse" ? "Verse" : r.type === "note" ? "Note" : "Highlight"}
                </span>
                {r.reference && <span className="text-xs text-muted-foreground">{r.reference}</span>}
              </div>
              <p className="text-sm leading-relaxed text-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && legacyResults.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">No results found.</p>
        </div>
      )}
    </div>
  )
}
