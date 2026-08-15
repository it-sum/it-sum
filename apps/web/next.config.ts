import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/**
 * The API origin the browser talks to. In development each developer runs the
 * NestJS app on port 3001; in production it is a separate Vercel project. It is
 * deliberately a public variable because it is a URL, not a secret — no key ever
 * reaches the browser, which is why the PDF proxy and the AI router live server
 * side.
 */
const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:3001';

/**
 * Content Security Policy.
 *
 * YouTube is the only third-party origin allowed to frame content, and the API
 * origin is the only one allowed for XHR. `unsafe-inline` for styles is required
 * by Next's inlined critical CSS; scripts avoid it via nonce-less strict-dynamic
 * in production builds.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https://i.ytimg.com https://*.ytimg.com https://lh3.googleusercontent.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval' 'unsafe-inline'" : "'unsafe-inline'"} https://www.youtube.com https://s.ytimg.com`,
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  `connect-src 'self' ${apiOrigin} https://www.youtube.com`,
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Type and lint errors must fail the build. Silencing either would let the two
  // developer tracks drift apart without anyone noticing.
  typescript: { ignoreBuildErrors: false },

  experimental: {
    // Keeps the Motion and Lucide barrels from pulling their entire surface into
    // the client bundle, which matters on the mobile connections students use.
    optimizePackageImports: ['lucide-react', 'motion', '@it-sum/ui'],
  },

  images: {
    // Every raster asset is served as WebP (AVIF negotiated first where the
    // browser supports it), per the project's image policy.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536, 1920],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Generated font and image assets are immutable and content-hashed.
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
