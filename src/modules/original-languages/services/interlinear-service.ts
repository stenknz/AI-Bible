import { prisma } from "@/lib/db"

export type InterlinearWord = {
  position: number
  originalText: string
  transliteration: string
  strongNumber: string
  lemma: string
  morphology: {
    partOfSpeech: string
    tense?: string
    mood?: string
    voice?: string
    person?: string
    number?: string
    gender?: string
    case?: string
    state?: string
  } | null
  translation?: string
}

export type InterlinearVerse = {
  verseId: string
  words: InterlinearWord[]
}

export async function getInterlinear(verseId: string): Promise<InterlinearVerse | null> {
  const mappings = await prisma.interlinearMapping.findMany({
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

  if (mappings.length === 0) return null

  return {
    verseId,
    words: mappings.map((m) => ({
      position: m.position,
      originalText: m.originalWord.text,
      transliteration: m.originalWord.strongNumber.transliteration,
      strongNumber: m.originalWord.strongNumber.number,
      lemma: m.originalWord.lemma,
      morphology: m.originalWord.morphology
        ? {
            partOfSpeech: m.originalWord.morphology.partOfSpeech,
            tense: m.originalWord.morphology.tense ?? undefined,
            mood: m.originalWord.morphology.mood ?? undefined,
            voice: m.originalWord.morphology.voice ?? undefined,
            person: m.originalWord.morphology.person ?? undefined,
            number: m.originalWord.morphology.number ?? undefined,
            gender: m.originalWord.morphology.gender ?? undefined,
            case: m.originalWord.morphology.case ?? undefined,
            state: m.originalWord.morphology.state ?? undefined,
          }
        : null,
      translation: m.translationText ?? undefined,
    })),
  }
}

export async function getStrongs(number: string) {
  return prisma.strongNumber.findUnique({
    where: { number },
    include: {
      words: {
        include: { morphology: true },
        take: 5,
      },
    },
  })
}
