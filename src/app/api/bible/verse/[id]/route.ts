import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const verse = await prisma.verse.findUnique({
    where: { id },
    include: { chapter: { include: { book: true } } },
  })
  if (!verse) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({
    id: verse.id,
    text: verse.text,
    reference: `${verse.chapter.book.name} ${verse.chapter.number}:${verse.number}`,
    bookNumber: verse.chapter.book.number,
    chapterNumber: verse.chapter.number,
    verseNumber: verse.number,
  })
}
