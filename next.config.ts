import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const IS_DEV = process.env.NODE_ENV === 'development';

// SEC-H02: Content Security Policy
// 'unsafe-eval' needed for Next.js dev mode HMR only — removed in production.
const ContentSecurityPolicy = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${IS_DEV ? " 'unsafe-eval'" : ''} https://apis.google.com https://secure.cardcom.solutions`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com`,
  `img-src 'self' data: blob: https://placehold.co https://i.pravatar.cc https://picsum.photos https://fastly.picsum.photos https://api.qrserver.com https://www.icm.org.il https://raananamusic.com https://www.raananamusic.com https://raananmusic.com https://www.raananmusic.com https://alumahod.com https://teo.org.il https://i.ytimg.com`,
  `connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com`,
  `frame-src 'self' https://secure.cardcom.solutions`,
  `frame-ancestors 'self'`,
  `form-action 'self'`,
  `base-uri 'self'`,
  `upgrade-insecure-requests`,
].join('; ');

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
];

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: [
    '192.168.1.11',
    '192.168.1.11:9002',
    'localhost',
    '127.0.0.1',
    '127.0.0.1:9002'
  ],
  async headers() {
    return [
      // Static assets — long-lived immutable cache (Next.js hashes filenames)
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Public images — long-lived (we control filenames, no hash, but content won't change)
      {
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Security headers on all routes (HTML pages, API routes)
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fastly.picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.icm.org.il',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raananamusic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.raananamusic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raananmusic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.raananmusic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'alumahod.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'teo.org.il',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
