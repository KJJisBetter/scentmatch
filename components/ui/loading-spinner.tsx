import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        className
      )}
      role='status'
      aria-label='Loading'
    >
      <span className='sr-only'>Loading...</span>
    </div>
  );
}

interface LoadingButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
  href?: string;
}

export function LoadingButton({
  children,
  isLoading = false,
  className,
  onClick,
  href,
}: LoadingButtonProps) {
  const content = (
    <>
      {isLoading && <LoadingSpinner size='sm' className='mr-2 text-current' />}
      {children}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={cn('inline-flex items-center', className)}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      className={cn('inline-flex items-center', className)}
      onClick={onClick}
      disabled={isLoading}
    >
      {content}
    </button>
  );
}
