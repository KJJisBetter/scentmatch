'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  disabled?: boolean;
}

interface EmptyStateProps {
  /** Main heading text */
  title: string;
  /** Descriptive text below the title */
  description: string;
  /** Lucide icon to display */
  icon?: LucideIcon;
  /** Primary action button */
  primaryAction?: ActionButton;
  /** Secondary action button */
  secondaryAction?: ActionButton;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Standardized empty state component for consistent UX across the platform
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   title="No results found"
 *   description="Try adjusting your search terms"
 *   icon={Search}
 *   primaryAction={{
 *     label: "Clear search",
 *     onClick: () => router.push('/browse')
 *   }}
 * />
 * ```
 */
export function EmptyState({
  title,
  description,
  icon: Icon,
  primaryAction,
  secondaryAction,
  className,
  'data-testid': testId,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'text-center py-12 px-4',
        className
      )}
      role="status"
      aria-live="polite"
      data-testid={testId}
      {...props}
    >
      {/* Icon */}
      {Icon && (
        <Icon 
          className="h-12 w-12 text-muted-foreground mx-auto mb-4" 
          aria-hidden="true"
        />
      )}

      {/* Title */}
      <h2 className="text-lg font-medium text-foreground mb-2">
        {title}
      </h2>

      {/* Description */}
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {description}
      </p>

      {/* Action Buttons */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              variant={primaryAction.variant || 'default'}
              disabled={primaryAction.disabled}
              className="w-full sm:w-auto"
            >
              {primaryAction.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant || 'outline'}
              disabled={secondaryAction.disabled}
              className={cn(
                'w-full sm:w-auto',
                secondaryAction.variant === 'outline' && 'variant-outline'
              )}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}