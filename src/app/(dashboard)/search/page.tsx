"use client"

import { useState } from "react"

type SearchResult = {
  id: string
  type: "verse" | "note" | "highlight"
  text: string
  reference?: string
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
    if (res.ok) {
      const data = await res.json()
      setResults(data)
    }
    setLoading(false)
  }

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
            placeholder="Search Bible, notes..."
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

      <div className="space-y-4">
        {results.map((r, i) => (
          <div key={`${r.type}-${r.id}-${i}`} className="rounded-xl bg-card p-6 shadow-sm animate-slide-up">
            <div className="mb-2 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                r.type === "verse" ? "bg-secondary/10 text-secondary" :
                r.type === "note" ? "bg-primary/10 text-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                {r.type === "verse" && (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )}
                {r.type === "note" && (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                )}
                {r.type === "highlight" && (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                )}
                {r.type.charAt(0).toUpperCase() + r.type.slice(1)}
              </span>
              {r.reference && <span className="text-xs text-muted-foreground">{r.reference}</span>}
            </div>
            <p className="text-sm leading-relaxed text-foreground">{r.text}</p>
          </div>
        ))}
      </div>

      {!loading && query && results.length === 0 && (
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
