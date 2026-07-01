"use client"

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import type { PlaceData } from "@/modules/maps/types/maps"

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

type Props = {
  places: PlaceData[]
  journeyPath?: { lat: number; lng: number }[]
  center?: [number, number]
  zoom?: number
}

export function MapView({ places, journeyPath, center = [31.5, 35], zoom = 8 }: Props) {
  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border">
      <MapContainer center={center} zoom={zoom} className="h-full w-full" scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {places.map((place) =>
          place.latitude && place.longitude ? (
            <Marker key={place.id} position={[place.latitude, place.longitude]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{place.name}</p>
                  <p className="text-xs text-muted-foreground">{place.placeType}</p>
                  {place.description && <p className="mt-1 text-xs">{place.description}</p>}
                </div>
              </Popup>
            </Marker>
          ) : null
        )}
        {journeyPath && journeyPath.length > 1 && (
          <Polyline positions={journeyPath} pathOptions={{ color: "blue", weight: 3 }} />
        )}
      </MapContainer>
    </div>
  )
}
