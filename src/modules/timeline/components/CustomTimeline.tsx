"use client"

import { useMemo } from "react"
import type { TimelineEventData } from "@/modules/timeline/types/timeline"

type Props = {
  events: TimelineEventData[]
}

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BC`
  return `${year} AD`
}

function imageForEvent(event: TimelineEventData, indexInYear: number): string | null {
  if (event.startYear == null) return null
  const prefix = event.startYear < 0 ? `${Math.abs(event.startYear)}BC` : `${event.startYear}AD`
  const suffix = `-${indexInYear + 1}`
  return `/images/timeline/${prefix}${suffix}.jpeg`
}

export default function CustomTimeline({ events }: Props) {
  // Group events by startYear to assign multi-image suffixes
  const yearIndexes = useMemo(() => {
    const map = new Map<string, number>()
    const counts = new Map<string, number>()
    for (const e of events) {
      const key = String(e.startYear ?? "")
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    const current = new Map<string, number>()
    for (const e of events) {
      const key = String(e.startYear ?? "")
      current.set(key, (current.get(key) || 0) + 1)
      map.set(e.id, (current.get(key) || 1) - 1)
    }
    return map
  }, [events])

  if (events.length === 0) {
    return (
      <div className="rounded-xl bg-card p-8 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">No timeline events loaded yet.</p>
      </div>
    )
  }

  return (
    <ol className="relative pl-8 animate-fade-in" aria-label="Biblical timeline">
      <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" aria-hidden="true" />
      {events.map((event) => {
        const yearLabel = event.startYear
          ? formatYear(event.startYear) +
            (event.endYear != null && event.endYear !== event.startYear ? ` – ${formatYear(event.endYear)}` : "")
          : null

        const imgIdx = yearIndexes.get(event.id) || 0
        const imgSrc = imageForEvent(event, imgIdx)

        return (
          <li key={event.id} className="relative pb-12 last:pb-0">
            <div className="absolute left-[-23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-secondary bg-background shadow-sm" aria-hidden="true" />
            <div className="ml-4 rounded-2xl bg-card shadow-sm overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              {imgSrc && (
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={imgSrc}
                    alt={`${event.title}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-5">
                {yearLabel && (
                  <span className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
                    {yearLabel}
                  </span>
                )}
                <h3 className="mt-3 text-base font-semibold tracking-tight text-foreground">{event.title}</h3>
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
          </li>
        )
      })}
    </ol>
  )
}
