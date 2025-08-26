'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  Heart, 
  FileQuestion, 
  User 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccessibility } from '@/hooks/use-accessibility';

interface TabItem {
  id: string;
  label: string;
  ariaLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  isActive: (pathname: string) => boolean;
}

const tabs: TabItem[] = [
  {
    id: 'discover',
    label: 'Discover',
    ariaLabel: 'Discover fragrances',
    icon: Home,
    href: '/',
    isActive: (pathname) => pathname === '/',
  },
  {
    id: 'search',
    label: 'Search',
    ariaLabel: 'Search fragrances',
    icon: Search,
    href: '/search',
    isActive: (pathname) => pathname.startsWith('/search'),
  },
  {
    id: 'collections',
    label: 'Collections',
    ariaLabel: 'My collections',
    icon: Heart,
    href: '/dashboard/collection',
    isActive: (pathname) => pathname.startsWith('/collection') || pathname.startsWith('/dashboard/collection'),
  },
  {
    id: 'quiz',
    label: 'Quiz',
    ariaLabel: 'Take fragrance quiz',
    icon: FileQuestion,
    href: '/quiz',
    isActive: (pathname) => pathname.startsWith('/quiz'),
  },
  {
    id: 'profile',
    label: 'Profile',
    ariaLabel: 'User profile',
    icon: User,
    href: '/profile',
    isActive: (pathname) => pathname.startsWith('/profile'),
  },
];

function useHapticFeedback() {
  const triggerHaptic = React.useCallback(() => {
    // Check if device is iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  return triggerHaptic;
}

interface TabButtonProps {
  tab: TabItem;
  isActive: boolean;
  onPress: (href: string) => void;
}

function TabButton({ tab, isActive, onPress }: TabButtonProps) {
  const triggerHaptic = useHapticFeedback();
  const { announcements, isHighContrast } = useAccessibility();

  const handleClick = () => {
    triggerHaptic();
    onPress(tab.href);
    
    // Announce navigation change to screen readers
    announcements.announceSuccess(`Navigating to ${tab.label}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      type="button"
      role="button"
      tabIndex={0}
      aria-label={tab.ariaLabel}
      aria-current={isActive ? 'page' : undefined}
      data-active={isActive}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        // Base styles
        'touch-target flex flex-col items-center justify-center gap-1 px-2 py-1',
        'transition-all duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'rounded-lg',
        // Active/inactive states
        isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:text-foreground',
        // High contrast mode support
        isHighContrast && [
          'high-contrast:border-2 high-contrast:border-solid',
          isActive 
            ? 'high-contrast:border-primary high-contrast:bg-primary/10'
            : 'high-contrast:border-muted-foreground'
        ]
      )}
    >
      <tab.icon 
        className={cn(
          'h-5 w-5 transition-transform duration-200',
          isActive && 'scale-110'
        )}
        aria-hidden="true"
      />
      <span 
        className={cn(
          'text-xs font-medium leading-none transition-all duration-200',
          isActive && 'font-semibold'
        )}
      >
        {tab.label}
      </span>
      
      {/* Screen reader only text for context */}
      <span className="sr-only">
        {isActive ? 'Current page: ' : 'Navigate to '}
        {tab.label}
      </span>
    </button>
  );
}

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabPress = React.useCallback((href: string) => {
    router.push(href);
  }, [router]);

  return (
    <nav
      role="navigation"
      aria-label="Bottom navigation"
      className={cn(
        // Positioning
        'fixed bottom-0 left-0 right-0 z-50',
        // Hide on desktop
        'md:hidden',
        // Background and blur
        'bg-background/90 backdrop-blur-md',
        // Border
        'border-t border-border/40',
        // Safe area padding for mobile devices with notched screens
        'pb-2 sm:pb-4'
      )}
    >
      <div className="container-narrow">
        <div className="flex items-center justify-around px-2 py-1">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={tab.isActive(pathname)}
              onPress={handleTabPress}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}