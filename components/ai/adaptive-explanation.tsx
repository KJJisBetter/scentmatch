/**
 * Adaptive AI Explanation Component
 * 
 * Displays AI explanations adapted to user experience level with:
 * - Progressive disclosure for beginners (SCE-66)
 * - Educational tooltips for fragrance terms (SCE-67)
 * - Confidence-building messaging for new users
 */

'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { RecommendationItem } from '@/lib/ai-sdk/unified-recommendation-engine'

interface AdaptiveExplanationProps {
  recommendation: RecommendationItem
  showEducationalTerms?: boolean
  className?: string
}

export function AdaptiveExplanation({ 
  recommendation, 
  showEducationalTerms = true,
  className = "" 
}: AdaptiveExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const adaptive = recommendation.adaptive_explanation

  // No adaptive explanation available - show standard explanation
  if (!adaptive) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        {recommendation.explanation}
      </div>
    )
  }

  // Beginner experience with progressive disclosure
  if (adaptive.user_experience_level === 'beginner') {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Summary explanation (always visible) */}
        <div className="text-sm">
          {adaptive.summary || recommendation.explanation}
        </div>

        {/* Confidence boost message */}
        {adaptive.confidence_boost && (
          <div 
            className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md"
            role="status"
            aria-label="Encouragement message"
          >
            <span aria-hidden="true">💡 </span>
            <span className="font-medium">{adaptive.confidence_boost}</span>
          </div>
        )}

        {/* Progressive disclosure for more details */}
        {adaptive.expanded_content && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0 h-auto text-xs text-blue-600 hover:text-blue-800"
              aria-expanded={isExpanded}
              aria-controls="adaptive-explanation-details"
              aria-label={isExpanded ? "Hide detailed explanation" : "Show detailed explanation"}
            >
              {isExpanded ? (
                <>
                  Show less <ChevronUpIcon className="ml-1 h-3 w-3" aria-hidden="true" />
                </>
              ) : (
                <>
                  Learn more about this match <ChevronDownIcon className="ml-1 h-3 w-3" aria-hidden="true" />
                </>
              )}
            </Button>

            {isExpanded && (
              <div 
                id="adaptive-explanation-details"
                className="text-xs text-muted-foreground pl-3 border-l-2 border-blue-200"
                role="region"
                aria-label="Detailed fragrance recommendation explanation"
              >
                {adaptive.expanded_content}
              </div>
            )}
          </>
        )}

        {/* Educational terms tooltips */}
        {showEducationalTerms && adaptive.educational_terms && (
          <EducationalTerms terms={adaptive.educational_terms} />
        )}
      </div>
    )
  }

  // Intermediate/Advanced users - show full explanation
  return (
    <div className={`space-y-2 ${className}`}>
      {adaptive.summary && (
        <div className="text-sm font-medium">
          {adaptive.summary}
        </div>
      )}
      
      <div className="text-sm text-muted-foreground">
        {recommendation.explanation}
      </div>

      {adaptive.expanded_content && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">
            More details
          </summary>
          <div className="mt-1 pl-3">
            {adaptive.expanded_content}
          </div>
        </details>
      )}

      {/* Experience level indicator */}
      <div className="flex items-center gap-1">
        <Badge 
          variant="outline" 
          className="text-xs"
          role="img"
          aria-label={`Content adapted for ${adaptive.user_experience_level} fragrance enthusiasts`}
        >
          <span aria-hidden="true">{adaptive.user_experience_level}</span>
        </Badge>
      </div>
    </div>
  )
}

/**
 * Educational Terms Component
 * Shows fragrance terminology with hover explanations
 */
function EducationalTerms({ 
  terms 
}: { 
  terms: Record<string, any> 
}) {
  const termEntries = Object.entries(terms)
  
  if (termEntries.length === 0) return null

  return (
    <Card className="bg-amber-50 border-amber-200">
      <CardContent className="p-3">
        <h3 className="text-xs font-medium text-amber-800 mb-2">
          <span aria-hidden="true">🎓 </span>
          Fragrance Terms to Know
        </h3>
        
        <div className="space-y-1">
          <TooltipProvider>
            {termEntries.map(([key, termData]) => (
              <div key={key} className="text-xs">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className="font-medium text-amber-700 underline decoration-dotted hover:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded"
                      aria-describedby={`tooltip-${key}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.currentTarget.blur();
                        }
                      }}
                    >
                      {termData.term}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent 
                    id={`tooltip-${key}`}
                    side="top" 
                    className="max-w-xs"
                    role="tooltip"
                  >
                    <div className="space-y-1">
                      <p className="font-medium" role="heading" aria-level={4}>{termData.term}</p>
                      <p className="text-xs">{termData.beginnerExplanation}</p>
                      {termData.example && (
                        <p className="text-xs text-muted-foreground italic">
                          <span className="sr-only">Example: </span>{termData.example}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Simplified Explanation Component for Mobile
 * Ultra-compact version for mobile interfaces
 */
export function MobileAdaptiveExplanation({ 
  recommendation 
}: { 
  recommendation: RecommendationItem 
}) {
  const adaptive = recommendation.adaptive_explanation

  // Beginner mobile view - show only summary with tap to expand
  if (adaptive?.user_experience_level === 'beginner') {
    return (
      <div className="text-sm">
        <div>{adaptive.summary || recommendation.explanation}</div>
        {adaptive.confidence_boost && (
          <div 
            className="text-xs text-blue-600 mt-1"
            role="status"
            aria-label="Encouragement message"
          >
            <span aria-hidden="true">💡 </span>
            <span className="font-medium">{adaptive.confidence_boost}</span>
          </div>
        )}
      </div>
    )
  }

  // Standard mobile view
  return (
    <div className="text-sm text-muted-foreground">
      {recommendation.explanation}
    </div>
  )
}

/**
 * Experience Level Badge Component
 * Shows user's detected experience level for debugging
 */
export function ExperienceLevelBadge({ 
  level 
}: { 
  level: 'beginner' | 'intermediate' | 'advanced' 
}) {
  const levelConfig = {
    beginner: { 
      color: 'bg-green-100 text-green-800', 
      icon: '🌱',
      label: 'New Explorer'
    },
    intermediate: { 
      color: 'bg-blue-100 text-blue-800', 
      icon: '📚',
      label: 'Learning'
    },
    advanced: { 
      color: 'bg-purple-100 text-purple-800', 
      icon: '🎯',
      label: 'Expert'
    }
  }

  const config = levelConfig[level]

  return (
    <Badge 
      className={`text-xs ${config.color}`}
      role="img"
      aria-label={`User experience level: ${config.label}`}
    >
      <span aria-hidden="true">{config.icon} </span>
      {config.label}
    </Badge>
  )
}