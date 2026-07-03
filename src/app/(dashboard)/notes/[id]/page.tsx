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

  if (!note) return <div className="p-12 text-center text-muted-foreground animate-fade-in">Loading...</div>

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
      <button onClick={() => router.push("/notes")} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
        Back to notes
      </button>

      {note.verse && (
        <div className="mb-6 rounded-xl border-l-4 border-secondary bg-muted/50 px-5 py-4">
          <p className="text-sm font-medium text-secondary">
            {note.verse.chapter?.book?.name} {note.verse.chapter?.number}:{note.verse.number}
          </p>
        </div>
      )}

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title..."
        className="mb-4 w-full rounded-lg border border-border bg-background px-4 py-2 text-lg font-medium focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
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

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-secondary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button onClick={handleDelete} className="rounded-lg border border-border px-5 py-2 text-sm text-red-500 transition-colors hover:bg-red-50">
          <svg className="-ml-1 mr-1.5 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
          Delete Note
        </button>
      </div>
    </div>
  )
}
