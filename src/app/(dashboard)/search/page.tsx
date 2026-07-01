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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <form onSubmit={handleSearch} className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Bible, notes..."
          className="w-full rounded-lg border px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </form>

      {loading && <p className="text-center text-muted-foreground">Searching...</p>}

      <div className="space-y-3">
        {results.map((r, i) => (
          <div key={`${r.type}-${r.id}-${i}`} className="rounded-lg border p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                r.type === "verse" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              }`}>
                {r.type}
              </span>
              {r.reference && <span className="text-xs text-muted-foreground">{r.reference}</span>}
            </div>
            <p className="text-sm">{r.text}</p>
          </div>
        ))}
      </div>

      {!loading && query && results.length === 0 && (
        <p className="text-center text-muted-foreground">No results found.</p>
      )}
    </div>
  )
}
