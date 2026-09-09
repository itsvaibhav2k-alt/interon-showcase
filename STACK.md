# Stack — locked versions

## Frontend
- Next.js 14.2.x (App Router)
- React 18.3.x
- TypeScript 5.5.x strict
- Tailwind CSS 3.4.x
- shadcn/ui (latest)
- i18next 23.x + react-i18next
- React Hook Form 7.x + Zod 3.23.x
- TanStack Query 5.x (for client-side mutations only)
- Storybook 8.x + a11y addon

## Backend
- Next.js server actions + route handlers
- Drizzle ORM 0.33.x
- Postgres 15+ (RDS in prod, local container in dev)
- Inngest for workflows + background jobs
- AWS SDK v3 (Bedrock, S3, SES, Transfer Family, KMS, Secrets Manager)

## AI
- Claude Haiku 4.5 via Bedrock (student chatbot)
- Claude Sonnet 4.6 via Bedrock (admin copilot — Phase 5)
- Amazon Titan Embeddings v2
- pgvector extension for embeddings

## Auth
- AWS Cognito (SAML for staff SSO, OTP for students)
- MFA enforced for all staff roles
- Mock provider in dev with role switcher

## Integrations
- AWS Transfer Family (SFTP for Banner exchange)
- Resend (email)
- Twilio (SMS, A2P 10DLC required)
- Persona (NIST IAL2 identity — primary)
- Stripe Identity (NIST IAL2 — fallback)
- AWS Textract (OCR for tax docs)
- AWS GuardDuty Malware Protection (file scanning)

## Tooling
- pnpm 9.x
- Turborepo 2.x
- Vitest 2.x
- Playwright (Phase 4+)
- ESLint + Prettier
- Husky + lint-staged

## Infrastructure
- AWS commercial, us-east-2 (Ohio) primary
- us-east-1 (N. Virginia) DR
- Terraform for IaC
- ECS Fargate for prod containers (Vercel for dev/staging previews)
- GitHub Actions for CI/CD

## Observability
- Sentry for error tracking
- CloudWatch for logs + metrics
- Datadog for dashboards (Phase 2+)

## Do not use
- Material-UI, Chakra, or any other component library besides shadcn
- Prisma (we use Drizzle)
- Supabase as primary infra (compliance narrative cleaner with named AWS services)
- Gemini or any non-Anthropic LLM (single-vendor for AI)
- Kubernetes (Fargate is sufficient for our scale)
- Custom auth (use Cognito)
