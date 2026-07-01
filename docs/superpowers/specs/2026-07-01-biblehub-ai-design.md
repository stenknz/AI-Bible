# BibleHub AI — Design Specification

**Date:** 2026-07-01
**Status:** Approved
**Phase:** 1

## Overview

BibleHub AI is a production-grade, self-hosted Bible study platform combining Notion-style notes, Obsidian-style linking, Logos-style study tools, an AI-powered assistant, and offline-first reading. Phase 1 builds the modular foundation.

## Tech Stack

- Next.js 15 (App Router), TypeScript (strict), Tailwind CSS, shadcn/ui
- PostgreSQL, Prisma ORM, pgvector (RAG-ready schema only)
- Docker + Docker Compose, GitHub Actions CI/CD ready
- PWA support, fully responsive

## Architecture

Single Next.js app with strict modular folder structure under `src/modules/<name>/`. Each module owns its components, hooks, services, and types. API routes in `src/app/api/` are thin proxies to module services. Server Components preferred for data fetching.

### Folder Structure

```
biblehub-ai/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── prisma/
│   ├── schema.prisma
│   └── seeds/
├── public/
│   └── bible/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── bible/
│   │   ├── notes/
│   │   ├── search/
│   │   ├── admin/
│   │   └── api/
│   ├── modules/
│   │   ├── bible/
│   │   ├── notes/
│   │   ├── search/
│   │   ├── ai/
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── pwa/
│   │   ├── maps/       (placeholder)
│   │   ├── audio/      (placeholder)
│   │   ├── timeline/   (placeholder)
│   │   ├── prayer/     (schema only)
│   │   └── reading-plans/ (placeholder)
│   ├── components/
│   ├── lib/
│   └── hooks/
├── types/
├── .env.example
└── package.json
```

## Database Schema

Models: User, Translation, Book, Chapter, Verse, Note, Highlight, UserPreference, Prayer, ReadingPlan, FeatureToggle.

Key design decisions:
- `Verse.text` is plain string (fast rendering), `Note.content` is TipTap JSON
- `Note.tags` uses PostgreSQL array, `Note.linksTo` stores `[[wiki-link]]` strings
- `Chapter` is separate model for fast chapter-level queries
- `isRedLetter` boolean on Verse (heuristics in Gospels)
- pgvector `embedding` column on Verse, Note (design only — no generation)
- GIN index on Verse.text for full-text search

### Core Models

```
User — id, email, passwordHash, name, role (USER/ADMIN), timestamps
Translation — id, code (unique), name, language, isDefault
Book — id, translationId, number (canonical order), name, testament (OLD/NEW)
Chapter — id, bookId, number
Verse — id, chapterId, number, text, isRedLetter, embedding? (pgvector)
Note — id, userId, verseId?, title, content (JSON), tags (string[]), linksTo (string[])
Highlight — id, userId, verseId, color
UserPreference — id, userId, theme, fontSize, lineSpacing, columnWidth, bibleVersion
Prayer — id, userId, title, content, category, answeredAt, timestamps
ReadingPlan — id, userId, name, days, startDate
FeatureToggle — id, key (unique), enabled, description
```

## Phase 1 Modules

### Bible Engine

TSV import → Prisma batch insert → Server Component query → React rendering.

- Reader layout with inline verse numbers, red-letter styling for Christ's words in Gospels
- Parallel view: side-by-side translations
- Keyboard navigation: ← → for chapters, j/k for verses
- Single query per chapter, <50ms render target

### Reading Experience

- System font stack, Notion-like typography
- Dark/light mode via Tailwind `dark:` + localStorage
- Font size (14–24px), line spacing (1.4–2.0), column width (480/640/800px)
- Focus mode: dims non-active verses
- Preferences persisted to DB and localStorage

### Notes System

TipTap editor with:
- Verse-attached notes (click verse → sidebar)
- Standalone notes
- `[[wiki-link]]` autocomplete and backlinking
- Tag input with autocomplete
- Content stored as TipTap JSON

### Search Engine

PostgreSQL full-text search (tsvector/GIN index):
- Keyword search (ILIKE fallback)
- Phrase search (tsquery <-> operator)
- Fuzzy search (pg_trgm, future)
- Unified results across verses, notes, highlights
- Book filter dropdown

### Authentication

- Email + password via bcrypt + JWT (HTTP-only cookies)
- Next.js middleware for route protection
- Admin role checks for admin routes
- Registration invite-only initially (admin seeded via env var)

### Admin Dashboard

- Bible import: TSV upload → parse → batch insert → summary
- Translation management
- System status
- Feature toggles (runtime)

### AI Abstraction Layer

Provider interface (`chat`, `stream`, `embeddings`) with router based on `ACTIVE_PROVIDER` env var. Placeholder UI buttons (show "Coming soon"). No AI logic implemented.

Supported providers (future): OpenCode Zen, OpenCode Go, OpenAI, Anthropic, Ollama.

### Docker Deployment

- Multi-stage Dockerfile (distroless node runner)
- pgvector/pgvector:pg16 for database
- Persistent PostgreSQL volume, single bind mount
- Production-ready with .env.example

## Future Module Placeholders

Minimal structure only (folder + types):
- Maps: Place, City, Region, Journey, Event (OpenStreetMap future)
- Audio: ChapterAudio, VerseAudio, PlaybackState, OfflineDownloads
- Timeline: TimelineEvent, Era, Event→Verse linking
- Prayer Journal: (schema exists) CRUD types only
- Reading Plans: (schema exists) types only

## Constraints

- AI reasoning and prompts NOT implemented in Phase 1
- No external APIs inside business logic
- No over-building Phase 2+ features
- TypeScript strict mode, no `any` types
- SOLID principles, reusable components
