import { createPaymentProvider } from '@libs/payment'

export default defineEventHandler(async (event) => {
  try {
    const body = await readRawBody(event, 'utf8')
    const signature = getHeader(event, 'x-waffo-signature')

    if (!signature) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing webhook signature'
      })
    }

    const waffoProvider = createPaymentProvider('waffo')
    const verification = await waffoProvider.handleWebhook(body || '', signature)

    if (!verification.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Webhook verification failed'
      })
    }

    return { received: true }
  } catch (error: any) {
    console.error('Waffo webhook error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 400,
      statusMessage: 'Webhook handler failed'
    })
  }
})
