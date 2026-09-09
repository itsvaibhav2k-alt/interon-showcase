# Interon

Financial aid verification platform for an Example College System community college. Replaces the incumbent vendor's Verification Gateway end-to-end: ingests ISIRs, generates per-student verification tasks per current FAFSA Simplification rules, collects documents and signatures, lets aid staff review/approve/escalate cases, and writes outcomes back to Banner + the FAFSA Partner Portal.

Source of truth for product behavior: [`college app spec.md`](./college%20app%20spec.md).

## Prerequisites

- Node **20.11.x** (run `nvm use` — see [`.nvmrc`](./.nvmrc))
- pnpm **9.12.x** (`npm install -g pnpm@9.12.0`)
- Docker (for local Postgres)

## Quick start

```bash
nvm use
pnpm install
pnpm db:up                                                          # starts Postgres + pgvector on :5433
cp .env.example .env                                                # then set AUTH_SESSION_SECRET (>=32 chars)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/interon_dev pnpm db:migrate
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/interon_dev pnpm db:seed
pnpm dev                                                            # http://localhost:3000
```

Also create `apps/web/.env.local` with the same `DATABASE_URL` + `AUTH_SESSION_SECRET` — Next loads from the app directory, not the repo root.

The dev server serves:

- `/` — landing with Sign in / role switcher
- `/student` — student dashboard (requires `role=student`)
- `/admin` — case list (requires `role!=student`; middleware redirects students)
- `/admin/cases/{case_number}` — case detail with audit timeline

The top-bar **Viewing as** chip lets you switch between the demo student, counselor, and director sessions for dev. Cookie-backed (iron-session), survives reloads.

## Seeding

`pnpm db:seed` truncates and re-inserts the demo data (12 students, 5 staff, 14 cases, 47 tasks, 67 audit events). UUIDs are deterministic across runs via uuid v5, so the same `synthetic-student-001`/`synthetic-staff-001` mock IDs always map to the same DB rows. Source data lives at `apps/web/lib/mock-data/` — slated to move under `packages/db/src/seed-data/` once unit tests need it.

## Workspace layout

```
finaidapp/
├── apps/
│   └── web/                  Next.js 14 App Router. Route groups (student) + (admin).
├── packages/
│   ├── db/                   Drizzle ORM + postgres.js + Zod env parsing
│   ├── ui/                   shadcn primitives, design tokens, cn() helper
│   └── types/                Shared Zod schemas + Result<T,E>
├── docs/
│   └── superpowers/specs/    Design specs (one per major feature)
├── .github/workflows/        CI: lint + typecheck + test on every PR
├── docker-compose.yml        Local Postgres 15 + pgvector
├── CLAUDE.md                 Engineering assistant rules
├── STACK.md                  Locked stack versions
├── CONVENTIONS.md            Naming, file structure, validation, audit, PII rules
└── college app spec.md       Full product spec
```

Feature folders, not type folders. See [`CONVENTIONS.md`](./CONVENTIONS.md) for the full layout rules.

## Common commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start Next dev server on :3000 |
| `pnpm build` | Production build (`turbo run build`) |
| `pnpm lint` | ESLint across all workspaces |
| `pnpm typecheck` | `tsc --noEmit` across all workspaces |
| `pnpm test` | Vitest run (passes with no tests yet) |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm format` | Prettier write |
| `pnpm db:up` | Start Postgres via docker compose |
| `pnpm db:down` | Stop Postgres |
| `pnpm db:generate` | Drizzle Kit generate (no-op until first table lands) |
| `pnpm db:migrate` | Drizzle Kit migrate |

## Environment

See [`.env.example`](./.env.example). Only `DATABASE_URL` is required for local dev. The remaining variables (AWS / Bedrock / Cognito / Persona / Twilio / Resend / Inngest) are commented placeholders and only needed as their respective integrations come online.

## Workspace aliases

TS path mappings (set in [`tsconfig.base.json`](./tsconfig.base.json)):

- `@/db` → `packages/db/src` — Drizzle client + schema barrel
- `@/ui` → `packages/ui/src` — shadcn primitives + tokens
- `@/types` → `packages/types/src` — shared Zod schemas + Result type
- `@/lib/*`, `@/app/*` — in-app paths inside `apps/web` only

Cross-package imports MUST use these aliases. Relative imports going up more than one level are forbidden by ESLint.

## What to read next

- [`CLAUDE.md`](./CLAUDE.md) — assistant ground rules and "do nots"
- [`STACK.md`](./STACK.md) — locked versions and explicit no-go libraries
- [`CONVENTIONS.md`](./CONVENTIONS.md) — naming, validation, audit, time, PII rules
- [`college app spec.md`](./college%20app%20spec.md) — full product spec; reference by section when in doubt
- `docs/superpowers/specs/` — design docs for in-flight features
