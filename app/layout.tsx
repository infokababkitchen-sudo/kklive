import type { Metadata, Viewport } from 'next'
// stub
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/context/cart-context'
import { SplashScreen } from '@/components/splash-screen'
import { CartOverlay } from '@/components/cart-overlay'
import Script from 'next/script'
import { StructuredData } from '@/components/structured-data'
import { site } from '@/lib/site-config'
import './globals.css'

const poppins = { variable: '' };

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.name + ' | ' + site.tagline + ' in ' + site.address.locality,
    template: '%s | ' + site.name,
  },
  description: site.description,
  applicationName: site.name,
  generator: 'Next.js',
  keywords: [
    'kabab near me',
    'seekh kabab ' + site.address.locality,
    'momos ' + site.address.locality,
    'soya chaap',
    'north indian food delivery',
    'kabab kitchen',
    ...site.serviceAreas.map(a => 'food delivery ' + a),
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: site.url,
    siteName: site.name,
    title: site.name + ' | ' + site.tagline,
    description: site.description,
    images: [{ url: '/logo.png', width: 512, height: 512, alt: site.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: site.name + ' | ' + site.tagline,
    description: site.description,
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  category: 'restaurant',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F97316',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-IN">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <StructuredData />
      </head>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <CartProvider>
          {children}
          <SplashScreen />
          <CartOverlay />
        </CartProvider>
        <Analytics />
        {site.gaId && (
          <>
            <Script
              src={'https://www.googletagmanager.com/gtag/js?id=' + site.gaId}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${site.gaId}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
