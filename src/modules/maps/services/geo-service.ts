import { prisma } from "@/lib/db"
import type { PlaceData, RegionData } from "@/modules/maps/types/maps"

export async function getAllPlaces(): Promise<PlaceData[]> {
  return prisma.place.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, latitude: true, longitude: true, placeType: true, description: true },
  })
}

export async function getPlacesByType(placeType: string): Promise<PlaceData[]> {
  return prisma.place.findMany({
    where: { placeType },
    orderBy: { name: "asc" },
    select: { id: true, name: true, latitude: true, longitude: true, placeType: true, description: true },
  })
}

export async function getRegions(): Promise<RegionData[]> {
  return prisma.region.findMany({ orderBy: { name: "asc" } })
}

export async function getJourneyWithStops(journeyId: string) {
  return prisma.journey.findUnique({
    where: { id: journeyId },
    include: {
      person: { select: { name: true } },
      stops: {
        orderBy: { order: "asc" },
        include: { place: true },
      },
    },
  })
}

export async function getAllJourneys() {
  return prisma.journey.findMany({
    include: {
      person: { select: { name: true } },
      stops: {
        orderBy: { order: "asc" },
        include: { place: { select: { id: true, name: true, latitude: true, longitude: true } } },
      },
    },
  })
}
