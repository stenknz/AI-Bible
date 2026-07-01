import { prisma } from "@/lib/db"

export async function getPrayers(userId: string) {
  return prisma.prayerRequest.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { category: { select: { name: true } } },
  })
}

export async function getAnsweredPrayers(userId: string) {
  return prisma.prayerRequest.findMany({
    where: { userId, isAnswered: true },
    orderBy: { answeredAt: "desc" },
  })
}

export async function createPrayer(data: { userId: string; title: string; content: string; categoryId?: string }) {
  return prisma.prayerRequest.create({ data })
}

export async function markAnswered(id: string, userId: string, answerNotes?: string) {
  return prisma.prayerRequest.updateMany({
    where: { id, userId },
    data: { isAnswered: true, answeredAt: new Date(), answerNotes },
  })
}

export async function getCategories(userId: string) {
  return prisma.prayerCategory.findMany({
    where: { userId },
    include: { _count: { select: { prayers: true } } },
  })
}

export async function createCategory(data: { userId: string; name: string; description?: string }) {
  return prisma.prayerCategory.create({ data })
}

export async function deletePrayer(id: string, userId: string) {
  return prisma.prayerRequest.deleteMany({ where: { id, userId } })
}
