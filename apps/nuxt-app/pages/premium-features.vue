<template>
  <div>
    <!-- SEO Head -->
    <Head>
      <title>{{ $t('premiumFeatures.metadata.title') }}</title>
      <meta name="description" :content="$t('premiumFeatures.metadata.description')" />
      <meta name="keywords" :content="$t('premiumFeatures.metadata.keywords')" />
    </Head>

    <!-- Loading State -->
    <div v-if="isLoading" class="container py-10">
      <div class="flex h-40 items-center justify-center">
        <Loader2 class="text-primary h-10 w-10 animate-spin" />
        <span class="text-muted-foreground ml-2">{{ $t('premiumFeatures.loading') }}</span>
      </div>
    </div>

    <div v-else class="container px-4 md:px-6 py-16 md:py-20">
      <!-- Header -->
      <div class="max-w-2xl">
        <div class="flex items-center gap-3">
          <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {{ $t('premiumFeatures.title') }}
          </h1>
          <span
            v-if="userData?.isLifetime"
            class="bg-chart-1 text-white px-2.5 py-1 text-xs font-medium"
          >
            {{ $t('premiumFeatures.badges.lifetime') }}
          </span>
        </div>
        <p class="mt-4 text-lg text-muted-foreground leading-relaxed">
          {{ $t('premiumFeatures.description') }}
        </p>
        <div class="mt-6 border-l-2 border-chart-1 bg-muted/40 px-4 py-3">
          <p class="text-foreground text-sm font-medium">{{ $t('premiumFeatures.demoNotice.title') }}</p>
          <p class="mt-1 text-muted-foreground text-sm">{{ $t('premiumFeatures.demoNotice.description') }}</p>
        </div>
      </div>

      <!-- Subscription status — flat ruled panel, mono values -->
      <div v-if="userData" class="mt-10 border border-border">
        <div class="border-b border-border px-6 py-4">
          <h2 class="font-semibold text-foreground">{{ $t('premiumFeatures.subscription.title') }}</h2>
          <p class="mt-0.5 text-sm text-muted-foreground">
            {{ $t('premiumFeatures.subscription.description') }}
          </p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3">
          <div class="px-6 py-5">
            <p class="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {{ $t('premiumFeatures.subscription.status') }}
            </p>
            <p class="mt-2 flex items-center gap-2">
              <span :class="`h-2 w-2 rounded-full ${userData.subscriptionActive ? 'bg-chart-1' : 'bg-destructive'}`" />
              <span :class="`text-sm font-semibold ${userData.subscriptionActive ? 'text-chart-1' : 'text-destructive'}`">
                {{ userData.subscriptionActive ? $t('premiumFeatures.subscription.active') : $t('premiumFeatures.subscription.inactive') }}
              </span>
            </p>
          </div>
          <div class="px-6 py-5 max-sm:border-t sm:border-l border-border">
            <p class="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {{ $t('premiumFeatures.subscription.type') }}
            </p>
            <p class="mt-2 font-mono text-lg font-semibold text-foreground">
              {{ userData.subscriptionType === 'lifetime' ? $t('premiumFeatures.subscription.lifetime') : $t('premiumFeatures.subscription.recurring') }}
            </p>
          </div>
          <div
            v-if="userData.expiresAt && userData.subscriptionType !== 'lifetime'"
            class="px-6 py-5 max-sm:border-t sm:border-l border-border"
          >
            <p class="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {{ $t('premiumFeatures.subscription.expiresAt') }}
            </p>
            <p class="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
              {{ formatDate(userData.expiresAt) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Feature cards — border only, no dead buttons -->
      <div class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="(feature, index) in premiumFeatures"
          :key="index"
          class="border border-border p-7 transition-colors hover:border-foreground/25"
        >
          <component :is="feature.icon" class="h-6 w-6 text-chart-1" />
          <h3 class="mt-4 font-semibold text-foreground">{{ feature.title }}</h3>
          <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Loader2, User, Sparkles, FileText, BarChart } from 'lucide-vue-next'

// Router and i18n
const { t, locale } = useI18n()

// Reactive state
const isLoading = ref(true)
const userData = ref<{
  subscriptionActive: boolean
  subscriptionType: string
  isLifetime: boolean
  expiresAt?: string
} | null>(null)

// Premium features data
const premiumFeatures = [
  {
    icon: User,
    title: t('premiumFeatures.features.userManagement.title'),
    description: t('premiumFeatures.features.userManagement.description')
  },
  {
    icon: Sparkles,
    title: t('premiumFeatures.features.aiAssistant.title'),
    description: t('premiumFeatures.features.aiAssistant.description')
  },
  {
    icon: FileText,
    title: t('premiumFeatures.features.documentProcessing.title'),
    description: t('premiumFeatures.features.documentProcessing.description')
  },
  {
    icon: BarChart,
    title: t('premiumFeatures.features.dataAnalytics.title'),
    description: t('premiumFeatures.features.dataAnalytics.description')
  }
]

// Utility functions
const formatDate = (dateString: string) => {
  const localeCode = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US'
  return new Date(dateString).toLocaleDateString(localeCode)
}

// Fetch subscription details
const fetchSubscriptionDetails = async () => {
  try {
    const response = await $fetch('/api/subscription/status')

    if (response) {
      userData.value = {
        subscriptionActive: response.hasSubscription,
        subscriptionType: response.isLifetime ? 'lifetime' : 'recurring',
        isLifetime: response.isLifetime,
        expiresAt: response.subscription?.periodEnd
      }
    }
  } catch (error) {
    console.error('Failed to fetch subscription details', error)
  } finally {
    isLoading.value = false
  }
}

// Fetch data on mount
onMounted(() => {
  fetchSubscriptionDetails()
})
</script>
