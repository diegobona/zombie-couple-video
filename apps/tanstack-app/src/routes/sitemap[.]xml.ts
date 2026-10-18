import { createFileRoute } from '@tanstack/react-router'
import { renderSitemap } from '@/lib/sitemap'
import { getSitemapPaths } from '@/lib/sitemap.server'

const headers = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=300',
  'X-Robots-Tag': 'noindex, follow',
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () => new Response(renderSitemap(getSitemapPaths()), { headers }),
      HEAD: () => new Response(null, { headers }),
    },
  },
})
