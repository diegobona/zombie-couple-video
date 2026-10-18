# Zombie Couple Video

This product uses **TanStack Start only**. Next.js and Nuxt are unused scaffold apps and are outside this product's development and verification scope.

## Run locally

From the repository root, run `corepack pnpm install --frozen-lockfile` and `corepack pnpm --filter @tinyship/tanstack-app build`.

In `apps/tanstack-app`, run `node node_modules/wrangler/bin/wrangler.js d1 migrations apply DB --local --config wrangler.jsonc`, then `node scripts/cloudflare-preview.mjs`. Open http://127.0.0.1:7001.

Anonymous sessions and tasks use this project's local D1. Uploads use the dedicated `zombie-couple-video-uploads` R2 bucket, with public image URLs for AutoDL. The ignored `.dev.vars` contains the provider key and an independent session secret.

## User flow

Upload separate adult portraits for the survivor and zombie partner. Choose one of eight stories and edit up to 500 characters. Quiet Embrace is the default; five presets use one continuous scene and three retain the happy-memory format. Confirm permission and start generation. There is no user-facing account or payment. A successful generation uses the limited free opportunity; a confirmed failure restores it.

The server selects AutoDL H3, 10 seconds and `768p竖` (currently 768×1344). Exact output duration and visual details can vary. The API only accepts pictures uploaded under the current anonymous user's prefix.

The high-demand waiting note stays hidden initially. If generation is still running two minutes after submission, it appears directly below the video preview in the result column. Uploading and processing share the same timer. The note disappears when the operation succeeds or fails, and each new attempt starts a fresh timer.

## Owner-supplied demonstration

The owner replaced the unavailable WeChat files with three reference examples downloaded from `https://zombiecouplevideo.com/#templates`: Snowbound Reunion, Love After the Rain and Golden Memories. Their source URLs and download details are retained in `test-results/demo-source/provenance.json`. The owner subsequently requested removal of the public explanatory paragraph and source link; the gallery now shows just its heading, players and titles. These assets are not evidence of this site's generated output.

The prepared local assets are H.264, 540×960, approximately 12 seconds, with no audio tracks in these source clips. Existing footage and timing are preserved; no AI video is generated. Each player has a JPEG poster, native controls, inline playback and preload=none, with no autoplay. Run `node scripts/prepare-zombie-demos.mjs <first-video> <second-video> <third-video>` to re-prepare all three and enable `demo.examples` in `config/zombieVideo.ts`. No reference video is submitted to the generation provider. Source and verification details: `docs/implementation/reference-demos-2026-10-15.md`.

## Production setup

The site is deployed at `https://zombie-couple-video.net/`. Canonical, Open Graph and discovery URLs use this origin even in local previews. Any `VITE_SITE_URL` override must match it for a production build. Apex/www custom domains, production D1 migrations and runtime secrets are configured; HTTP and www permanently redirect to the HTTPS apex. Uploads use `https://media.zombie-couple-video.net/`. Deployment details and update commands are in `docs/implementation/cloudflare-production-deployment.md`.

The homepage is the only indexable product page. It contains the generator, compact example videos, tutorial, photo/prompt/result tips, output settings and FAQ. At the owner's request, the long story explanation section below the generator has been removed; the eight editable presets remain available in the form. The old generator URL permanently redirects to `/`, and the old tutorial URL to `/#how-to-make`. Privacy and terms remain accessible with `noindex, follow`; the sitemap contains only the homepage. The public site is English only, so no language-alternate URLs are advertised.

The owner confirmed that ColdStone co. and zw83716@gmail.com apply to this site. The current offer provides one successful video per browser; a completed output uses that opportunity even if its appearance varies. Photo links are public for provider processing. The owner confirmed an independently implemented automatic-deletion script, so the form and policies state that uploaded photos are automatically deleted from our storage without promising a specific deadline or deletion of provider-retained copies.

The production configuration guard passes with the dedicated database ID. Live checks verified anonymous sessions, uploads, page links, HTTPS and redirects; the provider key passed a read-only query. Production secrets were uploaded from the ignored app-local `.env.production.local`; `.dev.vars` is only for local preview. This deployment did not spend money on a new provider render, so a fresh production generation, recovery and download acceptance check is still pending. The enabled reference demos do not replace that check.

## Focused checks

- `corepack pnpm --filter @tinyship/tanstack-app typecheck`
- `corepack pnpm --filter @tinyship/tanstack-app build`
- `node node_modules/vitest/vitest.mjs run tests/unit/ai/zombie-video.test.ts`
- `node node_modules/@playwright/test/cli.js test --config tests/e2e/zombie.config.ts`

The desktop/mobile E2E suite mocks generation responses and creates no billable provider jobs. It covers story editing, separate uploads, consent, request shape, result/download states, confirmed failure recovery and metadata. Real anonymous upload and rejection-before-charge are checked separately with local D1 and the dedicated R2 bucket.
