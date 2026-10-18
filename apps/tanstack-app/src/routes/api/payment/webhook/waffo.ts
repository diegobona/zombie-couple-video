import { createFileRoute } from '@tanstack/react-router'
import { withCfDb } from '@/lib/with-request-db'

export const Route = createFileRoute('/api/payment/webhook/waffo')({
  server: {
    handlers: {
      POST: withCfDb(async ({ request }) => {
        const body = await request.text()
        const signature = request.headers.get('x-waffo-signature')

        if (!signature) {
          return Response.json({ error: 'Missing webhook signature' }, { status: 400 })
        }

        try {
          const { createPaymentProvider } = await import('@libs/payment')
          const waffoProvider = createPaymentProvider('waffo')
          const verification = await waffoProvider.handleWebhook(body, signature)
          if (!verification.success) return Response.json({ error: 'Webhook verification failed' }, { status: 400 })
          return Response.json({ received: true })
        } catch (err) {
          console.error('Waffo webhook error:', err)
          return Response.json({ error: 'Webhook handler failed' }, { status: 400 })
        }
      }),
    },
  },
})
