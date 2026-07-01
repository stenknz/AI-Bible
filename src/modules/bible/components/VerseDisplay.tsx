import type { VerseData } from "@/modules/bible/types/bible"

type Props = {
  verse: VerseData
  showVerseNumbers?: boolean
}

export function VerseDisplay({ verse, showVerseNumbers = true }: Props) {
  return (
    <div className="group flex gap-2 leading-relaxed">
      {showVerseNumbers && (
        <span className="mt-0.5 min-w-[1.5em] text-right text-xs text-muted-foreground select-none">
          {verse.number}
        </span>
      )}
      <span className={verse.isRedLetter ? "text-red-600 dark:text-red-400" : ""}>
        {verse.text}
      </span>
    </div>
  )
}
