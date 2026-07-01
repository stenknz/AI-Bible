"use client"

import { useState } from "react"

type AIAction = {
  label: string
  action: string
  description: string
}

const actions: AIAction[] = [
  { label: "Explain Verse", action: "explain", description: "Get a detailed explanation of the current verse" },
  { label: "Summarize Passage", action: "summarize", description: "Summarize the selected passage" },
  { label: "Cross References", action: "cross-refs", description: "Find related verses" },
  { label: "Study Plan", action: "study-plan", description: "Generate a study plan" },
  { label: "Devotional", action: "devotional", description: "Generate a devotional" },
  { label: "Ask a Question", action: "ask", description: "Ask any Bible-related question" },
]

export function AIPanel() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
        title="AI Assistant"
      >
        <span className="text-lg">AI</span>
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-80 rounded-lg border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b p-3">
            <h3 className="text-sm font-semibold">AI Assistant</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <div className="p-3">
            <p className="mb-3 text-xs text-muted-foreground">
              AI features are coming soon. Select an action below to see what will be available.
            </p>
            <div className="space-y-2">
              {actions.map((a) => (
                <button
                  key={a.action}
                  onClick={() => alert("AI features coming soon!")}
                  className="w-full rounded-lg border p-2 text-left text-sm hover:bg-muted"
                >
                  <p className="font-medium">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
