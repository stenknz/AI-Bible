"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

type NoteListItem = {
  id: string
  title: string | null
  tags: string[]
  updatedAt: string
  verse?: { number: number; chapter: { number: number; book: { name: string } } } | null
}

export function NoteList() {
  const [notes, setNotes] = useState<NoteListItem[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/notes").then((r) => r.json()).then(setNotes)
  }, [])

  async function deleteNote(id: string) {
    if (!confirm("Delete this note?")) return
    await fetch(`/api/notes/${id}`, { method: "DELETE" })
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  const filtered = notes.filter((n) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (n.title?.toLowerCase() || "").includes(q) || n.tags.some((t) => t.toLowerCase().includes(q))
  })

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-3 text-sm focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
        />
      </div>
      <div className="space-y-2">
        {filtered.map((note) => (
          <div key={note.id} className="group flex items-start rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
            <Link href={`/notes/${note.id}`} className="min-w-0 flex-1">
              <p className="font-medium">{note.title || "Untitled"}</p>
              {note.verse && (
                <p className="mt-0.5 text-xs text-secondary">
                  {note.verse.chapter.book.name} {note.verse.chapter.number}:{note.verse.number}
                </p>
              )}
              {note.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{tag}</span>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">{new Date(note.updatedAt).toLocaleDateString()}</p>
            </Link>
            <button
              onClick={() => deleteNote(note.id)}
              className="ml-2 rounded-lg p-1.5 text-red-400 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100"
              title="Delete note"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
