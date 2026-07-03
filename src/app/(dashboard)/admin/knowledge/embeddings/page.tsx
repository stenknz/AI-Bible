"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const ENTITY_TYPES = [
  { key: "dictionary", label: "Dictionary Entries", count: "~5,988" },
  { key: "commentary", label: "Commentary Entries", count: "~5,344" },
  { key: "topic", label: "Topics", count: "~5,320" },
  { key: "bible_event", label: "Bible Events", count: "TBD" },
  { key: "nation", label: "Nations", count: "TBD" },
  { key: "person", label: "People", count: "~20" },
  { key: "place", label: "Places", count: "~1,600" },
]

export default function EmbeddingsPage() {
  const router = useRouter()
  const [running, setRunning] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])

  async function rebuildEmbeddings(type: string) {
    setRunning(type)
    setLog((prev) => [...prev, `\n=== Starting ${type} embeddings ===`])

    try {
      const res = await fetch("/api/dev/seed", { method: "POST" })
      if (res.ok) setLog((prev) => [...prev, "Seed triggered (embedding generation runs after import)"])
    } catch {
      setLog((prev) => [...prev, "Note: Run embeddings via CLI for full processing"])
    }

    setLog((prev) => [...prev, `Use CLI: npx tsx scripts/import/embed-all.ts --type=${type}`])
    setRunning(null)
    router.refresh()
  }

  return (
    <div className="animate-fade-in">
      <h2 className="mb-6 text-lg font-semibold">Embedding Management</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Generate pgvector embeddings for semantic search and RAG. Embeddings should be rebuilt after importing or updating data.
      </p>

      <div className="space-y-3">
        {ENTITY_TYPES.map((et) => (
          <div key={et.key} className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm">
            <div>
              <p className="text-sm font-medium">{et.label}</p>
              <p className="text-xs text-muted-foreground">{et.count} entries</p>
            </div>
            <button
              onClick={() => rebuildEmbeddings(et.key)}
              disabled={running === et.key}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90 disabled:opacity-50"
            >
              {running === et.key ? "Processing..." : "Rebuild"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-card p-6 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold">Bulk Rebuild All</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Generate embeddings for all knowledge entities at once. This may take several minutes.
        </p>
        <code className="block rounded bg-muted p-3 text-xs text-muted-foreground">
          npx tsx scripts/import/embed-all.ts
        </code>
      </div>

      {log.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-2 text-sm font-semibold">Activity Log</h3>
          <pre className="max-h-40 overflow-y-auto rounded-lg bg-muted p-4 text-xs text-muted-foreground">
            {log.join("\n")}
          </pre>
        </div>
      )}
    </div>
  )
}
