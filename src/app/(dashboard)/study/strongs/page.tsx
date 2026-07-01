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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Strong's Concordance</h1>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="e.g., H7225 or G3779"
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          Search
        </button>
      </form>

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {entry && (
        <div className="rounded-lg border p-4">
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
