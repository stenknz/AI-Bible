"use client"

import { useState } from "react"
import { VoiceInput } from "./VoiceInput"
import { useRouter } from "next/navigation"

export function VoiceCommandPalette() {
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState("")
  const router = useRouter()

  function handleCommand(action: string, params: Record<string, string>) {
    setFeedback(`Command: ${action} ${JSON.stringify(params)}`)
    switch (action) {
      case "search":
        router.push(`/search?q=${encodeURIComponent(params.query || "")}`)
        break
      case "navigate":
        router.push(`/search?q=${encodeURIComponent(params.location || "")}`)
        break
      case "note":
        router.push("/notes")
        break
      case "pray":
        router.push("/notes")
        break
    }
    setTimeout(() => {
      setOpen(false)
      setFeedback("")
    }, 1500)
  }

  function handleResult(transcript: string) {
    setFeedback(`Heard: "${transcript}"`)
    setTimeout(() => setFeedback(""), 2000)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-white shadow-sm transition-colors duration-200 hover:bg-secondary/90"
        title="Voice commands"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card p-5 shadow-lg">
          <h3 className="mb-3 text-sm font-semibold">Voice Commands</h3>
          <VoiceInput onResult={handleResult} onCommand={handleCommand} />
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <p>Say: <span className="font-mono">&quot;search faith&quot;</span></p>
            <p>Say: <span className="font-mono">&quot;go to Genesis 1&quot;</span></p>
            <p>Say: <span className="font-mono">&quot;note remember this&quot;</span></p>
            <p>Say: <span className="font-mono">&quot;pray for peace&quot;</span></p>
          </div>
          {feedback && (
            <p className="mt-2 text-xs text-secondary">{feedback}</p>
          )}
        </div>
      )}
    </div>
  )
}
