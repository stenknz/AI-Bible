import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { searchAll } from "@/modules/search/services/search-service"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || ""
  const book = searchParams.get("book") || undefined

  const results = await searchAll(q, session.userId, book)
  return NextResponse.json(results)
}
