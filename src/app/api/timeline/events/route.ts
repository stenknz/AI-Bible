import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { getAllEvents, getEventsByPeriod } from "@/modules/timeline/services/timeline-service"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const periodId = searchParams.get("periodId")

  const events = periodId ? await getEventsByPeriod(periodId) : await getAllEvents()
  return NextResponse.json(events)
}
