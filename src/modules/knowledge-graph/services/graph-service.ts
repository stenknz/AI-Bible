import { prisma } from "@/lib/db"
import type { GraphData, GraphNode, GraphEdge } from "@/modules/knowledge-graph/types/graph"

export async function getFullGraph(): Promise<GraphData> {
  const [relations, persons, places, events] = await Promise.all([
    prisma.entityRelation.findMany(),
    prisma.person.findMany({ select: { id: true, name: true, personType: true } }),
    prisma.place.findMany({ select: { id: true, name: true, placeType: true } }),
    prisma.timelineEntry.findMany({ select: { id: true, title: true, entityType: true } }),
  ])

  const nodes: GraphNode[] = [
    ...persons.map((p) => ({ id: `person-${p.id}`, label: p.name, type: "person" as const, group: p.personType })),
    ...places.map((p) => ({ id: `place-${p.id}`, label: p.name, type: "place" as const, group: p.placeType })),
    ...events.map((e) => ({ id: `event-${e.id}`, label: e.title, type: "event" as const, group: e.entityType ?? "event" })),
  ]

  const nodeIds = new Set(nodes.map((n) => n.id))

  const links: GraphEdge[] = relations
    .map((r) => ({
      id: r.id,
      source: `${r.subjectType}-${r.subjectId}`,
      target: `${r.objectType}-${r.objectId}`,
      label: r.predicate,
    }))
    .filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target))

  return { nodes, links }
}

export async function getEntityGraph(entityType: string, entityId: string): Promise<GraphData> {
  const relations = await prisma.entityRelation.findMany({
    where: {
      OR: [
        { subjectType: entityType, subjectId: entityId },
        { objectType: entityType, objectId: entityId },
      ],
    },
  })

  const relatedIds = new Set<string>()
  relations.forEach((r) => {
    relatedIds.add(`${r.subjectType}-${r.subjectId}`)
    relatedIds.add(`${r.objectType}-${r.objectId}`)
  })

  const nodes: GraphNode[] = []

  const personIds = [...relatedIds].filter((id) => id.startsWith("person-")).map((id) => id.replace("person-", ""))
  const placeIds = [...relatedIds].filter((id) => id.startsWith("place-")).map((id) => id.replace("place-", ""))
  const eventIds = [...relatedIds].filter((id) => id.startsWith("event-")).map((id) => id.replace("event-", ""))

  if (personIds.length > 0) {
    const persons = await prisma.person.findMany({ where: { id: { in: personIds } }, select: { id: true, name: true, personType: true } })
    nodes.push(...persons.map((p) => ({ id: `person-${p.id}`, label: p.name, type: "person" as const, group: p.personType })))
  }
  if (placeIds.length > 0) {
    const places = await prisma.place.findMany({ where: { id: { in: placeIds } }, select: { id: true, name: true, placeType: true } })
    nodes.push(...places.map((p) => ({ id: `place-${p.id}`, label: p.name, type: "place" as const, group: p.placeType })))
  }
  if (eventIds.length > 0) {
    const events = await prisma.timelineEntry.findMany({ where: { id: { in: eventIds } }, select: { id: true, title: true, entityType: true } })
    nodes.push(...events.map((e) => ({ id: `event-${e.id}`, label: e.title, type: "event" as const, group: e.entityType ?? "event" })))
  }

  const nodeIds = new Set(nodes.map((n) => n.id))

  const links: GraphEdge[] = relations
    .map((r) => ({
      id: r.id,
      source: `${r.subjectType}-${r.subjectId}`,
      target: `${r.objectType}-${r.objectId}`,
      label: r.predicate,
    }))
    .filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target))

  return { nodes, links }
}
