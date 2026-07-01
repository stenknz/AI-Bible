import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { getAllJourneys } from "@/modules/maps/services/journey-service"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const journeys = await getAllJourneys()
  return NextResponse.json(journeys)
}
