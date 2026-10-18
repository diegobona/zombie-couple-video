'use client';

import { useTranslation } from "@/hooks/use-translation";
import { User, Sparkles, FileText, BarChart, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function PremiumFeaturesPage() {
  const { t, locale } = useTranslation();
  const [userData, setUserData] = useState<{
    subscriptionActive: boolean;
    subscriptionType: string;
    isLifetime: boolean;
    expiresAt?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscriptionDetails() {
      try {
        const response = await fetch('/api/subscription/status');
        if (response.ok) {
          const data = await response.json();
          setUserData({
            subscriptionActive: data.hasSubscription,
            subscriptionType: data.isLifetime ? 'lifetime' : 'recurring',
            isLifetime: data.isLifetime,
            expiresAt: data.subscription?.periodEnd
          });
        }
      } catch (error) {
        console.error('Failed to fetch subscription details', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscriptionDetails();
  }, []);

  // Premium features list using translations
  const premiumFeatures = [
    { icon: User, title: t.premiumFeatures.features.userManagement.title, description: t.premiumFeatures.features.userManagement.description },
    { icon: Sparkles, title: t.premiumFeatures.features.aiAssistant.title, description: t.premiumFeatures.features.aiAssistant.description },
    { icon: FileText, title: t.premiumFeatures.features.documentProcessing.title, description: t.premiumFeatures.features.documentProcessing.description },
    { icon: BarChart, title: t.premiumFeatures.features.dataAnalytics.title, description: t.premiumFeatures.features.dataAnalytics.description },
  ];

  // Format date based on current locale
  const formatDate = (dateString: string) => {
    const localeCode = locale === 'zh-CN' ? 'zh-CN' : 'en-US';
    return new Date(dateString).toLocaleDateString(localeCode);
  };

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="text-primary h-10 w-10 animate-spin" />
          <span className="text-muted-foreground ml-2">{t.premiumFeatures.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 md:px-6 py-16 md:py-20">
      {/* Header */}
      <div className="max-w-2xl">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {t.premiumFeatures.title}
          </h1>
          {userData?.isLifetime && (
            <span className="bg-chart-1 text-white px-2.5 py-1 text-xs font-medium">
              {t.premiumFeatures.badges.lifetime}
            </span>
          )}
        </div>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          {t.premiumFeatures.description}
        </p>
        <div className="mt-6 border-l-2 border-chart-1 bg-muted/40 px-4 py-3">
          <p className="text-foreground text-sm font-medium">{t.premiumFeatures.demoNotice.title}</p>
          <p className="mt-1 text-muted-foreground text-sm">{t.premiumFeatures.demoNotice.description}</p>
        </div>
      </div>

      {/* Subscription status — flat ruled panel, mono values */}
      {userData && (
        <div className="mt-10 border border-border">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground">{t.premiumFeatures.subscription.title}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t.premiumFeatures.subscription.description}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3">
            <div className="px-6 py-5">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {t.premiumFeatures.subscription.status}
              </p>
              <p className="mt-2 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${userData.subscriptionActive ? 'bg-chart-1' : 'bg-destructive'}`} />
                <span className={`text-sm font-semibold ${userData.subscriptionActive ? 'text-chart-1' : 'text-destructive'}`}>
                  {userData.subscriptionActive ? t.premiumFeatures.subscription.active : t.premiumFeatures.subscription.inactive}
                </span>
              </p>
            </div>
            <div className="px-6 py-5 max-sm:border-t sm:border-l border-border">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {t.premiumFeatures.subscription.type}
              </p>
              <p className="mt-2 font-mono text-lg font-semibold text-foreground">
                {userData.subscriptionType === 'lifetime' ? t.premiumFeatures.subscription.lifetime : t.premiumFeatures.subscription.recurring}
              </p>
            </div>
            {userData.expiresAt && userData.subscriptionType !== 'lifetime' && (
              <div className="px-6 py-5 max-sm:border-t sm:border-l border-border">
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {t.premiumFeatures.subscription.expiresAt}
                </p>
                <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
                  {formatDate(userData.expiresAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feature cards — border only, no dead buttons */}
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {premiumFeatures.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="border border-border p-7 transition-colors hover:border-foreground/25"
            >
              <Icon className="h-6 w-6 text-chart-1" />
              <h3 className="mt-4 font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
