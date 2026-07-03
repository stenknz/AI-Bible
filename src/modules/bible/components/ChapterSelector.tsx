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
    <div className="flex max-h-[360px] flex-wrap gap-2 overflow-y-auto p-1">
      {chapters.map((ch) => (
        <button
          key={ch}
          onClick={() => onSelect(ch)}
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-all ${
            ch === currentChapter
              ? "bg-secondary text-white shadow-sm"
              : "hover:bg-muted text-foreground hover:shadow-sm"
          }`}
        >
          {ch}
        </button>
      ))}
    </div>
  )
}
