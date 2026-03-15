# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cheerly is a smart schedule management service that sends reminder notifications with AI-generated encouragement messages before scheduled events.

Core concept: **Reminder + Encouragement** — not just alerts, but motivational messages to help users prepare for upcoming events.

PRD location: `docs/PRD.md` (Korean)

---

## Current Implementation Status

| Sprint | Content | Status |
|--------|---------|--------|
| Sprint 1 | Frontend UI — schedule list, form, detail, edit, delete | Complete |
| Sprint 2 | Backend API + Prisma DB + Claude AI + scheduler + Teams Webhook | Complete |
| Sprint 3 | Production build stabilization, deployment | Planned |

**Known issue**: `npm run build` fails due to Next.js 16 internal `workUnitAsyncStorage` bug during `/_global-error` prerendering. `npm run dev` works correctly. This is a confirmed Next.js bug, not our code.

**Test coverage**: 53 tests across 12 files, all passing (`npx vitest run`)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript |
| Database | SQLite via better-sqlite3 |
| ORM | Prisma v7.5.0 (driver adapter pattern) |
| AI | Anthropic Claude claude-haiku-4-5-20251001 (`@anthropic-ai/sdk`) |
| Scheduler | node-cron v4 (initialized via `instrumentation.ts`) |
| Validation | Zod v4 |
| Styling | Tailwind CSS v4 |
| Testing | Vitest v4 + Testing Library |

---

## Key Architecture Decisions

### Prisma v7 Driver Adapter
Prisma v7 removed built-in drivers. Must use `PrismaBetterSqlite3` adapter from `@prisma/adapter-better-sqlite3`. DB URL is configured in `prisma.config.ts`, NOT in `prisma/schema.prisma`.

```typescript
// src/lib/db.ts
const adapter = new PrismaBetterSqlite3({ url: dbUrl })
return new PrismaClient({ adapter })
```

### Proxy Pattern for Lazy PrismaClient
`db.ts` uses `new Proxy()` to defer PrismaClient initialization until first DB access. This prevents `better-sqlite3` binary loading at Next.js build time.

### Scheduler Initialization via instrumentation.ts
`src/instrumentation.ts` initializes node-cron exactly once per server start. Guard: `NEXT_RUNTIME === 'nodejs' && NODE_ENV !== 'test'`. No config needed in `next.config.ts` (stable in Next.js 16).

### Date Serialization at Server/Client Boundary
Server Components pass Prisma `Date` objects directly to other Server Components. When crossing to Client Components, serialize to ISO strings with `.toISOString()`, then `new Date(str)` in the Client Component.

### AI with Static Fallback
`getEncouragementMessage()` tries Claude AI first. Falls back to category-specific static messages (11+ per category) when API key is missing or API fails. Notifications are never blocked by AI failures.

---

## Development Workflow

This project uses a structured Claude Code agent pipeline:

1. **prd-to-roadmap** — Generates `docs/ROADMAP.md` from `docs/PRD.md`
2. **sprint-planner** — Creates sprint plans in `docs/sprint/sprintN.md` from the roadmap
3. **Implementation** — Follow `writing-plans` skill (TDD, bite-sized tasks, frequent commits)
4. **code-reviewer** — Reviews completed implementations against plans
5. **sprint-close** — Updates ROADMAP.md, creates PR (sprint branch → main), runs Playwright verification, generates reports

---

## Key Conventions

- **Frontend-first development**: Build frontend first, get user review, then complete backend
- **Sprint branches**: Keep on remote after merge (never delete) for history preservation
- **Documentation language**: Korean for all project documentation
- **Dev server**: `npm run dev` on port 3000
- **Verification**: Playwright MCP tools for UI testing after each sprint
- **TDD**: Write tests before implementation for all lib/ and api/ modules

---

## Environment Variables

```env
DATABASE_URL="file:./prisma/dev.db"   # Required
ANTHROPIC_API_KEY="sk-ant-..."         # Optional — falls back to static messages
TEAMS_WEBHOOK_URL="https://..."        # Optional — skips Teams if missing
```

---

## Document Structure

- `docs/PRD.md` — Product Requirements Document (Korean)
- `docs/ROADMAP.md` — Project roadmap with phase/sprint breakdown
- `docs/plans/YYYY-MM-DD-<feature-name>.md` — Implementation plans
- `docs/sprint/sprintN.md` — Sprint plans
- `docs/sprint/sprintN/` — Sprint screenshots and verification reports

---

## Prisma v7 Quick Reference

| Item | Old (≤v6) | Prisma v7 |
|------|-----------|-----------|
| generator provider | `"prisma-client-js"` | `"prisma-client"` |
| datasource url | in `schema.prisma` | in `prisma.config.ts` only |
| import path | `from '@prisma/client'` | `from '@/generated/prisma/client'` |
| client init | `new PrismaClient()` | `new PrismaClient({ adapter })` |
| seed config | `package.json prisma block` | `prisma.config.ts migrations.seed` |
| error issues | `.errors` | `.issues` |
