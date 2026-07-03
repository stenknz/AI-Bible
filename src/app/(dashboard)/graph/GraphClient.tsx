"use client"

import dynamic from "next/dynamic"
import type { GraphData } from "@/modules/knowledge-graph/types/graph"

const GraphView = dynamic(() => import("@/modules/knowledge-graph/components/GraphView"), {
  ssr: false,
})

export default function GraphClient({ data }: { data: GraphData }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground">Knowledge Graph</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore connections between people, places, events, and verses.
        </p>
      </div>
      <div className="rounded-xl bg-card p-6 shadow-sm">
        <GraphView data={data} />
      </div>
    </div>
  )
}
