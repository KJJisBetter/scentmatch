'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Diamond,
  Scale,
  Info,
  ChevronRight,
  Lightbulb,
  Crown,
  Sparkles
} from 'lucide-react';
import type { SocialContext } from '@/lib/services/social-context';

interface PopularityGuidanceProps {
  context: SocialContext;
  userUniquenessPreference?: number; // 1-10 scale where 1=very popular, 10=very unique
  className?: string;
}

interface PopularityLevel {
  level: number; // 1-10
  label: string;
  description: string;
  icon: string;
  pros: string[];
  cons: string[];
  color: string;
  bgColor: string;
}

/**
 * Popularity Guidance Component  
 * Provides uniqueness vs popularity indicators and guidance
 */
export function PopularityGuidance({ 
  context, 
  userUniquenessPreference = 5,
  className = ''
}: PopularityGuidanceProps) {
  const [showDetailedGuide, setShowDetailedGuide] = useState(false);

  const popularityLevels: PopularityLevel[] = [
    {
      level: 1,
      label: 'Extremely Niche',
      description: 'Very few people wear this - you\'ll be unique',
      icon: '💎',
      pros: ['Maximum uniqueness', 'Conversation starter', 'Express individuality'],
      cons: ['May be polarizing', 'Hard to find', 'Expensive'],
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      level: 3,
      label: 'Distinctive',
      description: 'Uncommon but appreciated by those who know',
      icon: '✨',
      pros: ['Stand out nicely', 'Fragrance enthusiast appeal', 'Memorable'],
      cons: ['May not suit all occasions', 'Learning curve'],
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      level: 5,
      label: 'Balanced',
      description: 'Good mix of popularity and uniqueness',
      icon: '⚖️',
      pros: ['Best of both worlds', 'Versatile', 'Safe but interesting'],
      cons: ['May not fully satisfy uniqueness seekers'],
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      level: 7,
      label: 'Popular',
      description: 'Well-known and widely appreciated',
      icon: '👥',
      pros: ['Proven appeal', 'Easy to find', 'Safe choice'],
      cons: ['You might smell like others', 'Less distinctive'],
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      level: 9,
      label: 'Very Common',
      description: 'Extremely popular - many people wear this',
      icon: '📊',
      pros: ['Universally liked', 'Great for beginners', 'Widely available'],
      cons: ['Very common scent', 'No uniqueness factor', 'Might be overdone'],
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  // Calculate current fragrance popularity level
  const currentPopularityLevel = context.uniqueness?.popularity_level || 5;
  const currentDistinctiveness = context.uniqueness?.distinctiveness || 5;
  
  // Find the closest level description
  const getCurrentLevel = () => {
    return popularityLevels.reduce((prev, curr) => 
      Math.abs(curr.level - currentPopularityLevel) < Math.abs(prev.level - currentPopularityLevel) 
        ? curr : prev
    );
  };

  const currentLevel = getCurrentLevel();

  // Determine alignment with user preference
  const getPreferenceAlignment = () => {
    const prefersUnique = userUniquenessPreference >= 7;
    const prefersPopular = userUniquenessPreference <= 3;
    const isNeutral = userUniquenessPreference >= 4 && userUniquenessPreference <= 6;

    if (prefersUnique && currentDistinctiveness >= 7) {
      return { 
        match: 'excellent', 
        message: 'Perfect! This matches your preference for unique fragrances.',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      };
    }
    
    if (prefersPopular && currentPopularityLevel >= 7) {
      return { 
        match: 'excellent', 
        message: 'Great choice! This aligns with your preference for popular fragrances.',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      };
    }
    
    if (isNeutral) {
      return { 
        match: 'good', 
        message: 'This fragrance offers a nice balance for your preferences.',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      };
    }
    
    if (prefersUnique && currentPopularityLevel >= 8) {
      return { 
        match: 'poor', 
        message: 'This might be too mainstream for your unique taste preferences.',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      };
    }
    
    if (prefersPopular && currentDistinctiveness >= 8) {
      return { 
        match: 'poor', 
        message: 'This might be too unique for your preference for popular scents.',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      };
    }

    return { 
      match: 'neutral', 
      message: 'This fragrance has a different character than your stated preference.',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    };
  };

  const alignment = getPreferenceAlignment();

  const getUniquenessIndicator = () => {
    const uniquenessScore = 10 - currentPopularityLevel; // Invert popularity to get uniqueness
    
    if (uniquenessScore >= 8) return { icon: '💎', label: 'Very Unique', color: 'text-purple-600' };
    if (uniquenessScore >= 6) return { icon: '✨', label: 'Distinctive', color: 'text-indigo-600' };
    if (uniquenessScore >= 4) return { icon: '⚖️', label: 'Balanced', color: 'text-green-600' };
    if (uniquenessScore >= 2) return { icon: '👥', label: 'Popular', color: 'text-blue-600' };
    return { icon: '📊', label: 'Very Common', color: 'text-orange-600' };
  };

  const uniquenessIndicator = getUniquenessIndicator();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Popularity Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Popularity vs Uniqueness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Level Display */}
          <div className={`p-4 rounded-lg ${currentLevel.bgColor} border`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentLevel.icon}</span>
                <div>
                  <h3 className={`font-semibold ${currentLevel.color}`}>
                    {currentLevel.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {currentLevel.description}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-sm">
                Level {currentPopularityLevel}/10
              </Badge>
            </div>

            {/* Visual Scale */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Very Unique</span>
                <span>Very Popular</span>
              </div>
              <div className="relative">
                <Progress value={currentPopularityLevel * 10} className="h-3" />
                <div 
                  className="absolute top-0 w-2 h-3 bg-primary rounded-full transform -translate-x-1"
                  style={{ left: `${currentPopularityLevel * 10}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Diamond className="h-3 w-3" />
                  Distinctiveness: {currentDistinctiveness}/10
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Popularity: {currentPopularityLevel}/10
                </span>
              </div>
            </div>
          </div>

          {/* Personal Alignment */}
          <div className={`p-3 rounded-lg ${alignment.bgColor} border`}>
            <div className="flex items-start gap-2">
              <Lightbulb className={`h-4 w-4 ${alignment.color} mt-0.5`} />
              <div>
                <h4 className={`font-medium text-sm ${alignment.color}`}>
                  Personal Fit Analysis
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {alignment.message}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Guidance */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-green-700 mb-2 flex items-center gap-1">
                ✅ What This Means
              </h4>
              <ul className="space-y-1">
                {currentLevel.pros.map((pro, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    • {pro}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-orange-700 mb-2 flex items-center gap-1">
                ⚠️ Consider This
              </h4>
              <ul className="space-y-1">
                {currentLevel.cons.map((con, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    • {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Context */}
      {context.overall.total_approvals > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Social Validation Stats
            </h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overall rating:</span>
                  <span className="font-medium">{context.overall.avg_approval.toFixed(1)}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Would recommend:</span>
                  <span className="font-medium">{Math.round(context.overall.love_percentage)}%</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total reviews:</span>
                  <span className="font-medium">{context.overall.total_approvals}</span>
                </div>
                {context.uniqueness && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Market presence:</span>
                    <span className="font-medium">{context.uniqueness.market_saturation.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Trending indicator */}
            {context.trending && context.trending.trending_score > 6 && (
              <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                <div className="flex items-center gap-2 text-orange-800">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Trending Now</span>
                  <Badge variant="destructive" className="text-xs">
                    +{Math.round(context.trending.velocity * 100)}%
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Guide Toggle */}
      <Card>
        <CardContent className="p-4">
          <Button 
            variant="ghost" 
            onClick={() => setShowDetailedGuide(!showDetailedGuide)}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>Understanding Popularity Levels</span>
            </div>
            <ChevronRight className={`h-4 w-4 transition-transform ${showDetailedGuide ? 'rotate-90' : ''}`} />
          </Button>

          {showDetailedGuide && (
            <div className="mt-4 space-y-3">
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Understanding where a fragrance sits on the popularity spectrum can help you make 
                  more confident choices that align with your personal style and social preferences.
                </AlertDescription>
              </Alert>

              {popularityLevels.map((level, index) => (
                <div 
                  key={level.level}
                  className={`p-3 rounded border ${
                    Math.abs(level.level - currentPopularityLevel) <= 1 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{level.icon}</span>
                    <div>
                      <h5 className={`font-medium ${level.color}`}>{level.label}</h5>
                      <p className="text-xs text-muted-foreground">{level.description}</p>
                    </div>
                    {Math.abs(level.level - currentPopularityLevel) <= 1 && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decision Helper */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-primary mb-2">
                Decision Confidence
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Based on the popularity analysis, this fragrance 
                {alignment.match === 'excellent' ? ' perfectly matches' : 
                  alignment.match === 'good' ? ' aligns well with' :
                  alignment.match === 'poor' ? ' doesn\'t quite match' : ' differs from'} 
                {' '}your stated preferences.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Learn More
                </Button>
                <Button size="sm">
                  {alignment.match === 'excellent' ? 'Add to Collection' : 'Consider Anyway'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface PopularityIndicatorProps {
  popularityLevel: number;
  distinctiveness: number;
  isCompact?: boolean;
  className?: string;
}

/**
 * Quick Popularity Indicator for card layouts
 */
export function PopularityIndicator({ 
  popularityLevel, 
  distinctiveness,
  isCompact = false,
  className = ''
}: PopularityIndicatorProps) {
  const getIndicator = () => {
    if (distinctiveness >= 8) return { icon: '💎', label: 'Very Unique', color: 'text-purple-600' };
    if (popularityLevel >= 8) return { icon: '📊', label: 'Very Popular', color: 'text-blue-600' };
    if (distinctiveness >= 6) return { icon: '✨', label: 'Distinctive', color: 'text-indigo-600' };
    if (popularityLevel >= 6) return { icon: '👥', label: 'Popular', color: 'text-blue-600' };
    return { icon: '⚖️', label: 'Balanced', color: 'text-green-600' };
  };

  const indicator = getIndicator();

  if (isCompact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <span className="text-sm">{indicator.icon}</span>
        <span className={`text-xs font-medium ${indicator.color}`}>
          {indicator.label}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm">{indicator.icon}</span>
      <div>
        <span className={`text-xs font-medium ${indicator.color}`}>
          {indicator.label}
        </span>
        <div className="text-xs text-muted-foreground">
          P:{popularityLevel}/10 • U:{distinctiveness}/10
        </div>
      </div>
    </div>
  );
}