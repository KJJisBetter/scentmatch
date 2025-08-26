'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Heart,
  Star,
  ShoppingCart,
  BookOpen,
  Sparkles,
  TrendingUp,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { EducationalTooltip } from '@/components/education/educational-tooltip';
import { EDUCATIONAL_GUIDANCE } from '@/lib/education/content';

interface ResultExplorationProps {
  recommendations: any[];
  phase: 'exploration' | 'investment' | 'soft_conversion' | 'account_creation';
  investmentScore: number;
  onEngagement: (event: any) => void;
  onNavigateToDetail: (fragranceId: string) => void;
}

/**
 * Result Exploration Component - SCE-65 Implementation
 * 
 * Interactive results display that:
 * - Shows immediate value without conversion pressure
 * - Encourages exploration through micro-interactions
 * - Progressively reveals additional benefits
 * - Uses beginner-friendly language and guidance
 */
export function ResultExploration({
  recommendations,
  phase,
  investmentScore,
  onEngagement,
  onNavigateToDetail,
}: ResultExplorationProps) {
  const [savedFragrances, setSavedFragrances] = useState<Set<string>>(new Set());
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<string>>(new Set());
  
  // Accessibility improvements
  const statusRef = useRef<HTMLDivElement>(null);
  const [lastSaveAction, setLastSaveAction] = useState<string>('');
  
  // Show top 3 recommendations initially
  const displayedRecommendations = recommendations.slice(0, 3);
  
  // Reveal additional recommendations based on engagement
  const showAdditionalHint = phase === 'investment' && investmentScore > 0.5;
  const additionalRecommendations = recommendations.slice(3, 6);
  
  // Announce save actions to screen readers
  useEffect(() => {
    if (lastSaveAction && statusRef.current) {
      statusRef.current.textContent = lastSaveAction;
      setTimeout(() => setLastSaveAction(''), 3000);
    }
  }, [lastSaveAction]);

  const handleSaveFragrance = (fragranceId: string, fragranceName?: string) => {
    const newSaved = new Set(savedFragrances);
    const fragrance = recommendations.find(r => r.fragrance_id === fragranceId);
    const name = fragranceName || fragrance?.name || 'this fragrance';
    
    if (savedFragrances.has(fragranceId)) {
      newSaved.delete(fragranceId);
      setLastSaveAction(`Removed ${name} from your saved fragrances.`);
      onEngagement({
        type: 'favorite_removed',
        fragrance_id: fragranceId,
        timestamp: Date.now()
      });
    } else {
      newSaved.add(fragranceId);
      setLastSaveAction(`Added ${name} to your saved fragrances. You now have ${newSaved.size} saved matches.`);
      onEngagement({
        type: 'favorite_added',
        fragrance_id: fragranceId,
        timestamp: Date.now()
      });
    }
    setSavedFragrances(newSaved);
  };

  const handleSampleInterest = (fragranceId: string) => {
    onEngagement({
      type: 'sample_interest',
      fragrance_id: fragranceId,
      timestamp: Date.now(),
      interest_level: 'high'
    });
  };

  const handleExpandRecommendation = (fragranceId: string) => {
    const newExpanded = new Set(expandedRecommendations);
    newExpanded.add(fragranceId);
    setExpandedRecommendations(newExpanded);
    
    onEngagement({
      type: 'recommendation_expanded',
      fragrance_id: fragranceId,
      timestamp: Date.now()
    });
  };

  if (displayedRecommendations.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-muted-foreground">
            No recommendations available at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-8" aria-labelledby="results-title">
      {/* ARIA Live Region for Save Actions */}
      <div 
        ref={statusRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
      
      {/* Results Header - Encouraging and Educational */}
      <header className="text-center">
        <h1 id="results-title" className="text-3xl font-bold mb-4 text-gray-900">
          Your Perfect 
          <EducationalTooltip
            content={{
              term: 'Fragrance Matches',
              shortExplanation: 'Scents chosen specifically for your personality and preferences',
              detailedExplanation: 'Our AI analyzes your quiz answers and compares them to thousands of fragrance profiles to find scents that align with your taste, lifestyle, and preferences.',
              category: 'confidence_building',
              confidence_building: 'These matches are personalized just for you - trust your instincts!'
            }}
            userLevel="beginner"
            showConfidence
          >
            <span className="underline decoration-dotted decoration-purple-400"> Fragrance Matches</span>
          </EducationalTooltip> 🌟
        </h1>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          Based on your preferences, we've found {displayedRecommendations.length} fragrances 
          that match your unique style. Each one is chosen specifically for you!
        </p>
        
        {/* Beginner-friendly guidance */}
        <Alert className="max-w-2xl mx-auto mb-8 bg-blue-50 border-blue-200" role="region" aria-labelledby="guidance-title">
          <BookOpen className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <AlertDescription className="text-blue-800">
            <strong id="guidance-title">New to fragrances?</strong> Start by saving your favorites (❤️) 
            and reading why each one matches you. Take your time exploring - there's no pressure to decide quickly!
          </AlertDescription>
        </Alert>
      </header>

      {/* Main Recommendation Cards */}
      <div 
        className="grid gap-6 md:grid-cols-1 lg:grid-cols-3"
        role="group"
        aria-label="Your personalized fragrance recommendations"
      >
        {displayedRecommendations.map((recommendation, index) => {
          const isExpanded = expandedRecommendations.has(recommendation.fragrance_id);
          const isSaved = savedFragrances.has(recommendation.fragrance_id);
          const isTopMatch = index === 0;

          return (
            <Card
              key={recommendation.fragrance_id}
              className={`transition-all duration-300 hover:shadow-lg group ${
                isTopMatch ? 'ring-2 ring-purple-200 bg-gradient-to-br from-purple-50 to-pink-50' : ''
              } ${isSaved ? 'ring-2 ring-red-200 bg-red-50' : ''}`}
              role="article"
              aria-labelledby={`fragrance-${recommendation.fragrance_id}-title`}
              aria-describedby={`fragrance-${recommendation.fragrance_id}-description`}
            >
              {/* Top Match Badge */}
              {isTopMatch && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-purple-600 text-white" aria-label="This is your best matching fragrance">
                    <Star className="w-3 h-3 mr-1" aria-hidden="true" />
                    Best Match
                  </Badge>
                </div>
              )}

              <CardContent className="p-6">
                {/* Fragrance Image & Basic Info */}
                <div className="text-center mb-6">
                  {recommendation.image_url ? (
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <Image
                        src={recommendation.image_url}
                        alt={`Product image of ${recommendation.name} by ${recommendation.brand}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center"
                      aria-label="Placeholder fragrance icon"
                    >
                      <Sparkles className="w-8 h-8 text-purple-400" aria-hidden="true" />
                    </div>
                  )}

                  <h3 id={`fragrance-${recommendation.fragrance_id}-title`} className="text-xl font-bold mb-2 text-gray-900">
                    {recommendation.name}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    by {recommendation.brand}
                  </p>

                  {/* Match Percentage - Friendly Display */}
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <EducationalTooltip
                      content={{
                        term: 'Match Percentage',
                        shortExplanation: 'How well this fragrance aligns with your preferences',
                        detailedExplanation: 'Our AI compares your quiz answers with thousands of fragrance profiles. Higher percentages mean the scent characteristics closely match what you said you prefer.',
                        category: 'confidence_building',
                        confidence_building: 'Even a 70% match can be your perfect signature scent!'
                      }}
                      userLevel="beginner"
                      showConfidence
                    >
                      <Badge 
                        variant="secondary" 
                        className="text-lg px-3 py-1 bg-green-100 text-green-800"
                        aria-label={`This fragrance is a ${Math.round((recommendation.score || 0) * 100)} percent match for your preferences`}
                      >
                        {Math.round((recommendation.score || 0) * 100)}% Match
                      </Badge>
                    </EducationalTooltip>
                  </div>

                  {/* Gender Display */}
                  <div className='flex justify-center mb-4'>
                    <Badge 
                      className={`text-xs px-2 py-1 font-semibold ${
                        recommendation.gender === 'men' 
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : recommendation.gender === 'women'
                            ? 'bg-pink-100 text-pink-800 border-pink-200'
                            : 'bg-purple-100 text-purple-800 border-purple-200'
                      }`}
                    >
                      {recommendation.gender === 'men' 
                        ? '👨 Men'
                        : recommendation.gender === 'women'
                          ? '👩 Women'
                          : '🌟 Unisex'}
                    </Badge>
                  </div>
                </div>

                {/* Why This Matches You - Always Visible */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-purple-800 mb-2">
                        Why This Is Perfect For You
                      </h4>
                      <p className="text-sm text-purple-700 leading-relaxed">
                        {recommendation.explanation}
                      </p>
                      {!isExpanded && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-purple-600 hover:text-purple-700 p-0 h-auto"
                          onClick={() => handleExpandRecommendation(recommendation.fragrance_id)}
                        >
                          Learn more about this match →
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-700 mb-3">
                      {recommendation.why_recommended}
                    </p>
                    <div className="text-xs text-gray-600">
                      <strong>Sample includes:</strong> 2ml vial • Lasting 3-5 days • Free shipping over $25
                    </div>
                  </div>
                )}

                {/* Pricing Information - Transparent */}
                <div className="border-t pt-4 mb-6" id={`fragrance-${recommendation.fragrance_id}-pricing`}>
                  <div className="flex items-center justify-between mb-2">
                    <EducationalTooltip
                      content={{
                        term: 'Sample Testing',
                        shortExplanation: 'Try a small amount before buying the full bottle',
                        detailedExplanation: 'Fragrance samples let you test how a scent works with your skin chemistry for several days. This is the smart way to find your perfect match without committing to a full-size bottle.',
                        category: 'shopping_tips',
                        confidence_building: '95% of fragrance enthusiasts start with samples!'
                      }}
                      userLevel="beginner"
                      showConfidence
                    >
                      <span className="text-sm text-gray-600 underline decoration-dotted">Try it first:</span>
                    </EducationalTooltip>
                    <span className="font-bold text-lg text-green-700" aria-label={`Sample price: ${recommendation.sample_price_usd} dollars`}>
                      ${recommendation.sample_price_usd}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    No risk • 30-day wear test • Perfect for beginners
                  </p>
                </div>

                {/* Action Buttons - Non-Aggressive */}
                <div className="space-y-3" role="group" aria-labelledby={`fragrance-${recommendation.fragrance_id}-actions`}>
                  <span id={`fragrance-${recommendation.fragrance_id}-actions`} className="sr-only">
                    Actions for {recommendation.name}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={isSaved ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSaveFragrance(recommendation.fragrance_id, recommendation.name)}
                      className={isSaved ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                      aria-label={isSaved ? `Remove ${recommendation.name} from saved fragrances` : `Save ${recommendation.name} to your favorites`}
                      aria-describedby={`fragrance-${recommendation.fragrance_id}-description`}
                    >
                      <Heart className={`w-3 h-3 mr-1 ${isSaved ? 'fill-current' : ''}`} aria-hidden="true" />
                      {isSaved ? 'Saved' : 'Save'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigateToDetail(recommendation.fragrance_id)}
                      aria-label={`View detailed information about ${recommendation.name}`}
                    >
                      <BookOpen className="w-3 h-3 mr-1" aria-hidden="true" />
                      Details
                    </Button>
                  </div>

                  <Button
                    onClick={() => handleSampleInterest(recommendation.fragrance_id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                    aria-label={`Order a sample of ${recommendation.name} for ${recommendation.sample_price_usd} dollars`}
                    aria-describedby={`fragrance-${recommendation.fragrance_id}-pricing`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" aria-hidden="true" />
                    Try Sample - ${recommendation.sample_price_usd}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progressive Value Revelation */}
      {showAdditionalHint && additionalRecommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="py-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-blue-900">
                  Discovering More About You!
                </h3>
              </div>
              <p className="text-blue-800 mb-4">
                Based on what you're exploring, we found {additionalRecommendations.length} more 
                perfect matches that align with your developing fragrance profile.
              </p>
              <Button
                variant="outline"
                className="border-blue-500 text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  onEngagement({
                    type: 'additional_recommendations_requested',
                    timestamp: Date.now(),
                    current_phase: phase
                  });
                }}
              >
                <Gift className="w-4 h-4 mr-2" />
                Show My Additional Matches
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Helpful Summary */}
      <Card className="max-w-2xl mx-auto bg-gradient-to-r from-gray-50 to-gray-100">
        <CardContent className="py-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-3">
              What's Next? 💭
            </h3>
            <p className="text-gray-600 mb-4">
              Take your time exploring these matches. Save the ones that interest you 
              and read about why they fit your style.
            </p>
            
            {/* Engagement Stats */}
            {savedFragrances.size > 0 && (
              <div className="flex justify-center items-center space-x-4 text-sm text-gray-500">
                <span>{savedFragrances.size} favorites saved</span>
                <span>•</span>
                <span>{expandedRecommendations.size} explored in detail</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}