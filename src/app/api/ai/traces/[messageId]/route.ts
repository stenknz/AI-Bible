import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { getTrace } from "@/modules/ai/services/reasoning-tracer"

export async function GET(request: Request, { params }: { params: Promise<{ messageId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { messageId } = await params

  const trace = await getTrace(messageId)
  if (!trace) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(trace)
}
