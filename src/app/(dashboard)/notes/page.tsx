"use client"

import { NoteList } from "@/modules/notes/components/NoteList"
import { useRouter } from "next/navigation"

export default function NotesPage() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notes</h1>
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
          className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
        >
          New Note
        </button>
      </div>
      <NoteList />
    </div>
  )
}
