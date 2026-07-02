# BibleHub AI — Local Development Environment & Full Database Seed

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete local development environment with Docker that imports the full KJV Bible, seeds comprehensive development data, and makes the app feel mature and well-used from first load.

**Architecture:** Single `prisma/seed.ts` orchestrates all seeding in an idempotent, transactional manner. Docker Compose for local dev with hot reload. Mock AI provider for offline testing. Dev tools page available only in development mode.

**Tech Stack:** Docker Compose (PostgreSQL + pgvector + Next.js), Prisma, tsx for seed execution, Node.js Readline for import progress

---

## Task 1: Docker Development Environment

**Files:**
- Create: `docker/docker-compose.dev.yml`
- Create: `docker/Dockerfile.dev`
- Create: `.env.local.example`
- Modify: `package.json` (add dev + seed scripts)

### `docker/docker-compose.dev.yml`

```yaml
version: "3.8"

services:
  db:
    image: pgvector/pgvector:pg16
    restart: unless-stopped
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: biblehub
      POSTGRES_USER: biblehub
      POSTGRES_PASSWORD: biblehub_dev
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U biblehub"]
      interval: 5s
      timeout: 5s
      retries: 10

  app:
    build:
      context: ..
      dockerfile: docker/Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ../src:/app/src
      - ../public:/app/public
      - ../prisma:/app/prisma
      - ../kjv.txt:/app/kjv.txt
      - /app/node_modules
      - /app/.next
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://biblehub:biblehub_dev@db:5432/biblehub
      JWT_SECRET: dev-secret-do-not-use-in-production
      NEXT_PUBLIC_APP_NAME: "BibleHub AI (Dev)"
      ACTIVE_PROVIDER: mock
      ADMIN_EMAIL: admin@example.com
      ADMIN_PASSWORD: ChangeMe123!
      NODE_ENV: development
    env_file:
      - ../.env.local

volumes:
  pgdata:
```

### `docker/Dockerfile.dev`

```dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "run", "dev"]
```

### `.env.local.example`

```
DATABASE_URL="postgresql://biblehub:biblehub_dev@localhost:5432/biblehub"
JWT_SECRET="dev-secret-do-not-use-in-production"
NEXT_PUBLIC_APP_NAME="BibleHub AI (Dev)"
ACTIVE_PROVIDER="mock"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="ChangeMe123!"
```

### Package scripts to add

```json
"scripts": {
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "db:seed": "tsx prisma/seed.ts",
  "db:reset": "prisma db push --force-reset && tsx prisma/seed.ts",
  "db:studio": "prisma studio",
  "dev:up": "docker compose -f docker/docker-compose.dev.yml up -d",
  "dev:down": "docker compose -f docker/docker-compose.dev.yml down",
  "dev:reset": "docker compose -f docker/docker-compose.dev.yml down -v && docker compose -f docker/docker-compose.dev.yml up -d",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Install vitest: `npm install -D vitest`

**Commit:** `git add -A && git commit -m "feat: add Docker dev environment with hot reload"`

---

## Task 2: Standalone CLI Bible Import Script

**Files:**
- Create: `prisma/import-bible.ts`

A standalone import script with progress bar. Separate from seed.ts so it can be run independently.

```typescript
import { PrismaClient } from "@prisma/client"
import { readFileSync } from "fs"
import { BOOKS_66, GOSPELS } from "../src/modules/bible/constants/books"

const prisma = new PrismaClient()

async function importBible(filePath: string, code: string, name: string) {
  console.log(`\n📖 Importing ${name} (${code}) from ${filePath}...`)
  const startTime = Date.now()

  const content = readFileSync(filePath, "utf-8")
  const lines = content.split("\n").filter((l) => l.trim())
  let imported = 0, skipped = 0
  const errors: string[] = []

  const translation = await prisma.translation.upsert({
    where: { code }, update: { name }, create: { code, name },
  })

  type Row = { bookName: string; chapterNum: number; verseNum: number; text: string }
  const verseData: Row[] = []

  for (const line of lines) {
    if (line === code || line.startsWith("King James Bible")) continue
    const match = line.match(/^(.+?)\s(\d+):(\d+)\t(.+)$/)
    if (!match) { skipped++; continue }
    verseData.push({
      bookName: match[1].trim(),
      chapterNum: parseInt(match[2], 10),
      verseNum: parseInt(match[3], 10),
      text: match[4].trim(),
    })
  }

  const books = new Map<string, Row[]>()
  for (const v of verseData) {
    const existing = books.get(v.bookName) || []
    existing.push(v)
    books.set(v.bookName, existing)
  }

  let totalBooks = 0, totalChapters = 0

  for (const [bookName, verses] of books) {
    const bookIndex = BOOKS_66.indexOf(bookName as any)
    if (bookIndex === -1) { errors.push(`Unknown book: ${bookName}`); continue }

    const book = await prisma.book.upsert({
      where: { translationId_number: { translationId: translation.id, number: bookIndex + 1 } },
      update: { name: bookName, testament: bookIndex < 39 ? "OLD" : "NEW" },
      create: { translationId: translation.id, number: bookIndex + 1, name: bookName, testament: bookIndex < 39 ? "OLD" : "NEW" },
    })
    totalBooks++

    const chapters = new Map<number, Row[]>()
    for (const v of verses) {
      const existing = chapters.get(v.chapterNum) || []
      existing.push(v)
      chapters.set(v.chapterNum, existing)
    }

    for (const [chapterNum, chapterVerses] of chapters) {
      const chapter = await prisma.chapter.upsert({
        where: { bookId_number: { bookId: book.id, number: chapterNum } },
        update: {},
        create: { bookId: book.id, number: chapterNum },
      })
      totalChapters++

      for (const v of chapterVerses) {
        const isRed = GOSPELS.has(bookName) && (v.text.startsWith('"') || v.text.startsWith("And he said") || v.text.startsWith("Jesus said"))
        await prisma.verse.upsert({
          where: { chapterId_number: { chapterId: chapter.id, number: v.verseNum } },
          update: { text: v.text, isRedLetter: isRed },
          create: { chapterId: chapter.id, number: v.verseNum, text: v.text, isRedLetter: isRed },
        })
        imported++
      }
    }
    process.stdout.write(`\r  📚 ${bookName.padEnd(20)} ${verses.length} verses`)
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n\n✅ Import: ${imported} verses in ${duration}s`)

  const vBooks = await prisma.book.count({ where: { translationId: translation.id } })
  const vVerses = await prisma.verse.count({ where: { chapter: { book: { translationId: translation.id } } } })
  console.log(`📊 Verify: ${vBooks} books, ${vVerses} verses ✅`)

  await prisma.$disconnect()
}

const filePath = process.argv[2] || "kjv.txt"
const code = process.argv[3] || "KJV"
const name = process.argv[4] || "King James Version"

importBible(filePath, code, name).catch((e) => { console.error(e); process.exit(1) })
```

**Commit:** `git add -A && git commit -m "feat: add standalone CLI Bible import script"`

---

## Task 3: Mock AI Provider

**Files:**
- Create: `src/modules/ai/providers/mock.ts`

A mock provider returning realistic predefined responses:

```typescript
import type { AIProvider, ChatMessage, ChatResponse } from "@/modules/ai/types/ai"

const RESPONSES: Record<string, string> = {
  explain: `**Explanation:** This passage reveals God's faithful character. The original language conveys certainty and divine truth. In context, it reminds believers that God's promises are trustworthy. Cross-reference: Deuteronomy 7:9, 2 Timothy 2:13.`,
  summary: `**Summary:** Key themes include divine initiative, human response in faith, and the corporate nature of salvation. Structure: declaration → explanation → application.`,
  devotional: `**Devotional:** Reflect on how this truth applies today. Write down one application and share it. *Prayer:* Lord, help me live this out. Amen.`,
  crossRefs: `**Cross References:** Psalm 119:105, Proverbs 3:5-6, Isaiah 55:11, Matthew 4:4, Romans 15:4`,
}

export class MockAIProvider implements AIProvider {
  readonly name = "mock"

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || ""
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 800))

    let content = RESPONSES.explain
    if (lastMsg.includes("summar")) content = RESPONSES.summary
    else if (lastMsg.includes("devotion")) content = RESPONSES.devotional
    else if (lastMsg.includes("cross")) content = RESPONSES.crossRefs

    return { content, finishReason: "stop" }
  }

  async *stream(...args: any[]): AsyncIterable<ChatResponse> {
    const result = await this.chat(args[0])
    for (const char of result.content) {
      yield { content: char, finishReason: "stop" }
      await new Promise((r) => setTimeout(r, 10))
    }
  }

  async embeddings(texts: string[]): Promise<number[][]> {
    return texts.map(() => Array(1536).fill(0).map(() => Math.random() * 2 - 1))
  }
}
```

Register it in `src/app/layout.tsx`:
```typescript
if (typeof window === "undefined") {
  const { MockAIProvider } = await import("@/modules/ai/providers/mock")
  providerRegistry.register("mock", new MockAIProvider())
}
```

**Commit:** `git add -A && git commit -m "feat: add mock AI provider for offline development"`

---

## Task 4: Comprehensive Seed Script

**Files:**
- Rewrite: `prisma/seed.ts`

This is the largest task. The seed must be **idempotent** — safe to run repeatedly.

### Structure:

```
prisma/seed.ts
├── 1. Parse KJV.txt → in-memory verse index
├── 2. Create Translation (KJV)
├── 3. Batch insert all books, chapters, verses (using createMany + skipDuplicates)
├── 4. Create users (admin + bible student) with preferences
├── 5. Create highlights (35 across OT/NT with colors and tags)
├── 6. Create reading plan templates (7 plans with day details)
├── 7. Create user reading plans with progress
├── 8. Create prayer categories and 30 prayer entries
├── 9. Create 75+ study notes (TipTap JSON, distributed across all 66 books)
├── 10. Create bookmarks (10 key passages)
├── 11. Seed map places (15 biblical locations with coords)
├── 12. Seed timeline periods + events (10 eras, 30+ events)
├── 13. Seed knowledge graph entities + relations
├── 14. Seed original language demo data (50 Strong's, interlinear for John 3:16)
├── 15. Create DailyVerse entries for 7 days
├── 16. Create feature toggles
├── 17. Verify all data
├── 18. Print summary
```

### Key patterns:

**Idempotent user creation:**
```typescript
async function upsertUser(email: string, password: string, name: string, role: "ADMIN" | "USER") {
  const hash = await bcrypt.hash(password, 12)
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash: hash },
    create: { email, passwordHash: hash, name, role },
  })
}
```

**Verse ID resolution helper:**
```typescript
// Pre-resolve all verse IDs into a map for fast lookups
async function buildVerseIndex() {
  const verses = await prisma.verse.findMany({
    include: { chapter: { include: { book: true } } },
  })
  const index = new Map<string, string>()
  for (const v of verses) {
    index.set(`${v.chapter.book.name}|${v.chapter.number}|${v.number}`, v.id)
  }
  return index
}
```

**75 notes distribution:**
- Pentateuch (15): Creation, Fall, Flood, Abraham, Isaac, Jacob, Joseph, Exodus, Law
- History (10): Joshua, Judges, Ruth, David, Solomon, Elijah, Hezekiah, Nehemiah
- Wisdom (10): Job, Psalms (5), Proverbs (3), Ecclesiastes (1), Song (1)
- Prophets (10): Isaiah, Jeremiah, Ezekiel, Daniel, Minor Prophets
- Gospels (15): Matthew (5), Mark (3), Luke (4), John (3)
- Acts + Epistles (15): Acts, Romans, Corinthians, Galatians, Ephesians, Philippians, Hebrews, James, 1 Peter, 1 John

Each note uses TipTap JSON format:
```typescript
{ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "..." }] }] }
```

**30 prayer entries:**
```typescript
const PRAYERS = [
  { title: "Family Salvation", content: "Lord, bring my family to know You.", category: "Family", isAnswered: false },
  { title: "Church Leadership", content: "Raise up godly leaders for our church.", category: "Church", isAnswered: false },
  // ... 28 more
]
```

**Verification:**
```typescript
console.log(`
📊 Seed Complete
━━━━━━━━━━━━━━━━━━━━━━
Users:       ${userCount}
Books:       ${bookCount}
Chapters:    ${chapterCount}
Verses:      ${verseCount}
Notes:       ${noteCount}
Highlights:  ${highlightCount}
Prayers:     ${prayerCount}
Places:      ${placeCount}
Events:      ${eventCount}
Duration:    ${duration}s
━━━━━━━━━━━━━━━━━━━━━━
`)
```

**Commit:** `git add -A && git commit -m "feat: rewrite seed script with full KJV import and comprehensive demo data"`

---

## Task 5: Dev Tools Page

**Files:**
- Create: `src/app/dev-tools/page.tsx`
- Create: `src/app/api/dev/status/route.ts`
- Create: `src/app/api/dev/seed/route.ts`
- Create: `src/app/api/dev/reset/route.ts`
- Create: `src/app/api/dev/reimport/route.ts`

### Dev tools page — guarded by NODE_ENV:

```typescript
"use client"

import { useState, useEffect } from "react"

export default function DevToolsPage() {
  const [status, setStatus] = useState<any>(null)
  const [running, setRunning] = useState<string | null>(null)
  const [output, setOutput] = useState("")

  useEffect(() => {
    if (process.env.NODE_ENV === "production") window.location.href = "/"
  }, [])

  async function runAction(action: string) {
    setRunning(action)
    setOutput(`Running ${action}...`)
    const res = await fetch(`/api/dev/${action}`, { method: "POST" })
    setOutput(JSON.stringify(await res.json(), null, 2))
    setRunning(null)
    fetchStatus()
  }

  async function fetchStatus() {
    const res = await fetch("/api/dev/status")
    setStatus(await res.json())
  }

  useEffect(() => { fetchStatus() }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-xl font-semibold">Development Tools</h1>
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-600 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
        ⚠️ This page is ONLY available in development mode.
      </div>

      {status && (
        <div className="mb-6 grid grid-cols-4 gap-3">
          {Object.entries(status).filter(([k]) => !k.startsWith("_")).map(([key, val]) => (
            <div key={key} className="rounded-lg border p-3 text-center">
              <p className="text-lg font-semibold">{val as number}</p>
              <p className="text-xs text-muted-foreground">{key}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        {["status", "seed", "reimport", "reset"].map((action) => (
          <button
            key={action}
            onClick={() => runAction(action)}
            disabled={running !== null}
            className={`rounded-lg px-4 py-2 text-sm ${
              action === "reset" ? "bg-red-600 text-white hover:bg-red-700" : "bg-blue-600 text-white hover:bg-blue-700"
            } disabled:opacity-50`}
          >
            {running === action ? "..." : action === "reset" ? "Reset DB" : action === "reimport" ? "Re-import KJV" : `Run ${action}`}
          </button>
        ))}
      </div>

      {output && (
        <pre className="max-h-96 overflow-auto rounded-lg border bg-muted p-4 text-xs">{output}</pre>
      )}
    </div>
  )
}
```

Each API route guards with:
```typescript
if (process.env.NODE_ENV !== "development") {
  return NextResponse.json({ error: "Only available in development" }, { status: 403 })
}
```

**Status route** returns counts: users, books, chapters, verses, notes, highlights, prayers, places, timeline entries.

**Seed route** spawns `tsx prisma/seed.ts` via child_process (or reuses the seed logic).

**Reset route** runs `prisma db push --force-reset` then seed.

**Reimport route** runs `tsx prisma/import-bible.ts kjv.txt KJV "King James Version"`.

**Commit:** `git add -A && git commit -m "feat: add dev tools page with database management"`

---

## Task 6: Automated Tests

**Files:**
- Create: `tests/seed.test.ts`
- Create: `vitest.config.ts`

### `vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 30000,
  },
})
```

### `tests/seed.test.ts`

```typescript
import { PrismaClient } from "@prisma/client"
import { describe, it, expect, afterAll } from "vitest"

const prisma = new PrismaClient()
afterAll(async () => { await prisma.$disconnect() })

describe("KJV Import", () => {
  it("has 66 books", async () => {
    const c = await prisma.book.count({ where: { translation: { code: "KJV" } } })
    expect(c).toBe(66)
  })

  it("has ~1,189 chapters", async () => {
    const c = await prisma.chapter.count({ where: { book: { translation: { code: "KJV" } } } })
    expect(c).toBeGreaterThanOrEqual(1189)
  })

  it("has ~31,102 verses", async () => {
    const c = await prisma.verse.count({ where: { chapter: { book: { translation: { code: "KJV" } } } } })
    expect(c).toBeGreaterThanOrEqual(31102)
  })

  it("has no duplicate verses", async () => {
    const verses = await prisma.verse.findMany({ select: { chapterId: true, number: true } })
    const keys = verses.map((v) => `${v.chapterId}-${v.number}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("Genesis 1:1 exists", async () => {
    const v = await prisma.verse.findFirst({
      where: { chapter: { book: { name: "Genesis", translation: { code: "KJV" } }, number: 1 }, number: 1 },
    })
    expect(v?.text).toContain("beginning")
  })
})

describe("Seed Data", () => {
  it("has admin and user accounts", async () => {
    expect(await prisma.user.findUnique({ where: { email: "admin@example.com" } })).toBeTruthy()
    expect(await prisma.user.findUnique({ where: { email: "user@example.com" } })).toBeTruthy()
  })

  it("has 75+ notes for the user", async () => {
    const user = await prisma.user.findUnique({ where: { email: "user@example.com" } })
    const c = await prisma.note.count({ where: { userId: user!.id } })
    expect(c).toBeGreaterThanOrEqual(75)
  })

  it("has highlights in OT and NT", async () => {
    const ot = await prisma.highlight.count({ where: { verse: { chapter: { book: { testament: "OLD" } } } } })
    const nt = await prisma.highlight.count({ where: { verse: { chapter: { book: { testament: "NEW" } } } } })
    expect(ot).toBeGreaterThan(10)
    expect(nt).toBeGreaterThan(10)
  })

  it("has 10+ map places", async () => {
    expect(await prisma.place.count()).toBeGreaterThanOrEqual(10)
  })

  it("has 10+ timeline events", async () => {
    expect(await prisma.timelineEntry.count()).toBeGreaterThanOrEqual(10)
  })

  it("has 20+ prayer entries", async () => {
    expect(await prisma.prayerRequest.count()).toBeGreaterThanOrEqual(20)
  })

  it("has 5+ reading plan templates", async () => {
    expect(await prisma.readingPlanTemplate.count()).toBeGreaterThanOrEqual(5)
  })
})
```

**Commit:** `git add -A && git commit -m "feat: add automated tests for seed verification"`

---

## Task 7: README

**Files:**
- Create: `README.md`

```markdown
# BibleHub AI

A production-grade, self-hosted Bible study platform with AI-powered study tools.

## Quick Start

### Prerequisites
- Docker Desktop for macOS
- Node.js 20+

### Setup

```bash
# Start PostgreSQL and dev server
docker compose -f docker/docker-compose.dev.yml up

# Seed the database (in another terminal)
npm run db:seed
```

Then open http://localhost:3000

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | ChangeMe123! |
| User | user@example.com | ChangeMe123! |

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run db:seed` | Seed database |
| `npm run db:reset` | Reset and reseed |
| `npm run test` | Run tests |
| `npm run build` | Production build |

### URLs

| URL | Description |
|-----|-------------|
| `/` | Home — redirects to Bible |
| `/bible/1/1` | Bible reader |
| `/admin` | Admin dashboard |
| `/dev-tools` | Dev tools (dev only) |

### Production Deployment

```bash
docker compose -f docker/docker-compose.yml up -d
```
```

**Commit:** `git add -A && git commit -m "docs: add README with setup instructions"`
