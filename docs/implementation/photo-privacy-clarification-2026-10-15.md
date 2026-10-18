# Photo privacy clarification — 2026-10-15

Update: the owner subsequently confirmed an independently implemented automatic-deletion script and requested a concise statement without a specific deletion interval. Public upload copy, FAQ and policy now state that uploaded photos are automatically deleted from our storage. This relies on the owner's confirmation; the external script and its schedule were not inspected. No exact deadline or provider-side deletion is promised. The lifecycle observation below does not rule out an independent cleanup script and describes only the bucket rules at the time of inspection.

Update verification: TanStack typecheck/build passed, followed by 6/6 focused desktop/mobile E2E checks. Browser checks confirmed the automatic-deletion wording in the upload notice, FAQ and policy, the working retention anchor and no horizontal overflow at 1440px and 390px. Evidence: `test-results/zombie-auto-delete-copy.json` and `test-results/zombie-auto-delete-copy-e2e.log`.

User requested clearer reassurance after an external AI review flagged public Cloudflare R2 image URLs sent to AutoDL and missing automatic deletion. Verified the upload flow, browser previews, fixed public examples and existing removal behavior before editing copy.

Read-only Cloudflare API verification: GET `/accounts/c686d583b6d595875de1b8b73462fe42/r2/buckets/zombie-couple-video-uploads/lifecycle` returned HTTP 200. The only enabled rule was the default incomplete multipart upload abort rule (604800 seconds). There was no object-deletion lifecycle rule. Aborting an unfinished multipart upload is not deletion of successfully uploaded photos. No rules, existing objects or provider settings were changed.

Updated English and mirrored Chinese upload copy and FAQ explain:

- Selection/preview stays on the device; Generate video starts upload.
- Uploaded copies are used for the requested clip and do not automatically enter the fixed public example gallery.
- Processing links are public; anyone with a link can access the image.
- Uploaded photos are automatically deleted from our storage through the owner's independently implemented cleanup process. No deletion interval is stated. Removing a preview does not itself erase an uploaded copy.
- Deletion requests go to the confirmed support address with approximate generation time and any retained task/image reference; photos need not be reattached. Verification may be needed.
- Removal from our storage cannot recall downloads or guarantee removal from provider-retained systems.

The Privacy Policy now has an at-a-glance explanation and expanded retention/deletion instructions. The upload area's “Photo retention and deletion options” link goes directly to `/privacy-policy#photo-retention`. There is no invented 24-hour schedule, no “only you can access” claim, no unsupported statement about provider training or sale of data, and no legal compliance certification.

This copy change documents the owner's confirmation of existing automatic cleanup; it does not alter that external script, add private expiring links or add a self-service delete feature. Public-link access and provider retention remain described accurately.

Verification: TanStack typecheck/build and 24/24 desktop/mobile E2E passed. The upload-area link opens the correct retention anchor on both viewport sizes, the honest retention/deletion instructions are present, and there is no horizontal overflow. Evidence: `test-results/zombie-privacy-copy.json`. No photos were deleted and no storage rules changed.
