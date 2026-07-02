"use client"

import { useState, useEffect } from "react"

export default function DevToolsPage() {
  const [status, setStatus] = useState<any>(null)
  const [running, setRunning] = useState<string | null>(null)
  const [output, setOutput] = useState("")

  useEffect(() => {
    if (process.env.NODE_ENV === "production") window.location.href = "/"
  }, [])

  async function runAction(action: string) {
    setRunning(action)
    setOutput(`Running ${action}...`)
    try {
      const res = await fetch(`/api/dev/${action}`, { method: "POST" })
      setOutput(JSON.stringify(await res.json(), null, 2))
    } catch (e: any) {
      setOutput(`Error: ${e.message}`)
    }
    setRunning(null)
    fetchStatus()
  }

  async function fetchStatus() {
    try {
      const res = await fetch("/api/dev/status", { method: "POST" })
      setStatus(await res.json())
    } catch {}
  }

  useEffect(() => { fetchStatus() }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-xl font-semibold">Development Tools</h1>
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-600 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
        ⚠️ This page is ONLY available in development mode. It is never accessible in production.
      </div>

      {status && (
        <div className="mb-6 grid grid-cols-5 gap-3">
          {Object.entries(status).filter(([k]) => !k.startsWith("_")).map(([key, val]) => (
            <div key={key} className="rounded-lg border p-3 text-center">
              <p className="text-lg font-semibold">{val as number}</p>
              <p className="text-xs text-muted-foreground capitalize">{key}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        {[
          { key: "status", label: "Refresh Status", dangerous: false },
          { key: "seed", label: "Seed Database", dangerous: false },
          { key: "reimport", label: "Re-import KJV", dangerous: false },
          { key: "reset", label: "Reset & Reseed", dangerous: true },
        ].map((action) => (
          <button
            key={action.key}
            onClick={() => runAction(action.key)}
            disabled={running !== null}
            className={`rounded-lg px-4 py-2 text-sm ${
              action.dangerous ? "bg-red-600 text-white hover:bg-red-700" : "bg-blue-600 text-white hover:bg-blue-700"
            } disabled:opacity-50`}
          >
            {running === action.key ? "..." : action.label}
          </button>
        ))}
      </div>

      {output && (
        <pre className="max-h-96 overflow-auto rounded-lg border bg-muted p-4 text-xs">{output}</pre>
      )}
    </div>
  )
}
