"use client"

import { useState } from "react"

export default function StrongsPage() {
  const [number, setNumber] = useState("")
  const [entry, setEntry] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!number.trim()) return
    setLoading(true)
    setError("")
    setEntry(null)

    const res = await fetch(`/api/original-languages/strongs?number=${encodeURIComponent(number.trim())}`)
    if (res.ok) {
      setEntry(await res.json())
    } else {
      setError("Strong's number not found. Try format: H7225 or G3779")
    }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-foreground">Strong's Concordance</h1>

      <form onSubmit={handleSearch} className="mb-8 flex gap-3">
        <input
          type="text"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="e.g., H7225 or G3779"
          className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
        />
        <button type="submit" className="rounded-xl bg-secondary px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-secondary/90">
          Search
        </button>
      </form>

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {entry && (
        <div className="rounded-xl bg-card p-6 shadow-sm animate-slide-up">
          <p className="text-2xl font-semibold">{entry.number}</p>
          <p className="text-lg text-muted-foreground" dir={entry.language === "hebrew" ? "rtl" : "ltr"}>
            {entry.transliteration}
          </p>
          <p className="mt-2 text-sm"><strong>Lemma:</strong> {entry.lemma}</p>
          <p className="mt-1 text-sm"><strong>Language:</strong> {entry.language}</p>
          <p className="mt-3 text-sm">{entry.definition}</p>
        </div>
      )}
    </div>
  )
}
