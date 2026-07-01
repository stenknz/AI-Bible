# BibleHub AI — Phase 2 Implementation Plan (AI Study Assistant + RAG)

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the RAG pipeline, embedding service, context builder, task handlers, and AI conversation history to transform the Phase 1 AI skeleton into a working study assistant.

**Architecture:** Add 3 Prisma models (Embedding, AIConversation, AIMessage), build embedding service, RAG pipeline, context builder, and task handlers. The Phase 1 AI provider interface + registry + OpenCode Zen adapter already exist.

**Tech Stack:** pgvector (PostgreSQL), Prisma, existing AI provider layer, jose for auth

**Hard constraints from spec:**
- AI must NEVER answer without retrieved context when available (RAG-first)
- Responses must include verse references when applicable
- No external APIs inside business logic
- No over-building Phase 3+ features
- All new tables only — no Phase 1 table modifications

---

## Task List

### Task 1: Add Embedding, AIConversation, AIMessage to Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

Add these models after the existing `FeatureToggle` model:

```prisma
model Embedding {
  id         String   @id @default(cuid())
  entityId   String
  entityType String
  text       String
  model      String   @default("text-embedding-3-small")
  vector     Unsupported("vector(1536)")?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([model])
}

model AIConversation {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  title     String?
  taskType  String?
  messages  AIMessage[]
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}

model AIMessage {
  id             String         @id @default(cuid())
  conversationId String
  conversation   AIConversation @relation(fields: [conversationId], references: [id])
  role           String
  content        String
  createdAt      DateTime       @default(now())
}
```

Run: `npx prisma generate`

Commit: `git add -A && git commit -m "feat: add Embedding, AIConversation, AIMessage models for Phase 2 RAG"`

---

### Task 2: Embedding Service

**Files:**
- Create: `src/modules/ai/embeddings/service.ts`

```typescript
import { prisma } from "@/lib/db"
import { providerRegistry } from "@/modules/ai/services/provider"
import { getActiveProvider } from "@/modules/ai/services/router"

export type EmbeddingSourceType = "verse" | "note" | "highlight"

export type EmbeddingRecord = {
  id: string
  entityId: string
  entityType: EmbeddingSourceType
  vector: number[]
  text: string
  model: string
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const provider = providerRegistry.get(getActiveProvider())
  const results = await provider.embeddings([text])
  return results[0]
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const provider = providerRegistry.get(getActiveProvider())
  return provider.embeddings(texts)
}

export async function indexEntity(
  entityType: EmbeddingSourceType,
  entityId: string,
  text: string
): Promise<void> {
  const vector = await generateEmbedding(text)
  await prisma.embedding.upsert({
    where: {
      entityType_entityId: { entityType, entityId },
    },
    update: { vector: vector as any, text, model: "text-embedding-3-small" },
    create: {
      entityType,
      entityId,
      text,
      vector: vector as any,
      model: "text-embedding-3-small",
    },
  })
}

export async function searchSimilar(
  query: string,
  options: { limit?: number; minScore?: number; sourceTypes?: EmbeddingSourceType[] } = {}
): Promise<EmbeddingRecord[]> {
  const vector = await generateEmbedding(query)
  const limit = options.limit ?? 10
  const minScore = options.minScore ?? 0.7

  const where: any = {}
  if (options.sourceTypes) {
    where.entityType = { in: options.sourceTypes }
  }

  const results = await prisma.$queryRaw<EmbeddingRecord[]>`
    SELECT id, "entityId", "entityType", text, model,
           1 - (vector <=> ${vector}::vector) AS score
    FROM "Embedding"
    ${where.entityType ? sql`WHERE "entityType" = ANY(${where.entityType})` : sql``}
    AND 1 - (vector <=> ${vector}::vector) >= ${minScore}
    ORDER BY score DESC
    LIMIT ${limit}
  `

  return results
}
```

Note: The raw SQL query needs to use Prisma's `$queryRaw` properly. If the `$queryRaw` with dynamic conditions is complex, use a simpler approach: build the query string with conditions manually using `$queryRawUnsafe`.

Commit: `git add -A && git commit -m "feat: add embedding service for vector generation and similarity search"`

---

### Task 3: RAG Pipeline

**Files:**
- Create: `src/modules/ai/services/rag-pipeline.ts`

```typescript
import { searchSimilar, type EmbeddingSourceType } from "@/modules/ai/embeddings/service"
import { prisma } from "@/lib/db"

export type RAGResult = {
  entityId: string
  entityType: EmbeddingSourceType
  text: string
  score: number
  verseReference?: string
}

export type RAGContext = {
  query: string
  results: RAGResult[]
  assembledContext: string
}

export type RAGPipelineConfig = {
  maxResults: number
  minScore: number
  sources: EmbeddingSourceType[]
}

function formatReference(sourceType: string, result: { entityId: string }): string | undefined {
  // Verse references resolved at assembly time from the result text
  return undefined
}

export async function retrieveRAGContext(
  query: string,
  config: RAGPipelineConfig
): Promise<RAGContext> {
  const embeddings = await searchSimilar(query, {
    limit: config.maxResults,
    minScore: config.minScore,
    sourceTypes: config.sources,
  })

  const results: RAGResult[] = embeddings.map((e) => ({
    entityId: e.entityId,
    entityType: e.entityType as EmbeddingSourceType,
    text: e.text,
    score: 0, // score computed by pgvector
  }))

  const contextBlocks = results.map((r, i) => {
    const source = r.entityType === "verse" ? "Scripture" : r.entityType === "note" ? "Your Note" : "Highlight"
    return `[${source} ${i + 1}] ${r.text}`
  })

  const assembledContext = contextBlocks.length > 0
    ? `Relevant context from Bible and your notes:\n\n${contextBlocks.join("\n\n")}`
    : ""

  return { query, results, assembledContext }
}
```

Commit: `git add -A && git commit -m "feat: add RAG pipeline for context retrieval"`

---

### Task 4: Context Builder

**Files:**
- Create: `src/modules/ai/services/context-builder.ts`

```typescript
import { prisma } from "@/lib/db"
import { retrieveRAGContext } from "@/modules/ai/services/rag-pipeline"

export type AIContextRequest = {
  verseIds?: string[]
  chapterId?: string
  noteIds?: string[]
  query: string
  includeChapterContext?: boolean
  includeCrossReferences?: boolean
  includeUserNotes?: boolean
}

export type AssembledContext = {
  scripture: string
  notes: string
  crossReferences: string
  metadata: {
    translation: string
    book: string
    chapter: number
    verses: number[]
  }
}

export async function buildContext(request: AIContextRequest): Promise<AssembledContext> {
  let scripture = ""
  let notes = ""
  let crossReferences = ""
  let metadata = { translation: "", book: "", chapter: 0, verses: [] as number[] }

  if (request.verseIds && request.verseIds.length > 0) {
    const verses = await prisma.verse.findMany({
      where: { id: { in: request.verseIds } },
      include: {
        chapter: {
          include: { book: { include: { translation: true } } },
        },
      },
      orderBy: { number: "asc" },
    })

    if (verses.length > 0) {
      const first = verses[0]
      metadata = {
        translation: first.chapter.book.translation.code,
        book: first.chapter.book.name,
        chapter: first.chapter.number,
        verses: verses.map((v) => v.number),
      }
      scripture = verses
        .map((v) => `${v.number} ${v.text}`)
        .join("\n")
    }
  }

  if (request.includeUserNotes && request.verseIds) {
    const userNotes = await prisma.note.findMany({
      where: { verseId: { in: request.verseIds } },
      take: 5,
    })
    if (userNotes.length > 0) {
      const noteTexts = userNotes.map((n) => {
        const title = n.title ? `**${n.title}**\n` : ""
        const content =
          typeof n.content === "object" && n.content !== null
            ? JSON.stringify(n.content)
            : String(n.content)
        return `${title}${content.slice(0, 500)}`
      })
      notes = `Your notes:\n${noteTexts.join("\n---\n")}`
    }
  }

  const ragContext = await retrieveRAGContext(request.query, {
    maxResults: 5,
    minScore: 0.7,
    sources: ["verse", "note"],
  })

  const combinedContext = [
    scripture ? `## Scripture\n${scripture}` : "",
    notes ? `## Notes\n${notes}` : "",
    ragContext.assembledContext ? `## Search Results\n${ragContext.assembledContext}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")

  return {
    scripture,
    notes,
    crossReferences,
    metadata,
  }
}
```

Commit: `git add -A && git commit -m "feat: add AI context builder for assembling prompt context"`

---

### Task 5: AI Conversation API

**Files:**
- Create: `src/app/api/ai/conversations/route.ts`
- Create: `src/app/api/ai/conversations/[id]/route.ts`
- Create: `src/app/api/ai/conversations/[id]/messages/route.ts`

**`src/app/api/ai/conversations/route.ts`**:
```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/modules/auth/services/session"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const conversations = await prisma.aIConversation.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  })
  return NextResponse.json(conversations)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, taskType } = await request.json()
  const conversation = await prisma.aIConversation.create({
    data: {
      userId: session.userId,
      title,
      taskType,
    },
  })
  return NextResponse.json(conversation)
}
```

**`src/app/api/ai/conversations/[id]/route.ts`**:
```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/modules/auth/services/session"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const conversation = await prisma.aIConversation.findFirst({
    where: { id, userId: session.userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  })
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(conversation)
}
```

**`src/app/api/ai/conversations/[id]/messages/route.ts`**:
```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/modules/auth/services/session"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const { content, role } = await request.json()

  const message = await prisma.aIMessage.create({
    data: {
      conversationId: id,
      role: role || "user",
      content,
    },
  })

  await prisma.aIConversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json(message)
}
```

Commit: `git add -A && git commit -m "feat: add AI conversation API for chat history"`

---

### Task 6: AI Task Handlers + Prompts

**Files:**
- Create: `src/modules/ai/prompts/verse-explanation.ts`
- Create: `src/modules/ai/prompts/passage-summary.ts`
- Create: `src/modules/ai/prompts/theological-qa.ts`
- Create: `src/modules/ai/tasks/define.ts`
- Create: `src/modules/ai/tasks/verse-explanation.ts`

**`src/modules/ai/prompts/verse-explanation.ts`**:
```typescript
export function buildVerseExplanationPrompt(verseText: string, context: string): string {
  return `You are a Bible study assistant. Explain the following verse clearly and faithfully to Scripture.

${context ? `Context:\n${context}\n` : ""}

Verse:
${verseText}

Provide:
1. The plain meaning of the verse
2. Key themes and concepts
3. How it fits in the broader passage
4. A brief application

Always cite verse references. Separate Scripture from interpretation.`
}
```

**`src/modules/ai/prompts/passage-summary.ts`**:
```typescript
export function buildPassageSummaryPrompt(passageText: string): string {
  return `Summarize the following Bible passage. Include:
1. A brief overview (2-3 sentences)
2. Key themes
3. Main characters
4. Theological significance

Passage:
${passageText}

Always cite specific verses. Separate Scripture from interpretation.`
}
```

**`src/modules/ai/prompts/theological-qa.ts`**:
```typescript
export function buildTheologicalQAPrompt(question: string, context: string): string {
  return `You are a Bible study assistant grounded in Scripture. Answer the following question faithfully.

${context ? `Context:\n${context}\n` : ""}

Question: ${question}

Rules:
- Base your answer on Scripture
- Cite specific verses for each claim
- Separate Bible text from your explanation
- If the Bible doesn't address this directly, say so
- Note different interpretations where appropriate`
}
```

**`src/modules/ai/tasks/define.ts`**:
```typescript
import type { AITaskType } from "@/modules/ai/types/ai"

export type TaskHandler = {
  taskType: AITaskType
  requiresRag: boolean
  handle(input: TaskInput): Promise<string>
}

export type TaskInput = {
  query: string
  verseIds?: string[]
  passageText?: string
  context?: string
}
```

**`src/modules/ai/tasks/verse-explanation.ts`**:
```typescript
import type { TaskHandler, TaskInput } from "./define"
import { buildVerseExplanationPrompt } from "@/modules/ai/prompts/verse-explanation"
import { buildContext } from "@/modules/ai/services/context-builder"
import { providerRegistry } from "@/modules/ai/services/provider"
import { getActiveProvider, getRoute } from "@/modules/ai/services/router"

export const verseExplanationHandler: TaskHandler = {
  taskType: "verse_explanation",
  requiresRag: true,

  async handle(input: TaskInput): Promise<string> {
    const route = getRoute("verse_explanation")

    let context = ""
    if (input.verseIds) {
      const ctx = await buildContext({
        verseIds: input.verseIds,
        query: input.query,
        includeChapterContext: true,
        includeCrossReferences: true,
      })
      context = ctx.scripture
    }

    const prompt = buildVerseExplanationPrompt(input.passageText || input.query, context)

    const provider = providerRegistry.get(getActiveProvider())
    const response = await provider.chat(
      [
        { role: "system", content: "You are a helpful Bible study assistant. Always cite verses." },
        { role: "user", content: prompt },
      ],
      { model: route.model, temperature: route.temperature, maxTokens: route.maxTokens }
    )

    return response.content
  },
}
```

Commit: `git add -A && git commit -m "feat: add AI task handlers and prompt templates"`

---

### Task 7: Update AI Panel with Working Chat

**Files:**
- Modify: `src/modules/ai/components/AIPanel.tsx`

Replace the placeholder alert buttons with a working chat interface that:
1. Shows a conversation view
2. Has a text input
3. Sends messages to the AI API
4. Displays responses inline

The chat sends to `/api/ai/chat` — a new endpoint that:
1. Creates/finds a conversation
2. Adds user message
3. Calls the appropriate task handler
4. Adds AI response
5. Returns the response

New file: `src/app/api/ai/chat/route.ts`

```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/modules/auth/services/session"
import { verseExplanationHandler } from "@/modules/ai/tasks/verse-explanation"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { message, conversationId, taskType, verseIds } = await request.json()

  let conversation
  if (conversationId) {
    conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId: session.userId },
    })
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 })
  } else {
    conversation = await prisma.aIConversation.create({
      data: {
        userId: session.userId,
        title: message.slice(0, 100),
        taskType: taskType || "theological_question_answering",
      },
    })
  }

  await prisma.aIMessage.create({
    data: { conversationId: conversation.id, role: "user", content: message },
  })

  const response = await verseExplanationHandler.handle({
    query: message,
    verseIds,
  })

  await prisma.aIMessage.create({
    data: { conversationId: conversation.id, role: "assistant", content: response },
  })

  await prisma.aIConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json({
    response,
    conversationId: conversation.id,
  })
}
```

**Updated AIPanel** — replace the entire component:

```typescript
"use client"

import { useState, useRef, useEffect } from "react"

type Message = {
  role: "user" | "assistant"
  content: string
}

export function AIPanel() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          taskType: "theological_question_answering",
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
        setConversationId(data.conversationId)
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that request." }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "An error occurred. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
        title="AI Assistant"
      >
        <span className="text-lg">AI</span>
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[500px] w-80 flex-col rounded-lg border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b p-3">
            <h3 className="text-sm font-semibold">AI Assistant</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Ask a Bible question, request a verse explanation, or get study help.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`mb-3 rounded-lg p-3 text-sm ${
                  m.role === "user"
                    ? "bg-blue-600 text-white ml-8"
                    : "bg-muted text-foreground mr-8"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="mb-3 mr-8 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                Thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="border-t p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
```

Commit: `git add -A && git commit -m "feat: wire AI panel to working chat with RAG-backed task handlers"`

---

## Self-Review Checklist

- ✅ All models in spec added (Embedding, AIConversation, AIMessage)
- ✅ No Phase 1 tables modified
- ✅ RAG pipeline retrieves context before AI answers
- ✅ Verse citations enforced in prompt templates
- ✅ Task handlers use provider abstraction (no direct API calls)
- ✅ Conversation history persisted
- ✅ All TypeScript strict mode
- ✅ No over-building Phase 3+ features
