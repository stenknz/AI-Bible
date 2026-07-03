"use client"

import { useState } from "react"

export default function LexiconPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)

    const res = await fetch(`/api/original-languages/strongs?search=${encodeURIComponent(query.trim())}`)
    if (res.ok) {
      setResults(await res.json())
    }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-foreground">Lexicon Search</h1>

      <form onSubmit={handleSearch} className="mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Hebrew or Greek words..."
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
        />
      </form>

      {loading && <p className="text-sm text-muted-foreground">Searching...</p>}

      <div className="space-y-4">
        {results.map((entry: any) => (
          <div key={entry.id} className="rounded-xl bg-card p-5 shadow-sm animate-slide-up">
            <p className="font-medium">{entry.lemma}</p>
            <p className="text-sm text-muted-foreground">{entry.language} — {entry.definition}</p>
            {entry.frequency !== null && (
              <p className="text-xs text-muted-foreground mt-1">Occurrences: {entry.frequency}</p>
            )}
          </div>
        ))}
        {!loading && query && results.length === 0 && (
          <p className="text-sm text-muted-foreground">No results found.</p>
        )}
      </div>
    </div>
  )
}
