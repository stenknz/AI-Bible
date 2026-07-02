import { prisma } from "@/lib/db"
export const dynamic = "force-dynamic"


export default async function TranslationsPage() {
  const translations = await prisma.translation.findMany({
    include: { _count: { select: { books: true } } },
  })
  return (
    <div>
      <h2 className="mb-4 text-lg font-medium">Translations</h2>
      <div className="space-y-2">
        {translations.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium">{t.code}</p>
              <p className="text-sm text-muted-foreground">{t.name} — {t.language}</p>
            </div>
            <p className="text-sm text-muted-foreground">{t._count.books} books</p>
          </div>
        ))}
      </div>
    </div>
  )
}
