import { homeCopy } from '@/lib/home-copy'
import { siteCopy } from '@/lib/site-copy'
import { legalDetails, legalPages } from '@/lib/legal-copy'

export function SiteFooter() {
  return (
    <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
      <p><a href="/" className="hover:underline">{siteCopy.name}</a></p>
      <nav aria-label={homeCopy.navigation.legal} className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2">
        {Object.values(legalPages).map((page) => <a key={page.path} href={page.path} className="underline underline-offset-4">{page.label}</a>)}
        <a href={`mailto:${legalDetails.supportEmail}`} className="underline underline-offset-4">{homeCopy.navigation.support}</a>
      </nav>
    </footer>
  )
}
