import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { getUserBookmarks, addBookmark } from "@/modules/bible/services/bookmark-service"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const bookmarks = await getUserBookmarks(session.userId)
  return NextResponse.json(bookmarks)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { verseId, label } = await request.json()
  if (!verseId) return NextResponse.json({ error: "verseId required" }, { status: 400 })
  const bookmark = await addBookmark(session.userId, verseId, label)
  return NextResponse.json(bookmark)
}
