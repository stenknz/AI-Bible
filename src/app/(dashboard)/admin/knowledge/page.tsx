import { prisma } from "@/lib/db"
export const dynamic = "force-dynamic"

export default async function KnowledgeAdminPage() {
  const [
    dictionaryCount, commentaryCount, topicCount,
    bibleEventCount, nationCount, mediaCount,
    relationCount, citationCount, embeddingCount,
  ] = await Promise.all([
    prisma.dictionaryEntry.count(),
    prisma.commentaryEntry.count(),
    prisma.topicEntry.count(),
    prisma.bibleEvent.count(),
    prisma.nation.count(),
    prisma.media.count(),
    prisma.entityRelation.count(),
    prisma.citation.count(),
    prisma.embedding.count(),
  ])

  const stats = [
    { label: "Dictionary Entries", value: dictionaryCount },
    { label: "Commentary Entries", value: commentaryCount },
    { label: "Topics", value: topicCount },
    { label: "Bible Events", value: bibleEventCount },
    { label: "Nations", value: nationCount },
    { label: "Media", value: mediaCount },
    { label: "Entity Relations", value: relationCount },
    { label: "Citations", value: citationCount },
    { label: "Embeddings", value: embeddingCount },
  ]

  return (
    <div className="animate-fade-in">
      <h2 className="mb-6 text-lg font-semibold">Knowledge Platform</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
