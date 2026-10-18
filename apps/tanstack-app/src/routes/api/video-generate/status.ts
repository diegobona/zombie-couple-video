import { createFileRoute } from '@tanstack/react-router'
import { withCfDb } from '@/lib/with-request-db'

export const Route = createFileRoute('/api/video-generate/status')({
  server: {
    handlers: {
      GET: withCfDb(async ({ request }) => {
        try {
          const { auth } = await import('@libs/auth')
          const { refreshVideoTask } = await import('@libs/ai/video-task-status')
          const { creditService } = await import('@libs/credits')
          const session = await auth.api.getSession({ headers: new Headers(request.headers) })
          const userId = session?.user?.id
          if (!userId) return Response.json({ error: 'unauthorized', message: 'Authentication required' }, { status: 401 })
          const taskId = new URL(request.url).searchParams.get('taskId')
          if (!taskId) return Response.json({ error: 'invalid_request', message: 'taskId is required' }, { status: 400 })

          const task = await refreshVideoTask(taskId, userId)
          if (!task) return Response.json({ error: 'not_found', message: 'Task not found' }, { status: 404 })
          if (task.status === 'succeeded' || (task.status === 'failed' && (task.refunded || task.creditCost === 0))) {
            const { finishVideoTrial } = await import('@libs/ai/video-trial')
            await finishVideoTrial(taskId, task.status)
          }
          return Response.json({
            success: true,
            data: { taskId, status: task.status, result: task.result, error: task.errorMessage },
            ...(task.status !== 'processing' ? { credits: { remaining: await creditService.getBalance(userId) } } : {}),
          }, { headers: { 'Cache-Control': 'private, no-store' } })
        } catch (error) {
          console.error('Video status API error:', error)
          return Response.json({ error: 'status_query_failed', message: 'Could not check the video yet. Please try again.' }, { status: 500 })
        }
      }),
    },
  },
})
