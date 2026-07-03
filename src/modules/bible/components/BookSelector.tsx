"use client"

type Props = {
  books: { id: string; number: number; name: string; testament: string }[]
  currentBook: number
  onSelect: (bookNumber: number) => void
}

export default function BookSelector({ books, currentBook, onSelect }: Props) {
  return (
    <select
      value={currentBook}
      onChange={(e) => onSelect(parseInt(e.target.value))}
      className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground transition-all cursor-pointer focus:ring-2 focus:ring-secondary/20 focus:border-secondary appearance-none"
    >
      <optgroup label="Old Testament">
        {books.filter((b) => b.testament === "OT").map((b) => (
          <option key={b.number} value={b.number}>{b.name}</option>
        ))}
      </optgroup>
      <optgroup label="New Testament">
        {books.filter((b) => b.testament === "NT").map((b) => (
          <option key={b.number} value={b.number}>{b.name}</option>
        ))}
      </optgroup>
    </select>
  )
}
