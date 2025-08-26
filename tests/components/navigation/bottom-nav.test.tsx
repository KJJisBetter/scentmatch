import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { BottomNav } from '@/components/navigation/bottom-nav';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

// Mock haptic feedback for iOS
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  writable: true,
});

describe('BottomNav', () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (usePathname as any).mockReturnValue('/');
  });

  describe('Rendering', () => {
    it('should render all 5 navigation tabs', () => {
      render(<BottomNav />);
      
      expect(screen.getByLabelText('Discover fragrances')).toBeInTheDocument();
      expect(screen.getByLabelText('Search fragrances')).toBeInTheDocument();
      expect(screen.getByLabelText('My collections')).toBeInTheDocument();
      expect(screen.getByLabelText('Take fragrance quiz')).toBeInTheDocument();
      expect(screen.getByLabelText('User profile')).toBeInTheDocument();
    });

    it('should render with correct tab labels', () => {
      render(<BottomNav />);
      
      expect(screen.getByText('Discover')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('Collections')).toBeInTheDocument();
      expect(screen.getByText('Quiz')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('should be positioned fixed at bottom of viewport', () => {
      render(<BottomNav />);
      const nav = screen.getByRole('navigation');
      
      expect(nav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0');
    });

    it('should have backdrop blur styling', () => {
      render(<BottomNav />);
      const nav = screen.getByRole('navigation');
      
      expect(nav).toHaveClass('backdrop-blur-md');
    });

    it('should be hidden on desktop screens', () => {
      render(<BottomNav />);
      const nav = screen.getByRole('navigation');
      
      expect(nav).toHaveClass('md:hidden');
    });
  });

  describe('Active State', () => {
    it('should highlight Discover tab when on home page', () => {
      (usePathname as any).mockReturnValue('/');
      render(<BottomNav />);
      
      const discoverTab = screen.getByLabelText('Discover fragrances');
      expect(discoverTab).toHaveAttribute('data-active', 'true');
    });

    it('should highlight Search tab when on search page', () => {
      (usePathname as any).mockReturnValue('/search');
      render(<BottomNav />);
      
      const searchTab = screen.getByLabelText('Search fragrances');
      expect(searchTab).toHaveAttribute('data-active', 'true');
    });

    it('should highlight Collections tab when on collections page', () => {
      (usePathname as any).mockReturnValue('/collection');
      render(<BottomNav />);
      
      const collectionsTab = screen.getByLabelText('My collections');
      expect(collectionsTab).toHaveAttribute('data-active', 'true');
    });

    it('should highlight Quiz tab when on quiz page', () => {
      (usePathname as any).mockReturnValue('/quiz');
      render(<BottomNav />);
      
      const quizTab = screen.getByLabelText('Take fragrance quiz');
      expect(quizTab).toHaveAttribute('data-active', 'true');
    });

    it('should highlight Profile tab when on profile page', () => {
      (usePathname as any).mockReturnValue('/profile');
      render(<BottomNav />);
      
      const profileTab = screen.getByLabelText('User profile');
      expect(profileTab).toHaveAttribute('data-active', 'true');
    });

    it('should apply active styling to active tab', () => {
      (usePathname as any).mockReturnValue('/');
      render(<BottomNav />);
      
      const discoverTab = screen.getByLabelText('Discover fragrances');
      expect(discoverTab).toHaveClass('text-primary');
    });

    it('should apply inactive styling to non-active tabs', () => {
      (usePathname as any).mockReturnValue('/');
      render(<BottomNav />);
      
      const searchTab = screen.getByLabelText('Search fragrances');
      expect(searchTab).toHaveClass('text-muted-foreground');
    });
  });

  describe('Navigation', () => {
    it('should navigate to correct routes when tabs are clicked', async () => {
      render(<BottomNav />);
      
      fireEvent.click(screen.getByLabelText('Search fragrances'));
      expect(mockPush).toHaveBeenCalledWith('/search');

      fireEvent.click(screen.getByLabelText('My collections'));
      expect(mockPush).toHaveBeenCalledWith('/collection');

      fireEvent.click(screen.getByLabelText('Take fragrance quiz'));
      expect(mockPush).toHaveBeenCalledWith('/quiz');

      fireEvent.click(screen.getByLabelText('User profile'));
      expect(mockPush).toHaveBeenCalledWith('/profile');
    });

    it('should navigate to home when Discover tab is clicked', () => {
      render(<BottomNav />);
      
      fireEvent.click(screen.getByLabelText('Discover fragrances'));
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('Touch Targets', () => {
    it('should have minimum 44px touch targets for all tabs', () => {
      render(<BottomNav />);
      
      const tabs = [
        screen.getByLabelText('Discover fragrances'),
        screen.getByLabelText('Search fragrances'),
        screen.getByLabelText('My collections'),
        screen.getByLabelText('Take fragrance quiz'),
        screen.getByLabelText('User profile'),
      ];

      tabs.forEach(tab => {
        expect(tab).toHaveClass('touch-target');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<BottomNav />);
      
      expect(screen.getByLabelText('Discover fragrances')).toBeInTheDocument();
      expect(screen.getByLabelText('Search fragrances')).toBeInTheDocument();
      expect(screen.getByLabelText('My collections')).toBeInTheDocument();
      expect(screen.getByLabelText('Take fragrance quiz')).toBeInTheDocument();
      expect(screen.getByLabelText('User profile')).toBeInTheDocument();
    });

    it('should have navigation role', () => {
      render(<BottomNav />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<BottomNav />);
      
      const discoverTab = screen.getByLabelText('Discover fragrances');
      discoverTab.focus();
      expect(discoverTab).toHaveFocus();
      
      fireEvent.keyDown(discoverTab, { key: 'Enter' });
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should support spacebar activation', () => {
      render(<BottomNav />);
      
      const searchTab = screen.getByLabelText('Search fragrances');
      searchTab.focus();
      
      fireEvent.keyDown(searchTab, { key: ' ' });
      expect(mockPush).toHaveBeenCalledWith('/search');
    });

    it('should have proper tab index for all navigation items', () => {
      render(<BottomNav />);
      
      const tabs = [
        screen.getByLabelText('Discover fragrances'),
        screen.getByLabelText('Search fragrances'),
        screen.getByLabelText('My collections'),
        screen.getByLabelText('Take fragrance quiz'),
        screen.getByLabelText('User profile'),
      ];

      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Haptic Feedback', () => {
    it('should trigger haptic feedback on iOS when tab is pressed', () => {
      // Mock iOS user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'iPhone',
        configurable: true,
      });

      const vibrateSpy = vi.spyOn(navigator, 'vibrate');
      render(<BottomNav />);
      
      fireEvent.click(screen.getByLabelText('Search fragrances'));
      
      expect(vibrateSpy).toHaveBeenCalledWith(10);
    });

    it('should not trigger haptic feedback on non-iOS devices', () => {
      // Mock non-iOS user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Chrome',
        configurable: true,
      });

      const vibrateSpy = vi.spyOn(navigator, 'vibrate');
      render(<BottomNav />);
      
      fireEvent.click(screen.getByLabelText('Search fragrances'));
      
      expect(vibrateSpy).not.toHaveBeenCalled();
    });
  });

  describe('Transitions', () => {
    it('should have smooth transitions on tab elements', () => {
      render(<BottomNav />);
      
      const discoverTab = screen.getByLabelText('Discover fragrances');
      expect(discoverTab).toHaveClass('transition-all', 'duration-200');
    });
  });

  describe('Responsive Design', () => {
    it('should be visible on mobile screens', () => {
      render(<BottomNav />);
      const nav = screen.getByRole('navigation');
      
      // Should not have classes that hide it on mobile
      expect(nav).not.toHaveClass('hidden', 'sm:hidden');
    });

    it('should be hidden on desktop and larger screens', () => {
      render(<BottomNav />);
      const nav = screen.getByRole('navigation');
      
      expect(nav).toHaveClass('md:hidden');
    });
  });

  describe('High Contrast Mode', () => {
    it('should support high contrast mode with proper focus indicators', () => {
      render(<BottomNav />);
      
      const tabs = screen.getAllByRole('button');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('focus-visible:ring-2');
      });
    });
  });
});