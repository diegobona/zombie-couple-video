import { createFileRoute } from '@tanstack/react-router'
import { LegalContent } from '@/components/legal-content'
import { legalPages } from '@/lib/legal-copy'
import { seoHead } from '@/lib/seo'
import '../home.css'
import '../article-pages.css'

const page = legalPages.terms
export const Route = createFileRoute('/terms-of-service')({
  ssr: true,
  head: () => seoHead({ title: page.title, description: page.description, canonical: page.path, noindex: true }),
  component: () => <LegalContent page={page} />,
})
