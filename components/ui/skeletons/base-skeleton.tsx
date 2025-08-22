import { cn } from '@/lib/utils';

/**
 * Base Skeleton Components
 * 
 * Foundation skeleton components that provide consistent styling
 * and animation patterns for all skeleton implementations.
 */

interface SkeletonBaseProps {
  className?: string;
  children?: React.ReactNode;
}

export function SkeletonBase({ className, children, ...props }: SkeletonBaseProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse bg-muted rounded', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function SkeletonText({ 
  className, 
  lines = 1,
  width = 'full'
}: { 
  className?: string;
  lines?: number;
  width?: 'full' | '3/4' | '1/2' | '1/3' | '1/4';
}) {
  const widthClass = {
    'full': 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2', 
    '1/3': 'w-1/3',
    '1/4': 'w-1/4',
  }[width];

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBase 
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? widthClass : 'w-full',
            className
          )} 
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ 
  size = 'default',
  className 
}: { 
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) {
  const sizeClass = {
    'sm': 'h-8 w-8',
    'default': 'h-10 w-10',
    'lg': 'h-12 w-12',
  }[size];

  return (
    <SkeletonBase 
      className={cn('rounded-full', sizeClass, className)} 
    />
  );
}

export function SkeletonButton({ 
  size = 'default',
  variant = 'default',
  className 
}: { 
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}) {
  const sizeClass = {
    'sm': 'h-8 px-3',
    'default': 'h-10 px-4',
    'lg': 'h-12 px-6',
  }[size];

  return (
    <SkeletonBase 
      className={cn('rounded-md', sizeClass, className)} 
    />
  );
}

export function SkeletonCard({ 
  children,
  className 
}: { 
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('bg-card rounded-xl border p-6', className)}>
      {children}
    </div>
  );
}

export function SkeletonImage({ 
  aspectRatio = 'square',
  className 
}: { 
  aspectRatio?: 'square' | 'video' | 'portrait';
  className?: string;
}) {
  const aspectClass = {
    'square': 'aspect-square',
    'video': 'aspect-video',
    'portrait': 'aspect-[3/4]',
  }[aspectRatio];

  return (
    <SkeletonBase 
      className={cn('rounded-lg', aspectClass, className)} 
    />
  );
}