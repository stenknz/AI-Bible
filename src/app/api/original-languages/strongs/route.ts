import { NextResponse } from "next/server"
import { getStrongs, searchLexicon } from "@/modules/original-languages/services/import-service"
import { getSession } from "@/modules/auth/services/session"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const number = searchParams.get("number")
  const search = searchParams.get("search")

  if (number) {
    const entry = await getStrongs(number)
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(entry)
  }

  if (search) {
    const results = await searchLexicon(search)
    return NextResponse.json(results)
  }

  return NextResponse.json({ error: "Provide number or search" }, { status: 400 })
}
