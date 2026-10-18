import { createFileRoute } from '@tanstack/react-router'
import { robotsText } from '@/lib/site'

const headers = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'public, max-age=3600',
  'X-Robots-Tag': 'noindex, follow',
}

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => new Response(robotsText(), { headers }),
      HEAD: () => new Response(null, { headers }),
    },
  },
})
