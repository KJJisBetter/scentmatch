'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Rating } from '@/components/ui/rating';
import { 
  Heart, 
  ShoppingCart, 
  TrendingUp, 
  Compass, 
  Snowflake,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Star,
  Clock,
  Users,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { RecommendationFeedback } from './recommendation-feedback';
import { cn } from '@/lib/utils';

interface ThemedSectionsProps {
  sectionData: any[];
  sectionType: 'perfect_matches' | 'trending' | 'adventurous' | 'seasonal';
  onItemClick: (item: any) => void;
  onFeedback: (item: any, feedback: string) => void;
  feedbackState: Record<string, string>;
  showExplanations?: boolean;
  layout?: 'featured' | 'standard' | 'exploration' | 'compact';
  className?: string;
}

/**
 * ThemedSections Component
 * 
 * Renders different types of recommendations with appropriate visual treatment
 * Implements research-backed patterns for themed discovery:
 * - Visual hierarchy based on recommendation confidence
 * - Section-specific interaction patterns and CTAs
 * - Trust signals and social proof integration
 * - Mobile-optimized responsive layouts
 * - Sample-first conversion optimization
 */
export function ThemedSections({
  sectionData,
  sectionType,
  onItemClick,
  onFeedback,
  feedbackState,
  showExplanations = true,
  layout = 'standard',
  className
}: ThemedSectionsProps) {
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());

  // Toggle explanation visibility
  const toggleExplanation = (itemId: string) => {
    setExpandedExplanations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Get section-specific styling and configuration
  const getSectionConfig = () => {
    switch (sectionType) {
      case 'perfect_matches':
        return {
          cardBorder: 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50',
          accentColor: 'text-green-600',
          ctaStyle: 'bg-green-600 hover:bg-green-700',
          icon: Sparkles,
          trustSignal: 'AI Perfect Match'
        };
      case 'trending':
        return {
          cardBorder: 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50',
          accentColor: 'text-blue-600',
          ctaStyle: 'bg-blue-600 hover:bg-blue-700',
          icon: TrendingUp,
          trustSignal: 'Community Favorite'
        };
      case 'adventurous':
        return {
          cardBorder: 'border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50',
          accentColor: 'text-purple-600',
          ctaStyle: 'bg-purple-600 hover:bg-purple-700',
          icon: Compass,
          trustSignal: 'Discovery Pick'
        };
      case 'seasonal':
        return {
          cardBorder: 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50',
          accentColor: 'text-amber-600',
          ctaStyle: 'bg-amber-600 hover:bg-amber-700',
          icon: Snowflake,
          trustSignal: 'Seasonal Match'
        };
      default:
        return {
          cardBorder: 'border-gray-200',
          accentColor: 'text-gray-600',
          ctaStyle: 'bg-gray-600 hover:bg-gray-700',
          icon: Star,
          trustSignal: 'Recommended'
        };
    }
  };

  // Get grid layout based on layout type
  const getGridLayout = () => {
    switch (layout) {
      case 'featured':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';
      case 'standard':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
      case 'exploration':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
      case 'compact':
        return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3';
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
    }
  };

  const config = getSectionConfig();
  const SectionIcon = config.icon;

  if (sectionData.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <SectionIcon className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p>No {sectionType.replace('_', ' ')} available right now.</p>
        <p className="text-sm mt-1">Check back later for new recommendations.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Section Content */}
      <div className={getGridLayout()}>
        {sectionData.map((item, index) => {
          const hasUserFeedback = feedbackState[item.fragrance_id];
          const isExplanationExpanded = expandedExplanations.has(item.fragrance_id);

          return (
            <Card
              key={item.fragrance_id}
              className={cn(
                'group relative transition-all duration-300 hover:shadow-lg hover:scale-[1.02]',
                config.cardBorder,
                layout === 'featured' && 'lg:col-span-1',
                hasUserFeedback && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              <CardContent className="p-0">
                {/* Fragrance Image */}
                <div className={cn(
                  'aspect-square relative overflow-hidden',
                  layout === 'featured' ? 'rounded-t-lg' : 'rounded-t-lg'
                )}>
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={`${item.name} by ${item.brand}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes={layout === 'featured' ? '(max-width: 768px) 50vw, 33vw' : '(max-width: 768px) 50vw, 25vw'}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-cream-100 to-cream-200 text-muted-foreground">
                      <div className="text-center">
                        <div className="text-3xl mb-2">🌸</div>
                        <p className="text-xs">Image coming soon</p>
                      </div>
                    </div>
                  )}

                  {/* Section Badge */}
                  <Badge 
                    variant="default" 
                    className="absolute top-3 left-3 bg-white/90 text-gray-700 shadow-sm"
                  >
                    <SectionIcon className="h-3 w-3 mr-1" />
                    {config.trustSignal}
                  </Badge>

                  {/* Match Percentage */}
                  <Badge 
                    variant="accent" 
                    className={cn(
                      'absolute top-3 right-3 shadow-sm font-bold',
                      config.accentColor
                    )}
                  >
                    {item.match_percentage || Math.round((item.recommendation_score || 0.75) * 100)}% match
                  </Badge>

                  {/* Feedback Status Indicator */}
                  {hasUserFeedback && (
                    <div className="absolute bottom-3 left-3">
                      <Badge 
                        variant="default"
                        className={cn(
                          'shadow-sm',
                          hasUserFeedback === 'like' && 'bg-green-500 text-white',
                          hasUserFeedback === 'dislike' && 'bg-red-500 text-white',
                          hasUserFeedback === 'sample_request' && 'bg-amber-500 text-white'
                        )}
                      >
                        {hasUserFeedback === 'like' && '👍 Liked'}
                        {hasUserFeedback === 'dislike' && '👎 Dismissed'}
                        {hasUserFeedback === 'sample_request' && '🛒 Sample Added'}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-3">
                  {/* Fragrance Name and Brand */}
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {item.brand}
                    </p>
                  </div>

                  {/* Section-Specific Information */}
                  {sectionType === 'trending' && item.social_proof && (
                    <div className="flex items-center space-x-2 text-xs text-blue-600">
                      <Users className="h-3 w-3" />
                      <span>{item.social_proof}</span>
                    </div>
                  )}

                  {sectionType === 'adventurous' && item.novelty_score && (
                    <div className="flex items-center space-x-2 text-xs text-purple-600">
                      <Compass className="h-3 w-3" />
                      <span>{Math.round(item.novelty_score * 100)}% Novel</span>
                    </div>
                  )}

                  {sectionType === 'seasonal' && item.weather_context && (
                    <div className="flex items-center space-x-2 text-xs text-amber-600">
                      <Snowflake className="h-3 w-3" />
                      <span>{item.weather_context}</span>
                    </div>
                  )}

                  {/* Explanation Toggle */}
                  {showExplanations && item.explanation && (
                    <div>
                      <button
                        onClick={() => toggleExplanation(item.fragrance_id)}
                        className="flex items-center space-x-1 text-xs text-primary hover:underline"
                        aria-expanded={isExplanationExpanded}
                        aria-controls={`explanation-${item.fragrance_id}`}
                      >
                        <HelpCircle className="h-3 w-3" />
                        <span>Why this recommendation?</span>
                      </button>
                      
                      {isExplanationExpanded && (
                        <div 
                          id={`explanation-${item.fragrance_id}`}
                          className="mt-2 p-3 bg-accent/30 rounded-lg text-xs text-muted-foreground"
                        >
                          {item.explanation}
                          {item.confidence && (
                            <div className="mt-2 flex items-center space-x-1">
                              <span>Confidence:</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${item.confidence * 100}%` }}
                                />
                              </div>
                              <span>{Math.round(item.confidence * 100)}%</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Primary CTA: Sample Order */}
                    {item.sample_available && (
                      <Button
                        className={cn('w-full', config.ctaStyle)}
                        onClick={() => onItemClick(item)}
                        disabled={hasUserFeedback === 'sample_request'}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {hasUserFeedback === 'sample_request' 
                          ? 'Sample Added' 
                          : `Try Sample $${item.sample_price || '5.99'}`
                        }
                      </Button>
                    )}

                    {/* Secondary Actions */}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onItemClick(item)}
                        className="flex-1 mr-2"
                      >
                        View Details
                      </Button>
                      
                      <div className="flex space-x-1">
                        <Button
                          variant={hasUserFeedback === 'like' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onFeedback(item, 'like')}
                          className="w-9 h-9 p-0"
                          aria-label={`Like ${item.name}`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant={hasUserFeedback === 'dislike' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => onFeedback(item, 'dislike')}
                          className="w-9 h-9 p-0"
                          aria-label={`Dislike ${item.name}`}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Feedback (for perfect matches) */}
                  {sectionType === 'perfect_matches' && layout === 'featured' && (
                    <RecommendationFeedback
                      fragrance={item}
                      recommendationContext={{
                        section: sectionType,
                        position: index,
                        algorithm_version: 'hybrid_v2.1'
                      }}
                      onFeedbackSubmit={(feedback) => console.log('Detailed feedback:', feedback)}
                      enableImplicitTracking={true}
                      showDetailedOptions={false}
                    />
                  )}

                  {/* Trust Signals */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <div className="flex items-center space-x-2">
                      {item.source === 'ai' && (
                        <Badge variant="outline" className="text-xs">
                          <Sparkles className="h-2 w-2 mr-1" />
                          AI Matched
                        </Badge>
                      )}
                      
                      {sectionType === 'trending' && item.trend_score && (
                        <Badge variant="outline" className="text-xs">
                          <TrendingUp className="h-2 w-2 mr-1" />
                          {Math.round(item.trend_score * 100)}% trending
                        </Badge>
                      )}
                    </div>

                    {item.sample_available && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-2 w-2" />
                        <span>Ships in 1-2 days</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section Footer with Load More or Refresh */}
      {sectionData.length > 0 && (
        <div className="text-center">
          <Button variant="outline" size="sm" className="text-muted-foreground">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh {sectionType.replace('_', ' ')}
          </Button>
        </div>
      )}
    </div>
  );
}