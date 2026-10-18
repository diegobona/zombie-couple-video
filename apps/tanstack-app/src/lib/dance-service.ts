import { createServerFn } from '@tanstack/react-start'

/** Public readiness only. Provider credentials and storage secrets stay server-side. */
export const getDanceServiceState = createServerFn({ method: 'GET' }).handler(async () => {
  const { isAutodlVideoConfigured } = await import('@libs/ai/autodl-video')
  let publicUrl = process.env.R2_PUBLIC_URL || ''
  let hasBucket = false
  try {
    const { env } = await import('cloudflare:workers')
    publicUrl = String((env as Record<string, unknown>).R2_PUBLIC_URL || publicUrl)
    hasBucket = Boolean((env as Record<string, unknown>).R2_BUCKET)
  } catch {
    hasBucket = Boolean(process.env.R2_BUCKET && !process.env.R2_BUCKET.startsWith('your-'))
  }
  let publicStorage = false
  try {
    const url = new URL(publicUrl)
    publicStorage = url.protocol === 'https:' && url.hostname !== 'example.com' && !url.hostname.endsWith('.example.com')
  } catch { /* An unconfigured address keeps live generation unavailable. */ }
  return { isAvailable: isAutodlVideoConfigured() && hasBucket && publicStorage }
})
