import { NextResponse } from "next/server"
import { getChapter } from "@/modules/bible/services/bible-service"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ translation: string; book: string; chapter: string }> }
) {
  const { translation, book, chapter } = await params
  const bookNum = parseInt(book, 10)
  const chapterNum = parseInt(chapter, 10)
  const data = await getChapter(bookNum, chapterNum, translation)
  if (!data) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
  }
  return NextResponse.json(data)
}
