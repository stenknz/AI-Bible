"use client"

import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import ForceGraph2D from "react-force-graph-2d"
import type { GraphData, GraphNode } from "@/modules/knowledge-graph/types/graph"

type Props = { data: GraphData }
type VerseRef = { reference: string; text: string }

const TYPE_COLORS: Record<string, string> = {
  person: "#3b82f6", place: "#22c55e", event: "#f59e0b", divine: "#ef4444",
}

export default function GraphView({ data }: Props) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ width: 0, height: 0 })
  const fgRef = useRef<any>(null)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [verseRefs, setVerseRefs] = useState<VerseRef[]>([])
  const [loadingVerse, setLoadingVerse] = useState(false)
  const [search, setSearch] = useState("")
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set())

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

  // Compute node connection counts for sizing
  const linkCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const link of data.links) {
      counts[link.source as string] = (counts[link.source as string] || 0) + 1
      counts[link.target as string] = (counts[link.target as string] || 0) + 1
    }
    return counts
  }, [data.links])

  // Zoom to fit on initial load
  useEffect(() => {
    if (fgRef.current && dims.width > 0) {
      setTimeout(() => fgRef.current.zoomToFit(400, 80), 500)
    }
  }, [dims])

  const handleNodeClick = useCallback(async (node: any) => {
    setSelectedNode(node)
    setVerseRefs([])
    setLoadingVerse(true)
    fgRef.current?.centerAt(node.x, node.y, 400)
    fgRef.current?.zoom(2.5, 400)

    try {
      const [type, ...idParts] = node.id.split("-")
      const entityId = idParts.join("-")
      const res = await fetch(`/api/graph/verses?type=${type}&id=${entityId}`)
      if (res.ok) {
        const data = await res.json()
        setVerseRefs(data.verses || [])
      }
    } catch (e) { console.error("Failed to load verse refs:", e) }
    setLoadingVerse(false)
  }, [])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) { setHighlightNodes(new Set()); return }
    const q = search.toLowerCase()
    const matching = new Set<string>()
    for (const node of data.nodes) {
      if (node.label.toLowerCase().includes(q)) matching.add(node.id)
    }
    setHighlightNodes(matching)
    if (matching.size > 0) {
      const first = data.nodes.find((n: any) => matching.has(n.id))
      if (first) {
        const fx = (first as any).x || 0
        const fy = (first as any).y || 0
        fgRef.current?.centerAt(fx, fy, 400)
        fgRef.current?.zoom(3, 400)
        handleNodeClick(first)
      }
    }
  }, [search, data.nodes, handleNodeClick])

  if (data.nodes.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No graph data yet.</p>
  }

  const ready = dims.width > 0 && dims.height > 0

  return (
    <div className="flex gap-4">
      <div className="flex flex-1 flex-col gap-2">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people, places, events..."
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            Search
          </button>
        </form>

        <div ref={containerRef} className="h-[550px] overflow-hidden rounded-lg border relative">
          {ready && (
            <ForceGraph2D
              ref={fgRef}
              graphData={{ nodes: data.nodes, links: data.links as any }}
              width={dims.width}
              height={dims.height}
              nodeLabel={(node: any) => `${node.label} (${node.type}) — ${linkCounts[node.id] || 0} connections`}
              nodeColor={(node: any) => {
                if (highlightNodes.size > 0 && !highlightNodes.has(node.id)) return "#e5e5e5"
                return TYPE_COLORS[node.type] || "#6b7280"
              }}
              nodeVal={(node: any) => Math.max(3, (linkCounts[node.id] || 0) * 2 + 4)}
              linkColor={(link: any) => {
                if (highlightNodes.size > 0) {
                  const src = typeof link.source === "object" ? (link.source as any).id : link.source
                  const tgt = typeof link.target === "object" ? (link.target as any).id : link.target
                  if (!highlightNodes.has(src) && !highlightNodes.has(tgt)) return "#e5e5e5"
                }
                return "#999"
              }}
              linkLabel="label"
              linkDirectionalArrowLength={6}
              linkDirectionalArrowRelPos={1}
              linkCurvature={0.25}
              onNodeClick={handleNodeClick}
              onBackgroundClick={() => setSelectedNode(null)}
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
              cooldownTicks={100}
              warmupTicks={200}
            />
          )}

          {/* Controls */}
          <div className="absolute right-2 top-2 flex flex-col gap-1">
            <button onClick={() => fgRef.current?.zoomToFit(400, 80)} className="flex h-8 w-8 items-center justify-center rounded bg-white text-sm shadow hover:bg-gray-100" title="Fit to screen">⊞</button>
            <button onClick={() => fgRef.current?.zoom(1.5, 200)} className="flex h-8 w-8 items-center justify-center rounded bg-white text-sm shadow hover:bg-gray-100" title="Zoom in">+</button>
            <button onClick={() => fgRef.current?.zoom(0.67, 200)} className="flex h-8 w-8 items-center justify-center rounded bg-white text-sm shadow hover:bg-gray-100" title="Zoom out">−</button>
          </div>

          {/* Legend */}
          <div className="absolute left-2 bottom-2 rounded bg-white/90 px-3 py-2 text-xs shadow">
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-500" /> Person</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-green-500" /> Place</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500" /> Event</div>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <div className="w-72 shrink-0 overflow-y-auto rounded-lg border p-4">
          <div className="mb-1 text-xs text-muted-foreground uppercase">{selectedNode.type}</div>
          <h3 className="mb-2 text-lg font-semibold">{selectedNode.label}</h3>
          {selectedNode.group && (
            <p className="mb-3 text-xs text-muted-foreground">Group: {selectedNode.group}</p>
          )}
          <p className="mb-3 text-xs text-muted-foreground">{linkCounts[selectedNode.id] || 0} connections</p>

          <div className="mb-3 flex gap-2">
            <button
              onClick={() => router.push(`/bible?search=${encodeURIComponent(selectedNode.label)}`)}
              className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
            >
              Search in Bible
            </button>
          </div>

          <h4 className="mb-2 text-xs font-semibold text-muted-foreground">Related Verses</h4>
          {loadingVerse ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : verseRefs.length > 0 ? (
            <div className="space-y-2">
              {verseRefs.slice(0, 15).map((vr, i) => (
                <div key={i} className="rounded bg-muted p-2">
                  <span className="text-xs font-medium text-blue-600">{vr.reference}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">{vr.text}</p>
                </div>
              ))}
              {verseRefs.length > 15 && (
                <p className="text-xs text-muted-foreground">+{verseRefs.length - 15} more</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No verse references found for this entity.</p>
          )}
        </div>
      )}
    </div>
  )
}
