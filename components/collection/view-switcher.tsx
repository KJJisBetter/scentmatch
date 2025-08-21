'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Grid, List, Circle, Calendar, LayoutGrid, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewSwitcherProps {
  currentView: 'grid' | 'list' | 'table' | 'wheel' | 'calendar';
  onViewChange: (
    view: 'grid' | 'list' | 'table' | 'wheel' | 'calendar'
  ) => void;
  viewOptions: ('grid' | 'list' | 'table' | 'wheel' | 'calendar')[];
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
  size = 'md',
}: ViewSwitcherProps) {
  const viewConfig = {
    grid: {
      icon: LayoutGrid,
      label: 'Grid View',
      description: 'Card-based layout with images and key details',
    },
    list: {
      icon: List,
      label: 'List View',
      description: 'Detailed list with comprehensive information',
    },
    table: {
      icon: Table2,
      label: 'Table View',
      description: 'Modern data table with sorting and filtering',
    },
    wheel: {
      icon: Circle,
      label: 'Wheel View',
      description: 'Circular organization by scent families',
    },
    calendar: {
      icon: Calendar,
      label: 'Calendar View',
      description: 'Timeline view showing collection growth',
    },
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <ToggleGroup
      type='single'
      value={currentView}
      onValueChange={value => value && onViewChange(value as any)}
      className={cn('bg-muted rounded-lg p-1', className)}
      aria-label='Collection view options'
    >
      {viewOptions.map(view => {
        const config = viewConfig[view];
        const Icon = config.icon;

        return (
          <ToggleGroupItem
            key={view}
            value={view}
            className={cn(
              'relative transition-all duration-200',
              sizeClasses[size]
            )}
            aria-label={config.label}
            title={`${config.label}: ${config.description}`}
          >
            <Icon className={iconSizes[size]} />
            <span className='sr-only'>{config.label}</span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
