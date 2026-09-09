## Summary

<!-- One paragraph. What changes, why. Link spec section by number if applicable (e.g. "spec §5.1 Banner SFTP exchange"). -->

## Screenshots / recordings

<!-- For UI changes. Delete this section if backend-only. -->

## Test plan

<!-- Bulleted list of what you did to verify. Example:
- [ ] `pnpm typecheck` clean
- [ ] `pnpm lint` clean
- [ ] `pnpm test` clean
- [ ] Manually tested /student route in browser
- [ ] Manually tested /admin route as staff role
-->

## Checklist

- [ ] No new bare strings — all user-facing text wrapped in `t('namespace.key')`
- [ ] Zod schemas in `packages/types`, shared between API + forms
- [ ] State changes wrap `logAudit(...)` in the same transaction
- [ ] No PII in logs (SSN, DOB, full name, address — use `maskPII()`)
- [ ] No raw SQL except materialized views
- [ ] Spec section number referenced above if behavior is spec-driven
