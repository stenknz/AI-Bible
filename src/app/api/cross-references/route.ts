import { NextResponse } from "next/server"
import { getCrossReferences } from "@/modules/bible/services/cross-reference-service"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const verseId = searchParams.get("verseId")
  if (!verseId) return NextResponse.json({ error: "verseId required" }, { status: 400 })
  const refs = await getCrossReferences(verseId)
  return NextResponse.json(refs)
}
