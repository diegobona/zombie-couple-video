// Public SEO URLs stay on the owned domain, including in local previews.
export const SITE_ORIGIN = (import.meta.env.VITE_SITE_URL || 'https://zombie-couple-video.net').replace(/\/+$/, '')
export const SITE_NAME = 'Zombie Couple Video'
export function normalizePath(input: string): string {
  const value = input.trim() || '/'
  const pathname = /^https?:\/\//i.test(value) ? new URL(value).pathname : value.startsWith('//') ? new URL('https:' + value).pathname : value.split(/[?#]/, 1)[0]
  const clean = ('/' + pathname.replace(/\\/g, '/').replace(/^\/+/, '')).replace(/\/{2,}/g, '/')
  const resolved = new URL(clean, SITE_ORIGIN).pathname
  return resolved === '/' ? '/' : resolved.replace(/\/+$/, '')
}
export function normalizeCanonical(input: string): string { return SITE_ORIGIN + normalizePath(input) }
export function isResourcePath(input: string): boolean {
  return /^\/(?:api|auth|oauth|callback|signin|sign-in|signup|sign-up|login|logout|forgot-password|reset-password|verify-email|cellphone|wechat|payment|payment-success|payment-cancel|checkout|pricing|privacy-policy|terms-of-service|dashboard|admin|account|settings|profile|billing|subscription|credits|upload|404|not-found|_server|_serverfn)(?:\/|$)/.test(normalizePath(input).toLowerCase()) || ['/robots.txt', '/sitemap.xml'].includes(normalizePath(input))
}
export function robotsText(): string { return 'User-agent: *\nAllow: /\nSitemap: ' + SITE_ORIGIN + '/sitemap.xml\n' }
