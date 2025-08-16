'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  collection: any[];
  onItemClick: (item: any) => void;
  currentMonth?: Date;
  showUsageHeatmap?: boolean;
  className?: string;
}

/**
 * CalendarView Component
 * 
 * Timeline visualization of collection growth and usage patterns
 * Will be implemented in Task 3.3 with full calendar functionality
 */
export function CalendarView({
  collection,
  onItemClick,
  currentMonth = new Date(),
  showUsageHeatmap = true,
  className
}: CalendarViewProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className="text-muted-foreground">
        <div className="text-4xl mb-4">📅</div>
        <h3 className="text-lg font-semibold mb-2">Calendar View</h3>
        <p className="mb-4">
          Timeline visualization coming in Task 3.3
        </p>
        <div className="text-sm">
          Will show {collection.length} fragrances on timeline for {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
}