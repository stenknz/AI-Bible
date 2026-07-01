# BibleHub AI — Phases 2–7 Architecture Blueprint

**Date:** 2026-07-01
**Status:** Draft
**Depends on:** 2026-07-01-biblehub-ai-design.md (Phase 1)

---

## Table of Contents

- [1. Global Entity Model](#1-global-entity-model)
- [2. Module Structure (Full Tree)](#2-module-structure-full-tree)
- [3. Phase 2 — AI Study Assistant + RAG](#3-phase-2--ai-study-assistant--rag)
- [4. Phase 3 — Maps + Timeline + Knowledge Graph](#4-phase-3--maps--timeline--knowledge-graph)
- [5. Phase 4 — Audio + Voice System](#5-phase-4--audio--voice-system)
- [6. Phase 5 — Personal Spiritual OS](#6-phase-5--personal-spiritual-os)
- [7. Phase 6 — Original Language Deep Study Tools](#7-phase-6--original-language-deep-study-tools)
- [8. Phase 7 — Full AI Knowledge System](#8-phase-7--full-ai-knowledge-system)
- [9. Extension Strategy](#9-extension-strategy)

---

## 1. Global Entity Model

Every domain entity supports cross-module linking, graph traversal, and unified search through shared conventions.

### Conventions

| Convention | Purpose |
|---|---|
| `id String @id @default(cuid())` | Primary key |
| `createdAt DateTime @default(now())` | Creation timestamp |
| `updatedAt DateTime @updatedAt` | Update timestamp |
| `embedding vector(1536)?` | AI searchable (future) |
| `tags String[]` | Flat tagging across all entities |
| `metadata Json?` | Extensible per-entity custom fields |

### Full Entity Catalog

```
Phase 1 (11): User, Translation, Book, Chapter, Verse, Note, Highlight,
              UserPreference, Prayer, ReadingPlan, FeatureToggle

Phase 2 (3):  Embedding, AIConversation, AIMessage

Phase 3 (9):  Person, Place, Region, Journey, JourneyPlace,
              TimelineEntry, Period, EntityRelation, EntityTag

Phase 4 (4):  AudioRecording, PlaybackState, AudioBookmark, TTSCache

Phase 5 (6):  PrayerCategory, ReadingPlanTemplate, ReadingPlanDay,
              ReadingPlanProgress, DailyVerse, DailyLog

Phase 6 (5):  StrongNumber, OriginalWord, Morphology, InterlinearMapping, LexicalEntry

Phase 7 (4):  KnowledgeSource, Citation, AIModelConfig, ReasoningTrace

Total: ~42 models
```

### Entity Relationship Graph

```
User ──has──→ Notes ──attach_to──→ Verse
User ──has──→ Highlights ──refer_to──→ Verse
User ──has──→ AIConversation ──contains──→ AIMessage
User ──has──→ PrayerRequest ──category──→ PrayerCategory
User ──has──→ ReadingPlanProgress ──plan──→ ReadingPlan
User ──has──→ PlaybackState ──track──→ AudioRecording

Verse ──has──→ OriginalWord (via InterlinearMapping)
Verse ──part_of──→ Chapter ──part_of──→ Book ──part_of──→ Translation

Person ──appears_in──→ Verse (via EntityRelation)
Person ──travels──→ Journey ──visits──→ Place

Place ──located_in──→ Region
Place ──hosts──→ Event (via EntityRelation)

TimelineEntry ──references──→ Verse
TimelineEntry ──belongs_to──→ Period
TimelineEntry ──involves──→ Person

EntityRelation ──links──→ (any Entity) ⇄ (any Entity)
EntityTag ──tags──→ (any Entity)

Embedding ──embeds──→ (any Entity) ──for──→ AI Context

KnowledgeSource ──cites──→ Verse | Note | Person | Place | OriginalWord
```

---

## 2. Module Structure (Full Tree)

```
src/modules/
├── bible/                     [Phase 1]
├── notes/                     [Phase 1]
├── search/                    [Phase 1]
├── auth/                      [Phase 1]
├── admin/                     [Phase 1]
├── pwa/                       [Phase 1]
│
├── ai/                        [Phase 1 skeleton, Phase 2+ full]
│   ├── components/  (AIPanel, AIChat, AIInsightCard, CitationFooter)
│   ├── services/    (provider, router, context-builder, rag-pipeline,
│   │                 citation-engine, reasoning-tracer)
│   ├── prompts/     (verse-explanation, passage-summary, theological-qa,
│   │                 cross-reference, devotional, study-plan, quiz)
│   ├── providers/   (opencode-zen, opencode-go, openai, anthropic, ollama)
│   ├── tasks/       (define, + per-task handlers)
│   ├── embeddings/  (service, indexer, search)
│   └── types/
│
├── maps/                      [Phase 3]
│   ├── components/  (MapView, MapMarker, JourneyOverlay, PlaceDetail, MapFilters)
│   ├── services/    (geo-service, journey-service, tile-service)
│   └── types/
│
├── timeline/                  [Phase 3]
│   ├── components/  (TimelineView, TimelineEntry, EraFilter, ChronologicalNav)
│   ├── services/    (timeline-service)
│   └── types/
│
├── knowledge-graph/           [Phase 3]
│   ├── components/  (GraphView, EntityNode, RelationEdge, EntityDetail, RelatedContent)
│   ├── services/    (graph-service, traversal, recommendation)
│   └── types/
│
├── audio/                     [Phase 4]
│   ├── components/  (AudioPlayer, PlaybackControls, SpeedControl, SleepTimer, etc.)
│   ├── services/    (audio-player, tts-provider, cache-service, download-manager)
│   ├── providers/   (system-tts, opencode-tts, external-tts)
│   └── types/
│
├── voice/                     [Phase 4]
│   ├── components/  (VoiceInput, VoiceCommandPalette)
│   ├── services/    (speech-recognizer, command-parser)
│   └── types/
│
├── prayer/                    [Phase 5 — extends Phase 1]
│   ├── components/  (PrayerList, PrayerEditor, PrayerCategories, etc.)
│   ├── services/    (prayer-service, reminder-service)
│   └── types/
│
├── reading-plans/             [Phase 5 — extends Phase 1]
│   ├── components/  (ReadingPlanList, PlanProgress, DailyReading, PlanTemplate)
│   ├── services/    (reading-plan-service)
│   └── types/
│
├── daily/                     [Phase 5]
│   ├── components/  (DailyDashboard, VerseOfTheDay, DailyProgress, etc.)
│   ├── services/    (daily-service)
│   └── types/
│
└── original-languages/        [Phase 6]
    ├── components/  (InterlinearView, WordDetail, StrongDefinition, etc.)
    ├── services/    (interlinear-service, strongs-service, morphology-service)
    └── types/
```

---

## 3. Phase 2 — AI Study Assistant + RAG

### 3.1 AI Provider Layer

```typescript
interface AIProviderConfig {
  apiKey: string
  baseUrl: string
  model: string
  maxTokens?: number
  temperature?: number
}

interface AIProvider {
  readonly name: string
  chat(messages: ChatMessage[], config?: AIProviderConfig): Promise<ChatResponse>
  stream(messages: ChatMessage[], config?: AIProviderConfig): AsyncIterable<ChatResponse>
  embeddings(texts: string[]): Promise<number[][]>
}

type ChatMessage = { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; name?: string }

type ChatResponse = {
  content: string
  finishReason: 'stop' | 'length' | 'error'
  usage?: { promptTokens: number; completionTokens: number }
}

// Registry pattern
class AIProviderRegistry {
  private providers: Map<string, AIProvider> = new Map()
  register(name: string, provider: AIProvider): void
  get(name: string): AIProvider
  list(): string[]
}
```

### 3.2 Task Router

```typescript
type AITaskType =
  | 'verse_explanation' | 'passage_summary' | 'theological_question_answering'
  | 'cross_reference_generation' | 'devotional_generation'
  | 'study_plan_generation' | 'quiz_generation'

interface TaskRoute {
  taskType: AITaskType
  primaryProvider: string
  fallbackProvider: string
  model: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  requiresRag: boolean
  requiresCitation: boolean
}
```

Routing strategy:
- Each task type maps to a route config
- Routes overridable via env vars or FeatureToggle
- Fallback chain: primary → fallback → error
- Embeddings use separate configured provider

### 3.3 RAG Pipeline

```typescript
interface RAGPipelineConfig {
  maxResults: number
  minScore: number
  sources: EmbeddingSourceType[]
}

interface RAGResult {
  entityId: string
  entityType: EmbeddingSourceType
  text: string
  score: number
  verseReference?: string
  metadata: Record<string, unknown>
}

interface RAGContext {
  query: string
  results: RAGResult[]
  assembledContext: string
}

class RAGPipeline {
  async retrieve(query: string, config: RAGPipelineConfig): Promise<RAGContext>
}
```

Pipeline: generate query embedding → vector similarity search (pgvector cosine) → score threshold + diversity rank → format context block.

### 3.4 Context Builder

```typescript
interface AIContextRequest {
  verseIds?: string[]
  chapterId?: string
  noteIds?: string[]
  query: string
  includeChapterContext?: boolean
  includeCrossReferences?: boolean
  includeUserNotes?: boolean
}

interface AssembledContext {
  scripture: string
  notes: string
  crossReferences: string
  metadata: { translation: string; book: string; chapter: number; verses: number[] }
}
```

Assembly: fetch verses + chapter context → gather notes → resolve cross-references → fetch topic metadata → format for prompt injection.

### 3.5 Embedding Architecture

```prisma
model Embedding {
  id         String   @id @default(cuid())
  entityId   String
  entityType String   // 'verse' | 'note' | 'highlight' | 'person' | 'place' | 'original_word'
  text       String
  model      String   @default("text-embedding-3-small")
  vector     Unsupported("vector(1536)")?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([model])
}
```

Generalized table avoids per-entity embedding columns. Background job for batch indexing. Model tracking enables reindex on model change.

### 3.6 AI Conversation History

```prisma
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
  role           String         // 'user' | 'assistant' | 'system'
  content        String
  citations      Citation[]      // Phase 7
  reasoningTraceId String?       // Phase 7
  createdAt      DateTime       @default(now())
}
```

---

## 4. Phase 3 — Maps + Timeline + Knowledge Graph

### 4.1 Maps Data Model

```prisma
model Place {
  id          String   @id @default(cuid())
  name        String
  latitude    Float?
  longitude   Float?
  placeType   String   // 'city' | 'region' | 'landmark' | 'wilderness'
  regionId    String?
  region      Region?  @relation(fields: [regionId], references: [id])
  description String?
  metadata    Json?    // ancient names, alternate spellings
}

model Region {
  id          String   @id @default(cuid())
  name        String
  regionType  String   // 'province' | 'territory' | 'geographic'
  description String?
  places      Place[]
}

model Journey {
  id          String         @id @default(cuid())
  name        String         // "Paul's First Missionary Journey"
  personId    String?
  person      Person?        @relation(fields: [personId], references: [id])
  description String?
  stops       JourneyPlace[]
}

model JourneyPlace {
  id         String  @id @default(cuid())
  journeyId  String
  journey    Journey @relation(fields: [journeyId], references: [id])
  placeId    String
  place      Place   @relation(fields: [placeId], references: [id])
  order      Int
  eventId    String?
}

model Person {
  id          String   @id @default(cuid())
  name        String
  alternateNames String[]
  description String?
  personType  String   // 'patriarch' | 'prophet' | 'king' | 'apostle' | 'disciple'
  metadata    Json?
  journeys    Journey[]
  relations   EntityRelation[]
}
```

### 4.2 Timeline Data Model

```prisma
model Period {
  id          String         @id @default(cuid())
  name        String         // "Patriarchs", "Exodus", "Kings"
  startYear   Int?
  endYear     Int?
  order       Int
  description String?
  events      TimelineEntry[]
}

model TimelineEntry {
  id          String    @id @default(cuid())
  title       String
  description String?
  startYear   Int?      // negative = BC
  endYear     Int?
  periodId    String?
  period      Period?   @relation(fields: [periodId], references: [id])
  verseIds    String[]
  entityType  String?   // 'event' | 'person_life' | 'reign' | 'journey'
  importance  Int       @default(5)
  metadata    Json?
  relations   EntityRelation[]
}
```

Eras: Patriarchs, Exodus, Conquest, Judges, United Kingdom, Divided Kingdom, Exile, Post-Exile, Intertestamental, Jesus, Early Church, Apostolic Age

### 4.3 Knowledge Graph Data Model

```prisma
model EntityRelation {
  id             String   @id @default(cuid())
  subjectId      String
  subjectType    String   // entity type discriminator
  predicate      String   // 'traveled_to' | 'wrote' | 'prophesied' | 'married' | 'born_in'
  objectId       String
  objectType     String
  confidence     Float    @default(1.0)
  sourceVerseId  String?
  metadata       Json?

  @@index([subjectId, subjectType])
  @@index([objectId, objectType])
  @@index([predicate])
  @@index([subjectType, predicate, objectType])  // graph traversal key
}

model EntityTag {
  id         String @id @default(cuid())
  entityId   String
  entityType String
  tag        String
  @@unique([entityId, entityType, tag])
  @@index([tag])
}
```

### 4.4 Graph Traversal Service

```typescript
interface GraphQuery {
  startId: string; startType: string; predicates?: string[]
  maxDepth: number; targetTypes?: string[]
}

interface GraphPath { nodes: GraphNode[]; edges: GraphEdge[] }
interface GraphNode { id: string; type: string; label: string }
interface GraphEdge { subjectId: string; predicate: string; objectId: string }

class GraphTraversal {
  async bfs(query: GraphQuery): Promise<GraphPath[]>
  async shortestPath(from: GraphNode, to: GraphNode): Promise<GraphPath | null>
  async relatedContent(entityId: string, limit?: number): Promise<GraphNode[]>
  async subgraph(rootId: string, depth?: number): Promise<GraphPath>
}
```

---

## 5. Phase 4 — Audio + Voice System

### 5.1 Audio Data Model

```prisma
model AudioRecording {
  id           String   @id @default(cuid())
  entityId     String
  entityType   String   // 'chapter' | 'verse'
  source       String   // 'uploaded' | 'tts' | 'external'
  url          String
  duration     Int
  fileSize     Int
  format       String
  narrator     String?
  language     String   @default("en")
  isDownloaded Boolean  @default(false)
  createdAt    DateTime @default(now())
}

model PlaybackState {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  recordingId String
  recording   AudioRecording @relation(fields: [recordingId], references: [id])
  position    Int      @default(0)
  speed       Float    @default(1.0)
  volume      Float    @default(1.0)
  isPlaying   Boolean  @default(false)
  updatedAt   DateTime @updatedAt
  @@unique([userId, recordingId])
}

model AudioBookmark {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  recordingId String
  recording   AudioRecording @relation(fields: [recordingId], references: [id])
  position    Int
  label       String?
  createdAt   DateTime @default(now())
}
```

### 5.2 TTS Provider Abstraction

```typescript
interface TTSProvider {
  synthesize(text: string, options?: TTSOptions): Promise<AudioBuffer>
  getVoices(): Promise<TTSVoice[]>
  supportsStreaming: boolean
}

interface TTSOptions { voice: string; speed: number; format: 'mp3' | 'ogg' | 'wav' }
interface TTSVoice { id: string; name: string; language: string; gender: string }
```

### 5.3 Speech Recognition Abstraction

```typescript
interface SpeechRecognizer {
  listen(options?: ListenOptions): AsyncIterable<RecognitionResult>
  transcribe(audio: AudioBuffer): Promise<string>
  isAvailable(): boolean
}

interface RecognitionResult { transcript: string; confidence: number; isFinal: boolean; command?: VoiceCommand }
interface VoiceCommand { action: string; parameters: Record<string, string> }
```

---

## 6. Phase 5 — Personal Spiritual OS

### 6.1 Prayer Data Model (extends Phase 1)

```prisma
model PrayerCategory {
  id          String         @id @default(cuid())
  name        String
  description String?
  userId      String
  user        User           @relation(fields: [userId], references: [id])
  prayers     PrayerRequest[]
  @@unique([userId, name])
}

model PrayerRequest {
  id           String          @id @default(cuid())
  userId       String
  user         User            @relation(fields: [userId], references: [id])
  title        String
  content      String
  categoryId   String?
  category     PrayerCategory? @relation(fields: [categoryId], references: [id])
  isAnswered   Boolean         @default(false)
  answeredAt   DateTime?
  answerNotes  String?
  reminderAt   DateTime?
  reminderFreq String?
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  @@index([userId, isAnswered])
}
```

### 6.2 Reading Plan Data Model (extends Phase 1)

```prisma
model ReadingPlanTemplate {
  id          String              @id @default(cuid())
  name        String
  description String?
  type        String              // 'chronological' | 'thematic' | 'one-year' | 'custom'
  days        Int
  isPublic    Boolean             @default(false)
  daysPlan    ReadingPlanDay[]
}

model ReadingPlanDay {
  id           String       @id @default(cuid())
  templateId   String
  template     ReadingPlanTemplate @relation(fields: [templateId], references: [id])
  dayNumber    Int
  title        String?
  verseIds     String[]
}

model ReadingPlan {
  id            String              @id @default(cuid())
  userId        String
  user          User                @relation(fields: [userId], references: [id])
  templateId    String?
  template      ReadingPlanTemplate? @relation(fields: [templateId], references: [id])
  name          String
  type          String
  startDate     DateTime
  progress      ReadingPlanProgress[]
}

model ReadingPlanProgress {
  id          String   @id @default(cuid())
  planId      String
  plan        ReadingPlan @relation(fields: [planId], references: [id])
  dayNumber   Int
  completed   Boolean  @default(false)
  completedAt DateTime?
  notes       String?
}
```

### 6.3 Daily Dashboard

```typescript
interface DailyContext {
  verseOfTheDay: { verse: Verse; translation: Translation; devotional?: string }
  readingProgress: { activePlan: ReadingPlan | null; todayCompleted: boolean; streak: number; totalProgress: number }
  prayerReminders: PrayerRequest[]
  recentNotes: Note[]
  aiInsights?: AIInsight[]
}

class DailyService {
  async getDailyContext(userId: string, date: Date): Promise<DailyContext>
}
```

---

## 7. Phase 6 — Original Language Deep Study Tools

### 7.1 Data Model

```prisma
model StrongNumber {
  id             String  @id @default(cuid())
  number         String  @unique  // "H1234" or "G1234"
  language       String  // 'hebrew' | 'greek'
  lemma          String
  transliteration String
  definition     String
  notes          String?
}

model OriginalWord {
  id              String  @id @default(cuid())
  strongNumberId  String
  strongNumber    StrongNumber @relation(fields: [strongNumberId], references: [id])
  text            String
  lemma           String
  language        String
  morphologyId    String?
  morphology      Morphology?  @relation(fields: [morphologyId], references: [id])
}

model Morphology {
  id           String  @id @default(cuid())
  partOfSpeech String
  tense        String?
  mood         String?
  voice        String?
  person       String?
  number       String?
  gender       String?
  case         String?
  state        String?
  rawTag       String?
}

model InterlinearMapping {
  id              String  @id @default(cuid())
  verseId         String
  verse           Verse   @relation(fields: [verseId], references: [id])
  originalWordId  String
  originalWord    OriginalWord @relation(fields: [originalWordId], references: [id])
  position        Int
  translationText String?
}

model LexicalEntry {
  id          String  @id @default(cuid())
  lemma       String  @unique
  language    String
  definition  String
  frequency   Int?
  root        String?
  derivatives String[]
  notes       String?
  synonyms    String[]
  antonyms    String[]
}
```

### 7.2 Interlinear Service

```typescript
interface InterlinearVerse { verse: Verse; words: InterlinearWord[] }
interface InterlinearWord { position: number; originalText: string; transliteration: string; strongNumber: string; lemma: string; morphology: Morphology | null; translation: string }

class InterlinearService {
  async getInterlinear(verseId: string, translationId: string): Promise<InterlinearVerse>
  async compareLemmas(lemma: string): Promise<{ verse: Verse; position: number }[]>
  async frequencyAnalysis(lemma: string, bookId?: string): Promise<number>
}
```

---

## 8. Phase 7 — Full AI Knowledge System

### 8.1 Unified Query Engine

```typescript
interface UnifiedQuery {
  naturalLanguage: string
  domains: ('scripture' | 'notes' | 'geography' | 'timeline' | 'languages' | 'history')[]
  userContext?: { recentNotes?: string[]; studyHistory?: string[]; preferences?: Record<string, unknown> }
  requireCitations: boolean
}

interface UnifiedResponse {
  answer: string
  confidence: number
  citations: Citation[]
  reasoningTrace?: ReasoningStep[]
  domainsUsed: string[]
}

class UnifiedQueryEngine {
  async query(request: UnifiedQuery): Promise<UnifiedResponse>
  // 1. Decompose query into sub-tasks per domain
  // 2. Retrieve context (RAG vector, graph paths, notes)
  // 3. Assemble multi-domain context
  // 4. Route to LLM with system prompt
  // 5. Enforce citations on output
  // 6. Attach reasoning trace
}
```

### 8.2 Citation Engine

```typescript
interface Citation {
  id: string; entityType: string; entityId: string
  reference: string   // "Genesis 1:1 (NASB)"
  text: string; isScripture: boolean; confidence: number
}

class CitationEngine {
  enforce(aiOutput: string, context: AssembledContext): {
    citedText: string; citations: Citation[]; uncitedClaims: string[]
  }
}
```

Rules: every output must cite verses used, separate scripture from interpretation, flag unsupported claims.

### 8.3 Reasoning Trace

```typescript
interface ReasoningStep { step: number; action: string; input: string; output: string; sourcesUsed: string[]; timestamp: Date }

class ReasoningTracer {
  beginTrace(): string
  addStep(traceId: string, step: ReasoningStep): void
  getTrace(traceId: string): ReasoningStep[]
  persistTrace(traceId: string, conversationId: string): Promise<void>
}
```

### 8.4 Knowledge Source Provenance

```prisma
model KnowledgeSource {
  id             String   @id @default(cuid())
  name           String
  sourceType     String   // 'translation' | 'lexicon' | 'commentary' | 'user_note'
  version        String?
  citationFormat String
}

model Citation {
  id             String   @id @default(cuid())
  aimessageId    String
  message        AIMessage @relation(fields: [aimessageId], references: [id])
  sourceId       String
  source         KnowledgeSource @relation(fields: [sourceId], references: [id])
  entityId       String
  entityType     String
  referenceText  String
  quote          String?
  isDirectQuote  Boolean  @default(false)
  createdAt      DateTime @default(now())
}

model AIModelConfig {
  id          String   @id @default(cuid())
  taskType    String   @unique
  provider    String
  model       String
  temperature Float
  maxTokens   Int
  isActive    Boolean  @default(true)
}

model ReasoningTrace {
  id             String   @id @default(cuid())
  aimessageId    String
  message        AIMessage @relation(fields: [aimessageId], references: [id])
  steps          Json
  duration       Int
  modelUsed      String
  tokenUsage     Json?
  createdAt      DateTime @default(now())
}
```

---

## 9. Extension Strategy

### 9.1 Phase 1 Extension Points

```
Already Provided:
  ✅ User + Auth, Bible Engine, Notes, Search
  ✅ AIProvider interface (chat, stream, embeddings)
  ✅ pgvector columns on Verse, Note (design-only)
  ✅ FeatureToggle for runtime gating
  ✅ Empty placeholder modules (maps, audio, timeline, prayer, reading-plans)

Designed Extension Points:
  → Verse.embedding / Note.embedding (null → populated Phase 2)
  → modules/ai/ (skeleton Phase 1 → full Phase 2)
  → modules/maps/ / timeline/ (empty → Phase 3)
  → modules/audio/ (empty → Phase 4)
  → modules/prayer/ / reading-plans/ (basic schema → full Phase 5)
```

### 9.2 Transition Safety

| Phase | New Tables | Breaking Changes |
|---|---|---|
| 2 — AI + RAG | Embedding, AIConversation, AIMessage | None |
| 3 — Maps/Timeline/Graph | Person, Place, Region, Journey, JourneyPlace, TimelineEntry, Period, EntityRelation, EntityTag | None |
| 4 — Audio/Voice | AudioRecording, PlaybackState, AudioBookmark, TTSCache | None |
| 5 — Spiritual OS | PrayerCategory, ReadingPlanTemplate, ReadingPlanDay, ReadingPlanProgress, DailyVerse, DailyLog | None* |
| 6 — Languages | StrongNumber, OriginalWord, Morphology, InterlinearMapping, LexicalEntry | None |
| 7 — Full AI | KnowledgeSource, Citation, AIModelConfig, ReasoningTrace | None |

\* Phase 5 adds nullable FK fields to existing Prayer and ReadingPlan models — no data migration.

### 9.3 FeatureToggle Conventions

```
ai.rag.enabled
ai.task.verse_explanation
ai.task.passage_summary
maps.enabled
timeline.enabled
knowledge-graph.enabled
audio.enabled
voice.enabled
prayer.extended
reading-plans.templates
daily.dashboard
original-languages.interlinear
ai.citation-engine
ai.reasoning-trace
```
