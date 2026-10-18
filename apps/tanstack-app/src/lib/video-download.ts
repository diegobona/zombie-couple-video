const AUTODL_VIDEO_HOST = 'cg-comfyui-prod.tos-cn-beijing.volces.com';
const OUTPUT_DIRECTORY = '/comfyui/outputs/';
const MAX_URL_LENGTH = 8192;

/** Restrict the download proxy to AutoDL's video outputs; preserve signed queries. */
export function isAllowedAutoDlVideoUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value || value.length > MAX_URL_LENGTH) return false;
  // URL() normalizes whitespace, backslashes and dot segments. Reject ambiguity
  // before parsing, so a differently encoded spelling cannot bypass the allowlist.
  if (/[\u0000-\u0020\u007f\\]/.test(value)) return false;
  const parts = /^https:\/\/([^/?#]+)(\/[^?#]*)(?:\?[^#]*)?$/i.exec(value);
  if (!parts) return false;
  const authority = parts[1].toLowerCase();
  if (authority !== AUTODL_VIDEO_HOST && authority !== `${AUTODL_VIDEO_HOST}:443`) return false;
  const pathname = parts[2];
  if (
    !pathname.startsWith(OUTPUT_DIRECTORY)
    || !pathname.endsWith('.mp4')
    || pathname.length <= OUTPUT_DIRECTORY.length + 4
    || pathname.includes('%')
    || pathname.includes('//')
  ) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.hostname === AUTODL_VIDEO_HOST
      && (url.port === '' || url.port === '443')
      && !url.username && !url.password && !url.hash
      && url.pathname === pathname;
  } catch {
    return false;
  }
}
