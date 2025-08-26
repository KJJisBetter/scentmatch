'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ThumbsUp, GraduationCap, DollarSign, Lightbulb, Heart, Clock } from 'lucide-react';
import type { RecommendationItem } from '@/lib/ai-sdk/unified-recommendation-engine';

export interface BeginnerExplanationDisplayProps {
  recommendation: RecommendationItem;
  onTrySample?: (fragranceId: string) => void;
  onLearnMore?: (fragranceId: string) => void;
}

/**
 * Beginner-friendly explanation display component
 * Replaces overwhelming 270+ word technical explanations with clean, 
 * scannable 30-40 word explanations for confidence-building
 */
export function BeginnerExplanationDisplay({
  recommendation,
  onTrySample,
  onLearnMore,
}: BeginnerExplanationDisplayProps) {
  // Extract beginner-friendly content from adaptive explanation
  const adaptiveContent = recommendation.adaptive_explanation;
  const isBeginnerContent = adaptiveContent?.user_experience_level === 'beginner';
  
  // Use summary if available, otherwise fallback to regular explanation (truncated)
  const displayExplanation = isBeginnerContent && adaptiveContent?.summary 
    ? adaptiveContent.summary
    : recommendation.explanation.slice(0, 150) + (recommendation.explanation.length > 150 ? '...' : '');

  // Parse explanation to extract key points (basic implementation)
  const getKeyPoints = (text: string) => {
    const points = [];
    
    // Look for common beginner-friendly patterns
    if (text.includes('fresh') || text.includes('clean')) {
      points.push({ emoji: '✅', text: 'Fresh & clean' });
    }
    if (text.includes('school') || text.includes('work') || text.includes('versatile')) {
      points.push({ emoji: '👍', text: 'Perfect for daily wear' });
    }
    if (text.includes('sample') || text.includes('try')) {
      points.push({ emoji: '🧪', text: `Sample for $${recommendation.sample_price_usd || 14}` });
    }
    if (text.includes('beginner') || text.includes('start')) {
      points.push({ emoji: '🌟', text: 'Great starter fragrance' });
    }
    
    // Fallback points if none detected
    if (points.length === 0) {
      points.push(
        { emoji: '👌', text: 'Matches your style' },
        { emoji: '💡', text: 'Safe, crowd-pleasing choice' }
      );
    }
    
    return points.slice(0, 3); // Max 3 points for scannability
  };

  const keyPoints = getKeyPoints(displayExplanation);

  return (
    <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
      <CardContent className="p-4 space-y-4">
        {/* Header with confidence boost */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Perfect for beginners</span>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-green-100 text-green-800 text-xs"
          >
            Easy Choice
          </Badge>
        </div>

        {/* Key Points - Visual and Scannable */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
            <Sparkles className="w-4 h-4 mr-1 text-purple-600" />
            Why you'll love this
          </h4>
          
          <div className="space-y-1.5">
            {keyPoints.map((point, index) => (
              <div key={index} className="flex items-center text-sm text-gray-700">
                <span className="mr-2 text-base">{point.emoji}</span>
                <span>{point.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence Building Message */}
        {adaptiveContent?.confidence_boost && (
          <div className="bg-white/60 rounded-lg p-3 border border-green-200">
            <div className="flex items-start space-x-2">
              <Heart className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                {adaptiveContent.confidence_boost}
              </p>
            </div>
          </div>
        )}

        {/* Quick Action Section */}
        <div className="bg-white/60 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600">
              <DollarSign className="w-4 h-4 mr-1" />
              <span>Try first, buy later</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              <span>30-day test</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              onClick={() => onTrySample?.(recommendation.fragrance_id)}
              className="bg-green-600 hover:bg-green-700 text-white text-xs"
            >
              Try Sample
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onLearnMore?.(recommendation.fragrance_id)}
              className="text-xs"
            >
              <Lightbulb className="w-3 h-3 mr-1" />
              Learn More
            </Button>
          </div>
        </div>

        {/* Word count indicator for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 text-center">
            {displayExplanation.split(' ').length} words
          </div>
        )}
      </CardContent>
    </Card>
  );
}