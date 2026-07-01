"use client"

import { useEffect, useRef, useCallback } from "react"
import ForceGraph2D from "react-force-graph-2d"
import type { GraphData } from "@/modules/knowledge-graph/types/graph"

type Props = {
  data: GraphData
  onNodeClick?: (node: any) => void
}

export function GraphView({ data, onNodeClick }: Props) {
  const fgRef = useRef<any>(null)

  const handleNodeClick = useCallback(
    (node: any) => {
      onNodeClick?.(node)
    },
    [onNodeClick]
  )

  if (data.nodes.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">No graph data yet.</p>
  }

  return (
    <div className="h-[600px] w-full rounded-lg border overflow-hidden">
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        nodeLabel="label"
        nodeColor={(node: any) => {
          const colors: Record<string, string> = {
            person: "#3b82f6",
            place: "#22c55e",
            event: "#f59e0b",
          }
          return colors[node.type] || "#6b7280"
        }}
        nodeRelSize={6}
        linkLabel="label"
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.25}
        onNodeClick={handleNodeClick}
        width={0}
        height={0}
      />
    </div>
  )
}
