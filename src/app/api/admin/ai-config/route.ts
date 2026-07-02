import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/modules/auth/services/session"
import { encryptApiKey } from "@/modules/ai/services/secrets"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const configs = await prisma.aIModelConfig.findMany()
  const safe = configs.map((c) => ({
    ...c,
    apiKeyEncrypted: c.apiKeyEncrypted ? "••••••••" : null,
  }))
  return NextResponse.json(safe)
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const body = await request.json()
  const data: Record<string, unknown> = {
    provider: body.provider,
    model: body.model,
    temperature: body.temperature,
    maxTokens: body.maxTokens,
    isActive: body.isActive ?? true,
  }

  if (body.apiKey !== undefined) {
    data.apiKeyEncrypted = body.apiKey ? encryptApiKey(body.apiKey) : null
  }

  const config = await prisma.aIModelConfig.upsert({
    where: { taskType: body.taskType },
    update: data as any,
    create: {
      taskType: body.taskType,
      provider: body.provider,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      isActive: body.isActive ?? true,
      ...(body.apiKey ? { apiKeyEncrypted: encryptApiKey(body.apiKey) } : {}),
    },
  })
  return NextResponse.json({
    ...config,
    apiKeyEncrypted: config.apiKeyEncrypted ? "••••••••" : null,
  })
}
