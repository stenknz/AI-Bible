import { getSession } from "@/modules/auth/services/session"
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"

export default async function StudyPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const [strongsHebrew, strongsGreek, lexicalEntries] = await Promise.all([
    prisma.strongNumber.count({ where: { language: "hebrew" } }),
    prisma.strongNumber.count({ where: { language: "greek" } }),
    prisma.lexicalEntry.count(),
  ])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-foreground">Original Language Study</h1>

      <div className="mb-10 grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-3xl font-bold tracking-tight text-foreground">{strongsHebrew}</p>
          <p className="mt-1 text-sm text-muted-foreground">Hebrew Strong's Entries</p>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-3xl font-bold tracking-tight text-foreground">{strongsGreek}</p>
          <p className="mt-1 text-sm text-muted-foreground">Greek Strong's Entries</p>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-3xl font-bold tracking-tight text-foreground">{lexicalEntries}</p>
          <p className="mt-1 text-sm text-muted-foreground">Lexical Entries</p>
        </div>
      </div>

      <div className="space-y-4">
        <Link href="/study/strongs" className="group flex items-center justify-between rounded-xl bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md">
          <div>
            <p className="font-medium text-foreground">Strong's Concordance</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Browse Hebrew and Greek word entries</p>
          </div>
          <svg className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link href="/study/lexicon" className="group flex items-center justify-between rounded-xl bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md">
          <div>
            <p className="font-medium text-foreground">Lexicon</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Search the Hebrew and Greek lexicon</p>
          </div>
          <svg className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <div className="rounded-xl bg-muted/50 p-6">
          <p className="font-medium text-foreground">Interlinear</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Open any verse in the Bible reader and click the interlinear tab to view original language data.
          </p>
        </div>
      </div>
    </div>
  )
}
