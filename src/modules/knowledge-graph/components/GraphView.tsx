"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import ForceGraph2D from "react-force-graph-2d"
import type { GraphData } from "@/modules/knowledge-graph/types/graph"

type Props = {
  data: GraphData
  onNodeClick?: (node: any) => void
}

export default function GraphView({ data, onNodeClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ width: 0, height: 0 })
  const fgRef = useRef<any>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 0 && height > 0) setDims({ width, height })
    }

    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleNodeClick = useCallback((node: any) => onNodeClick?.(node), [onNodeClick])

  if (data.nodes.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No graph data yet.</p>
  }

  const ready = dims.width > 0 && dims.height > 0

  return (
    <div ref={containerRef} className="h-[600px] w-full overflow-hidden rounded-lg border">
      {ready ? (
        <ForceGraph2D
          ref={fgRef}
          graphData={{ nodes: data.nodes, links: data.links }}
          width={dims.width}
          height={dims.height}
          nodeLabel="label"
          nodeColor={(node: any) => {
            const c: Record<string, string> = { person: "#3b82f6", place: "#22c55e", event: "#f59e0b" }
            return c[node.type] || "#6b7280"
          }}
          nodeRelSize={6}
          linkLabel="label"
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          linkCurvature={0.25}
          onNodeClick={handleNodeClick}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Loading graph...
        </div>
      )}
    </div>
  )
}
