'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Clock,
  Star,
  Gift,
  ArrowRight,
  Sparkles,
  BookOpen,
  TrendingUp,
  Users,
  Shield,
} from 'lucide-react';
import { EducationalTooltip } from '@/components/education/educational-tooltip';
import { EDUCATIONAL_GUIDANCE } from '@/lib/education/content';

interface MicroConversionTriggersProps {
  phase: 'exploration' | 'investment' | 'soft_conversion' | 'account_creation';
  investmentScore: number;
  engagementMetrics: {
    timeSpent: number;
    favoritesCount: number;
    detailViewsCount: number;
    engagementEvents: any[];
  };
  onAccountCreationRequest: () => void;
  onContinueExploring: () => void;
}

/**
 * Micro-Conversion Triggers Component - SCE-65 Implementation
 * 
 * Provides soft conversion nudges that:
 * - Use helpful language instead of pressure tactics
 * - Show value through user's own actions
 * - Respect user choice and timing
 * - Build on demonstrated interest rather than creating artificial scarcity
 */
export function MicroConversionTriggers({
  phase,
  investmentScore,
  engagementMetrics,
  onAccountCreationRequest,
  onContinueExploring,
}: MicroConversionTriggersProps) {
  const { timeSpent, favoritesCount, detailViewsCount } = engagementMetrics;

  // Don't show triggers in exploration phase
  if (phase === 'exploration') {
    return null;
  }

  // Investment Phase - Gentle Value Building
  if (phase === 'investment') {
    return (
      <section 
        className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 rounded-lg"
        role="region"
        aria-labelledby="investment-phase-title"
      >
        <Card className="bg-transparent border-blue-100">
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-6 h-6 text-blue-600" aria-hidden="true" />
                <h3 id="investment-phase-title" className="text-xl font-semibold text-blue-900">
                  <EducationalTooltip
                    content={{
                      term: 'Your Fragrance Journey is Taking Shape',
                      shortExplanation: 'You\'re learning about scents that match your personality',
                      detailedExplanation: 'As you explore and interact with recommendations, our AI learns more about your preferences. This builds a better understanding of what fragrances will work best for you.',
                      category: 'confidence_building',
                      confidence_building: 'Every interaction helps us find your perfect signature scent!'
                    }}
                    userLevel="beginner"
                    showConfidence
                  >
                    Your Fragrance Journey is Taking Shape! 🌟
                  </EducationalTooltip>
                </h3>
              </div>
              
              <p className="text-blue-800 max-w-2xl mx-auto">
                You've spent {timeSpent} minutes discovering your perfect matches. 
                Your engagement is helping us understand your unique preferences even better.
              </p>

            {/* Engagement Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6" role="group" aria-label="Your engagement summary">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-500" aria-hidden="true" />
                  <Badge 
                    variant="secondary" 
                    className="bg-blue-100 text-blue-800"
                    aria-label={`Time spent: ${timeSpent} minutes`}
                  >
                    {timeSpent} minutes
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Time invested in finding your perfect scents
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Heart className="w-5 h-5 text-red-500" aria-hidden="true" />
                  <Badge 
                    variant="secondary" 
                    className="bg-red-100 text-red-800"
                    aria-label={`Favorites saved: ${favoritesCount} fragrances`}
                  >
                    {favoritesCount} saved
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Fragrances that caught your attention
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <BookOpen className="w-5 h-5 text-purple-500" aria-hidden="true" />
                  <Badge 
                    variant="secondary" 
                    className="bg-purple-100 text-purple-800"
                    aria-label={`Details explored: ${detailViewsCount} fragrances`}
                  >
                    {detailViewsCount} explored
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Deep dives into fragrance details
                </p>
              </div>
            </div>

            {/* Gentle Value Proposition */}
            {investmentScore > 0.5 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg mt-6">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-800">
                    Based on your engagement, we've identified more perfect matches!
                  </span>
                </div>
                <p className="text-sm text-purple-700 mb-4">
                  Your detailed exploration shows you appreciate quality fragrances. 
                  There are additional matches that align perfectly with your developing profile.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-500 text-purple-700 hover:bg-purple-50"
                  onClick={() => {
                    // This could expand to show more recommendations
                    console.log('Show additional matches');
                  }}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Discover More Matches
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        </Card>
      </section>
    );
  }

  // Soft Conversion Phase - Natural Account Benefits
  if (phase === 'soft_conversion') {
    return (
      <section 
        className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg"
        role="region"
        aria-labelledby="soft-conversion-title"
      >
        <Card className="bg-transparent border-green-200">
          <CardContent className="py-8">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-2">
                <Shield className="w-7 h-7 text-green-600" aria-hidden="true" />
                <h3 id="soft-conversion-title" className="text-2xl font-bold text-green-900">
                  <EducationalTooltip
                    content={{
                      term: 'Save Your Discoveries',
                      shortExplanation: 'Keep your personalized fragrance matches safe and accessible',
                      detailedExplanation: 'Your quiz results and saved favorites represent valuable insights about your fragrance preferences. Creating a free account preserves this knowledge and improves future recommendations.',
                      category: 'confidence_building',
                      confidence_building: 'Your fragrance journey is unique and worth saving!'
                    }}
                    userLevel="beginner"
                    showConfidence
                  >
                    Ready to Save Your Discoveries? 💎
                  </EducationalTooltip>
                </h3>
              </div>
              
              <p className="text-green-800 text-lg max-w-2xl mx-auto">
                You've invested {timeSpent} minutes building your perfect fragrance collection. 
                A free account ensures you never lose this valuable work!
              </p>

            {/* Value Based on User Actions */}
            <div className="bg-white p-6 rounded-lg border border-green-200 max-w-3xl mx-auto">
              <h4 className="font-bold text-green-800 mb-4">
                Here's What You've Accomplished:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start space-x-3">
                  <Heart className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">
                      {favoritesCount} Perfect Matches Saved
                    </span>
                    <p className="text-sm text-gray-600">
                      Don't lose these carefully curated favorites
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">
                      {timeSpent} Minutes of Discovery
                    </span>
                    <p className="text-sm text-gray-600">
                      Your personalized fragrance insights
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <BookOpen className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">
                      Deep Fragrance Knowledge
                    </span>
                    <p className="text-sm text-gray-600">
                      Understanding of what makes scents perfect for you
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">
                      Refined Preferences
                    </span>
                    <p className="text-sm text-gray-600">
                      Your taste profile is becoming clearer
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Benefits - Practical Focus */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3 mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Keep Your Progress</span>
                </div>
                <p className="text-sm text-gray-600">
                  Your favorites, insights, and fragrance journey stay safe forever
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-green-800">Enhanced Matching</span>
                </div>
                <p className="text-sm text-gray-600">
                  Better recommendations as we learn your preferences
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3 mb-2">
                  <Gift className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-green-800">Sample Discounts</span>
                </div>
                <p className="text-sm text-gray-600">
                  20% off your first sample order to try before you buy
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3 mb-2">
                  <Star className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-green-800">Reorder Easily</span>
                </div>
                <p className="text-sm text-gray-600">
                  Quick access to your proven favorites when you need them
                </p>
              </div>
            </div>

            {/* Respectful Call-to-Action */}
            <div className="space-y-4 max-w-md mx-auto">
              <Button
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 text-lg"
                onClick={onAccountCreationRequest}
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Create Free Account
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-gray-600 hover:text-gray-800"
                onClick={onContinueExploring}
              >
                Continue exploring (progress won't be saved)
              </Button>
            </div>

            {/* Honest Disclosure */}
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Free account • No spam • Cancel anytime • Your data stays private
            </p>
          </div>
        </CardContent>
        </Card>
      </section>
    );
  }

  return null;
}

/**
 * Key Design Principles:
 * 
 * 1. **Value-First Messaging**: Shows benefits based on user's actual engagement
 * 2. **Respectful Tone**: "Ready to save?" vs "You must create an account"
 * 3. **Progress Celebration**: Highlights what the user has accomplished
 * 4. **Clear Benefits**: Practical advantages without exaggeration
 * 5. **Honest Communication**: Transparent about what happens without account
 * 6. **No Artificial Scarcity**: No countdown timers or limited-time pressure
 * 7. **Easy Exit**: Clear option to continue without judgment
 */