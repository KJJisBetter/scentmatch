'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function MobileNavSheet() {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();

  // Close menu when route changes
  React.useEffect(() => {
    const handleRouteChange = () => setIsOpen(false);
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  // Handle navigation with sheet close
  const handleNavigation = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <div className='md:hidden'>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='touch-target'
            aria-label='Open navigation menu'
          >
            <Menu className='h-5 w-5' />
          </Button>
        </SheetTrigger>
        <SheetContent side='left' className='w-[280px] sm:w-[350px]'>
          <SheetHeader>
            <SheetTitle className='text-left'>Navigation</SheetTitle>
            <SheetDescription className='text-left'>
              Browse fragrances, take the quiz, and manage your account
            </SheetDescription>
          </SheetHeader>

          <nav className='mt-8 space-y-8'>
            {/* Discover Section */}
            <div className='space-y-4'>
              <h3 className='font-medium text-foreground'>Discover</h3>
              <div className='space-y-3 pl-4'>
                <button
                  onClick={() => handleNavigation('/browse')}
                  className='block w-full text-left text-muted-foreground hover:text-foreground transition-colors touch-target py-2'
                >
                  Browse Fragrances
                </button>
                <button
                  onClick={() => handleNavigation('/quiz')}
                  className='block w-full text-left text-muted-foreground hover:text-foreground transition-colors touch-target py-2'
                >
                  Find Your Match
                </button>
                <button
                  onClick={() => handleNavigation('/samples')}
                  className='block w-full text-left text-muted-foreground hover:text-foreground transition-colors touch-target py-2'
                >
                  Sample Sets
                </button>
              </div>
            </div>

            {/* Learn Section */}
            <div className='space-y-4'>
              <h3 className='font-medium text-foreground'>Learn</h3>
              <div className='space-y-3 pl-4'>
                <button
                  onClick={() => handleNavigation('/quiz')}
                  className='block w-full text-left text-muted-foreground hover:text-foreground transition-colors touch-target py-2'
                >
                  Take Quiz
                </button>
                <button
                  onClick={() => handleNavigation('/recommendations')}
                  className='block w-full text-left text-muted-foreground hover:text-foreground transition-colors touch-target py-2'
                >
                  Recommendations
                </button>
              </div>
            </div>

            {/* Authentication Section */}
            <div className='pt-6 border-t border-border/40 space-y-4'>
              <Button
                onClick={() => handleNavigation('/auth/signup')}
                size='lg'
                className='w-full'
              >
                Get Started
              </Button>
              <Button
                onClick={() => handleNavigation('/auth/login')}
                variant='outline'
                size='lg'
                className='w-full'
              >
                Sign In
              </Button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
