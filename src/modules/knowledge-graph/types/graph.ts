export type GraphNode = {
  id: string
  label: string
  type: string
  group?: string
}

export type GraphEdge = {
  id: string
  source: string
  target: string
  label: string
}

export type GraphData = {
  nodes: GraphNode[]
  links: GraphEdge[]
}
