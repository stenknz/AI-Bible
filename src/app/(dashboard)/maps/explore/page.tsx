import { getAllPlaces } from "@/modules/maps/services/geo-service"
export const dynamic = "force-dynamic"

import { MapView } from "@/modules/maps/components/MapView"

export default async function ExploreMapPage() {
  const places = await getAllPlaces()
  const validPlaces = places.filter((p) => p.latitude && p.longitude)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">Explore Biblical Places</h1>
      <MapView places={validPlaces} />
    </div>
  )
}
