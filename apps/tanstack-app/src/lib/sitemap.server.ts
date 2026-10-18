import '@tanstack/react-start/server-only'
import { discoverSitemapPaths } from './sitemap'
import { registeredSitemapPaths } from './page-registry'

/** Add concrete published URLs here when a dynamic content route is introduced. */
export function getSitemapPaths(publishedPaths: readonly string[] = []): string[] {
  const routes = import.meta.glob<string>('../routes/**/*.{ts,tsx}', {
    query: '?raw',
    import: 'default',
    eager: true,
  })

  return registeredSitemapPaths(discoverSitemapPaths(routes, publishedPaths))
}
