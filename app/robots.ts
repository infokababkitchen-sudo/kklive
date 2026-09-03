import type { MetadataRoute } from 'next'
import { site } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
      // AI answer engines: let them read the menu so they can recommend it
      { userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'], allow: '/' },
    ],
    sitemap: site.url + '/sitemap.xml',
    host: site.url,
  }
}
