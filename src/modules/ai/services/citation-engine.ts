import { prisma } from "@/lib/db"

export type CitationData = {
  entityType: string
  entityId: string
  reference: string
  text: string
  isScripture: boolean
  confidence: number
}

export type CitationResult = {
  citedText: string
  citations: CitationData[]
  uncitedClaims: string[]
}

export async function enforceCitations(
  aiOutput: string,
  contextSources: { verseId?: string; noteId?: string; reference?: string }[]
): Promise<CitationResult> {
  const citations: CitationData[] = []
  const uncitedClaims: string[] = []

  for (const source of contextSources) {
    if (source.verseId) {
      const verse = await prisma.verse.findUnique({
        where: { id: source.verseId },
        include: { chapter: { include: { book: { include: { translation: true } } } } },
      })
      if (verse) {
        const ref = `${verse.chapter.book.name} ${verse.chapter.number}:${verse.number} (${verse.chapter.book.translation.code})`
        const found = aiOutput.includes(ref) || aiOutput.includes(`${verse.chapter.number}:${verse.number}`)
        if (found) {
          citations.push({
            entityType: "verse",
            entityId: verse.id,
            reference: ref,
            text: verse.text.slice(0, 200),
            isScripture: true,
            confidence: 1.0,
          })
        } else {
          uncitedClaims.push(`Verse ${ref} referenced in context but not cited in output`)
        }
      }
    }
  }

  return {
    citedText: aiOutput,
    citations,
    uncitedClaims,
  }
}

export async function persistCitations(
  aimessageId: string,
  citations: CitationData[],
  sourceType: string = "translation"
) {
  let source = await prisma.knowledgeSource.findFirst({
    where: { sourceType, name: "Bible Translation" },
  })

  if (!source) {
    source = await prisma.knowledgeSource.create({
      data: { name: "Bible Translation", sourceType, citationFormat: "Book Chapter:Verse (Translation)" },
    })
  }

  for (const citation of citations) {
    await prisma.citation.create({
      data: {
        aimessageId,
        sourceId: source.id,
        entityId: citation.entityId,
        entityType: citation.entityType,
        referenceText: citation.reference,
        quote: citation.text,
        isDirectQuote: citation.isScripture,
      },
    })
  }
}
