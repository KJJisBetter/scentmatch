'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Share2,
  Download,
  Copy,
  Twitter,
  Instagram,
  Facebook,
  Sparkles,
  Target,
  Brain,
  Heart,
  Star,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { shareCollection } from '@/lib/actions/social-sharing';
import type { SharePlatform } from '@/lib/types/collection-analytics';
import type { RecommendationItem as FragranceRecommendation } from '@/lib/ai-sdk/unified-recommendation-engine';

interface QuizResultsShareData {
  user: {
    firstName: string;
    initials: string;
  };
  quiz_results: {
    session_token: string;
    completion_date: string;
    processing_time: number;
    recommendation_method: string;
  };
  recommendations: FragranceRecommendation[];
  personality_profile: {
    primary_traits: string[];
    scent_families: string[];
    intensity_preference: string;
    complexity_style: string;
    confidence_score: number;
  };
  quiz_accuracy: {
    match_scores: number[];
    average_match: number;
    confidence_level: 'high' | 'medium' | 'low';
  };
}

interface QuizResultsShareProps {
  quizResults: QuizResultsShareData;
  theme?: 'personality' | 'recommendations' | 'insights';
  compact?: boolean;
  viewOnly?: boolean;
}

/**
 * Quiz Results Share Component - Task 3.1 (Phase 1C)
 *
 * Creates shareable cards for quiz results with personality insights.
 * Optimized for viral sharing with beautiful visuals and compelling copy.
 *
 * Features:
 * - Multiple sharing themes (personality focus, recommendations focus, insights focus)
 * - Platform-optimized content generation
 * - Beautiful personality visualization
 * - Quiz accuracy and confidence display
 * - Viral call-to-action messaging
 * - Social media image optimization
 */
export function QuizResultsShare({
  quizResults,
  theme = 'personality',
  compact = false,
  viewOnly = false,
}: QuizResultsShareProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const {
    user,
    quiz_results,
    recommendations,
    personality_profile,
    quiz_accuracy,
  } = quizResults;

  // Get theme-specific styling
  const getThemeStyles = () => {
    switch (theme) {
      case 'recommendations':
        return {
          gradient: 'from-blue-400 via-purple-500 to-pink-500',
          accent: 'text-blue-600',
          icon: Target,
          title: 'My Perfect Fragrance Matches',
        };
      case 'insights':
        return {
          gradient: 'from-green-400 via-blue-500 to-purple-600',
          accent: 'text-green-600',
          icon: Brain,
          title: 'My Fragrance Personality',
        };
      case 'personality':
      default:
        return {
          gradient: 'from-purple-400 via-pink-500 to-red-500',
          accent: 'text-purple-600',
          icon: Sparkles,
          title: 'My Scent Profile Revealed',
        };
    }
  };

  const themeStyles = getThemeStyles();
  const ThemeIcon = themeStyles.icon;

  // Handle sharing
  const handleShare = async (platform: string) => {
    if (viewOnly) return;

    setIsSharing(true);

    try {
      const shareResult = await shareCollection({
        collection_data: {
          user_name: user.firstName,
          collection_summary: {
            total_items: recommendations.length,
            top_fragrances: recommendations.slice(0, 3).map(r => ({
              id: r.fragrance_id,
              name: r.name,
              brand: r.brand,
            })),
            dominant_families: personality_profile.scent_families || [],
            personality_traits: personality_profile.primary_traits || [],
          },
          share_card_theme: theme,
        },
        quiz_session_token: quiz_results.session_token,
        quiz_theme: theme,
        recommendations: recommendations.slice(0, 3),
        personality_summary: {
          traits: personality_profile.primary_traits,
          families: personality_profile.scent_families,
          confidence: personality_profile.confidence_score,
        },
        share_type: 'quiz_results',
        platform,
      });

      if (shareResult.success) {
        // Platform-specific actions
        switch (platform) {
          case 'twitter':
            handleTwitterShare();
            break;
          case 'instagram':
            handleInstagramShare();
            break;
          case 'facebook':
            handleFacebookShare();
            break;
          case 'direct_link':
            handleCopyLink(shareResult.share_url);
            break;
        }
      }
    } catch (error) {
      console.error('Quiz share error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // Handle download functionality
  const handleDownload = async () => {
    // TODO: Implement image download functionality
    // This could use html2canvas or similar library to capture the quiz results as an image
    console.log('Download functionality not yet implemented');
  };

  // Platform sharing methods
  const handleTwitterShare = () => {
    const traits = personality_profile.primary_traits.slice(0, 2).join(' & ');
    const avgMatch = Math.round(quiz_accuracy.average_match);
    const text = `Just discovered my fragrance personality! 🌸 I'm ${traits} with ${avgMatch}% average match accuracy. What's your scent profile? Take the quiz at ScentMatch! #FragrancePersonality #ScentMatch`;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleInstagramShare = () => {
    const traits = personality_profile.primary_traits.slice(0, 3).join(', ');
    const families = personality_profile.scent_families.slice(0, 2).join(' & ');
    const text = `My Fragrance Personality ✨\n\n🎯 Personality: ${traits}\n🌸 Favorite Families: ${families}\n📊 Quiz Accuracy: ${Math.round(quiz_accuracy.average_match)}%\n\nDiscover your scent match 👆 Link in bio\n\n#scentmatch #fragrancepersonality #perfumeaddict #signaturescent`;

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handleFacebookShare = () => {
    const text = `I just took the ScentMatch fragrance personality quiz and the results are spot on! My fragrance personality is ${personality_profile.primary_traits.slice(0, 2).join(' & ')} with a ${Math.round(quiz_accuracy.average_match)}% match accuracy. If you're looking for your signature scent, you should try it!`;

    const fbUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = (shareUrl?: string) => {
    const url =
      shareUrl ||
      `${window.location.origin}/quiz/results/${quiz_results.session_token}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Get confidence styling
  const getConfidenceStyle = (level: string) => {
    switch (level) {
      case 'high':
        return { color: 'text-green-600', bg: 'bg-green-100', icon: '🎯' };
      case 'medium':
        return { color: 'text-blue-600', bg: 'bg-blue-100', icon: '📊' };
      default:
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '🔍' };
    }
  };

  const confidenceStyle = getConfidenceStyle(quiz_accuracy.confidence_level);

  return (
    <div className='space-y-4'>
      {/* Shareable Quiz Results Card */}
      <Card
        ref={cardRef}
        className={`overflow-hidden shadow-xl max-w-lg mx-auto bg-gradient-to-br ${
          compact ? 'scale-90' : ''
        }`}
        style={{
          background: `linear-gradient(135deg, ${
            theme === 'personality'
              ? '#8B5CF6, #EC4899, #EF4444'
              : theme === 'recommendations'
                ? '#3B82F6, #8B5CF6, #EC4899'
                : '#10B981, #3B82F6, #8B5CF6'
          })`,
        }}
      >
        <CardContent className='p-0 text-white'>
          {/* Header */}
          <div className='p-6 pb-4'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-3'>
                <div className='w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center'>
                  <ThemeIcon className='w-6 h-6' />
                </div>
                <div>
                  <h3 className='text-xl font-bold'>
                    {user.firstName}'s Results
                  </h3>
                  <div className='text-sm opacity-90'>{themeStyles.title}</div>
                </div>
              </div>

              <div className='text-right text-sm opacity-75'>
                <div className='font-semibold'>ScentMatch</div>
                <div className='text-xs'>AI Fragrance Quiz</div>
              </div>
            </div>

            {/* Quiz Accuracy Display */}
            <div className='bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <div className='text-2xl font-bold'>
                    {Math.round(quiz_accuracy.average_match)}%
                  </div>
                  <div className='text-sm opacity-90'>Average Match Score</div>
                </div>
                <div className='text-right'>
                  <div
                    className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full ${confidenceStyle.bg}`}
                  >
                    <span className='text-xs'>{confidenceStyle.icon}</span>
                    <span
                      className={`text-xs font-medium ${confidenceStyle.color}`}
                    >
                      {quiz_accuracy.confidence_level} confidence
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content varies by theme */}
          {theme === 'personality' && (
            <div className='px-6 pb-4'>
              <h4 className='font-bold mb-3'>My Fragrance Personality</h4>

              {/* Personality Traits */}
              <div className='space-y-3'>
                <div>
                  <div className='text-sm opacity-90 mb-2'>Primary Traits</div>
                  <div className='flex flex-wrap gap-2'>
                    {personality_profile.primary_traits
                      .slice(0, 3)
                      .map(trait => (
                        <Badge
                          key={trait}
                          className='bg-white/20 text-white border-white/30'
                        >
                          {trait}
                        </Badge>
                      ))}
                  </div>
                </div>

                <div>
                  <div className='text-sm opacity-90 mb-2'>
                    Favorite Families
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {personality_profile.scent_families
                      .slice(0, 3)
                      .map(family => (
                        <Badge
                          key={family}
                          className='bg-white/20 text-white border-white/30'
                        >
                          {family}
                        </Badge>
                      ))}
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <div className='opacity-90'>Intensity Style</div>
                    <div className='font-medium capitalize'>
                      {personality_profile.intensity_preference}
                    </div>
                  </div>
                  <div>
                    <div className='opacity-90'>Complexity</div>
                    <div className='font-medium capitalize'>
                      {personality_profile.complexity_style}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {theme === 'recommendations' && (
            <div className='px-6 pb-4'>
              <h4 className='font-bold mb-3'>My Perfect Matches</h4>

              <div className='space-y-3'>
                {recommendations.slice(0, 3).map((rec, index) => (
                  <div
                    key={rec.fragrance_id}
                    className='flex items-center space-x-3 bg-white/10 rounded-lg p-3'
                  >
                    <div className='w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold'>
                      {index + 1}
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='font-medium truncate'>{rec.name}</div>
                      <div className='text-sm opacity-90 truncate'>
                        {rec.brand}
                      </div>
                    </div>

                    <div className='text-right'>
                      <div className='font-bold'>
                        {Math.round((rec.score || 0) * 100)}%
                      </div>
                      <div className='text-xs opacity-75'>match</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className='mt-4 text-center'>
                <div className='text-sm opacity-90'>
                  Discovered {recommendations.length} perfect matches in{' '}
                  {Math.round(quiz_results.processing_time / 1000)}s
                </div>
              </div>
            </div>
          )}

          {theme === 'insights' && (
            <div className='px-6 pb-4'>
              <h4 className='font-bold mb-3'>What I Learned</h4>

              <div className='space-y-4'>
                {/* Key Insights */}
                <div className='bg-white/10 rounded-lg p-4 space-y-3'>
                  <div className='flex items-center space-x-2'>
                    <Brain className='w-4 h-4' />
                    <span className='font-medium'>Personality Discovery</span>
                  </div>
                  <div className='text-sm'>
                    I'm drawn to{' '}
                    <strong>
                      {personality_profile.scent_families
                        .slice(0, 2)
                        .join(' and ')}
                    </strong>{' '}
                    fragrances with a{' '}
                    <strong>{personality_profile.intensity_preference}</strong>{' '}
                    intensity preference.
                  </div>
                </div>

                <div className='bg-white/10 rounded-lg p-4 space-y-3'>
                  <div className='flex items-center space-x-2'>
                    <Target className='w-4 h-4' />
                    <span className='font-medium'>AI Accuracy</span>
                  </div>
                  <div className='text-sm'>
                    The AI achieved{' '}
                    <strong>
                      {Math.round(quiz_accuracy.average_match)}% average
                      accuracy
                    </strong>
                    with <strong>{quiz_accuracy.confidence_level}</strong>{' '}
                    confidence in my matches.
                  </div>
                </div>

                <div className='bg-white/10 rounded-lg p-4 space-y-3'>
                  <div className='flex items-center space-x-2'>
                    <Sparkles className='w-4 h-4' />
                    <span className='font-medium'>Style Profile</span>
                  </div>
                  <div className='text-sm'>
                    My fragrance personality is{' '}
                    <strong>
                      {personality_profile.primary_traits
                        .slice(0, 2)
                        .join(' & ')}
                    </strong>
                    with <strong>{personality_profile.complexity_style}</strong>{' '}
                    complexity preferences.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quiz Stats Footer */}
          <div className='px-6 pb-4'>
            <div className='grid grid-cols-3 gap-4 text-center text-sm'>
              <div>
                <div className='font-bold text-lg'>
                  {recommendations.length}
                </div>
                <div className='opacity-75'>Matches Found</div>
              </div>
              <div>
                <div className='font-bold text-lg'>
                  {Math.round(quiz_accuracy.average_match)}%
                </div>
                <div className='opacity-75'>Accuracy</div>
              </div>
              <div>
                <div className='font-bold text-lg'>
                  {personality_profile.confidence_score}
                </div>
                <div className='opacity-75'>Profile Score</div>
              </div>
            </div>
          </div>

          {/* Call to Action Footer */}
          <div className='bg-black/20 p-6 text-center backdrop-blur-sm'>
            <div className='space-y-2'>
              <div className='font-bold text-lg'>Find Your Signature Scent</div>
              <div className='text-sm opacity-90'>
                Take the free AI quiz and discover your perfect fragrance
                matches
              </div>
              <div className='text-xs opacity-75'>
                scentmatch.com • 3-minute quiz • Personalized recommendations
              </div>
            </div>
          </div>

          {/* Subtle Branding */}
          <div className='absolute top-4 right-4 opacity-50'>
            <div className='w-8 h-8 bg-white/20 rounded-full flex items-center justify-center'>
              <Sparkles className='w-4 h-4' />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sharing Controls */}
      {!viewOnly && (
        <div className='flex items-center justify-center space-x-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={isSharing}
                className={`bg-gradient-to-r ${themeStyles.gradient} hover:opacity-90`}
              >
                <Share2 className='w-4 h-4 mr-2' />
                {isSharing ? 'Sharing...' : 'Share My Results'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-52'>
              <DropdownMenuItem onClick={() => handleShare('twitter')}>
                <Twitter className='w-4 h-4 mr-2 text-blue-500' />
                Share on Twitter
                <Badge variant='secondary' className='ml-auto text-xs'>
                  Popular
                </Badge>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleShare('instagram')}>
                <Instagram className='w-4 h-4 mr-2 text-pink-500' />
                Copy for Instagram Stories
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleShare('facebook')}>
                <Facebook className='w-4 h-4 mr-2 text-blue-600' />
                Share on Facebook
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => handleShare('direct_link')}>
                <Copy className='w-4 h-4 mr-2' />
                Copy Results Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant='outline'
            onClick={handleDownload}
            className='border-purple-300 text-purple-700 hover:bg-purple-50'
          >
            <Download className='w-4 h-4 mr-2' />
            Save Image
          </Button>
        </div>
      )}

      {/* Copy Success Feedback */}
      {copySuccess && (
        <div className='text-center'>
          <div className='inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm'>
            <Copy className='w-4 h-4' />
            <span>Copied for sharing!</span>
          </div>
        </div>
      )}

      {/* Theme Selector */}
      {!viewOnly && !compact && (
        <Card className='bg-gray-50 border-gray-200'>
          <CardContent className='pt-4'>
            <div className='space-y-3'>
              <h5 className='font-medium text-gray-800'>Sharing Style</h5>
              <div className='grid grid-cols-3 gap-2'>
                <Button
                  variant={theme === 'personality' ? 'default' : 'outline'}
                  size='sm'
                  className='flex-col h-16 p-2 text-xs'
                  onClick={() => {
                    /* Would update theme */
                  }}
                >
                  <Sparkles className='w-4 h-4 mb-1' />
                  Personality
                </Button>

                <Button
                  variant={theme === 'recommendations' ? 'default' : 'outline'}
                  size='sm'
                  className='flex-col h-16 p-2 text-xs'
                  onClick={() => {
                    /* Would update theme */
                  }}
                >
                  <Target className='w-4 h-4 mb-1' />
                  Matches
                </Button>

                <Button
                  variant={theme === 'insights' ? 'default' : 'outline'}
                  size='sm'
                  className='flex-col h-16 p-2 text-xs'
                  onClick={() => {
                    /* Would update theme */
                  }}
                >
                  <Brain className='w-4 h-4 mb-1' />
                  Insights
                </Button>
              </div>

              <div className='text-xs text-gray-600 text-center'>
                Choose how to present your quiz results for sharing
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Viral Mechanics Info */}
      {!viewOnly && (
        <Card className='bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'>
          <CardContent className='pt-4'>
            <div className='space-y-2'>
              <h5 className='font-medium text-purple-800 flex items-center'>
                <TrendingUp className='w-4 h-4 mr-2' />
                Sharing Rewards
              </h5>
              <div className='grid md:grid-cols-2 gap-2 text-sm text-purple-700'>
                <div>• Get +100 engagement points per share</div>
                <div>• Unlock community features faster</div>
                <div>• Help friends discover their scent matches</div>
                <div>• Join our fragrance community network</div>
              </div>
              <div className='text-xs text-purple-600 mt-2'>
                <strong>Bonus:</strong> First 10 shares unlock premium insights
                features!
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Utility functions for quiz sharing
export const quizShareUtils = {
  /**
   * Generate quiz results sharing data
   */
  generateQuizShareData: (
    quizResults: any,
    userProfile: any,
    personalityInsights?: any
  ): QuizResultsShareData => {
    return {
      user: {
        firstName: userProfile.first_name || 'User',
        initials:
          (userProfile.first_name?.[0] || 'U') +
          (userProfile.last_name?.[0] || ''),
      },
      quiz_results: {
        session_token: quizResults.quiz_session_token,
        completion_date: new Date().toISOString(),
        processing_time: quizResults.processing_time_ms || 3000,
        recommendation_method:
          quizResults.recommendation_method || 'unified_ai',
      },
      recommendations: quizResults.recommendations || [],
      personality_profile: {
        primary_traits: personalityInsights?.primary_traits || [
          'sophisticated',
          'adventurous',
        ],
        scent_families: personalityInsights?.dominant_families || [
          'oriental',
          'woody',
        ],
        intensity_preference:
          personalityInsights?.intensity_preference || 'moderate',
        complexity_style: personalityInsights?.complexity_style || 'varied',
        confidence_score: personalityInsights?.confidence_score || 85,
      },
      quiz_accuracy: {
        match_scores:
          quizResults.recommendations?.map((r: any) =>
            Math.round((r.score || 0) * 100)
          ) || [],
        average_match:
          quizResults.recommendations?.length > 0
            ? Math.round(
                (quizResults.recommendations.reduce(
                  (sum: number, r: any) => sum + (r.score || 0),
                  0
                ) /
                  quizResults.recommendations.length) *
                  100
              )
            : 85,
        confidence_level: 'high' as const, // Would calculate based on recommendation confidence
      },
    };
  },

  /**
   * Generate platform-optimized sharing text
   */
  generateSharingText: (
    data: QuizResultsShareData,
    platform: string,
    theme: string
  ) => {
    const { user, personality_profile, quiz_accuracy } = data;
    const traits = personality_profile.primary_traits.slice(0, 2).join(' & ');
    const avgMatch = Math.round(quiz_accuracy.average_match);

    switch (platform) {
      case 'twitter':
        if (theme === 'personality') {
          return `Just discovered my fragrance personality! 🌸 I'm ${traits} with ${avgMatch}% match accuracy. What's your scent profile? #FragrancePersonality #ScentMatch`;
        } else if (theme === 'recommendations') {
          return `Found my perfect fragrance matches! 🎯 ${avgMatch}% average accuracy from ScentMatch's AI quiz. Discover yours! #FragranceMatch #ScentMatch`;
        }
        return `Completed my fragrance personality quiz! ✨ Amazing ${avgMatch}% accuracy. Find your signature scent! #ScentMatch`;

      case 'instagram':
        return `My Fragrance Personality ✨\n\n🎯 Style: ${traits}\n🌸 Families: ${personality_profile.scent_families.slice(0, 2).join(' & ')}\n📊 Accuracy: ${avgMatch}%\n\nFind your scent match 👆 Link in bio`;

      case 'facebook':
        return `I just took the ScentMatch fragrance personality quiz and wow - ${avgMatch}% accuracy! My fragrance personality is ${traits}. If you're looking for your signature scent, you should definitely try this quiz. The AI recommendations are spot on!`;

      default:
        return `Check out my ScentMatch quiz results! ${avgMatch}% accuracy in finding my perfect fragrance matches.`;
    }
  },
};
