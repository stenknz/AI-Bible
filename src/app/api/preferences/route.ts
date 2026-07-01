import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/modules/auth/services/session"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const prefs = await prisma.userPreference.findUnique({
    where: { userId: session.userId },
  })
  return NextResponse.json(prefs || {})
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = await request.json()
  const prefs = await prisma.userPreference.upsert({
    where: { userId: session.userId },
    update: data,
    create: { userId: session.userId, ...data },
  })
  return NextResponse.json(prefs)
}
