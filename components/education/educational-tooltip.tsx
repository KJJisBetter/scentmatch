"use client"

import React from 'react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HelpCircle, BookOpen, Lightbulb } from 'lucide-react';
import { EducationalTooltip as EducationalTooltipType, EducationLevel } from '@/lib/education/types';
import { cn } from '@/lib/utils';

interface EducationalTooltipProps {
  /** The educational content to display */
  content: EducationalTooltipType;
  /** The trigger element - can be text or custom component */
  children: React.ReactNode;
  /** Whether to show detailed explanation */
  showDetailed?: boolean;
  /** User's experience level affects content display */
  userLevel?: EducationLevel;
  /** Position of the tooltip */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Whether to show confidence building message */
  showConfidence?: boolean;
  /** Custom trigger styling */
  triggerClassName?: string;
  /** Whether to show as inline help icon */
  iconOnly?: boolean;
}

/**
 * EducationalTooltip Component
 * 
 * Provides contextual educational content via hover tooltips
 * for fragrance terminology and concepts. Helps beginners
 * understand terms without overwhelming the interface.
 */
export function EducationalTooltip({
  content,
  children,
  showDetailed = false,
  userLevel = 'beginner',
  side = 'top',
  showConfidence = true,
  triggerClassName,
  iconOnly = false
}: EducationalTooltipProps) {
  // Don't show educational content for advanced users unless explicitly requested
  if (userLevel === 'advanced' && !showDetailed) {
    return <>{children}</>;
  }

  const triggerElement = iconOnly ? (
    <Button
      variant="ghost"
      size="sm"
      className={cn("h-6 w-6 p-0 text-muted-foreground hover:text-foreground", triggerClassName)}
    >
      <HelpCircle className="h-4 w-4" />
      <span className="sr-only">Learn about {content.term}</span>
    </Button>
  ) : (
    <span 
      className={cn(
        "underline decoration-dotted decoration-muted-foreground underline-offset-2 cursor-help",
        triggerClassName
      )}
    >
      {children}
    </span>
  );

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {triggerElement}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className="max-w-xs p-4 text-sm"
          sideOffset={5}
        >
          <div className="space-y-3">
            {/* Term and short explanation */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {content.category}
                </Badge>
                {content.confidence_building && showConfidence && (
                  <Lightbulb className="h-3 w-3 text-amber-500" />
                )}
              </div>
              <p className="font-medium text-foreground mb-1">
                {content.term}
              </p>
              <p className="text-muted-foreground">
                {content.shortExplanation}
              </p>
            </div>

            {/* Detailed explanation for beginners */}
            {(showDetailed || userLevel === 'beginner') && content.detailedExplanation && (
              <div className="border-t border-border pt-2">
                <p className="text-sm text-muted-foreground">
                  {content.detailedExplanation}
                </p>
              </div>
            )}

            {/* Example */}
            {content.example && (
              <div className="bg-muted/50 rounded p-2">
                <p className="text-xs text-muted-foreground">
                  <BookOpen className="h-3 w-3 inline mr-1" />
                  Example: {content.example}
                </p>
              </div>
            )}

            {/* Confidence building message */}
            {content.confidence_building && showConfidence && userLevel === 'beginner' && (
              <div className="bg-green-50 border border-green-200 rounded p-2">
                <p className="text-xs text-green-700 flex items-start gap-1">
                  <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {content.confidence_building}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * InlineEducationalHelp Component
 * 
 * Shows educational content as an inline help icon next to terms
 */
interface InlineEducationalHelpProps {
  content: EducationalTooltipType;
  userLevel?: EducationLevel;
  className?: string;
}

export function InlineEducationalHelp({ 
  content, 
  userLevel = 'beginner',
  className 
}: InlineEducationalHelpProps) {
  return (
    <EducationalTooltip
      content={content}
      iconOnly
      userLevel={userLevel}
      triggerClassName={className}
    >
      <span />
    </EducationalTooltip>
  );
}

/**
 * EducationalHighlight Component
 * 
 * Wraps text with educational tooltip for inline explanations
 */
interface EducationalHighlightProps {
  term: string;
  content: EducationalTooltipType;
  userLevel?: EducationLevel;
  className?: string;
}

export function EducationalHighlight({
  term,
  content,
  userLevel = 'beginner',
  className
}: EducationalHighlightProps) {
  return (
    <EducationalTooltip
      content={content}
      userLevel={userLevel}
      triggerClassName={className}
    >
      {term}
    </EducationalTooltip>
  );
}