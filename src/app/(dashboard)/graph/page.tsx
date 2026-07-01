import { getFullGraph } from "@/modules/knowledge-graph/services/graph-service"
import { GraphView } from "@/modules/knowledge-graph/components/GraphView"

export default async function GraphPage() {
  const data = await getFullGraph()

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
