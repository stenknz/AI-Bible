# Feature Integration — Phase A: Bible Reader Overhaul

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Bible reader into a full study tool with book/chapter navigation, verse highlighting, inline notes, bookmarks, cross-references, translation switching, and reading progress tracking.

**Architecture:** All new UI components live in `src/modules/bible/components/`. New services handle highlights, bookmarks, and cross-references. New API routes serve as thin proxies to Prisma. The existing `BibleReader` client component composes the new pieces.

**Tech Stack:** Next.js 16 App Router, Prisma ORM, TipTap (notes), Tailwind CSS v4

**Prerequisites:** Run `npx prisma db push` after schema changes, then reseed.

---

## File Map

### New Files
- `prisma/schema.prisma` — add Bookmark + CrossReference models
- `src/modules/bible/components/BookSelector.tsx` — book dropdown with testament grouping
- `src/modules/bible/components/ChapterSelector.tsx` — chapter grid popover
- `src/modules/bible/components/TranslationSelector.tsx` — translation switcher dropdown
- `src/modules/bible/components/BottomNav.tsx` — prev/next chapter bar
- `src/modules/bible/components/VerseToolbar.tsx` — per-verse highlight/note/bookmark actions
- `src/modules/bible/components/CrossReferencePanel.tsx` — cross-refs sidebar for current verse
- `src/modules/bible/components/ReadingProgress.tsx` — chapter grid with read indicators
- `src/modules/bible/services/highlight-service.ts` — CRUD for Highlights
- `src/modules/bible/services/bookmark-service.ts` — CRUD for Bookmarks
- `src/modules/bible/services/cross-reference-service.ts` — fetch cross-refs
- `src/modules/bible/hooks/useReadingProgress.ts` — track visited chapters via localStorage
- `src/app/api/highlights/route.ts` — GET/POST highlights
- `src/app/api/highlights/[id]/route.ts` — PUT/DELETE single highlight
- `src/app/api/bookmarks/route.ts` — GET/POST bookmarks
- `src/app/api/bookmarks/[id]/route.ts` — DELETE bookmark
- `src/app/api/cross-references/route.ts` — GET cross-refs for a verse

### Modified Files
- `prisma/schema.prisma` — add Bookmark, CrossReference models
- `prisma/seed.ts` — add seedCrossReferences()
- `src/modules/bible/components/BibleReader.tsx` — compose all new components
- `src/modules/bible/components/VerseDisplay.tsx` — add click handlers for toolbar

---

### Task 1: Schema — Add Bookmark and CrossReference models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add models**

Insert after the Verse model:

```prisma
model Bookmark {
  id        String   @id @default(cuid())
  userId    String
  verseId   String
  label     String?
  createdAt DateTime @default(now())

  @@unique([userId, verseId])
  @@index([userId])
}

model CrossReference {
  fromVerseId String
  toVerseId   String
  weight      Int      @default(1)
  source      String   @default("tsk")

  @@id([fromVerseId, toVerseId])
  @@index([fromVerseId])
  @@index([toVerseId])
}
```

- [ ] **Step 2: Push schema**

Run: `npx prisma db push`

Expected: "Your database is now in sync."

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Bookmark and CrossReference models"
```

---

### Task 2: Highlight Service

**Files:**
- Create: `src/modules/bible/services/highlight-service.ts`

- [ ] **Step 1: Write the service**

```typescript
import { prisma } from "@/lib/db"

export async function getUserHighlights(userId: string, verseIds?: string[]) {
  const where: any = { userId }
  if (verseIds) where.verseId = { in: verseIds }
  return prisma.highlight.findMany({ where })
}

export async function upsertHighlight(userId: string, verseId: string, color: string) {
  return prisma.highlight.upsert({
    where: { userId_verseId: { userId, verseId } },
    update: { color },
    create: { userId, verseId, color },
  })
}

export async function removeHighlight(userId: string, verseId: string) {
  return prisma.highlight.deleteMany({
    where: { userId, verseId },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/bible/services/highlight-service.ts
git commit -m "feat: add highlight service"
```

---

### Task 3: Bookmark Service

**Files:**
- Create: `src/modules/bible/services/bookmark-service.ts`

- [ ] **Step 1: Write the service**

```typescript
import { prisma } from "@/lib/db"

export async function getUserBookmarks(userId: string) {
  return prisma.bookmark.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
}

export async function addBookmark(userId: string, verseId: string, label?: string) {
  return prisma.bookmark.create({
    data: { userId, verseId, label },
  })
}

export async function removeBookmark(userId: string, verseId: string) {
  return prisma.bookmark.deleteMany({
    where: { userId, verseId },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/bible/services/bookmark-service.ts
git commit -m "feat: add bookmark service"
```

---

### Task 4: Cross-Reference Service

**Files:**
- Create: `src/modules/bible/services/cross-reference-service.ts`

- [ ] **Step 1: Write the service**

```typescript
import { prisma } from "@/lib/db"

export async function getCrossReferences(verseId: string) {
  const refs = await prisma.crossReference.findMany({
    where: { fromVerseId: verseId },
    include: {
      toVerse: {
        include: {
          chapter: { include: { book: true } },
        },
      },
    },
    orderBy: { weight: "desc" },
    take: 20,
  })
  return refs.map((r) => ({
    toVerseId: r.toVerseId,
    reference: `${r.toVerse.chapter.book.name} ${r.toVerse.chapter.number}:${r.toVerse.number}`,
    text: r.toVerse.text.slice(0, 100),
    weight: r.weight,
  }))
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/bible/services/cross-reference-service.ts
git commit -m "feat: add cross-reference service"
```

---

### Task 5: API Routes — Highlights

**Files:**
- Create: `src/app/api/highlights/route.ts`
- Create: `src/app/api/highlights/[id]/route.ts`

- [ ] **Step 1: Create highlights list route**

```typescript
import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { getUserHighlights, upsertHighlight } from "@/modules/bible/services/highlight-service"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const highlights = await getUserHighlights(session.userId)
  return NextResponse.json(highlights)
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { verseId, color } = await request.json()
  if (!verseId) return NextResponse.json({ error: "verseId required" }, { status: 400 })
  const highlight = await upsertHighlight(session.userId, verseId, color || "yellow")
  return NextResponse.json(highlight)
}
```

- [ ] **Step 2: Create highlight delete route**

```typescript
import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { removeHighlight } from "@/modules/bible/services/highlight-service"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await removeHighlight(session.userId, id)
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/highlights/
git commit -m "feat: add highlights API routes"
```

---

### Task 6: API Routes — Bookmarks

**Files:**
- Create: `src/app/api/bookmarks/route.ts`
- Create: `src/app/api/bookmarks/[id]/route.ts`

- [ ] **Step 1: Create bookmarks list/create route**

```typescript
import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { getUserBookmarks, addBookmark } from "@/modules/bible/services/bookmark-service"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const bookmarks = await getUserBookmarks(session.userId)
  return NextResponse.json(bookmarks)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { verseId, label } = await request.json()
  if (!verseId) return NextResponse.json({ error: "verseId required" }, { status: 400 })
  const bookmark = await addBookmark(session.userId, verseId, label)
  return NextResponse.json(bookmark)
}
```

- [ ] **Step 2: Create bookmark delete route**

```typescript
import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { removeBookmark } from "@/modules/bible/services/bookmark-service"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await removeBookmark(session.userId, id)
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/bookmarks/
git commit -m "feat: add bookmarks API routes"
```

---

### Task 7: API Route — Cross-References

**Files:**
- Create: `src/app/api/cross-references/route.ts`

- [ ] **Step 1: Create route**

```typescript
import { NextResponse } from "next/server"
import { getCrossReferences } from "@/modules/bible/services/cross-reference-service"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const verseId = searchParams.get("verseId")
  if (!verseId) return NextResponse.json({ error: "verseId required" }, { status: 400 })
  const refs = await getCrossReferences(verseId)
  return NextResponse.json(refs)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/cross-references/
git commit -m "feat: add cross-references API route"
```

---

### Task 8: BookSelector Component

**Files:**
- Create: `src/modules/bible/components/BookSelector.tsx`

- [ ] **Step 1: Write component**

```typescript
"use client"

import type { BookData } from "@/modules/bible/types/bible"

type Props = {
  books: BookData[]
  currentBook: number
  onSelect: (bookNumber: number) => void
}

const BOOKS_66 = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
  "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah",
  "Esther","Job","Psalm","Proverbs","Ecclesiastes","Song of Solomon",
  "Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah",
  "Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi",
  "Matthew","Mark","Luke","John","Acts",
  "Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians",
  "1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon",
  "Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation",
]

export default function BookSelector({ books, currentBook, onSelect }: Props) {
  const otBooks = BOOKS_66.slice(0, 39)
  const ntBooks = BOOKS_66.slice(39)

  return (
    <div className="relative">
      <select
        value={currentBook}
        onChange={(e) => onSelect(parseInt(e.target.value))}
        className="w-full rounded-lg border px-3 py-2 text-sm"
      >
        <optgroup label="Old Testament">
          {otBooks.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </optgroup>
        <optgroup label="New Testament">
          {ntBooks.map((name, i) => (
            <option key={i + 40} value={i + 40}>{name}</option>
          ))}
        </optgroup>
      </select>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/bible/components/BookSelector.tsx
git commit -m "feat: add BookSelector component"
```

---

### Task 9: ChapterSelector Component

**Files:**
- Create: `src/modules/bible/components/ChapterSelector.tsx`

- [ ] **Step 1: Write component**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/bible/components/ChapterSelector.tsx
git commit -m "feat: add ChapterSelector component"
```

---

### Task 10: TranslationSelector Component

**Files:**
- Create: `src/modules/bible/components/TranslationSelector.tsx`

- [ ] **Step 1: Write component**

```typescript
"use client"

import { useState, useEffect } from "react"

type Translation = {
  id: string
  code: string
  name: string
  isDefault: boolean
}

type Props = {
  current: string
  onChange: (code: string) => void
}

export default function TranslationSelector({ current, onChange }: Props) {
  const [translations, setTranslations] = useState<Translation[]>([])

  useEffect(() => {
    fetch("/api/bible/translations")
      .then((r) => r.json())
      .then(setTranslations)
      .catch(() => {})
  }, [])

  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border px-2 py-1 text-xs"
    >
      {translations.map((t) => (
        <option key={t.code} value={t.code}>{t.name}</option>
      ))}
    </select>
  )
}
```

- [ ] **Step 2: Note: This requires a `/api/bible/translations` endpoint. Add it to the bible service if not present, or create a simple API route.**

Check: Is there a translations API already?
Run: `grep -r "translations" src/app/api/bible/` 2>/dev/null || echo "No translations API"

If missing, create `src/app/api/bible/translations/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const translations = await prisma.translation.findMany({ select: { id: true, code: true, name: true, isDefault: true } })
  return NextResponse.json(translations)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/bible/components/TranslationSelector.tsx src/app/api/bible/translations/route.ts
git commit -m "feat: add TranslationSelector and translations API"
```

---

### Task 11: BottomNav Component

**Files:**
- Create: `src/modules/bible/components/BottomNav.tsx`

- [ ] **Step 1: Write component**

```typescript
"use client"

type Props = {
  bookNumber: number
  chapterNumber: number
  totalChapters: number
  bookName: string
  onNavigate: (book: number, chapter: number) => void
}

export default function BottomNav({ bookNumber, chapterNumber, totalChapters, bookName, onNavigate }: Props) {
  const hasPrev = bookNumber > 1 || chapterNumber > 1
  const hasNext = bookNumber < 66 || chapterNumber < totalChapters

  function goPrev() {
    if (chapterNumber > 1) onNavigate(bookNumber, chapterNumber - 1)
    else if (bookNumber > 1) onNavigate(bookNumber - 1, 999) // will be capped
  }

  function goNext() {
    if (chapterNumber < totalChapters) onNavigate(bookNumber, chapterNumber + 1)
    else if (bookNumber < 66) onNavigate(bookNumber + 1, 1)
  }

  return (
    <div className="sticky bottom-0 flex items-center justify-between border-t bg-background px-4 py-3">
      <button
        onClick={goPrev}
        disabled={!hasPrev}
        className="rounded-lg border px-4 py-2 text-sm disabled:opacity-30"
      >
        ← Previous
      </button>
      <span className="text-xs text-muted-foreground">
        {bookName} {chapterNumber} — Chapter {chapterNumber} of {totalChapters}
      </span>
      <button
        onClick={goNext}
        disabled={!hasNext}
        className="rounded-lg border px-4 py-2 text-sm disabled:opacity-30"
      >
        Next →
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/bible/components/BottomNav.tsx
git commit -m "feat: add BottomNav for prev/next chapter navigation"
```

---

### Task 12: VerseToolbar — Highlight, Bookmark, Note actions

**Files:**
- Create: `src/modules/bible/components/VerseToolbar.tsx`

- [ ] **Step 1: Write component**

```typescript
"use client"

import { useState } from "react"

const COLORS = [
  { name: "yellow", class: "bg-yellow-200" },
  { name: "green", class: "bg-green-200" },
  { name: "blue", class: "bg-blue-200" },
  { name: "pink", class: "bg-pink-200" },
]

type Props = {
  verseId: string
  verseNumber: number
  isHighlighted?: string | null
  isBookmarked?: boolean
  onHighlight: (color: string) => void
  onRemoveHighlight: () => void
  onBookmark: () => void
  onRemoveBookmark: () => void
  onAddNote: () => void
}

export default function VerseToolbar({
  verseId,
  verseNumber,
  isHighlighted,
  isBookmarked,
  onHighlight,
  onRemoveHighlight,
  onBookmark,
  onRemoveBookmark,
  onAddNote,
}: Props) {
  const [showColors, setShowColors] = useState(false)

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={() => setShowColors(!showColors)}
        className="rounded p-1 text-xs hover:bg-muted"
        title="Highlight"
      >
        {isHighlighted ? <span className={`inline-block h-3 w-3 rounded ${COLORS.find(c => c.name === isHighlighted)?.class || "bg-yellow-200"}`} /> : "🖍"}
      </button>
      {showColors && (
        <div className="flex gap-0.5">
          {COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => { onHighlight(c.name); setShowColors(false) }}
              className={`h-4 w-4 rounded-full ${c.class} border`}
              title={c.name}
            />
          ))}
          {isHighlighted && (
            <button onClick={() => { onRemoveHighlight(); setShowColors(false) }} className="text-xs text-red-500">✕</button>
          )}
        </div>
      )}
      <button
        onClick={() => isBookmarked ? onRemoveBookmark() : onBookmark()}
        className="rounded p-1 text-xs hover:bg-muted"
        title={isBookmarked ? "Remove bookmark" : "Bookmark"}
      >
        {isBookmarked ? "★" : "☆"}
      </button>
      <button
        onClick={onAddNote}
        className="rounded p-1 text-xs hover:bg-muted"
        title="Add note"
      >
        ✏
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/bible/components/VerseToolbar.tsx
git commit -m "feat: add VerseToolbar with highlight/bookmark/note actions"
```

---

### Task 13: CrossReferencePanel Component

**Files:**
- Create: `src/modules/bible/components/CrossReferencePanel.tsx`

- [ ] **Step 1: Write component**

```typescript
"use client"

import { useState, useEffect } from "react"

type CrossRef = {
  toVerseId: string
  reference: string
  text: string
  weight: number
}

type Props = {
  verseId: string | null
  onNavigate?: (verseId: string) => void
}

export default function CrossReferencePanel({ verseId, onNavigate }: Props) {
  const [refs, setRefs] = useState<CrossRef[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!verseId) { setRefs([]); return }
    setLoading(true)
    fetch(`/api/cross-references?verseId=${verseId}`)
      .then((r) => r.json())
      .then(setRefs)
      .catch(() => setRefs([]))
      .finally(() => setLoading(false))
  }, [verseId])

  if (!verseId || refs.length === 0) return null

  return (
    <div className="mt-4 rounded-lg border p-3">
      <h4 className="mb-2 text-xs font-semibold text-muted-foreground">Cross References</h4>
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : (
        <ul className="space-y-1">
          {refs.map((ref) => (
            <li key={ref.toVerseId}>
              <button
                onClick={() => onNavigate?.(ref.toVerseId)}
                className="text-left text-xs text-blue-600 hover:underline"
              >
                {ref.reference}
              </button>
              <p className="text-xs text-muted-foreground">{ref.text}…</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/bible/components/CrossReferencePanel.tsx
git commit -m "feat: add CrossReferencePanel component"
```

---

### Task 14: ReadingProgress Hook

**Files:**
- Create: `src/modules/bible/hooks/useReadingProgress.ts`

- [ ] **Step 1: Write hook**

```typescript
"use client"

import { useState, useEffect } from "react"

const STORAGE_KEY = "biblehub-reading-progress"

type Progress = Record<string, string> // "book-chapter" → visited timestamp

export function useReadingProgress() {
  const [progress, setProgress] = useState<Progress>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setProgress(JSON.parse(stored))
    } catch {}
  }, [])

  function markVisited(bookNumber: number, chapterNumber: number) {
    const key = `${bookNumber}-${chapterNumber}`
    const updated = { ...progress, [key]: new Date().toISOString() }
    setProgress(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
  }

  function isVisited(bookNumber: number, chapterNumber: number): boolean {
    return !!progress[`${bookNumber}-${chapterNumber}`]
  }

  return { markVisited, isVisited }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/bible/hooks/useReadingProgress.ts
git commit -m "feat: add useReadingProgress hook"
```

---

### Task 15: Update VerseDisplay with click/toolbar interactions

**Files:**
- Modify: `src/modules/bible/components/VerseDisplay.tsx`

- [ ] **Step 1: Read current file**

Run: `cat src/modules/bible/components/VerseDisplay.tsx`

- [ ] **Step 2: Rewrite to include VerseToolbar and click-to-select**

```typescript
"use client"

import { useState } from "react"
import VerseToolbar from "./VerseToolbar"
import CrossReferencePanel from "./CrossReferencePanel"
import type { VerseData } from "@/modules/bible/types/bible"

type Props = {
  verses: VerseData[]
  highlightedVerses: Set<string>
  bookmarkedVerses: Set<string>
  onHighlight: (verseId: string, color: string) => void
  onRemoveHighlight: (verseId: string) => void
  onBookmark: (verseId: string) => void
  onRemoveBookmark: (verseId: string) => void
  onAddNote: (verseId: string) => void
  onNavigate?: (verseId: string) => void
}

export default function VerseDisplay({
  verses,
  highlightedVerses,
  bookmarkedVerses,
  onHighlight,
  onRemoveHighlight,
  onBookmark,
  onRemoveBookmark,
  onAddNote,
  onNavigate,
}: Props) {
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null)

  return (
    <div className="max-w-2xl mx-auto space-y-1">
      {verses.map((verse) => {
        const isHighlighted = highlightedVerses.has(verse.id)
        return (
          <div
            key={verse.id}
            className={`group flex gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-muted/50 ${
              isHighlighted ? "bg-yellow-100 dark:bg-yellow-900/20" : ""
            }`}
          >
            <span
              className="mt-0.5 min-w-[2ch] text-right text-xs text-muted-foreground select-none cursor-pointer"
              onClick={() => setSelectedVerse(selectedVerse === verse.id ? null : verse.id)}
            >
              {verse.number}
            </span>
            <span
              className={`flex-1 text-[var(--reader-font-size,16px)] leading-[var(--reader-line-height,1.6)] ${
                verse.isRedLetter ? "text-red-600 dark:text-red-400" : ""
              }`}
            >
              {verse.text}
            </span>
            <VerseToolbar
              verseId={verse.id}
              verseNumber={verse.number}
              isHighlighted={null} // TODO: pass actual color from highlights state
              isBookmarked={bookmarkedVerses.has(verse.id)}
              onHighlight={(color) => onHighlight(verse.id, color)}
              onRemoveHighlight={() => onRemoveHighlight(verse.id)}
              onBookmark={() => onBookmark(verse.id)}
              onRemoveBookmark={() => onRemoveBookmark(verse.id)}
              onAddNote={() => onAddNote(verse.id)}
            />
            {selectedVerse === verse.id && (
              <CrossReferencePanel verseId={verse.id} onNavigate={onNavigate} />
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/bible/components/VerseDisplay.tsx
git commit -m "feat: add verse toolbar and cross-ref panel to VerseDisplay"
```

---

### Task 16: Update BibleReader to compose all new components

**Files:**
- Modify: `src/modules/bible/components/BibleReader.tsx`

- [ ] **Step 1: Read current file**

Run: `cat src/modules/bible/components/BibleReader.tsx`

- [ ] **Step 2: Rewrite to compose BookSelector, ChapterSelector, TranslationSelector, BottomNav, VerseDisplay with highlights/bookmarks**

```typescript
"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import BookSelector from "./BookSelector"
import ChapterSelector from "./ChapterSelector"
import BottomNav from "./BottomNav"
import VerseDisplay from "./VerseDisplay"
import { useReadingProgress } from "@/modules/bible/hooks/useReadingProgress"
import type { ChapterData, BookData } from "@/modules/bible/types/bible"

type Props = {
  bookNumber: number
  chapterNumber: number
  bookName: string
  totalChapters: number
  initialChapter?: ChapterData | null
  books?: BookData[]
  highlightedVerses?: string[]
  bookmarkedVerses?: string[]
}

export default function BibleReader({
  bookNumber,
  chapterNumber,
  bookName,
  totalChapters,
  initialChapter,
  books,
  highlightedVerses = [],
  bookmarkedVerses = [],
}: Props) {
  const router = useRouter()
  const { markVisited } = useReadingProgress()
  const [chapter, setChapter] = useState<ChapterData | null | undefined>(initialChapter)
  const [showChapterGrid, setShowChapterGrid] = useState(false)

  const highlightSet = new Set(highlightedVerses)
  const bookmarkSet = new Set(bookmarkedVerses)

  const navigate = useCallback((book: number, chapter: number) => {
    router.push(`/bible/${book}/${chapter}`)
  }, [router])

  async function handleHighlight(verseId: string, color: string) {
    await fetch("/api/highlights", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verseId, color }),
    })
  }

  async function handleRemoveHighlight(verseId: string) {
    await fetch(`/api/highlights/${verseId}`, { method: "DELETE" })
  }

  async function handleBookmark(verseId: string) {
    await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verseId }),
    })
  }

  async function handleRemoveBookmark(verseId: string) {
    await fetch(`/api/bookmarks/${verseId}`, { method: "DELETE" })
  }

  function handleAddNote(verseId: string) {
    router.push(`/notes/new?verseId=${verseId}`)
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Top bar: book + chapter + translation selectors */}
      <div className="flex items-center gap-2 px-4 py-3">
        {books && (
          <BookSelector books={books} currentBook={bookNumber} onSelect={(b) => navigate(b, 1)} />
        )}
        <div className="relative">
          <button
            onClick={() => setShowChapterGrid(!showChapterGrid)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Chapter {chapterNumber}
          </button>
          {showChapterGrid && (
            <div className="absolute left-0 top-full z-10 mt-1 rounded-lg border bg-background p-2 shadow-lg">
              <ChapterSelector
                totalChapters={totalChapters}
                currentChapter={chapterNumber}
                onSelect={(ch) => { setShowChapterGrid(false); navigate(bookNumber, ch) }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Verses */}
      <VerseDisplay
        verses={chapter?.verses || []}
        highlightedVerses={highlightSet}
        bookmarkedVerses={bookmarkSet}
        onHighlight={handleHighlight}
        onRemoveHighlight={handleRemoveHighlight}
        onBookmark={handleBookmark}
        onRemoveBookmark={handleRemoveBookmark}
        onAddNote={handleAddNote}
      />

      {/* Bottom navigation */}
      <BottomNav
        bookNumber={bookNumber}
        chapterNumber={chapterNumber}
        totalChapters={totalChapters}
        bookName={bookName}
        onNavigate={navigate}
      />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/bible/components/BibleReader.tsx
git commit -m "feat: compose book/chapter selector, toolbar, bottom nav into BibleReader"
```

---

### Task 17: Update BibleChapterPage to pass initial data

**Files:**
- Modify: `src/app/(dashboard)/bible/[book]/[chapter]/page.tsx`

- [ ] **Step 1: Read current page**

Run: `cat src/app/(dashboard)/bible/[book]/[chapter]/page.tsx`

- [ ] **Step 2: Add data fetching for highlights, bookmarks, books, cross-refs**

```typescript
import { getChapterCounts, getChapter } from "@/modules/bible/services/bible-service"
import { prisma } from "@/lib/db"
import { getSession } from "@/modules/auth/services/session"
export const dynamic = "force-dynamic"
import BibleReader from "@/modules/bible/components/BibleReader"

type Props = {
  params: Promise<{ book: string; chapter: string }>
}

export default async function BibleChapterPage({ params }: Props) {
  const { book, chapter } = await params
  const bookNumber = parseInt(book, 10)
  const chapterNumber = parseInt(chapter, 10)
  const chapterCounts = await getChapterCounts()
  const bookInfo = chapterCounts[bookNumber - 1]
  const bookName = bookInfo?.name || `Book ${bookNumber}`
  const totalChapters = bookInfo?.chapters || 150

  const [chapterData, translations, session] = await Promise.all([
    getChapter(bookNumber, chapterNumber),
    prisma.translation.findMany({ select: { id: true, code: true, name: true, isDefault: true } }),
    getSession(),
  ])

  let highlightedVerses: string[] = []
  let bookmarkedVerses: string[] = []
  if (session) {
    const [highlights, bookmarks] = await Promise.all([
      prisma.highlight.findMany({ where: { userId: session.userId } }),
      prisma.bookmark.findMany({ where: { userId: session.userId } }),
    ])
    highlightedVerses = highlights.map((h) => h.verseId)
    bookmarkedVerses = bookmarks.map((b) => b.verseId)
  }

  return (
    <BibleReader
      bookNumber={bookNumber}
      chapterNumber={chapterNumber}
      bookName={bookName}
      totalChapters={totalChapters}
      initialChapter={chapterData}
      books={chapterCounts.map((b, i) => ({ id: String(i + 1), number: i + 1, name: b.name, testament: i < 39 ? "OT" : "NT" }))}
      highlightedVerses={highlightedVerses}
      bookmarkedVerses={bookmarkedVerses}
    />
  )
}
```

Add the `BookData` import type if needed.

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/bible/[book]/[chapter]/page.tsx
git commit -m "feat: pass highlights, bookmarks, books to BibleReader"
```

---

### Task 18: Seed — TSK Cross-References

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Add seedCrossReferences function**

To be implemented when the TSK/Gnosis cross-reference data is available. For now, create a placeholder that logs a message:

```typescript
async function seedCrossReferences() {
  console.log("  🔗 Skipping cross-reference import — data not yet available")
  // TODO: Import TSK cross-refs from https://github.com/CrossReferences-org/bible-cross-references
  // Format: TSV with columns: book, chapter, verse, anchor, references
  // Parse and insert into CrossReference table
}
```

Call it from the main seed flow after `seedKnowledgeGraph()`.

- [ ] **Step 2: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: add cross-reference seed placeholder"
```

---

## Verification

After all tasks are complete:

1. Rebuild Docker: `docker compose -f docker/docker-compose.dev.yml down && docker compose -f docker/docker-compose.dev.yml up -d --build`
2. Run seed: `docker exec docker-app-1 npx prisma db seed`
3. Open `/bible/1/1` and verify:
   - Book selector works (dropdown, OT/NT groups)
   - Chapter selector works (grid popover)
   - Bottom nav works (prev/next buttons, chapter progress)
   - Verse hover shows toolbar (highlight colors, bookmark star, note pencil)
   - Clicking verse number shows cross-ref panel (empty for now)
4. Open `/notes/new?verseId=<id>` — should create a verse-linked note
