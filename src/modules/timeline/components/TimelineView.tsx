"use client"

import { Chrono } from "react-chrono"
import type { TimelineEventData } from "@/modules/timeline/types/timeline"

type Props = {
  events: TimelineEventData[]
  mode?: "VERTICAL" | "HORIZONTAL" | "VERTICAL_ALTERNATING"
}

export default function TimelineView({ events, mode = "VERTICAL_ALTERNATING" }: Props) {
  const items = events.map((event) => ({
    title: event.startYear
      ? `${event.startYear}${event.endYear && event.endYear !== event.startYear ? ` - ${event.endYear}` : ""}`
      : "",
    cardTitle: event.title,
    cardSubtitle: event.periodName ?? undefined,
    cardDetailedText: event.description ?? "",
  }))

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No timeline events loaded yet.</p>
  }

  return (
    <div className="w-full">
      <Chrono
        items={items}
        mode={mode}
        theme={{
          primary: "#3b82f6",
          secondary: "#f5f5f5",
          cardBgColor: "#ffffff",
          cardDetailsColor: "#0a0a0a",
          titleColor: "#737373",
        }}
        slideShow
        slideShowType="slide_in"
        scrollable={{ scrollbar: true }}
      />
    </div>
  )
}
