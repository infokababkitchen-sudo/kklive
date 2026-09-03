import type { MetadataRoute } from 'next'
import { site } from '@/lib/site-config'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: site.url, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: site.url + '/todays-special', lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: site.url + '/assistant', lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: site.url + '/cart', lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ]
}
