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

export type ContextSource = {
  verseId?: string
  noteId?: string
  reference?: string
  entityType?: string
  entityId?: string
}

const SOURCE_TYPE_MAP: Record<string, { sourceType: string; name: string; citationFormat: string }> = {
  verse: { sourceType: "translation", name: "Bible Translation", citationFormat: "Book Chapter:Verse (Translation)" },
  dictionary: { sourceType: "lexicon", name: "Easton's/Smith's Bible Dictionary", citationFormat: "Dictionary Entry — Title" },
  commentary: { sourceType: "commentary", name: "Matthew Henry Commentary", citationFormat: "Commentary — Book Chapter:Verse" },
  topic: { sourceType: "topical", name: "Nave's Topical Bible", citationFormat: "Topic — Name" },
}

export async function enforceCitations(
  aiOutput: string,
  contextSources: ContextSource[]
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

    if (source.entityType && source.entityId) {
      let ref = source.reference || ""
      let text = ""

      if (source.entityType === "dictionary") {
        const entry = await prisma.dictionaryEntry.findUnique({ where: { id: source.entityId } })
        if (entry) {
          ref = ref || entry.title
          text = entry.content.slice(0, 200)
          const found = aiOutput.includes(entry.title) || aiOutput.includes(ref)
          if (found) {
            citations.push({ entityType: "dictionary", entityId: entry.id, reference: ref, text, isScripture: false, confidence: 1.0 })
          }
        }
      } else if (source.entityType === "commentary") {
        const entry = await prisma.commentaryEntry.findUnique({ where: { id: source.entityId } })
        if (entry) {
          ref = ref || entry.title
          text = entry.content.slice(0, 200)
          const found = aiOutput.includes(entry.title) || aiOutput.includes(ref)
          if (found) {
            citations.push({ entityType: "commentary", entityId: entry.id, reference: ref, text, isScripture: false, confidence: 1.0 })
          }
        }
      } else if (source.entityType === "topic") {
        const entry = await prisma.topicEntry.findUnique({ where: { id: source.entityId } })
        if (entry) {
          ref = ref || entry.topic
          text = entry.description || ""
          const found = aiOutput.includes(entry.topic) || aiOutput.includes(ref)
          if (found) {
            citations.push({ entityType: "topic", entityId: entry.id, reference: ref, text, isScripture: false, confidence: 1.0 })
          }
        }
      }
    }
  }

  return { citedText: aiOutput, citations, uncitedClaims }
}

export async function persistCitations(
  aimessageId: string,
  citations: CitationData[],
  defaultSourceType: string = "translation"
) {
  for (const citation of citations) {
    const config = SOURCE_TYPE_MAP[citation.entityType] || { sourceType: defaultSourceType, name: "Knowledge Source", citationFormat: "Reference" }

    let source = await prisma.knowledgeSource.findFirst({
      where: { sourceType: config.sourceType, name: config.name },
    })

    if (!source) {
      source = await prisma.knowledgeSource.create({
        data: { name: config.name, sourceType: config.sourceType, citationFormat: config.citationFormat },
      })
    }

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
