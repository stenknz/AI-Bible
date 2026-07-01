"use client"

import { useState, useEffect, useCallback } from "react"
import type { ChapterData } from "@/modules/bible/types/bible"

export function useBible(bookNumber: number, chapterNumber: number, translation: string = "KJV") {
  const [chapter, setChapter] = useState<ChapterData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchChapter = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/bible/${translation}/${bookNumber}/${chapterNumber}`)
      if (res.ok) {
        const data = await res.json()
        setChapter(data)
      }
    } catch (e) {
      console.error("Failed to fetch chapter", e)
    } finally {
      setLoading(false)
    }
  }, [bookNumber, chapterNumber, translation])

  useEffect(() => {
    fetchChapter()
  }, [fetchChapter])

  return { chapter, loading, refetch: fetchChapter }
}
