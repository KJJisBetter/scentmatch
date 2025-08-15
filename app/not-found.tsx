import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100'>
      <div className='max-w-md w-full mx-auto p-8 bg-white rounded-xl shadow-lg border border-slate-200'>
        <div className='text-center'>
          <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg
              className='w-8 h-8 text-slate-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
          </div>

          <h1 className='text-6xl font-bold text-slate-900 mb-2'>404</h1>
          <h2 className='text-2xl font-semibold text-slate-700 mb-4'>
            Page Not Found
          </h2>

          <p className='text-slate-600 mb-6'>
            The fragrance you're looking for seems to have vanished into thin
            air. Let's get you back on track to discover your perfect scent.
          </p>

          <div className='space-y-3'>
            <Button asChild className='w-full'>
              <Link href='/'>Return Home</Link>
            </Button>

            <Button variant='outline' asChild className='w-full'>
              <Link href='/search'>Search Fragrances</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
