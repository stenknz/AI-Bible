import { prisma } from "@/lib/db"
import { hash, compare } from "bcryptjs"

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash)
}

export async function createUser(email: string, password: string, name?: string) {
  const passwordHash = await hashPassword(password)
  return prisma.user.create({
    data: { email, passwordHash, name },
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}
