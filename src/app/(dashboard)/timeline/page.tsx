import { getAllEvents } from "@/modules/timeline/services/timeline-service"
export const dynamic = "force-dynamic"

import TimelineView from "@/modules/timeline/components/TimelineView"

export default async function TimelinePage() {
  const events = await getAllEvents()
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-foreground">Biblical Timeline</h1>
      <TimelineView events={events} />
    </div>
  )
}
