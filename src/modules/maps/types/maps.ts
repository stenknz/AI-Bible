export type PlaceData = {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  placeType: string
  description: string | null
}

export type RegionData = {
  id: string
  name: string
  regionType: string
}

export type JourneyData = {
  id: string
  name: string
  personName?: string
  stops: { place: PlaceData; order: number }[]
}
