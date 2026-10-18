import { createFileRoute } from '@tanstack/react-router'
import { seoHead } from '@/lib/seo'
import { siteCopy } from '@/lib/site-copy'
import { ZombieMaker } from '@/components/zombie-maker'
import { HomeContent } from '@/components/home-content'
import { HomeExamples } from '@/components/home-examples'
import { homeCopy } from '@/lib/home-copy'
import { getDanceServiceState } from '@/lib/dance-service'
import { normalizeCanonical } from '@/lib/site'
import '../home.css'
export const Route = createFileRoute('/')({
  ssr: true, loader: () => getDanceServiceState(),
  head: () => seoHead({ title: siteCopy.home.title, description: siteCopy.home.description, canonical: '/', structuredData: {
    '@context': 'https://schema.org', '@type': 'WebApplication', '@id': `${normalizeCanonical('/')}#app`,
    name: siteCopy.name, url: normalizeCanonical('/'), description: siteCopy.home.description,
    applicationCategory: 'MultimediaApplication', operatingSystem: 'Web browser', inLanguage: 'en',
    isAccessibleForFree: true,
  } }),
  component: HomePage,
})
function HomePage() {
  const { isAvailable } = Route.useLoaderData()
  return <main className="home-page">
    <div className="mb-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-10">
      <div><h1 className="home-title">{siteCopy.home.heading}</h1><p className="text-base leading-relaxed text-muted-foreground">{homeCopy.home.intro}</p></div>
      <HomeExamples />
    </div>
    <ZombieMaker copy={homeCopy.tool} isAvailable={isAvailable} className="home-maker" /><HomeContent />
  </main>
}
