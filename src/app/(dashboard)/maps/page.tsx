import Link from "next/link"
export const dynamic = "force-dynamic"

import { prisma } from "@/lib/db"

export default async function MapsPage() {
  const [places, journeys, regions] = await Promise.all([
    prisma.place.count(),
    prisma.journey.count(),
    prisma.region.count(),
  ])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Bible Maps</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-semibold">{places}</p>
          <p className="text-sm text-muted-foreground">Places</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-semibold">{journeys}</p>
          <p className="text-sm text-muted-foreground">Journeys</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-semibold">{regions}</p>
          <p className="text-sm text-muted-foreground">Regions</p>
        </div>
      </div>

      <div className="space-y-3">
        <Link href="/maps/explore" className="block rounded-lg border p-4 hover:bg-muted">
          <p className="font-medium">Explore Map</p>
          <p className="text-sm text-muted-foreground">View all biblical places on an interactive map</p>
        </Link>
        <Link href="/maps/journeys" className="block rounded-lg border p-4 hover:bg-muted">
          <p className="font-medium">Journeys</p>
          <p className="text-sm text-muted-foreground">Follow the travels of biblical figures</p>
        </Link>
      </div>
    </div>
  )
}
