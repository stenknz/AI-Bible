"use client"

import type { TimelineEventData } from "@/modules/timeline/types/timeline"

type Props = {
  events: TimelineEventData[]
}

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BC`
  return `${year} AD`
}

export default function CustomTimeline({ events }: Props) {
  if (events.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No timeline events loaded yet.</p>
  }

  return (
    <div className="relative pl-8">
      <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" />
      {events.map((event) => {
        const yearLabel = event.startYear
          ? formatYear(event.startYear) +
            (event.endYear && event.endYear !== event.startYear ? ` – ${formatYear(event.endYear)}` : "")
          : null

        return (
          <div key={event.id} className="relative pb-10 last:pb-0">
            <div className="absolute left-[-22px] top-1.5 h-3 w-3 rounded-full border-2 border-blue-500 bg-background" />
            <div className="ml-4 rounded-lg border bg-background p-4 shadow-sm">
              {yearLabel && (
                <span className="mb-1 inline-block rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {yearLabel}
                </span>
              )}
              <h3 className="text-base font-semibold">{event.title}</h3>
              {event.periodName && (
                <span className="mt-0.5 inline-block text-xs font-medium text-muted-foreground">
                  {event.periodName}
                </span>
              )}
              {event.description && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{event.description}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
