import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const id = searchParams.get("id")

  if (!type || !id) {
    return NextResponse.json({ error: "type and id required" }, { status: 400 })
  }

  // Find verse references from EntityRelation
  const prefixedId = `${type}-${id}`
  const relations = await prisma.entityRelation.findMany({
    where: {
      OR: [
        { subjectId: id, subjectType: type, predicate: "mentioned_in" },
        { objectId: id, objectType: type, predicate: "mentioned_in" },
      ],
    },
    include: {
      sourceVerse: {
        include: { chapter: { include: { book: true } } },
      },
    },
    take: 50,
  })

  const verses = relations
    .filter((r) => r.sourceVerse)
    .map((r) => ({
      reference: `${r.sourceVerse!.chapter.book.name} ${r.sourceVerse!.chapter.number}:${r.sourceVerse!.number}`,
      text: r.sourceVerse!.text.slice(0, 120),
    }))

  return NextResponse.json({ verses })
}
