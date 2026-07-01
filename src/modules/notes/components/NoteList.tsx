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

  const filtered = notes.filter((n) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (n.title?.toLowerCase() || "").includes(q) || n.tags.some((t) => t.toLowerCase().includes(q))
  })

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search notes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm"
      />
      <div className="space-y-2">
        {filtered.map((note) => (
          <Link key={note.id} href={`/notes/${note.id}`} className="block rounded-lg border p-3 hover:bg-muted">
            <p className="font-medium">{note.title || "Untitled"}</p>
            {note.verse && (
              <p className="text-xs text-muted-foreground">{note.verse.chapter.book.name} {note.verse.chapter.number}:{note.verse.number}</p>
            )}
            {note.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {note.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs">{tag}</span>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">{new Date(note.updatedAt).toLocaleDateString()}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
