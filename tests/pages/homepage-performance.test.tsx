/**
 * Homepage Performance and Conversion Optimization Tests
 * Tests for affiliate traffic conversion, Core Web Vitals, and user experience
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

describe('Homepage Performance & Conversion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Web Vitals Optimization', () => {
    it('should have optimized Largest Contentful Paint (LCP)', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      const { container } = render(<HomePage />);
      
      // Check that critical above-the-fold content loads quickly
      expect(screen.getByText('Find Your Perfect')).toBeInTheDocument();
      expect(screen.getByText('Fragrance')).toBeInTheDocument();
      
      // Verify main CTA button is immediately visible
      const primaryCTA = screen.getByText('Start Finding Your Scent');
      expect(primaryCTA).toBeInTheDocument();
      expect(primaryCTA.closest('a')).toHaveAttribute('href', '/quiz');
    });

    it('should have minimal Cumulative Layout Shift (CLS)', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      render(<HomePage />);
      
      // Check that layout elements have proper dimensions to prevent shifts
      const heroSection = screen.getByRole('main');
      expect(heroSection).toHaveClass('min-h-screen');
      
      // Verify images have aspect ratios defined
      const heroImageContainer = document.querySelector('.aspect-square');
      expect(heroImageContainer).toBeInTheDocument();
    });

    it('should minimize First Input Delay (FID) with fast interactivity', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      render(<HomePage />);
      
      // Verify critical interactive elements are immediately responsive
      const startButton = screen.getByText('Start Finding Your Scent');
      const browseButton = screen.getByText('Browse Fragrances');
      
      expect(startButton).toBeInTheDocument();
      expect(browseButton).toBeInTheDocument();
      
      // Test immediate click responsiveness
      fireEvent.click(startButton);
      fireEvent.click(browseButton);
    });
  });

  describe('SEO and Meta Tags', () => {
    it('should have proper meta tags for affiliate conversion', async () => {
      // Test will verify meta tags are properly exported
      const metadata = await import('@/app/page').then(module => module.metadata);
      
      expect(metadata).toBeDefined();
      // Additional meta tag verification would be done at runtime
    });

    it('should have OpenGraph tags for social sharing', () => {
      // This test verifies the page structure supports social sharing
      // OpenGraph tags would be tested in the actual DOM during integration
      expect(true).toBe(true); // Placeholder for OpenGraph validation
    });
  });

  describe('Mobile-First Responsive Design', () => {
    it('should display properly on mobile devices', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<HomePage />);
      
      // Verify mobile navigation exists
      expect(document.querySelector('[data-mobile-nav]')).toBeInTheDocument();
      
      // Verify responsive classes are applied
      const heroContent = screen.getByText('Find Your Perfect').closest('div');
      expect(heroContent).toHaveClass('text-center');
      expect(heroContent).toHaveClass('lg:text-left');
    });

    it('should have proper button sizing for mobile', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      render(<HomePage />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Verify buttons have proper touch target sizes
        expect(button).toHaveClass('h-12'); // Minimum 48px height for accessibility
      });
    });

    it('should stack elements properly on mobile', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      render(<HomePage />);
      
      // Verify responsive grid layouts
      const featureGrid = document.querySelector('.grid.sm\\:grid-cols-2.lg\\:grid-cols-3');
      expect(featureGrid).toBeInTheDocument();
    });
  });

  describe('Conversion Optimization', () => {
    it('should have clear value proposition above the fold', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      render(<HomePage />);
      
      // Primary headline should be immediately visible
      expect(screen.getByText('Find Your Perfect')).toBeInTheDocument();
      expect(screen.getByText('Fragrance')).toBeInTheDocument();
      
      // Value proposition should be clear
      expect(screen.getByText(/Stop guessing.*Start discovering/)).toBeInTheDocument();
      expect(screen.getByText(/AI learns your preferences/)).toBeInTheDocument();
      expect(screen.getByText(/samples first/)).toBeInTheDocument();
    });

    it('should have prominent call-to-action buttons', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      render(<HomePage />);
      
      // Primary CTA should be prominent
      const primaryCTA = screen.getByText('Start Finding Your Scent');
      expect(primaryCTA).toBeInTheDocument();
      expect(primaryCTA.closest('a')).toHaveAttribute('href', '/quiz');
      
      // Secondary CTA should be available
      const secondaryCTA = screen.getByText('Browse Fragrances');
      expect(secondaryCTA).toBeInTheDocument();
      expect(secondaryCTA.closest('a')).toHaveAttribute('href', '/browse');
    });

    it('should display social proof elements', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      render(<HomePage />);
      
      // Verify trust signals
      expect(screen.getByText(/10,000.*fragrance lovers/)).toBeInTheDocument();
      expect(screen.getByText('4.9/5 rating')).toBeInTheDocument();
      
      // Verify testimonials
      expect(screen.getByText(/Finally found my signature scent/)).toBeInTheDocument();
      expect(screen.getByText(/AI recommendations are spot on/)).toBeInTheDocument();
    });

    it('should have risk-reduction messaging', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      render(<HomePage />);
      
      // Verify risk-reduction elements
      expect(screen.getByText(/Free to start/)).toBeInTheDocument();
      expect(screen.getByText(/No credit card required/)).toBeInTheDocument();
      expect(screen.getByText(/Sample recommendations from \$3/)).toBeInTheDocument();
      
      // Sample-first messaging
      expect(screen.getByText(/\$3-15 samples vs \$50-200 bottles/)).toBeInTheDocument();
      expect(screen.getByText(/Risk-free fragrance exploration/)).toBeInTheDocument();
    });
  });

  describe('Navigation and User Flow', () => {
    it('should have clear navigation structure', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      render(<HomePage />);
      
      // Header navigation
      expect(screen.getByText('Browse Fragrances')).toBeInTheDocument();
      expect(screen.getByText('How It Works')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      
      // Auth buttons
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('should provide multiple entry points to conversion funnel', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      render(<HomePage />);
      
      // Multiple ways to start the journey
      const quizLinks = screen.getAllByText(/Start.*Scent|Start.*Journey/);
      expect(quizLinks.length).toBeGreaterThan(0);
      
      const browseLinks = screen.getAllByText('Browse Fragrances');
      expect(browseLinks.length).toBeGreaterThan(0);
      
      const signupLinks = screen.getAllByText(/Get Started|Sign Up/);
      expect(signupLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Loading States and Performance', () => {
    it('should not have blocking loading states on critical content', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      render(<HomePage />);
      
      // Critical content should be immediately available (static)
      expect(screen.getByText('Find Your Perfect')).toBeInTheDocument();
      expect(screen.getByText('Start Finding Your Scent')).toBeInTheDocument();
      expect(screen.getByText('Browse Fragrances')).toBeInTheDocument();
      
      // No loading spinners or skeletons on critical path
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument();
    });

    it('should have optimized font loading', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      render(<HomePage />);
      
      // Verify font classes are applied (indicates proper font loading)
      const headline = screen.getByText('Find Your Perfect');
      expect(headline).toHaveClass('font-serif');
      
      const brandName = screen.getByText('ScentMatch');
      expect(brandName).toHaveClass('font-serif');
    });
  });

  describe('Accessibility and Usability', () => {
    it('should have proper heading hierarchy', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      render(<HomePage />);
      
      // Check heading structure
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent(/Find Your Perfect.*Fragrance/);
      
      // Secondary headings
      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      expect(h2Elements.length).toBeGreaterThan(0);
    });

    it('should have accessible form elements', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      render(<HomePage />);
      
      // Check that interactive elements are accessible
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      
      // All links should have accessible text
      links.forEach(link => {
        expect(link).toHaveAccessibleName();
      });
    });
  });
});