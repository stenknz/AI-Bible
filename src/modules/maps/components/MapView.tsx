"use client"

import { useEffect, useRef, useState } from "react"
import type { PlaceData } from "@/modules/maps/types/maps"
import "leaflet/dist/leaflet.css"

type Props = {
  places: PlaceData[]
  journeyPath?: { lat: number; lng: number }[]
  center?: [number, number]
  zoom?: number
}

export function MapView({ places, journeyPath, center = [31.5, 35], zoom = 8 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return

    async function initMap() {
      const L = await import("leaflet")

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      if (!containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current).setView(center, zoom)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      markersRef.current = places
        .filter((p) => p.latitude && p.longitude)
        .map((place) => {
          const marker = L.marker([place.latitude!, place.longitude!])
            .addTo(map)
            .bindPopup(`<b>${place.name}</b><br/>${place.placeType}${place.description ? `<br/>${place.description}` : ""}`)
          return marker
        })

      if (journeyPath && journeyPath.length > 1) {
        L.polyline(journeyPath as any, { color: "blue", weight: 3 }).addTo(map)
      }

      mapRef.current = map
      setReady(true)
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [places, journeyPath, center, zoom])

  return <div ref={containerRef} className="h-[500px] w-full rounded-lg overflow-hidden border" />
}
