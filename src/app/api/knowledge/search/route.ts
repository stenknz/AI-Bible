import { NextRequest, NextResponse } from "next/server"
import { unifiedSearch } from "@/modules/knowledge/services/unified-search"
import type { KnowledgeEntityType } from "@/modules/knowledge/types/knowledge"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")
  const typesParam = searchParams.get("includeTypes")

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
  }

  const types = typesParam
    ? (typesParam.split(",") as KnowledgeEntityType[])
    : undefined

  const results = await unifiedSearch(q, types)

  const grouped: Record<string, typeof results> = {}
  for (const r of results) {
    if (!grouped[r.entityType]) grouped[r.entityType] = []
    grouped[r.entityType].push(r)
  }

  return NextResponse.json({
    query: q,
    results: grouped,
    totalResults: results.length,
  })
}
