"use client"

import dynamic from "next/dynamic"
import type { TimelineEventData } from "@/modules/timeline/types/timeline"

const TimelineView = dynamic(() => import("@/modules/timeline/components/TimelineView").then((m) => ({ default: m.TimelineView })), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full rounded-lg border bg-muted animate-pulse" />,
})

export default function DynamicTimeline({ events }: { events: TimelineEventData[] }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Biblical Timeline</h1>
      <TimelineView events={events} />
    </div>
  )
}
