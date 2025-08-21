'use client';

import React, { Suspense } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface StreamingLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

// Layout optimized for Core Web Vitals with progressive loading
export function StreamingLayout({
  children,
  sidebar,
  header,
  footer,
  className = '',
  isLoading = false,
}: StreamingLayoutProps) {
  return (
    <div className={cn('min-h-screen flex flex-col', className)}>
      {/* Header with Suspense */}
      {header && (
        <header className='flex-shrink-0'>
          <Suspense fallback={<HeaderSkeleton />}>{header}</Suspense>
        </header>
      )}

      {/* Main content area */}
      <main className='flex-1 flex'>
        {/* Sidebar with Suspense */}
        {sidebar && (
          <aside className='w-64 flex-shrink-0 hidden lg:block'>
            <Suspense fallback={<SidebarSkeleton />}>{sidebar}</Suspense>
          </aside>
        )}

        {/* Main content */}
        <div className='flex-1 overflow-hidden'>
          {isLoading ? (
            <ContentSkeleton />
          ) : (
            <Suspense fallback={<ContentSkeleton />}>{children}</Suspense>
          )}
        </div>
      </main>

      {/* Footer with Suspense */}
      {footer && (
        <footer className='flex-shrink-0 mt-auto'>
          <Suspense fallback={<FooterSkeleton />}>{footer}</Suspense>
        </footer>
      )}
    </div>
  );
}

// Optimized skeleton components for better CLS
function HeaderSkeleton() {
  return (
    <div className='h-16 bg-background border-b border-border'>
      <div className='max-w-7xl mx-auto px-4 h-full flex items-center justify-between'>
        <Skeleton className='h-8 w-32' />
        <div className='flex space-x-4'>
          <Skeleton className='h-10 w-24' />
          <Skeleton className='h-10 w-24' />
        </div>
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className='h-full bg-background border-r border-border p-6'>
      <div className='space-y-4'>
        <Skeleton className='h-6 w-3/4' />
        <div className='space-y-2'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='h-8 w-full' />
          ))}
        </div>
        <Skeleton className='h-6 w-1/2 mt-8' />
        <div className='space-y-2'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-8 w-full' />
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className='p-6 space-y-6'>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-1/3' />
        <Skeleton className='h-4 w-2/3' />
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className='space-y-3'>
            <Skeleton className='aspect-square w-full' />
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
          </div>
        ))}
      </div>
    </div>
  );
}

function FooterSkeleton() {
  return (
    <div className='h-24 bg-muted/50 border-t border-border'>
      <div className='max-w-7xl mx-auto px-4 h-full flex items-center justify-center'>
        <Skeleton className='h-6 w-48' />
      </div>
    </div>
  );
}

// Progressive content wrapper for better perceived performance
interface ProgressiveContentProps {
  children: React.ReactNode;
  stage: number;
  totalStages: number;
  stageName?: string;
  className?: string;
}

export function ProgressiveContent({
  children,
  stage,
  totalStages,
  stageName,
  className = '',
}: ProgressiveContentProps) {
  const progress = (stage / totalStages) * 100;
  const isComplete = stage >= totalStages;

  return (
    <div
      className={cn('relative', className)}
      role='region'
      aria-label={stageName || `Loading stage ${stage} of ${totalStages}`}
    >
      {/* Progress indicator */}
      {!isComplete && (
        <div className='mb-4'>
          <div className='flex items-center space-x-2 mb-2'>
            <div className='flex-1 bg-muted rounded-full h-1'>
              <div
                className='h-1 bg-primary rounded-full transition-all duration-300'
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className='text-xs text-muted-foreground'>
              {Math.round(progress)}%
            </span>
          </div>
          {stageName && (
            <p className='text-sm text-muted-foreground' aria-live='polite'>
              {stageName}
            </p>
          )}
        </div>
      )}

      {/* Content with fade-in animation */}
      <div
        className={cn(
          'transition-opacity duration-300',
          isComplete ? 'opacity-100' : 'opacity-75'
        )}
      >
        {children}
      </div>
    </div>
  );
}
