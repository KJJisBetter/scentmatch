'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WheelViewProps {
  collection: any[];
  onItemClick: (item: any) => void;
  centerOnFamily?: string;
  className?: string;
}

/**
 * WheelView Component
 * 
 * Circular visualization of collection organized by scent families
 * Will be implemented in Task 3.3 with full SVG visualization
 */
export function WheelView({
  collection,
  onItemClick,
  centerOnFamily,
  className
}: WheelViewProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className="text-muted-foreground">
        <div className="text-4xl mb-4">🎯</div>
        <h3 className="text-lg font-semibold mb-2">Wheel View</h3>
        <p className="mb-4">
          Circular visualization coming in Task 3.3
        </p>
        <div className="text-sm">
          Will display {collection.length} fragrances organized by scent families
        </div>
      </div>
    </div>
  );
}