# Monorepo scaffold — design

**Date:** 2026-05-18
**Status:** Approved (option B — proceed via writing-plans → execute)
**Owner:** Interon platform team

## 1. Goal

Stand up the empty Turborepo monorepo for the Interon financial aid verification platform per `STACK.md` and `CONVENTIONS.md`. Output is a runnable shell with no business features: a new engineer can `pnpm install && pnpm dev`, hit `http://localhost:3000` on both `(student)` and `(admin)` route groups, and have lint/typecheck/test pass green in under 10 minutes.

Out of scope for this scaffold: ISIR parser, auth, Drizzle schema tables, i18next translation files, Cognito/Persona/Twilio/Banner integrations, Inngest workflows, Storybook, Husky, AWS infra, deploy pipelines.

## 2. Top-level layout

```
finaidapp/
├── apps/
│   └── web/                       # Next.js 14 App Router, single app for student + admin
│       ├── app/
│       │   ├── (student)/page.tsx
│       │   ├── (admin)/page.tsx
│       │   ├── layout.tsx
│       │   ├── providers.tsx
│       │   └── globals.css
│       ├── lib/i18n/               # i18next bootstrap, en.json
│       ├── public/
│       ├── components.json         # shadcn config
│       ├── next.config.mjs
│       ├── postcss.config.mjs
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   ├── db/
│   │   ├── src/
│   │   │   ├── index.ts            # drizzle client + RLS-aware factory placeholder
│   │   │   ├── schema/index.ts     # empty schema barrel
│   │   │   └── env.ts              # DATABASE_URL parsing
│   │   ├── drizzle.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── ui/
│   │   ├── src/
│   │   │   ├── index.ts            # shadcn primitive re-exports
│   │   │   ├── tokens.ts           # design tokens (spacing, radii, semantic colors)
│   │   │   └── lib/cn.ts           # tailwind-merge helper
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── types/
│       ├── src/
│       │   ├── index.ts            # zod schema barrel (empty)
│       │   └── result.ts           # Result<T, E> per TYPESCRIPT_RULES
│       ├── tsconfig.json
│       └── package.json
├── .github/workflows/ci.yml
├── docker-compose.yml              # postgres:15 + pgvector for local dev
├── .eslintrc.cjs
├── .gitignore
├── .nvmrc                          # 20.11.0
├── .env.example
├── .prettierrc
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── CLAUDE.md                       # already exists
├── STACK.md                        # already exists
├── CONVENTIONS.md                  # already exists
├── docs/
│   └── superpowers/specs/          # this file lives here
└── README.md
```

## 3. Versions (resolved from STACK.md)

| Tool | Version |
|---|---|
| Node | `20.11.0` (in `.nvmrc`, `engines.node >=20.11`) |
| pnpm | `9.12.0` (via `packageManager` field) |
| Turborepo | `2.3.x` |
| Next.js | `14.2.x` |
| React | `18.3.x` |
| TypeScript | `5.5.x` |
| Tailwind | `3.4.x` |
| Drizzle ORM | `0.33.x` |
| Drizzle Kit | `0.24.x` |
| Postgres driver | `postgres` (postgres.js) `3.4.x` |
| Zod | `3.23.x` |
| i18next | `23.x` |
| react-i18next | `15.x` |
| TanStack Query | `5.x` |
| Vitest | `2.x` |
| ESLint | `8.57.x` (legacy config per request) |
| Prettier | `3.3.x` |

## 4. Workspace configuration

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### `turbo.json` (Turbo 2.x — `tasks` key, not `pipeline`)

Pipelines:
- `build` — depends on `^build`, outputs `.next/**` (excluding `cache`) and `dist/**`. Defined for `apps/web` only in this scaffold; `packages/*` ship as plain TS and have no `build` script (Turbo treats missing scripts as no-ops).
- `lint` — no deps
- `typecheck` — no deps (each workspace runs `tsc --noEmit` independently; TS path mappings resolve packages from source)
- `test` — no deps
- `dev` — `cache: false`, `persistent: true`
- `db:generate` / `db:migrate` — package-scoped, no cache

### `package.json` (root)

Scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `test:watch`, `format`, `db:generate`, `db:migrate`, `db:up` (docker compose up postgres).
`packageManager: pnpm@9.12.0`. Student deps only at root: `turbo`, `prettier`, `typescript`, `@types/node`, `eslint`, `eslint-config-next`, plugins.

### `tsconfig.base.json`

`strict: true`, `noUncheckedIndexedAccess: true`, `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`, `paths` for `@/db`, `@/ui`, `@/types`, `@/db/*`, `@/ui/*`, `@/types/*`.

## 5. `apps/web`

- Next.js 14 App Router with `src/`-less layout (`app/` at the app root, matching shadcn defaults).
- Route groups:
  - `app/(student)/page.tsx` — renders `t('student.hello')`
  - `app/(admin)/page.tsx` — renders `t('admin.hello')`
- Shared `app/layout.tsx` wraps `Providers` (TanStack Query + i18next).
- Tailwind configured with `content` covering `apps/web` and `packages/ui`.
- shadcn initialized:
  - `components.json` style `new-york`, base color `slate`, CSS variables on, `rsc: true`.
  - `cn` helper proxied from `@/ui/lib/cn`.
- i18next: SSR-safe init at `lib/i18n/index.ts`, namespaces `common` / `student` / `admin`, English `lib/i18n/locales/en.json` with the two hello keys above.
- `next.config.mjs` with `transpilePackages: ['@interon/ui', '@interon/types']`.

## 6. `packages/db`

- Exports a `db` factory that takes a `DATABASE_URL` and an optional RLS context, returns a Drizzle client. For the scaffold the RLS hook is a stub (`setRls(ctx)` documented as "wire up when first table lands").
- `drizzle.config.ts` points at `src/schema/index.ts` with output `./migrations`.
- `src/schema/index.ts` exports nothing (empty barrel) so the package builds.
- `env.ts` parses `DATABASE_URL` with Zod, throws if missing.

## 7. `packages/ui`

- Re-exports a curated set of shadcn primitives. For the scaffold only **`Button`** is added end-to-end (proves the shadcn pipeline). Other primitives added on demand.
- `tokens.ts` — exports `spacing`, `radii`, `typography`, and semantic color token names (mapped to CSS vars set by shadcn). One source of truth for design system values referenced from feature code.
- `lib/cn.ts` — `clsx` + `tailwind-merge`.
- Package builds as `tsup` → `dist/` or ships as plain TS via `"exports"` source maps. Decision: **ship as plain TS** (no build step), since both consumer apps and packages share the same TS config. Reduces dev-loop friction. `"main"` and `"types"` point to `src/index.ts`. `transpilePackages` in `apps/web` handles it.

## 8. `packages/types`

- `src/index.ts` empty barrel for Zod schemas.
- `src/result.ts` exports `Result<T, E>`, `ok(value)`, `err(error)` per TYPESCRIPT_RULES.md.
- Same "plain TS, no build" approach as `packages/ui`.

## 9. ESLint (`.eslintrc.cjs`)

Top-level extends (apply to all workspaces):
- `eslint:recommended`
- `plugin:@typescript-eslint/recommended`
- `plugin:import/recommended`, `plugin:import/typescript`

Top-level rules:
- `no-restricted-imports`: forbid patterns matching `../../*` and deeper (relative depth > 1) — message points to workspace aliases
- `import/order`: enforces external → internal → relative with newlines between groups
- `@typescript-eslint/no-explicit-any`: `error`
- `@typescript-eslint/ban-ts-comment`: requires `description` (so `@ts-ignore` needs a reason)
- `@typescript-eslint/consistent-type-imports`: `error`

Overrides:
- `apps/web/**/*.{ts,tsx}` — extends `next/core-web-vitals`; enables `react/jsx-no-literals: error` with `allowedStrings: [':', '/', '-', '·', '•', '—']` and `ignoreProps: true`
- `packages/**/*.{ts,tsx}` — no React rules; no Next rules
- `*.config.*`, `*.cjs` — disable strict rules
- `**/*.test.ts`, `**/*.test.tsx` — relax `jsx-no-literals` (test fixtures fine)

Required plugins (root devDeps): `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-import`, `eslint-import-resolver-typescript`, `eslint-plugin-react`, `eslint-config-next`.

## 10. CI (`.github/workflows/ci.yml`)

Trigger: `pull_request` and `push` to `main`.

Single job `ci` running on `ubuntu-latest`:
1. Checkout
2. Setup pnpm (`pnpm/action-setup@v4`, version from `packageManager`)
3. Setup Node 20.11 with `cache: pnpm`
4. `pnpm install --frozen-lockfile`
5. `pnpm turbo run lint typecheck test` (one Turbo invocation, parallel)

No matrix yet. No Postgres in CI yet (no DB-touching tests).

## 11. Docker Compose

`docker-compose.yml` exposes Postgres 15 with `pgvector` (using `pgvector/pgvector:pg15` image), persistent volume `pg_data`, port `5432:5432`, env `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=postgres`, `POSTGRES_DB=interon_dev`.

## 12. README

Sections covering, in order:
1. What this is (one paragraph, points at `college app spec.md`)
2. Prerequisites: Node 20.11, pnpm 9, Docker
3. Quick start: `nvm use && pnpm install && pnpm db:up && cp .env.example .env && pnpm db:generate && pnpm dev`
4. Workspace layout (mirrors §2 above)
5. Common commands table (lint, typecheck, test, format, db:generate, db:migrate)
6. Environment variables (one entry: `DATABASE_URL`)
7. Where to look next (CLAUDE.md, STACK.md, CONVENTIONS.md, college app spec.md)

Target: a new engineer running the dev server with a green CI loop in ≤10 minutes assuming Docker is already installed.

## 13. Smoke test (acceptance for the scaffold)

After implementing, running these in order from a clean clone must succeed:

```bash
nvm use
pnpm install --frozen-lockfile
pnpm db:up
pnpm dev          # → http://localhost:3000/(student)/ and /(admin)/ render the hello strings
pnpm lint
pnpm typecheck
pnpm test
```

CI must run lint + typecheck + test green on a PR.

## 14. Explicit non-goals / deferred

- Husky + lint-staged — deferred until first contributor onboards
- Storybook — Phase 1+
- Inngest scaffolding — not requested, deferred
- `packages/integrations/` — created when first mock lands
- AWS Cognito mock provider — separate task
- A separate `apps/admin` Next app — using route groups in `apps/web` instead
- Vitest workspace config — single root `vitest.config.ts` for now; per-package configs added when first test lands
- Bundling `packages/ui` and `packages/types` — shipping as plain TS via `transpilePackages`

## 15. Open decisions noted for later

- **Inngest dev server** boot order vs Next dev server — revisit when first workflow lands.
- **Per-feature ESLint plugin for `t()` enforcement** beyond `jsx-no-literals` (e.g., catching `<div title="Hello">`) — leave as `ignoreProps: true` for now; tighten if bare-string regressions appear.
- **Drizzle migrations directory** — currently inside `packages/db/migrations`; if many engineers edit schema concurrently we may move to per-domain folders.
