import { prisma } from "@/lib/db"

export async function getUserBookmarks(userId: string) {
  return prisma.bookmark.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
}

export async function addBookmark(userId: string, verseId: string, label?: string) {
  return prisma.bookmark.create({
    data: { userId, verseId, label },
  })
}

export async function removeBookmark(userId: string, verseId: string) {
  return prisma.bookmark.deleteMany({
    where: { userId, verseId },
  })
}
