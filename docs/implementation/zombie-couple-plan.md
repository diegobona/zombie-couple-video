# Zombie Couple Video implementation plan

Goal: reuse the Rumpelstiltskin TanStack interface and anonymous generation flow for two adult portraits, three editable story prompts, and a user-supplied demonstration video later.

Scope: TanStack Start product only, matching the agreed previous-project approach. Shared AutoDL, trial, persistence, auth and credit support are reused. No additional image/video generation, subscriptions, video-reference templates or deployment in this step.

- [x] Reuse proven shared generation libraries, database migrations and TanStack shell. Back up replaced scaffold files locally; keep secrets and deployed resources separate.
- [x] Add story defaults in config, EN/ZH copy, and a shared server-owned request builder. Require two portraits, consent, valid story selection and bounded custom text. Keep duration/model/resolution server-owned.
- [x] Adapt the existing two-column maker with required partner upload, three existing-style buttons and editable story text. Preserve upload caching, task recovery, download and anonymous quota behavior.
- [x] Replace public home/help/legal/SEO content. Do not publish the test video or an empty demo player. Use a configurable demo asset only after the user supplies it.
- [x] Verify focused request/credit/provider tests, TanStack typecheck and Cloudflare build, local D1 preview, desktop/mobile UI and mocked-provider E2E. Never make a live provider generation during verification.

Files: `config/zombieVideo.ts`, `libs/ai/zombie-video.ts`, `libs/i18n/locales/zombie-couple/*`, `apps/tanstack-app/src/components/*`, `apps/tanstack-app/src/lib/*`, public routes, local runtime config, `tests/unit/ai/zombie-video.test.ts`, `tests/e2e/specs/zombie-couple.spec.ts`.
