"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { ChapterData } from "@/modules/bible/types/bible"

export function useBible(bookNumber: number, chapterNumber: number, translation: string = "KJV") {
  const [chapter, setChapter] = useState<ChapterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchChapter = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    setChapter(null)

    try {
      const res = await fetch(`/api/bible/${translation}/${bookNumber}/${chapterNumber}`, {
        signal: controller.signal,
      })
      if (res.ok) {
        const data = await res.json()
        if (!controller.signal.aborted) {
          setChapter(data)
        }
      } else {
        if (!controller.signal.aborted) {
          setError("Chapter not found")
        }
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        if (e instanceof DOMException && e.name === "AbortError") return
        setError("Failed to load chapter. Please try again.")
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [bookNumber, chapterNumber, translation])

  useEffect(() => {
    fetchChapter()
    return () => {
      abortRef.current?.abort()
    }
  }, [fetchChapter])

  return { chapter, loading, error, refetch: fetchChapter }
}
