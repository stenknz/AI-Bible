import { getAllJourneys } from "@/modules/maps/services/journey-service"
export const dynamic = "force-dynamic"
import Link from "next/link"

export default async function JourneysPage() {
  const journeys = await getAllJourneys()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Biblical Journeys</h1>
      <div className="space-y-3">
        {journeys.map((journey) => (
          <div key={journey.id} className="rounded-lg border p-4">
            <p className="font-medium">{journey.name}</p>
            {journey.person && (
              <p className="text-sm text-muted-foreground">by {journey.person.name}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {journey.stops.length} stops
            </p>
          </div>
        ))}
        {journeys.length === 0 && (
          <p className="text-sm text-muted-foreground">No journeys loaded yet.</p>
        )}
      </div>
    </div>
  )
}
