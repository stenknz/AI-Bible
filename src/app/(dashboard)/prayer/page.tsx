"use client"

import { useState, useEffect } from "react"

type Prayer = {
  id: string
  title: string
  content: string
  isAnswered: boolean
  answeredAt: string | null
  answerNotes: string | null
  category?: { name: string } | null
  createdAt: string
}

export default function PrayerPage() {
  const [prayers, setPrayers] = useState<Prayer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [filter, setFilter] = useState<"all" | "answered" | "unanswered">("all")

  useEffect(() => {
    fetch("/api/prayers").then((r) => r.json()).then(setPrayers)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/prayers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    })
    if (res.ok) {
      const prayer = await res.json()
      setPrayers((prev) => [prayer, ...prev])
      setTitle("")
      setContent("")
      setShowForm(false)
    }
  }

  async function markAnswered(id: string) {
    await fetch(`/api/prayers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "answer" }),
    })
    setPrayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isAnswered: true, answeredAt: new Date().toISOString() } : p))
    )
  }

  const filtered = prayers.filter((p) => {
    if (filter === "answered") return p.isAnswered
    if (filter === "unanswered") return !p.isAnswered
    return true
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Prayer Journal</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "New Prayer"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-lg border p-4">
          <input
            type="text"
            placeholder="Prayer title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            required
          />
          <textarea
            placeholder="Write your prayer..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            rows={4}
            required
          />
          <button type="submit" className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
            Save Prayer
          </button>
        </form>
      )}

      <div className="mb-4 flex gap-2">
        {(["all", "unanswered", "answered"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs ${filter === f ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((prayer) => (
          <div key={prayer.id} className={`rounded-lg border p-4 ${prayer.isAnswered ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{prayer.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{prayer.content}</p>
              </div>
              {!prayer.isAnswered && (
                <button
                  onClick={() => markAnswered(prayer.id)}
                  className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                >
                  Mark Answered
                </button>
              )}
            </div>
            {prayer.isAnswered && prayer.answeredAt && (
              <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                Answered {new Date(prayer.answeredAt).toLocaleDateString()}
                {prayer.answerNotes && ` — ${prayer.answerNotes}`}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">{new Date(prayer.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No prayers yet.</p>
        )}
      </div>
    </div>
  )
}
