/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Optimisation was off, which shipped full-size JPEGs to phones.
    // Vercel resizes and serves AVIF/WebP instead.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 420, 640, 768, 1024, 1280],
    imageSizes: [36, 48, 64, 96, 128, 200, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      // Photos uploaded from the admin dashboard live on Vercel Blob.
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
      // Dish photos pasted as links can come from any CDN, so any https host
      // is allowed. Only URLs you enter in the admin panel are ever rendered.
      { protocol: 'https', hostname: '**' },
    ],
  },
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
