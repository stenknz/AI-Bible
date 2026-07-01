import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { getCategories, createCategory } from "@/modules/prayer/services/prayer-service"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const categories = await getCategories(session.userId)
  return NextResponse.json(categories)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const category = await createCategory({ userId: session.userId, ...body })
  return NextResponse.json(category)
}
