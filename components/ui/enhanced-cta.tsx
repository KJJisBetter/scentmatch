'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from './loading-spinner';
import { cn } from '@/lib/utils';

interface EnhancedCTAProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
  'data-analytics'?: string;
}

export function EnhancedCTA({
  href,
  children,
  className,
  variant = 'primary',
  'data-analytics': dataAnalytics,
}: EnhancedCTAProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    // Reset loading state after a short delay to prevent permanent loading
    setTimeout(() => setIsLoading(false), 3000);
  };

  const baseClasses =
    variant === 'primary'
      ? 'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-medium rounded-lg'
      : 'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-lg';

  return (
    <Link
      href={href}
      className={cn(
        baseClasses,
        'relative min-h-[48px]', // Ensure minimum touch target
        isLoading && 'cursor-wait',
        className
      )}
      onClick={handleClick}
      data-analytics={dataAnalytics}
      aria-disabled={isLoading}
    >
      <span className={cn('flex items-center', isLoading && 'opacity-0')}>
        {children}
      </span>

      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <LoadingSpinner size='sm' className='text-current' />
          <span className='sr-only'>Loading...</span>
        </div>
      )}
    </Link>
  );
}
