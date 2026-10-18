"use client";
import Link from "next/link";
import { Button } from "@libs/react-shared/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = [Layers, Shield, Globe, Database, Unplug, Bot, Brain, Cloud];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
} as const;

export default function Home() {
  const { t, locale: currentLocale } = useTranslation();
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero — two columns: title + CTAs left, description + meta right */}
      <section className="border-b border-border">
        <div className="container px-4 md:px-6 py-24 md:py-36">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-start"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-foreground text-balance">
                {t.home.hero.titlePrefix}
                <span className="text-chart-1">{t.home.hero.titleHighlight}</span>
                {t.home.hero.titleSuffix}
              </h1>
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild>
                  <Link href={`/${currentLocale}/pricing`}>
                    {t.home.hero.buttons.purchase}
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#features">{t.home.hero.buttons.demo}</a>
                </Button>
              </div>
            </div>
            <div className="lg:pt-3">
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                {t.home.hero.subtitle}
              </p>
              <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-chart-1" />
                <span>{t.home.hero.features.lifetime}</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features — asymmetric grid, border-only cards */}
      <section id="features" className="border-b border-border">
        <div className="container px-4 md:px-6 py-20 md:py-28">
          <motion.div className="max-w-2xl mb-14" {...fadeUp} transition={{ duration: 0.5 }}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {t.home.features.title}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {t.home.features.subtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.home.features.items.map((feature: { title: string; description: string }, index: number) => {
              const Icon = iconMap[index];
              return (
                <motion.div
                  key={index}
                  className="border border-border p-8 transition-colors hover:border-foreground/25"
                  {...fadeUp}
                  transition={{ duration: 0.4, delay: (index % 2) * 0.08 }}
                >
                  <Icon className="h-6 w-6 text-chart-1" />
                  <h3 className="mt-5 text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Tech stack chips — single accent, no rainbow dots */}
          <motion.div className="mt-16" {...fadeUp} transition={{ duration: 0.5 }}>
            <h3 className="text-sm font-medium text-muted-foreground mb-5">
              {t.home.features.techStack.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              {t.home.features.techStack.items.map((tech: string) => (
                <span
                  key={tech}
                  className="px-3 py-1.5 text-sm font-mono text-foreground border border-border"
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Application features — interactive list + typographic detail panel */}
      <section className="border-b border-border bg-muted/40">
        <div className="container px-4 md:px-6 py-20 md:py-28">
          <motion.div className="max-w-2xl mb-14" {...fadeUp} transition={{ duration: 0.5 }}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {t.home.applicationFeatures.title}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {t.home.applicationFeatures.subtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Selector list */}
            <div className="lg:col-span-4 flex flex-col">
              {t.home.applicationFeatures.items.map((feature: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={cn(
                    'text-left py-5 pl-5 pr-3 border-l-2 transition-colors',
                    activeFeature === index
                      ? 'border-chart-1 bg-background'
                      : 'border-border hover:border-foreground/25'
                  )}
                >
                  <span
                    className={cn(
                      'font-mono text-xs',
                      activeFeature === index ? 'text-chart-1' : 'text-muted-foreground'
                    )}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'mt-1 block font-semibold',
                      activeFeature === index ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {feature.title}
                  </span>
                </button>
              ))}
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-8">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="border border-border bg-background p-8 md:p-10 min-h-[22rem]"
              >
                <p className="font-mono text-sm text-chart-1">
                  {String(activeFeature + 1).padStart(2, '0')} — {t.home.applicationFeatures.items[activeFeature].imageTitle}
                </p>
                <h3 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                  {t.home.applicationFeatures.items[activeFeature].subtitle}
                </h3>
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
                  {t.home.applicationFeatures.items[activeFeature].description}
                </p>
                <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {t.home.applicationFeatures.items[activeFeature].highlights.map((highlight: string) => (
                    <li key={highlight} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-chart-1" />
                      <span className="text-sm text-foreground">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA — solid ink, no gradient */}
      <section className="bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 py-20 md:py-28">
          <motion.div className="max-w-2xl" {...fadeUp} transition={{ duration: 0.5 }}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
              {t.home.finalCta.title}
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/75 leading-relaxed">
              {t.home.finalCta.subtitle}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link href={`/${currentLocale}/pricing`}>
                  {t.home.finalCta.buttons.purchase}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                asChild
              >
                <a href="#features">{t.home.finalCta.buttons.demo}</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
