'use client';

import { Button } from '@/components/ui/button';
import { Grid, List, Circle, Calendar, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewSwitcherProps {
  currentView: 'grid' | 'list' | 'wheel' | 'calendar';
  onViewChange: (view: 'grid' | 'list' | 'wheel' | 'calendar') => void;
  viewOptions: ('grid' | 'list' | 'wheel' | 'calendar')[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ViewSwitcher Component
 * 
 * Provides intuitive switching between collection visualization modes
 * Implements research-backed patterns for view mode selection:
 * - Visual icons that clearly communicate view type
 * - Smooth transitions with proper ARIA labeling
 * - Mobile-optimized touch targets
 * - Keyboard navigation support
 */
export function ViewSwitcher({
  currentView,
  onViewChange,
  viewOptions,
  className,
  size = 'md'
}: ViewSwitcherProps) {
  const viewConfig = {
    grid: {
      icon: LayoutGrid,
      label: 'Grid View',
      description: 'Card-based layout with images and key details'
    },
    list: {
      icon: List,
      label: 'List View', 
      description: 'Detailed list with comprehensive information'
    },
    wheel: {
      icon: Circle,
      label: 'Wheel View',
      description: 'Circular organization by scent families'
    },
    calendar: {
      icon: Calendar,
      label: 'Calendar View',
      description: 'Timeline view showing collection growth'
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm', 
    lg: 'h-12 w-12 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div 
      className={cn('flex bg-muted rounded-lg p-1', className)}
      role="tablist"
      aria-label="Collection view options"
    >
      {viewOptions.map((view) => {
        const config = viewConfig[view];
        const Icon = config.icon;
        const isActive = currentView === view;

        return (
          <Button
            key={view}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'relative transition-all duration-200',
              sizeClasses[size],
              isActive && 'shadow-sm'
            )}
            onClick={() => onViewChange(view)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${view}-view-panel`}
            aria-label={config.label}
            title={`${config.label}: ${config.description}`}
          >
            <Icon className={iconSizes[size]} />
            
            {/* Active indicator */}
            {isActive && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
            )}
            
            {/* Screen reader text */}
            <span className="sr-only">{config.label}</span>
          </Button>
        );
      })}
    </div>
  );
}