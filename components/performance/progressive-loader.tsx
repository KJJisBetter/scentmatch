/**
 * Progressive Loading Component
 * Task 7.6: Implement progressive loading for heavy content
 * 
 * Features:
 * - Lazy loading with intersection observer
 * - Progressive image loading with placeholders
 * - Content prioritization based on viewport
 * - Smooth loading animations
 * - Error boundaries for failed loads
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveLoaderProps {
  children: React.ReactNode;
  className?: string;
  placeholder?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  priority?: 'high' | 'medium' | 'low';
  onLoad?: () => void;
  onError?: (error: Error) => void;
  fallback?: React.ReactNode;
  loadingDelay?: number;
}

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  blurDataURL?: string;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

interface LazyContentProps {
  children: React.ReactNode;
  className?: string;
  minHeight?: number;
  skeleton?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

// Hook for intersection observer
function useIntersectionObserver(
  threshold = 0.1,
  rootMargin = '50px'
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, hasIntersected]);

  return { isIntersecting, hasIntersected, targetRef };
}

// Progressive Image Component
export function ProgressiveImage({
  src,
  alt,
  className,
  placeholder,
  blurDataURL,
  priority = false,
  sizes,
  onLoad,
  onError,
}: ProgressiveImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!priority);
  
  const { hasIntersected, targetRef } = useIntersectionObserver(0.1, '50px');
  const imgRef = useRef<HTMLImageElement>(null);

  const shouldLoad = priority || hasIntersected;

  const handleLoad = useCallback(() => {
    setImageLoaded(true);
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  useEffect(() => {
    if (!shouldLoad || imageLoaded || imageError) return;

    const img = new Image();
    img.onload = handleLoad;
    img.onerror = handleError;
    
    // Add sizes for responsive images
    if (sizes) {
      img.sizes = sizes;
    }
    
    img.src = src;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [shouldLoad, src, handleLoad, handleError, imageLoaded, imageError, sizes]);

  return (
    <div
      ref={targetRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        className
      )}
    >
      {/* Placeholder/Blur */}
      {(!imageLoaded && !imageError) && (
        <div className="absolute inset-0 flex items-center justify-center">
          {blurDataURL ? (
            <img
              src={blurDataURL}
              alt=""
              className="w-full h-full object-cover opacity-50 scale-110 blur-sm"
              aria-hidden="true"
            />
          ) : placeholder ? (
            <div className="text-muted-foreground">{placeholder}</div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 animate-pulse" />
          )}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Actual image */}
      {shouldLoad && !imageError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          sizes={sizes}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
}

// Lazy Content Component
export function LazyContent({
  children,
  className,
  minHeight = 200,
  skeleton,
  threshold = 0.1,
  rootMargin = '100px',
}: LazyContentProps) {
  const { hasIntersected, targetRef } = useIntersectionObserver(threshold, rootMargin);

  return (
    <div
      ref={targetRef}
      className={cn('transition-all duration-300', className)}
      style={{ minHeight: hasIntersected ? 'auto' : minHeight }}
    >
      {hasIntersected ? (
        children
      ) : (
        skeleton || (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        )
      )}
    </div>
  );
}

// Main Progressive Loader Component
export function ProgressiveLoader({
  children,
  className,
  placeholder,
  threshold = 0.1,
  rootMargin = '50px',
  priority = 'medium',
  onLoad,
  onError,
  fallback,
  loadingDelay = 0,
}: ProgressiveLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority === 'high');
  
  const { hasIntersected, targetRef } = useIntersectionObserver(threshold, rootMargin);

  useEffect(() => {
    if (priority === 'high') {
      setIsVisible(true);
      return;
    }

    if (hasIntersected) {
      if (loadingDelay > 0) {
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, loadingDelay);
        return () => clearTimeout(timer);
      } else {
        setIsVisible(true);
      }
    }
  }, [hasIntersected, priority, loadingDelay]);

  useEffect(() => {
    if (!isVisible) return;

    // Simulate async loading
    const loadContent = async () => {
      try {
        // Add small delay to prevent flash
        await new Promise(resolve => setTimeout(resolve, 50));
        setIsLoading(false);
        onLoad?.();
      } catch (error) {
        setHasError(true);
        setIsLoading(false);
        onError?.(error as Error);
      }
    };

    loadContent();
  }, [isVisible, onLoad, onError]);

  return (
    <div ref={targetRef} className={cn('relative', className)}>
      {!isVisible && (
        <div className="flex items-center justify-center min-h-[200px]">
          {placeholder || <div className="animate-pulse bg-muted rounded-lg w-full h-full" />}
        </div>
      )}
      
      {isVisible && isLoading && (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      )}
      
      {hasError && (
        <div className="flex items-center justify-center min-h-[200px] text-center">
          {fallback || (
            <div className="text-muted-foreground">
              <p className="text-sm">Content failed to load</p>
              <button 
                className="text-xs text-primary hover:underline mt-2"
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                }}
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}
      
      {isVisible && !isLoading && !hasError && (
        <div className="animate-in fade-in duration-300">
          {children}
        </div>
      )}
    </div>
  );
}

// Content Priority Manager
export function ContentPriorityManager({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  useEffect(() => {
    // Preload critical resources
    const preloadCriticalResources = () => {
      // Preload critical fonts
      const fontLinks = document.querySelectorAll('link[rel="preload"][as="font"]');
      fontLinks.forEach(link => {
        const fontUrl = link.getAttribute('href');
        if (fontUrl) {
          const font = new FontFace('preload-font', `url(${fontUrl})`);
          font.load().catch(err => console.warn('Font preload failed:', err));
        }
      });

      // Preload critical images
      const heroImages = document.querySelectorAll('img[data-priority="high"]');
      heroImages.forEach(img => {
        const src = img.getAttribute('src');
        if (src) {
          const image = new Image();
          image.src = src;
        }
      });
    };

    // Run after initial render
    requestIdleCallback(preloadCriticalResources, { timeout: 2000 });
  }, []);

  return <>{children}</>;
}

// Skeleton components for common patterns
export const FragranceCardSkeleton = () => (
  <div className="animate-pulse space-y-3 p-4 border rounded-lg">
    <div className="h-48 bg-muted rounded"></div>
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-3 bg-muted rounded w-1/2"></div>
    </div>
  </div>
);

export const ReviewSkeleton = () => (
  <div className="animate-pulse space-y-3 p-4">
    <div className="flex items-center space-x-2">
      <div className="h-8 w-8 bg-muted rounded-full"></div>
      <div className="space-y-1 flex-1">
        <div className="h-3 bg-muted rounded w-1/4"></div>
        <div className="h-2 bg-muted rounded w-16"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-muted rounded"></div>
      <div className="h-3 bg-muted rounded w-4/5"></div>
    </div>
  </div>
);

export const SearchResultSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex space-x-3 p-3 border rounded">
        <div className="h-16 w-16 bg-muted rounded"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
          <div className="h-3 bg-muted rounded w-1/3"></div>
        </div>
      </div>
    ))}
  </div>
);