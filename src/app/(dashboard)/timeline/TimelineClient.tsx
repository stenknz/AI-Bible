"use client"

import dynamic from "next/dynamic"
import type { TimelineEventData } from "@/modules/timeline/types/timeline"

const TimelineView = dynamic(() => import("@/modules/timeline/components/TimelineView"), {
  ssr: false,
})

export default function TimelineClient({ events }: { events: TimelineEventData[] }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Biblical Timeline</h1>
      <TimelineView events={events} />
    </div>
  )
}
