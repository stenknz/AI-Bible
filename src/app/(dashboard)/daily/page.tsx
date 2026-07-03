import { getSession } from "@/modules/auth/services/session"
export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { getDailyContext } from "@/modules/daily/services/daily-service"
import Link from "next/link"

export default async function DailyPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const context = await getDailyContext(session.userId)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Daily Dashboard</h1>

      {context.verseOfTheDay ? (
        <div className="mb-8 rounded-xl border-l-4 border-accent bg-card p-6 shadow-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Verse of the Day</p>
          <p className="text-lg leading-relaxed">{context.verseOfTheDay.verseText}</p>
          <p className="mt-2 text-sm font-medium text-secondary">{context.verseOfTheDay.reference}</p>
          {context.verseOfTheDay.devotional && (
            <p className="mt-4 text-sm italic text-muted-foreground">{context.verseOfTheDay.devotional}</p>
          )}
        </div>
      ) : (
        <div className="mb-8 rounded-xl border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">No verse of the day set.</p>
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="animate-slide-up rounded-xl border bg-card p-5 shadow-sm" style={{animationDelay:"0ms"}}>
          <svg className="mb-3 h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20"/></svg>
          <p className="text-2xl font-semibold">{context.readingProgress.activePlan ? `${context.readingProgress.progress}%` : "—"}</p>
          <p className="text-sm text-muted-foreground">
            {context.readingProgress.activePlan ?? "No active plan"}
          </p>
        </div>
        <Link href="/prayer" className="animate-slide-up rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-muted/50" style={{animationDelay:"100ms"}}>
          <svg className="mb-3 h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
          <p className="text-2xl font-semibold">{context.prayerReminders}</p>
          <p className="text-sm text-muted-foreground">Unanswered Prayers</p>
        </Link>
        <Link href="/notes" className="animate-slide-up rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-muted/50" style={{animationDelay:"200ms"}}>
          <svg className="mb-3 h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
          <p className="text-2xl font-semibold">{context.recentNotes}</p>
          <p className="text-sm text-muted-foreground">Notes Today</p>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/prayer" className="animate-slide-up rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50" style={{animationDelay:"300ms"}}>
          <p className="font-medium">Prayer Journal</p>
          <p className="text-sm text-muted-foreground">Log prayers, track answers</p>
        </Link>
        <Link href="/reading-plans" className="animate-slide-up rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50" style={{animationDelay:"400ms"}}>
          <p className="font-medium">Reading Plans</p>
          <p className="text-sm text-muted-foreground">Track your Bible reading</p>
        </Link>
        <Link href="/bible/1/1" className="animate-slide-up rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50" style={{animationDelay:"500ms"}}>
          <p className="font-medium">Read the Bible</p>
          <p className="text-sm text-muted-foreground">Open the reader</p>
        </Link>
        <Link href="/notes" className="animate-slide-up rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50" style={{animationDelay:"600ms"}}>
          <p className="font-medium">Notes</p>
          <p className="text-sm text-muted-foreground">Review recent notes</p>
        </Link>
      </div>
    </div>
  )
}
