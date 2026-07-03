"use client"

import type { KnowledgeEntityType } from "@/modules/knowledge/types/knowledge"

const BADGE_STYLES: Record<string, string> = {
  verse: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  dictionary: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  commentary: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  topic: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  bible_event: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  nation: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  person: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  place: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  timeline: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
}

const LABELS: Record<string, string> = {
  verse: "Verse",
  dictionary: "Dictionary",
  commentary: "Commentary",
  topic: "Topic",
  bible_event: "Event",
  nation: "Nation",
  person: "Person",
  place: "Place",
  timeline: "Timeline",
}

type Props = {
  type: KnowledgeEntityType
}

export default function EntityBadge({ type }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
        BADGE_STYLES[type] || "bg-muted text-muted-foreground"
      }`}
    >
      {LABELS[type] || type}
    </span>
  )
}
