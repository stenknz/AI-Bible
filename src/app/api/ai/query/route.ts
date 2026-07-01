import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { query } from "@/modules/ai/services/unified-query"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const result = await query({
    naturalLanguage: body.message || body.query,
    verseIds: body.verseIds,
    requireCitations: body.requireCitations ?? true,
  })

  return NextResponse.json(result)
}
