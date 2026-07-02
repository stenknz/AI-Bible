import { prisma } from "@/lib/db"

export async function getCrossReferences(verseId: string) {
  const refs = await prisma.crossReference.findMany({
    where: { fromVerseId: verseId },
    include: {
      toVerse: {
        include: {
          chapter: { include: { book: true } },
        },
      },
    },
    orderBy: { weight: "desc" },
    take: 20,
  })
  return refs.map((r) => ({
    toVerseId: r.toVerseId,
    reference: `${r.toVerse.chapter.book.name} ${r.toVerse.chapter.number}:${r.toVerse.number}`,
    text: r.toVerse.text.slice(0, 100),
    weight: r.weight,
  }))
}
