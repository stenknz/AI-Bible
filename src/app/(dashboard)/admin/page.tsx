import { prisma } from "@/lib/db"

export default async function AdminDashboardPage() {
  const [translationCount, userCount, verseCount] = await Promise.all([
    prisma.translation.count(),
    prisma.user.count(),
    prisma.verse.count(),
  ])

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Translations</p>
        <p className="text-2xl font-semibold">{translationCount}</p>
      </div>
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Users</p>
        <p className="text-2xl font-semibold">{userCount}</p>
      </div>
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Verses</p>
        <p className="text-2xl font-semibold">{verseCount}</p>
      </div>
    </div>
  )
}
