"use client"

import { NoteList } from "@/modules/notes/components/NoteList"
import { HighlightsList } from "@/modules/notes/components/HighlightsList"
import { useRouter } from "next/navigation"

export default function NotesPage() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
        <button
          onClick={async () => {
            const res = await fetch("/api/notes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: { type: "doc", content: [{ type: "paragraph" }] } }),
            })
            if (res.ok) {
              const note = await res.json()
              router.push(`/notes/${note.id}`)
            }
          }}
          className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90"
        >
          New Note
        </button>
      </div>
      <NoteList />
      <HighlightsList />
    </div>
  )
}
