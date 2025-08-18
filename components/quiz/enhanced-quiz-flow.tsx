'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedEmotionalQuiz } from './enhanced-emotional-quiz';
import {
  authenticPersonalityProfiles,
  matchPersonalityProfile,
} from '@/lib/personality/authentic-profiles';
import { Sparkles, Heart, Zap, Share2, ArrowRight } from 'lucide-react';

interface EnhancedQuizFlowProps {
  // No props needed for now
}

export function EnhancedQuizFlow({}: EnhancedQuizFlowProps = {}) {
  const [quizResponses, setQuizResponses] = useState<any[]>([]);
  const [personalityProfile, setPersonalityProfile] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleQuizComplete = async (responses: any[]) => {
    setQuizResponses(responses);
    setIsAnalyzing(true);

    // Simulate AI analysis time for better UX
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Match personality profile
    const matchedProfile = matchPersonalityProfile(responses);
    setPersonalityProfile(matchedProfile);
    setIsAnalyzing(false);
    setShowResults(true);

    // Track completion
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'enhanced_emotional_quiz_complete', {
        personality_type: matchedProfile.id,
        question_count: responses.length,
        quiz_version: 'enhanced_emotional_v1',
      });
    }
  };

  const handleGetRecommendations = () => {
    // Handle conversion to recommendations page
    console.log('Getting recommendations for:', personalityProfile.name);
    // Could navigate to recommendations page or show inline recommendations
  };

  // Show loading state during analysis
  if (isAnalyzing) {
    return (
      <Card className='max-w-2xl mx-auto shadow-xl border-0 bg-gradient-to-br from-purple-50 to-pink-50'>
        <CardContent className='text-center py-16'>
          <div className='relative mb-8'>
            <div className='animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto' />
            <Sparkles className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-purple-500' />
          </div>
          <h3 className='text-2xl font-semibold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
            Discovering Your Fragrance Soul...
          </h3>
          <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
            Our AI is weaving together your emotional responses to reveal your
            authentic fragrance identity
          </p>
          <div className='space-y-3 text-sm text-muted-foreground'>
            <div className='flex items-center justify-center space-x-2'>
              <Heart className='w-4 h-4 text-pink-500' />
              <span>Analyzing emotional resonance patterns</span>
            </div>
            <div className='flex items-center justify-center space-x-2'>
              <Zap className='w-4 h-4 text-purple-500' />
              <span>Matching with authentic personality archetypes</span>
            </div>
            <div className='flex items-center justify-center space-x-2'>
              <Sparkles className='w-4 h-4 text-indigo-500' />
              <span>Curating your personalized fragrance journey</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show personality results
  if (showResults && personalityProfile) {
    return (
      <div className='max-w-3xl mx-auto space-y-8'>
        {/* Personality Reveal */}
        <Card className='shadow-xl border-0 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 overflow-hidden'>
          <CardContent className='py-12 px-8'>
            <div className='text-center mb-8'>
              <Badge className='px-4 py-2 mb-4 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200'>
                <Sparkles className='w-4 h-4 mr-2' />
                Your Fragrance Personality
              </Badge>

              <h2 className='text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent'>
                {personalityProfile.name}
              </h2>

              <p className='text-xl text-muted-foreground italic mb-6'>
                {personalityProfile.archetype}
              </p>
            </div>

            {/* Personality Description */}
            <div className='prose prose-lg mx-auto text-center leading-relaxed'>
              <p className='text-gray-700 whitespace-pre-line'>
                {personalityProfile.description}
              </p>
            </div>

            {/* Key Traits */}
            <div className='mt-8 text-center'>
              <h4 className='font-semibold text-lg mb-4 text-gray-800'>
                Your Signature Traits
              </h4>
              <div className='flex flex-wrap justify-center gap-2'>
                {personalityProfile.keyTraits.map((trait: string) => (
                  <Badge
                    key={trait}
                    variant='outline'
                    className='px-3 py-1 bg-white/80 capitalize'
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Fragrance Personality */}
            <div className='mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100'>
              <h4 className='font-semibold text-lg mb-3 text-center text-purple-800'>
                <Heart className='w-5 h-5 inline mr-2' />
                Your Fragrance Journey
              </h4>
              <p className='text-center text-gray-700 italic leading-relaxed'>
                {personalityProfile.fragrancePersonality}
              </p>
            </div>

            {/* Social Style */}
            <div className='mt-6 text-center'>
              <div className='inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border border-amber-200'>
                <Zap className='w-4 h-4 mr-2 text-amber-600' />
                <span className='text-amber-800 font-medium'>
                  Your energy: {personalityProfile.lifestyle.energy}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scent Profile Preview */}
        <Card className='shadow-lg border-0 bg-gradient-to-r from-white to-gray-50'>
          <CardContent className='py-8 px-6'>
            <h3 className='text-2xl font-semibold text-center mb-6 text-gray-800'>
              Your Scent Profile
            </h3>

            <div className='grid md:grid-cols-3 gap-6'>
              <div className='text-center'>
                <h4 className='font-semibold text-green-700 mb-3'>
                  ✨ You Love
                </h4>
                <div className='space-y-2'>
                  {personalityProfile.scentProfile.primary.map(
                    (scent: string) => (
                      <Badge
                        key={scent}
                        className='block bg-green-100 text-green-800 hover:bg-green-200'
                      >
                        {scent}
                      </Badge>
                    )
                  )}
                </div>
              </div>

              <div className='text-center'>
                <h4 className='font-semibold text-blue-700 mb-3'>
                  🌟 You Might Like
                </h4>
                <div className='space-y-2'>
                  {personalityProfile.scentProfile.secondary.map(
                    (scent: string) => (
                      <Badge
                        key={scent}
                        variant='outline'
                        className='block border-blue-200 text-blue-700 hover:bg-blue-50'
                      >
                        {scent}
                      </Badge>
                    )
                  )}
                </div>
              </div>

              <div className='text-center'>
                <h4 className='font-semibold text-gray-600 mb-3'>
                  ⚠️ Probably Skip
                </h4>
                <div className='space-y-2'>
                  {personalityProfile.scentProfile.avoid.map(
                    (scent: string) => (
                      <Badge
                        key={scent}
                        variant='secondary'
                        className='block bg-gray-100 text-gray-600'
                      >
                        {scent}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className='shadow-xl border-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white'>
          <CardContent className='py-8 px-6 text-center'>
            <h3 className='text-2xl font-bold mb-4'>
              Ready to Find Your Perfect Matches?
            </h3>
            <p className='text-purple-100 mb-6 text-lg leading-relaxed'>
              Get personalized fragrance recommendations curated specifically
              for {personalityProfile.name}
            </p>

            <div className='space-y-4'>
              <Button
                onClick={handleGetRecommendations}
                size='lg'
                className='bg-white text-purple-600 hover:bg-gray-50 px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300'
              >
                <ArrowRight className='w-5 h-5 mr-2' />
                See My Fragrance Matches
              </Button>

              <div className='flex items-center justify-center space-x-6 text-sm text-purple-100'>
                <div className='flex items-center space-x-1'>
                  <span>🎯</span>
                  <span>Personalized for you</span>
                </div>
                <div className='flex items-center space-x-1'>
                  <span>🧪</span>
                  <span>Samples available</span>
                </div>
                <div className='flex items-center space-x-1'>
                  <span>✨</span>
                  <span>Risk-free discovery</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Results Option */}
        <div className='text-center'>
          <Button
            variant='ghost'
            className='text-muted-foreground hover:text-purple-600 transition-colors'
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `I'm ${personalityProfile.name}!`,
                  text: `I just discovered my fragrance personality: ${personalityProfile.name} - ${personalityProfile.archetype}`,
                  url: window.location.href,
                });
              }
            }}
          >
            <Share2 className='w-4 h-4 mr-2' />
            Share Your Personality
          </Button>
        </div>
      </div>
    );
  }

  // Show the enhanced emotional quiz
  return <EnhancedEmotionalQuiz onComplete={handleQuizComplete} />;
}
