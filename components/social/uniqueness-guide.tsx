'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Diamond, 
  BarChart3, 
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Crown
} from 'lucide-react';
import type { UniquenessScore, SocialContext } from '@/lib/services/social-context';

interface UniquenessGuideProps {
  uniquenessScore: UniquenessScore;
  context: SocialContext;
  alternatives?: Array<{
    id: string;
    name: string;
    brand: string;
    similarity: number;
    uniqueness_advantage: number;
  }>;
  userUniquenessPreference?: number; // 1-10 scale
  className?: string;
}

/**
 * Uniqueness vs Popularity Guide Component
 * Helps users understand the social implications of their fragrance choice
 */
export function UniquenessGuide({ 
  uniquenessScore, 
  context,
  alternatives = [],
  userUniquenessPreference = 5,
  className = ''
}: UniquenessGuideProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  
  const {
    popularity_score,
    distinctiveness_score,
    market_saturation,
    conformity_pressure
  } = uniquenessScore;

  // Determine overall character
  const isVeryPopular = popularity_score >= 8.0;
  const isDistinctive = distinctiveness_score >= 7.0;
  const isMainstream = popularity_score >= 7.0 && distinctiveness_score <= 4.0;
  const isNiche = popularity_score <= 4.0 && distinctiveness_score >= 6.0;

  const getPopularityLabel = () => {
    if (popularity_score >= 9) return 'Extremely Popular';
    if (popularity_score >= 8) return 'Very Popular';
    if (popularity_score >= 6) return 'Popular';
    if (popularity_score >= 4) return 'Moderately Popular';
    if (popularity_score >= 2) return 'Niche';
    return 'Very Niche';
  };

  const getDistinctivenessLabel = () => {
    if (distinctiveness_score >= 9) return 'Extremely Unique';
    if (distinctiveness_score >= 7) return 'Very Distinctive';
    if (distinctiveness_score >= 5) return 'Moderately Unique';
    if (distinctiveness_score >= 3) return 'Somewhat Common';
    return 'Very Common';
  };

  const getSocialImplication = () => {
    if (isMainstream) {
      return {
        icon: <Users className="h-5 w-5 text-blue-500" />,
        title: "Mainstream Choice",
        description: "You'll fit right in - many people wear this fragrance",
        pros: ["Safe, well-accepted choice", "Easy to find and sample", "Proven crowd-pleaser"],
        cons: ["You might smell like others", "Less conversation starter", "Potential for scent fatigue"]
      };
    }
    
    if (isNiche) {
      return {
        icon: <Diamond className="h-5 w-5 text-purple-500" />,
        title: "Distinctive Choice",
        description: "Stand out from the crowd with this unique fragrance",
        pros: ["Memorable and distinctive", "Great conversation starter", "Express individuality"],
        cons: ["Harder to find", "May be polarizing", "Higher price point"]
      };
    }
    
    if (isVeryPopular) {
      return {
        icon: <Crown className="h-5 w-5 text-yellow-500" />,
        title: "Popular Classic",
        description: "A widely-loved fragrance that's popular for good reason",
        pros: ["Proven appeal", "Safe for any occasion", "Easy to compliment"],
        cons: ["Very common scent", "May lack uniqueness", "Overexposed in some circles"]
      };
    }

    return {
      icon: <Sparkles className="h-5 w-5 text-green-500" />,
      title: "Balanced Choice",
      description: "A nice balance between popularity and uniqueness",
      pros: ["Best of both worlds", "Distinctive but not alienating", "Good conversation balance"],
      cons: ["May not fully satisfy uniqueness seekers", "Still somewhat predictable"]
    };
  };

  const getPersonalityMatch = () => {
    const userWantsUnique = userUniquenessPreference >= 7;
    const userWantsPopular = userUniquenessPreference <= 3;
    const userIsNeutral = userUniquenessPreference >= 4 && userUniquenessPreference <= 6;

    if (userWantsUnique && distinctiveness_score >= 7) {
      return { match: 'excellent', text: 'Perfect match for your uniqueness preference!' };
    }
    
    if (userWantsPopular && popularity_score >= 7) {
      return { match: 'excellent', text: 'Great choice for your preference for popular scents!' };
    }
    
    if (userIsNeutral) {
      return { match: 'good', text: 'This fragrance aligns well with your balanced preferences.' };
    }
    
    if (userWantsUnique && popularity_score >= 8) {
      return { match: 'poor', text: 'This might be too mainstream for your taste.' };
    }
    
    if (userWantsPopular && distinctiveness_score >= 8) {
      return { match: 'poor', text: 'This might be too unique for your preference.' };
    }

    return { match: 'neutral', text: 'This fragrance has a different character than your stated preference.' };
  };

  const socialImplication = getSocialImplication();
  const personalityMatch = getPersonalityMatch();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Uniqueness Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {socialImplication.icon}
            {socialImplication.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {socialImplication.description}
          </p>

          {/* Popularity vs Uniqueness Meters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Popularity</span>
                <span className="text-xs text-muted-foreground">
                  {getPopularityLabel()}
                </span>
              </div>
              <Progress value={popularity_score * 10} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {market_saturation.toFixed(1)}% of users have tried this
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Distinctiveness</span>
                <span className="text-xs text-muted-foreground">
                  {getDistinctivenessLabel()}
                </span>
              </div>
              <Progress value={distinctiveness_score * 10} className="h-2" />
              <div className="text-xs text-muted-foreground">
                Uniqueness factor: {distinctiveness_score.toFixed(1)}/10
              </div>
            </div>
          </div>

          {/* Personality Match */}
          <div className={`p-3 rounded-lg border ${
            personalityMatch.match === 'excellent' ? 'bg-green-50 border-green-200' :
            personalityMatch.match === 'good' ? 'bg-blue-50 border-blue-200' :
            personalityMatch.match === 'poor' ? 'bg-red-50 border-red-200' :
            'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2">
              <Lightbulb className={`h-4 w-4 ${
                personalityMatch.match === 'excellent' ? 'text-green-600' :
                personalityMatch.match === 'good' ? 'text-blue-600' :
                personalityMatch.match === 'poor' ? 'text-red-600' :
                'text-gray-600'
              }`} />
              <span className="text-sm font-medium">Personal Fit</span>
            </div>
            <p className="text-xs mt-1 text-muted-foreground">
              {personalityMatch.text}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pros and Cons */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-700 mb-2 flex items-center gap-1">
                ✅ Pros
              </h4>
              <ul className="space-y-1">
                {socialImplication.pros.map((pro, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    • {pro}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-orange-700 mb-2 flex items-center gap-1">
                ⚠️ Considerations
              </h4>
              <ul className="space-y-1">
                {socialImplication.cons.map((con, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    • {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Pressure Warning */}
      {conformity_pressure >= 7.0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-800 mb-1">Social Pressure Alert</h4>
                <p className="text-sm text-orange-700">
                  This fragrance carries significant social expectations. You might feel pressure to 
                  conform to its popular image. Consider if you're choosing it for yourself or for others.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alternative Suggestions */}
      {alternatives.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <Button 
              variant="ghost" 
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="w-full justify-between p-0 h-auto"
            >
              <div className="flex items-center gap-2">
                <Diamond className="h-4 w-4" />
                <span className="font-medium">Similar but More Unique Alternatives</span>
                <Badge variant="secondary" className="ml-2">
                  {alternatives.length}
                </Badge>
              </div>
              {showAlternatives ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showAlternatives && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  If you like this scent but want something more distinctive, consider these alternatives:
                </p>
                
                {alternatives.map((alt, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{alt.name}</div>
                      <div className="text-xs text-muted-foreground">{alt.brand}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {Math.round(alt.similarity * 100)}% similar
                      </div>
                      <Badge variant="outline" className="text-xs">
                        +{alt.uniqueness_advantage} uniqueness
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Context-Based Recommendations */}
      {context.overall.total_approvals > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Social Context
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Peer approval:</span>
                <span className="font-medium">{context.overall.avg_approval.toFixed(1)}/5 stars</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Would recommend:</span>
                <span className="font-medium">{Math.round(context.overall.love_percentage)}%</span>
              </div>
              
              {context.trending && context.trending.trending_score > 6 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trending status:</span>
                  <Badge variant="destructive" className="text-xs">Rising popularity</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface QuickUniquenessIndicatorProps {
  popularityScore: number;
  distinctivenessScore: number;
  className?: string;
}

/**
 * Quick Uniqueness Indicator for card layouts
 */
export function QuickUniquenessIndicator({ 
  popularityScore, 
  distinctivenessScore,
  className = ''
}: QuickUniquenessIndicatorProps) {
  const getIndicator = () => {
    if (popularityScore >= 8.0) {
      return {
        icon: '📊',
        label: 'Very Popular',
        description: 'You might smell like others',
        color: 'text-blue-600'
      };
    }
    
    if (distinctivenessScore >= 7.0) {
      return {
        icon: '💎',
        label: 'Distinctive',
        description: 'Stand out from the crowd',
        color: 'text-purple-600'
      };
    }
    
    if (popularityScore >= 6.0 && distinctivenessScore >= 5.0) {
      return {
        icon: '⚖️',
        label: 'Balanced',
        description: 'Popular yet distinctive',
        color: 'text-green-600'
      };
    }
    
    return {
      icon: '🎯',
      label: 'Moderate',
      description: 'Moderate popularity',
      color: 'text-gray-600'
    };
  };

  const indicator = getIndicator();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm">{indicator.icon}</span>
      <div>
        <span className={`text-xs font-medium ${indicator.color}`}>
          {indicator.label}
        </span>
        <div className="text-xs text-muted-foreground">
          {indicator.description}
        </div>
      </div>
    </div>
  );
}