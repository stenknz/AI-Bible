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
    <div className="grid max-h-[300px] grid-cols-5 gap-1 overflow-y-auto md:grid-cols-8">
      {chapters.map((ch) => (
        <button
          key={ch}
          onClick={() => onSelect(ch)}
          className={`min-w-[2.5rem] rounded px-2 py-1.5 text-sm font-medium transition-colors ${
            ch === currentChapter
              ? "bg-blue-600 text-white"
              : "hover:bg-muted text-foreground"
          }`}
        >
          {ch}
        </button>
      ))}
    </div>
  )
}
