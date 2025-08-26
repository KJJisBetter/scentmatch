'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Users, 
  Star, 
  TrendingUp, 
  Award,
  BarChart3,
  Heart,
  Info
} from 'lucide-react';

import { SocialProofBadges } from './social-proof-badges';
import { PeerValidation } from './peer-validation';
import { BeginnerConfidenceSignals } from './beginner-confidence-signals';
import { DemographicContext } from './demographic-context';
import { PopularityGuidance } from './popularity-guidance';
import type { SocialContext, SocialValidationBadge } from '@/lib/services/social-context';

interface SocialValidationSuiteProps {
  fragranceId: string;
  fragranceName: string;
  context: SocialContext;
  userAgeGroup?: string;
  userExperienceLevel?: string;
  userUniquenessPreference?: number;
  className?: string;
}

/**
 * Complete Social Validation Suite
 * Comprehensive social proof and confidence building for fragrance decisions
 */
export function SocialValidationSuite({ 
  fragranceId,
  fragranceName,
  context, 
  userAgeGroup, 
  userExperienceLevel,
  userUniquenessPreference = 5,
  className = ''
}: SocialValidationSuiteProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Generate social validation badges
  const generateBadges = (): SocialValidationBadge[] => {
    const badges: SocialValidationBadge[] = [];

    // Demographic badge
    if (context.peer_context && userAgeGroup && userExperienceLevel) {
      const ageDisplay = userAgeGroup.replace('-', '–');
      badges.push({
        type: 'demographic',
        label: `Popular with ${ageDisplay}`,
        value: `${Math.round(context.peer_context.love_percentage)}%`,
        confidence: context.peer_context.confidence,
        description: `${context.peer_context.approval_count} similar users rated this`,
        icon: '👥'
      });
    }

    // Overall approval
    if (context.overall.total_approvals >= 10) {
      badges.push({
        type: 'peer_approval',
        label: 'Well-rated',
        value: `${context.overall.avg_approval.toFixed(1)}/5`,
        confidence: context.overall.confidence,
        description: `${context.overall.total_approvals} user reviews`,
        icon: '⭐'
      });
    }

    // Trending badge
    if (context.trending && context.trending.trending_score > 6.0) {
      badges.push({
        type: 'trending',
        label: 'Trending',
        value: `+${Math.round(context.trending.velocity * 100)}%`,
        confidence: 0.9,
        description: 'Rising in popularity',
        icon: '🔥'
      });
    }

    // Uniqueness badge
    if (context.uniqueness) {
      if (context.uniqueness.popularity_level >= 8.0) {
        badges.push({
          type: 'uniqueness',
          label: 'Very Popular',
          value: 'Common',
          confidence: 0.85,
          description: 'Widely worn fragrance',
          icon: '📊'
        });
      } else if (context.uniqueness.distinctiveness >= 7.0) {
        badges.push({
          type: 'uniqueness',
          label: 'Distinctive',
          value: 'Unique',
          confidence: 0.85,
          description: 'Stand out choice',
          icon: '💎'
        });
      }
    }

    return badges;
  };

  const socialBadges = generateBadges();
  const isBeginnerUser = userExperienceLevel === 'beginner';

  // Calculate overall social confidence score
  const calculateSocialConfidence = (): number => {
    let score = 0;
    let factors = 0;

    // Peer approval factor
    if (context.overall.total_approvals > 0) {
      score += context.overall.avg_approval;
      factors++;
    }

    // Demographic alignment factor
    if (context.peer_context) {
      score += context.peer_context.approval_rating;
      factors++;
    }

    // Beginner-friendly factor (if user is beginner)
    if (isBeginnerUser && context.peer_context?.beginner_friendly) {
      score += context.peer_context.beginner_friendly;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  };

  const socialConfidenceScore = calculateSocialConfidence();

  const getConfidenceLevel = (score: number) => {
    if (score >= 4.5) return { level: 'Very High', color: 'text-green-600', icon: '🎯' };
    if (score >= 4.0) return { level: 'High', color: 'text-blue-600', icon: '👍' };
    if (score >= 3.5) return { level: 'Good', color: 'text-yellow-600', icon: '⚡' };
    return { level: 'Moderate', color: 'text-gray-600', icon: '🤔' };
  };

  const confidenceLevel = getConfidenceLevel(socialConfidenceScore);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Social Confidence Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Social Confidence for {fragranceName}
            </div>
            <Badge variant="outline" className="text-sm">
              {socialConfidenceScore.toFixed(1)}/5
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">{confidenceLevel.icon}</span>
              </div>
              <div>
                <div className={`font-semibold ${confidenceLevel.color}`}>
                  {confidenceLevel.level} Confidence
                </div>
                <div className="text-sm text-muted-foreground">
                  Based on {context.overall.total_approvals} user reviews
                  {userAgeGroup && ` • Popular with ${userAgeGroup.replace('-', '–')} year olds`}
                </div>
              </div>
            </div>
          </div>

          {/* Quick badges overview */}
          <div className="flex flex-wrap gap-2">
            {socialBadges.slice(0, 4).map((badge, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {badge.icon} {badge.label}: {badge.value}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed detailed information */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="p-4 border-b">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="peers" className="text-xs">
                  <Heart className="h-3 w-3 mr-1" />
                  Peers
                </TabsTrigger>
                <TabsTrigger value="popularity" className="text-xs">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Popularity
                </TabsTrigger>
                {isBeginnerUser && (
                  <TabsTrigger value="confidence" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Confidence
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="p-4">
              <TabsContent value="overview" className="mt-0">
                <div className="space-y-4">
                  {/* Social proof badges */}
                  <SocialProofBadges 
                    badges={socialBadges}
                    context={context}
                    variant="detailed"
                  />
                  
                  {/* Demographic overview */}
                  <DemographicContext
                    context={context}
                    userAgeGroup={userAgeGroup}
                    userExperienceLevel={userExperienceLevel}
                  />
                </div>
              </TabsContent>

              <TabsContent value="peers" className="mt-0">
                <PeerValidation
                  context={context}
                  userAgeGroup={userAgeGroup}
                  userExperienceLevel={userExperienceLevel}
                />
              </TabsContent>

              <TabsContent value="popularity" className="mt-0">
                <PopularityGuidance
                  context={context}
                  userUniquenessPreference={userUniquenessPreference}
                />
              </TabsContent>

              {isBeginnerUser && (
                <TabsContent value="confidence" className="mt-0">
                  <BeginnerConfidenceSignals
                    context={context}
                    userExperienceLevel={userExperienceLevel}
                    userAgeGroup={userAgeGroup}
                  />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-green-800 mb-1">
                Ready to Make Your Choice?
              </h4>
              <p className="text-sm text-green-700">
                {socialConfidenceScore >= 4.0 
                  ? 'Strong social validation suggests this is a great choice for you!'
                  : 'Consider the social context and your personal preferences carefully.'
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-white">
                <Info className="h-4 w-4 mr-1" />
                Learn More
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                Add to Collection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CompactSocialValidationProps {
  context: SocialContext;
  userAgeGroup?: string;
  userExperienceLevel?: string;
  className?: string;
}

/**
 * Compact Social Validation for card layouts
 */
export function CompactSocialValidation({ 
  context, 
  userAgeGroup, 
  userExperienceLevel,
  className = ''
}: CompactSocialValidationProps) {
  const generateQuickBadges = (): SocialValidationBadge[] => {
    const badges: SocialValidationBadge[] = [];

    // Most important badge first
    if (context.peer_context && userAgeGroup) {
      badges.push({
        type: 'demographic',
        label: userAgeGroup.replace('-', '–'),
        value: `${Math.round(context.peer_context.love_percentage)}%`,
        confidence: context.peer_context.confidence,
        description: 'approval rate',
        icon: '👥'
      });
    }

    if (context.overall.avg_approval >= 4.0) {
      badges.push({
        type: 'peer_approval',
        label: 'Well-rated',
        value: context.overall.avg_approval.toFixed(1),
        confidence: context.overall.confidence,
        description: 'peer rating',
        icon: '⭐'
      });
    }

    return badges.slice(0, 2);
  };

  const quickBadges = generateQuickBadges();

  return (
    <div className={`${className}`}>
      <SocialProofBadges 
        badges={quickBadges}
        variant="compact"
      />
    </div>
  );
}