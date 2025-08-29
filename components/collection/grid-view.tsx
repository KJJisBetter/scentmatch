'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rating } from '@/components/ui/rating';
import { Button } from '@/components/ui/button';
import { Heart, Star, Calendar, Clock, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GridViewProps {
  collection: any[];
  onItemClick: (item: any) => void;
  onItemSelect?: (itemId: string, selected: boolean) => void;
  selectedItems?: string[];
  enableSelection?: boolean;
  className?: string;
}

/**
 * GridView Component
 *
 * Responsive grid layout for collection visualization
 * Implements research-backed patterns:
 * - Progressive disclosure with hover states
 * - Mobile-first responsive design (1/2/3/4/6 columns)
 * - Performance optimization for large collections
 * - Touch-friendly interactions with proper sizing
 * - Accessibility-compliant card structure
 */
export function GridView({
  collection,
  onItemClick,
  onItemSelect,
  selectedItems = [],
  enableSelection = true,
  className,
}: GridViewProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Handle card click (navigate to detail)
  const handleCardClick = (item: any, event: React.MouseEvent) => {
    // Don't navigate if clicking on checkbox or action buttons
    if (
      (event.target as HTMLElement).closest('input[type="checkbox"]') ||
      (event.target as HTMLElement).closest('.item-actions')
    ) {
      return;
    }

    onItemClick(item);
  };

  // Handle checkbox selection
  const handleSelection = (item: any, selected: boolean) => {
    onItemSelect?.(item.id, selected);
  };

  // Get status color for visual indicators
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'saved':
        return 'bg-indigo-500';
      case 'owned':
        return 'bg-green-500';
      case 'wishlist':
        return 'bg-amber-500';
      case 'tried':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Format usage frequency for display
  const formatUsageFrequency = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return 'Daily wear';
      case 'weekly':
        return 'Weekly rotation';
      case 'occasional':
        return 'Special occasions';
      case 'special':
        return 'Very special events';
      default:
        return null;
    }
  };

  if (collection.length === 0) {
    return (
      <div className='text-center py-12 text-muted-foreground'>
        <div className='mb-4'>No fragrances to display</div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Grid Container */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6'>
        {collection.map(item => {
          const fragrance = item.fragrances;
          const brand =
            fragrance?.fragrance_brands?.[0]?.name ||
            fragrance?.fragrance_brands?.name ||
            'Unknown Brand';
          const isSelected = selectedItems.includes(item.id);
          const isHovered = hoveredItem === item.id;

          return (
            <Card
              key={item.id}
              className={cn(
                'group relative cursor-pointer transition-all duration-300',
                'hover:shadow-md hover:scale-[1.02]',
                'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                isSelected && 'ring-2 ring-primary ring-offset-2',
                isHovered && 'shadow-lg'
              )}
              onClick={e => handleCardClick(item, e)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Selection Checkbox */}
              {enableSelection && (
                <div className='absolute top-3 left-3 z-10'>
                  <input
                    type='checkbox'
                    checked={isSelected}
                    onChange={e => handleSelection(item, e.target.checked)}
                    className={cn(
                      'w-5 h-5 rounded border-border focus:ring-2 focus:ring-ring',
                      'transition-opacity duration-200',
                      isSelected || isHovered
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                    )}
                    aria-label={`Select ${fragrance?.name || 'fragrance'}`}
                  />
                </div>
              )}

              {/* Status Indicator */}
              <div className='absolute top-3 right-3 z-10'>
                <div
                  className={cn(
                    'w-3 h-3 rounded-full border-2 border-white shadow-sm',
                    getStatusColor(item.status)
                  )}
                  title={`Status: ${item.status}`}
                />
              </div>

              <CardContent className='p-4'>
                {/* Fragrance Image */}
                <div className='aspect-square relative mb-3 bg-gradient-to-br from-cream-100 to-cream-200 rounded-lg overflow-hidden'>
                  {fragrance?.image_url ? (
                    <Image
                      src={fragrance.image_url}
                      alt={`${fragrance.name} by ${brand}`}
                      fill
                      className='object-cover transition-transform duration-300 group-hover:scale-105'
                      sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                    />
                  ) : (
                    <div className='flex items-center justify-center h-full text-muted-foreground'>
                      <div className='text-center'>
                        <div className='text-2xl mb-1'>🌸</div>
                        <p className='text-xs'>No image</p>
                      </div>
                    </div>
                  )}

                  {/* Hover Overlay with Quick Actions */}
                  <div
                    className={cn(
                      'absolute inset-0 bg-black/60 flex items-center justify-center',
                      'transition-opacity duration-200',
                      isHovered ? 'opacity-100' : 'opacity-0'
                    )}
                  >
                    <div className='flex space-x-2 item-actions'>
                      <Button
                        size='sm'
                        variant='default'
                        className='bg-white text-black hover:bg-gray-100'
                        onClick={e => {
                          e.stopPropagation();
                          onItemClick(item);
                        }}
                      >
                        View Details
                      </Button>

                      {item.status === 'wishlist' && (
                        <Button
                          size='sm'
                          variant='outline'
                          className='bg-white/90 text-black border-white hover:bg-white'
                          onClick={e => {
                            e.stopPropagation();
                            // Handle quick add to owned
                          }}
                        >
                          <Heart className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fragrance Information */}
                <div className='space-y-2'>
                  <h3 className='font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors'>
                    {fragrance?.name || 'Unknown Fragrance'}
                  </h3>

                  <p className='text-sm text-muted-foreground line-clamp-1'>
                    {brand}
                  </p>

                  {/* Scent Family Badge */}
                  {fragrance?.fragrance_family && (
                    <Badge variant='outline' className='text-xs'>
                      {fragrance.fragrance_family}
                    </Badge>
                  )}

                  {/* Rating Display */}
                  {item.rating && (
                    <div className='flex items-center space-x-2'>
                      <Rating value={item.rating} size='sm' />
                      <span className='text-xs text-muted-foreground'>
                        {item.rating}/5
                      </span>
                    </div>
                  )}

                  {/* Personal Notes Preview */}
                  {item.notes && (
                    <p className='text-xs text-muted-foreground line-clamp-2 italic'>
                      "{item.notes}"
                    </p>
                  )}

                  {/* Usage Information */}
                  <div className='flex items-center justify-between text-xs text-muted-foreground'>
                    <div className='flex items-center space-x-1'>
                      <Calendar className='h-3 w-3' />
                      <span>
                        {new Date(item.added_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {item.usage_frequency && (
                      <div className='flex items-center space-x-1'>
                        <Clock className='h-3 w-3' />
                        <span className='capitalize'>
                          {formatUsageFrequency(item.usage_frequency)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Occasions and Seasons Tags */}
                  {(item.occasions?.length > 0 || item.seasons?.length > 0) && (
                    <div className='flex flex-wrap gap-1 mt-2'>
                      {item.occasions?.slice(0, 2).map((occasion: string) => (
                        <Badge
                          key={occasion}
                          variant='secondary'
                          className='text-xs px-1 py-0'
                        >
                          {occasion}
                        </Badge>
                      ))}
                      {item.seasons?.slice(0, 1).map((season: string) => (
                        <Badge
                          key={season}
                          variant='outline'
                          className='text-xs px-1 py-0'
                        >
                          {season}
                        </Badge>
                      ))}
                      {(item.occasions?.length > 2 ||
                        item.seasons?.length > 1) && (
                        <Badge
                          variant='secondary'
                          className='text-xs px-1 py-0'
                        >
                          +
                          {item.occasions?.length -
                            2 +
                            (item.seasons?.length - 1)}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Selection Indicator */}
              {isSelected && (
                <div className='absolute inset-0 border-2 border-primary rounded-lg pointer-events-none' />
              )}
            </Card>
          );
        })}
      </div>

      {/* Grid Stats */}
      <div className='flex items-center justify-between text-sm text-muted-foreground'>
        <div>
          Showing {collection.length} fragrance
          {collection.length !== 1 ? 's' : ''}
        </div>

        {selectedItems.length > 0 && <div>{selectedItems.length} selected</div>}
      </div>
    </div>
  );
}
