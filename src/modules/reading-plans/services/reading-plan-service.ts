import { prisma } from "@/lib/db"

export async function getTemplates() {
  return prisma.readingPlanTemplate.findMany({
    where: { isPublic: true },
    include: { _count: { select: { daysPlan: true } } },
  })
}

export async function getTemplateWithDays(id: string) {
  return prisma.readingPlanTemplate.findUnique({
    where: { id },
    include: { daysPlan: { orderBy: { dayNumber: "asc" } } },
  })
}

export async function getUserPlans(userId: string) {
  return prisma.readingPlan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      template: { select: { name: true } },
      progress: { orderBy: { dayNumber: "asc" } },
    },
  })
}

export async function createPlan(data: {
  userId: string; name: string; type: string; startDate: Date; templateId?: string; days: number
}) {
  return prisma.readingPlan.create({ data })
}

export async function markDayComplete(planId: string, dayNumber: number, userId: string) {
  const plan = await prisma.readingPlan.findFirst({ where: { id: planId, userId } })
  if (!plan) throw new Error("Plan not found")

  return prisma.readingPlanProgress.upsert({
    where: { planId_dayNumber: { planId, dayNumber } },
    update: { completed: true, completedAt: new Date() },
    create: { planId, dayNumber, completed: true, completedAt: new Date() },
  })
}

export async function getTodayProgress(userId: string) {
  const plans = await prisma.readingPlan.findMany({
    where: { userId },
    include: {
      progress: { orderBy: { dayNumber: "asc" } },
      template: { select: { name: true, days: true } },
    },
  })

  return plans.map((plan) => {
    const completed = plan.progress.filter((p) => p.completed).length
    const total = plan.template?.days || plan.progress.length || 0
    return {
      id: plan.id,
      name: plan.name,
      type: plan.type,
      completed,
      total,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  })
}
