import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@biblehub.local"
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme"

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    const passwordHash = await hash(adminPassword, 12)
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "Admin",
        role: "ADMIN",
      },
    })
    console.log(`Admin user created: ${adminEmail}`)
  } else {
    console.log(`Admin user already exists: ${adminEmail}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
