"use client"

import { useState, useEffect, useCallback } from "react"

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

  const markVisited = useCallback((bookNumber: number, chapterNumber: number) => {
    const key = `${bookNumber}-${chapterNumber}`
    setProgress((prev) => {
      const updated = { ...prev, [key]: new Date().toISOString() }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [])

  const isVisited = useCallback((bookNumber: number, chapterNumber: number): boolean => {
    return !!progress[`${bookNumber}-${chapterNumber}`]
  }, [progress])

  return { markVisited, isVisited }
}
