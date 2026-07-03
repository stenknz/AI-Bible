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
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Prayer Journal</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90"
        >
          {showForm ? "Cancel" : "New Prayer"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <input
            type="text"
            placeholder="Prayer title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
            required
          />
          <textarea
            placeholder="Write your prayer..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
            rows={4}
            required
          />
          <button type="submit" className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90">
            Save Prayer
          </button>
        </form>
      )}

      <div className="mb-4 flex gap-2">
        {(["all", "unanswered", "answered"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? "bg-secondary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((prayer) => (
          <div key={prayer.id} className={`animate-slide-up rounded-xl border bg-card p-5 shadow-sm ${prayer.isAnswered ? "border-l-4 border-l-green-400" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{prayer.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{prayer.content}</p>
              </div>
              {!prayer.isAnswered && (
                <button
                  onClick={() => markAnswered(prayer.id)}
                  className="ml-3 shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
                >
                  Mark Answered
                </button>
              )}
            </div>
            {prayer.isAnswered && prayer.answeredAt && (
              <p className="mt-3 text-xs font-medium text-green-600">
                <svg className="-ml-0.5 mr-1 inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 12.75l6 6 9-13.5"/></svg>
                Answered {new Date(prayer.answeredAt).toLocaleDateString()}
                {prayer.answerNotes && ` — ${prayer.answerNotes}`}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">{new Date(prayer.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No prayers yet.</p>
        )}
      </div>
    </div>
  )
}
