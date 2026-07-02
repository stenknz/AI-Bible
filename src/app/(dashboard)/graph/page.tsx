"use client"

import { useState, useEffect } from "react"
import { GraphView } from "@/modules/knowledge-graph/components/GraphView"
import type { GraphData } from "@/modules/knowledge-graph/types/graph"

export default function GraphPage() {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/graph/query").then((r) => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-8"><div className="h-[600px] w-full rounded-lg border bg-muted animate-pulse" /></div>

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-xl font-semibold">Knowledge Graph</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Explore connections between people, places, events, and verses.
      </p>
      <GraphView data={data} />
    </div>
  )
}
