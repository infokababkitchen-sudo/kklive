import type { MetadataRoute } from 'next'
import { site } from '@/lib/site-config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name + ' - ' + site.tagline,
    short_name: site.name,
    description: site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#F97316',
    icons: [
      { src: '/logo-96.png', sizes: '96x96', type: 'image/png' },
      { src: '/logo-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
