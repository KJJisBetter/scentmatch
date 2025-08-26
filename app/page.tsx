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
import { MobileNavSheet } from '@/components/navigation/mobile-nav-sheet';
import {
  Sparkles,
  Heart,
  TestTube,
  ArrowRight,
  Users,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';
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
                href='/quiz'
                className='text-foreground/60 hover:text-foreground transition-colors'
              >
                Take Quiz
              </Link>
              <Link
                href='/recommendations'
                className='text-foreground/60 hover:text-foreground transition-colors'
              >
                Recommendations
              </Link>
            </nav>

            <div className='hidden md:flex items-center space-x-4'>
              <DarkModeToggle />
              <Button variant='ghost' asChild className='hidden sm:inline-flex'>
                <Link href='/auth/login'>Sign In</Link>
              </Button>
              <Button asChild size='sm'>
                <Link href='/auth/signup'>Get Started</Link>
              </Button>
            </div>

            {/* Mobile Navigation */}
            <MobileNavSheet />
          </div>
        </header>

        {/* Hero Section - 2025 Design: Editorial + Organic */}
        <section className='fragrance-hero texture-grain'>
          {/* Floating fragrance molecules */}
          <div className='scent-molecule w-16 h-16 top-20 left-10' style={{ animationDelay: '0s' }} />
          <div className='scent-molecule w-12 h-12 top-40 right-20' style={{ animationDelay: '5s' }} />
          <div className='scent-molecule w-20 h-20 bottom-32 left-1/4' style={{ animationDelay: '10s' }} />
          <div className='scent-molecule w-8 h-8 top-1/3 right-1/3' style={{ animationDelay: '15s' }} />

          <div className='container relative z-10'>
            <div className='grid lg:grid-cols-12 gap-8 lg:gap-12 items-center py-20 lg:py-32'>
              {/* Hero Content - Big Typography Trend */}
              <div className='lg:col-span-7 space-y-8 text-center lg:text-left'>
                <div className='space-y-6'>
                  {/* 2025: Big Typography with Editorial Feel */}
                  <h1 className='hero-title-2025'>
                    Find Your
                    <br />
                    Signature
                    <br />
                    <span className='editorial-title bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent'>
                      Scent
                    </span>
                  </h1>

                  <div className='editorial-body max-w-2xl lg:max-w-lg mx-auto lg:mx-0'>
                    Stop the guesswork. Our AI understands your fragrance personality 
                    to recommend scents you'll genuinely love—discoverable through 
                    affordable samples, not expensive mistakes.
                  </div>
                </div>

                {/* 2025: Organic Button Design */}
                <div className='flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center lg:justify-start'>
                  <Link
                    href='/quiz'
                    className='btn-organic text-base font-semibold group'
                    data-analytics='hero-cta-quiz'
                  >
                    <span className='relative z-10'>Discover Your Scent</span>
                    <ArrowRight className='ml-3 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform' />
                  </Link>
                  <Button
                    variant='outline'
                    size='lg'
                    className='h-14 px-8 border-2 hover:bg-accent/5'
                    asChild
                  >
                    <Link href='/browse' data-analytics='hero-cta-browse'>
                      Browse Collection
                    </Link>
                  </Button>
                </div>

                {/* Enhanced Social Proof */}
                <div className='flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-8'>
                  <div className='flex items-center space-x-3'>
                    <div className='flex -space-x-2' role='img' aria-label='User avatars'>
                      <div className='h-8 w-8 rounded-full bg-gradient-to-r from-accent to-primary border-2 border-background' />
                      <div className='h-8 w-8 rounded-full bg-gradient-to-r from-primary to-accent border-2 border-background' />
                      <div className='h-8 w-8 rounded-full bg-gradient-to-r from-secondary to-accent border-2 border-background' />
                    </div>
                    <div className='text-sm'>
                      <div className='font-semibold'>10,000+ users</div>
                      <div className='text-muted-foreground text-xs'>found their signature scent</div>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <div className='flex space-x-0.5'>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className='h-4 w-4 fill-accent text-accent' />
                      ))}
                    </div>
                    <span className='text-sm font-medium'>4.9/5 rating</span>
                  </div>
                </div>
              </div>

              {/* Hero Visual - Fluid Forms */}
              <div className='lg:col-span-5 relative'>
                <div className='relative max-w-md mx-auto'>
                  {/* Main fluid shape */}
                  <div className='fluid-shape w-80 h-80 mx-auto' />
                  
                  {/* Overlaid content */}
                  <div className='absolute inset-8 rounded-3xl bg-card/80 backdrop-blur-md border border-border/30 p-8 flex flex-col justify-center items-center text-center'>
                    <div className='scent-profile-visual w-24 h-24 mb-6' />
                    <div className='space-y-3'>
                      <h3 className='text-xl font-bold'>AI Scent Matching</h3>
                      <p className='text-sm text-muted-foreground'>
                        Advanced algorithms analyze thousands of fragrance notes 
                        to find your perfect matches
                      </p>
                      <div className='flex items-center justify-center space-x-2 text-xs text-accent font-medium'>
                        <div className='w-2 h-2 rounded-full bg-accent animate-pulse' />
                        <span>97% accuracy rate</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features - 2025 Bento Grid Layout */}
        <section className='py-20 lg:py-32 relative overflow-hidden'>
          <div className='container'>
            <div className='text-center space-y-6 mb-16'>
              <h2 className='section-title-2025 max-w-4xl mx-auto'>
                Why fragrance lovers choose ScentMatch
              </h2>
              <p className='editorial-body max-w-3xl mx-auto'>
                We're revolutionizing scent discovery through AI-powered personalization, 
                affordable sampling, and community-driven insights.
              </p>
            </div>

            {/* Bento Grid - Major 2025 Trend */}
            <div className='bento-grid' style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              
              {/* Large feature - AI Personalization */}
              <div className='bento-item interactive-2025 p-8 md:col-span-2 lg:col-span-2'>
                <div className='flex items-start space-x-6'>
                  <div className='p-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20'>
                    <Sparkles className='h-8 w-8 text-primary' />
                  </div>
                  <div className='flex-1 space-y-4'>
                    <h3 className='text-2xl font-bold'>AI-Powered Personalization</h3>
                    <p className='text-muted-foreground leading-relaxed'>
                      Unlike generic recommendations, our AI understands your unique 
                      fragrance personality to suggest scents you'll genuinely love.
                    </p>
                    <div className='grid sm:grid-cols-2 gap-4 mt-6'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-3 h-3 rounded-full bg-primary/60' />
                        <span className='text-sm'>Analyzes your scent preferences</span>
                      </div>
                      <div className='flex items-center space-x-3'>
                        <div className='w-3 h-3 rounded-full bg-primary/60' />
                        <span className='text-sm'>Learns from your feedback</span>
                      </div>
                      <div className='flex items-center space-x-3'>
                        <div className='w-3 h-3 rounded-full bg-primary/60' />
                        <span className='text-sm'>Explains each recommendation</span>
                      </div>
                      <div className='flex items-center space-x-3'>
                        <div className='w-3 h-3 rounded-full bg-primary/60' />
                        <span className='text-sm'>Improves over time</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Discovery */}
              <div className='bento-item interactive-2025 p-6 text-center'>
                <div className='p-3 rounded-full bg-gradient-to-br from-accent/20 to-secondary/20 w-fit mx-auto mb-4'>
                  <TestTube className='h-6 w-6 text-accent' />
                </div>
                <h3 className='text-xl font-bold mb-3'>Sample-First</h3>
                <p className='text-sm text-muted-foreground mb-4'>
                  Try affordable samples before committing to full bottles
                </p>
                <div className='space-y-2 text-left'>
                  <div className='text-xs text-muted-foreground'>$3-15 samples vs $50-200 bottles</div>
                  <div className='text-xs text-muted-foreground'>Risk-free exploration</div>
                </div>
              </div>

              {/* Community Insights */}
              <div className='bento-item interactive-2025 p-6 text-center'>
                <div className='p-3 rounded-full bg-gradient-to-br from-secondary/20 to-accent/20 w-fit mx-auto mb-4'>
                  <Heart className='h-6 w-6 text-secondary' />
                </div>
                <h3 className='text-xl font-bold mb-3'>Community Driven</h3>
                <p className='text-sm text-muted-foreground mb-4'>
                  Real reviews from verified fragrance enthusiasts
                </p>
                <div className='space-y-2 text-left'>
                  <div className='text-xs text-muted-foreground'>Authentic user experiences</div>
                  <div className='text-xs text-muted-foreground'>Expert curation</div>
                </div>
              </div>

              {/* Stats Block */}
              <div className='bento-item p-6 bg-gradient-to-br from-primary/5 to-accent/5'>
                <div className='text-center space-y-4'>
                  <h4 className='text-lg font-bold'>Trusted Results</h4>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <div className='text-2xl font-bold text-primary'>97%</div>
                      <div className='text-xs text-muted-foreground'>Match Accuracy</div>
                    </div>
                    <div>
                      <div className='text-2xl font-bold text-accent'>10k+</div>
                      <div className='text-xs text-muted-foreground'>Happy Users</div>
                    </div>
                    <div>
                      <div className='text-2xl font-bold text-secondary'>2min</div>
                      <div className='text-xs text-muted-foreground'>Quiz Time</div>
                    </div>
                    <div>
                      <div className='text-2xl font-bold text-primary'>$3</div>
                      <div className='text-xs text-muted-foreground'>Min Sample</div>
                    </div>
                  </div>
                </div>
              </div>

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
                <Button
                  size='lg'
                  className='text-sm sm:text-base px-6 lg:px-8 h-12 lg:h-14 shadow-medium'
                  asChild
                >
                  <Link href='/quiz' data-analytics='final-cta-quiz'>
                    Start Your Fragrance Journey
                    <ArrowRight className='ml-2 h-4 w-4 lg:h-5 lg:w-5' />
                  </Link>
                </Button>
                <Button
                  variant='outline'
                  size='lg'
                  className='text-sm sm:text-base px-6 lg:px-8 h-12 lg:h-14'
                  asChild
                >
                  <Link href='/browse' data-analytics='final-cta-learn'>
                    Browse Fragrances
                  </Link>
                </Button>
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
                    href='/quiz'
                    className='text-muted-foreground hover:text-foreground transition-colors block'
                  >
                    Take Quiz
                  </Link>
                  <Link
                    href='/recommendations'
                    className='text-muted-foreground hover:text-foreground transition-colors block'
                  >
                    Get Recommendations
                  </Link>
                  <Link
                    href='/browse'
                    className='text-muted-foreground hover:text-foreground transition-colors block'
                  >
                    Browse Fragrances
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
