import { prisma } from "@/lib/db"
export const dynamic = "force-dynamic"


export default async function TranslationsPage() {
  const translations = await prisma.translation.findMany({
    include: { _count: { select: { books: true } } },
  })
  return (
    <div className="animate-fade-in">
      <h2 className="mb-6 text-lg font-medium text-foreground">Translations</h2>
      <div className="space-y-3">
        {translations.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-xl bg-card p-5 shadow-sm">
            <div className="flex-1">
              <p className="font-medium text-foreground">{t.code}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{t.name} &mdash; {t.language}</p>
            </div>
            <span className="ml-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              {t._count.books} books
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
