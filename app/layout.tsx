import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { fontVariables } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'ScentMatch - AI-Powered Fragrance Discovery',
  description:
    'Discover your perfect fragrance with personalized AI recommendations, collection management, and interactive testing experiences.',
  keywords: ['fragrance', 'perfume', 'AI recommendations', 'scent discovery'],
  authors: [{ name: 'ScentMatch Team' }],
  creator: 'ScentMatch',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://scentmatch.app',
    title: 'ScentMatch - AI-Powered Fragrance Discovery',
    description:
      'Discover your perfect fragrance with personalized AI recommendations',
    siteName: 'ScentMatch',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScentMatch - AI-Powered Fragrance Discovery',
    description:
      'Discover your perfect fragrance with personalized AI recommendations',
    creator: '@scentmatch',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={fontVariables}>
      <body className='font-sans antialiased'>
        <div id='root'>{children}</div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
