'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
import { 
  Users, 
  Star, 
  UserCheck, 
  TrendingUp,
  Heart,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import type { SocialContext } from '@/lib/services/social-context';

interface PeerValidationProps {
  context: SocialContext;
  userAgeGroup?: string;
  userExperienceLevel?: string;
  className?: string;
}

interface SimilarUser {
  id: string;
  age_group: string;
  experience_level: string;
  shared_preferences: number;
  rating: number;
  quick_review?: string;
}

interface PeerRecommendation {
  fragrance_id: string;
  name: string;
  brand: string;
  shared_rating: number;
  peer_count: number;
  similarity_score: number;
}

/**
 * Peer Validation Component
 * Shows "Others like you also liked..." social proof features
 */
export function PeerValidation({ 
  context, 
  userAgeGroup, 
  userExperienceLevel,
  className = ''
}: PeerValidationProps) {
  // Mock data - in real implementation, this would come from props or API
  const similarUsers: SimilarUser[] = [
    {
      id: '1',
      age_group: '18-24',
      experience_level: 'beginner',
      shared_preferences: 0.87,
      rating: 4.5,
      quick_review: 'Perfect for college!'
    },
    {
      id: '2', 
      age_group: '18-24',
      experience_level: 'beginner',
      shared_preferences: 0.82,
      rating: 4.2,
      quick_review: 'Love wearing this to work'
    },
    {
      id: '3',
      age_group: '18-24', 
      experience_level: 'intermediate',
      shared_preferences: 0.79,
      rating: 4.0
    }
  ];

  const peerRecommendations: PeerRecommendation[] = [
    {
      fragrance_id: 'rec1',
      name: 'Light Blue',
      brand: 'Dolce & Gabbana',
      shared_rating: 4.3,
      peer_count: 42,
      similarity_score: 0.85
    },
    {
      fragrance_id: 'rec2', 
      name: 'Flowerbomb',
      brand: 'Viktor & Rolf',
      shared_rating: 4.1,
      peer_count: 38,
      similarity_score: 0.82
    }
  ];

  if (!context.peer_context || !userAgeGroup || !userExperienceLevel) {
    return null;
  }

  const { peer_context } = context;
  const ageDisplay = userAgeGroup.replace('-', '–');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Peer Validation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            People Like You Say
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Peer Stats */}
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <Avatar key={i} className="h-8 w-8 border-2 border-white">
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {String.fromCharCode(65 + i)}
                      </span>
                    </div>
                  </Avatar>
                ))}
              </div>
              <div>
                <div className="text-sm font-medium">
                  {peer_context.approval_count} similar users rated this
                </div>
                <div className="text-xs text-muted-foreground">
                  {ageDisplay} year olds, mostly {userExperienceLevel}s
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-lg">
                  {peer_context.approval_rating.toFixed(1)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(peer_context.love_percentage)}% recommend
              </div>
            </div>
          </div>

          {/* Individual Peer Insights */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              What Similar Users Are Saying
            </h4>
            
            {similarUsers.slice(0, 3).map((user, index) => (
              <div key={user.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <Avatar className="h-8 w-8">
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">
                      {user.experience_level.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {user.age_group} • {user.experience_level}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{user.rating}</span>
                    </div>
                  </div>
                  {user.quick_review && (
                    <p className="text-sm text-muted-foreground">
                      "{user.quick_review}"
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {Math.round(user.shared_preferences * 100)}% similar preferences
                    </span>
                    <Progress 
                      value={user.shared_preferences * 100} 
                      className="w-16 h-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Beginner-Specific Validation */}
          {userExperienceLevel === 'beginner' && peer_context.beginner_friendly > 4.0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 text-sm">
                    Beginner-Approved Choice
                  </h4>
                  <p className="text-xs text-green-700 mt-1">
                    Other fragrance beginners gave this {peer_context.beginner_friendly.toFixed(1)}/5 stars. 
                    It's considered easy to wear and unlikely to overwhelm.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Others Also Liked Recommendations */}
      {peerRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Others Like You Also Liked
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Based on {peer_context.approval_count} users with similar preferences
            </p>
            
            {peerRecommendations.map((rec, index) => (
              <div key={rec.fragrance_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/20 rounded flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{rec.name}</div>
                    <div className="text-xs text-muted-foreground">{rec.brand}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{rec.shared_rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        • {rec.peer_count} similar users
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(rec.similarity_score * 100)}% match
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full">
              View More Peer Recommendations
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Trending Among Peers */}
      {context.trending && context.trending.trending_score > 6.0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <h4 className="font-medium text-orange-800">
                  Trending with Your Age Group
                </h4>
                <p className="text-sm text-orange-700 mt-1">
                  This fragrance is gaining popularity among {ageDisplay} year olds 
                  (+{Math.round(context.trending.velocity * 100)}% this month)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface PeerComparisonProps {
  userRating?: number;
  peerAverage: number;
  peerCount: number;
  ageGroup?: string;
  className?: string;
}

/**
 * Peer Comparison Component
 * Shows how user's rating compares to peers
 */
export function PeerComparison({ 
  userRating, 
  peerAverage, 
  peerCount,
  ageGroup,
  className = ''
}: PeerComparisonProps) {
  if (!userRating) return null;

  const difference = userRating - peerAverage;
  const isAboveAverage = difference > 0;
  const isSignificantDiff = Math.abs(difference) > 0.5;

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-sm">Your Rating vs Peers</h4>
            <p className="text-xs text-muted-foreground">
              Compared to {peerCount} similar users
              {ageGroup && ` (${ageGroup.replace('-', '–')})`}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">You: {userRating}</span>
              <span className="text-xs text-muted-foreground">
                Peers: {peerAverage.toFixed(1)}
              </span>
            </div>
            {isSignificantDiff && (
              <div className={`text-xs mt-1 ${
                isAboveAverage ? 'text-green-600' : 'text-blue-600'
              }`}>
                {isAboveAverage ? '+' : ''}{difference.toFixed(1)} vs average
              </div>
            )}
          </div>
        </div>
        
        {isSignificantDiff && (
          <div className="mt-3 p-2 rounded bg-gray-50">
            <p className="text-xs text-muted-foreground">
              {isAboveAverage 
                ? "You love this more than most people your age!"
                : "This fragrance might not be your style - that's totally normal!"
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}