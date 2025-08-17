import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MobileNav } from '@/components/ui/mobile-nav';
import { EnhancedCTA } from '@/components/ui/enhanced-cta';
import {
  Sparkles,
  Heart,
  TestTube,
  ArrowRight,
  Users,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ScentMatch - AI-Powered Fragrance Discovery & Samples',
  description:
    'Find your perfect fragrance with AI recommendations. Affordable samples, personalized discovery, and expert reviews for beginners to collectors.',
  keywords:
    'fragrance discovery, perfume samples, AI recommendations, scent matching, fragrance quiz',
  openGraph: {
    title: 'ScentMatch - Find Your Perfect Fragrance with AI',
    description:
      "Stop guessing, start discovering. Our AI learns your preferences to recommend fragrances you'll love—all through affordable samples first.",
    images: [{ url: '/og-homepage.png', width: 1200, height: 630 }],
    type: 'website',
    url: 'https://scentmatch.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScentMatch - Find Your Perfect Fragrance with AI',
    description:
      'AI-powered fragrance discovery with affordable samples. Try before you buy!',
    images: ['/twitter-homepage.png'],
  },
};

export default function HomePage() {
  return (
    <>
      {/* Structured data for affiliate conversion and SEO */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'ScentMatch - AI-Powered Fragrance Discovery',
            description:
              'Find your perfect fragrance with AI recommendations. Affordable samples, personalized discovery, and expert reviews.',
            url: 'https://scentmatch.app',
            mainEntity: {
              '@type': 'Service',
              name: 'AI Fragrance Recommendations',
              description:
                'Personalized fragrance discovery through AI-powered recommendations and affordable sample testing',
              provider: {
                '@type': 'Organization',
                name: 'ScentMatch',
                url: 'https://scentmatch.app',
              },
              areaServed: 'Worldwide',
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Fragrance Discovery Services',
                itemListElement: [
                  {
                    '@type': 'Offer',
                    name: 'AI Fragrance Quiz',
                    description:
                      'Get personalized fragrance recommendations in under 2 minutes',
                    price: '0',
                    priceCurrency: 'USD',
                  },
                  {
                    '@type': 'Offer',
                    name: 'Sample Recommendations',
                    description:
                      'Affordable fragrance samples starting from $3',
                    priceRange: '$3-$15',
                    priceCurrency: 'USD',
                  },
                ],
              },
            },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: 'https://scentmatch.app',
                },
              ],
            },
          }),
        }}
      />

      <main className='min-h-screen bg-background'>
        {/* Navigation Header - Optimized for LCP */}
        <header className='sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
          <div className='container flex h-16 items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <div className='relative h-8 w-8' aria-label='ScentMatch Logo'>
                <div className='absolute inset-0 rounded-lg bg-gradient-to-br from-plum-600 to-plum-800 flex items-center justify-center'>
                  <Sparkles className='h-5 w-5 text-white' aria-hidden='true' />
                </div>
              </div>
              <span className='font-serif text-xl font-bold text-gradient-primary'>
                ScentMatch
              </span>
            </div>

            <nav className='hidden md:flex items-center space-x-6 text-sm font-medium'>
              <Link
                href='/browse'
                className='text-foreground/60 hover:text-foreground transition-colors'
              >
                Browse Fragrances
              </Link>
              <Link
                href='/how-it-works'
                className='text-foreground/60 hover:text-foreground transition-colors'
              >
                How It Works
              </Link>
              <Link
                href='/about'
                className='text-foreground/60 hover:text-foreground transition-colors'
              >
                About
              </Link>
            </nav>

            <div className='hidden md:flex items-center space-x-4'>
              <Button variant='ghost' asChild className='hidden sm:inline-flex'>
                <Link href='/auth/login'>Sign In</Link>
              </Button>
              <Button asChild size='sm'>
                <Link href='/auth/signup'>Get Started</Link>
              </Button>
            </div>

            {/* Mobile Navigation */}
            <MobileNav />
          </div>
        </header>

        {/* Hero Section - Optimized for Core Web Vitals */}
        <section className='relative overflow-hidden'>
          {/* Background gradient - optimized for paint performance */}
          <div className='absolute inset-0 bg-gradient-to-br from-cream-50 via-background to-plum-50/30' />

          {/* Preload critical content for LCP optimization */}
          <div className='container relative'>
            <div className='grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-16 sm:py-20 lg:py-32'>
              {/* Hero Content */}
              <div className='flex flex-col space-y-6 lg:space-y-8 text-center lg:text-left'>
                <div className='space-y-4'>
                  <div className='inline-flex items-center space-x-2 bg-accent/10 text-accent-foreground px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mx-auto lg:mx-0'>
                    <Sparkles className='h-3 w-3 sm:h-4 sm:w-4' />
                    <span>AI-Powered Fragrance Discovery</span>
                  </div>

                  <h1 className='font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-foreground'>
                    Find Your Perfect{' '}
                    <span className='text-gradient-primary'>Fragrance</span>
                  </h1>

                  <p className='text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl lg:max-w-lg leading-relaxed mx-auto lg:mx-0'>
                    Stop guessing. Start discovering. Our AI learns your
                    preferences to recommend fragrances you'll love—all through
                    affordable samples first.
                  </p>
                </div>

                <div className='flex flex-col sm:flex-row gap-3 lg:gap-4'>
                  <EnhancedCTA
                    href='/quiz'
                    className='text-sm sm:text-base px-6 lg:px-8 h-12 lg:h-14 animate-glow-soft'
                    data-analytics='hero-cta-quiz'
                    variant='primary'
                  >
                    Start Finding Your Scent
                    <ArrowRight className='ml-2 h-4 w-4 lg:h-5 lg:w-5' />
                  </EnhancedCTA>
                  <EnhancedCTA
                    href='/browse'
                    className='text-sm sm:text-base px-6 lg:px-8 h-12 lg:h-14'
                    data-analytics='hero-cta-browse'
                    variant='secondary'
                  >
                    Browse Fragrances
                  </EnhancedCTA>
                </div>

                {/* Social Proof - Conversion Optimized */}
                <div className='flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm text-muted-foreground'>
                  <div className='flex items-center space-x-2'>
                    <div
                      className='flex -space-x-1.5 sm:-space-x-2'
                      role='img'
                      aria-label='User avatars'
                    >
                      <div className='h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-r from-plum-400 to-plum-600 border-2 border-background' />
                      <div className='h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 border-2 border-background' />
                      <div className='h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-r from-cream-400 to-cream-600 border-2 border-background' />
                    </div>
                    <span>
                      Trusted by <strong>10,000+</strong> fragrance lovers
                    </span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <Star className='h-3 w-3 sm:h-4 sm:w-4 fill-gold-400 text-gold-400' />
                    <span>
                      <strong>4.9/5</strong> rating
                    </span>
                  </div>
                </div>
              </div>

              {/* Hero Image */}
              <div className='relative order-first lg:order-last'>
                <div className='relative aspect-square lg:aspect-[4/5] max-w-xs sm:max-w-md lg:max-w-lg mx-auto'>
                  <div className='absolute inset-0 bg-gradient-to-br from-plum-100 via-cream-100 to-gold-100 rounded-2xl lg:rounded-3xl rotate-3' />
                  <div className='absolute inset-2 bg-white rounded-2xl lg:rounded-3xl shadow-strong'>
                    {/* Optimized hero image placeholder with proper dimensions */}
                    <div className='h-full w-full rounded-2xl lg:rounded-3xl bg-gradient-to-br from-plum-50 to-cream-50 flex items-center justify-center p-6'>
                      <div className='text-center space-y-3 lg:space-y-4'>
                        <div className='h-16 w-16 lg:h-20 lg:w-20 mx-auto rounded-full bg-gradient-to-br from-plum-600 to-plum-800 flex items-center justify-center'>
                          <TestTube className='h-8 w-8 lg:h-10 lg:w-10 text-white' />
                        </div>
                        <div className='space-y-1 lg:space-y-2'>
                          <p className='font-medium text-plum-900 text-sm lg:text-base'>
                            Sample Discovery
                          </p>
                          <p className='text-xs lg:text-sm text-plum-600'>
                            Try before you buy
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className='py-16 sm:py-20 lg:py-32 border-t border-border/40'>
          <div className='container'>
            <div className='text-center space-y-4 mb-12 lg:mb-16'>
              <h2 className='font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight'>
                Why Choose ScentMatch?
              </h2>
              <p className='text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto'>
                We're revolutionizing fragrance discovery with AI-powered
                personalization, affordable sampling, and expert guidance.
              </p>
            </div>

            <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8'>
              {/* AI Personalization */}
              <Card className='card-interactive text-center'>
                <CardHeader className='pb-4'>
                  <div className='h-12 w-12 sm:h-16 sm:w-16 mx-auto rounded-xl lg:rounded-2xl bg-gradient-to-br from-plum-600 to-plum-800 flex items-center justify-center mb-3 lg:mb-4'>
                    <Sparkles className='h-6 w-6 sm:h-8 sm:w-8 text-white' />
                  </div>
                  <CardTitle className='text-lg lg:text-xl'>
                    AI-Powered Personalization
                  </CardTitle>
                  <CardDescription className='text-sm lg:text-base'>
                    Unlike generic recommendations, our AI learns your unique
                    preferences to suggest fragrances you'll actually love.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className='text-xs sm:text-sm text-muted-foreground space-y-2 text-left'>
                    <li className='flex items-center space-x-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-plum-600 flex-shrink-0' />
                      <span>Analyzes your collection and ratings</span>
                    </li>
                    <li className='flex items-center space-x-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-plum-600 flex-shrink-0' />
                      <span>Learns from your feedback over time</span>
                    </li>
                    <li className='flex items-center space-x-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-plum-600 flex-shrink-0' />
                      <span>Explains why each fragrance matches you</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Sample-First Philosophy */}
              <Card className='card-interactive text-center'>
                <CardHeader className='pb-4'>
                  <div className='h-12 w-12 sm:h-16 sm:w-16 mx-auto rounded-xl lg:rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mb-3 lg:mb-4'>
                    <TestTube className='h-6 w-6 sm:h-8 sm:w-8 text-white' />
                  </div>
                  <CardTitle className='text-lg lg:text-xl'>
                    Sample-First Discovery
                  </CardTitle>
                  <CardDescription className='text-sm lg:text-base'>
                    Try affordable samples and travel sizes before committing to
                    full bottles. Perfect for beginners and budget-conscious
                    buyers.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className='text-xs sm:text-sm text-muted-foreground space-y-2 text-left'>
                    <li className='flex items-center space-x-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-gold-600 flex-shrink-0' />
                      <span>$3-15 samples vs $50-200 bottles</span>
                    </li>
                    <li className='flex items-center space-x-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-gold-600 flex-shrink-0' />
                      <span>Curated sample sets by preference</span>
                    </li>
                    <li className='flex items-center space-x-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-gold-600 flex-shrink-0' />
                      <span>Risk-free fragrance exploration</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Interactive Testing */}
              <Card className='card-interactive text-center sm:col-span-2 lg:col-span-1'>
                <CardHeader className='pb-4'>
                  <div className='h-12 w-12 sm:h-16 sm:w-16 mx-auto rounded-xl lg:rounded-2xl bg-gradient-to-br from-cream-400 to-cream-600 flex items-center justify-center mb-3 lg:mb-4'>
                    <Heart className='h-6 w-6 sm:h-8 sm:w-8 text-white' />
                  </div>
                  <CardTitle className='text-lg lg:text-xl'>
                    Interactive Testing
                  </CardTitle>
                  <CardDescription className='text-sm lg:text-base'>
                    Guided blind testing experiences help you discover your true
                    preferences without visual bias or marketing influence.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className='text-xs sm:text-sm text-muted-foreground space-y-2 text-left'>
                    <li className='flex items-center space-x-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-cream-600 flex-shrink-0' />
                      <span>Structured testing protocols</span>
                    </li>
                    <li className='flex items-center space-x-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-cream-600 flex-shrink-0' />
                      <span>Solo and group testing options</span>
                    </li>
                    <li className='flex items-center space-x-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-cream-600 flex-shrink-0' />
                      <span>Unbiased preference discovery</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Social Proof & Trust Signals */}
        <section className='py-16 sm:py-20 bg-gradient-to-r from-plum-50/30 via-cream-50/50 to-gold-50/30'>
          <div className='container'>
            <div className='grid lg:grid-cols-3 gap-8 lg:gap-12 items-center'>
              <div className='space-y-6 text-center lg:text-left'>
                <h3 className='font-serif text-xl sm:text-2xl font-bold'>
                  Trusted by Fragrance Lovers Everywhere
                </h3>
                <div className='space-y-4'>
                  <div className='flex items-center space-x-3 justify-center lg:justify-start'>
                    <ShieldCheck className='h-5 w-5 sm:h-6 sm:w-6 text-plum-600 flex-shrink-0' />
                    <div>
                      <p className='font-medium text-sm sm:text-base'>
                        Authentic Reviews
                      </p>
                      <p className='text-xs sm:text-sm text-muted-foreground'>
                        Verified purchases and experiences
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-3 justify-center lg:justify-start'>
                    <Users className='h-5 w-5 sm:h-6 sm:w-6 text-gold-600 flex-shrink-0' />
                    <div>
                      <p className='font-medium text-sm sm:text-base'>
                        Expert Curation
                      </p>
                      <p className='text-xs sm:text-sm text-muted-foreground'>
                        Fragrance professionals and enthusiasts
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-3 justify-center lg:justify-start'>
                    <Star className='h-5 w-5 sm:h-6 sm:w-6 text-cream-600 flex-shrink-0' />
                    <div>
                      <p className='font-medium text-sm sm:text-base'>
                        Quality Guarantee
                      </p>
                      <p className='text-xs sm:text-sm text-muted-foreground'>
                        100% authentic fragrances
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className='lg:col-span-2 grid sm:grid-cols-2 gap-4 lg:gap-6'>
                <Card className='card-elevated'>
                  <CardContent className='pt-4 lg:pt-6'>
                    <div className='flex items-center space-x-1 mb-2'>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className='h-3 w-3 sm:h-4 sm:w-4 fill-gold-400 text-gold-400'
                        />
                      ))}
                    </div>
                    <p className='text-xs sm:text-sm italic mb-3 lg:mb-4'>
                      "Finally found my signature scent after trying 3 samples
                      instead of buying expensive bottles blindly!"
                    </p>
                    <div className='text-xs text-muted-foreground'>
                      <p className='font-medium'>Sarah K.</p>
                      <p>Fragrance Beginner</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className='card-elevated'>
                  <CardContent className='pt-4 lg:pt-6'>
                    <div className='flex items-center space-x-1 mb-2'>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className='h-3 w-3 sm:h-4 sm:w-4 fill-gold-400 text-gold-400'
                        />
                      ))}
                    </div>
                    <p className='text-xs sm:text-sm italic mb-3 lg:mb-4'>
                      "The AI recommendations are spot on. It suggested
                      fragrances I never would have considered but absolutely
                      love."
                    </p>
                    <div className='text-xs text-muted-foreground'>
                      <p className='font-medium'>Marcus R.</p>
                      <p>Fragrance Enthusiast</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section - Conversion Optimized */}
        <section className='py-16 sm:py-20 lg:py-32 bg-gradient-to-br from-plum-50/20 to-gold-50/20'>
          <div className='container'>
            <div className='max-w-3xl mx-auto text-center space-y-6 lg:space-y-8'>
              <h2 className='font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight'>
                Ready to Discover Your Perfect Fragrance?
              </h2>
              <p className='text-base sm:text-lg lg:text-xl text-muted-foreground'>
                Join <strong>thousands</strong> of fragrance lovers who've found
                their signature scents with ScentMatch's AI-powered
                recommendations.
              </p>
              <div className='flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center'>
                <EnhancedCTA
                  href='/quiz'
                  className='text-sm sm:text-base px-6 lg:px-8 h-12 lg:h-14 shadow-medium'
                  data-analytics='final-cta-quiz'
                  variant='primary'
                >
                  Start Your Fragrance Journey
                  <ArrowRight className='ml-2 h-4 w-4 lg:h-5 lg:w-5' />
                </EnhancedCTA>
                <EnhancedCTA
                  href='/how-it-works'
                  className='text-sm sm:text-base px-6 lg:px-8 h-12 lg:h-14'
                  data-analytics='final-cta-learn'
                  variant='secondary'
                >
                  Learn How It Works
                </EnhancedCTA>
              </div>
              <div className='space-y-2'>
                <p className='text-xs sm:text-sm text-muted-foreground'>
                  <strong>Free to start</strong> • No credit card required •
                  Sample recommendations from <strong>$3</strong>
                </p>
                <p className='text-xs text-muted-foreground'>
                  ⚡ Get personalized recommendations in under 2 minutes
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className='border-t border-border/40 py-8 lg:py-12 bg-muted/20'>
          <div className='container'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8'>
              <div className='col-span-2 md:col-span-1 space-y-4'>
                <div className='flex items-center space-x-2'>
                  <div className='relative h-5 w-5 sm:h-6 sm:w-6'>
                    <div className='absolute inset-0 rounded bg-gradient-to-br from-plum-600 to-plum-800 flex items-center justify-center'>
                      <Sparkles className='h-3 w-3 sm:h-4 sm:w-4 text-white' />
                    </div>
                  </div>
                  <span className='font-serif text-base sm:text-lg font-bold text-gradient-primary'>
                    ScentMatch
                  </span>
                </div>
                <p className='text-xs sm:text-sm text-muted-foreground'>
                  AI-powered fragrance discovery platform helping you find your
                  perfect scent.
                </p>
              </div>

              <div className='space-y-3 lg:space-y-4'>
                <h4 className='font-medium text-sm sm:text-base'>Discover</h4>
                <nav className='space-y-2 text-xs sm:text-sm'>
                  <Link
                    href='/browse'
                    className='text-muted-foreground hover:text-foreground transition-colors block'
                  >
                    Browse Fragrances
                  </Link>
                  <Link
                    href='/quiz'
                    className='text-muted-foreground hover:text-foreground transition-colors block'
                  >
                    Find Your Match
                  </Link>
                  <Link
                    href='/samples'
                    className='text-muted-foreground hover:text-foreground transition-colors block'
                  >
                    Sample Sets
                  </Link>
                </nav>
              </div>

              <div className='space-y-3 lg:space-y-4'>
                <h4 className='font-medium text-sm sm:text-base'>Learn</h4>
                <nav className='space-y-2 text-xs sm:text-sm'>
                  <Link
                    href='/how-it-works'
                    className='text-muted-foreground hover:text-foreground transition-colors block'
                  >
                    How It Works
                  </Link>
                  <Link
                    href='/about'
                    className='text-muted-foreground hover:text-foreground transition-colors block'
                  >
                    About Us
                  </Link>
                  <Link
                    href='/blog'
                    className='text-muted-foreground hover:text-foreground transition-colors block'
                  >
                    Fragrance Guide
                  </Link>
                </nav>
              </div>

              <div className='space-y-3 lg:space-y-4'>
                <h4 className='font-medium text-sm sm:text-base'>Account</h4>
                <nav className='space-y-2 text-xs sm:text-sm'>
                  <Link
                    href='/auth/signup'
                    className='text-muted-foreground hover:text-foreground transition-colors block'
                  >
                    Sign Up
                  </Link>
                  <Link
                    href='/auth/login'
                    className='text-muted-foreground hover:text-foreground transition-colors block'
                  >
                    Sign In
                  </Link>
                  <Link
                    href='/dashboard'
                    className='text-muted-foreground hover:text-foreground transition-colors block'
                  >
                    My Collection
                  </Link>
                </nav>
              </div>
            </div>

            <div className='mt-8 lg:mt-12 pt-6 lg:pt-8 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0'>
              <p className='text-xs sm:text-sm text-muted-foreground'>
                © 2024 ScentMatch. All rights reserved.
              </p>
              <div className='flex space-x-4 lg:space-x-6 text-xs sm:text-sm text-muted-foreground'>
                <Link
                  href='/privacy'
                  className='hover:text-foreground transition-colors'
                >
                  Privacy Policy
                </Link>
                <Link
                  href='/terms'
                  className='hover:text-foreground transition-colors'
                >
                  Terms of Service
                </Link>
                <Link
                  href='/contact'
                  className='hover:text-foreground transition-colors'
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
