'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
// Using a simple progress bar since Progress component not available
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);
import {
  Sparkles,
  Heart,
  Clock,
  Star,
  Gift,
  ArrowRight,
  BookOpen,
  TrendingUp,
  Users
} from 'lucide-react';
import { trackGuestEngagement, buildProgressiveValue, triggerNaturalConversion } from '@/lib/actions/guest-engagement';
import { FragranceRecommendationDisplay } from './fragrance-recommendation-display';

interface ProgressiveEngagementFlowProps {
  quizResults: {
    quiz_session_token: string;
    recommendations: any[];
    processing_time_ms?: number;
    recommendation_method?: string;
    personality_profile?: any;
  };
  onAccountCreationRequest: () => void;
  onContinueAsGuest: () => void;
}

type EngagementPhase = 'exploration' | 'investment' | 'conversion' | 'retention';

/**
 * Progressive Engagement Flow Component
 * 
 * Eliminates forced account creation by building user investment through:
 * 1. Immediate value delivery (quiz results without barriers)
 * 2. Progressive value building based on engagement
 * 3. Natural conversion prompts at optimal moments
 * 4. Seamless guest-to-account transition
 */
export function ProgressiveEngagementFlow({
  quizResults,
  onAccountCreationRequest,
  onContinueAsGuest
}: ProgressiveEngagementFlowProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<EngagementPhase>('exploration');
  const [investmentScore, setInvestmentScore] = useState(0);
  const [engagementEvents, setEngagementEvents] = useState<any[]>([]);
  const [progressiveValue, setProgressiveValue] = useState<any>(null);
  const [conversionTriggerShown, setConversionTriggerShown] = useState(false);
  const [sessionStartTime] = useState(Date.now());

  // Track initial session start
  useEffect(() => {
    trackEngagement({
      type: 'time_spent',
      duration_seconds: 0,
      timestamp: Date.now()
    });
  }, []);

  // Track time spent and update investment score
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
      trackEngagement({
        type: 'time_spent',
        duration_seconds: timeSpent,
        timestamp: Date.now()
      });
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Update progressive value based on phase
  useEffect(() => {
    updateProgressiveValue();
  }, [phase, investmentScore]);

  // Check for conversion trigger opportunities
  useEffect(() => {
    if (investmentScore > 0.6 && !conversionTriggerShown && phase === 'investment') {
      checkConversionTrigger();
    }
  }, [investmentScore, conversionTriggerShown, phase]);

  const trackEngagement = async (event: any) => {
    const newEvents = [...engagementEvents, event];
    setEngagementEvents(newEvents);

    try {
      const result = await trackGuestEngagement({
        session_token: quizResults.quiz_session_token,
        engagement_events: newEvents
      });

      if (result.tracking_successful) {
        setInvestmentScore(result.investment_score);
        
        // Update phase based on investment score
        if (result.investment_score > 0.6 && phase !== 'conversion') {
          setPhase('conversion');
        } else if (result.investment_score > 0.3 && phase === 'exploration') {
          setPhase('investment');
        }
      }
    } catch (error) {
      console.error('Error tracking engagement:', error);
    }
  };

  const updateProgressiveValue = async () => {
    try {
      // Only call with valid phases
      const validPhases = ['exploration', 'investment', 'conversion'] as const;
      const currentPhase = validPhases.includes(phase as any) ? phase as typeof validPhases[number] : 'exploration';
      const value = await buildProgressiveValue(quizResults.quiz_session_token, currentPhase);
      setProgressiveValue(value);
    } catch (error) {
      console.error('Error building progressive value:', error);
    }
  };

  const checkConversionTrigger = async () => {
    try {
      const trigger = await triggerNaturalConversion({
        trigger: 'high_engagement',
        context: 'extended_exploration_with_favorites',
        investment_score: investmentScore,
        timing: 'perfect'
      });

      if (trigger.trigger_appropriate) {
        setConversionTriggerShown(true);
      }
    } catch (error) {
      console.error('Error checking conversion trigger:', error);
    }
  };

  const handleFragranceInteraction = (action: string, fragranceId: string, metadata?: any) => {
    trackEngagement({
      type: action as any,
      fragrance_id: fragranceId,
      timestamp: Date.now(),
      ...metadata
    });
  };

  const handleAccountCreation = () => {
    trackEngagement({
      type: 'conversion_initiated',
      timestamp: Date.now(),
      investment_score: investmentScore
    });
    onAccountCreationRequest();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progressive Value Header */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <CardTitle className="text-2xl text-purple-900">
              {getPhaseTitle(phase, investmentScore)}
            </CardTitle>
          </div>
          <p className="text-purple-700">
            {getPhaseDescription(phase, investmentScore)}
          </p>
          
          {/* Investment Progress Indicator */}
          {phase !== 'exploration' && (
            <div className="mt-4 max-w-md mx-auto">
              <div className="flex justify-between text-sm text-purple-600 mb-1">
                <span>Fragrance Journey Progress</span>
                <span>{Math.round(investmentScore * 100)}%</span>
              </div>
              <Progress value={investmentScore * 100} className="h-2" />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Main Recommendations Display */}
      <FragranceRecommendationDisplay
        recommendations={quizResults.recommendations}
        onSampleOrder={(fragranceId) => {
          handleFragranceInteraction('sample_interest', fragranceId, {
            interest_level: 'high'
          });
        }}
        onLearnMore={(fragranceId) => {
          const startTime = Date.now();
          router.push(`/fragrance/${fragranceId}`);
          
          // Track detailed view when they return (approximate)
          setTimeout(() => {
            handleFragranceInteraction('fragrance_detail_view', fragranceId, {
              duration_seconds: Math.floor((Date.now() - startTime) / 1000)
            });
          }, 5000);
        }}
        onSaveToFavorites={(fragranceId) => {
          handleFragranceInteraction('favorite_added', fragranceId);
        }}
      />

      {/* Progressive Value Building Section */}
      {phase === 'investment' && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold">Your Fragrance Profile is Developing</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2 justify-center">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>
                    {Math.floor((Date.now() - sessionStartTime) / 60000)} minutes invested
                  </span>
                </div>
                <div className="flex items-center space-x-2 justify-center">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span>
                    {engagementEvents.filter(e => e.type === 'favorite_added').length} favorites saved
                  </span>
                </div>
                <div className="flex items-center space-x-2 justify-center">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <span>
                    {engagementEvents.filter(e => e.type === 'fragrance_detail_view').length} detailed views
                  </span>
                </div>
              </div>

              {/* Progressive disclosure of additional value */}
              {investmentScore > 0.4 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <p className="text-blue-800 mb-2">
                    🔥 Based on your engagement, we've identified 2 more perfect matches!
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-blue-500 text-blue-700"
                    onClick={() => {
                      handleFragranceInteraction('additional_recommendations_viewed', 'enhanced');
                      // Would load additional recommendations here
                    }}
                  >
                    Discover More Matches
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Natural Conversion Trigger */}
      {(phase === 'conversion' || conversionTriggerShown) && (
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Gift className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold text-green-900">
                  Ready to Save Your Fragrance Journey?
                </h3>
              </div>
              
              <p className="text-green-800 max-w-2xl mx-auto">
                You've invested {Math.floor((Date.now() - sessionStartTime) / 60000)} minutes 
                discovering your perfect matches. Create a free account to save your progress 
                and unlock exclusive benefits!
              </p>

              {/* Value proposition based on engagement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="font-medium">Save Your Progress</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Don't lose your {engagementEvents.filter(e => e.type === 'favorite_added').length} favorites 
                    and personalized insights
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <span className="font-medium">Unlock 15+ Matches</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Get access to your complete personalized fragrance collection
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <Gift className="w-5 h-5 text-green-500" />
                    <span className="font-medium">20% Off Samples</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Exclusive discount on your first sample order
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">Reorder & Track</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Easy reordering and fragrance journey tracking
                  </p>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4"
                  onClick={handleAccountCreation}
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Save My Fragrance Journey - Free Account
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-gray-600 hover:text-gray-800"
                  onClick={() => {
                    trackEngagement({
                      type: 'continue_as_guest',
                      timestamp: Date.now(),
                      investment_score: investmentScore
                    });
                    onContinueAsGuest();
                  }}
                >
                  Continue exploring (limited features)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Proof and Gentle FOMO */}
      {phase !== 'exploration' && (
        <Card className="bg-gray-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span>2,847 people with your profile created accounts this month</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>Average 4.9/5 satisfaction rating</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper functions

function getPhaseTitle(phase: EngagementPhase, investmentScore: number): string {
  switch (phase) {
    case 'exploration':
      return 'Your Perfect Fragrance Matches';
    case 'investment':
      return investmentScore > 0.5 
        ? 'Discovering Your Fragrance DNA' 
        : 'Building Your Scent Profile';
    case 'conversion':
      return 'Your Fragrance Journey Awaits';
    default:
      return 'Your Fragrance Matches';
  }
}

function getPhaseDescription(phase: EngagementPhase, investmentScore: number): string {
  switch (phase) {
    case 'exploration':
      return 'Here are your top 3 personalized fragrance recommendations based on your quiz responses';
    case 'investment':
      return investmentScore > 0.5
        ? 'Your engagement is helping us refine your fragrance profile for even better matches'
        : 'The more you explore, the better we understand your fragrance preferences';
    case 'conversion':
      return 'You\'ve invested time in discovering your perfect matches - let\'s make sure you don\'t lose them!';
    default:
      return 'Discover your perfect fragrances';
  }
}