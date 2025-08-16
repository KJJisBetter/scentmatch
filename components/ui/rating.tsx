'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  value: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
  showValue?: boolean;
  precision?: 'full' | 'half';
}

const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  ({
    value,
    maxRating = 5,
    size = 'md',
    interactive = false,
    onRatingChange,
    className,
    showValue = false,
    precision = 'full',
    ...props
  }, ref) => {
    const [hoverRating, setHoverRating] = React.useState(0);
    const [localRating, setLocalRating] = React.useState(value);

    React.useEffect(() => {
      setLocalRating(value);
    }, [value]);

    const handleStarClick = (rating: number) => {
      if (!interactive) return;
      
      setLocalRating(rating);
      onRatingChange?.(rating);
    };

    const handleStarHover = (rating: number) => {
      if (!interactive) return;
      setHoverRating(rating);
    };

    const handleMouseLeave = () => {
      if (!interactive) return;
      setHoverRating(0);
    };

    const displayRating = hoverRating || localRating;

    const sizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    const getStarFill = (starIndex: number): 'full' | 'half' | 'empty' => {
      if (precision === 'half') {
        if (displayRating >= starIndex + 1) return 'full';
        if (displayRating >= starIndex + 0.5) return 'half';
        return 'empty';
      } else {
        return displayRating >= starIndex + 1 ? 'full' : 'empty';
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center space-x-1',
          interactive && 'cursor-pointer',
          className
        )}
        onMouseLeave={handleMouseLeave}
        role={interactive ? 'radiogroup' : 'img'}
        aria-label={`Rating: ${value} out of ${maxRating} stars`}
        {...props}
      >
        {Array.from({ length: maxRating }, (_, index) => {
          const starFill = getStarFill(index);
          
          return (
            <button
              key={index}
              type="button"
              className={cn(
                'inline-flex items-center justify-center',
                interactive ? 'hover:scale-110 transition-transform duration-150' : 'cursor-default',
                !interactive && 'pointer-events-none'
              )}
              onClick={() => handleStarClick(index + 1)}
              onMouseEnter={() => handleStarHover(index + 1)}
              disabled={!interactive}
              role={interactive ? 'radio' : undefined}
              aria-checked={interactive ? displayRating >= index + 1 : undefined}
              aria-label={interactive ? `Rate ${index + 1} star${index + 1 > 1 ? 's' : ''}` : undefined}
            >
              {starFill === 'full' ? (
                <Star
                  className={cn(
                    sizeClasses[size],
                    'fill-amber-400 text-amber-400'
                  )}
                />
              ) : starFill === 'half' ? (
                <div className="relative">
                  <Star
                    className={cn(
                      sizeClasses[size],
                      'text-gray-300'
                    )}
                  />
                  <Star
                    className={cn(
                      sizeClasses[size],
                      'absolute inset-0 fill-amber-400 text-amber-400'
                    )}
                    style={{
                      clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
                    }}
                  />
                </div>
              ) : (
                <Star
                  className={cn(
                    sizeClasses[size],
                    'text-gray-300'
                  )}
                />
              )}
            </button>
          );
        })}
        
        {showValue && (
          <span className="ml-2 text-sm text-muted-foreground">
            {value.toFixed(precision === 'half' ? 1 : 0)} / {maxRating}
          </span>
        )}
      </div>
    );
  }
);

Rating.displayName = 'Rating';

export { Rating };
export type { RatingProps };