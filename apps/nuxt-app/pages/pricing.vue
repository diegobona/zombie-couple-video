<template>
  <div>
    <!-- SEO Head -->
    <Head>
      <title>{{ t('pricing.metadata.title') }}</title>
      <meta name="description" :content="t('pricing.metadata.description')" />
      <meta name="keywords" :content="t('pricing.metadata.keywords')" />
    </Head>

    <div class="min-h-screen bg-background">
      <!-- Header — left aligned, plain type -->
      <section class="border-b border-border">
        <div class="container px-4 md:px-6 py-20 md:py-28">
          <motion.div
            class="max-w-2xl"
            :initial="{ opacity: 0, y: 16 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.5 }"
          >
            <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground text-balance">
              {{ t('pricing.subtitle') }}
            </h1>
            <p class="mt-5 text-lg text-muted-foreground leading-relaxed">
              {{ t('pricing.description') }}
            </p>
            <p class="mt-6 font-mono text-sm text-muted-foreground">
              {{ configuredProviders.map((provider) => providerLabel(provider, providerLabels)).join(' · ') }}
            </p>
            <a
              href="https://docs.tinyship.cn/zh-CN/user-guide/payment"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-chart-1 hover:underline underline-offset-4"
            >
              {{ t('pricing.docsLink') }}
              <ArrowRight class="h-3.5 w-3.5" />
            </a>
          </motion.div>
        </div>
      </section>

      <!-- Plans -->
      <section class="border-b border-border">
        <div class="container px-4 md:px-6 py-16 md:py-24">
          <!-- Tab Switcher -->
          <motion.div
            v-if="creditPlans.length > 0"
            class="mb-12"
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4 }"
          >
            <div class="inline-flex border border-border">
              <button
                data-pricing-tab="subscription"
                @click="activeTab = 'subscription'"
                :class="cn(
                  'flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors',
                  activeTab === 'subscription'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )"
              >
                <CreditCard class="h-4 w-4" />
                {{ t('pricing.tabs.subscription') || (locale === 'zh-CN' ? '订阅套餐' : 'Subscription') }}
              </button>
              <button
                data-pricing-tab="credits"
                @click="activeTab = 'credits'"
                :class="cn(
                  'flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-l border-border transition-colors',
                  activeTab === 'credits'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )"
              >
                <Coins class="h-4 w-4" />
                {{ t('pricing.tabs.credits') || (locale === 'zh-CN' ? '积分充值' : 'Credits') }}
              </button>
            </div>
          </motion.div>

          <!-- Provider filter — only shown when multiple providers are configured -->
          <motion.div
            v-if="providers.length > 1"
            class="flex flex-wrap gap-x-6 gap-y-2 mb-10 font-mono text-sm"
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, delay: 0.05 }"
          >
            <button
              v-for="provider in ['all', ...providers]"
              :key="provider"
              :data-provider-filter="provider"
              @click="activeProvider = provider"
              :class="cn(
                'pb-1 border-b-2 transition-colors',
                activeProvider === provider
                  ? 'border-chart-1 text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )"
            >
              {{ provider === 'all' ? t('pricing.allProviders') : providerLabel(provider, providerLabels) }}
            </button>
          </motion.div>

          <p v-if="plans.length === 0" class="py-16 text-center text-muted-foreground">
            {{ t('pricing.noPlans') }}
          </p>

          <div
            v-else
            :class="cn(
              'grid gap-5 items-stretch',
              plans.length === 1
                ? 'grid-cols-1 max-w-md'
                : plans.length === 2
                  ? 'grid-cols-1 md:grid-cols-2 max-w-3xl'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            )"
          >
            <motion.div
              v-for="(plan, index) in plans"
              :key="plan.id"
              :data-plan-id="plan.id"
              :data-plan-provider="plan.provider || 'stripe'"
              :class="cn(
                'relative border bg-background p-7 flex flex-col transition-colors',
                isRecommended(plan)
                  ? 'border-chart-1 border-2'
                  : 'border-border hover:border-foreground/25'
              )"
              :initial="{ opacity: 0, y: 16 }"
              :while-in-view="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.4, delay: index * 0.06 }"
              :viewport="{ once: true }"
            >
              <span
                v-if="isRecommended(plan)"
                class="absolute -top-px right-6 bg-chart-1 text-white px-2.5 py-1 text-xs font-medium"
              >
                {{ t('pricing.recommendedBadge') }}
              </span>

              <!-- Plan header — fixed rhythm so prices align across cards -->
              <div class="min-h-14">
                <h3 class="text-lg font-semibold text-foreground">
                  {{ getPlanName(plan) }}
                </h3>
                <p class="mt-1 text-sm text-muted-foreground line-clamp-1">
                  {{ getPlanDescription(plan) }}
                </p>
              </div>

              <!-- Price -->
              <div class="mt-5 border-y border-border py-5 flex items-baseline gap-2">
                <span
                  v-if="(plan as any).originalPrice"
                  class="font-mono text-base line-through text-muted-foreground tabular-nums"
                >
                  {{ plan.currency === 'CNY' ? '¥' : '$' }}{{ (plan as any).originalPrice }}
                </span>
                <span class="font-mono text-4xl font-semibold text-foreground tabular-nums">
                  {{ plan.currency === 'CNY' ? '¥' : '$' }}{{ plan.amount }}
                </span>
                <span class="text-sm text-muted-foreground">
                  /{{ getPlanDuration(plan) }}
                </span>
              </div>

              <p
                v-if="isCreditPack(plan)"
                class="mt-3 font-mono text-xs uppercase tracking-wider text-chart-1"
              >
                {{ t('pricing.creditsBadge') || 'Credits' }}
              </p>

              <!-- Features -->
              <ul class="mt-6 space-y-3 flex-1">
                <li
                  v-for="feature in getPlanFeatures(plan)"
                  :key="feature"
                  class="flex items-start gap-2.5"
                >
                  <Check class="h-4 w-4 shrink-0 mt-0.5 text-chart-1" />
                  <span class="text-sm text-foreground leading-6">{{ feature }}</span>
                </li>
              </ul>

              <!-- CTA — pinned to bottom across cards -->
              <Button
                @click="handleSubscribe(plan)"
                :disabled="loading === plan.id || session.isPending"
                :variant="isRecommended(plan) ? 'default' : 'outline'"
                class="mt-8 w-full"
              >
                <span v-if="loading === plan.id" class="flex items-center justify-center gap-2">
                  <Loader2 class="h-4 w-4 animate-spin" />
                  <span>{{ t('common.loading') }}</span>
                </span>
                <span v-else class="flex items-center justify-center gap-2">
                  <span>{{ t('pricing.cta') }}</span>
                  <ArrowRight class="h-4 w-4" />
                </span>
              </Button>
              <p v-if="isLifetime(plan)" class="mt-3 text-center text-xs text-muted-foreground">
                {{ t('pricing.lifetimeBadge') }}
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>

    <!-- Payment Modal -->
    <Dialog :open="!!qrCodeUrl" @update:open="(open) => !open && closeQrCodeModal()">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="text-center">
            <span v-if="currentPlan">
              {{ currentPlan.currency === 'CNY' ? '¥' : '$' }}{{ currentPlan.amount }} -
              {{ getPlanName(currentPlan) }}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div class="flex flex-col items-center space-y-6">
          <!-- Payment Steps -->
          <div class="w-full max-w-md mx-auto">
            <div class="relative after:absolute after:inset-x-0 after:top-5 after:block after:h-0.5 after:-translate-y-1/2 after:rounded-lg after:bg-muted">
              <div class="relative z-10 flex justify-between">
                <div
                  v-for="(step, index) in steps"
                  :key="index"
                  class="flex flex-col items-center"
                >
                  <div :class="[
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold',
                    index <= currentStep
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground'
                  ]">
                    {{ index + 1 }}
                  </div>
                  <div class="mt-3 w-24 text-center">
                    <div :class="[
                      'text-sm font-semibold',
                      index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                    ]">
                      {{ step.title }}
                    </div>
                    <div :class="[
                      'mt-1 text-xs',
                      index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                    ]">
                      {{ step.description }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- QR Code -->
          <div v-if="qrCodeUrl" class="flex flex-col items-center space-y-4">
            <img
              :src="qrCodeUrl"
              alt="WeChat Pay QR Code"
              class="w-64 h-64"
            />
            <p class="text-sm text-muted-foreground text-center">
              {{ t('payment.scanQrCode') }}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { Check, ArrowRight, Loader2, Coins, CreditCard } from 'lucide-vue-next'
import { motion } from 'motion-v'
import type { Plan } from '@config'
import { cn } from '@/lib/utils'

type PricingTab = 'subscription' | 'credits'

/**
 * Presentation labels for payment providers come from the shared i18n
 * catalogs (pricing.providers); unknown providers fall back to the
 * capitalized key so newly configured providers still render.
 */
function providerLabel(provider: string, labels: Record<string, string>): string {
  return labels[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1)
}

// Get config data
const runtimeConfig = useRuntimeConfig()

const dynamicPlans = ref<Plan[] | null>(null)
const { locale: pricingLocale } = useI18n()

const { data: plansResponse } = await useFetch('/api/pricing/plans', {
  query: { locale: pricingLocale.value },
  server: false,
})
watch(plansResponse, (val) => {
  if (val) dynamicPlans.value = (val as any).plans || []
}, { immediate: true })

const allPlans = computed(() => {
  if (dynamicPlans.value !== null) {
    return dynamicPlans.value
  }
  return Object.values(runtimeConfig.public.paymentPlans) as Plan[]
})
const activeTab = ref<PricingTab>('subscription')

// Filter plans based on active tab
const subscriptionPlans = computed(() =>
  allPlans.value.filter(plan => (plan as any).duration?.type !== 'credits')
)
const creditPlans = computed(() =>
  allPlans.value.filter(plan => (plan as any).duration?.type === 'credits')
)
const tabPlans = computed(() =>
  activeTab.value === 'subscription' ? subscriptionPlans.value : creditPlans.value
)

/** Providers present in the current plan catalog, in order of first appearance. */
const providers = computed(() => {
  const seen: string[] = []
  allPlans.value.forEach((plan) => {
    const provider = plan.provider || 'stripe'
    if (!seen.includes(provider)) seen.push(provider)
  })
  return seen
})

const activeProvider = ref<string>('all')

// Focus the recommended plan's provider once the catalog loads.
watch(allPlans, (plans) => {
  const recommended = plans.find((plan) => plan.recommended)
  if (recommended?.provider) {
    activeProvider.value = recommended.provider
  }
}, { immediate: true })

const plans = computed(() => {
  if (activeProvider.value === 'all') return tabPlans.value
  return tabPlans.value.filter((plan) => (plan.provider || 'stripe') === activeProvider.value)
})

/** All providers enabled in config, for the hero mono list. */
const configuredProviders = computed(() =>
  (runtimeConfig.public.paymentProviders as string[]) || []
)

// Authentication - Use Better Auth composable
const { user, isAuthenticated, session } = useAuth()

// Router and i18n
const router = useRouter()
const route = useRoute()
const { locale, t, tm } = useI18n()
const localePath = useLocalePath()

const providerLabels = computed(() => tm('pricing.providers') as Record<string, string>)

// Reactive state
const loading = ref<string | null>(null)
const qrCodeUrl = ref<string | null>(null)
const currentPlan = ref<Plan | null>(null)
const currentStep = ref(0)
const orderId = ref<string | null>(null)
const pollingInterval = ref<NodeJS.Timeout | null>(null)

// Payment steps
const steps = computed(() => [
  { title: t('payment.steps.initiate'), description: t('payment.steps.initiateDesc') },
  { title: t('payment.steps.scan'), description: t('payment.steps.scanDesc') },
  { title: t('payment.steps.pay'), description: t('payment.steps.payDesc') },
])

// Helper functions
const isRecommended = (plan: Plan) => plan.recommended
const isLifetime = (plan: Plan) => plan.id === 'lifetime'
const isCreditPack = (plan: Plan) => (plan as any).duration?.type === 'credits'

const getPlanName = (plan: Plan) => {
  return plan.i18n?.[locale.value]?.name || plan.i18n?.['zh-CN']?.name || 'Plan'
}

const getPlanDescription = (plan: Plan) => {
  return plan.i18n?.[locale.value]?.description || plan.i18n?.['zh-CN']?.description || 'Description'
}

const getPlanDuration = (plan: Plan) => {
  return plan.i18n?.[locale.value]?.duration || plan.i18n?.['zh-CN']?.duration || 'Duration'
}

const getPlanFeatures = (plan: Plan) => {
  return plan.i18n?.[locale.value]?.features || plan.i18n?.['zh-CN']?.features || []
}

// Payment polling
const startPolling = (orderIdValue: string) => {
  // Clear existing polling
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
  }

  const interval = setInterval(async () => {
    try {
      const response = await $fetch(`/api/payment/query?orderId=${orderIdValue}&provider=wechat`) as any

      if (response.status === 'paid') {
        clearInterval(interval)
        pollingInterval.value = null
        await navigateTo(localePath(`/payment-success?provider=wechat`))
      } else if (response.status === 'failed') {
        clearInterval(interval)
        pollingInterval.value = null
        toast.error(t('payment.result.failed'))
        closeQrCodeModal()
      }
    } catch (error) {
      console.error('Payment polling error:', error)
    }
  }, 3000) // Poll every 3 seconds

  pollingInterval.value = interval
}

// Handle subscription
const handleSubscribe = async (plan: Plan) => {
  try {
    if (!user.value) {
      // Navigate to signin with returnTo query parameter
      const signinPath = localePath('/signin')
      await navigateTo({
        path: signinPath,
        query: {
          returnTo: route.fullPath
        }
      })
      return
    }

    loading.value = plan.id
    const provider = plan.provider || 'stripe'
    currentPlan.value = plan

    const response = await $fetch('/api/payment/initiate', {
      method: 'POST',
      body: {
        planId: plan.id,
        provider
      }
    })

    if (provider === 'wechat') {
      if (response.paymentUrl) {
        try {
          // Generate QR code (we'll need to install qrcode package)
          const QRCode = await import('qrcode')
          const qrDataUrl = await QRCode.toDataURL(response.paymentUrl)
          qrCodeUrl.value = qrDataUrl
          orderId.value = response.providerOrderId
          currentStep.value = 1
          startPolling(response.providerOrderId)
        } catch (err) {
          console.error('QR code generation error:', err)
          toast.error(t('common.unexpectedError'))
        }
      }
    } else {
      if (response.paymentUrl) {
        window.location.href = response.paymentUrl
      }
    }
  } catch (error) {
    console.error('Payment error:', error)
    toast.error(t('common.unexpectedError'))
  } finally {
    loading.value = null
  }
}

// Close QR code modal
const closeQrCodeModal = async () => {
  // If payment is in progress, confirm cancellation
  if (currentStep.value < 2 && orderId.value) {
    const confirmCancel = window.confirm(t('payment.confirmCancel'))
    if (!confirmCancel) {
      return // User cancelled the close, continue payment flow
    }

    // Call cancel order API
    try {
      await $fetch(`/api/payment/cancel?orderId=${orderId.value}&provider=wechat`, {
        method: 'POST'
      })
      toast.info(t('payment.orderCanceled'))
    } catch (error) {
      console.error('Cancel order error:', error)
      toast.error(t('common.unexpectedError'))
    }
  }

  qrCodeUrl.value = null
  currentPlan.value = null
  currentStep.value = 0
  orderId.value = null
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
}

// Cleanup on unmount
onUnmounted(() => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
  }
})

// SEO
useHead({
  title: () => t('pricing.metadata.title'),
  meta: [
    { name: 'description', content: () => t('pricing.metadata.description') },
    { name: 'keywords', content: () => t('pricing.metadata.keywords') }
  ]
})
</script>
