# Conventions

## Naming
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Hooks: `useCamelCase`
- Functions: `camelCase`
- Constants: `SCREAMING_SNAKE` only for true constants, otherwise `camelCase`
- DB tables: `snake_case`, plural (`verification_cases`)
- DB columns: `snake_case`
- Zod schemas: `PascalCase` ending in `Schema`
- TS types: `PascalCase`, no `I` prefix

## File structure
- Feature folders, not type folders
- `app/(student)/` and `app/(admin)/` route groups
- Per feature: `features/cases/{components,hooks,server,schemas}.ts`
- Shared UI primitives only: `packages/ui/`
- Cross-feature business types: `packages/types/`

## Imports
- Workspace aliases: `@/db`, `@/ui`, `@/types`
- No relative imports going up more than one level
- Sort: external → internal → relative

## Strings
- All user-facing strings go through `t('feature.key')`
- ESLint rule: no bare strings in JSX
- New strings added to `en.json` first, then run translation script

## Data
- Reads: server components or server actions, never client-side fetching of authed data
- Writes: server actions only
- Every read/write through Drizzle with RLS-aware client
- No raw SQL except for materialized views

## Validation
- Zod schema in `packages/types`, exported
- Form uses `useForm({ resolver: zodResolver(schema) })`
- Server action validates with same schema
- Never trust client input

## Errors
- Throw typed errors: `NotFoundError`, `ForbiddenError`, `ValidationError`
- Catch at the action boundary, return `{ success: false, error }`
- Show `<ErrorState />` component, never a raw stack

## Audit
- Every state change calls `logAudit({ actor, action, entityType, entityId, before, after })`
- Wrap in the same transaction as the state change
- No exceptions, even for "small" updates

## Time
- Store UTC in DB
- Display in `America/Chicago` via `<DateTime />` component
- Never `new Date()` in business logic — pass dates explicitly

## PII in logs
- Never log SSN, DOB, full name, address
- Log only IDs and action types
- If you must log a payload, mask it (`maskPII(payload)`)

## TypeScript
- Strict mode, no `any`
- No `// @ts-ignore` without a reason comment
- Server components by default, client components only when needed
- Prefer composition over abstraction (no premature `DataTable` until 3 uses)

## Tests
- Rules engine and data layer: full coverage with Vitest
- UI: defer until features are stable
- E2E with Playwright in Phase 4

## Git
- Branch naming: `feat/<workstream>-<short-desc>`, `fix/...`, `chore/...`
- Commit messages: imperative mood ("add task component", not "added")
- PRs require: green CI, one approval, no unresolved comments
- Squash merge to main

## Mocking
- All external integrations (Banner, Persona, Twilio, Resend) mocked until real creds confirmed
- Mocks live in `packages/integrations/<provider>/mock.ts`
- Toggle via env var (`USE_REAL_BANNER=1` etc.)
