'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveLoaderProps {
  isLoading: boolean;
  progress?: number;
  status?: string;
  className?: string;
  children?: React.ReactNode;
  onComplete?: () => void;
  ariaLabel?: string;
}

export function ProgressiveLoader({
  isLoading,
  progress = 0,
  status = 'Loading...',
  className = '',
  children,
  onComplete,
  ariaLabel = 'Loading content',
}: ProgressiveLoaderProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      // Smooth progress animation
      const interval = setInterval(() => {
        setDisplayProgress(prev => {
          const newProgress = Math.min(prev + 2, progress);
          if (newProgress >= 100 && onComplete) {
            onComplete();
          }
          return newProgress;
        });
      }, 50);

      return () => clearInterval(interval);
    } else {
      setDisplayProgress(100);
      if (onComplete) {
        setTimeout(onComplete, 300);
      }
    }
    return undefined;
  }, [isLoading, progress, onComplete]);

  if (!isLoading && children) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn('space-y-4', className)}
      role='status'
      aria-label={ariaLabel}
      aria-live='polite'
    >
      {/* Progress bar */}
      <div className='w-full bg-muted rounded-full h-2 overflow-hidden'>
        <div
          className='h-full bg-primary transition-all duration-300 ease-out'
          style={{ width: `${displayProgress}%` }}
          role='progressbar'
          aria-valuenow={displayProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Status text */}
      <div className='text-center'>
        <p className='text-sm text-muted-foreground' aria-live='polite'>
          {status}
        </p>
        <p className='text-xs text-muted-foreground mt-1'>
          {displayProgress}% complete
        </p>
      </div>

      {children && (
        <div className='opacity-50 pointer-events-none'>{children}</div>
      )}
    </div>
  );
}

interface StreamingContentProps {
  isStreaming: boolean;
  streamStage: string;
  totalStages: number;
  currentStage: number;
  children: React.ReactNode;
  className?: string;
}

export function StreamingContent({
  isStreaming,
  streamStage,
  totalStages,
  currentStage,
  children,
  className = '',
}: StreamingContentProps) {
  const progress = (currentStage / totalStages) * 100;

  return (
    <div className={cn('relative', className)}>
      {isStreaming && (
        <div className='absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex items-center justify-center'>
          <div className='text-center space-y-4 max-w-md mx-auto p-6'>
            {/* Animated dots */}
            <div className='flex items-center justify-center space-x-1'>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className='w-2 h-2 bg-primary rounded-full animate-pulse'
                  style={{
                    animationDelay: `${i * 200}ms`,
                    animationDuration: '1s',
                  }}
                />
              ))}
            </div>

            <ProgressiveLoader
              isLoading={isStreaming}
              progress={progress}
              status={streamStage}
              ariaLabel={`Loading stage ${currentStage} of ${totalStages}: ${streamStage}`}
            />
          </div>
        </div>
      )}

      <div
        className={
          isStreaming
            ? 'opacity-50'
            : 'opacity-100 transition-opacity duration-300'
        }
      >
        {children}
      </div>
    </div>
  );
}
