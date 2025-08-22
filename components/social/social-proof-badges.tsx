'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  Star, 
  Diamond,
  BarChart3,
  Heart,
  UserCheck,
  Zap
} from 'lucide-react';
import type { SocialValidationBadge, SocialContext } from '@/lib/services/social-context';

interface SocialProofBadgesProps {
  badges: SocialValidationBadge[];
  context?: SocialContext;
  className?: string;
  variant?: 'compact' | 'detailed';
}

/**
 * Social Proof Badges Component
 * Displays social validation signals for fragrance decisions
 */
export function SocialProofBadges({ 
  badges, 
  context, 
  className = '',
  variant = 'compact'
}: SocialProofBadgesProps) {
  if (badges.length === 0) return null;

  const getIcon = (type: string, icon?: string) => {
    if (icon) {
      return <span className="text-sm">{icon}</span>;
    }
    
    switch (type) {
      case 'demographic':
        return <Users className="h-3 w-3" />;
      case 'peer_approval':
        return <Star className="h-3 w-3" />;
      case 'trending':
        return <TrendingUp className="h-3 w-3" />;
      case 'uniqueness':
        return <Diamond className="h-3 w-3" />;
      default:
        return <UserCheck className="h-3 w-3" />;
    }
  };

  const getBadgeVariant = (type: string, confidence: number) => {
    if (confidence < 0.5) return 'outline';
    
    switch (type) {
      case 'demographic':
        return 'default';
      case 'peer_approval':
        return confidence >= 0.8 ? 'default' : 'secondary';
      case 'trending':
        return 'destructive';
      case 'uniqueness':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {badges.slice(0, 3).map((badge, index) => (
          <Badge 
            key={index}
            variant={getBadgeVariant(badge.type, badge.confidence)}
            className="flex items-center gap-1 text-xs"
          >
            {getIcon(badge.type, badge.icon)}
            <span>{badge.label}</span>
            <span className="font-semibold">{badge.value}</span>
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {badges.map((badge, index) => (
        <Card key={index} className="border-l-4 border-l-primary/20">
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getIcon(badge.type, badge.icon)}
                <div>
                  <div className="font-medium text-sm">{badge.label}</div>
                  <div className="text-xs text-muted-foreground">{badge.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{badge.value}</div>
                <Progress 
                  value={badge.confidence * 100} 
                  className="w-12 h-1 mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface DemographicContextProps {
  context: SocialContext;
  userAgeGroup?: string;
  userExperienceLevel?: string;
  className?: string;
}

/**
 * Demographic Context Component
 * Shows how the fragrance performs with similar users
 */
export function DemographicContext({ 
  context, 
  userAgeGroup, 
  userExperienceLevel,
  className = ''
}: DemographicContextProps) {
  if (!context.peer_context || !userAgeGroup || !userExperienceLevel) {
    return null;
  }

  const { peer_context } = context;
  const ageDisplay = userAgeGroup.replace('-', '–');
  const expDisplay = userExperienceLevel === 'beginner' ? 'beginners' : 
                    userExperienceLevel === 'intermediate' ? 'intermediate users' :
                    userExperienceLevel === 'experienced' ? 'experienced users' : 'experts';

  const getApprovalColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getApprovalText = (rating: number) => {
    if (rating >= 4.5) return 'Love it';
    if (rating >= 4.0) return 'Really like it';
    if (rating >= 3.5) return 'Like it';
    if (rating >= 3.0) return 'Mixed feelings';
    return 'Not impressed';
  };

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">People Like You</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {ageDisplay} year olds · {expDisplay}
            </span>
            <Badge variant="outline" className="text-xs">
              {peer_context.approval_count} reviews
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className={`font-semibold ${getApprovalColor(peer_context.approval_rating)}`}>
                {peer_context.approval_rating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                {getApprovalText(peer_context.approval_rating)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Would recommend</span>
              <span className="font-medium">{Math.round(peer_context.love_percentage)}%</span>
            </div>
            <Progress value={peer_context.love_percentage} className="h-2" />
          </div>

          {peer_context.beginner_friendly > 0 && userExperienceLevel === 'beginner' && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Beginner-Friendly</span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Great choice for someone new to fragrances ({peer_context.beginner_friendly.toFixed(1)}/5 rating)
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PopularityIndicatorProps {
  context: SocialContext;
  className?: string;
}

/**
 * Popularity Indicator Component
 * Shows trending status and popularity level
 */
export function PopularityIndicator({ context, className = '' }: PopularityIndicatorProps) {
  const { trending, uniqueness } = context;
  
  if (!trending && !uniqueness) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {trending && trending.trending_score > 6.0 && (
        <div className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4 text-orange-500" />
          <span className="font-medium">Trending</span>
          <Badge variant="destructive" className="text-xs">
            +{Math.round(trending.velocity * 100)}%
          </Badge>
          <span className="text-muted-foreground">this month</span>
        </div>
      )}

      {uniqueness && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <span>Popularity</span>
          </div>
          <div className="flex items-center gap-2">
            <Progress 
              value={uniqueness.popularity_level * 10} 
              className="w-16 h-2"
            />
            <span className="text-xs text-muted-foreground">
              {uniqueness.popularity_level >= 8 ? 'Very Common' :
               uniqueness.popularity_level >= 6 ? 'Popular' :
               uniqueness.popularity_level >= 4 ? 'Moderate' :
               'Unique'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface SocialProofSummaryProps {
  context: SocialContext;
  userAgeGroup?: string;
  userExperienceLevel?: string;
  className?: string;
}

/**
 * Social Proof Summary Component
 * Comprehensive social validation display
 */
export function SocialProofSummary({ 
  context, 
  userAgeGroup, 
  userExperienceLevel,
  className = ''
}: SocialProofSummaryProps) {
  const generateSummaryText = () => {
    const { overall, peer_context, uniqueness } = context;
    
    if (overall.total_approvals === 0) {
      return "Be the first to try and rate this fragrance";
    }

    let text = "";
    
    // Overall approval
    if (overall.avg_approval >= 4.5) {
      text = `❤️ Highly loved by ${overall.total_approvals} users`;
    } else if (overall.avg_approval >= 4.0) {
      text = `👍 ${Math.round(overall.love_percentage)}% of ${overall.total_approvals} users recommend this`;
    } else {
      text = `${overall.total_approvals} user reviews · Mixed opinions`;
    }

    // Add peer context
    if (peer_context && userAgeGroup) {
      const ageDisplay = userAgeGroup.replace('-', '–');
      text += ` · Popular with ${ageDisplay} year olds`;
    }

    // Add uniqueness context
    if (uniqueness) {
      if (uniqueness.popularity_level >= 8) {
        text += " · Very popular choice";
      } else if (uniqueness.distinctiveness >= 7) {
        text += " · Distinctive choice";
      }
    }

    return text;
  };

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Heart className="h-5 w-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Social Validation</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {generateSummaryText()}
            </p>
            
            {context.overall.confidence > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Confidence:</span>
                <Progress 
                  value={context.overall.confidence * 100} 
                  className="flex-1 h-1"
                />
                <span className="text-xs font-medium">
                  {Math.round(context.overall.confidence * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}