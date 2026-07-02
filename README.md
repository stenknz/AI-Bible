# BibleHub AI

A production-grade, self-hosted Bible study platform with AI-powered study tools.

## Quick Start

### Prerequisites
- Docker Desktop for macOS
- Node.js 20+

### Setup (One Command)

```bash
docker compose -f docker/docker-compose.dev.yml up
```

This starts PostgreSQL (with pgvector) on port 5432 and the Next.js dev server on port 3000 with hot reload.

### Seed the Database

In another terminal:

```bash
npm run db:seed
```

This imports the complete King James Bible (31,102 verses) and creates comprehensive demo data.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | ChangeMe123! |
| User | user@example.com | ChangeMe123! |

### URLs

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Home |
| http://localhost:3000/bible/1/1 | Bible Reader |
| http://localhost:3000/admin | Admin Dashboard |
| http://localhost:3000/dev-tools | Development Tools (dev only) |

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run db:push` | Push Prisma schema to DB |
| `npm run db:seed` | Seed database |
| `npm run db:reset` | Reset and reseed |
| `npm run db:studio` | Open Prisma Studio |
| `npm run test` | Run tests |
| `npm run dev:up` | Start Docker dev environment |
| `npm run dev:down` | Stop Docker dev environment |

## Features

### Phase 1 — Core
- Bible reader with keyboard navigation, red-letter support
- Notes system with TipTap rich text editor
- Unified search across Bible and notes
- Email/password authentication
- Admin dashboard with Bible import

### Phase 2 — AI Study Assistant
- RAG pipeline with pgvector similarity search
- AI task handlers (verse explanation, passage summary, etc.)
- Persistent conversation history
- Provider abstraction (OpenCode, OpenAI, Anthropic, Ollama)

### Phase 3 — Maps, Timeline & Knowledge Graph
- Interactive map with Leaflet (biblical places and journeys)
- Timeline with react-chrono
- Force-directed knowledge graph

### Phase 4 — Audio & Voice
- Audio player with speed control
- Browser speech recognition with voice commands

### Phase 5 — Personal Spiritual OS
- Prayer journal with categories and answered tracking
- Reading plans with progress tracking
- Daily dashboard

### Phase 6 — Original Language Study
- Strong's Concordance (Hebrew + Greek)
- Interlinear word-by-word analysis
- Lexicon search

### Phase 7 — Full AI Knowledge System
- Citation engine with source verification
- Reasoning trace audit trail
- Unified query engine

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL + pgvector
- **ORM:** Prisma
- **Auth:** bcryptjs + jose (JWT)
- **Editor:** TipTap (ProseMirror)
- **Infrastructure:** Docker Compose

## Open Source Data Sources

- **Scripture:** King James Version (public domain)
- **Lexicons:** STEPBible (CC BY 4.0), @metaxia/scriptures (MIT)
- **Cross-references:** Treasury of Scripture Knowledge (public domain)

## License

MIT
