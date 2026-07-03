"use client"

import { useRouter } from "next/navigation"
import EntityBadge from "./EntityBadge"
import type { KnowledgeSearchResult } from "@/modules/knowledge/types/knowledge"

type Props = {
  results: Record<string, KnowledgeSearchResult[]>
}

const SECTION_ORDER = ["dictionary", "topic", "commentary", "bible_event", "nation", "person", "place", "verse", "timeline"]

const SECTION_LABELS: Record<string, string> = {
  dictionary: "Dictionary Entries",
  topic: "Topics",
  commentary: "Commentaries",
  bible_event: "Bible Events",
  nation: "Nations",
  person: "People",
  place: "Places",
  verse: "Verses",
  timeline: "Timeline",
}

export default function KnowledgeSearchResults({ results }: Props) {
  const router = useRouter()

  const sections = SECTION_ORDER
    .filter((type) => (results[type]?.length || 0) > 0)
    .map((type) => ({ type, items: results[type]!, label: SECTION_LABELS[type] || type }))

  if (sections.length === 0) return null

  return (
    <div className="mt-8 space-y-8">
      {sections.map(({ type, items, label }) => (
        <section key={type}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
            <span className="ml-2 text-xs font-normal opacity-60">({items.length})</span>
          </h3>
          <div className="space-y-2">
            {items.slice(0, 10).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (type === "verse") {
                    router.push(`/bible?search=${encodeURIComponent(item.reference || item.title)}`)
                  } else {
                    router.push(`/search?entity=${item.entityType}&slug=${item.slug}`)
                  }
                }}
                className="w-full rounded-xl bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/50"
              >
                <div className="mb-1 flex items-center gap-2">
                  <EntityBadge type={item.entityType} />
                  <span className="text-xs text-muted-foreground">
                    {item.source && `via ${item.source}`}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                {item.snippet && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {item.snippet}
                  </p>
                )}
              </button>
            ))}
            {items.length > 10 && (
              <p className="text-xs text-muted-foreground">
                +{items.length - 10} more results
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
