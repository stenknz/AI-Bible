import { getAllEvents } from "@/modules/timeline/services/timeline-service"
export const dynamic = "force-dynamic"

import { TimelineView } from "@/modules/timeline/components/TimelineView"

export default async function TimelinePage() {
  const events = await getAllEvents()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Biblical Timeline</h1>
      <TimelineView events={events} />
    </div>
  )
}
