import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { upsertPlaybackState } from "@/modules/audio/services/audio-service"

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { recordingId, position, speed, volume, isPlaying } = await request.json()
  const state = await upsertPlaybackState(session.userId, recordingId, {
    position,
    speed,
    volume,
    isPlaying,
  })
  return NextResponse.json(state)
}
