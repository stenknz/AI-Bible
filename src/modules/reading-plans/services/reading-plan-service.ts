import { prisma } from "@/lib/db"

export type TodayProgress = {
  id: string
  name: string
  completed: boolean
  progress: number
}

export async function getTodayProgress(userId: string): Promise<TodayProgress[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const plans = await prisma.readingPlan.findMany({
    where: { userId },
    include: {
      progress: true,
      template: true,
    },
  })

  return plans
    .map((plan) => {
      const daysSinceStart = Math.floor(
        (today.getTime() - new Date(plan.startDate).getTime()) / 86400000,
      )
      const dayNumber = daysSinceStart + 1

      if (dayNumber < 1) return null

      const todayEntry = plan.progress.find((p) => p.dayNumber === dayNumber)
      const completedCount = plan.progress.filter((p) => p.completed).length
      const totalDays = plan.template?.days ?? (plan.progress.length || dayNumber)
      const pct = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0

      return {
        id: plan.id,
        name: plan.name,
        completed: todayEntry?.completed ?? false,
        progress: pct,
      }
    })
    .filter(Boolean) as TodayProgress[]
}

export type ReadingPlan = {
  id: string
  name: string
  type: string
  startDate: Date
}

export async function getUserPlans(userId: string): Promise<ReadingPlan[]> {
  return prisma.readingPlan.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
  })
}

export async function createPlan(data: {
  userId: string
  name: string
  type?: string
  startDate?: string
  templateId?: string
}): Promise<ReadingPlan> {
  return prisma.readingPlan.create({
    data: {
      userId: data.userId,
      name: data.name,
      type: data.type ?? "custom",
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      templateId: data.templateId,
    },
  })
}

export async function markDayComplete(planId: string, dayNumber: number, userId: string) {
  const plan = await prisma.readingPlan.findFirst({
    where: { id: planId, userId },
  })
  if (!plan) throw new Error("Plan not found")

  const existing = await prisma.readingPlanProgress.findFirst({
    where: { planId, dayNumber },
  })

  if (existing) {
    return prisma.readingPlanProgress.update({
      where: { id: existing.id },
      data: { completed: true, completedAt: new Date() },
    })
  }

  return prisma.readingPlanProgress.create({
    data: { planId, dayNumber, completed: true, completedAt: new Date() },
  })
}
