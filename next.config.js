const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable TypeScript and strict mode
  typescript: {
    // Temporarily ignore build errors for production deployment
    ignoreBuildErrors: true,
  },

  // ESLint configuration for MVP build
  eslint: {
    // Allow production builds to complete with specific rule warnings
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'lib'],
  },

  // Enable experimental features for Next.js 15
  experimental: {
    // Enable optimizations
    optimizePackageImports: ['@supabase/supabase-js'],
  },

  // Security configuration (compatible with middleware CSP)
  poweredByHeader: false,

  // Headers configuration to support middleware security headers
  async headers() {
    return [
      {
        // Apply to all routes (middleware will override as needed)
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
        ],
      },
    ];
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
    // Enable optimization for better performance
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = withBundleAnalyzer(nextConfig);
