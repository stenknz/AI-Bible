import { prisma } from "@/lib/db"
export const dynamic = "force-dynamic"

type EntitySection = {
  title: string
  count: number
  sample: { title: string; source: string }[]
}

async function getSection(model: any, titleField: string, sourceField: string, title: string): Promise<EntitySection> {
  const count = await model.count()
  const records = await model.findMany({
    select: { [titleField]: true, [sourceField]: true },
    take: 10,
    orderBy: { createdAt: "desc" },
  })
  return {
    title,
    count,
    sample: records.map((r: any) => ({ title: r[titleField] || "", source: r[sourceField] || "" })),
  }
}

export default async function EntitiesPage() {
  const sections = await Promise.all([
    getSection(prisma.dictionaryEntry, "title", "source", "Dictionary Entries"),
    getSection(prisma.commentaryEntry, "title", "source", "Commentaries"),
    getSection(prisma.topicEntry, "topic", "source", "Topics"),
  ])

  return (
    <div className="animate-fade-in">
      <h2 className="mb-6 text-lg font-semibold">Knowledge Entities</h2>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title} className="rounded-xl bg-card p-6 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold">
              {section.title}
              <span className="ml-2 text-xs font-normal text-muted-foreground">({section.count} total)</span>
            </h3>
            {section.sample.length > 0 ? (
              <div className="mt-3 space-y-1">
                {section.sample.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    <span className="text-foreground">{item.title}</span>
                    {item.source && (
                      <span className="text-xs text-muted-foreground">via {item.source}</span>
                    )}
                  </div>
                ))}
                {section.count > 10 && (
                  <p className="pt-1 text-xs text-muted-foreground">Showing 10 of {section.count} entries</p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No entries yet. Run an import first.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
