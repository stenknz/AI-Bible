import { NextResponse } from "next/server"
import { resolveEntity } from "@/modules/knowledge/services/entity-resolution"
import type { KnowledgeEntityType } from "@/modules/knowledge/types/knowledge"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; slug: string }> }
) {
  const { type, slug } = await params

  const entity = await resolveEntity(type as KnowledgeEntityType, slug)
  if (!entity) {
    return NextResponse.json({ error: "Entity not found" }, { status: 404 })
  }

  return NextResponse.json(entity)
}
