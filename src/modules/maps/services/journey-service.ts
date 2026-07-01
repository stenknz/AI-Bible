import { prisma } from "@/lib/db"

export async function getAllJourneys() {
  return prisma.journey.findMany({
    include: {
      person: { select: { name: true } },
      stops: {
        orderBy: { order: "asc" },
        include: { place: true },
      },
    },
  })
}
