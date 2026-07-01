import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { getFullGraph, getEntityGraph } from "@/modules/knowledge-graph/services/graph-service"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get("entityType")
  const entityId = searchParams.get("entityId")

  const data = entityType && entityId
    ? await getEntityGraph(entityType, entityId)
    : await getFullGraph()

  return NextResponse.json(data)
}
