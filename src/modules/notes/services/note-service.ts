import { prisma } from "@/lib/db"

export async function getNotes(userId: string) {
  return prisma.note.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { verse: { select: { number: true, chapter: { select: { number: true, book: { select: { name: true } } } } } } },
  })
}

export async function getNoteById(id: string, userId: string) {
  return prisma.note.findFirst({
    where: { id, userId },
    include: { verse: { select: { number: true, chapter: { select: { number: true, book: { select: { name: true } } } } } } },
  })
}

export async function createNote(data: { userId: string; verseId?: string; title?: string; content: any; tags?: string[] }) {
  return prisma.note.create({ data })
}

export async function updateNote(id: string, userId: string, data: { title?: string; content?: any; tags?: string[] }) {
  return prisma.note.updateMany({
    where: { id, userId },
    data,
  })
}

export async function deleteNote(id: string, userId: string) {
  return prisma.note.deleteMany({ where: { id, userId } })
}

export async function getNotesByVerse(verseId: string, userId: string) {
  return prisma.note.findMany({
    where: { verseId, userId },
    orderBy: { updatedAt: "desc" },
  })
}
