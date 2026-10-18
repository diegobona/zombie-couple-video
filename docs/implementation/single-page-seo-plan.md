# Single-page SEO implementation plan

Goal: consolidate the TanStack product into one indexable homepage on https://zombie-couple-video.net/ while preserving the existing Rumpelstiltskin styling.

1. Update English and mirrored Chinese copy; consolidate tutorial and story explanations in `home-content.tsx`. Keep the generator and `home.css` unchanged.
2. Replace the two former product routes with 301 redirects; limit `page-registry.ts` sitemap registration to `/` and set the owned canonical origin in `site.ts`.
3. Extend central `seoHead` with safe WebApplication JSON-LD; use accurate home metadata without invented ratings or demo images.
4. Run TanStack typecheck and Cloudflare build; verify the local Workers preview, SSR, exact title/description lengths, editorial word count, redirects and sitemap. Update the existing relevant desktop/mobile E2E checks and record results.

Scope: TanStack only. No deployment, extra landing pages, generated video, payment or Next/Nuxt work. A single-level homepage does not need artificial breadcrumb or language variants. Export current home TDH/outline/body with measured density and remaining limitations after verification.

Completed: consolidation, redirects, domain metadata and WebApplication schema implemented; TanStack typecheck/build passed; local Workers no-JS SSR checks and 10 desktop/mobile E2E checks passed. Delivery and actual density exceptions are recorded in `seo-single-page-2026-10-15.md`. Production deployment and owner-supplied demo remain outside this step.
