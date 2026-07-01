import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/modules/auth/services/session"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const conversations = await prisma.aIConversation.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  })
  return NextResponse.json(conversations)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, taskType } = await request.json()
  const conversation = await prisma.aIConversation.create({
    data: {
      userId: session.userId,
      title,
      taskType,
    },
  })
  return NextResponse.json(conversation)
}
