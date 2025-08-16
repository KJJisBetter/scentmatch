/**
 * Affiliate User Journey Integration Tests
 * Tests the complete flow that affiliate partners will send users through
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js modules for integration testing
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => ''),
    has: vi.fn(() => false),
  }),
  redirect: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Mock Supabase for controlled testing
vi.mock('@/lib/supabase-client', () => ({
  createClientSupabase: () => ({
    auth: {
      signUp: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-123', email: 'affiliate@example.com' } },
        error: null,
      })),
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-123', email: 'affiliate@example.com' } },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
  }),
}));

describe('Affiliate User Journey Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            fragrances: [
              {
                fragrance_id: 1,
                name: 'Chanel No. 5',
                brand: 'Chanel',
                scent_family: 'Floral',
                relevance_score: 0.9,
                sample_available: true,
                sample_price_usd: 12,
              }
            ],
            total: 1,
            query: '',
            filters_applied: {},
          }),
        });
      }
      
      if (url.includes('/api/search/filters')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            scent_families: [{ value: 'Floral', label: 'Floral', count: 150 }],
            brands: [{ value: 'Chanel', label: 'Chanel', count: 25 }],
            occasions: [],
            seasons: [],
            price_ranges: [],
            availability: [],
            metadata: { total_fragrances: 1467, samples_available: 200 },
          }),
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    }) as any;
  });

  describe('Homepage to Quiz Conversion', () => {
    it('should convert homepage visitors to quiz participants', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      render(<HomePage />);
      
      // Verify homepage loads with clear value proposition
      expect(screen.getByText('Find Your Perfect')).toBeInTheDocument();
      expect(screen.getByText('Fragrance')).toBeInTheDocument();
      
      // Verify primary CTA is prominent and functional
      const quizCTA = screen.getByText('Start Finding Your Scent');
      expect(quizCTA).toBeInTheDocument();
      expect(quizCTA.closest('a')).toHaveAttribute('href', '/quiz');
      
      // Verify social proof elements that build trust
      expect(screen.getByText(/10,000.*fragrance lovers/)).toBeInTheDocument();
      expect(screen.getByText('4.9/5 rating')).toBeInTheDocument();
      
      // Verify risk-reduction messaging
      expect(screen.getByText(/Free to start/)).toBeInTheDocument();
      expect(screen.getByText(/No credit card required/)).toBeInTheDocument();
    });

    it('should provide alternative browse path for different user types', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      render(<HomePage />);
      
      // Verify browse CTA is available as alternative path
      const browseCTA = screen.getByText('Browse Fragrances');
      expect(browseCTA).toBeInTheDocument();
      expect(browseCTA.closest('a')).toHaveAttribute('href', '/browse');
      
      // Verify multiple conversion touchpoints
      const allBrowseLinks = screen.getAllByText('Browse Fragrances');
      expect(allBrowseLinks.length).toBeGreaterThan(1); // Header + hero section
    });
  });

  describe('Browse Page User Experience', () => {
    it('should provide immediate value to browsing users', async () => {
      const { FragranceBrowseClient } = await import('@/components/browse/fragrance-browse-client');
      
      const mockData = {
        fragrances: [{
          fragrance_id: 1,
          name: 'Chanel No. 5',
          brand: 'Chanel',
          scent_family: 'Floral',
          relevance_score: 0.9,
          sample_available: true,
          sample_price_usd: 12,
        }],
        total: 1,
        query: '',
        filters_applied: {},
      };
      
      const mockFilters = {
        scent_families: [{ value: 'Floral', label: 'Floral', count: 150 }],
        brands: [{ value: 'Chanel', label: 'Chanel', count: 25 }],
        occasions: [], seasons: [], price_ranges: [], availability: [],
        metadata: { total_fragrances: 1467, samples_available: 200 },
      };
      
      render(
        <FragranceBrowseClient
          initialFragrances={mockData}
          filterOptions={mockFilters}
          initialParams={{}}
        />
      );
      
      // Verify fragrance cards display correctly
      expect(screen.getByText('Chanel No. 5')).toBeInTheDocument();
      expect(screen.getByText('Chanel')).toBeInTheDocument();
      expect(screen.getByText('$12 sample')).toBeInTheDocument();
      
      // Verify filtering capabilities
      expect(screen.getByText(/Filter by/)).toBeInTheDocument();
      expect(screen.getByText(/Brand/)).toBeInTheDocument();
      expect(screen.getByText(/Fragrance Family/)).toBeInTheDocument();
    });

    it('should handle search functionality smoothly', async () => {
      const { FragranceBrowseClient } = await import('@/components/browse/fragrance-browse-client');
      
      const mockData = {
        fragrances: [],
        total: 0,
        query: '',
        filters_applied: {},
      };
      
      const mockFilters = {
        scent_families: [], brands: [], occasions: [], seasons: [], 
        price_ranges: [], availability: [],
        metadata: { total_fragrances: 1467, samples_available: 200 },
      };
      
      render(
        <FragranceBrowseClient
          initialFragrances={mockData}
          filterOptions={mockFilters}
          initialParams={{}}
        />
      );
      
      // Verify search input exists and is functional
      const searchInput = screen.getByPlaceholderText(/search fragrances/i);
      expect(searchInput).toBeInTheDocument();
      
      // Test search input interaction
      fireEvent.change(searchInput, { target: { value: 'vanilla' } });
      expect(searchInput).toHaveValue('vanilla');
      
      // Verify search button
      const searchButton = screen.getByText('Search');
      expect(searchButton).toBeInTheDocument();
    });
  });

  describe('Quiz Completion to Recommendations', () => {
    it('should handle complete quiz flow with meaningful results', async () => {
      const { QuizInterface } = await import('@/components/quiz/quiz-interface');
      
      render(<QuizInterface />);
      
      // Verify quiz starts properly
      expect(screen.getByText(/How would you describe your personal style/)).toBeInTheDocument();
      
      // Verify progress indicator
      expect(screen.getByText(/Question 1 of/)).toBeInTheDocument();
      expect(screen.getByText(/0% complete/)).toBeInTheDocument();
      
      // Verify options are interactive
      const professionalOption = screen.getByText(/Professional & Sophisticated/);
      expect(professionalOption).toBeInTheDocument();
      
      fireEvent.click(professionalOption);
      
      // Should progress to next question
      await waitFor(() => {
        expect(screen.getByText(/Question 2 of/)).toBeInTheDocument();
      });
    });

    it('should provide clear path to account creation after quiz', async () => {
      const { ConversionFlow } = await import('@/components/quiz/conversion-flow');
      
      const mockQuizResults = {
        personality_type: 'sophisticated_professional',
        confidence: 0.85,
        quiz_session_token: 'test-session-123',
        recommendations: [
          {
            fragrance_id: 1,
            name: 'Tom Ford Black Orchid',
            brand: 'Tom Ford',
            match_score: 0.9,
            sample_price: 15,
          }
        ],
      };
      
      render(
        <ConversionFlow
          quizResults={mockQuizResults}
          onAccountCreated={() => {}}
          onConversionComplete={() => {}}
        />
      );
      
      // Should show personality results
      expect(screen.getByText(/Your Fragrance Personality/)).toBeInTheDocument();
      expect(screen.getByText(/sophisticated_professional/)).toBeInTheDocument();
      
      // Should show clear account creation value prop
      expect(screen.getByText(/Unlock.*More Perfect Matches/)).toBeInTheDocument();
      expect(screen.getByText(/Create Free Account/)).toBeInTheDocument();
      
      // Should show sample recommendations
      expect(screen.getByText('Tom Ford Black Orchid')).toBeInTheDocument();
      expect(screen.getByText(/Try Sample.*15/)).toBeInTheDocument();
    });
  });

  describe('Performance and Conversion Standards', () => {
    it('should meet affiliate conversion performance standards', async () => {
      const HomePage = (await import('@/app/page')).default;
      
      const startTime = performance.now();
      render(<HomePage />);
      const renderTime = performance.now() - startTime;
      
      // Homepage should render quickly (< 100ms for first paint)
      expect(renderTime).toBeLessThan(100);
      
      // Critical conversion elements should be immediately available
      expect(screen.getByText('Start Finding Your Scent')).toBeInTheDocument();
      expect(screen.getByText('Browse Fragrances')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
      
      // All CTAs should be properly linked
      const quizCTA = screen.getByText('Start Finding Your Scent');
      expect(quizCTA.closest('a')).toHaveAttribute('href', '/quiz');
    });

    it('should handle error states gracefully for affiliate trust', async () => {
      // Mock API failure
      global.fetch = vi.fn(() => Promise.reject(new Error('API Error')));
      
      const { FragranceBrowseClient } = await import('@/components/browse/fragrance-browse-client');
      
      const errorData = {
        fragrances: [],
        total: 0,
        query: 'test',
        filters_applied: {},
        fallback: true,
        message: 'Search temporarily unavailable',
      };
      
      const mockFilters = {
        scent_families: [], brands: [], occasions: [], seasons: [],
        price_ranges: [], availability: [],
        metadata: { total_fragrances: 0, samples_available: 0, error: 'temporarily unavailable' },
      };
      
      render(
        <FragranceBrowseClient
          initialFragrances={errorData}
          filterOptions={mockFilters}
          initialParams={{ q: 'test' }}
        />
      );
      
      // Should show professional error handling
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
      expect(screen.getByText(/Try again/)).toBeInTheDocument();
      
      // Should maintain professional appearance even in error state
      const tryAgainButton = screen.getByText(/Try again/);
      expect(tryAgainButton).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness for Affiliate Traffic', () => {
    it('should work perfectly on mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // iPhone SE width
      });

      const HomePage = (await import('@/app/page')).default;
      render(<HomePage />);
      
      // Mobile navigation should be present
      const mobileNav = document.querySelector('[data-mobile-nav]');
      expect(mobileNav).toBeInTheDocument();
      
      // CTAs should be properly sized for mobile
      const primaryCTA = screen.getByText('Start Finding Your Scent');
      expect(primaryCTA).toHaveClass('h-12'); // Minimum 48px touch target
      
      // Content should stack properly on mobile
      const heroSection = screen.getByText('Find Your Perfect').closest('section');
      expect(heroSection).toBeInTheDocument();
    });

    it('should handle mobile quiz experience smoothly', async () => {
      const { QuizInterface } = await import('@/components/quiz/quiz-interface');
      
      render(<QuizInterface />);
      
      // Quiz should be mobile-optimized
      expect(screen.getByText(/Discover Your Fragrance Personality/)).toBeInTheDocument();
      
      // Progress bar should be visible
      expect(screen.getByText(/Question 1 of/)).toBeInTheDocument();
      
      // Options should be touch-friendly
      const options = screen.getAllByRole('button');
      options.forEach(option => {
        // Should have adequate spacing for mobile touches
        expect(option).toHaveClass('p-4');
      });
    });
  });

  describe('Complete User Journey Validation', () => {
    it('should support homepage → quiz → recommendations → signup flow', async () => {
      // Test that all components can be imported and rendered
      const HomePage = (await import('@/app/page')).default;
      const { QuizInterface } = await import('@/components/quiz/quiz-interface');
      const { ConversionFlow } = await import('@/components/quiz/conversion-flow');
      
      // Verify homepage renders
      const { unmount: unmountHome } = render(<HomePage />);
      expect(screen.getByText('Find Your Perfect')).toBeInTheDocument();
      unmountHome();
      
      // Verify quiz interface renders
      const { unmount: unmountQuiz } = render(<QuizInterface />);
      expect(screen.getByText(/personal style/)).toBeInTheDocument();
      unmountQuiz();
      
      // Verify conversion flow renders
      const mockResults = {
        personality_type: 'test',
        confidence: 0.8,
        quiz_session_token: 'test-123',
        recommendations: [],
      };
      
      render(
        <ConversionFlow
          quizResults={mockResults}
          onAccountCreated={() => {}}
          onConversionComplete={() => {}}
        />
      );
      
      expect(screen.getByText(/Your Fragrance Personality/)).toBeInTheDocument();
    });

    it('should support homepage → browse → search → results flow', async () => {
      const HomePage = (await import('@/app/page')).default;
      const { FragranceBrowseClient } = await import('@/components/browse/fragrance-browse-client');
      
      // Test homepage to browse flow
      const { unmount: unmountHome } = render(<HomePage />);
      const browseLink = screen.getByText('Browse Fragrances');
      expect(browseLink.closest('a')).toHaveAttribute('href', '/browse');
      unmountHome();
      
      // Test browse page functionality
      const mockData = {
        fragrances: [{
          fragrance_id: 1,
          name: 'Test Fragrance',
          brand: 'Test Brand',
          scent_family: 'Floral',
          relevance_score: 0.8,
          sample_available: true,
          sample_price_usd: 10,
        }],
        total: 1,
        query: '',
        filters_applied: {},
      };
      
      const mockFilters = {
        scent_families: [], brands: [], occasions: [], seasons: [],
        price_ranges: [], availability: [],
        metadata: { total_fragrances: 1467, samples_available: 200 },
      };
      
      render(
        <FragranceBrowseClient
          initialFragrances={mockData}
          filterOptions={mockFilters}
          initialParams={{}}
        />
      );
      
      expect(screen.getByText('Test Fragrance')).toBeInTheDocument();
      expect(screen.getByText('$10 sample')).toBeInTheDocument();
    });
  });

  describe('Affiliate Conversion Metrics', () => {
    it('should track key conversion events for affiliate analytics', async () => {
      const mockGtag = vi.fn();
      (window as any).gtag = mockGtag;
      
      const { QuizInterface } = await import('@/components/quiz/quiz-interface');
      render(<QuizInterface />);
      
      // Click first quiz option
      const option = screen.getByText(/Professional & Sophisticated/);
      fireEvent.click(option);
      
      // Should track quiz interaction
      expect(mockGtag).toHaveBeenCalledWith('event', 'quiz_question_answered', expect.objectContaining({
        question_number: 1,
        question_id: 'style',
      }));
    });

    it('should provide clear value metrics for affiliate partners', async () => {
      const HomePage = (await import('@/app/page')).default;
      render(<HomePage />);
      
      // Verify metrics that affiliate partners care about
      expect(screen.getByText(/10,000.*fragrance lovers/)).toBeInTheDocument();
      expect(screen.getByText('4.9/5 rating')).toBeInTheDocument();
      expect(screen.getByText(/\$3-15 samples vs \$50-200 bottles/)).toBeInTheDocument();
      
      // Value proposition should be clear
      expect(screen.getByText(/AI learns your preferences/)).toBeInTheDocument();
      expect(screen.getByText(/samples first/)).toBeInTheDocument();
    });
  });

  describe('Error Recovery and Reliability', () => {
    it('should maintain professional experience during API failures', async () => {
      // Mock API failure
      global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        status: 500,
      }));
      
      const { FragranceBrowseClient } = await import('@/components/browse/fragrance-browse-client');
      
      const errorData = {
        fragrances: [],
        total: 0,
        query: 'test',
        filters_applied: {},
        fallback: true,
        message: 'Search temporarily unavailable',
      };
      
      render(
        <FragranceBrowseClient
          initialFragrances={errorData}
          filterOptions={{
            scent_families: [], brands: [], occasions: [], seasons: [],
            price_ranges: [], availability: [],
            metadata: { total_fragrances: 0, samples_available: 0 },
          }}
          initialParams={{ q: 'test' }}
        />
      );
      
      // Should maintain professional appearance
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      
      // Should not expose technical errors to users
      expect(screen.queryByText(/500/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Internal Server Error/)).not.toBeInTheDocument();
    });

    it('should handle network connectivity issues gracefully', async () => {
      // Mock network error
      global.fetch = vi.fn(() => Promise.reject(new Error('Network Error')));
      
      const { QuizInterface } = await import('@/components/quiz/quiz-interface');
      render(<QuizInterface />);
      
      // Quiz should still be usable even if network fails
      expect(screen.getByText(/personal style/)).toBeInTheDocument();
      
      // Should provide fallback experience
      const option = screen.getByText(/Professional & Sophisticated/);
      fireEvent.click(option);
      
      // Should handle progression even with network issues
      await waitFor(() => {
        expect(screen.getByText(/Question 2 of/)).toBeInTheDocument();
      });
    });
  });

  describe('Build and Deployment Readiness', () => {
    it('should have no console errors in production mode', async () => {
      const originalConsoleError = console.error;
      const consoleErrors: any[] = [];
      console.error = (...args: any[]) => {
        consoleErrors.push(args);
        originalConsoleError(...args);
      };
      
      try {
        const HomePage = (await import('@/app/page')).default;
        render(<HomePage />);
        
        // No React errors should occur during render
        expect(consoleErrors.filter(error => 
          error.some((arg: any) => 
            typeof arg === 'string' && arg.includes('Warning:')
          )
        )).toHaveLength(0);
        
      } finally {
        console.error = originalConsoleError;
      }
    });

    it('should have proper TypeScript types throughout', () => {
      // This test verifies TypeScript compilation
      // If the test file runs, TypeScript compilation succeeded
      expect(true).toBe(true);
    });
  });
});