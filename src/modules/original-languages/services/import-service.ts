import { prisma } from "@/lib/db"

export async function importStrongsEntry(
  number: string,
  language: string,
  lemma: string,
  transliteration: string,
  definition: string
) {
  return prisma.strongNumber.upsert({
    where: { number },
    update: { lemma, transliteration, definition, language },
    create: { number, language, lemma, transliteration, definition },
  })
}

export async function getStrongs(number: string) {
  return prisma.strongNumber.findUnique({
    where: { number },
    include: { words: { include: { morphology: true } } },
  })
}

export async function searchLexicon(query: string, language?: string) {
  return prisma.lexicalEntry.findMany({
    where: {
      OR: [
        { lemma: { contains: query, mode: "insensitive" } },
        { definition: { contains: query, mode: "insensitive" } },
      ],
      ...(language ? { language } : {}),
    },
    take: 20,
  })
}

export async function getLexiconEntry(lemma: string) {
  return prisma.lexicalEntry.findUnique({
    where: { lemma },
  })
}

export async function getWordMorphology(verseId: string) {
  return prisma.interlinearMapping.findMany({
    where: { verseId },
    orderBy: { position: "asc" },
    include: {
      originalWord: {
        include: {
          strongNumber: true,
          morphology: true,
        },
      },
    },
  })
}
