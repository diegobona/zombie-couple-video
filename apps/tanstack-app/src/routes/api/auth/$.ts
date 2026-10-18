import { createFileRoute } from '@tanstack/react-router'
import { withCfDb } from '@/lib/with-request-db'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: withCfDb(async ({ request }) => {
        if (new URL(request.url).pathname.replace(/\/+$/, '') !== '/api/auth/get-session') {
          return Response.json({ error: 'accounts_disabled' }, { status: 404 })
        }
        const { auth } = await import('@libs/auth')
        return await auth.handler(request)
      }),
      POST: withCfDb(async ({ request }) => {
        if (new URL(request.url).pathname.replace(/\/+$/, '') !== '/api/auth/sign-in/anonymous') {
          return Response.json({ error: 'accounts_disabled' }, { status: 404 })
        }
        const { auth } = await import('@libs/auth')
        const { videoVisitor, visitorResponse, limitTrialIp, sameOriginMutation, trialErrorResponse } = await import('@/lib/video-visitor')
        const { trialKeys, ensureTrialScopes, getVideoTrial, inheritTrialUsage, VideoTrialError } = await import('@libs/ai/video-trial')
        if (!sameOriginMutation(request)) return Response.json({ error: 'invalid_origin' }, { status: 403 })
        const visitor = await videoVisitor(request)
        try {
          if (new URL(request.url).pathname.endsWith('/sign-in/anonymous')) {
            const existing = await auth.api.getSession({ headers: request.headers })
            const keys = trialKeys(visitor.id, existing?.user.id)
            await ensureTrialScopes(keys, existing?.user.id)
            const trial = await getVideoTrial(keys)
            if (trial.state !== 'available') throw new VideoTrialError(trial.state === 'used' ? 'trial_used' : 'trial_processing', trial.state === 'used' ? 403 : 409)
            await limitTrialIp(request, 'session')
          }
          const response = await auth.handler(request)
          if (response.ok && /\/(sign-in|sign-up)\//.test(new URL(request.url).pathname)) {
            const body = await response.clone().json().catch(() => null) as { user?: { id?: string } } | null
            if (body?.user?.id) {
              const keys = trialKeys(visitor.id, body.user.id)
              await ensureTrialScopes(keys, body.user.id)
              await inheritTrialUsage(keys)
            }
          }
          return visitorResponse(response, visitor.cookie)
        } catch (error) {
          if (error instanceof VideoTrialError) return visitorResponse(trialErrorResponse(error), visitor.cookie)
          throw error
        }
      }),
    },
  },
})
