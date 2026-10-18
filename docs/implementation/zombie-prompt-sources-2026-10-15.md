# Prompt sources and supplied demonstrations

Update: the owner replaced the missing WeChat media with permission to download three examples from the competitor's template section. Those references are now prepared and enabled; see [reference demos](reference-demos-2026-10-15.md). The missing-media notes below document the earlier state and no longer block the gallery.

## Sources checked on 2026-10-15

- [MiniMax official H3 model card](https://huggingface.co/MiniMaxAI/MiniMax-H3): distinguishes frame-conditioned and reference-conditioned tasks. This product passes two character reference photos, not video templates.
- [MiniMax official reference prompt guide](https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/docs/VIDEO_PROMPT_WRITING_GUIDE_ref_en.md): consistent reference roles, subject continuity, shot-by-shot action and separate sound direction.
- [MiniMax official base prompt guide](https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/docs/VIDEO_PROMPT_WRITING_GUIDE_base_en.md): explicit composition, visible action and deliberate camera motion.
- [Competitor's zombie hug explanation](https://zombiecouplevideo.com/ai-zombie-hug): supports the human-survivor/recognizable-zombie-partner reunion concept. It is a product reference, not independent evidence of generation quality.

The five new prompts are original adaptations of these model-specific principles for two uploaded portraits and a 10-second clip. They are not copied commercial templates, and no source certifies their output on this site's AutoDL workflow. Avoid claiming “tested”, “guaranteed” or a success percentage without actual render evidence. Keeping one scene, readable faces and one slow gesture is an engineering choice intended to reduce simultaneous changes, not proof of better results. We do not substitute the official rewriter's complete schema for the provider's existing prompt string API.

## Eight editable stories

1. Quiet Embrace — default; ruined street, one gentle side embrace.
2. Shelter Reunion — doorway, recognition and a held shoulder lean.
3. Sunset Promise — rooftop, a small turn and quiet companionship.
4. Lantern Reunion — cabin, stationary lantern and a side embrace.
5. Forehead Promise — station canopy, one slow approach; inspect face contact.
6. Ruins Reunion — retained summer-memory variant.
7. Rainy Reunion — retained seaside-memory variant.
8. Snowbound Reunion — retained fireplace-memory variant.

All are editable and below 500 characters. Shared server instructions preserve the two reference roles, constrain identity swaps and request a continuous scene unless the story explicitly asks for a memory cut. The last three have additional location/appearance changes and remain more demanding. Face consistency, hand contact and quality require actual visual acceptance; this step does not run paid renders.

## Owner-provided videos

Initially ffprobe could read both files:

| Source filename | Duration | Video | Size |
|---|---|---|---|
| 5daea99ade1569461e557808aaa7c1bf.mp4 | 15.046531 s | H.264, 854×480 | 905,935 bytes |
| 586c59c9889d3d914ae7fb978797dc9a.mp4 | 24.086956 s | HEVC, 1280×720 | 1,238,640 bytes |

Both have AAC audio. Before copying or extracting review frames, both original WeChat paths became unavailable; neither file nor a same-hash attachment copy could be found in the checked locations. They have not been viewed, copied, transcoded, published or tested for playback. Do not infer their content or claim this service created them. Demo URLs remain empty so the site never requests nonexistent videos.

Restore the actual supplied files to a stable folder, then run:

```powershell
node scripts/prepare-zombie-demos.mjs "D:/path/to/first.mp4" "D:/path/to/second.mp4"
```

This preserves the originals and prepares H.264/AAC MP4s with faststart and JPEG posters in the app's public assets. It enables both URLs only after successful preparation. The gallery retains native controls, plays inline, does not autoplay and uses preload=none. Its caption distinguishes the supplied examples' durations/editing/audio from the site's 10-second setting. Rebuild, inspect the two actual clips and verify playback and seek on desktop/mobile after restoration. No new AI video is generated.

## Verification in this step

- TanStack typecheck and Cloudflare production build passed.
- 12/12 unit tests passed, validating all eight IDs, English/Chinese prompts, explanations, 500-character limits, edited text and ordered references.
- 22/22 desktop/mobile E2E passed; every story selection fills its expected editable text. No overflow at 390 or 1440 px.
- The media preparation script passes Node syntax checking and refuses both missing source paths before changing configuration. Transcoding, poster selection and actual gallery playback are still unverified because the source media is unavailable.
- Existing CSS is unchanged. Deployment and paid rendering were not performed. Production-readiness blockers in the visitor review still apply.
