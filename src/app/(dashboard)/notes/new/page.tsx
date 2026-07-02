"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { NoteEditor } from "@/modules/notes/components/NoteEditor"

export default function NewNotePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const verseId = searchParams.get("verseId")
  const [verseText, setVerseText] = useState("")
  const [verseRef, setVerseRef] = useState("")
  const [saving, setSaving] = useState(false)
  const [noteId, setNoteId] = useState<string | null>(null)

  useEffect(() => {
    if (!verseId) return
    fetch(`/api/bible/verse/${verseId}`)
      .then((r) => r.json())
      .then((data) => {
        setVerseText(data.text || "")
        setVerseRef(data.reference || "")
      })
      .catch(() => {})
  }, [verseId])

  async function handleSave(content: any) {
    setSaving(true)
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        verseId: verseId || undefined,
        title: verseRef ? `Note on ${verseRef}` : undefined,
      }),
    })
    if (res.ok) {
      const note = await res.json()
      setNoteId(note.id)
      router.push(`/notes/${note.id}`)
    }
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button onClick={() => router.back()} className="mb-4 text-sm text-muted-foreground hover:text-foreground">
        ← Back
      </button>
      {verseRef && (
        <div className="mb-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-800">{verseRef}</p>
          {verseText && <p className="mt-1 text-sm text-blue-700">{verseText}</p>}
        </div>
      )}
      <NoteEditor onSave={handleSave} placeholder="Write your note about this verse..." />
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => {
            const editorEl = document.querySelector(".ProseMirror")
            const content = editorEl ? { type: "doc", content: [] } : { type: "doc", content: [] }
            handleSave(content)
          }}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Note"}
        </button>
      </div>
    </div>
  )
}
