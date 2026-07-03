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
    <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-in">
      <h1 className="mb-6 text-xl font-semibold text-foreground">Bible Maps</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-3xl font-bold text-foreground">{places}</p>
          <p className="mt-1 text-sm text-muted-foreground">Places</p>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-3xl font-bold text-foreground">{journeys}</p>
          <p className="mt-1 text-sm text-muted-foreground">Journeys</p>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-3xl font-bold text-foreground">{regions}</p>
          <p className="mt-1 text-sm text-muted-foreground">Regions</p>
        </div>
      </div>

      <div className="space-y-3">
        <Link href="/maps/explore" className="group flex items-center justify-between rounded-xl bg-card p-6 shadow-sm transition-colors hover:bg-muted">
          <div>
            <p className="font-medium text-foreground">Explore Map</p>
            <p className="text-sm text-muted-foreground">View all biblical places on an interactive map</p>
          </div>
          <svg className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
        <Link href="/maps/journeys" className="group flex items-center justify-between rounded-xl bg-card p-6 shadow-sm transition-colors hover:bg-muted">
          <div>
            <p className="font-medium text-foreground">Journeys</p>
            <p className="text-sm text-muted-foreground">Follow the travels of biblical figures</p>
          </div>
          <svg className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
