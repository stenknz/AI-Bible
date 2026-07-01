import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/modules/auth/services/session"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const { content, role } = await request.json()

  const message = await prisma.aIMessage.create({
    data: {
      conversationId: id,
      role: role || "user",
      content,
    },
  })

  await prisma.aIConversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json(message)
}
