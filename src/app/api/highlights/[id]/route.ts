import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { removeHighlight } from "@/modules/bible/services/highlight-service"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await removeHighlight(session.userId, id)
  return NextResponse.json({ success: true })
}
