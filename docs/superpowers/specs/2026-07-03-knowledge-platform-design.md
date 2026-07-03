# BibleHub AI Knowledge Platform — Design Spec

## Overview

Transform the existing Bible study application into a complete AI-powered platform with a single normalized knowledge database. Verses, people, places, events, dictionaries, and commentaries become entities inside one connected knowledge graph that powers the AI.

All work is additive and backward-compatible. No existing features, APIs, data, or business logic are modified.

---

## 1. Architecture

### Current State (41 models across 8 phases)
- Core Bible: Translation, Book, Chapter, Verse, CrossReference
- User Content: User, Bookmark, Note, Highlight, UserPreference, Session
- Maps/Timeline: Person, Place, Region, Journey, JourneyPlace, Period, TimelineEntry
- Knowledge Graph: EntityRelation, EntityTag
- Audio: AudioRecording, PlaybackState, AudioBookmark
- Spiritual OS: PrayerCategory, PrayerRequest, ReadingPlanTemplate, ReadingPlanDay, ReadingPlan, ReadingPlanProgress, DailyLog, DailyVerse, FeatureToggle
- Original Languages: StrongNumber, OriginalWord, Morphology, InterlinearMapping, LexicalEntry
- AI Knowledge: AIConversation, AIMessage, KnowledgeSource, Citation, AIModelConfig, ReasoningTrace, Embedding

### New Modules (12 new tables, 10+ importers)
The system grows from 41 to 53 models. Every new model is a standalone table. No existing table is altered.

### Folder Structure
```
prisma/schema.prisma          ← Add new models here
scripts/import/               ← New import framework
  import-runner.ts            ← Orchestrator
  validate-source.ts          ← Schema validation
  base-importer.ts            ← Base class with resume/checkpoint
  sources/                    ← One file per data source
  formats/                    ← Format parsers (JSON, CSV, XML, SQLite, TXT, YAML)
  logs/                       ← Import tracking

src/modules/
  knowledge/                  ← NEW: Unified knowledge module
    types/                    ← Shared entity types
    services/                 ← Search, entity resolution, relationships
    components/               ← Shared UI components
  dictionary/                 ← NEW: Dictionary module
  commentary/                 ← NEW: Commentary module
  topics/                     ← NEW: Topical module
  events/                     ← NEW: Bible events module
  search/                     ← ENHANCE: Unified search

src/app/api/knowledge/         ← NEW: Knowledge API routes
  search/route.ts
  entity/[type]/[slug]/route.ts
  related/[type]/[id]/route.ts
```

---

## 2. New Database Models

### 2a. DictionaryEntry
```prisma
model DictionaryEntry {
  id            String   @id @default(cuid())
  source        String   // "easton" | "smith" | "baker"
  title         String
  slug          String   @unique
  content       String   // Full article text
  summary       String?
  aliases       String[] // Alternative names
  category      String?  // "people" | "places" | "terms" | "customs"
  scriptureRefs String[]
  keywords      String[]
  metadata      Json?    // { sourceUrl, copyright, edition }
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([source])
  @@index([slug])
  @@index([category])
}
```

### 2b. CommentaryEntry
```prisma
model CommentaryEntry {
  id            String   @id @default(cuid())
  source        String   // "matthew-henry" | "john-gill" | "jfb" | "geneva"
  title         String
  slug          String   @unique
  verseId       String?  // Specific verse
  verseStartId  String?  // Verse range start
  verseEndId    String?  // Verse range end
  content       String   // Full commentary text
  summary       String?
  language      String   @default("en")
  scriptureRefs String[]
  keywords      String[]
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([source])
  @@index([verseId])
  @@index([slug])
}
```

### 2c. TopicEntry
```prisma
model TopicEntry {
  id            String   @id @default(cuid())
  source        String   @default("nave")
  topic         String   // e.g. "Faith", "Grace"
  slug          String   @unique
  description   String?
  scriptureRefs String[]
  subTopics     String[]
  relatedTopics String[]
  keywords      String[]
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([topic])
  @@index([slug])
}
```

### 2d. BibleEvent
```prisma
model BibleEvent {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  description   String?
  category      String   // "miracle" | "parable" | "sermon" | "feast" | "covenant" | "law" | "promise" | "prayer"
  subCategory   String?
  scriptureRefs String[]
  persons       String[] // slug references
  places        String[]
  eventDate     String?  // Biblical timeframe description
  keywords      String[]
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([slug])
  @@index([category])
}
```

### 2e. Nation
```prisma
model Nation {
  id             String   @id @default(cuid())
  name           String
  slug           String   @unique
  alternateNames String[]
  description    String?
  regionId       String?
  scriptureRefs  String[]
  kings          String[]
  capital        String?
  timePeriod     String?
  metadata       Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([slug])
}
```

### 2f. Media
```prisma
model Media {
  id         String   @id @default(cuid())
  entityType String   // "verse" | "person" | "place" | "event" | "timeline"
  entityId   String
  url        String
  type       String   // "image" | "video" | "audio" | "illustration"
  caption    String?
  credit     String?
  license    String?
  width      Int?
  height     Int?
  metadata   Json?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
}
```

### 2g. Person Enhancements (additive fields)
```prisma
// Add to existing Person model:
//   fatherOf    String[]
//   motherOf    String[]
//   spouse      String[]
//   tribe       String?
//   occupation  String[]
//   reign       String?
//   biblicalRef String[]
```

---

## 3. Import Framework

### Base Importer Contract
```typescript
interface ImportOptions {
  source: string
  version: string
  incremental?: boolean   // Only process new records
  batchSize?: number      // Default 100
  onProgress?: (stats: ImportStats) => void
}

interface ImportStats {
  total: number
  inserted: number
  updated: number
  skipped: number
  errors: number
  duration: number
}
```

### Importer Lifecycle
1. **Validate source** — Check format, required fields, encoding
2. **Normalize fields** — Convert to canonical schema (slug generation, scripture ref normalization)
3. **Detect duplicates** — By slug, by content hash, by external ID
4. **Merge data** — Update existing, insert new, preserve references
5. **Log results** — Per-source, per-version tracking for resume capability
6. **Emit events** — Trigger embedding generation after batch

### Supported Formats
- JSON — Direct parse with field mapping config
- CSV/TSV — Header detection + column mapping
- XML — XPath or element-based extraction (dictionaries)
- SQLite — Direct query (existing Gnosis pattern)
- TXT — Line-based or section-based parsing (commentaries)
- YAML — Structured data import

### Import Order
1. KJV Bible (existing) + additional translations (WEB, ASV)
2. Strong's Hebrew + Greek (existing, expand)
3. Bible dictionaries (Easton's, Smith's) — parallel
4. Topic entries (Nave's) — parallel with 3
5. Commentaries (Matthew Henry, Gill, JFB, Geneva) — parallel group
6. Bible events, nations, kings — small datasets
7. Embedding generation for all new entities — background

---

## 4. Unified Search

### Search Index Strategy
Two-layer approach:

**Layer 1: Full-Text Search (tsvector)**
PostgreSQL GIN indexes on text fields of all searchable entities:
- Verse.text
- DictionaryEntry.content, .title
- CommentaryEntry.content, .title
- TopicEntry.topic, .description
- BibleEvent.name, .description
- Person.name, Person.description
- Place.name, .description

**Layer 2: Semantic Search (pgvector)**
Existing `Embedding` table with `entityType` for all entity types. Cosine similarity via `<=>` operator.

### Search API
```
GET /api/knowledge/search?q=Moses&includeTypes=verse,dictionary,commentary,topic

Response:
{
  query: "Moses",
  results: {
    verses: [...],
    dictionaries: [...],
    commentaries: [...],
    topics: [...],
    people: [...],
    places: [...],
    events: [...]
  },
  aiSummary: "Moses is the central figure of the Exodus...",
  totalResults: 1423
}
```

### UI Layout (Additive)
The existing search page gains new sections below the current verse results:
- Dictionary matches
- Commentary matches
- Topic matches
- Related people, places, events as chips/links
- AI summary at top (collapsible)

---

## 5. Knowledge Graph Enhancement

### Entity Linking
Every new entity (dictionary entry, commentary, topic, event, nation) gets linked via:
- `EntityRelation` with `entityType` matching the source
- `EntityTag` for taxonomy/category tagging
- `Embedding` for semantic similarity
- `scriptureRefs` for verse cross-linking

### Graph Growth
| Current | Target |
|---------|--------|
| 57 nodes (16+15+26) | 65,000+ nodes (adding dictionary, commentary, topic entries) |
| 30 relations | 50,000+ relations (entity→entity, entity→verse links) |
| 2D force layout | Same layout, more data |

---

## 6. AI Knowledge Engine

### RAG Enhancement
Current RAG sources: verse, note, highlight
Enhanced RAG: + dictionary, commentary, topic, person, place, event, nation

The existing `rag-pipeline.ts` `retrieveRAGContext()` function accepts a `sourceTypes` filter. New entity types are added to this filter array.

### Citation Extension
The existing `Citation` model links `AIMessage` → `KnowledgeSource`. New `entityType` values ("dictionary", "commentary", "topic") allow the AI to cite dictionary definitions and commentary passages in responses.

### System Prompt Generation
Entity-aware prompts include:
```
Available resources for your answer:
- Scripture: [matching verses]
- Dictionary: [matching Easton's/Smith's entries]
- Commentary: [matching commentary passages]
- Topics: [matching Nave's entries]
```

---

## 7. Admin Panel

### Existing Admin (preserved)
- `/admin/bible-import`
- `/admin/translations`
- `/admin/features`
- `/admin/ai-config`

### New Admin Sections (extend existing admin layout)
- `/admin/knowledge/import` — Run/monitor imports
- `/admin/knowledge/logs` — Import history and errors
- `/admin/knowledge/entities` — View/manage dictionary, commentary, topic entries
- `/admin/knowledge/embeddings` — Rebuild embeddings per entity type

---

## 8. Performance Targets

| Query | Target | Method |
|-------|--------|--------|
| Unified text search | <50ms | tsvector GIN indexes |
| Unified semantic search | <100ms | pgvector with HNSW index |
| Entity detail page | <10ms | Single Prisma include |
| Related entities | <20ms | EntityRelation index |
| Commentaries for verse | <5ms | Verse FK index |
| AI RAG retrieval | <100ms | pgvector cosine similarity |
| Graph render | <200ms | Paginated/lazy entity loading |

### Data Volume Estimates
| Dataset | Rows | Size |
|---------|------|------|
| Dictionaries | ~8,500 | ~50 MB |
| Commentaries | ~69,000 | ~500 MB |
| Topics | ~20,000 | ~10 MB |
| Entities + Relations | ~100,000 | ~30 MB |
| Embeddings | ~200,000 | ~1.2 GB (1536-dim) |
| **Total** | **~400,000** | **~2 GB** |

---

## 9. Migration Guarantee

### Additive-Only Changes
- New models are new Prisma tables
- New fields on existing models use `?` (optional) with defaults
- No ALTER COLUMN, DROP COLUMN, or DROP TABLE
- No existing API route changes
- No existing page removal
- No existing data modification

### Rollback
```bash
# Remove new module imports from pages
# Remove admin knowledge section
DELETE FROM "DictionaryEntry";
DELETE FROM "CommentaryEntry";
DELETE FROM "TopicEntry";
DELETE FROM "BibleEvent";
DELETE FROM "Nation";
DELETE FROM "Media";
DELETE FROM "Embedding" WHERE "entityType" IN ('dictionary','commentary','topic','bible_event','nation');
```
No schema changes needed for rollback — tables remain but are unused.

---

## 10. Implementation Phases

### Phase 1 — Infrastructure
- Add 6 new Prisma models
- Create base importer framework
- Create knowledge API routes
- Add FTS indexes

### Phase 2 — Import Scripts
- Easton's Dictionary importer
- Smith's Dictionary importer
- Nave's Topical importer
- Matthew Henry Commentary importer

### Phase 3 — Search Enhancement
- Unified search API
- Enhanced search page UI
- Semantic search for all entity types

### Phase 4 — AI Integration
- RAG extended to all entity types
- Citation engine extended
- Entity-aware system prompts

### Phase 5 — Admin & Polish
- Import management UI
- Entity management UI
- Embedding rebuild tools
- Background job system
