'use client';

import { config } from '@config';
import { useTranslation } from "@/hooks/use-translation";
import type { Plan } from '@config';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { authClientReact } from "@libs/auth/authClient";
import QRCode from 'qrcode';
import { motion } from "framer-motion";
import {
  Check,
  ArrowRight,
  Loader2,
  Coins,
  CreditCard
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@libs/react-shared/ui/dialog";
import { Steps, Step } from "@libs/react-shared/ui/steps";
import { Button } from "@libs/react-shared/ui/button";
import { cn } from "@/lib/utils";

type PricingTab = 'subscription' | 'credits';

/**
 * Presentation labels for payment providers come from the shared i18n
 * catalogs (pricing.providers); unknown providers fall back to the
 * capitalized key so newly configured providers still render.
 */
function providerLabel(provider: string, labels: Record<string, string>): string {
  return labels[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
}

export default function PricingPage() {
  const { t, locale: currentLocale } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [dynamicPlans, setDynamicPlans] = useState<Plan[] | null>(null);

  const { data: session, isPending } = authClientReact.useSession();
  const user = session?.user;
  const [activeTab, setActiveTab] = useState<PricingTab>('subscription');

  useEffect(() => {
    fetch('/api/pricing/plans?locale=' + currentLocale)
      .then(res => res.json())
      .then(data => setDynamicPlans(data.plans || []))
      .catch(() => setDynamicPlans(null));
  }, [currentLocale]);

  const allPlans = useMemo(() => {
    if (dynamicPlans !== null) {
      return dynamicPlans;
    }
    return Object.values(config.payment.plans) as unknown as Plan[];
  }, [dynamicPlans]);

  // Filter plans based on active tab
  const { subscriptionPlans, creditPlans } = useMemo(() => {
    const subscription: Plan[] = [];
    const credits: Plan[] = [];

    allPlans.forEach(plan => {
      if ((plan as any).duration?.type === 'credits') {
        credits.push(plan);
      } else {
        subscription.push(plan);
      }
    });

    return { subscriptionPlans: subscription, creditPlans: credits };
  }, [allPlans]);

  const tabPlans = activeTab === 'subscription' ? subscriptionPlans : creditPlans;

  /** Providers present in the current plan catalog, in order of first appearance. */
  const providers = useMemo(() => {
    const seen: string[] = [];
    allPlans.forEach((plan) => {
      const provider = plan.provider || 'stripe';
      if (!seen.includes(provider)) seen.push(provider);
    });
    return seen;
  }, [allPlans]);

  const [activeProvider, setActiveProvider] = useState<string>('all');

  // Focus the recommended plan's provider once the catalog loads.
  useEffect(() => {
    const recommended = allPlans.find((plan) => plan.recommended);
    if (recommended?.provider) {
      setActiveProvider(recommended.provider);
    }
  }, [allPlans]);

  const plans = useMemo(() => {
    if (activeProvider === 'all') return tabPlans;
    return tabPlans.filter((plan) => (plan.provider || 'stripe') === activeProvider);
  }, [tabPlans, activeProvider]);

  // 清理轮询定时器
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const startPolling = (orderId: string) => {
    // 先清除可能存在的轮询
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payment/query?orderId=${orderId}&provider=wechat`);
        const data = await response.json();

        if (data.status === 'paid') {
          clearInterval(interval);
          setPollingInterval(null);
          router.push(`/${currentLocale}/payment-success?provider=wechat`);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setPollingInterval(null);
          toast.error(t.payment.result.failed);
          closeQrCodeModal();
        }
      } catch (error) {
        console.error('Payment polling error:', error);
      }
    }, 3000); // 每3秒查询一次

    setPollingInterval(interval);
  };

  const handleSubscribe = async (plan: Plan) => {
    try {
      if (!user) {
        const returnPath = encodeURIComponent(pathname);
        router.push(`/${currentLocale}/signin?returnTo=${returnPath}`);
        return;
      }

      setLoading(plan.id);
      const provider = plan.provider || 'stripe';
      setCurrentPlan(plan);

      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          provider
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      if (provider === 'wechat') {
        if (data.paymentUrl) {
          try {
            const qrDataUrl = await QRCode.toDataURL(data.paymentUrl);
            setQrCodeUrl(qrDataUrl);
            setOrderId(data.providerOrderId);
            setCurrentStep(1);
            startPolling(data.providerOrderId);
          } catch (err) {
            console.error('QR code generation error:', err);
            toast.error(t.common.unexpectedError);
          }
        }
      } else {
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(t.common.unexpectedError);
    } finally {
      setLoading(null);
    }
  };

  const closeQrCodeModal = () => {
    // 如果当前正在处理支付，提示用户确认是否取消
    if (currentStep < 2 && orderId) { // 还未完成支付且有订单ID
      const confirmCancel = window.confirm(t.payment.confirmCancel);
      if (!confirmCancel) {
        return; // 用户取消关闭，继续支付流程
      }

      // 调用关闭订单API
      fetch(`/api/payment/cancel?orderId=${orderId}&provider=wechat`, {
        method: 'POST'
      }).then(response => {
        if (response.ok) {
          toast.info(t.payment.orderCanceled);
        } else {
          console.error('Failed to cancel order');
          toast.error(t.common.unexpectedError);
        }
      }).catch(error => {
        console.error('Cancel order error:', error);
        toast.error(t.common.unexpectedError);
      });
    }

    setQrCodeUrl(null);
    setCurrentPlan(null);
    setCurrentStep(0);
    setOrderId(null);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const steps: Step[] = [
    { title: t.payment.steps.initiate, description: t.payment.steps.initiateDesc },
    { title: t.payment.steps.scan, description: t.payment.steps.scanDesc },
    { title: t.payment.steps.pay, description: t.payment.steps.payDesc },
  ];

  const providerLabels = t.pricing.providers as Record<string, string>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header — left aligned, plain type */}
      <section className="border-b border-border">
        <div className="container px-4 md:px-6 py-20 md:py-28">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground text-balance">
              {t.pricing.subtitle}
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              {t.pricing.description}
            </p>
            <p className="mt-6 font-mono text-sm text-muted-foreground">
              {Object.keys(config.payment.providers)
                .map((provider) => providerLabel(provider, providerLabels))
                .join(' · ')}
            </p>
            <a
              href="https://docs.tinyship.cn/zh-CN/user-guide/payment"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-chart-1 hover:underline underline-offset-4"
            >
              {t.pricing.docsLink}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="border-b border-border">
        <div className="container px-4 md:px-6 py-16 md:py-24">
          {/* Tab Switcher */}
          {creditPlans.length > 0 && (
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="inline-flex border border-border">
                <button
                  data-pricing-tab="subscription"
                  onClick={() => setActiveTab('subscription')}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors',
                    activeTab === 'subscription'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <CreditCard className="h-4 w-4" />
                  {t.pricing.tabs?.subscription || (currentLocale === 'zh-CN' ? '订阅套餐' : 'Subscription')}
                </button>
                <button
                  data-pricing-tab="credits"
                  onClick={() => setActiveTab('credits')}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-l border-border transition-colors',
                    activeTab === 'credits'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Coins className="h-4 w-4" />
                  {t.pricing.tabs?.credits || (currentLocale === 'zh-CN' ? '积分充值' : 'Credits')}
                </button>
              </div>
            </motion.div>
          )}

          {/* Provider filter — only shown when multiple providers are configured */}
          {providers.length > 1 && (
            <motion.div
              className="flex flex-wrap gap-x-6 gap-y-2 mb-10 font-mono text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              {['all', ...providers].map((provider) => (
                <button
                  key={provider}
                  data-provider-filter={provider}
                  onClick={() => setActiveProvider(provider)}
                  className={cn(
                    'pb-1 border-b-2 transition-colors',
                    activeProvider === provider
                      ? 'border-chart-1 text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  {provider === 'all'
                    ? t.pricing.allProviders
                    : providerLabel(provider, providerLabels)}
                </button>
              ))}
            </motion.div>
          )}

          {plans.length === 0 && (
            <p className="py-16 text-center text-muted-foreground">{t.pricing.noPlans}</p>
          )}

          <div
            className={cn(
              'grid gap-5 items-stretch',
              plans.length === 1
                ? 'grid-cols-1 max-w-md'
                : plans.length === 2
                  ? 'grid-cols-1 md:grid-cols-2 max-w-3xl'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            )}
          >
            {plans.map((plan, index) => {
              const i18n = plan.i18n && typeof plan.i18n === 'object' ? plan.i18n[currentLocale] : undefined;
              const isRecommended = plan.recommended;
              const isLifetime = plan.id === 'lifetime';
              const isCreditPack = plan.duration?.type === 'credits';

              const features = i18n?.features || [];

              return (
                <motion.div
                  key={plan.id}
                  data-plan-id={plan.id}
                  data-plan-provider={plan.provider || 'stripe'}
                  className={cn(
                    'relative border bg-background p-7 flex flex-col transition-colors',
                    isRecommended
                      ? 'border-chart-1 border-2'
                      : 'border-border hover:border-foreground/25'
                  )}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  viewport={{ once: true }}
                >
                  {isRecommended && (
                    <span className="absolute -top-px right-6 bg-chart-1 text-white px-2.5 py-1 text-xs font-medium">
                      {t.pricing.recommendedBadge}
                    </span>
                  )}

                  {/* Plan header — fixed rhythm so prices align across cards */}
                  <div className="min-h-14">
                    <h3 className="text-lg font-semibold text-foreground">
                      {i18n?.name || 'Plan'}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                      {i18n?.description || ''}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mt-5 border-y border-border py-5 flex items-baseline gap-2">
                    {(plan as any).originalPrice && (
                      <span className="font-mono text-base line-through text-muted-foreground tabular-nums">
                        {plan.currency === 'CNY' ? '¥' : '$'}
                        {(plan as any).originalPrice}
                      </span>
                    )}
                    <span className="font-mono text-4xl font-semibold text-foreground tabular-nums">
                      {plan.currency === 'CNY' ? '¥' : '$'}
                      {plan.amount}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{i18n?.duration || ''}
                    </span>
                  </div>

                  {isCreditPack && (
                    <p className="mt-3 font-mono text-xs uppercase tracking-wider text-chart-1">
                      {t.pricing.creditsBadge || 'Credits'}
                    </p>
                  )}

                  {/* Features */}
                  <ul className="mt-6 space-y-3 flex-1">
                    {features.map((feature: string) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 shrink-0 mt-0.5 text-chart-1" />
                        <span className="text-sm text-foreground leading-6">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA — pinned to bottom across cards */}
                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading === plan.id || isPending}
                    variant={isRecommended ? 'default' : 'outline'}
                    className="mt-8 w-full"
                  >
                    {loading === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t.common.loading}</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>{t.pricing.cta}</span>
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                  {isLifetime && (
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      {t.pricing.lifetimeBadge}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      <Dialog open={!!qrCodeUrl} onOpenChange={(open) => !open && closeQrCodeModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {currentPlan && (
                <span>
                  {currentPlan.currency === 'CNY' ? '¥' : '$'}{currentPlan.amount} -
                  {currentPlan.i18n?.[currentLocale]?.name || 'Plan'}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6">
            <Steps steps={steps} currentStep={currentStep} />
            {qrCodeUrl && (
              <div className="flex flex-col items-center space-y-4">
                <img
                  src={qrCodeUrl}
                  alt="WeChat Pay QR Code"
                  className="w-64 h-64"
                />
                <p className="text-sm text-muted-foreground">
                  {t.payment.scanQrCode}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
