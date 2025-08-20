'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const [isOpen, setIsOpen] = React.useState(false);

  // Close menu when route changes
  React.useEffect(() => {
    const handleRouteChange = () => setIsOpen(false);
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  // Lock body scroll when menu is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className='md:hidden' data-mobile-nav>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => setIsOpen(!isOpen)}
        className='touch-target'
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
      </Button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className='fixed inset-0 bg-background/80 backdrop-blur-md z-40'
            onClick={() => setIsOpen(false)}
          />

          {/* Mobile menu */}
          <div className='fixed top-16 left-0 right-0 bottom-0 z-50 bg-background border-t border-border/40'>
            <nav className='container py-8 space-y-6'>
              <div className='space-y-4'>
                <h3 className='font-medium text-foreground'>Discover</h3>
                <div className='space-y-3 pl-4'>
                  <Link
                    href='/browse'
                    className='block text-muted-foreground hover:text-foreground transition-colors touch-target'
                    onClick={() => setIsOpen(false)}
                  >
                    Browse Fragrances
                  </Link>
                  <Link
                    href='/quiz'
                    className='block text-muted-foreground hover:text-foreground transition-colors touch-target'
                    onClick={() => setIsOpen(false)}
                  >
                    Find Your Match
                  </Link>
                  <Link
                    href='/samples'
                    className='block text-muted-foreground hover:text-foreground transition-colors touch-target'
                    onClick={() => setIsOpen(false)}
                  >
                    Sample Sets
                  </Link>
                </div>
              </div>

              <div className='space-y-4'>
                <h3 className='font-medium text-foreground'>Learn</h3>
                <div className='space-y-3 pl-4'>
                  <Link
                    href='/quiz'
                    className='block text-muted-foreground hover:text-foreground transition-colors touch-target'
                    onClick={() => setIsOpen(false)}
                  >
                    Take Quiz
                  </Link>
                  <Link
                    href='/recommendations'
                    className='block text-muted-foreground hover:text-foreground transition-colors touch-target'
                    onClick={() => setIsOpen(false)}
                  >
                    Recommendations
                  </Link>
                </div>
              </div>

              <div className='pt-6 border-t border-border/40 space-y-4'>
                <Button asChild size='lg' className='w-full'>
                  <Link href='/auth/signup' onClick={() => setIsOpen(false)}>
                    Get Started
                  </Link>
                </Button>
                <Button variant='outline' asChild size='lg' className='w-full'>
                  <Link href='/auth/login' onClick={() => setIsOpen(false)}>
                    Sign In
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
