import { prisma } from "@/lib/db"
export const dynamic = "force-dynamic"

import Link from "next/link"

export default async function AudioPage() {
  const totalRecordings = await prisma.audioRecording.count()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-in">
      <h1 className="mb-6 text-xl font-semibold text-foreground">Audio Bible</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-3xl font-bold text-foreground">{totalRecordings}</p>
          <p className="mt-1 text-sm text-muted-foreground">Available Recordings</p>
        </div>
      </div>

      <div className="rounded-xl bg-card p-8 text-center shadow-sm">
        <svg className="mx-auto mb-3 h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
        <p className="text-sm text-muted-foreground">
          Audio features are coming soon. You will be able to listen to chapters and verses,
          adjust playback speed, bookmark positions, and download for offline listening.
        </p>
      </div>
    </div>
  )
}
