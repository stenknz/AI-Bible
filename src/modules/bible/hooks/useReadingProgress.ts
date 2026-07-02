"use client"

import { useState, useEffect } from "react"

const STORAGE_KEY = "biblehub-reading-progress"

type Progress = Record<string, string>

export function useReadingProgress() {
  const [progress, setProgress] = useState<Progress>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setProgress(JSON.parse(stored))
    } catch {}
  }, [])

  function markVisited(bookNumber: number, chapterNumber: number) {
    const key = `${bookNumber}-${chapterNumber}`
    setProgress((prev) => ({ ...prev, [key]: new Date().toISOString() }))
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...progress, [key]: new Date().toISOString() })) } catch {}
  }

  function isVisited(bookNumber: number, chapterNumber: number): boolean {
    return !!progress[`${bookNumber}-${chapterNumber}`]
  }

  return { markVisited, isVisited }
}
