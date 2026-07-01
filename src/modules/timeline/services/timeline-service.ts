import { prisma } from "@/lib/db"
import type { TimelineEventData, PeriodData } from "@/modules/timeline/types/timeline"

export async function getAllEvents(): Promise<TimelineEventData[]> {
  const events = await prisma.timelineEntry.findMany({
    orderBy: { startYear: "asc" },
    include: { period: { select: { name: true } } },
  })
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    startYear: e.startYear,
    endYear: e.endYear,
    periodName: e.period?.name ?? null,
    importance: e.importance,
  }))
}

export async function getEventsByPeriod(periodId: string): Promise<TimelineEventData[]> {
  const events = await prisma.timelineEntry.findMany({
    where: { periodId },
    orderBy: { startYear: "asc" },
    include: { period: { select: { name: true } } },
  })
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    startYear: e.startYear,
    endYear: e.endYear,
    periodName: e.period?.name ?? null,
    importance: e.importance,
  }))
}

export async function getPeriods(): Promise<PeriodData[]> {
  return prisma.period.findMany({ orderBy: { order: "asc" } })
}
