"use client"

import { useEffect, useRef } from "react"
import type { PlaceData } from "@/modules/maps/types/maps"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"

const TYPE_LABELS: Record<string, string> = {
  city: "City", town: "Town", village: "Village",
  region: "Region", mountain: "Mountain", hill: "Hill",
  sea: "Sea", river: "River", lake: "Lake", water: "Water",
  desert: "Desert", valley: "Valley", plain: "Plain",
  wilderness: "Wilderness", spring: "Spring", well: "Well",
  cave: "Cave", fort: "Fort", palace: "Palace", gate: "Gate",
  tower: "Tower", altar: "Altar", temple: "Temple",
}

type Props = {
  places: PlaceData[]
  journeyPath?: { lat: number; lng: number }[]
  center?: [number, number]
  zoom?: number
}

export function MapView({ places, journeyPath, center = [31.5, 35], zoom = 8 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    async function initMap() {
      const L = await import("leaflet")
      const MCGMod = (await import("leaflet.markercluster")) as any
      const MCGClass = MCGMod.default || MCGMod.MarkerClusterGroup || MCGMod

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

      const clusterGroup = new MCGClass({ chunkedLoading: true })

      const valid = places.filter((p) => p.latitude && p.longitude)
      for (const place of valid) {
        const label = TYPE_LABELS[place.placeType] || place.placeType
        const marker = L.marker([place.latitude!, place.longitude!])
        marker.bindPopup(`
          <b>${place.name}</b><br/>
          ${label !== "unknown" ? `<em>${label}</em><br/>` : ""}
          ${place.description ? `${place.description}` : ""}
        `)
        clusterGroup.addLayer(marker)
      }

      map.addLayer(clusterGroup)

      if (journeyPath && journeyPath.length > 1) {
        L.polyline(journeyPath as any, { color: "#3b82f6", weight: 3 }).addTo(map)
      }

      if (valid.length > 0) {
        const bounds = L.latLngBounds(valid.map((p) => [p.latitude!, p.longitude!] as [number, number]))
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 })
      }

      mapRef.current = map
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
