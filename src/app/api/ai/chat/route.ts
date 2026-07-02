import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/modules/auth/services/session"
import { verseExplanationHandler } from "@/modules/ai/tasks/verse-explanation"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { message, conversationId, taskType, verseIds } = await request.json()

  let conversation
  if (conversationId) {
    conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId: session.userId },
    })
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 })
  } else {
    conversation = await prisma.aIConversation.create({
      data: {
        userId: session.userId,
        title: message.slice(0, 100),
        taskType: taskType || "theological_question_answering",
      },
    })
  }

  await prisma.aIMessage.create({
    data: { conversationId: conversation.id, role: "user", content: message },
  })

  let response: string
  try {
    response = await verseExplanationHandler.handle({
      query: message,
      verseIds,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  await prisma.aIMessage.create({
    data: { conversationId: conversation.id, role: "assistant", content: response },
  })

  await prisma.aIConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json({
    response,
    conversationId: conversation.id,
  })
}
