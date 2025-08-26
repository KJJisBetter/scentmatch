/**
 * Performance-Optimized Educational Tooltip
 * 
 * Lightweight tooltip component optimized for instant loading
 * Minimal bundle impact with lazy-loaded educational content
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { educationCache } from '@/lib/education/cache-manager';
import { EDUCATIONAL_GUIDANCE } from '@/lib/education/content';
import type { EducationalTooltip } from '@/lib/education/types';

export interface OptimizedTooltipProps {
  term: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

/**
 * High-performance tooltip with instant content loading
 */
export function OptimizedTooltip({
  term,
  children,
  position = 'top',
  delay = 200,
  className = '',
}: OptimizedTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [content, setContent] = useState<EducationalTooltip | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  // Get educational content from cache or static data
  const getContent = useCallback(() => {
    // Try cache first for instant loading
    const cacheKey = `tooltip_${term}`;
    const cached = educationCache.get<EducationalTooltip>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Fallback to static content
    const staticContent = EDUCATIONAL_GUIDANCE.concentration_help[term] || 
                         EDUCATIONAL_GUIDANCE.note_explanations[term];

    if (staticContent) {
      // Cache for future use
      educationCache.set(cacheKey, staticContent, 3600000); // 1 hour
      return staticContent;
    }

    return null;
  }, [term]);

  // Calculate optimal tooltip position
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return { x: 0, y: 0 };

    const rect = triggerRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let x = rect.left + scrollX + rect.width / 2;
    let y = rect.top + scrollY;

    switch (position) {
      case 'top':
        y -= 10;
        break;
      case 'bottom':
        y += rect.height + 10;
        break;
      case 'left':
        x = rect.left + scrollX - 10;
        y += rect.height / 2;
        break;
      case 'right':
        x = rect.right + scrollX + 10;
        y += rect.height / 2;
        break;
    }

    return { x, y };
  }, [position]);

  // Show tooltip with minimal delay
  const showTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      const tooltipContent = getContent();
      if (tooltipContent) {
        setContent(tooltipContent);
        setTooltipPosition(calculatePosition());
        setIsVisible(true);
      }
    }, delay);
  }, [getContent, calculatePosition, delay]);

  // Hide tooltip immediately
  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Tooltip content component
  const TooltipContent = () => {
    if (!content || !isVisible) return null;

    return createPortal(
      <div
        className={`
          fixed z-50 max-w-xs p-3 text-sm bg-gray-900 text-white rounded-lg shadow-lg
          transform -translate-x-1/2 -translate-y-full
          animate-in fade-in-0 zoom-in-95 duration-200
          ${position === 'bottom' ? 'translate-y-2' : ''}
          ${position === 'left' ? 'translate-x-0 translate-y-0' : ''}
          ${position === 'right' ? '-translate-x-full translate-y-0' : ''}
        `}
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
        }}
      >
        {/* Arrow */}
        <div
          className={`
            absolute w-2 h-2 bg-gray-900 transform rotate-45
            ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
            ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
            ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' : ''}
            ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}
          `}
        />
        
        {/* Content */}
        <div className="space-y-1">
          <div className="font-semibold text-xs text-blue-200">
            {content.term}
          </div>
          <div className="text-gray-100">
            {content.shortExplanation}
          </div>
          {content.example && (
            <div className="text-xs text-gray-300 italic">
              {content.example}
            </div>
          )}
          {content.confidence_building && (
            <div className="text-xs text-green-200 mt-2">
              💡 {content.confidence_building}
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <span
        ref={triggerRef}
        className={`
          inline-block cursor-help underline decoration-dotted decoration-blue-500
          hover:decoration-solid transition-all duration-150
          ${className}
        `}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        tabIndex={0}
        role="button"
        aria-describedby={`tooltip-${term}`}
      >
        {children}
      </span>
      <TooltipContent />
    </>
  );
}

/**
 * Lightweight version for mobile with simplified interactions
 */
export function MobileOptimizedTooltip({
  term,
  children,
  className = '',
}: Omit<OptimizedTooltipProps, 'position' | 'delay'>) {
  const [isVisible, setIsVisible] = useState(false);
  const [content, setContent] = useState<EducationalTooltip | null>(null);

  const toggleTooltip = useCallback(() => {
    if (!isVisible) {
      const cacheKey = `tooltip_${term}`;
      const cached = educationCache.get<EducationalTooltip>(cacheKey) ||
                    EDUCATIONAL_GUIDANCE.concentration_help[term] ||
                    EDUCATIONAL_GUIDANCE.note_explanations[term];
      
      if (cached) {
        setContent(cached);
        setIsVisible(true);
      }
    } else {
      setIsVisible(false);
    }
  }, [term, isVisible]);

  // Mobile tooltip as modal overlay
  const MobileTooltipContent = () => {
    if (!content || !isVisible) return null;

    return createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={() => setIsVisible(false)}
      >
        <div
          className="bg-white rounded-lg p-4 max-w-sm w-full animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-3">
            <div className="font-semibold text-blue-600">
              {content.term}
            </div>
            <div className="text-gray-700">
              {content.shortExplanation}
            </div>
            {content.example && (
              <div className="text-sm text-gray-600 italic">
                Example: {content.example}
              </div>
            )}
            {content.confidence_building && (
              <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                💡 {content.confidence_building}
              </div>
            )}
            <button
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm"
              onClick={() => setIsVisible(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <span
        className={`
          inline-block cursor-pointer underline decoration-dotted decoration-blue-500
          active:decoration-solid transition-all duration-150
          ${className}
        `}
        onClick={toggleTooltip}
        role="button"
        aria-label={`Learn about ${term}`}
      >
        {children}
      </span>
      <MobileTooltipContent />
    </>
  );
}

/**
 * Auto-detecting tooltip that uses mobile version on touch devices
 */
export function AdaptiveTooltip(props: OptimizedTooltipProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect touch device
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsMobile(hasTouch);
  }, []);

  if (isMobile) {
    return <MobileOptimizedTooltip {...props} />;
  }

  return <OptimizedTooltip {...props} />;
}