import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { markAnswered, deletePrayer } from "@/modules/prayer/services/prayer-service"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const body = await request.json()
  if (body.action === "answer") {
    await markAnswered(id, session.userId, body.answerNotes)
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await deletePrayer(id, session.userId)
  return NextResponse.json({ success: true })
}
