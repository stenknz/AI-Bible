import { prisma } from "@/lib/db"
export const dynamic = "force-dynamic"


export default async function AdminDashboardPage() {
  const [translationCount, userCount, verseCount] = await Promise.all([
    prisma.translation.count(),
    prisma.user.count(),
    prisma.verse.count(),
  ])

  return (
    <div className="grid gap-4 sm:grid-cols-3 animate-fade-in">
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
    </div>
  )
}
