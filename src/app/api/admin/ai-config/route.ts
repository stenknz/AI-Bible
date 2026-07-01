import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/modules/auth/services/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const configs = await prisma.aIModelConfig.findMany()
  return NextResponse.json(configs)
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const body = await request.json()
  const config = await prisma.aIModelConfig.upsert({
    where: { taskType: body.taskType },
    update: {
      provider: body.provider,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      isActive: body.isActive ?? true,
    },
    create: {
      taskType: body.taskType,
      provider: body.provider,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      isActive: body.isActive ?? true,
    },
  })
  return NextResponse.json(config)
}
