import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { removeBookmark } from "@/modules/bible/services/bookmark-service"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await removeBookmark(session.userId, id)
  return NextResponse.json({ success: true })
}
