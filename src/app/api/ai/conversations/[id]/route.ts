import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/modules/auth/services/session"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const conversation = await prisma.aIConversation.findFirst({
    where: { id, userId: session.userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  })
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(conversation)
}
