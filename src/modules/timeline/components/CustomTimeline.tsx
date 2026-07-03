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
    return <p className="py-8 text-center text-sm text-muted-foreground">No timeline events loaded yet.</p>
  }

  return (
    <ol className="relative pl-8" aria-label="Biblical timeline">
      <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" aria-hidden="true" />
      {events.map((event) => {
        const yearLabel = event.startYear
          ? formatYear(event.startYear) +
            (event.endYear != null && event.endYear !== event.startYear ? ` – ${formatYear(event.endYear)}` : "")
          : null

        const imgIdx = yearIndexes.get(event.id) || 0
        const imgSrc = imageForEvent(event, imgIdx)

        return (
          <li key={event.id} className="relative pb-10 last:pb-0">
            <div className="absolute left-[-22px] top-1.5 h-3 w-3 rounded-full border-2 border-blue-500 bg-background" aria-hidden="true" />
            <div className="ml-4 rounded-lg border bg-background shadow-sm">
              {imgSrc && (
                <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
                  <img
                    src={imgSrc}
                    alt={`${event.title}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-4">
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
          </li>
        )
      })}
    </ol>
  )
}
