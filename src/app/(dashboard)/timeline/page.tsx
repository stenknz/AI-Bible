import { getAllEvents } from "@/modules/timeline/services/timeline-service"
export const dynamic = "force-dynamic"

import TimelineClient from "./TimelineClient"

export default async function TimelinePage() {
  const events = await getAllEvents()
  return <TimelineClient events={events} />
}
