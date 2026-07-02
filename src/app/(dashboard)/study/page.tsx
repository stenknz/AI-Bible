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
      <h1 className="mb-6 text-xl font-semibold">Original Language Study</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-semibold">{strongsHebrew}</p>
          <p className="text-sm text-muted-foreground">Hebrew Strong's Entries</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-semibold">{strongsGreek}</p>
          <p className="text-sm text-muted-foreground">Greek Strong's Entries</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-semibold">{lexicalEntries}</p>
          <p className="text-sm text-muted-foreground">Lexical Entries</p>
        </div>
      </div>

      <div className="space-y-3">
        <Link href="/study/strongs" className="block rounded-lg border p-4 hover:bg-muted">
          <p className="font-medium">Strong's Concordance</p>
          <p className="text-sm text-muted-foreground">Browse Hebrew and Greek word entries</p>
        </Link>
        <Link href="/study/lexicon" className="block rounded-lg border p-4 hover:bg-muted">
          <p className="font-medium">Lexicon</p>
          <p className="text-sm text-muted-foreground">Search the Hebrew and Greek lexicon</p>
        </Link>
        <div className="rounded-lg border p-4">
          <p className="font-medium">Interlinear</p>
          <p className="text-sm text-muted-foreground">
            Open any verse in the Bible reader and click the interlinear tab to view original language data.
          </p>
        </div>
      </div>
    </div>
  )
}
