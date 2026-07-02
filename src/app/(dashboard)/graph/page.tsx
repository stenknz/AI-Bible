import { getFullGraph } from "@/modules/knowledge-graph/services/graph-service"
export const dynamic = "force-dynamic"

import GraphClient from "./GraphClient"

export default async function GraphPage() {
  const data = await getFullGraph()
  return <GraphClient data={data} />
}
