import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { fontVariables } from '@/lib/fonts';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { SkipLinks } from '@/components/accessibility/skip-links';
import { ScreenReaderAnnouncements } from '@/components/accessibility/screen-reader-announcements';

export const metadata: Metadata = {
  title: 'ScentMatch - AI-Powered Fragrance Discovery & Samples',
  description:
    'Find your perfect fragrance with AI recommendations. Affordable samples, personalized discovery, and expert reviews for beginners to collectors.',
  keywords: [
    'fragrance discovery',
    'perfume samples',
    'AI recommendations',
    'scent matching',
    'fragrance collection',
    'perfume advice',
    'sample sets',
    'fragrance quiz',
    'scent testing',
    'AI fragrance finder'
  ],
  authors: [{ name: 'ScentMatch Team' }],
  creator: 'ScentMatch',
  metadataBase: new URL('https://scentmatch.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://scentmatch.app',
    title: 'ScentMatch - AI-Powered Fragrance Discovery & Samples',
    description:
      'Find your perfect fragrance with AI recommendations. Affordable samples, personalized discovery, and expert reviews for beginners to collectors.',
    siteName: 'ScentMatch',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ScentMatch - AI-Powered Fragrance Discovery Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScentMatch - AI-Powered Fragrance Discovery & Samples',
    description:
      'Find your perfect fragrance with AI recommendations. Affordable samples, personalized discovery, and expert reviews.',
    creator: '@scentmatch',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-token',
  },
  category: 'beauty',
  classification: 'fragrance discovery platform',
  other: {
    'application-name': 'ScentMatch',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-title': 'ScentMatch',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariables}>
      <head>
        {/* Fonts handled automatically by next/font/google - no manual preconnect needed */}
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#2d1b3d" />
        <meta name="msapplication-TileColor" content="#2d1b3d" />
        
        {/* Viewport for responsive design */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        
        {/* Structured data for rich snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'ScentMatch',
              description: 'AI-powered fragrance discovery platform helping users find their perfect scent through personalized recommendations and affordable samples.',
              url: 'https://scentmatch.app',
              applicationCategory: 'LifestyleApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                description: 'AI-powered fragrance recommendations',
                price: '0',
                priceCurrency: 'USD',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                ratingCount: '1247',
                bestRating: '5',
                worstRating: '1',
              },
              author: {
                '@type': 'Organization',
                name: 'ScentMatch Team',
              },
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <SkipLinks />
        <ScreenReaderAnnouncements />
        
        <div id="root" className="pb-20 md:pb-8">
          <main id="main-content" tabIndex={-1} role="main">
            {children}
          </main>
        </div>
        
        <nav id="main-navigation" aria-label="Bottom navigation">
          <BottomNav />
        </nav>
        
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}