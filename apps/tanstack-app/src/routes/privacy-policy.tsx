import { createFileRoute } from '@tanstack/react-router'
import { LegalContent } from '@/components/legal-content'
import { legalPages } from '@/lib/legal-copy'
import { seoHead } from '@/lib/seo'
import '../home.css'
import '../article-pages.css'

const page = legalPages.privacy
export const Route = createFileRoute('/privacy-policy')({
  ssr: true,
  head: () => seoHead({ title: page.title, description: page.description, canonical: page.path, noindex: true }),
  component: () => <LegalContent page={page} />,
})
