# i18n

This scaffold initializes i18next on the client only (see `client.ts`). All translated UI must be rendered from client components for now; server components render literal placeholders until the upgrade path below lands.

When the first server-rendered translated string is needed, replace this client-only setup with an RSC-aware `getT(locale)` helper that loads the matching JSON resource on the server (e.g. via `i18next/dist/cjs/i18next.js` + `i18next-resources-to-backend`) and exposes a synchronous `t(key)` for server components. The client-side `i18n` instance stays as-is for hydrated interactions.

Per college app spec section on language support, English and Spanish ship at launch; Vietnamese is planned for Phase 2. Add new locales by dropping a `locales/<code>.json` file and wiring it into `client.ts` (and the future `getT`).
