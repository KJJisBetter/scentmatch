/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable TypeScript and strict mode
  typescript: {
    // Build will fail on TypeScript errors
    ignoreBuildErrors: false,
  },

  // Enable experimental features for Next.js 15
  experimental: {
    // Enable optimizations
    optimizePackageImports: ['@supabase/supabase-js'],
  },

  // Image optimization configuration
  images: {
    // Allow images from Supabase storage and common fragrance image sources
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yekstmwcgyiltxinqamf.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.sephora.com',
      },
      {
        protocol: 'https',
        hostname: '*.ulta.com',
      },
      {
        protocol: 'https',
        hostname: '*.fragrantica.com',
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
