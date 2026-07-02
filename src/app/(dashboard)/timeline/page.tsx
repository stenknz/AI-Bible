import { getAllEvents, getPeriods } from "@/modules/timeline/services/timeline-service"
export const dynamic = "force-dynamic"
import { TimelineView } from "@/modules/timeline/components/TimelineView"

export default async function TimelinePage() {
  const [events, periods] = await Promise.all([
    getAllEvents(),
    getPeriods(),
  ])

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
