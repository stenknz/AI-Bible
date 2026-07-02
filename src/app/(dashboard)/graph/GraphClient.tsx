"use client"

import dynamic from "next/dynamic"
import type { GraphData } from "@/modules/knowledge-graph/types/graph"

const GraphView = dynamic(() => import("@/modules/knowledge-graph/components/GraphView"), {
  ssr: false,
})

export default function GraphClient({ data }: { data: GraphData }) {
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
