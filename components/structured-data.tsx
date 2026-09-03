import { site, faqs } from '@/lib/site-config'
import menuData from '@/data/menu.json'

/**
 * JSON-LD for search engines and AI answer engines.
 * Restaurant + Menu covers local search; FAQPage is what answer boxes read.
 */
export function StructuredData() {
  const data = menuData as any

  const restaurant = {
    '@type': 'Restaurant',
    '@id': site.url + '/#restaurant',
    name: site.name,
    description: site.description,
    url: site.url,
    telephone: site.phone,
    priceRange: site.priceRange,
    servesCuisine: site.cuisines,
    image: [site.url + '/logo.png'],
    logo: site.url + '/logo.png',
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: site.geo.latitude,
      longitude: site.geo.longitude,
    },
    areaServed: site.serviceAreas.map(a => ({ '@type': 'City', name: a })),
    openingHoursSpecification: site.hours.map(h => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    acceptsReservations: false,
    hasMenu: {
      '@type': 'Menu',
      name: site.name + ' Menu',
      hasMenuSection: (data.categories || [])
        .filter((c: any) => c.id !== 'all')
        .map((c: any) => ({
          '@type': 'MenuSection',
          name: c.name,
          hasMenuItem: (data.dishes || [])
            .filter((d: any) => d.category === c.id)
            .slice(0, 25)
            .map((d: any) => {
              const price =
                d.price ?? d.variants?.[0]?.price ?? d.fullPrice ?? d.halfPrice ?? null
              return {
                '@type': 'MenuItem',
                name: d.name,
                description: d.description,
                suitableForDiet: d.isVeg
                  ? 'https://schema.org/VegetarianDiet'
                  : undefined,
                ...(price
                  ? {
                      offers: {
                        '@type': 'Offer',
                        price: String(price),
                        priceCurrency: 'INR',
                      },
                    }
                  : {}),
              }
            }),
        })),
    },
    ...(site.social.length ? { sameAs: site.social } : {}),
  }

  const website = {
    '@type': 'WebSite',
    '@id': site.url + '/#website',
    url: site.url,
    name: site.name,
    description: site.description,
    inLanguage: 'en-IN',
    publisher: { '@id': site.url + '/#restaurant' },
  }

  const faqPage = {
    '@type': 'FAQPage',
    '@id': site.url + '/#faq',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  const graph = { '@context': 'https://schema.org', '@graph': [restaurant, website, faqPage] }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  )
}
