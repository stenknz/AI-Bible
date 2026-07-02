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
    <div className="flex max-h-[360px] flex-wrap gap-1.5 overflow-y-auto">
      {chapters.map((ch) => (
        <button
          key={ch}
          onClick={() => onSelect(ch)}
          className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors ${
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
