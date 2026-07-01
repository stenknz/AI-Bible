import { prisma } from "@/lib/db"
import Link from "next/link"

export default async function AudioPage() {
  const totalRecordings = await prisma.audioRecording.count()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Audio Bible</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-semibold">{totalRecordings}</p>
          <p className="text-sm text-muted-foreground">Available Recordings</p>
        </div>
      </div>

      <div className="rounded-lg border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Audio features are coming soon. You will be able to listen to chapters and verses,
          adjust playback speed, bookmark positions, and download for offline listening.
        </p>
      </div>
    </div>
  )
}
