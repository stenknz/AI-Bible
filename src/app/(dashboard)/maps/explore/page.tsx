"use client"

import { useState, useEffect } from "react"
import { MapView } from "@/modules/maps/components/MapView"
import type { PlaceData } from "@/modules/maps/types/maps"

export default function ExploreMapPage() {
  const [places, setPlaces] = useState<PlaceData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/maps/places").then((r) => r.json()).then((data) => {
      setPlaces(data.filter((p: PlaceData) => p.latitude && p.longitude))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-8"><div className="h-[500px] w-full rounded-lg border bg-muted animate-pulse" /></div>

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">Explore Biblical Places</h1>
      <MapView places={places} />
    </div>
  )
}
