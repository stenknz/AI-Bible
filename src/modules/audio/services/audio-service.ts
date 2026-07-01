import { prisma } from "@/lib/db"

export async function getRecordings(entityId: string, entityType: string) {
  return prisma.audioRecording.findMany({
    where: { entityId, entityType },
    orderBy: { createdAt: "desc" },
  })
}

export async function upsertPlaybackState(
  userId: string,
  recordingId: string,
  data: { position?: number; speed?: number; volume?: number; isPlaying?: boolean }
) {
  return prisma.playbackState.upsert({
    where: { userId_recordingId: { userId, recordingId } },
    update: data,
    create: { userId, recordingId, ...data },
  })
}
