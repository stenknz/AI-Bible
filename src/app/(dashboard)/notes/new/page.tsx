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

  useEffect(() => {
    if (!verseId) return
    fetch(`/api/bible/verse/${verseId}`)
      .then((r) => r.json())
      .then((data) => {
        setVerseText(data.text || "")
        setVerseRef(data.reference || "")
      })
      .catch(() => console.error("Failed to load verse data"))
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
      router.push(`/notes/${note.id}`)
    }
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
        Back
      </button>
      {verseRef && (
        <div className="mb-6 rounded-xl border-l-4 border-secondary bg-muted/50 px-5 py-4">
          <p className="text-sm font-medium text-secondary">{verseRef}</p>
          {verseText && <p className="mt-1 text-sm text-muted-foreground">{verseText}</p>}
        </div>
      )}
      <NoteEditor onSave={handleSave} placeholder="Write your note about this verse..." />
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => {
            const editorEl = document.querySelector(".ProseMirror")
            const content = editorEl ? { type: "doc", content: [] } : { type: "doc", content: [] }
            handleSave(content)
          }}
          disabled={saving}
          className="rounded-lg bg-secondary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90 disabled:opacity-50"
        >
          <svg className="-ml-1 mr-1.5 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 12.75l6 6 9-13.5"/></svg>
          {saving ? "Saving..." : "Save Note"}
        </button>
      </div>
    </div>
  )
}
