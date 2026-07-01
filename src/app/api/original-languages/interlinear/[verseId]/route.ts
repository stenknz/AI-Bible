import { NextResponse } from "next/server"
import { getInterlinear } from "@/modules/original-languages/services/interlinear-service"
import { getSession } from "@/modules/auth/services/session"

export async function GET(request: Request, { params }: { params: Promise<{ verseId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { verseId } = await params
  const data = await getInterlinear(verseId)
  if (!data) return NextResponse.json({ error: "No interlinear data" }, { status: 404 })
  return NextResponse.json(data)
}
