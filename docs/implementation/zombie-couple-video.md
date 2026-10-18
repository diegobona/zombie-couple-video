# Zombie couple request adapter

The public product is TanStack-only. The prior project's layout, CSS, anonymous sessions, uploads, durable tasks, refunds and downloads are reused. Shared domain validation and prompt construction live in `libs/ai/zombie-video.ts`.

`POST /api/video-generate/` accepts `storyTemplate: "zombie-couple-v1"`, `storyId`, optional editable `story`, required `survivorImageUrl`, required `partnerImageUrl`, and `consent: true`. Story IDs and limits live in `config/zombieVideo.ts`. Both image URLs must belong to the current user's upload prefix before trial reservation or charging.

The builder rejects unknown IDs, non-text or over-500-character stories, missing consent, missing images, duplicate references and non-HTTPS references. Empty text uses the selected preset. The output request has exactly two references in role order and server-owned provider, model, duration and resolution. Custom text cannot change billing settings.

Normal portraits represent both adults. The prompt assigns zombie styling to the second person, requests distinct identities, stable camera orientation during the embrace, and healthy appearances during the happy memory.

EN/ZH strings are in `libs/i18n/locales/zombie-couple/` and exported through the existing locales. The public product retains the previous single-English-route approach.

There is no reference-video input. At the owner's request, three local examples downloaded from the competitor template section use `demo.examples`, native controls, posters and preload=none. The gallery labels them as third-party references and links the source. No generated test video or private reference portrait is copied to public website assets. See `reference-demos-2026-10-15.md` for asset provenance and playback checks; prompt sources remain in `zombie-prompt-sources-2026-10-15.md`.

Cloudflare uses a new Worker name, dedicated R2 and local D1. The D1 ID is a local placeholder until deployment. No additional provider video generation is performed in this implementation step.

Single-page SEO: `page-registry.ts` registers only `/` for the sitemap. Former generator and tutorial routes return 301 using Router redirects; their content is consolidated in `home-content.tsx`, with the original `home.css` preserved. Central `seoHead` safely serializes WebApplication JSON-LD. Public SEO origin defaults to `https://zombie-couple-video.net`; local auth origins remain local. Legal pages keep self canonicals and noindex. There are no public demo images/videos yet, no artificial breadcrumb hierarchy and no alternate-language routes. DNS, www redirects and production deployment remain pending.

Visitor review fixes: browser image decoding rejects corrupt portraits before previews or uploads; consent is reset when a valid image changes. The form explains the one-successful-video limit, public photo-link access and terms/privacy before submission. Support is linked from the footer. If a submission response is lost after task creation, the catch path refreshes server trial state, recovers its owned task ID and turns the button into a status retry; it does not repeat the generation POST. No-JS visitors receive an explicit notice.

Committed Worker auth origins now use the owned HTTPS domain; the preview launcher retains explicit localhost overrides. The dedicated public R2 URL is configured in Wrangler vars and required runtime secret names are declared. `check:production` checks static deployment config and `deploy:cf` runs it before building/deploying. The current local-placeholder D1 ID intentionally fails this check. Passing the static check is not proof that remote secrets, migrations or the provider work; those require production verification.
