'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

function SkipLink({ href, children, className }: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    const target = document.querySelector(href) as HTMLElement;
    if (target) {
      // Set focus to target element
      target.focus();
      
      // Scroll target into view
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      
      // Update URL hash without triggering scroll
      window.history.replaceState(null, '', href);
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        // Hidden by default (screen reader only)
        'sr-only',
        // Visible when focused
        'focus:not-sr-only',
        'focus:absolute focus:top-4 focus:left-4 focus:z-50',
        // Styling for visibility
        'focus:bg-primary focus:text-primary-foreground',
        'focus:px-4 focus:py-2 focus:rounded-md',
        'focus:shadow-lg focus:border-2 focus:border-accent',
        // Focus indicator
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        // Smooth transition
        'transition-all duration-200 ease-in-out',
        // Ensure high contrast
        'focus:font-medium focus:text-sm',
        // High contrast mode support
        'high-contrast:focus:bg-white high-contrast:focus:text-black',
        'high-contrast:focus:border-black',
        className
      )}
    >
      {children}
    </a>
  );
}

export function SkipLinks() {
  return (
    <div className="skip-links">
      <SkipLink href="#main-content">
        Skip to main content
      </SkipLink>
      <SkipLink href="#main-navigation">
        Skip to navigation
      </SkipLink>
      <SkipLink href="#search">
        Skip to search
      </SkipLink>
    </div>
  );
}

export { SkipLink };