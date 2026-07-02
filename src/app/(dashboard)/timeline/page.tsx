"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type { TimelineEventData, PeriodData } from "@/modules/timeline/types/timeline"

const TimelineView = dynamic(
  () => import("@/modules/timeline/components/TimelineView").then((m) => ({ default: m.TimelineView })),
  { ssr: false, loading: () => <div className="h-[400px] w-full rounded-lg border bg-muted animate-pulse" /> }
)

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEventData[]>([])
  const [periods, setPeriods] = useState<PeriodData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/timeline/events").then((r) => r.json()),
    ]).then(([evts]) => {
      setEvents(evts)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-8"><div className="h-[400px] w-full rounded-lg border bg-muted animate-pulse" /></div>

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Biblical Timeline</h1>

      {periods.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {periods.map((period) => (
            <span key={period.id} className="rounded-full bg-muted px-3 py-1 text-xs">
              {period.name}
            </span>
          ))}
        </div>
      )}

      <TimelineView events={events} />
    </div>
  )
}
