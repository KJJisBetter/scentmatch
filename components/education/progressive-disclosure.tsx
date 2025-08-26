/**
 * Progressive Disclosure Component
 * 
 * Optimized component for showing summary/detailed content with smooth animations
 * Designed for mobile-first performance and beginner-friendly UX
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Sparkles } from 'lucide-react';
import { educationCache } from '@/lib/education/cache-manager';
import { AdaptiveTooltip } from './optimized-tooltip';

export interface ProgressiveDisclosureProps {
  summary: string;
  expandedContent: string;
  educationalTerms?: Record<string, any>;
  confidenceBoost?: string;
  className?: string;
  defaultExpanded?: boolean;
  animationDuration?: number;
}

/**
 * High-performance progressive disclosure with smooth animations
 */
export function ProgressiveDisclosure({
  summary,
  expandedContent,
  educationalTerms,
  confidenceBoost,
  className = '',
  defaultExpanded = false,
  animationDuration = 300,
}: ProgressiveDisclosureProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    defaultExpanded ? undefined : 0
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Measure content height for smooth animation
  const measureHeight = useCallback(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      return height;
    }
    return 0;
  }, []);

  // Toggle expanded state with smooth animation
  const toggleExpanded = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!isExpanded) {
      // Expanding
      const targetHeight = measureHeight();
      setContentHeight(targetHeight);
      setIsExpanded(true);
      
      // Remove height constraint after animation
      timeoutRef.current = setTimeout(() => {
        setContentHeight(undefined);
      }, animationDuration);
    } else {
      // Collapsing
      const currentHeight = measureHeight();
      setContentHeight(currentHeight);
      
      // Force reflow
      contentRef.current?.offsetHeight;
      
      // Collapse
      timeoutRef.current = setTimeout(() => {
        setContentHeight(0);
        setIsExpanded(false);
      }, 10);
    }
  }, [isExpanded, measureHeight, animationDuration]);

  // Handle window resize
  useEffect(() => {
    if (isExpanded && contentHeight !== undefined) {
      const handleResize = () => {
        setContentHeight(measureHeight());
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isExpanded, contentHeight, measureHeight]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Process content with educational tooltips
  const processContentWithTooltips = useCallback((content: string) => {
    if (!educationalTerms) return content;

    let processedContent = content;
    
    Object.keys(educationalTerms).forEach(term => {
      const termRegex = new RegExp(`\\b${term.replace('_', ' ')}\\b`, 'gi');
      processedContent = processedContent.replace(termRegex, (match) => {
        return `<tooltip data-term="${term}">${match}</tooltip>`;
      });
    });

    return processedContent;
  }, [educationalTerms]);

  // Render content with tooltips
  const renderContentWithTooltips = useCallback((content: string) => {
    const processedContent = processContentWithTooltips(content);
    const parts = processedContent.split(/(<tooltip[^>]*>.*?<\/tooltip>)/);

    return parts.map((part, index) => {
      const tooltipMatch = part.match(/<tooltip data-term="([^"]*)">(.*?)<\/tooltip>/);
      
      if (tooltipMatch) {
        const [, term, text] = tooltipMatch;
        return (
          <AdaptiveTooltip key={index} term={term}>
            {text}
          </AdaptiveTooltip>
        );
      }
      
      return <span key={index}>{part}</span>;
    });
  }, [processContentWithTooltips]);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Summary Section */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-gray-900 leading-relaxed">
              {renderContentWithTooltips(summary)}
            </div>
            
            {/* Confidence Boost */}
            {confidenceBoost && (
              <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-green-700 font-medium">
                  💡 {confidenceBoost}
                </div>
              </div>
            )}

            {/* Toggle Button */}
            {expandedContent && (
              <button
                onClick={toggleExpanded}
                className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 
                          font-medium transition-colors duration-150 group"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Show less information' : 'Show more information'}
              >
                <BookOpen className="w-4 h-4" />
                <span>{isExpanded ? 'Show less' : 'Learn more'}</span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 transition-transform duration-150 group-hover:scale-110" />
                ) : (
                  <ChevronDown className="w-4 h-4 transition-transform duration-150 group-hover:scale-110" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expandedContent && (
        <div
          ref={contentRef}
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            height: contentHeight,
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="pt-4 text-gray-700 leading-relaxed">
              {renderContentWithTooltips(expandedContent)}
              
              {/* Educational Terms Section */}
              {educationalTerms && Object.keys(educationalTerms).length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-2">
                    Fragrance Terms
                  </div>
                  <div className="space-y-2">
                    {Object.entries(educationalTerms).slice(0, 3).map(([term, content]: [string, any]) => (
                      <div key={term} className="text-sm">
                        <AdaptiveTooltip term={term}>
                          <span className="font-medium text-blue-700">
                            {content.term || term.replace('_', ' ')}
                          </span>
                        </AdaptiveTooltip>
                        <span className="text-gray-600 ml-1">
                          - {content.shortExplanation || 'Learn more about this term'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for mobile or tight spaces
 */
export function CompactProgressiveDisclosure({
  summary,
  expandedContent,
  className = '',
}: Pick<ProgressiveDisclosureProps, 'summary' | 'expandedContent' | 'className'>) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-gray-50 rounded-lg p-3 ${className}`}>
      <div className="text-sm text-gray-700">
        {summary}
      </div>
      
      {expandedContent && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="mt-2 text-xs text-blue-600 font-medium hover:text-blue-700 
                    flex items-center gap-1 transition-colors duration-150"
        >
          <span>More details</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      )}
      
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 animate-in slide-in-from-top-1 duration-200">
          <div className="text-sm text-gray-600 leading-relaxed">
            {expandedContent}
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="mt-2 text-xs text-gray-500 font-medium hover:text-gray-700 
                      flex items-center gap-1 transition-colors duration-150"
          >
            <span>Show less</span>
            <ChevronUp className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Auto-detecting progressive disclosure that adapts to screen size
 */
export function AdaptiveProgressiveDisclosure(props: ProgressiveDisclosureProps) {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsCompact(window.innerWidth < 640); // sm breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (isCompact) {
    return <CompactProgressiveDisclosure {...props} />;
  }

  return <ProgressiveDisclosure {...props} />;
}