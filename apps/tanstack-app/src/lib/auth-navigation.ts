import { useSearch } from '@tanstack/react-router'

/** Auth callbacks must stay on this site and cannot loop back into auth pages. */
export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value)) return '/'
  try {
    const url = new URL(value, 'https://return.invalid')
    if (url.origin !== 'https://return.invalid' || /^\/(signin|signup|forgot-password|reset-password|wechat|cellphone)(\/|$)/.test(url.pathname)) return '/'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/'
  }
}

export function validateAuthSearch(search: Record<string, unknown>): { returnTo?: string } {
  return search.returnTo === undefined ? {} : { returnTo: safeReturnTo(search.returnTo) }
}

export function useAuthReturnTo() {
  const search = useSearch({ strict: false }) as { returnTo?: string }
  return safeReturnTo(search.returnTo)
}
