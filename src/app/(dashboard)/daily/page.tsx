import { getSession } from "@/modules/auth/services/session"
import { redirect } from "next/navigation"
import { getDailyContext } from "@/modules/daily/services/daily-service"
import Link from "next/link"

export default async function DailyPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const context = await getDailyContext(session.userId)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Daily Dashboard</h1>

      {context.verseOfTheDay ? (
        <div className="mb-6 rounded-lg border p-6">
          <p className="mb-2 text-xs text-muted-foreground">Verse of the Day</p>
          <p className="text-lg leading-relaxed">{context.verseOfTheDay.verseText}</p>
          <p className="mt-2 text-sm text-muted-foreground">{context.verseOfTheDay.reference}</p>
          {context.verseOfTheDay.devotional && (
            <p className="mt-4 text-sm text-muted-foreground">{context.verseOfTheDay.devotional}</p>
          )}
        </div>
      ) : (
        <div className="mb-6 rounded-lg border p-6 text-center">
          <p className="text-sm text-muted-foreground">No verse of the day set.</p>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-semibold">{context.readingProgress.activePlan ? `${context.readingProgress.progress}%` : "—"}</p>
          <p className="text-sm text-muted-foreground">
            {context.readingProgress.activePlan ?? "No active plan"}
          </p>
        </div>
        <Link href="/prayer" className="rounded-lg border p-4 hover:bg-muted">
          <p className="text-2xl font-semibold">{context.prayerReminders}</p>
          <p className="text-sm text-muted-foreground">Unanswered Prayers</p>
        </Link>
        <Link href="/notes" className="rounded-lg border p-4 hover:bg-muted">
          <p className="text-2xl font-semibold">{context.recentNotes}</p>
          <p className="text-sm text-muted-foreground">Notes Today</p>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/prayer" className="rounded-lg border p-4 hover:bg-muted">
          <p className="font-medium">Prayer Journal</p>
          <p className="text-sm text-muted-foreground">Log prayers, track answers</p>
        </Link>
        <Link href="/reading-plans" className="rounded-lg border p-4 hover:bg-muted">
          <p className="font-medium">Reading Plans</p>
          <p className="text-sm text-muted-foreground">Track your Bible reading</p>
        </Link>
        <Link href="/bible/1/1" className="rounded-lg border p-4 hover:bg-muted">
          <p className="font-medium">Read the Bible</p>
          <p className="text-sm text-muted-foreground">Open the reader</p>
        </Link>
        <Link href="/notes" className="rounded-lg border p-4 hover:bg-muted">
          <p className="font-medium">Notes</p>
          <p className="text-sm text-muted-foreground">Review recent notes</p>
        </Link>
      </div>
    </div>
  )
}
