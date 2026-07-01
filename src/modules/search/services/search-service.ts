import { prisma } from "@/lib/db"

type SearchResult = {
  id: string
  type: "verse" | "note" | "highlight"
  text: string
  reference?: string
  score: number
}

export async function searchAll(query: string, userId: string, bookFilter?: string): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const results: SearchResult[] = []
  const q = query.trim()

  const verses = await prisma.verse.findMany({
    where: {
      text: { contains: q, mode: "insensitive" },
      ...(bookFilter ? { chapter: { book: { name: bookFilter } } } : {}),
    },
    take: 50,
    select: {
      id: true,
      text: true,
      number: true,
      chapter: {
        select: {
          number: true,
          book: { select: { name: true, translation: { select: { code: true } } } },
        },
      },
    },
  })

  results.push(
    ...verses.map((v) => ({
      id: v.id,
      type: "verse" as const,
      text: v.text.slice(0, 200),
      reference: `${v.chapter.book.name} ${v.chapter.number}:${v.number} (${v.chapter.book.translation.code})`,
      score: 1.0,
    }))
  )

  const notes = await prisma.note.findMany({
    where: {
      userId,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ],
    },
    take: 20,
    select: {
      id: true,
      title: true,
      tags: true,
    },
  })

  results.push(
    ...notes.map((n) => ({
      id: n.id,
      type: "note" as const,
      text: n.title || "Untitled note",
      reference: `Tags: ${n.tags.join(", ")}`,
      score: 0.8,
    }))
  )

  return results.sort((a, b) => b.score - a.score)
}
