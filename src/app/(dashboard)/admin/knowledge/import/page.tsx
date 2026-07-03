"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type ImportSource = {
  key: string
  label: string
  description: string
}

const SOURCES: ImportSource[] = [
  { key: "easton", label: "Easton's Bible Dictionary", description: "3,960 dictionary entries" },
  { key: "smith", label: "Smith's Bible Dictionary", description: "4,560 dictionary entries" },
  { key: "nave", label: "Nave's Topical Bible", description: "5,320 topical entries" },
  { key: "matthew-henry", label: "Matthew Henry Commentary", description: "5,344 commentary entries" },
]

export default function KnowledgeImportPage() {
  const router = useRouter()
  const [running, setRunning] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])

  async function runImport(key: string) {
    setRunning(key)
    setLog((prev) => [...prev, `\n=== Starting ${key} import ===`])

    try {
      const res = await fetch("/api/dev/status", { method: "POST" })
      const status = await res.json()
      setLog((prev) => [...prev, `Pre-import status: ${JSON.stringify(status, null, 2)}`])
    } catch {
      setLog((prev) => [...prev, "Note: Status check available in dev mode only"])
    }

    setRunning(null)
    router.refresh()
  }

  return (
    <div className="animate-fade-in">
      <h2 className="mb-6 text-lg font-semibold">Import Knowledge Datasets</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Run importers to populate the knowledge platform. Each importer is idempotent — re-running updates existing entries.
      </p>

      <div className="space-y-3">
        {SOURCES.map((source) => (
          <div key={source.key} className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm">
            <div>
              <p className="text-sm font-medium">{source.label}</p>
              <p className="text-xs text-muted-foreground">{source.description}</p>
            </div>
            <button
              onClick={() => runImport(source.key)}
              disabled={running === source.key}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90 disabled:opacity-50"
            >
              {running === source.key ? "Running..." : "Run Import"}
            </button>
          </div>
        ))}
      </div>

      {log.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-2 text-sm font-semibold">Import Log</h3>
          <pre className="max-h-60 overflow-y-auto rounded-lg bg-muted p-4 text-xs text-muted-foreground">
            {log.join("\n")}
          </pre>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        <p className="font-medium">Running in Production</p>
        <p className="mt-1">Imports run via the CLI: <code className="rounded bg-amber-100 px-1">npx tsx scripts/import/import-runner.ts --source=&lt;name&gt;</code></p>
        <p className="mt-1">This admin panel is for monitoring only. CLI execution required.</p>
      </div>
    </div>
  )
}
