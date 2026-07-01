import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { getAllPlaces, getPlacesByType } from "@/modules/maps/services/geo-service"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")

  const places = type ? await getPlacesByType(type) : await getAllPlaces()
  return NextResponse.json(places)
}
