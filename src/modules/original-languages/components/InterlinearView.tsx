"use client"

import { useState, useEffect } from "react"
import type { InterlinearVerse } from "@/modules/original-languages/services/interlinear-service"

type Props = {
  verseId: string
}

export function InterlinearView({ verseId }: Props) {
  const [data, setData] = useState<InterlinearVerse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWord, setSelectedWord] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/original-languages/interlinear/${verseId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [verseId])

  if (loading) return <p className="text-sm text-muted-foreground py-4">Loading interlinear...</p>
  if (!data) return <p className="text-sm text-muted-foreground py-4">No interlinear data available for this verse.</p>

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Original Language</p>
      <div className="flex flex-wrap gap-2">
        {data.words.map((word) => (
          <button
            key={word.position}
            onClick={() => setSelectedWord(selectedWord === word.position ? null : word.position)}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
              selectedWord === word.position ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "hover:bg-muted"
            }`}
          >
            <p className="font-medium text-base" dir={word.strongNumber.startsWith("H") ? "rtl" : "ltr"}>
              {word.originalText}
            </p>
            <p className="text-xs text-muted-foreground">{word.transliteration}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">{word.strongNumber}</p>
          </button>
        ))}
      </div>

      {selectedWord !== null && (
        <div className="rounded-lg border p-4">
          {(() => {
            const word = data.words.find((w) => w.position === selectedWord)
            if (!word) return null
            return (
              <div className="space-y-2 text-sm">
                <p className="font-semibold">{word.lemma}</p>
                {word.morphology && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                    <span>Part of Speech: {word.morphology.partOfSpeech}</span>
                    {word.morphology.tense && <span>Tense: {word.morphology.tense}</span>}
                    {word.morphology.mood && <span>Mood: {word.morphology.mood}</span>}
                    {word.morphology.voice && <span>Voice: {word.morphology.voice}</span>}
                    {word.morphology.person && <span>Person: {word.morphology.person}</span>}
                    {word.morphology.number && <span>Number: {word.morphology.number}</span>}
                    {word.morphology.gender && <span>Gender: {word.morphology.gender}</span>}
                    {word.morphology.case && <span>Case: {word.morphology.case}</span>}
                  </div>
                )}
                <button
                  onClick={() => window.open(`/study?strongs=${word.strongNumber}`, "_blank")}
                  className="mt-2 text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  Study {word.strongNumber}
                </button>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
