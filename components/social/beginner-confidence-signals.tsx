'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  UserCheck, 
  Star, 
  CheckCircle,
  BookOpen,
  Users,
  Award,
  Lightbulb,
  TrendingUp,
  Heart,
  Target,
  Sparkles
} from 'lucide-react';
import type { SocialContext } from '@/lib/services/social-context';

interface BeginnerConfidenceSignalsProps {
  context: SocialContext;
  userExperienceLevel?: string;
  userAgeGroup?: string;
  className?: string;
}

interface ConfidenceIndicator {
  type: 'safety' | 'popularity' | 'beginner_approved' | 'versatile' | 'educational';
  icon: React.ReactNode;
  title: string;
  description: string;
  score: number;
  reasoning: string[];
  color: string;
}

/**
 * Beginner Confidence Signals Component
 * Provides social confidence builders specifically for fragrance beginners
 */
export function BeginnerConfidenceSignals({ 
  context, 
  userExperienceLevel,
  userAgeGroup,
  className = ''
}: BeginnerConfidenceSignalsProps) {
  const isBeginnerUser = userExperienceLevel === 'beginner';
  
  // Generate confidence indicators based on social context
  const generateConfidenceIndicators = (): ConfidenceIndicator[] => {
    const indicators: ConfidenceIndicator[] = [];

    // Safety indicator - safe choice for beginners
    if (context.peer_context?.beginner_friendly >= 4.0) {
      indicators.push({
        type: 'safety',
        icon: <Shield className="h-4 w-4" />,
        title: 'Safe Choice for Beginners',
        description: 'Unlikely to overwhelm or disappoint',
        score: context.peer_context.beginner_friendly,
        reasoning: [
          `${context.peer_context.approval_count} beginners rated this positively`,
          'Known to be gentle and approachable',
          'Won\'t be too strong or polarizing'
        ],
        color: 'text-green-600'
      });
    }

    // Popularity indicator - you won't be alone
    if (context.overall.total_approvals >= 20 && context.overall.avg_approval >= 3.8) {
      indicators.push({
        type: 'popularity',
        icon: <Users className="h-4 w-4" />,
        title: 'Widely Appreciated',
        description: 'You\'re in good company with this choice',
        score: context.overall.avg_approval,
        reasoning: [
          `${context.overall.total_approvals} people have tried and rated this`,
          `${Math.round(context.overall.love_percentage)}% would recommend it`,
          'Proven to have broad appeal'
        ],
        color: 'text-blue-600'
      });
    }

    // Beginner approved - specifically good for new users
    if (context.peer_context && isBeginnerUser) {
      indicators.push({
        type: 'beginner_approved',
        icon: <UserCheck className="h-4 w-4" />,
        title: 'Beginner-Approved',
        description: 'Other fragrance newcomers love this',
        score: context.peer_context.approval_rating,
        reasoning: [
          'High satisfaction among first-time fragrance buyers',
          'Easy to understand and appreciate',
          'Great for building fragrance confidence'
        ],
        color: 'text-purple-600'
      });
    }

    // Versatile - works in many situations
    if (context.overall.confidence >= 0.7) {
      indicators.push({
        type: 'versatile',
        icon: <Target className="h-4 w-4" />,
        title: 'Versatile Choice',
        description: 'Appropriate for multiple occasions',
        score: context.overall.confidence * 5,
        reasoning: [
          'Works for casual and formal settings',
          'Suitable for day and evening wear',
          'Won\'t feel out of place anywhere'
        ],
        color: 'text-orange-600'
      });
    }

    // Educational value - good for learning
    if (context.overall.avg_approval >= 4.0) {
      indicators.push({
        type: 'educational',
        icon: <BookOpen className="h-4 w-4" />,
        title: 'Great Learning Fragrance',
        description: 'Perfect for developing your fragrance taste',
        score: context.overall.avg_approval,
        reasoning: [
          'Represents its fragrance category well',
          'Helps you understand what you like',
          'Good reference point for future choices'
        ],
        color: 'text-indigo-600'
      });
    }

    return indicators;
  };

  const confidenceIndicators = generateConfidenceIndicators();

  if (confidenceIndicators.length === 0) {
    return null;
  }

  const overallConfidenceScore = confidenceIndicators.reduce((sum, indicator) => 
    sum + indicator.score, 0) / confidenceIndicators.length;

  const getConfidenceLevel = (score: number) => {
    if (score >= 4.5) return { level: 'Very High', color: 'text-green-600', description: 'Excellent choice - go for it!' };
    if (score >= 4.0) return { level: 'High', color: 'text-blue-600', description: 'Great choice - you\'ll likely love it' };
    if (score >= 3.5) return { level: 'Good', color: 'text-yellow-600', description: 'Solid choice with good potential' };
    return { level: 'Moderate', color: 'text-gray-600', description: 'Consider your preferences carefully' };
  };

  const confidenceLevel = getConfidenceLevel(overallConfidenceScore);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Confidence Score */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Confidence Score for Beginners
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold ${confidenceLevel.color}`}>
                {overallConfidenceScore.toFixed(1)}/5
              </div>
              <div className="text-sm text-muted-foreground">
                {confidenceLevel.level} Confidence
              </div>
            </div>
            <div className="text-right">
              <Progress 
                value={overallConfidenceScore * 20} 
                className="w-24 h-3"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Based on social validation
              </div>
            </div>
          </div>
          
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {confidenceLevel.description} This score is based on how other beginners 
              and similar users have responded to this fragrance.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Individual Confidence Indicators */}
      <div className="grid gap-3">
        {confidenceIndicators.map((indicator, index) => (
          <Card key={indicator.type} className="border-l-4 border-l-primary/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`${indicator.color} mt-0.5`}>
                  {indicator.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{indicator.title}</h4>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">
                        {indicator.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {indicator.description}
                  </p>
                  <div className="space-y-1">
                    {indicator.reasoning.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Social Reassurance */}
      {isBeginnerUser && context.peer_context && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm mb-2">
                  You're Not Alone in This Choice
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    • {context.peer_context.approval_count} other beginners have tried this fragrance
                  </p>
                  <p>
                    • {Math.round(context.peer_context.love_percentage)}% of them would recommend it to a friend
                  </p>
                  {userAgeGroup && (
                    <p>
                      • Popular choice among {userAgeGroup.replace('-', '–')} year olds like you
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trending Confidence Boost */}
      {context.trending && context.trending.trending_score > 6.0 && (
        <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <h4 className="font-medium text-sm text-orange-800">
                  Rising Popularity
                </h4>
                <p className="text-sm text-orange-700 mt-1">
                  This fragrance is trending upward (+{Math.round(context.trending.velocity * 100)}% this month). 
                  You're choosing something that's gaining momentum!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Encouragement */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-sm text-green-800 mb-2">
                Ready to Make This Choice?
              </h4>
              <p className="text-sm text-green-700 mb-3">
                Based on the social validation data, this appears to be a confident choice for someone at your experience level.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="bg-white">
                  Add to Collection
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  Request Sample
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface QuickConfidenceIndicatorProps {
  score: number;
  level: 'beginner' | 'intermediate' | 'experienced';
  className?: string;
}

/**
 * Quick Confidence Indicator for card layouts
 */
export function QuickConfidenceIndicator({ 
  score, 
  level,
  className = ''
}: QuickConfidenceIndicatorProps) {
  const getIndicator = () => {
    if (score >= 4.5) {
      return {
        icon: '✨',
        label: 'High Confidence',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      };
    }
    if (score >= 4.0) {
      return {
        icon: '👍',
        label: 'Good Choice',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      };
    }
    if (score >= 3.5) {
      return {
        icon: '⚡',
        label: 'Solid Option',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      };
    }
    return {
      icon: '🤔',
      label: 'Consider Carefully',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    };
  };

  const indicator = getIndicator();

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${indicator.bgColor} ${className}`}>
      <span className="text-sm">{indicator.icon}</span>
      <span className={`text-xs font-medium ${indicator.color}`}>
        {indicator.label}
      </span>
      {level === 'beginner' && (
        <Badge variant="outline" className="text-xs">
          Beginner
        </Badge>
      )}
    </div>
  );
}