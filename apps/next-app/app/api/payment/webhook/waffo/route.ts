import { NextResponse } from 'next/server';
import { createPaymentProvider } from '@libs/payment';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('x-waffo-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
  }

  try {
    const waffoProvider = createPaymentProvider('waffo');
    const verification = await waffoProvider.handleWebhook(body, signature);

    if (!verification.success) {
      return NextResponse.json(
        { error: 'Webhook verification failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Waffo webhook error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
