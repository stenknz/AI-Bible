"use client"

import { Chrono } from "react-chrono"
import type { TimelineEventData } from "@/modules/timeline/types/timeline"

type Props = {
  events: TimelineEventData[]
  mode?: "VERTICAL" | "HORIZONTAL" | "VERTICAL_ALTERNATING"
}

export function TimelineView({ events, mode = "VERTICAL_ALTERNATING" }: Props) {
  const items = events.map((event) => ({
    title: event.startYear ? `${event.startYear}${event.endYear && event.endYear !== event.startYear ? ` - ${event.endYear}` : ""}` : "",
    cardTitle: event.title,
    cardSubtitle: event.periodName ?? undefined,
    cardDetailedText: event.description ?? "",
  }))

  if (items.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">No timeline events loaded yet.</p>
  }

  return (
    <div className="w-full">
      <Chrono
        items={items}
        mode={mode}
        theme={{
          primary: "var(--foreground)",
          secondary: "var(--muted)",
          cardBgColor: "var(--background)",
          cardDetailsColor: "var(--foreground)",
          titleColor: "var(--muted-foreground)",
        }}
        slideShow
        slideShowType="slide_in"
        scrollable={{ scrollbar: true }}
      />
    </div>
  )
}
