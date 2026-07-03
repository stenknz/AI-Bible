"use client"

import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import type { GraphData } from "@/modules/knowledge-graph/types/graph"

const GraphCanvas = dynamic(
  () => import("reagraph").then((mod) => mod.GraphCanvas),
  { ssr: false }
)

type Props = { data: GraphData }
type VerseRef = { reference: string; text: string }

const TYPE_COLORS: Record<string, string> = {
  person: "#3b82f6",
  place: "#22c55e",
  event: "#f59e0b",
  divine: "#ef4444",
}

export default function GraphView({ data }: Props) {
  const router = useRouter()
  const graphRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [selections, setSelections] = useState<string[]>([])
  const [actives, setActives] = useState<string[]>([])
  const [verseRefs, setVerseRefs] = useState<VerseRef[]>([])
  const [loadingVerse, setLoadingVerse] = useState(false)
  const [search, setSearch] = useState("")

  const reagraphNodes = useMemo(
    () =>
      data.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        fill: TYPE_COLORS[n.type] || "#6b7280",
        data: { type: n.type, group: n.group },
        size: 7,
      })),
    [data.nodes]
  )

  const reagraphEdges = useMemo(
    () =>
      data.links.map((l) => ({
        id: l.id,
        source: l.source,
        target: l.target,
        label: l.label,
        fill: "#94a3b8",
      })),
    [data.links]
  )

  const handleNodeClick = useCallback(async (node: any) => {
    setSelectedNode(node)
    setSelections([node.id])
    setVerseRefs([])
    setLoadingVerse(true)

    try {
      const [type, ...idParts] = node.id.split("-")
      const entityId = idParts.join("-")
      const res = await fetch(`/api/graph/verses?type=${type}&id=${entityId}`)
      if (res.ok) {
        const json = await res.json()
        setVerseRefs(json.verses || [])
      }
    } catch (e) {
      console.error("Failed to load verse refs:", e)
    }
    setLoadingVerse(false)
  }, [])

  const handleCanvasClick = useCallback(() => {
    setSelectedNode(null)
    setSelections([])
    setActives([])
  }, [])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!search.trim()) {
        setActives([])
        setSelections([])
        return
      }
      const q = search.toLowerCase()
      const matchingIds = data.nodes
        .filter((n) => n.label.toLowerCase().includes(q))
        .map((n) => n.id)
      setActives(matchingIds)

      if (matchingIds.length > 0) {
        const first = data.nodes.find((n) => n.id === matchingIds[0])
        if (first) {
          handleNodeClick({ id: first.id, label: first.label, data: { type: first.type, group: first.group } })
        }
      }
    },
    [search, data.nodes, handleNodeClick]
  )

  const linkCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const link of data.links) {
      counts[link.source] = (counts[link.source] || 0) + 1
      counts[link.target] = (counts[link.target] || 0) + 1
    }
    return counts
  }, [data.links])

  if (data.nodes.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No graph data yet.</p>
  }

  return (
    <div className="flex gap-4">
      <div className="flex flex-1 flex-col gap-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people, places, events..."
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Search
          </button>
        </form>

        <div ref={containerRef} className="relative h-[550px] overflow-hidden rounded-lg border">
          <GraphCanvas
            ref={graphRef}
            nodes={reagraphNodes}
            edges={reagraphEdges}
            selections={selections}
            actives={actives}
            sizingType="centrality"
            layoutType="forceDirected2d"
            labelType="all"
            draggable={true}
            animated={true}
            defaultNodeSize={7}
            minNodeSize={5}
            maxNodeSize={18}
            edgeArrowPosition="end"
            edgeInterpolation="curved"
            onNodeClick={handleNodeClick}
            onCanvasClick={handleCanvasClick}
          />

          <div className="absolute right-2 top-2 flex flex-col gap-1">
            <button
              onClick={() => graphRef.current?.fitNodesInView(undefined, { animated: true })}
              className="flex h-8 w-8 items-center justify-center rounded bg-white text-sm shadow hover:bg-gray-100"
              title="Fit to screen"
            >
              ⊞
            </button>
          </div>

          <div className="absolute left-2 bottom-2 rounded bg-white/90 px-3 py-2 text-xs shadow">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: TYPE_COLORS.person }} /> Person
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: TYPE_COLORS.place }} /> Place
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: TYPE_COLORS.event }} /> Event
            </div>
          </div>
        </div>
      </div>

      {selectedNode && (
        <div className="w-72 shrink-0 overflow-y-auto rounded-lg border p-4">
          <div className="mb-1 text-xs uppercase text-muted-foreground">{selectedNode.data?.type}</div>
          <h3 className="mb-2 text-lg font-semibold">{selectedNode.label}</h3>
          {selectedNode.data?.group && (
            <p className="mb-3 text-xs text-muted-foreground">Group: {selectedNode.data.group}</p>
          )}
          <p className="mb-3 text-xs text-muted-foreground">
            {linkCounts[selectedNode.id] || 0} connections
          </p>

          <div className="mb-3 flex gap-2">
            <button
              onClick={() =>
                router.push(`/bible?search=${encodeURIComponent(selectedNode.label)}`)
              }
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
