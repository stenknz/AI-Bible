"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { NoteEditor } from "@/modules/notes/components/NoteEditor"

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [note, setNote] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState("")

  useEffect(() => {
    fetch(`/api/notes/${id}`)
      .then((r) => r.json())
      .then((n) => {
        setNote(n)
        setTitle(n.title || "")
      })
  }, [id])

  async function handleSave() {
    setSaving(true)
    const editorEl = document.querySelector(".ProseMirror")
    const content = editorEl
      ? JSON.parse(localStorage.getItem(`note-${id}`) || "null") || note?.content
      : note?.content
    await fetch(`/api/notes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title || undefined, content }),
    })
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm("Delete this note?")) return
    await fetch(`/api/notes/${id}`, { method: "DELETE" })
    router.push("/notes")
  }

  if (!note) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button onClick={() => router.push("/notes")} className="mb-4 text-sm text-muted-foreground hover:text-foreground">
        ← Back to notes
      </button>

      {note.verse && (
        <div className="mb-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-800">
            {note.verse.chapter?.book?.name} {note.verse.chapter?.number}:{note.verse.number}
          </p>
        </div>
      )}

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title..."
        className="mb-4 w-full rounded-lg border px-3 py-2 text-lg font-medium"
      />

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

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button onClick={handleDelete} className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
          Delete Note
        </button>
      </div>
    </div>
  )
}
