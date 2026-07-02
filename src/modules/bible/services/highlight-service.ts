import { prisma } from "@/lib/db"

export async function getUserHighlights(userId: string, verseIds?: string[]) {
  const where: any = { userId }
  if (verseIds) where.verseId = { in: verseIds }
  return prisma.highlight.findMany({ where })
}

export async function upsertHighlight(userId: string, verseId: string, color: string) {
  return prisma.highlight.upsert({
    where: { userId_verseId: { userId, verseId } },
    update: { color },
    create: { userId, verseId, color },
  })
}

export async function removeHighlight(userId: string, verseId: string) {
  return prisma.highlight.deleteMany({
    where: { userId, verseId },
  })
}
