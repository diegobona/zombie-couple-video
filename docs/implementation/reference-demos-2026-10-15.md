# Reference demonstration videos — 2026-10-15

The user explicitly requested typical examples from https://zombiecouplevideo.com/#templates after the WeChat files became unavailable. Selected three existing couple clips: Snowbound Reunion, Love After the Rain and Golden Memories. No pet/family templates were selected and no new video generation was called.

The three public MP4s were downloaded through their actual src URLs in the template section. Provenance, original URLs, sizes and download timestamps are saved in `test-results/demo-source/provenance.json`. Source files and reviewed contact sheets are retained under `test-results/demo-source/` and `test-results/demo-review/`.

All three source clips are H.264/yuv420p, portrait 540×960, approximately 12 seconds, with no audio streams. They were remuxed with MP4 faststart while copying encoded streams; there is no cropping, new soundtrack, footage replacement or watermark removal. JPEG posters are extracted at 0.8 seconds. Public files are `apps/tanstack-app/public/videos/zombie-couple-example-{1,2,3}.mp4` and matching JPEGs in `public/images/`.

The homepage keeps the existing styling and places a compact three-card gallery in the top section, beside the title/intro on desktop and in one row on mobile, above the generator. Videos use native controls, playsInline, no autoplay and preload=none. They show a poster before play. At the user's explicit request, the explanatory paragraph and public source link beneath the cards were removed; video titles remain. Asset provenance is retained internally. These examples are never included as provider input.

Verification completed: TanStack typecheck and Cloudflare build passed; 12/12 prompt unit tests and 24/24 desktop/mobile E2E passed. All three local videos play and seek without media errors, durations are 12 / 11.958333 / 12 seconds, and every poster returns image/jpeg. There are zero MP4 requests before playback; no autoplay and no mobile horizontal overflow were observed. Browser evidence is in `test-results/zombie-demos-playback.json`; screenshots are `zombie-demo-gallery-desktop.png` and `zombie-demo-gallery-mobile.png` in test-results. Existing build-size/import/experimental-secret warnings remain unchanged.

This change does not deploy the site or resolve the existing production database/secrets/domain and real-generation acceptance requirements. The missing WeChat-media blocker is superseded by this explicit user-selected reference source.
