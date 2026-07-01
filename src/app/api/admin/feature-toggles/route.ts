import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/modules/auth/services/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  const toggles = await prisma.featureToggle.findMany()
  return NextResponse.json(toggles)
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  const { key, enabled } = await request.json()
  const toggle = await prisma.featureToggle.upsert({
    where: { key },
    update: { enabled },
    create: { key, enabled },
  })
  return NextResponse.json(toggle)
}
