'use client';

import React from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from '@/components';
import { Sparkles, Heart, Search, BookOpen, Star, Wand2 } from 'lucide-react';

export default function HomePage() {
  return (
    <main className='min-h-screen'>
      {/* Hero Section with Premium Gradient Background */}
      <section className='relative overflow-hidden bg-gradient-to-br from-cream-50 via-cream-100 to-plum-50'>
        <div className='absolute inset-0 bg-gradient-to-br from-plum-900/5 to-gold-400/10'></div>
        <div className='container relative py-24 md:py-32'>
          <div className='text-center space-y-8'>
            <div className='space-y-4'>
              <h1 className='font-serif text-5xl md:text-7xl font-bold text-plum-900'>
                Discover Your
              </h1>
              <h1 className='font-serif text-5xl md:text-7xl font-bold text-gradient-primary'>
                Signature Scent
              </h1>
            </div>
            <p className='text-xl md:text-2xl text-plum-700 max-w-4xl mx-auto leading-relaxed'>
              AI-powered fragrance discovery meets premium curation. Find your
              perfect scent through personalized recommendations, curated
              samples, and expert insights.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center pt-4'>
              <Button variant='premium' size='xl' className='shadow-strong'>
                <Sparkles className='w-5 h-5 mr-2' />
                Start Your Journey
              </Button>
              <Button variant='outline' size='xl'>
                <BookOpen className='w-5 h-5 mr-2' />
                Learn More
              </Button>
            </div>
            <div className='flex justify-center gap-6 pt-8'>
              <Badge variant='premium' className='text-sm px-4 py-2'>
                <Star className='w-4 h-4 mr-1' />
                5,000+ Fragrances
              </Badge>
              <Badge variant='gold' className='text-sm px-4 py-2'>
                <Wand2 className='w-4 h-4 mr-1' />
                AI-Powered
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-20 bg-background'>
        <div className='container'>
          <div className='text-center mb-16'>
            <h2 className='font-serif text-4xl md:text-5xl font-bold text-plum-900 mb-4'>
              Why Choose ScentMatch?
            </h2>
            <p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
              We combine cutting-edge AI technology with fragrance expertise to
              create the most personalized scent discovery experience.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <Card className='card-interactive group'>
              <CardHeader>
                <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-plum-100 to-plum-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300'>
                  <Sparkles className='w-8 h-8 text-plum-600' />
                </div>
                <CardTitle className='text-2xl font-serif'>
                  AI Recommendations
                </CardTitle>
                <CardDescription className='text-lg'>
                  Get personalized fragrance suggestions based on your unique
                  scent profile and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <div className='w-2 h-2 rounded-full bg-plum-400'></div>
                    Deep learning analysis
                  </div>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <div className='w-2 h-2 rounded-full bg-plum-400'></div>
                    Scent preference mapping
                  </div>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <div className='w-2 h-2 rounded-full bg-plum-400'></div>
                    Collection insights
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='card-interactive group'>
              <CardHeader>
                <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-100 to-gold-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300'>
                  <Heart className='w-8 h-8 text-gold-600' />
                </div>
                <CardTitle className='text-2xl font-serif'>
                  Collection Manager
                </CardTitle>
                <CardDescription className='text-lg'>
                  Track your fragrances with detailed notes, ratings, and
                  beautiful organization tools.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <div className='w-2 h-2 rounded-full bg-gold-400'></div>
                    Digital fragrance library
                  </div>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <div className='w-2 h-2 rounded-full bg-gold-400'></div>
                    Usage tracking
                  </div>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <div className='w-2 h-2 rounded-full bg-gold-400'></div>
                    Personal reviews
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='card-interactive group'>
              <CardHeader>
                <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-cream-200 to-cream-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300'>
                  <Search className='w-8 h-8 text-plum-600' />
                </div>
                <CardTitle className='text-2xl font-serif'>
                  Sample Discovery
                </CardTitle>
                <CardDescription className='text-lg'>
                  Find affordable samples and travel sizes to test fragrances
                  before committing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <div className='w-2 h-2 rounded-full bg-plum-400'></div>
                    Curated sample sets
                  </div>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <div className='w-2 h-2 rounded-full bg-plum-400'></div>
                    Travel size options
                  </div>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <div className='w-2 h-2 rounded-full bg-plum-400'></div>
                    Risk-free testing
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className='py-20 bg-gradient-to-br from-plum-50 to-cream-50'>
        <div className='container text-center'>
          <div className='max-w-4xl mx-auto space-y-8'>
            <h2 className='font-serif text-4xl md:text-5xl font-bold text-plum-900'>
              Ready to Find Your Perfect Fragrance?
            </h2>
            <p className='text-xl text-plum-700 leading-relaxed'>
              Join thousands of fragrance lovers who have discovered their
              signature scents through our AI-powered platform. Start your
              personalized journey today.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center pt-4'>
              <Button variant='premium' size='xl' className='shadow-strong'>
                <Sparkles className='w-5 h-5 mr-2' />
                Create Free Account
              </Button>
              <Button variant='accent' size='xl'>
                Browse Fragrances
              </Button>
            </div>
            <p className='text-sm text-muted-foreground pt-4'>
              No credit card required • Start with free samples • Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
