import { getFullGraph } from "@/modules/knowledge-graph/services/graph-service"
export const dynamic = "force-dynamic"

import DynamicGraph from "./DynamicGraph"

export default async function GraphPage() {
  const data = await getFullGraph()
  return <DynamicGraph data={data} />
}
