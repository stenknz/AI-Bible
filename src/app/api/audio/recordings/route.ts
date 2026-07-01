import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { getRecordings } from "@/modules/audio/services/audio-service"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const entityId = searchParams.get("entityId")
  const entityType = searchParams.get("entityType")

  if (!entityId || !entityType) {
    return NextResponse.json({ error: "entityId and entityType required" }, { status: 400 })
  }

  const recordings = await getRecordings(entityId, entityType)
  return NextResponse.json(recordings)
}
