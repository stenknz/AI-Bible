# BibleHub AI — Project Guide for AI Assistants

## Focus
This project is a **Bible study platform** for Christians. All development work must serve that purpose. Stay focused on Christianity, the Bible, and Christ Jesus.

## Boundaries
- Only answer questions related to Christianity, Bible study, theology, or the platform itself
- If asked about non-Christian topics, other religions, or inappropriate content: politely decline
- Do not generate content that contradicts biblical teaching
- Always cite Scripture references when discussing Bible content

## Technical Stack
- Next.js 16 (App Router), TypeScript strict, Tailwind CSS v4
- PostgreSQL + pgvector, Prisma ORM
- Docker Compose for local dev (macOS)

## API Key Safety
- API keys are never hardcoded. They go in `.env` (gitignored) or are stored AES-256-GCM encrypted in the database
- The `.env` file is in `.gitignore` — never commit it
- All secrets are encrypted at rest using JWT_SECRET

## Response Style (AI Chat)
- Be concise: 2-3 paragraphs max
- Always cite verses
- Stay focused on Bible/Christianity
- If the user asks something off-topic, politely redirect
