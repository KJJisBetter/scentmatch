'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Sparkles, BookOpen, Zap } from 'lucide-react';
import type { RecommendationItem } from '@/lib/ai-sdk/unified-recommendation-engine';
import type { UserExperienceLevel } from '@/lib/ai-sdk/user-experience-detector';
import { BeginnerExplanationDisplay } from './beginner-explanation-display';

export interface ExplanationLengthAdapterProps {
  recommendation: RecommendationItem;
  userExperience?: UserExperienceLevel;
  onTrySample?: (fragranceId: string) => void;
  onLearnMore?: (fragranceId: string) => void;
  allowToggle?: boolean; // Allow users to switch between experience levels
}

/**
 * Experience-level content switcher component
 * Adapts explanation length and complexity based on user experience
 * Provides progressive disclosure from beginner to advanced content
 */
export function ExplanationLengthAdapter({
  recommendation,
  userExperience = 'beginner',
  onTrySample,
  onLearnMore,
  allowToggle = true,
}: ExplanationLengthAdapterProps) {
  const [currentLevel, setCurrentLevel] = useState<UserExperienceLevel>(userExperience);
  const [showExpanded, setShowExpanded] = useState(false);

  const adaptiveContent = recommendation.adaptive_explanation;
  
  // Get content based on experience level
  const getContentForLevel = (level: UserExperienceLevel) => {
    switch (level) {
      case 'beginner':
        return {
          title: 'Simple explanation',
          icon: Zap,
          content: adaptiveContent?.summary || recommendation.explanation.slice(0, 100) + '...',
          color: 'green',
          description: 'Easy to understand',
        };
      case 'intermediate':
        return {
          title: 'Detailed analysis',
          icon: BookOpen,
          content: adaptiveContent?.expanded_content || recommendation.explanation,
          color: 'blue',
          description: 'More context and details',
        };
      case 'advanced':
        return {
          title: 'Full technical breakdown',
          icon: Sparkles,
          content: recommendation.explanation + (recommendation.why_recommended ? '\n\n' + recommendation.why_recommended : ''),
          color: 'purple',
          description: 'Complete analysis',
        };
    }
  };

  const currentContent = getContentForLevel(currentLevel);
  const IconComponent = currentContent.icon;

  // For beginners, use the specialized component
  if (currentLevel === 'beginner') {
    return (
      <div className="space-y-3">
        <BeginnerExplanationDisplay
          recommendation={recommendation}
          onTrySample={onTrySample}
          onLearnMore={onLearnMore}
        />
        
        {allowToggle && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExpanded(!showExpanded)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {showExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Show less detail
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Want more details?
                </>
              )}
            </Button>
          </div>
        )}

        {/* Progressive disclosure for beginners */}
        {showExpanded && (
          <Card className="border-dashed border-gray-300">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Detailed explanation
                </span>
                <Badge variant="outline" className="text-xs">
                  Optional reading
                </Badge>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {recommendation.explanation}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // For intermediate and advanced users
  return (
    <div className="space-y-3">
      {/* Experience Level Switcher */}
      {allowToggle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {(['beginner', 'intermediate', 'advanced'] as const).map((level) => {
              const content = getContentForLevel(level);
              const isActive = currentLevel === level;
              return (
                <Button
                  key={level}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentLevel(level)}
                  className={`text-xs ${
                    isActive 
                      ? `bg-${content.color}-600 hover:bg-${content.color}-700 text-white`
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <content.icon className="w-3 h-3 mr-1" />
                  {level}
                </Button>
              );
            })}
          </div>
          
          <Badge variant="outline" className="text-xs">
            {currentContent.description}
          </Badge>
        </div>
      )}

      {/* Content Display */}
      <Card className={`border-${currentContent.color}-200 bg-gradient-to-br from-${currentContent.color}-50 to-white`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <IconComponent className={`w-5 h-5 text-${currentContent.color}-600 mt-0.5 flex-shrink-0`} />
            <div className="flex-1">
              <h4 className={`text-sm font-medium text-${currentContent.color}-800 mb-2`}>
                {currentContent.title}
              </h4>
              <div className="prose prose-sm max-w-none">
                <p className={`text-sm text-${currentContent.color}-700 leading-relaxed whitespace-pre-line`}>
                  {currentContent.content}
                </p>
              </div>
              
              {/* Educational terms for intermediate/advanced */}
              {adaptiveContent?.educational_terms && (currentLevel === 'intermediate' || currentLevel === 'advanced') && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-muted-foreground mb-2">Key terms:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(adaptiveContent.educational_terms).map(([term, definition]) => (
                      <Badge 
                        key={term} 
                        variant="secondary" 
                        className="text-xs cursor-help"
                        title={definition as string}
                      >
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Word count indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 text-center">
          {currentContent.content.split(' ').length} words · {currentLevel} level
        </div>
      )}
    </div>
  );
}