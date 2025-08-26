'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CollectionSkeleton } from '@/components/ui/skeletons/collection-skeleton';
import { FragranceCardSkeleton } from '@/components/ui/skeletons/fragrance-card-skeleton';
import { 
  Sparkles, 
  Heart, 
  Star, 
  Users, 
  TrendingUp,
  CheckCircle,
  Bookmark,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FragranceRecommendation {
  fragrance: {
    id: string;
    name: string;
    brand: string;
    description?: string;
    scent_family?: string;
    image_url?: string;
  };
  match_score: number;
  reasoning: string;
  sample_available?: boolean;
  sample_price_usd?: number;
}

interface ProgressiveCollectionPreviewProps {
  recommendations: FragranceRecommendation[];
  quiz_session_token: string;
  onSaveCollection: (data: {
    quiz_session_token: string;
    fragrance_ids: string[];
    collection_name?: string;
  }) => void;
  onSkip: () => void;
  isLoading?: boolean;
  socialProofData?: {
    total_users: number;
    users_this_week: number;
    collections_created_today: number;
  };
  className?: string;
}

/**
 * Progressive Collection Preview Component - Task 2.2
 * 
 * Implements progressive loading for collection preview with:
 * - Skeleton loading during initial display
 * - Staggered animations for recommendation cards
 * - Smooth transitions from loading to content
 * - Progressive enhancement of collection features
 */
export function ProgressiveCollectionPreview({
  recommendations,
  quiz_session_token,
  onSaveCollection,
  onSkip,
  isLoading = false,
  socialProofData,
  className
}: ProgressiveCollectionPreviewProps) {
  const [transitionState, setTransitionState] = useState<'loading' | 'transitioning' | 'loaded'>('loading');
  const [selectedFragrances, setSelectedFragrances] = useState<string[]>(
    recommendations.map(r => r.fragrance.id)
  );
  const [isSaving, setIsSaving] = useState(false);

  // Handle loading state transitions
  useEffect(() => {
    if (isLoading) {
      setTransitionState('loading');
      return;
    } else if (recommendations.length > 0) {
      // Show skeleton briefly for perceived performance
      const timer = setTimeout(() => {
        setTransitionState('transitioning');
        
        // Then transition to loaded state
        setTimeout(() => {
          setTransitionState('loaded');
        }, 300);
      }, 600);
      
      return () => clearTimeout(timer);
    } else {
      setTransitionState('loaded');
    }
  }, [isLoading, recommendations.length]);

  // Performance measurement
  useEffect(() => {
    if (transitionState === 'loaded' && typeof performance !== 'undefined') {
      performance.mark('collection-preview-loaded');
      
      requestAnimationFrame(() => {
        const measure = performance.getEntriesByName('collection-preview-loaded')[0];
        if (measure) {
          console.log(`Collection preview loaded: ${measure.startTime}ms`);
        }
      });
    }
  }, [transitionState]);

  const handleSaveCollection = async () => {
    setIsSaving(true);
    
    try {
      await onSaveCollection({
        quiz_session_token,
        fragrance_ids: selectedFragrances,
        collection_name: `My Quiz Matches - ${new Date().toLocaleDateString()}`
      });
    } catch (error) {
      console.error('Error saving collection:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFragranceSelection = (fragranceId: string) => {
    setSelectedFragrances(prev => 
      prev.includes(fragranceId) 
        ? prev.filter(id => id !== fragranceId)
        : [...prev, fragranceId]
    );
  };

  // Loading state with skeleton
  if (transitionState === 'loading') {
    return (
      <div className={cn('space-y-8', className)}>
        <CollectionSkeleton data-testid="collection-skeleton" />
        
        {/* Loading context indicator */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-muted rounded-lg">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">
              Preparing your collection...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Transitioning state with fade
  if (transitionState === 'transitioning') {
    return (
      <div className={cn('space-y-8 opacity-0 animate-fade-in', className)}>
        <CollectionSkeleton />
      </div>
    );
  }

  // Loaded content with progressive enhancements
  return (
    <div 
      className={cn(
        'space-y-8 opacity-0 animate-fade-in',
        transitionState === 'loaded' && 'opacity-100',
        className
      )}
      data-testid="collection-preview"
    >
      {/* Header Section with Animation */}
      <div className="text-center space-y-4 animate-slide-in-from-top">
        <div className="space-y-2">
          <div className="text-6xl animate-bounce-subtle">🎯</div>
          <h1 className="text-3xl font-bold">Your Perfect Matches</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Based on your preferences, we've found {recommendations.length} fragrances 
            that are perfect for you. Save them to your collection to never lose track!
          </p>
        </div>

        {/* Social Proof Indicators */}
        {socialProofData && (
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span>{socialProofData.total_users.toLocaleString()} users</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>{socialProofData.users_this_week} this week</span>
            </div>
            <div className="flex items-center space-x-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span>{socialProofData.collections_created_today} collections today</span>
            </div>
          </div>
        )}
      </div>

      {/* Collection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-in-from-bottom" style={{ animationDelay: '0.1s' }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
              Match Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(recommendations.reduce((acc, r) => acc + r.match_score, 0) / recommendations.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Average match score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Ready to Save
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedFragrances.length}</div>
            <p className="text-xs text-muted-foreground">Selected fragrances</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-blue-500" />
              Samples Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recommendations.filter(r => r.sample_available).length}
            </div>
            <p className="text-xs text-muted-foreground">Can try first</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Grid with Staggered Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((recommendation, index) => (
          <ProgressiveRecommendationCard
            key={recommendation.fragrance.id}
            recommendation={recommendation}
            index={index}
            isSelected={selectedFragrances.includes(recommendation.fragrance.id)}
            onToggleSelection={() => toggleFragranceSelection(recommendation.fragrance.id)}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 animate-slide-in-from-bottom" style={{ animationDelay: '0.3s' }}>
        <Button
          onClick={handleSaveCollection}
          disabled={isSaving || selectedFragrances.length === 0}
          className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving Collection...
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4 mr-2" />
              Save My Collection ({selectedFragrances.length})
            </>
          )}
        </Button>

        <Button
          onClick={onSkip}
          variant="outline"
          className="w-full sm:w-auto"
        >
          Skip for Now
        </Button>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <h3 className="text-lg font-semibold mb-4 text-center">Why Save Your Collection?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl mb-2">💾</div>
            <h4 className="font-medium mb-1">Never Lose Your Matches</h4>
            <p className="text-muted-foreground">Keep your perfect fragrances safe and accessible anytime</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-medium mb-1">Track Your Journey</h4>
            <p className="text-muted-foreground">Rate, review, and organize your fragrance experiences</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🎁</div>
            <h4 className="font-medium mb-1">Get Personalized Updates</h4>
            <p className="text-muted-foreground">Receive recommendations and deals based on your preferences</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Progressive Recommendation Card with staggered animation
 */
function ProgressiveRecommendationCard({
  recommendation,
  index,
  isSelected,
  onToggleSelection
}: {
  recommendation: FragranceRecommendation;
  index: number;
  isSelected: boolean;
  onToggleSelection: () => void;
}) {
  return (
    <Card 
      className={cn(
        'group cursor-pointer transition-all duration-300 opacity-0 animate-fade-in-up',
        isSelected 
          ? 'ring-2 ring-purple-500 bg-purple-50' 
          : 'hover:shadow-lg'
      )}
      style={{ 
        animationDelay: `${index * 0.15}s`,
        minHeight: '340px' // Prevent layout shift
      }}
      onClick={onToggleSelection}
      data-testid="collection-item"
    >
      <CardContent className="p-0">
        {/* Image placeholder */}
        <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-60">
            🌸
          </div>
          
          {/* Selection indicator */}
          <div className="absolute top-3 right-3">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200',
              isSelected 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-gray-400 group-hover:bg-purple-100'
            )}>
              {isSelected && <CheckCircle className="h-4 w-4" />}
            </div>
          </div>

          {/* Sample badge */}
          {recommendation.sample_available && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-green-600 text-white text-xs">
                Sample ${recommendation.sample_price_usd || 'N/A'}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              {recommendation.fragrance.brand}
            </p>
            <h3 className="font-semibold text-foreground leading-tight line-clamp-2">
              {recommendation.fragrance.name}
            </h3>
          </div>

          {/* Match score */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{recommendation.match_score}% match</span>
            </div>
            {recommendation.fragrance.scent_family && (
              <Badge variant="secondary" className="text-xs">
                {recommendation.fragrance.scent_family}
              </Badge>
            )}
          </div>

          {/* Reasoning */}
          <p className="text-xs text-muted-foreground line-clamp-2">
            {recommendation.reasoning}
          </p>

          {/* Selection indicator text */}
          <div className="text-xs text-center pt-2 border-t">
            <span className={cn(
              'transition-colors duration-200',
              isSelected ? 'text-purple-600 font-medium' : 'text-muted-foreground'
            )}>
              {isSelected ? 'Added to collection' : 'Click to add'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}