import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { getPrayers, createPrayer, getCategories, createCategory } from "@/modules/prayer/services/prayer-service"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const prayers = await getPrayers(session.userId)
  return NextResponse.json(prayers)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const prayer = await createPrayer({ userId: session.userId, ...body })
  return NextResponse.json(prayer)
}
