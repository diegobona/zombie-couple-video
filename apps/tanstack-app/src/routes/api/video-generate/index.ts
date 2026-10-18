import { createFileRoute } from '@tanstack/react-router'
import { withCfDb } from '@/lib/with-request-db'
import type { VideoProviderName, VideoGenerationOptions } from '@libs/ai'
import { config } from '@config'
import { attachTrialTask, completeImmediateTrial, ensureTrialScopes, getVideoTrial, inheritTrialUsage, releaseVideoTrial, reserveVideoTrial, trialKeys, VideoTrialError } from '@libs/ai/video-trial'
import { limitTrialIp, readVideoVisitor, sameOriginMutation, trialErrorResponse, videoVisitor, visitorResponse } from '@/lib/video-visitor'

export const Route = createFileRoute('/api/video-generate/')({
  server: {
    handlers: {
      GET: withCfDb(async ({ request }) => {
        const { auth } = await import('@libs/auth')
        const session = await auth.api.getSession({ headers: request.headers })
        const visitor = await videoVisitor(request)
        const keys = trialKeys(visitor.id, session?.user.id)
        await ensureTrialScopes(keys, session?.user.id)
        await inheritTrialUsage(keys)
        const trial = await getVideoTrial(keys)
        let taskId: string | null = null
        if (session?.user.id && trial.taskId) {
          const { getVideoTaskRecord } = await import('@libs/ai/video-task-store')
          if (await getVideoTaskRecord(trial.taskId, session.user.id)) taskId = trial.taskId
        }
        return visitorResponse(Response.json({ success: true, data: { state: trial.state, taskId, storageKey: visitor.id } }), visitor.cookie)
      }),
      POST: withCfDb(async ({ request }) => {
        let reservationId: string | undefined
        let taskStored = false
        try {
          if (!sameOriginMutation(request)) return Response.json({ error: 'invalid_origin' }, { status: 403 })
          const { auth } = await import('@libs/auth')
          const { generateVideoResponse, createVideoTask, calculateVideoCreditCost, validateVideoGenerationOptions } = await import('@libs/ai')
          const { createVideoTaskRecord } = await import('@libs/ai/video-task-store')
          const { creditService, TransactionTypeCode } = await import('@libs/credits')

          const session = await auth.api.getSession({ headers: new Headers(request.headers) })
          const userId = session?.user?.id
          if (!userId) {
            return new Response(
              JSON.stringify({ error: 'unauthorized', message: 'Authentication required' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const visitorId = await readVideoVisitor(request)
          if (!visitorId) return Response.json({ error: 'visitor_required' }, { status: 400 })
          const body: unknown = await request.json()
          if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return Response.json({ error: 'invalid_video_request' }, { status: 400 })
          }
          let input = body as Record<string, unknown>
          if (input.storyTemplate !== 'zombie-couple-v1') return Response.json({ error: 'invalid_video_request' }, { status: 400 })
          if ('storyTemplate' in input) {
            try {
              const { createZombieVideoOptions } = await import('@libs/ai/zombie-video')
              let publicUrl = process.env.R2_PUBLIC_URL || ''
              try {
                const { env } = await import('cloudflare:workers')
                publicUrl = String((env as Record<string, unknown>).R2_PUBLIC_URL || publicUrl)
              } catch { /* Node deployment reads the existing environment variable. */ }
              const uploadPrefix = new URL(`uploads/${userId}/`, publicUrl.replace(/\/?$/, '/')).href
              if (![input.survivorImageUrl, input.partnerImageUrl].every(value => typeof value === 'string' && value.startsWith(uploadPrefix))) throw new Error('Use photos uploaded in your own session')
              input = { ...createZombieVideoOptions(input) }
            } catch (error) {
              return Response.json({ error: 'invalid_video_request', message: error instanceof Error ? error.message : 'Invalid story request' }, { status: 400 })
            }
          }
          const {
            prompt,
            provider = config.aiVideo.defaultProvider,
            model, size, aspectRatio, duration, seed,
            loop, motionStrength, promptExtend, watermark,
            firstFrameUrl, lastFrameUrl, referenceImageUrls,
          } = input as Partial<VideoGenerationOptions>

          if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return new Response(
              JSON.stringify({ error: 'invalid_prompt', message: 'Prompt is required' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const options: VideoGenerationOptions = {
            prompt: prompt.trim(), provider: provider as VideoProviderName,
            model, size, aspectRatio, duration, seed,
            loop, motionStrength, promptExtend, watermark,
            firstFrameUrl, lastFrameUrl, referenceImageUrls,
          }

          // Reject incomplete AutoDL setup or invalid requests before charging credits.
          try {
            validateVideoGenerationOptions(options)
          } catch (validationError) {
            return new Response(
              JSON.stringify({ error: 'invalid_video_request', message: validationError instanceof Error ? validationError.message : 'Invalid video request' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
          }

          await limitTrialIp(request, 'generate')
          reservationId = await reserveVideoTrial(trialKeys(visitorId, userId), userId)
          const creditBalance = await creditService.getBalance(userId)
          const creditCost = calculateVideoCreditCost({ provider, model })

          if (creditBalance < creditCost) {
            await releaseVideoTrial(reservationId)
            return new Response(
              JSON.stringify({ error: 'insufficient_credits', message: 'Not enough credits for video generation.', required: creditCost, balance: creditBalance }),
              { status: 402, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const consumeResult = await creditService.consumeCredits({
            userId, amount: creditCost,
            description: TransactionTypeCode.AI_VIDEO_GENERATION,
            metadata: { provider, model, prompt: prompt.trim().substring(0, 100) },
          })

          if (!consumeResult.success) {
            await releaseVideoTrial(reservationId)
            return new Response(
              JSON.stringify({ error: 'credit_consumption_failed', message: consumeResult.error || 'Failed to consume credits.', required: creditCost, balance: consumeResult.newBalance }),
              { status: 402, headers: { 'Content-Type': 'application/json' } }
            )
          }

          if (options.provider !== 'fal') {
            try {
              const asyncTask = await createVideoTask(options)
              const task = await createVideoTaskRecord({
                userId, provider: asyncTask.provider, model: asyncTask.model,
                providerTaskId: asyncTask.providerTaskId,
                creditCost, consumeTransactionId: consumeResult.transactionId,
              })
              taskStored = true
              await attachTrialTask(reservationId, task.id)
              return new Response(
                JSON.stringify({ success: true, data: { taskId: task.id, status: 'processing', async: true, provider: task.provider, model: task.model }, credits: { consumed: creditCost, remaining: consumeResult.newBalance } }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
              )
            } catch (taskError) {
              if (taskStored) throw taskError
              try {
                await creditService.addCredits({ userId, amount: creditCost, type: 'refund', description: 'Refund for failed video task creation', metadata: { originalTransactionId: consumeResult.transactionId, provider, model, error: taskError instanceof Error ? taskError.message : 'Unknown error' } })
              } catch (refundError) {
                console.error('CRITICAL: Failed to refund credits after task creation failure:', { userId, amount: creditCost, originalTransactionId: consumeResult.transactionId, refundError })
              }
              throw taskError
            }
          }

          let result
          try {
            result = await generateVideoResponse(options)
          } catch (generationError) {
            console.error('Video generation failed, refunding credits:', generationError)
            try {
              await creditService.addCredits({ userId, amount: creditCost, type: 'refund', description: 'Refund for failed video generation', metadata: { originalTransactionId: consumeResult.transactionId, provider, model, error: generationError instanceof Error ? generationError.message : 'Unknown error' } })
            } catch (refundError) {
              console.error('CRITICAL: Failed to refund credits after generation failure:', { userId, amount: creditCost, originalTransactionId: consumeResult.transactionId, refundError })
            }
            throw generationError
          }

          await completeImmediateTrial(reservationId)
          return new Response(
            JSON.stringify({ success: true, data: result, credits: { consumed: creditCost, remaining: consumeResult.newBalance } }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          if (reservationId && !taskStored) await releaseVideoTrial(reservationId)
          if (error instanceof VideoTrialError) return trialErrorResponse(error)
          console.error('Video generation API error:', error)
          return new Response(
            JSON.stringify({ error: 'generation_failed', message: error instanceof Error ? error.message : 'Unknown error occurred' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }),
    },
  },
})
