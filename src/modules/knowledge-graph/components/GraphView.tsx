"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import type { GraphData } from "@/modules/knowledge-graph/types/graph"

type Props = {
  data: GraphData
  onNodeClick?: (node: any) => void
}

export function GraphView({ data, onNodeClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return

    let unmounted = false

    async function load() {
      const ForceGraph2D = (await import("react-force-graph-2d")).default
      const { createRoot } = await import("react-dom/client")
      const React = await import("react")

      if (unmounted || !containerRef.current) return

      const root = document.createElement("div")
      containerRef.current.innerHTML = ""
      containerRef.current.appendChild(root)
      const rootInstance = createRoot(root)

      const colors: Record<string, string> = { person: "#3b82f6", place: "#22c55e", event: "#f59e0b" }

      rootInstance.render(
        React.createElement(ForceGraph2D, {
          graphData: { nodes: data.nodes, links: data.links },
          nodeLabel: "label",
          nodeColor: (node: any) => colors[node.type] || "#6b7280",
          nodeRelSize: 6,
          linkLabel: "label",
          linkDirectionalArrowLength: 6,
          linkDirectionalArrowRelPos: 1,
          linkCurvature: 0.25,
          onNodeClick: (node: any) => onNodeClick?.(node),
          width: containerRef.current!.clientWidth,
          height: 600,
        })
      )

      if (!unmounted) setReady(true)
    }

    load()

    return () => { unmounted = true }
  }, [data, onNodeClick])

  if (data.nodes.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">No graph data yet.</p>
  }

  if (!ready) {
    return <div className="h-[600px] w-full rounded-lg border bg-muted animate-pulse" />
  }

  return <div ref={containerRef} className="h-[600px] w-full rounded-lg border overflow-hidden" />
}
