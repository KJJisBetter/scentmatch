'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  Star,
  ShoppingCart,
  TrendingUp,
  Heart,
  Search,
  Award,
  Zap,
  RefreshCw,
} from 'lucide-react';

export type ExperienceLevel = 'beginner' | 'enthusiast' | 'collector';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

interface Recommendation {
  fragrance_id: string;
  name: string;
  brand: string;
  match_score: number;
  quiz_reasoning: string;
  experience_relevance: string;
  sample_available: boolean;
  sample_price_usd: number;
  confidence_level: ConfidenceLevel;
  accords?: string[];
  rating?: number;
  popularity_score?: number;
}

interface SessionData {
  gender_preference: string;
  [key: string]: any;
}

interface EnhancedRecommendationsProps {
  recommendations: Recommendation[];
  experienceLevel: ExperienceLevel;
  sessionData: SessionData;
  showCategories?: boolean;
  isLoading?: boolean;
  onSampleOrder?: (fragranceId: string) => void;
  onRefreshRecommendations?: () => void;
  onViewDetails?: (fragranceId: string) => void;
}

/**
 * EnhancedRecommendations Component
 *
 * Displays experience-adaptive fragrance recommendations with:
 * - Experience-level appropriate language and complexity
 * - Confidence-based categorization (Perfect Matches, Worth Exploring, etc.)
 * - Sample ordering with pricing
 * - AI-generated match explanations
 * - Mobile-responsive design
 */
export function EnhancedRecommendations({
  recommendations,
  experienceLevel,
  sessionData,
  showCategories = true,
  isLoading = false,
  onSampleOrder,
  onRefreshRecommendations,
  onViewDetails,
}: EnhancedRecommendationsProps) {
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  // Get experience-level specific styling and language
  const getExperienceConfig = () => {
    switch (experienceLevel) {
      case 'beginner':
        return {
          sectionTitle: 'Your Perfect Starter Fragrances',
          perfectMatchTitle: 'Perfect for Discovering',
          explorationTitle: 'Great Starting Points',
          language: {
            matchScore: 'Perfect match',
            tryText: 'Try Sample',
            encouragement:
              'These fragrances are beginner-friendly and perfect for discovering your preferences',
            emptyMessage:
              'No recommendations found. Try adjusting your preferences!',
          },
          accentColor: 'text-green-600',
          badgeColor: 'bg-green-100 text-green-800',
          buttonColor: 'bg-green-600 hover:bg-green-700',
        };
      case 'enthusiast':
        return {
          sectionTitle: 'Your Curated Fragrance Matches',
          perfectMatchTitle: 'Perfect Matches',
          explorationTitle: 'Worth Exploring',
          language: {
            matchScore: 'Excellent match',
            tryText: 'Try Sample',
            encouragement:
              'These sophisticated choices align with your developing taste and preferences',
            emptyMessage:
              'No recommendations match your criteria. Try refining your selections!',
          },
          accentColor: 'text-purple-600',
          badgeColor: 'bg-purple-100 text-purple-800',
          buttonColor: 'bg-purple-600 hover:bg-purple-700',
        };
      case 'collector':
        return {
          sectionTitle: 'Curated Selections for the Connoisseur',
          perfectMatchTitle: 'Sophisticated Matches',
          explorationTitle: 'Refined Discoveries',
          language: {
            matchScore: 'Sophisticated match',
            tryText: 'Sample',
            encouragement:
              'These refined selections showcase the depth and sophistication of your taste',
            emptyMessage:
              'No suitable matches found for your sophisticated criteria. Consider broadening your exploration!',
          },
          accentColor: 'text-indigo-600',
          badgeColor: 'bg-indigo-100 text-indigo-800',
          buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
        };
      default:
        return {
          sectionTitle: 'Your Fragrance Recommendations',
          perfectMatchTitle: 'Perfect Matches',
          explorationTitle: 'Worth Exploring',
          language: {
            matchScore: 'Great match',
            tryText: 'Try Sample',
            encouragement:
              'These recommendations match your preferences and style',
            emptyMessage: 'No recommendations available. Try again!',
          },
          accentColor: 'text-purple-600',
          badgeColor: 'bg-purple-100 text-purple-800',
          buttonColor: 'bg-purple-600 hover:bg-purple-700',
        };
    }
  };

  const experienceConfig = getExperienceConfig();

  // Categorize recommendations by confidence level
  const categorizeRecommendations = () => {
    if (!showCategories) {
      return {
        all: recommendations,
        perfect: recommendations,
        exploration: [],
        adventurous: [],
      };
    }

    return {
      perfect: recommendations.filter(r => r.confidence_level === 'high'),
      exploration: recommendations.filter(r => r.confidence_level === 'medium'),
      adventurous: recommendations.filter(r => r.confidence_level === 'low'),
      all: recommendations,
    };
  };

  const categories = categorizeRecommendations();

  const handleSampleOrder = async (fragranceId: string) => {
    setLoadingSample(fragranceId);

    // Track sample order
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'sample_order_clicked', {
        fragrance_id: fragranceId,
        experience_level: experienceLevel,
        gender_preference: sessionData.gender_preference,
      });
    }

    try {
      if (onSampleOrder) {
        await onSampleOrder(fragranceId);
      }
    } finally {
      setLoadingSample(null);
    }
  };

  const handleViewDetails = (fragranceId: string) => {
    // Track detail view
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'fragrance_details_viewed', {
        fragrance_id: fragranceId,
        experience_level: experienceLevel,
      });
    }

    if (onViewDetails) {
      onViewDetails(fragranceId);
    }
  };

  const renderRecommendationCard = (recommendation: Recommendation) => {
    const matchPercent = Math.round(recommendation.match_score * 100);
    const isLoadingSample = loadingSample === recommendation.fragrance_id;

    return (
      <Card
        key={recommendation.fragrance_id}
        className='border-2 hover:border-purple-300 transition-colors'
      >
        <CardContent className='p-6'>
          <div className='flex flex-col space-y-4'>
            {/* Header with Brand and Name */}
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <h3 className='text-xl font-semibold text-gray-900 mb-1'>
                  {recommendation.name}
                </h3>
                <p className='text-lg text-gray-600 mb-2'>
                  {recommendation.brand}
                </p>

                {/* Match Score */}
                <div className='flex items-center space-x-2 mb-3'>
                  <Star className={`w-5 h-5 ${experienceConfig.accentColor}`} />
                  <span
                    className={`font-medium ${experienceConfig.accentColor}`}
                  >
                    {matchPercent}% {experienceConfig.language.matchScore}
                  </span>
                  {recommendation.rating && (
                    <Badge variant='secondary' className='text-xs'>
                      ⭐ {recommendation.rating.toFixed(1)}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Confidence Badge */}
              <div className='flex flex-col items-end space-y-2'>
                <Badge
                  className={`${experienceConfig.badgeColor}`}
                  variant='secondary'
                >
                  {recommendation.confidence_level === 'high' && (
                    <Award className='w-3 h-3 mr-1' />
                  )}
                  {recommendation.confidence_level === 'medium' && (
                    <TrendingUp className='w-3 h-3 mr-1' />
                  )}
                  {recommendation.confidence_level === 'low' && (
                    <Zap className='w-3 h-3 mr-1' />
                  )}
                  {recommendation.confidence_level}
                </Badge>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className='bg-gray-50 p-4 rounded-lg'>
              <p className='text-gray-700 text-sm leading-relaxed'>
                <strong>Why this matches you:</strong>{' '}
                {recommendation.quiz_reasoning}
              </p>
              {recommendation.experience_relevance && (
                <p className='text-gray-600 text-xs mt-2'>
                  {recommendation.experience_relevance}
                </p>
              )}
            </div>

            {/* Accords */}
            {recommendation.accords && recommendation.accords.length > 0 && (
              <div className='flex flex-wrap gap-1'>
                {recommendation.accords.slice(0, 4).map((accord, index) => (
                  <Badge key={index} variant='outline' className='text-xs'>
                    {accord}
                  </Badge>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row gap-3 pt-2'>
              {recommendation.sample_available ? (
                <Button
                  onClick={() => handleSampleOrder(recommendation.fragrance_id)}
                  disabled={isLoadingSample}
                  className={`flex-1 ${experienceConfig.buttonColor}`}
                  size='lg'
                >
                  {isLoadingSample ? (
                    <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                  ) : (
                    <ShoppingCart className='w-4 h-4 mr-2' />
                  )}
                  {experienceConfig.language.tryText} $
                  {recommendation.sample_price_usd}
                </Button>
              ) : (
                <Button variant='outline' className='flex-1' disabled>
                  Sample Not Available
                </Button>
              )}

              <Button
                variant='outline'
                onClick={() => handleViewDetails(recommendation.fragrance_id)}
                className='sm:px-8'
              >
                <Search className='w-4 h-4 mr-2' />
                Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCategory = (
    categoryRecs: Recommendation[],
    title: string,
    icon: React.ReactNode
  ) => {
    if (categoryRecs.length === 0) return null;

    return (
      <div className='space-y-4'>
        <h3 className='text-2xl font-semibold flex items-center gap-3'>
          {icon}
          {title}
          <Badge variant='secondary'>{categoryRecs.length}</Badge>
        </h3>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'>
          {categoryRecs.map(renderRecommendationCard)}
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className='max-w-4xl mx-auto space-y-6'>
        <div className='text-center space-y-4'>
          <Sparkles
            className={`w-12 h-12 ${experienceConfig.accentColor} mx-auto animate-pulse`}
          />
          <h2 className='text-2xl font-semibold'>
            {experienceLevel === 'beginner' &&
              'Finding perfect starter fragrances...'}
            {experienceLevel === 'enthusiast' &&
              'Analyzing your preferences...'}
            {experienceLevel === 'collector' &&
              'Curating sophisticated selections...'}
          </h2>
          <p className='text-muted-foreground'>
            We're matching thousands of fragrances to your unique profile
          </p>
        </div>

        <div className='space-y-4'>
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className='p-6'>
                <div className='space-y-4'>
                  <Skeleton className='h-6 w-3/4' />
                  <Skeleton className='h-4 w-1/2' />
                  <Skeleton className='h-20 w-full' />
                  <div className='flex gap-3'>
                    <Skeleton className='h-10 flex-1' />
                    <Skeleton className='h-10 w-24' />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (recommendations.length === 0) {
    return (
      <div className='max-w-2xl mx-auto text-center space-y-6'>
        <div className='space-y-4'>
          <Search
            className={`w-16 h-16 ${experienceConfig.accentColor} mx-auto`}
          />
          <h2 className='text-2xl font-semibold'>
            {experienceConfig.language.emptyMessage}
          </h2>
          <p className='text-muted-foreground'>
            {experienceLevel === 'beginner' &&
              'Try broadening your preferences or take the quiz again to find perfect starter fragrances.'}
            {experienceLevel === 'enthusiast' &&
              'Consider adjusting your preferences or exploring different style aspects.'}
            {experienceLevel === 'collector' &&
              'Your sophisticated criteria may be very specific. Try exploring broader categories or different accord combinations.'}
          </p>
        </div>

        {onRefreshRecommendations && (
          <Button
            onClick={onRefreshRecommendations}
            variant='outline'
            className='px-8'
          >
            <RefreshCw className='w-4 h-4 mr-2' />
            Try Different Recommendations
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className='max-w-6xl mx-auto space-y-8'>
      {/* Header */}
      <div className='text-center space-y-4'>
        <h1 className='text-3xl font-bold'>{experienceConfig.sectionTitle}</h1>
        <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
          {experienceConfig.language.encouragement}
        </p>

        {onRefreshRecommendations && (
          <Button
            onClick={onRefreshRecommendations}
            variant='outline'
            size='sm'
          >
            <RefreshCw className='w-4 h-4 mr-2' />
            Refresh Recommendations
          </Button>
        )}
      </div>

      {/* Categorized Recommendations */}
      {showCategories ? (
        <div className='space-y-12'>
          {renderCategory(
            categories.perfect,
            experienceConfig.perfectMatchTitle,
            <Award className={`w-6 h-6 ${experienceConfig.accentColor}`} />
          )}

          {renderCategory(
            categories.exploration,
            experienceConfig.explorationTitle,
            <TrendingUp className={`w-6 h-6 ${experienceConfig.accentColor}`} />
          )}

          {categories.adventurous &&
            categories.adventurous.length > 0 &&
            renderCategory(
              categories.adventurous,
              'Adventurous Choices',
              <Zap className={`w-6 h-6 ${experienceConfig.accentColor}`} />
            )}
        </div>
      ) : (
        <div className='grid gap-6 lg:grid-cols-2'>
          {recommendations.map(renderRecommendationCard)}
        </div>
      )}

      {/* Footer CTA */}
      <Card className='border-2 border-dashed border-purple-200 bg-purple-50/50'>
        <CardContent className='py-8 text-center'>
          <Heart
            className={`w-8 h-8 ${experienceConfig.accentColor} mx-auto mb-4`}
          />
          <h3 className='text-xl font-semibold mb-2'>
            Love these recommendations?
          </h3>
          <p className='text-muted-foreground mb-4'>
            Create an account to save your favorites and get personalized
            updates
          </p>
          <Button className={experienceConfig.buttonColor}>
            Save My Recommendations
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
