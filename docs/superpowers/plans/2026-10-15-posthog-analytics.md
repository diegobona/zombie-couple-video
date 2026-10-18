# PostHog AI referral analytics implementation plan

> **For agentic workers:** Execute inline using the existing Rumpelstiltskin integration and the repository's Spec → Code → Verify → Test → Green workflow.

**Goal:** Count Zombie Couple Video visitors arriving from ChatGPT and other AI assistants in the existing US PostHog project, filtering by Host to stay within the free one-project limit.

**Architecture:** Reuse Rumpelstiltskin's client-only, production-origin-gated PostHog initializer. Retain referrer and campaign attribution, sanitize URLs, and allow only page-load pageviews. Configure the existing shared public project token and US ingestion host at Vite build time and update the privacy disclosure. Separate website queries by Host.

**Tech Stack:** TanStack Start, React, posthog-js, Cloudflare Workers, Playwright.

### Task 1: Establish configuration and acceptance criteria

- [x] Add plain-language scenarios to `tests/e2e/TEST-CATALOG.md` before implementation.
- [x] Reuse the existing free project `666244` and its public project token; ingest at `https://us.i.posthog.com`. Provide Web Analytics → Host = zombie-couple-video.net → Channels → AI → Visitors instructions, including missing-referrer attribution limits.

### Task 2: Implement the existing integration pattern

- [x] Update `apps/tanstack-app/src/lib/analytics.ts` and `src/components/site-analytics.tsx`; install the same SDK version as Rumpelstiltskin.
- [x] Add root `.env.production` public configuration and an analytics example; document new environment names in `env.example`.
- [x] Update `apps/tanstack-app/src/lib/legal-copy.ts` with the actual collection behavior.
- [x] Document dashboard access and attribution limitations in `docs/implementation/posthog-analytics.md`.

### Task 3: Verify and deliver

- [x] Run TanStack typecheck and Cloudflare build; preview the page and privacy notice.
- [x] Write and run focused real-SDK Playwright tests with intercepted ingestion, AI referrer/UTM, stable anonymous identity, sanitized URLs, and localhost exclusion.
- [x] Run deployment dry run, deploy to the existing Worker, and verify direct live ingestion without fabricated AI referrals or provider jobs.
- [x] Record the results, project link, and any limitations.
