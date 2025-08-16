'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100'>
      <div className='max-w-md w-full mx-auto p-8 bg-white rounded-xl shadow-lg border border-slate-200'>
        <div className='text-center'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg
              className='w-8 h-8 text-red-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
          </div>

          <h2 className='text-2xl font-bold text-slate-900 mb-2'>
            Something went wrong!
          </h2>

          <p className='text-slate-600 mb-6'>
            We encountered an unexpected error. This has been logged and we're
            looking into it.
          </p>

          <div className='space-y-3'>
            <Button onClick={reset} className='w-full'>
              Try again
            </Button>

            <Button
              variant='outline'
              onClick={() => (window.location.href = '/')}
              className='w-full'
            >
              Go home
            </Button>
          </div>

          {error.digest && (
            <p className='text-xs text-slate-400 mt-4'>
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
