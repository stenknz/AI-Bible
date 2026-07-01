import { prisma } from "@/lib/db"

type GraphPathNode = { id: string; type: string; label: string }
type GraphPathEdge = { source: string; target: string; predicate: string }
type GraphPath = { nodes: GraphPathNode[]; edges: GraphPathEdge[] }

export async function bfsTraversal(
  startId: string,
  startType: string,
  maxDepth: number = 3
): Promise<GraphPath> {
  const visited = new Set<string>()
  const nodes: GraphPathNode[] = []
  const edges: GraphPathEdge[] = []
  const queue: { id: string; type: string; depth: number }[] = [{ id: startId, type: startType, depth: 0 }]
  visited.add(`${startType}-${startId}`)

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current.depth >= maxDepth) continue

    const relations = await prisma.entityRelation.findMany({
      where: {
        OR: [
          { subjectType: current.type, subjectId: current.id },
          { objectType: current.type, objectId: current.id },
        ],
      },
    })

    for (const rel of relations) {
      const sourceKey = `${rel.subjectType}-${rel.subjectId}`
      const targetKey = `${rel.objectType}-${rel.objectId}`

      edges.push({
        source: sourceKey,
        target: targetKey,
        predicate: rel.predicate,
      })

      for (const [key, type, id] of [[sourceKey, rel.subjectType, rel.subjectId], [targetKey, rel.objectType, rel.objectId]] as const) {
        if (!visited.has(key)) {
          visited.add(key)
          nodes.push({ id: key, type, label: id })
          queue.push({ id, type, depth: current.depth + 1 })
        }
      }
    }
  }

  return { nodes, edges }
}
