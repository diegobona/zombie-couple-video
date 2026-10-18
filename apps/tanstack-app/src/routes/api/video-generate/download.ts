import { createFileRoute } from '@tanstack/react-router'
import { withCfDb } from '@/lib/with-request-db'
import { isAllowedAutoDlVideoUrl } from '@/lib/video-download'

const failure = (status: number, message: string) => Response.json(
  { error: 'download_failed', message },
  { status, headers: { 'Cache-Control': 'private, no-store' } },
)

export const Route = createFileRoute('/api/video-generate/download')({
  server: {
    handlers: {
      POST: withCfDb(async ({ request }) => {
        try {
          const { auth } = await import('@libs/auth')
          const session = await auth.api.getSession({ headers: new Headers(request.headers) })
          if (!session?.user?.id) return failure(401, 'Authentication required')

          let body: unknown
          try { body = await request.json() } catch { return failure(400, 'Invalid request') }
          const url = body && typeof body === 'object' && 'url' in body ? body.url : undefined
          if (!isAllowedAutoDlVideoUrl(url)) return failure(400, 'Invalid video URL')

          // The signed output URL grants access to the clip. Fetch only the known
          // provider output host, without browser credentials or redirects.
          const upstream = await fetch(url, {
            method: 'GET',
            // Workers supports manual redirects; the non-2xx check rejects 3xx.
            redirect: 'manual',
            signal: AbortSignal.timeout(60_000),
          })
          const contentType = upstream.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase()
          if (!upstream.ok || !upstream.body || !contentType ||
            (!contentType.startsWith('video/') && contentType !== 'application/octet-stream')) {
            await upstream.body?.cancel()
            return failure(502, 'The video could not be downloaded. Please try again.')
          }

          return new Response(upstream.body, {
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': 'attachment; filename="zombie-couple-video.mp4"',
              'Cache-Control': 'private, no-store',
              'X-Content-Type-Options': 'nosniff',
            },
          })
        } catch {
          return failure(502, 'The video could not be downloaded. Please try again.')
        }
      }),
    },
  },
})
