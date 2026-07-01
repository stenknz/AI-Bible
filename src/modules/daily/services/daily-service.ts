import { prisma } from "@/lib/db"
import { getTodayProgress } from "@/modules/reading-plans/services/reading-plan-service"

export type DailyContext = {
  verseOfTheDay: {
    verseText: string
    reference: string
    devotional: string | null
  } | null
  readingProgress: {
    activePlan: string | null
    todayCompleted: boolean
    progress: number
  }
  prayerReminders: number
  recentNotes: number
}

export async function getDailyContext(userId: string): Promise<DailyContext> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [verseOfDay, planProgress, unansweredPrayers, recentNotesCount] = await Promise.all([
    prisma.dailyVerse.findFirst({
      orderBy: { date: "desc" },
      include: {
        verse: {
          include: { chapter: { include: { book: { include: { translation: true } } } } },
        },
      },
    }),
    getTodayProgress(userId),
    prisma.prayerRequest.count({ where: { userId, isAnswered: false } }),
    prisma.note.count({ where: { userId, createdAt: { gte: today } } }),
  ])

  const progress = planProgress[0] ?? null

  return {
    verseOfTheDay: verseOfDay
      ? {
          verseText: verseOfDay.verse.text,
          reference: `${verseOfDay.verse.chapter.book.name} ${verseOfDay.verse.chapter.number}:${verseOfDay.verse.number} (${verseOfDay.verse.chapter.book.translation.code})`,
          devotional: verseOfDay.devotional,
        }
      : null,
    readingProgress: {
      activePlan: progress?.name ?? null,
      todayCompleted: progress?.completed ?? false,
      progress: progress?.progress ?? 0,
    },
    prayerReminders: unansweredPrayers,
    recentNotes: recentNotesCount,
  }
}
