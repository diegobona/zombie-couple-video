import { config } from '@config';
import { StripeProvider } from './providers/stripe';
import { WechatPayProvider } from './providers/wechat';
import { CreemProvider } from './providers/creem';
import { AlipayProvider } from './providers/alipay';
import { PayPalProvider } from './providers/paypal';
import { DodoProvider } from './providers/dodo';
import { WaffoProvider } from './providers/waffo';
import { PaymentProvider } from './types';

export type PaymentProviderType = 'stripe' | 'wechat' | 'creem' | 'alipay' | 'paypal' | 'dodo' | 'waffo';

/**
 * Create payment provider instance
 * @param provider Payment provider type
 * @returns Payment provider instance
 */
export function createPaymentProvider<T extends PaymentProviderType>(
  provider: T
): T extends 'stripe' ? StripeProvider 
  : T extends 'wechat' ? WechatPayProvider 
  : T extends 'creem' ? CreemProvider 
  : T extends 'alipay' ? AlipayProvider 
  : T extends 'paypal' ? PayPalProvider
  : T extends 'dodo' ? DodoProvider
  : T extends 'waffo' ? WaffoProvider
  : never {
  switch (provider) {
    case 'stripe':
      return new StripeProvider() as any;
    case 'wechat':
      return new WechatPayProvider() as any;
    case 'creem':
      return new CreemProvider() as any;
    case 'alipay':
      return new AlipayProvider() as any;
    case 'paypal':
      return new PayPalProvider() as any;
    case 'dodo':
      return new DodoProvider() as any;
    case 'waffo':
      return new WaffoProvider() as any;
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}

// Export types and provider implementations for convenience
export * from './types';
export {
  claimOrderPaid,
  ensureCreditsForOrder,
  shouldFulfillNewEntitlements,
  parseOrderMetadata,
} from './fulfillment';
export { decideWaffoRecurringFulfillment } from './waffo-recurring';
export { StripeProvider, WechatPayProvider, CreemProvider, AlipayProvider, PayPalProvider, DodoProvider, WaffoProvider };
export type { CreemRedirectParams, ReturnUrlVerification } from './providers/creem'; 