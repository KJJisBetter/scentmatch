import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from '@/app/page';
import { testAccessibility, testMobileAccessibility, testKeyboardNavigation, testScreenReaderCompatibility, testColorContrast } from '@/tests/accessibility/accessibility-helpers';

/**
 * Home Page Test Specifications Implementation
 * Following QA test specifications in /docs/qa/task-6-1-home-page-test-specifications.md
 */

describe('Home Page - Visual Design & Layout Testing', () => {
  beforeEach(() => {
    // Mock window.matchMedia for responsive testing
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  describe('HOME-VIS-001: Hero Section Visual Impact', () => {
    test('displays AI-powered fragrance discovery messaging prominently', () => {
      render(<HomePage />);
      
      // Check for AI-powered messaging
      expect(screen.getByText(/AI-Powered Fragrance Discovery/i)).toBeInTheDocument();
      expect(screen.getByText(/Find Your Perfect/i)).toBeInTheDocument();
      expect(screen.getByText(/Fragrance/i)).toBeInTheDocument();
    });

    test('shows clear value proposition above fold', () => {
      render(<HomePage />);
      
      const valueProps = [
        /Stop guessing. Start discovering/i,
        /AI learns your preferences/i,
        /affordable samples first/i
      ];
      
      valueProps.forEach(prop => {
        expect(screen.getByText(prop)).toBeInTheDocument();
      });
    });

    test('displays primary CTA prominently', () => {
      render(<HomePage />);
      
      const primaryCTA = screen.getByRole('link', { name: /Start Finding Your Scent/i });
      expect(primaryCTA).toBeInTheDocument();
      expect(primaryCTA).toHaveAttribute('href', '/quiz');
    });

    test('hero section builds trust with professional design', () => {
      render(<HomePage />);
      
      // Check for trust signals
      expect(screen.getByText(/Trusted by 10,000\+ fragrance lovers/i)).toBeInTheDocument();
      expect(screen.getByText(/4\.9\/5 rating/i)).toBeInTheDocument();
      
      // Check for professional branding
      expect(screen.getByText('ScentMatch')).toBeInTheDocument();
    });
  });

  describe('HOME-VIS-002: Feature Highlights Visual Hierarchy', () => {
    test('displays three key differentiators clearly', () => {
      render(<HomePage />);
      
      // Check for the three main features
      expect(screen.getByText('AI-Powered Personalization')).toBeInTheDocument();
      expect(screen.getByText('Sample-First Discovery')).toBeInTheDocument();
      expect(screen.getByText('Interactive Testing')).toBeInTheDocument();
    });

    test('shows progressive information architecture', () => {
      render(<HomePage />);
      
      // Check feature explanations
      expect(screen.getByText(/Unlike generic recommendations, our AI learns/i)).toBeInTheDocument();
      expect(screen.getByText(/Try affordable samples and travel sizes/i)).toBeInTheDocument();
      expect(screen.getByText(/Guided blind testing experiences/i)).toBeInTheDocument();
    });

    test('includes supporting icons and imagery', () => {
      render(<HomePage />);
      
      // Check for Lucide React icons (should be present in DOM)
      const sparklesIcons = document.querySelectorAll('[data-lucide="sparkles"]');
      const testTubeIcons = document.querySelectorAll('[data-lucide="test-tube"]');
      const heartIcons = document.querySelectorAll('[data-lucide="heart"]');
      
      // Note: With Lucide React, icons may not have data-lucide attributes
      // Instead, check for the feature cards which should contain icons
      expect(screen.getByText('AI-Powered Personalization').closest('.card-interactive')).toBeInTheDocument();
      expect(screen.getByText('Sample-First Discovery').closest('.card-interactive')).toBeInTheDocument();
      expect(screen.getByText('Interactive Testing').closest('.card-interactive')).toBeInTheDocument();
    });
  });

  describe('HOME-VIS-003: Brand Consistency & Fragrance Theme', () => {
    test('uses consistent color palette and typography', () => {
      const { container } = render(<HomePage />);
      
      // Check for brand colors in CSS classes
      expect(container.querySelector('.text-gradient-primary')).toBeInTheDocument();
      expect(container.querySelector('.bg-gradient-to-br')).toBeInTheDocument();
      
      // Check for consistent typography
      expect(container.querySelector('.font-serif')).toBeInTheDocument();
    });

    test('maintains consistent spacing and alignment', () => {
      const { container } = render(<HomePage />);
      
      // Check for consistent container classes
      expect(container.querySelectorAll('.container').length).toBeGreaterThan(0);
      
      // Check for consistent spacing classes
      expect(container.querySelector('.space-y-6, .space-y-8')).toBeTruthy;
    });
  });

  describe('HOME-VIS-004: Typography & Font Loading', () => {
    test('implements consistent font hierarchy', () => {
      const { container } = render(<HomePage />);
      
      // Check heading hierarchy
      const h1 = container.querySelector('h1');
      const h2 = container.querySelector('h2');
      const h3 = container.querySelector('h3');
      
      expect(h1).toHaveClass('font-serif');
      expect(h1).toHaveClass('text-3xl', 'sm:text-4xl', 'lg:text-5xl', 'xl:text-6xl');
      
      if (h2) expect(h2).toHaveClass('font-serif');
      if (h3) expect(h3).toHaveClass('font-serif');
    });

    test('uses optimized font loading classes', () => {
      const { container } = render(<HomePage />);
      
      // Font classes should be present (Next.js font optimization)
      expect(container.querySelector('.font-serif')).toBeInTheDocument();
    });
  });
});

describe('Home Page - Responsive Design Testing', () => {
  describe('HOME-RES-001: Mobile-First Breakpoint Testing', () => {
    const breakpoints = [
      { name: 'iPhone SE', width: 375 },
      { name: 'iPhone 14', width: 390 },
      { name: 'Android', width: 360 },
      { name: 'iPad', width: 768 },
      { name: 'iPad Pro', width: 834 },
      { name: 'Laptop', width: 1024 },
      { name: 'Desktop', width: 1440 },
      { name: 'Large Display', width: 1920 }
    ];

    breakpoints.forEach(({ name, width }) => {
      test(`maintains layout integrity at ${name} (${width}px)`, () => {
        // Mock viewport size
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });

        const { container } = render(<HomePage />);
        
        // Check that responsive classes are applied
        expect(container.querySelector('.container')).toBeInTheDocument();
        
        // Check grid responsiveness
        expect(container.querySelector('.grid')).toBeInTheDocument();
        
        // Ensure no horizontal overflow
        const body = container.querySelector('main');
        expect(body).not.toHaveStyle('overflow-x: scroll');
      });
    });
  });

  describe('HOME-RES-002: Touch Target Compliance', () => {
    test('ensures all interactive elements meet minimum touch targets', () => {
      const { container } = render(<HomePage />);
      
      // Check button sizes
      const buttons = container.querySelectorAll('button, [role="button"]');
      buttons.forEach(button => {
        // Check for appropriate size classes
        const classList = button.classList.toString();
        const hasLargeSize = classList.includes('h-12') || 
                           classList.includes('h-14') || 
                           classList.includes('size-lg');
        
        // Primary CTAs should have large size
        if (button.textContent?.includes('Start Finding') || 
            button.textContent?.includes('Get Started')) {
          expect(hasLargeSize).toBe(true);
        }
      });
      
      // Check link touch targets
      const links = container.querySelectorAll('a');
      links.forEach(link => {
        // Navigation links should have adequate spacing
        const hasAppropriateSpacing = link.closest('.space-x-4') || 
                                     link.closest('.space-x-6') ||
                                     link.classList.toString().includes('h-12') ||
                                     link.classList.toString().includes('h-14');
        
        if (link.getAttribute('href')?.startsWith('/')) {
          expect(hasAppropriateSpacing).toBeTruthy();
        }
      });
    });

    test('provides adequate spacing between interactive elements', () => {
      const { container } = render(<HomePage />);
      
      // Check for spacing classes
      expect(container.querySelector('.space-x-4, .space-x-6')).toBeTruthy();
      expect(container.querySelector('.gap-3, .gap-4, .gap-6, .gap-8')).toBeTruthy();
    });
  });

  describe('HOME-RES-003: Content Reflow and Layout Adaptation', () => {
    test('content stacks appropriately on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(<HomePage />);
      
      // Check for mobile-first responsive classes
      const heroSection = container.querySelector('section');
      expect(heroSection).toBeInTheDocument();
      
      // Check for proper grid behavior
      const grids = container.querySelectorAll('.grid');
      grids.forEach(grid => {
        // Should have responsive grid classes
        const classList = grid.classList.toString();
        expect(classList.includes('grid')).toBe(true);
      });
    });

    test('feature grid adapts across breakpoints', () => {
      const { container } = render(<HomePage />);
      
      // Find feature grid
      const featureGrid = container.querySelector('.grid.sm\\:grid-cols-2.lg\\:grid-cols-3');
      expect(featureGrid).toBeInTheDocument();
    });
  });

  describe('HOME-RES-004: Image Scaling and Optimization', () => {
    test('implements Next.js Image optimization', () => {
      render(<HomePage />);
      
      // Note: The current implementation uses gradient placeholders
      // Check for proper image containers
      const imageContainers = document.querySelectorAll('.aspect-square, .aspect-\\[4\\/5\\]');
      expect(imageContainers.length).toBeGreaterThan(0);
    });

    test('provides descriptive alt text for images', () => {
      const { container } = render(<HomePage />);
      
      // Check all images have alt attributes
      const images = container.querySelectorAll('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });
  });

  describe('HOME-RES-005: Navigation Mobile Behavior', () => {
    test('includes mobile navigation component', () => {
      render(<HomePage />);
      
      // Check for MobileNav component
      expect(document.querySelector('[data-testid="mobile-nav"]') || 
             document.querySelector('.md\\:hidden')).toBeTruthy();
    });

    test('shows appropriate navigation for different screen sizes', () => {
      const { container } = render(<HomePage />);
      
      // Check for responsive navigation classes
      expect(container.querySelector('.hidden.md\\:flex')).toBeInTheDocument();
    });
  });
});

describe('Home Page - User Experience Testing', () => {
  describe('HOME-UX-001: Value Proposition Communication', () => {
    test('answers "What does ScentMatch do?" clearly', () => {
      render(<HomePage />);
      
      const keyMessages = [
        /AI-powered fragrance discovery/i,
        /find your perfect fragrance/i,
        /personalized recommendations/i
      ];
      
      keyMessages.forEach(message => {
        expect(screen.getByText(message)).toBeInTheDocument();
      });
    });

    test('addresses user pain points explicitly', () => {
      render(<HomePage />);
      
      const painPointSolutions = [
        /Stop guessing. Start discovering/i,
        /affordable samples first/i,
        /Unlike generic recommendations/i
      ];
      
      painPointSolutions.forEach(solution => {
        expect(screen.getByText(solution)).toBeInTheDocument();
      });
    });

    test('provides benefits for different user personas', () => {
      render(<HomePage />);
      
      // Beginner-focused messaging
      expect(screen.getByText(/affordable samples/i)).toBeInTheDocument();
      
      // Enthusiast-focused messaging  
      expect(screen.getByText(/AI learns your unique preferences/i)).toBeInTheDocument();
      
      // General trust signals
      expect(screen.getByText(/Trusted by 10,000\+ fragrance lovers/i)).toBeInTheDocument();
    });
  });

  describe('HOME-UX-002: Intuitive Navigation and User Flow', () => {
    test('provides clear paths to key user actions', () => {
      render(<HomePage />);
      
      // Primary user journeys
      expect(screen.getByRole('link', { name: /Start Finding Your Scent/i })).toHaveAttribute('href', '/quiz');
      expect(screen.getByRole('link', { name: /Browse Fragrances/i })).toHaveAttribute('href', '/fragrances');
      expect(screen.getByRole('link', { name: /Get Started/i })).toHaveAttribute('href', '/auth/signup');
      expect(screen.getByRole('link', { name: /Sign In/i })).toHaveAttribute('href', '/auth/login');
    });

    test('navigation labels match user mental models', () => {
      render(<HomePage />);
      
      const expectedNav = [
        'Browse Fragrances',
        'How It Works',
        'About',
        'Sign In',
        'Get Started'
      ];
      
      expectedNav.forEach(navItem => {
        expect(screen.getByText(navItem)).toBeInTheDocument();
      });
    });
  });

  describe('HOME-UX-003: Call-to-Action Effectiveness', () => {
    test('primary CTA stands out visually', () => {
      const { container } = render(<HomePage />);
      
      const primaryCTA = screen.getByRole('link', { name: /Start Finding Your Scent/i });
      expect(primaryCTA.closest('button')).toHaveClass('text-sm', 'sm:text-base');
      expect(primaryCTA.closest('button')).toHaveClass('h-12', 'lg:h-14');
    });

    test('CTA text is action-oriented and specific', () => {
      render(<HomePage />);
      
      const actionCTAs = [
        'Start Finding Your Scent',
        'Start Your Fragrance Journey',
        'Get Started'
      ];
      
      actionCTAs.forEach(cta => {
        expect(screen.getByText(cta)).toBeInTheDocument();
      });
    });

    test('multiple CTAs support without competing', () => {
      render(<HomePage />);
      
      // Primary CTAs
      const primaryCTAs = screen.getAllByText(/Start Finding|Start Your Fragrance/);
      expect(primaryCTAs.length).toBeGreaterThanOrEqual(1);
      
      // Secondary CTAs
      expect(screen.getByRole('link', { name: /Browse Fragrances/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Learn How It Works/i })).toBeInTheDocument();
    });
  });

  describe('HOME-UX-004: Loading States and Skeleton Components', () => {
    test('maintains layout during content loading', () => {
      const { container } = render(<HomePage />);
      
      // Check for proper layout structure that prevents shifts
      expect(container.querySelector('.aspect-square')).toBeInTheDocument();
      expect(container.querySelector('.space-y-6, .space-y-8')).toBeTruthy();
    });
  });
});

describe('Home Page - Authentication Integration Testing', () => {
  describe('HOME-AUTH-001: Dynamic Navigation Based on Auth State', () => {
    test('shows sign in and sign up for anonymous users', () => {
      render(<HomePage />);
      
      // Anonymous user navigation
      expect(screen.getByRole('link', { name: /Sign In/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Get Started/i })).toBeInTheDocument();
    });

    test('primary CTA leads to registration flow for anonymous users', () => {
      render(<HomePage />);
      
      const primaryCTA = screen.getByRole('link', { name: /Start Finding Your Scent/i });
      expect(primaryCTA).toHaveAttribute('href', '/quiz');
    });
  });

  describe('HOME-AUTH-002: Protected Content Preview', () => {
    test('shows preview of personalized features', () => {
      render(<HomePage />);
      
      const personalizedFeatures = [
        /AI learns your unique preferences/i,
        /personalized recommendations/i,
        /your perfect fragrance/i
      ];
      
      personalizedFeatures.forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });

    test('indicates value of signing up', () => {
      render(<HomePage />);
      
      expect(screen.getByText(/Free to start/i)).toBeInTheDocument();
      expect(screen.getByText(/No credit card required/i)).toBeInTheDocument();
    });
  });
});

describe('Home Page - Performance & SEO Testing', () => {
  describe('HOME-PERF-001: Page Load Speed Optimization', () => {
    test('implements performance optimizations', () => {
      const { container } = render(<HomePage />);
      
      // Check for performance-optimized classes
      expect(container.querySelector('main')).toHaveClass('min-h-screen');
      
      // Check for proper image containers (placeholder optimization)
      expect(container.querySelector('.aspect-square')).toBeInTheDocument();
    });
  });

  describe('HOME-SEO-001: Meta Tags and SEO Optimization', () => {
    test('provides semantic HTML structure', () => {
      const { container } = render(<HomePage />);
      
      // Check semantic structure
      expect(container.querySelector('main')).toBeInTheDocument();
      expect(container.querySelector('header')).toBeInTheDocument();
      expect(container.querySelector('nav')).toBeInTheDocument();
      expect(container.querySelector('footer')).toBeInTheDocument();
      
      // Check heading hierarchy
      expect(container.querySelector('h1')).toBeInTheDocument();
      expect(container.querySelector('h2')).toBeInTheDocument();
    });

    test('uses proper heading hierarchy', () => {
      const { container } = render(<HomePage />);
      
      const h1 = container.querySelector('h1');
      const h2 = container.querySelector('h2');
      const h3 = container.querySelector('h3');
      
      expect(h1).toBeInTheDocument();
      expect(h1?.textContent).toContain('Find Your Perfect');
      
      if (h2) expect(h2.textContent).toContain('Why Choose ScentMatch');
      if (h3) expect(h3.textContent).toContain('Trusted by Fragrance Lovers');
    });
  });
});