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
      className="w-full rounded-lg border px-3 py-2 text-sm"
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
