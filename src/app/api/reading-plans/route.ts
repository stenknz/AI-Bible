import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { getUserPlans, createPlan } from "@/modules/reading-plans/services/reading-plan-service"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const plans = await getUserPlans(session.userId)
  return NextResponse.json(plans)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const plan = await createPlan({ userId: session.userId, ...body })
  return NextResponse.json(plan)
}
