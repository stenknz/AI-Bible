import { prisma } from "@/lib/db"
export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const [translationCount, userCount, verseCount, dictionaryCount, commentaryCount, topicCount] = await Promise.all([
    prisma.translation.count(),
    prisma.user.count(),
    prisma.verse.count(),
    prisma.dictionaryEntry.count(),
    prisma.commentaryEntry.count(),
    prisma.topicEntry.count(),
  ])

  return (
    <div className="animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Translations</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{translationCount}</p>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Users</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{userCount}</p>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Verses</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{verseCount}</p>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Dictionary Entries</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{dictionaryCount}</p>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Commentaries</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{commentaryCount}</p>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Topics</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{topicCount}</p>
        </div>
      </div>
    </div>
  )
}
