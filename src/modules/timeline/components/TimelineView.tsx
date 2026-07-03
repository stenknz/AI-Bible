"use client"

import CustomTimeline from "./CustomTimeline"
import type { TimelineEventData } from "@/modules/timeline/types/timeline"

type Props = {
  events: TimelineEventData[]
}

export default function TimelineView({ events }: Props) {
  return (
    <div className="animate-slide-up">
      <CustomTimeline events={events} />
    </div>
  )
}
