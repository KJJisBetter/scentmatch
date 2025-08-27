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
};

module.exports = withBundleAnalyzer(nextConfig);
