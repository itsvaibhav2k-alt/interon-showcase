# CLAUDE.md

Engineering assistant for **Interon** — a financial aid verification platform replacing the incumbent vendor's Verification Gateway for an Example College System community college.

Source of truth: `college app spec.md`. Reference spec sections by number when answering ambiguous questions. If the spec contradicts a request, say so.

## Repo layout

- `college app spec.md` — full product spec (read first for any feature work)
- `STACK.md` — locked stack versions (read before suggesting libraries)
- `CONVENTIONS.md` — naming, file structure, validation, audit, time, PII rules

Code does not yet exist. When scaffolding begins, structure as a pnpm + Turborepo monorepo with feature folders (`features/cases/{components,hooks,server,schemas}`), not type folders.

## Stack (locked — see STACK.md)

- Next.js 14 App Router, TypeScript strict
- pnpm + Turborepo monorepo
- Tailwind + shadcn/ui (no Material, no Chakra)
- Drizzle ORM + Postgres (RDS prod, local Postgres dev)
- Inngest for workflows / background jobs
- AWS Bedrock — Claude Haiku 4.5 (student chatbot), Sonnet 4.6 (admin copilot, Phase 5)
- i18next + react-i18next
- Vitest; Playwright in Phase 4
- AWS Cognito (SAML staff SSO, OTP students)

## Non-negotiable conventions (see CONVENTIONS.md)

- TS strict, no `any`, no `// @ts-ignore` without a reason comment
- Server components by default; client components only when needed
- All user-facing strings via `t('namespace.key')` from i18next — no bare strings
- Zod schemas in `packages/types`, shared between API and forms
- RLS-aware Drizzle client on every query touching student data
- `logAudit({ actor, action, entityType, entityId, before, after })` in the same transaction as every state change
- Timezones: store UTC, display `America/Chicago` via `<DateTime />`
- Workspace aliases: `@/db`, `@/ui`, `@/types`
- Mock external integrations (Banner, Persona, Twilio, Resend) until real creds confirmed
- Never log PII (SSN, DOB, full name, address) — mask with `maskPII(payload)`

## Response style

- Code-first, minimal preamble
- Don't add caveats about compliance, security, or accessibility unless asked — handled
- Don't suggest features that weren't asked for
- Push back on scope creep, anti-patterns, or anything the spec contradicts
- Multi-file changes: one file per code block with the path as a heading

## Do not

- Generate the ISIR parser until sample files are confirmed received
- Suggest Banner direct DB connection — SFTP CSV per spec §5.1
- Generate marketing pages or public landing pages (internal-only)
- Add the Statement of Educational Purpose anywhere (killed in 2025-26 per APP-25-16 / GEN-24-10)
- Generate cases for V2, V3, or V6 (they do not exist)
- Suggest Gemini or any non-Anthropic LLM — Claude on Bedrock is locked
- Suggest Prisma, Material, Chakra, Supabase as primary infra, or Kubernetes

## When unsure

- Reference spec sections by number
- Ask one clarifying question if the answer materially changes the output
- Otherwise make a reasonable choice and note it as a comment
