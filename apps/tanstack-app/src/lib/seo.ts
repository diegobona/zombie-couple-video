import { isResourcePath, normalizeCanonical, SITE_NAME, SITE_ORIGIN } from './site'

export interface SeoOptions {
  title: string
  description: string
  canonical: string
  noindex?: boolean
  document?: boolean
  structuredData?: Record<string, unknown>
  og?: {
    title?: string
    description?: string
    type?: 'website' | 'article'
    image?: string
    imageAlt?: string
  }
}

export interface SeoHead {
  meta: Array<{ title: string } | { name: string; content: string } | { property: string; content: string } | { charSet: 'utf-8' }>
  links: Array<{ rel: string; href: string; type?: string }>
  scripts?: Array<{ type: 'application/ld+json'; children: string }>
}

/** The sole page-head builder. Pass the current pathname, never a shared home URL. */
export function seoHead(options: SeoOptions): SeoHead {
  const canonical = normalizeCanonical(options.canonical)
  const noindex = options.noindex || isResourcePath(options.canonical)
  const meta: SeoHead['meta'] = [
    { title: options.title },
    { name: 'description', content: options.description },
    { name: 'robots', content: noindex ? 'noindex, follow' : 'index, follow' },
    { property: 'og:title', content: options.og?.title ?? options.title },
    { property: 'og:description', content: options.og?.description ?? options.description },
    { property: 'og:url', content: canonical },
    { property: 'og:type', content: options.og?.type ?? 'website' },
    { property: 'og:site_name', content: SITE_NAME },
  ]
  const links: SeoHead['links'] = [{ rel: 'canonical', href: canonical }]

  if (options.og?.image) {
    meta.push({ property: 'og:image', content: new URL(options.og.image, `${SITE_ORIGIN}/`).href })
    if (options.og.imageAlt) meta.push({ property: 'og:image:alt', content: options.og.imageAlt })
  }

  if (options.document) {
    meta.unshift({ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' })
    links.push({ rel: 'icon', href: '/zombie-heart.svg', type: 'image/svg+xml' })
  }

  return { meta, links, ...(options.structuredData ? {
    scripts: [{ type: 'application/ld+json' as const, children: JSON.stringify(options.structuredData).replace(/</g, '\\u003c') }],
  } : {}) }
}

