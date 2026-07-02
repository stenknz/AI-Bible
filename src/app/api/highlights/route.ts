import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { getUserHighlights, upsertHighlight } from "@/modules/bible/services/highlight-service"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const highlights = await getUserHighlights(session.userId)
  const mapped = highlights.map((h) => ({
    id: h.id,
    verseId: h.verseId,
    color: h.color,
    reference: h.verse ? `${h.verse.chapter.book.name} ${h.verse.chapter.number}:${h.verse.number}` : null,
    text: h.verse?.text?.slice(0, 120) ?? null,
  }))
  return NextResponse.json(mapped)
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { verseId, color } = await request.json()
  if (!verseId) return NextResponse.json({ error: "verseId required" }, { status: 400 })
  const highlight = await upsertHighlight(session.userId, verseId, color || "yellow")
  return NextResponse.json(highlight)
}
