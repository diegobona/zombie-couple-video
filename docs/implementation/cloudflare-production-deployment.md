# Cloudflare production deployment — 2026-10-15

The public website is https://zombie-couple-video.net/. This follows the previous Rumpelstiltskin project's TanStack Start → Cloudflare Workers deployment method. Next.js and Nuxt were not modified or deployed.

- Account: `c686d583b6d595875de1b8b73462fe42`.
- Worker: `zombie-couple-video`.
- Deployed version: `f0bf3912-312e-4048-9caa-c0dbf5184500` (PostHog analytics update).
- Free zone: `433adac3f7f628075fee7b98c4675d19`, active after the owner saved `ada.ns.cloudflare.com` and `rick.ns.cloudflare.com` at Spaceship.
- Dedicated production D1: `zombie-couple-video-db`, ID `91148059-78df-4402-ab60-125115291bf4`.
- All eight existing migrations (`0000`–`0007`) applied successfully to this dedicated remote database. Local preview migrations were applied separately after the ID change.
- Dedicated R2: `zombie-couple-video-uploads`.
- Production media domain: `https://media.zombie-couple-video.net`, ownership and SSL active, minimum TLS 1.2.
- Apex and `www` are both Worker custom domains. The application's existing canonical redirect sends www and HTTP to the HTTPS apex.

Source `wrangler.jsonc` now contains the production database ID, both custom domains and media URL. Worker binding types were regenerated. The previous project's database, Worker and DNS were not changed. No paid plan was selected.

## Secrets and repeat deployment

The ignored app-local `.env.production.local` contains only the existing `AUTODL_API_KEY`, the configured `AUTODL_VIDEO_WORKFLOW_ID` and a newly generated independent production `BETTER_AUTH_SECRET`. Secret values are not logged or copied into public config. They were uploaded with the Worker via `--secrets-file`. A successful read-only query of the previously created AutoDL test task confirmed that the provider credential works; no new provider task was created.

Wrangler's saved OAuth authorization became invalid during preparation and was refreshed by the owner. The successful login callback server closed automatically.

For updates, run from `apps/tanstack-app`, checking each command succeeds before the next:

```powershell
node scripts/check-production-config.mjs
node scripts/cloudflare-vite.mjs build
node node_modules/wrangler/bin/wrangler.js deploy --config dist/server/wrangler.json --secrets-file .env.production.local --dry-run
node node_modules/wrangler/bin/wrangler.js deploy --config dist/server/wrangler.json --secrets-file .env.production.local
```

Apply future schema migrations explicitly to the dedicated database with `wrangler d1 migrations apply DB --remote --config wrangler.jsonc` before deploying code that requires them. Local `.dev.vars` and local preview origin overrides remain separate from production.

## Verification

PostHog update on 2026-10-15: the TanStack site now sends basic page-load visits to the existing free US project `666244`, shared with Rumpelstiltskin. Filter Web Analytics by Host `zombie-couple-video.net`, then Channels → AI → Visitors. No paid plan or billing settings changed. Typecheck, Cloudflare build/dry run and 2 focused real-SDK E2E tests passed. Live `/e/` ingestion returned HTTP 200 / `{"status":"Ok"}`; homepage SSR and privacy disclosure passed. The direct smoke visit created no provider job. See [PostHog configuration and validation](./posthog-analytics.md). The following launch checks describe the earlier deployment unless repeated above.

- TanStack typecheck, production build, Wrangler dry run and deployment succeeded.
- Shared video-domain unit tests: 12/12 passed.
- Full local Cloudflare-preview desktop/mobile E2E: 28/28 passed, with generation responses mocked.
- Live home, privacy and terms: HTTP 200, SSR text, one H1 and self canonical; legal pages remain noindex.
- HTTP/www and both old product URLs: expected 301 destinations. Missing page: 404. Robots and the single-homepage sitemap passed.
- Live production anonymous sign-in/session and two R2 uploads succeeded. The two tiny PNG test inputs contain no person or personal photo; both were accessible through the production media domain. Their exact keys are recorded in the smoke evidence; this run did not delete them or modify the owner's external cleanup process.
- An intentionally overlong story was rejected with HTTP 400 before provider submission; the free opportunity and internal balance were unchanged.
- Desktop 1440×1000 and mobile 390×844: public links reached their targets, both photo pickers/previews and consent enabled Generate video, all eight presets remained, the waiting note was absent before generation, no horizontal overflow or page script errors.

Reproducible live check: `scripts/manual/production-smoke.mjs` (uses optional `HTTPS_PROXY`). Evidence is in `test-results/zombie-production-{deploy,build,dry-run,migrations,e2e,smoke}.log`, `zombie-production-smoke.json`, `zombie-production-provider-preflight.json` and the two production screenshots.

This deployment did not start a paid generation. A fresh production render, its result quality, playback and download remain outside this smoke check; existing reference clips do not prove provider output quality. The owner's independent automatic-deletion script and its schedule were not re-inspected.
