'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  fallbackSrc = '/placeholder-fragrance.jpg',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      onError?.();
    }
  };

  const imageProps: any = {
    src: currentSrc,
    alt,
    onLoad: handleLoad,
    onError: handleError,
    className: cn(
      'transition-opacity duration-300',
      isLoading ? 'opacity-0' : 'opacity-100',
      className
    ),
  };

  if (width && height) {
    imageProps.width = width;
    imageProps.height = height;
  } else {
    imageProps.fill = true;
    imageProps.className = cn(imageProps.className, 'object-cover');
  }

  if (priority) {
    imageProps.priority = true;
  }

  if (placeholder && blurDataURL) {
    imageProps.placeholder = placeholder;
    imageProps.blurDataURL = blurDataURL;
  }

  return (
    <div className={cn('relative', width && height ? '' : 'w-full h-full')}>
      {isLoading && (
        <Skeleton
          className={cn(
            'absolute inset-0',
            width && height ? `w-[${width}px] h-[${height}px]` : 'w-full h-full'
          )}
        />
      )}

      <Image {...imageProps} alt={alt} />

      {hasError && currentSrc === fallbackSrc && (
        <div className='absolute inset-0 flex items-center justify-center bg-muted'>
          <span className='text-muted-foreground text-sm'>
            Image unavailable
          </span>
        </div>
      )}
    </div>
  );
}
