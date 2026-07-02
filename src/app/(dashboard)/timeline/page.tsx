import { getAllEvents } from "@/modules/timeline/services/timeline-service"
export const dynamic = "force-dynamic"

import DynamicTimeline from "./DynamicTimeline"

export default async function TimelinePage() {
  const events = await getAllEvents()
  return <DynamicTimeline events={events} />
}
