<template>
  <div>
    <!-- SEO Head -->
    <Head>
      <title>{{ t('home.metadata.title') }}</title>
      <meta name="description" :content="t('home.metadata.description')" />
      <meta name="keywords" :content="t('home.metadata.keywords')" />
    </Head>
    <div class="flex flex-col min-h-screen bg-background">
      <!-- Hero — two columns: title + CTAs left, description + meta right -->
      <section class="border-b border-border">
        <div class="container px-4 md:px-6 py-24 md:py-36">
          <motion.div
            class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-start"
            :initial="{ opacity: 0, y: 16 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.5 }"
          >
            <div>
              <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-foreground text-balance">
                {{ t('home.hero.titlePrefix') }}
                <span class="text-chart-1">{{ t('home.hero.titleHighlight') }}</span>
                {{ t('home.hero.titleSuffix') }}
              </h1>
              <div class="mt-10 flex flex-col sm:flex-row gap-3">
                <Button size="lg" as-child>
                  <NuxtLink :to="localePath('/pricing')">
                    {{ t('home.hero.buttons.purchase') }}
                  </NuxtLink>
                </Button>
                <Button size="lg" variant="outline" as-child>
                  <a href="#features">{{ t('home.hero.buttons.demo') }}</a>
                </Button>
              </div>
            </div>
            <div class="lg:pt-3">
              <p class="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                {{ t('home.hero.subtitle') }}
              </p>
              <p class="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
                <Check class="h-4 w-4 text-chart-1" />
                <span>{{ t('home.hero.features.lifetime') }}</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <!-- Features — asymmetric grid, border-only cards -->
      <section id="features" class="border-b border-border">
        <div class="container px-4 md:px-6 py-20 md:py-28">
          <motion.div
            class="max-w-2xl mb-14"
            :initial="fadeUp.initial"
            :while-in-view="fadeUp.whileInView"
            :viewport="fadeUp.viewport"
            :transition="{ duration: 0.5 }"
          >
            <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {{ t('home.features.title') }}
            </h2>
            <p class="mt-4 text-lg text-muted-foreground leading-relaxed">
              {{ t('home.features.subtitle') }}
            </p>
          </motion.div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              v-for="(feature, index) in tm('home.features.items') as any"
              :key="index"
              class="border border-border p-8 transition-colors hover:border-foreground/25"
              :initial="fadeUp.initial"
              :while-in-view="fadeUp.whileInView"
              :viewport="fadeUp.viewport"
              :transition="{ duration: 0.4, delay: (index % 2) * 0.08 }"
            >
              <component :is="iconMap[index]" class="h-6 w-6 text-chart-1" />
              <h3 class="mt-5 text-lg font-semibold text-foreground">{{ rt(feature.title) }}</h3>
              <p class="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md">
                {{ rt(feature.description) }}
              </p>
            </motion.div>
          </div>

          <!-- Tech stack chips — single accent, no rainbow dots -->
          <motion.div
            class="mt-16"
            :initial="fadeUp.initial"
            :while-in-view="fadeUp.whileInView"
            :viewport="fadeUp.viewport"
            :transition="{ duration: 0.5 }"
          >
            <h3 class="text-sm font-medium text-muted-foreground mb-5">
              {{ t('home.features.techStack.title') }}
            </h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tech in tm('home.features.techStack.items') as any"
                :key="rt(tech)"
                class="px-3 py-1.5 text-sm font-mono text-foreground border border-border"
              >
                {{ rt(tech) }}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      <!-- Application features — interactive list + typographic detail panel -->
      <section class="border-b border-border bg-muted/40">
        <div class="container px-4 md:px-6 py-20 md:py-28">
          <motion.div
            class="max-w-2xl mb-14"
            :initial="fadeUp.initial"
            :while-in-view="fadeUp.whileInView"
            :viewport="fadeUp.viewport"
            :transition="{ duration: 0.5 }"
          >
            <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {{ t('home.applicationFeatures.title') }}
            </h2>
            <p class="mt-4 text-lg text-muted-foreground leading-relaxed">
              {{ t('home.applicationFeatures.subtitle') }}
            </p>
          </motion.div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <!-- Selector list -->
            <div class="lg:col-span-4 flex flex-col">
              <button
                v-for="(feature, index) in applicationFeatures"
                :key="index"
                :class="cn(
                  'text-left py-5 pl-5 pr-3 border-l-2 transition-colors',
                  activeFeature === index
                    ? 'border-chart-1 bg-background'
                    : 'border-border hover:border-foreground/25'
                )"
                @click="activeFeature = index"
              >
                <span
                  :class="cn(
                    'font-mono text-xs',
                    activeFeature === index ? 'text-chart-1' : 'text-muted-foreground'
                  )"
                >
                  {{ String(index + 1).padStart(2, '0') }}
                </span>
                <span
                  :class="cn(
                    'mt-1 block font-semibold',
                    activeFeature === index ? 'text-foreground' : 'text-muted-foreground'
                  )"
                >
                  {{ feature.title }}
                </span>
              </button>
            </div>

            <!-- Detail panel -->
            <div class="lg:col-span-8">
              <motion.div
                :key="activeFeature"
                :initial="{ opacity: 0, y: 12 }"
                :animate="{ opacity: 1, y: 0 }"
                :transition="{ duration: 0.35 }"
                class="border border-border bg-background p-8 md:p-10 min-h-[22rem]"
              >
                <p class="font-mono text-sm text-chart-1">
                  {{ String(activeFeature + 1).padStart(2, '0') }} — {{ applicationFeatures[activeFeature].imageTitle }}
                </p>
                <h3 class="mt-3 text-2xl font-bold tracking-tight text-foreground">
                  {{ applicationFeatures[activeFeature].subtitle }}
                </h3>
                <p class="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
                  {{ applicationFeatures[activeFeature].description }}
                </p>
                <ul class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  <li
                    v-for="highlight in applicationFeatures[activeFeature].highlights"
                    :key="highlight"
                    class="flex items-start gap-2.5"
                  >
                    <Check class="h-4 w-4 mt-0.5 shrink-0 text-chart-1" />
                    <span class="text-sm text-foreground">{{ highlight }}</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <!-- Final CTA — solid ink, no gradient -->
      <section class="bg-primary text-primary-foreground">
        <div class="container px-4 md:px-6 py-20 md:py-28">
          <motion.div
            class="max-w-2xl"
            :initial="fadeUp.initial"
            :while-in-view="fadeUp.whileInView"
            :viewport="fadeUp.viewport"
            :transition="{ duration: 0.5 }"
          >
            <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-balance">
              {{ t('home.finalCta.title') }}
            </h2>
            <p class="mt-4 text-lg text-primary-foreground/75 leading-relaxed">
              {{ t('home.finalCta.subtitle') }}
            </p>
            <div class="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" variant="secondary" as-child>
                <NuxtLink :to="localePath('/pricing')">
                  {{ t('home.finalCta.buttons.purchase') }}
                  <ArrowRight class="ml-1 h-4 w-4" />
                </NuxtLink>
              </Button>
              <Button
                size="lg"
                variant="outline"
                class="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                as-child
              >
                <a href="#features">{{ t('home.finalCta.buttons.demo') }}</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v'
import {
  Check,
  Shield,
  Globe,
  Database,
  Bot,
  Brain,
  Cloud,
  Unplug,
  Layers,
  ArrowRight,
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'

// SEO and metadata
const { t, tm, rt } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  title: () => t('home.metadata.title'),
  description: () => t('home.metadata.description'),
  keywords: () => t('home.metadata.keywords')
})

const iconMap = [Layers, Shield, Globe, Database, Unplug, Bot, Brain, Cloud]

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
} as const

// Reactive state
const activeFeature = ref(0)

const applicationFeatures = computed(() => tm('home.applicationFeatures.items') as any[])
</script>
