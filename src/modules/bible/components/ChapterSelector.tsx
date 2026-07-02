"use client"

import { useMemo } from "react"

type Props = {
  totalChapters: number
  currentChapter: number
  onSelect: (chapter: number) => void
}

export default function ChapterSelector({ totalChapters, currentChapter, onSelect }: Props) {
  const chapters = useMemo(() => Array.from({ length: totalChapters }, (_, i) => i + 1), [totalChapters])

  return (
    <div className="grid grid-cols-10 gap-1">
      {chapters.map((ch) => (
        <button
          key={ch}
          onClick={() => onSelect(ch)}
          className={`rounded px-2 py-1 text-xs transition-colors ${
            ch === currentChapter
              ? "bg-blue-600 text-white"
              : "hover:bg-muted"
          }`}
        >
          {ch}
        </button>
      ))}
    </div>
  )
}
