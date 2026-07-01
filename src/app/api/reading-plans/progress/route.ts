import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { markDayComplete, getTodayProgress } from "@/modules/reading-plans/services/reading-plan-service"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const progress = await getTodayProgress(session.userId)
  return NextResponse.json(progress)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { planId, dayNumber } = await request.json()
  await markDayComplete(planId, dayNumber, session.userId)
  return NextResponse.json({ success: true })
}
