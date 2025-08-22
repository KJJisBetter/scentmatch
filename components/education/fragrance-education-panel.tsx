"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  Star,
  TrendingUp,
  Users,
  Target
} from 'lucide-react';
import { EDUCATIONAL_GUIDANCE, BEGINNER_EDUCATION_CONTENT } from '@/lib/education/content';
import { EducationalTooltip } from './educational-tooltip';
import { useEducationContext } from '@/lib/education/useEducationContext';
import { cn } from '@/lib/utils';

interface FragranceEducationPanelProps {
  /** Context where the panel is shown */
  context: 'fragrance_page' | 'quiz' | 'search' | 'general';
  /** Whether to show as expanded by default */
  defaultExpanded?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FragranceEducationPanel Component
 * 
 * Shows contextual educational content to help beginners understand
 * fragrance terminology and build confidence in their choices.
 */
export function FragranceEducationPanel({
  context,
  defaultExpanded = false,
  className
}: FragranceEducationPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const { shouldShowEducation, isBeginnerMode, getTooltipSettings } = useEducationContext();

  // Don't show for advanced users unless they opt in
  if (!shouldShowEducation('beginner')) {
    return null;
  }

  const tooltipSettings = getTooltipSettings();

  return (
    <Card className={cn("border-amber-200 bg-gradient-to-br from-amber-50 to-cream-50", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-amber-100/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-lg text-amber-900">
                  Fragrance Learning Center
                </CardTitle>
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                  Beginner Friendly
                </Badge>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-amber-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-amber-600" />
              )}
            </div>
            {!isOpen && (
              <p className="text-sm text-amber-700 mt-1">
                Quick explanations to help you shop with confidence
              </p>
            )}
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Success Statistics */}
            <div className="bg-white/60 rounded-lg p-4">
              <h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                You're in Good Company
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {EDUCATIONAL_GUIDANCE.success_stats.beginner_match_rate}
                  </div>
                  <p className="text-xs text-muted-foreground">find their match</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {EDUCATIONAL_GUIDANCE.success_stats.average_tries_to_find_match}
                  </div>
                  <p className="text-xs text-muted-foreground">tries on average</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {EDUCATIONAL_GUIDANCE.success_stats.satisfaction_rate}
                  </div>
                  <p className="text-xs text-muted-foreground">satisfaction</p>
                </div>
              </div>
            </div>

            {/* Context-specific content */}
            {context === 'fragrance_page' && <FragrancePageEducation />}
            {context === 'quiz' && <QuizEducation />}
            {context === 'search' && <SearchEducation />}

            {/* Quick Reference: Concentrations */}
            <div>
              <h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Fragrance Strengths Quick Guide
              </h4>
              <div className="grid gap-2">
                {Object.entries(EDUCATIONAL_GUIDANCE.concentration_help).map(([key, content]) => (
                  <div key={key} className="flex items-center justify-between bg-white/60 rounded p-2">
                    <EducationalTooltip 
                      content={content}
                      {...tooltipSettings}
                    >
                      <span className="font-medium text-sm">{key}</span>
                    </EducationalTooltip>
                    <span className="text-xs text-muted-foreground">
                      {content.shortExplanation}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence Boosters */}
            <div>
              <h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Confidence Boosters
              </h4>
              <div className="space-y-2">
                {EDUCATIONAL_GUIDANCE.confidence_boosters.slice(0, 3).map((booster, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Star className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-amber-800">{booster}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center pt-2 border-t border-amber-200">
              <Button variant="outline" size="sm" className="text-amber-700 border-amber-300">
                <Users className="h-4 w-4 mr-2" />
                See More Learning Resources
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Context-specific educational content components
function FragrancePageEducation() {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-amber-900">Understanding This Fragrance</h4>
      <div className="text-sm text-amber-800 space-y-2">
        <p>• <strong>Notes:</strong> These are the scent ingredients you'll smell</p>
        <p>• <strong>Intensity:</strong> How strong the fragrance feels (1-10 scale)</p>
        <p>• <strong>Longevity:</strong> How many hours it lasts on your skin</p>
        <p>• <strong>Sillage:</strong> How far the scent travels around you</p>
      </div>
    </div>
  );
}

function QuizEducation() {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-amber-900">Taking the Quiz</h4>
      <div className="text-sm text-amber-800 space-y-2">
        <p>• Choose answers that feel right to you - there are no wrong choices</p>
        <p>• Think about scents you already enjoy in everyday life</p>
        <p>• We'll match these preferences to actual fragrances</p>
        <p>• You can always retake the quiz if you want different results</p>
      </div>
    </div>
  );
}

function SearchEducation() {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-amber-900">Finding Your Perfect Match</h4>
      <div className="text-sm text-amber-800 space-y-2">
        <p>• Start with fragrance families (Fresh, Floral, Woody, Oriental)</p>
        <p>• Use filters to narrow down intensity and longevity</p>
        <p>• Look for "Beginner Friendly" badges on recommendations</p>
        <p>• Order samples to test before committing to full bottles</p>
      </div>
    </div>
  );
}