"use client"

import { useState, useEffect } from "react"
import { TimelineView } from "@/modules/timeline/components/TimelineView"
import type { TimelineEventData } from "@/modules/timeline/types/timeline"

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEventData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/timeline/events").then((r) => r.json()).then((data) => {
      setEvents(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-8"><div className="h-[400px] w-full rounded-lg border bg-muted animate-pulse" /></div>

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Biblical Timeline</h1>
      <TimelineView events={events} />
    </div>
  )
}
