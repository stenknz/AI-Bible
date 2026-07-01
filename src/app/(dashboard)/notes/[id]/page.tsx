"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { NoteEditor } from "@/modules/notes/components/NoteEditor"

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [note, setNote] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/notes/${id}`).then((r) => r.json()).then(setNote)
  }, [id])

  if (!note) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button onClick={() => router.push("/notes")} className="mb-4 text-sm text-muted-foreground hover:text-foreground">
        ← Back to notes
      </button>
      <NoteEditor
        initialContent={note.content}
        onSave={async (content) => {
          await fetch(`/api/notes/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          })
        }}
      />
    </div>
  )
}
