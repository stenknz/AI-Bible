import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development" }, { status: 403 })
  }

  const [users, books, chapters, verses, notes, highlights, prayers, places, timeline, plans] =
    await Promise.all([
      prisma.user.count(),
      prisma.book.count({ where: { translation: { code: "KJV" } } }),
      prisma.chapter.count({ where: { book: { translation: { code: "KJV" } } } }),
      prisma.verse.count({ where: { chapter: { book: { translation: { code: "KJV" } } } } }),
      prisma.note.count(),
      prisma.highlight.count(),
      prisma.prayerRequest.count(),
      prisma.place.count(),
      prisma.timelineEntry.count(),
      prisma.readingPlanTemplate.count(),
    ])

  return NextResponse.json({ users, books, chapters, verses, notes, highlights, prayers, places, timeline, plans })
}
