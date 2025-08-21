'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ShoppingCart, Heart, Star } from 'lucide-react';
import type { LegacyFragranceRecommendation as FragranceRecommendation } from '@/lib/ai-sdk/compatibility-layer';

interface FragranceRecommendationDisplayProps {
  recommendations: FragranceRecommendation[];
  onSampleOrder?: (fragranceId: string) => void;
  onLearnMore?: (fragranceId: string) => void;
  onSaveToFavorites?: (fragranceId: string) => void;
}

/**
 * Fragrance Recommendation Display Component - Tasks 3.3 & 3.4
 *
 * Clean, focused display of exactly 3 fragrance recommendations with AI insights.
 * Replaces complex personality profile displays with immediate, actionable results.
 */
export function FragranceRecommendationDisplay({
  recommendations,
  onSampleOrder,
  onLearnMore,
  onSaveToFavorites,
}: FragranceRecommendationDisplayProps) {
  // Ensure exactly 3 recommendations
  const top3Recommendations = recommendations.slice(0, 3);

  if (top3Recommendations.length === 0) {
    return (
      <Card className='max-w-2xl mx-auto'>
        <CardContent className='text-center py-12'>
          <p className='text-muted-foreground'>
            No recommendations available at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='max-w-4xl mx-auto space-y-8'>
      {/* Results Header */}
      <div className='text-center'>
        <h2 className='text-3xl font-semibold mb-4'>Your Perfect Matches</h2>
        <p className='text-muted-foreground text-lg'>
          Based on your preferences, here are 3 fragrances you'll love
        </p>
      </div>

      {/* 3 Recommendation Cards */}
      <div className='grid gap-6 md:grid-cols-1 lg:grid-cols-3'>
        {top3Recommendations.map((recommendation, index) => (
          <Card
            key={recommendation.id}
            className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg group ${
              index === 0
                ? 'ring-2 ring-purple-200 bg-gradient-to-br from-purple-50 to-pink-50'
                : ''
            }`}
          >
            {/* Top Match Badge */}
            {index === 0 && (
              <div className='absolute top-4 right-4 z-10'>
                <Badge className='bg-purple-600 text-white'>
                  <Star className='w-3 h-3 mr-1' />
                  Top Match
                </Badge>
              </div>
            )}

            <CardContent className='p-6'>
              {/* Fragrance Image & Basic Info */}
              <div className='text-center mb-6'>
                {recommendation.image_url ? (
                  <div className='relative w-24 h-24 mx-auto mb-4'>
                    <Image
                      src={recommendation.image_url}
                      alt={`${recommendation.name} by ${recommendation.brand}`}
                      fill
                      className='object-cover rounded-lg'
                    />
                  </div>
                ) : (
                  <div className='w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center'>
                    <Sparkles className='w-8 h-8 text-gray-400' />
                  </div>
                )}

                <h3 className='text-lg font-semibold mb-1'>
                  {recommendation.name}
                </h3>
                <p className='text-muted-foreground text-sm mb-3'>
                  {recommendation.brand}
                </p>

                {/* Match Percentage */}
                <div className='flex items-center justify-center space-x-2 mb-4'>
                  <Badge variant='secondary' className='text-lg px-3 py-1'>
                    {recommendation.match_percentage}% Match
                  </Badge>
                  <Badge
                    className={`${
                      recommendation.confidence_level === 'high'
                        ? 'bg-green-100 text-green-800'
                        : recommendation.confidence_level === 'medium'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {recommendation.confidence_level === 'high'
                      ? 'High Confidence'
                      : recommendation.confidence_level === 'medium'
                        ? 'Good Match'
                        : 'Solid Choice'}
                  </Badge>
                </div>
              </div>

              {/* AI Insight Display - Task 3.4 */}
              <div className='bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-6'>
                <div className='flex items-start space-x-3'>
                  <Sparkles className='w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0' />
                  <div>
                    <h4 className='text-sm font-medium text-purple-800 mb-2'>
                      Why This Matches You
                    </h4>
                    <p className='text-sm text-purple-700 leading-relaxed'>
                      {recommendation.ai_insight}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sample Information */}
              <div className='border-t pt-4 mb-6'>
                <div className='flex items-center justify-between mb-3'>
                  <span className='text-sm text-muted-foreground'>
                    Sample Price:
                  </span>
                  <span className='font-semibold text-lg'>
                    ${recommendation.sample_price_usd}
                  </span>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Try before you buy • 30-day wear test • Free shipping on
                  orders over $25
                </p>
              </div>

              {/* Action Buttons */}
              <div className='space-y-3'>
                <Button
                  onClick={() => onSampleOrder?.(recommendation.id)}
                  className={`w-full ${
                    index === 0
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  } text-white`}
                >
                  <ShoppingCart className='w-4 h-4 mr-2' />
                  Try Sample - ${recommendation.sample_price_usd}
                </Button>

                <div className='grid grid-cols-2 gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => onLearnMore?.(recommendation.id)}
                  >
                    Learn More
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => onSaveToFavorites?.(recommendation.id)}
                  >
                    <Heart className='w-3 h-3 mr-1' />
                    Save
                  </Button>
                </div>
              </div>

              {/* Recommendation Reasoning (Subtle) */}
              <div className='mt-4 pt-4 border-t'>
                <details className='text-xs text-muted-foreground'>
                  <summary className='cursor-pointer hover:text-foreground'>
                    Why we recommended this
                  </summary>
                  <p className='mt-2 leading-relaxed'>
                    {recommendation.reasoning}
                  </p>
                </details>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Results Summary */}
      <div className='text-center'>
        <Card className='max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50'>
          <CardContent className='py-6'>
            <h3 className='text-lg font-semibold mb-3'>
              Ready to try your matches?
            </h3>
            <p className='text-muted-foreground mb-4'>
              These 3 fragrances were selected specifically for your
              preferences. Start with samples to find your perfect signature
              scent.
            </p>

            {/* Quick Stats */}
            <div className='flex items-center justify-center space-x-6 text-sm'>
              <div className='text-center'>
                <div className='font-semibold text-lg'>
                  {Math.round(
                    recommendations.reduce(
                      (sum, r) => sum + r.match_percentage,
                      0
                    ) / recommendations.length
                  )}
                  %
                </div>
                <div className='text-muted-foreground'>Avg Match</div>
              </div>
              <div className='text-center'>
                <div className='font-semibold text-lg'>
                  $
                  {recommendations.reduce(
                    (sum, r) => sum + r.sample_price_usd,
                    0
                  )}
                </div>
                <div className='text-muted-foreground'>Total Samples</div>
              </div>
              <div className='text-center'>
                <div className='font-semibold text-lg'>3</div>
                <div className='text-muted-foreground'>Perfect Matches</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
