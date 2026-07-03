import { getAllJourneys } from "@/modules/maps/services/journey-service"
export const dynamic = "force-dynamic"
import Link from "next/link"

export default async function JourneysPage() {
  const journeys = await getAllJourneys()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-in">
      <h1 className="mb-6 text-xl font-semibold text-foreground">Biblical Journeys</h1>
      <div className="space-y-3">
        {journeys.map((journey) => (
          <div key={journey.id} className="rounded-xl bg-card p-6 shadow-sm">
            <p className="font-medium text-foreground">{journey.name}</p>
            {journey.person && (
              <p className="mt-1 text-sm text-muted-foreground">by {journey.person.name}</p>
            )}
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              {journey.stops.length} stops
            </div>
          </div>
        ))}
        {journeys.length === 0 && (
          <div className="rounded-xl bg-card p-8 text-center shadow-sm">
            <svg className="mx-auto mb-3 h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            <p className="text-sm text-muted-foreground">No journeys loaded yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
