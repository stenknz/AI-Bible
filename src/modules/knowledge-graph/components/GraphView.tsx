"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import type { GraphData } from "@/modules/knowledge-graph/types/graph"

type Props = {
  data: GraphData
  onNodeClick?: (node: any) => void
}

export function GraphView({ data, onNodeClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const fgRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return

    async function loadForceGraph() {
      const ForceGraph2D = (await import("react-force-graph-2d")).default

      // We need a React element, but we create it inline via ref
      // Use React 19 createRoot to render into the container
      const { createRoot } = await import("react-dom/client")
      const root = document.createElement("div")
      containerRef.current!.innerHTML = ""
      containerRef.current!.appendChild(root)
      const rootInstance = createRoot(root)

      const colors: Record<string, string> = { person: "#3b82f6", place: "#22c55e", event: "#f59e0b" }

      const el = (
        <ForceGraph2D
          ref={fgRef}
          graphData={{ nodes: data.nodes, links: data.links }}
          nodeLabel="label"
          nodeColor={(node: any) => colors[node.type] || "#6b7280"}
          nodeRelSize={6}
          linkLabel="label"
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          linkCurvature={0.25}
          onNodeClick={(node: any) => onNodeClick?.(node)}
          width={containerRef.current!.clientWidth}
          height={600}
        />
      )

      rootInstance.render(el)
      fgRef.current = { root: rootInstance }
      setLoaded(true)
    }

    loadForceGraph()

    return () => {
      if (fgRef.current?.root) {
        fgRef.current.root.unmount()
      }
    }
  }, [data, onNodeClick])

  if (data.nodes.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">No graph data yet.</p>
  }

  return <div ref={containerRef} className="h-[600px] w-full rounded-lg border overflow-hidden" />
}
