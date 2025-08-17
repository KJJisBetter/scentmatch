/**
 * Enhanced Conversion Flow Tests - Task 6.1
 * Comprehensive tests for profile-centric conversion flow and account creation
 * Tests conversion optimization and profile value communication
 */

import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { AdvancedConversionFlow } from '@/components/quiz/advanced-conversion-flow';
import type { UserProfile } from '@/lib/quiz/advanced-profile-engine';

// Mock dependencies
vi.mock('@/lib/supabase-client', () => ({
  createClientSupabase: () => ({
    auth: {
      signUp: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      }),
    },
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock analytics
global.window = Object.create(window);
Object.defineProperty(window, 'gtag', {
  value: vi.fn(),
  writable: true,
});

// Test data
const MOCK_SOPHISTICATED_PROFILE: UserProfile = {
  session_token: 'test-session-sophisticated',
  traits: {
    sophistication: 0.9,
    confidence: 0.8,
    warmth: 0.6,
    adventurousness: 0.4,
    playfulness: 0.3,
    sensuality: 0.7,
    uniqueness: 0.6,
    tradition: 0.8,
    seasonality: { spring: 0.5, summer: 0.4, fall: 0.8, winter: 0.9 },
    occasions: { daily: 0.4, work: 0.8, evening: 0.9, special: 0.8 },
  },
  trait_combinations: ['sophisticated', 'confident'],
  primary_archetype: 'sophisticated_confident',
  confidence_score: 0.87,
  created_at: new Date().toISOString(),
  quiz_version: 2,
};

const MOCK_CASUAL_PROFILE: UserProfile = {
  session_token: 'test-session-casual',
  traits: {
    sophistication: 0.3,
    confidence: 0.6,
    warmth: 0.9,
    adventurousness: 0.7,
    playfulness: 0.8,
    sensuality: 0.5,
    uniqueness: 0.6,
    tradition: 0.3,
    seasonality: { spring: 0.9, summer: 0.8, fall: 0.5, winter: 0.4 },
    occasions: { daily: 0.9, work: 0.5, evening: 0.6, special: 0.7 },
  },
  trait_combinations: ['casual', 'playful', 'adventurous'],
  primary_archetype: 'casual_playful',
  confidence_score: 0.82,
  created_at: new Date().toISOString(),
  quiz_version: 2,
};

const MOCK_RECOMMENDATIONS = [
  {
    fragrance_id: 'test-sophisticated-001',
    name: 'Elegant Evening Mystique',
    brand: 'Luxury Brand',
    match_percentage: 92,
    purchase_confidence: 0.88,
    sample_price: 16.99,
    profile_specific_benefits: [
      'Amplifies your sophisticated presence at important events',
      'Perfect for your confident, elegant evening style',
    ],
    personality_match_details:
      'Strong match on your sophisticated and confident traits',
  },
  {
    fragrance_id: 'test-sophisticated-002',
    name: 'Professional Confidence',
    brand: 'Executive Collection',
    match_percentage: 89,
    purchase_confidence: 0.85,
    sample_price: 14.99,
    profile_specific_benefits: [
      'Enhances your professional presence and authority',
      'Aligns with your sophisticated work style',
    ],
  },
  {
    fragrance_id: 'test-sophisticated-003',
    name: 'Timeless Sophistication',
    brand: 'Classic House',
    match_percentage: 86,
    purchase_confidence: 0.82,
    sample_price: 18.99,
    profile_specific_benefits: [
      'Reflects your appreciation for timeless elegance',
      'Perfect for your refined taste and style',
    ],
  },
];

const MOCK_QUIZ_RESPONSES = [
  {
    question_id: 'personality_core',
    selected_options: ['sophisticated', 'confident'],
    timestamp: new Date().toISOString(),
  },
  {
    question_id: 'lifestyle_context',
    selected_option: 'professional_presence',
    timestamp: new Date().toISOString(),
  },
];

describe('Enhanced Conversion Flow - Profile Value Communication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ quiz_data_transferred: true }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CONVERSION-001: Profile Value Emphasis in Quiz Results', () => {
    it('CONVERSION-001a: Should emphasize detailed profile value over simple personality', () => {
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Should emphasize multi-trait profile over simple personality
      expect(
        screen.getByText('Your Unique Fragrance Profile')
      ).toBeInTheDocument();
      expect(screen.getByText('sophisticated')).toBeInTheDocument();
      expect(screen.getByText('confident')).toBeInTheDocument();

      // Should show profile metrics
      expect(screen.getByText('87%')).toBeInTheDocument(); // Profile accuracy
      expect(screen.getByText('Profile Accuracy')).toBeInTheDocument();
      expect(screen.getByText('+35%')).toBeInTheDocument(); // AI boost
      expect(screen.getByText('AI Personalization Boost')).toBeInTheDocument();
    });

    it('CONVERSION-001b: Should display trait combinations prominently', () => {
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Should show trait combination badges
      const sophisticatedBadge = screen.getByText('sophisticated');
      const confidentBadge = screen.getByText('confident');

      expect(sophisticatedBadge).toBeInTheDocument();
      expect(confidentBadge).toBeInTheDocument();

      // Should display as prominent badges
      expect(sophisticatedBadge.closest('.bg-plum-100')).toBeTruthy();
      expect(confidentBadge.closest('.bg-plum-100')).toBeTruthy();
    });

    it('CONVERSION-001c: Should show profile-specific metrics and insights', () => {
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Should show high-confidence matches count
      expect(screen.getByText('High-Confidence Matches')).toBeInTheDocument();

      // Should show AI personalization boost
      expect(screen.getByText(/AI Personalization Boost/)).toBeInTheDocument();

      // Should reference the specific trait combination
      expect(
        screen.getByText(/sophisticated \+ confident/)
      ).toBeInTheDocument();
    });

    it('CONVERSION-001d: Should adapt messaging for different trait combinations', () => {
      const { rerender } = render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Sophisticated profile messaging
      expect(
        screen.getByText(/sophisticated \+ confident/)
      ).toBeInTheDocument();

      // Change to casual profile
      rerender(
        <AdvancedConversionFlow
          userProfile={MOCK_CASUAL_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Should show different trait combination
      expect(
        screen.getByText(/casual \+ playful \+ adventurous/)
      ).toBeInTheDocument();
    });
  });

  describe('CONVERSION-002: Enhanced Account Creation Prompts', () => {
    it('CONVERSION-002a: Should highlight profile preservation benefits', async () => {
      const user = userEvent.setup();
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Click to go to account creation
      await user.click(
        screen.getByText(/Save My sophisticated \+ confident Profile/)
      );

      // Should show profile preservation messaging
      expect(
        screen.getByText('Save Your Fragrance Profile')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/sophisticated \+ confident personality insights/)
      ).toBeInTheDocument();

      // Should show detailed preservation benefits
      expect(
        screen.getByText(
          /Your sophisticated \+ confident profile will be permanently saved/
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/personalized recommendations preserved/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/AI personalization activated/)
      ).toBeInTheDocument();
    });

    it('CONVERSION-002b: Should show specific benefits for trait combinations', async () => {
      const user = userEvent.setup();
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      await user.click(
        screen.getByText(/Save My sophisticated \+ confident Profile/)
      );

      // Should show trait-specific benefits
      expect(
        screen.getByText(
          /Purchase confidence scores and match explanations saved/
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Profile continues learning from your preferences/)
      ).toBeInTheDocument();
    });

    it('CONVERSION-002c: Should handle account creation with profile context', async () => {
      const user = userEvent.setup();
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Navigate to account form
      await user.click(
        screen.getByText(/Save My sophisticated \+ confident Profile/)
      );

      // Fill out form
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'testpassword123');
      await user.type(screen.getByLabelText('First Name'), 'TestUser');

      // Submit form
      await user.click(
        screen.getByText(/Save sophisticated \+ confident Profile/)
      );

      // Should show loading state with profile context
      expect(screen.getByText('Saving Your Profile...')).toBeInTheDocument();
    });
  });

  describe('CONVERSION-003: Profile Preview and Trait Combinations', () => {
    it('CONVERSION-003a: Should display profile preview with trait combinations', () => {
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Should show trait combination badges in profile display
      expect(screen.getByText('sophisticated')).toBeInTheDocument();
      expect(screen.getByText('confident')).toBeInTheDocument();

      // Should show profile uniqueness score
      expect(screen.getByText('87%')).toBeInTheDocument();
      expect(screen.getByText('Profile Accuracy')).toBeInTheDocument();
    });

    it('CONVERSION-003b: Should show profile-specific recommendation previews', () => {
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Should show top 3 profile matches
      expect(
        screen.getByText('Your Top 3 Profile Matches')
      ).toBeInTheDocument();
      expect(screen.getByText('Elegant Evening Mystique')).toBeInTheDocument();
      expect(screen.getByText('92% match')).toBeInTheDocument();

      // Should show profile-specific benefits
      expect(
        screen.getByText(/Amplifies your sophisticated presence/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Perfect for your confident, elegant evening style/)
      ).toBeInTheDocument();

      // Should show purchase confidence
      expect(screen.getByText('88%')).toBeInTheDocument(); // Purchase confidence
    });

    it('CONVERSION-003c: Should display profile building visualization', () => {
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Should show high-confidence matches count
      const highConfidenceCount = MOCK_RECOMMENDATIONS.filter(
        r => r.purchase_confidence > 0.8
      ).length;
      expect(
        screen.getByText(highConfidenceCount.toString())
      ).toBeInTheDocument();
      expect(screen.getByText('High-Confidence Matches')).toBeInTheDocument();

      // Should show trait combination in context
      expect(
        screen.getByText(
          /sophisticated \+ confident personality creates a unique/
        )
      ).toBeInTheDocument();
    });
  });

  describe('CONVERSION-004: Strategic Messaging and AI Insights', () => {
    it('CONVERSION-004a: Should emphasize personalized AI insights and recommendations', () => {
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Should mention AI learning capabilities
      expect(
        screen.getByText(
          /AI learns your sophisticated \+ confident preferences/
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/better AI matching with your profile/)
      ).toBeInTheDocument();
      expect(
        screen.getByText('Profile-aware insights throughout the platform')
      ).toBeInTheDocument();
    });

    it('CONVERSION-004b: Should communicate profile-specific benefits clearly', () => {
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Should show specific benefits for this profile
      expect(
        screen.getByText(/high-confidence purchase matches/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Save favorites with personality match explanations/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/personality-matched sample order/)
      ).toBeInTheDocument();
    });

    it('CONVERSION-004c: Should show conversion-optimized value propositions', () => {
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Should show compelling value props
      expect(
        screen.getByText('Unlock Your Complete Personality Profile')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/access all \d+ personalized matches/)
      ).toBeInTheDocument();

      // Should include social proof
      expect(
        screen.getByText(/94% of users.*save their profiles/)
      ).toBeInTheDocument();
    });
  });

  describe('CONVERSION-005: Guest Limitation Messaging', () => {
    it('CONVERSION-005a: Should emphasize profile loss after 24 hours', async () => {
      const user = userEvent.setup();
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Navigate to guest limitations
      await user.click(screen.getByText("Show me what I'll lose as a guest"));

      // Should show profile loss messaging
      expect(
        screen.getByText("What You'll Miss as a Guest")
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Your sophisticated \+ confident Profile Will Be Lost/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/personality analysis deleted in 24 hours/)
      ).toBeInTheDocument();
    });

    it('CONVERSION-005b: Should detail specific losses for trait combinations', async () => {
      const user = userEvent.setup();
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      await user.click(screen.getByText("Show me what I'll lose as a guest"));

      // Should show specific losses
      expect(
        screen.getByText(/high-confidence matches.*lost/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/AI personalization boost unavailable/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Profile-specific fragrance insights.*missing/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Cannot save favorites.*with personality context/)
      ).toBeInTheDocument();
    });

    it('CONVERSION-005c: Should provide conversion recovery opportunity', async () => {
      const user = userEvent.setup();
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      await user.click(screen.getByText("Show me what I'll lose as a guest"));

      // Should show reconsideration buttons
      expect(
        screen.getByText(/Actually, Save My sophisticated \+ confident Profile/)
      ).toBeInTheDocument();
      expect(
        screen.getByText('Continue with Limited Experience (Profile Lost)')
      ).toBeInTheDocument();

      // Should provide social proof for this trait combination
      expect(
        screen.getByText(
          /94% of users.*sophisticated \+ confident.*save their profiles/
        )
      ).toBeInTheDocument();
    });
  });

  describe('CONVERSION-006: Profile-Based Recommendation Previews', () => {
    it('CONVERSION-006a: Should show profile-specific benefits for each recommendation', () => {
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Should show profile-specific benefits for recommendations
      expect(
        screen.getByText(/Amplifies your sophisticated presence/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Perfect for your confident, elegant evening style/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Enhances your professional presence/)
      ).toBeInTheDocument();
    });

    it('CONVERSION-006b: Should display purchase confidence indicators', () => {
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Should show purchase confidence scores
      expect(screen.getByText('Purchase Confidence')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument(); // First recommendation confidence

      // Should show progress bars for confidence
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(1); // Profile accuracy + purchase confidence bars
    });

    it('CONVERSION-006c: Should show personality match explanations', () => {
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Should explain why fragrances match the profile
      expect(
        screen.getByText(
          /Strong match on your sophisticated and confident traits/
        )
      ).toBeInTheDocument();

      // Should show trait-specific benefits
      const benefitBullets = screen.getAllByText(
        /Amplifies|Enhances|Perfect for/
      );
      expect(benefitBullets.length).toBeGreaterThan(0);
    });
  });

  describe('CONVERSION-007: Account Creation Flow Enhancement', () => {
    it('CONVERSION-007a: Should create account with complete profile context', async () => {
      const user = userEvent.setup();
      const mockSupabase = {
        auth: {
          signUp: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-123', email: 'test@example.com' } },
            error: null,
          }),
        },
      };

      vi.doMock('@/lib/supabase-client', () => ({
        createClientSupabase: () => mockSupabase,
      }));

      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Navigate to account creation
      await user.click(
        screen.getByText(/Save My sophisticated \+ confident Profile/)
      );

      // Fill form and submit
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'testpassword123');
      await user.type(screen.getByLabelText('First Name'), 'TestUser');

      await user.click(
        screen.getByRole('button', {
          name: /Save sophisticated \+ confident Profile/,
        })
      );

      // Should call signUp with profile context
      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'testpassword123',
          options: {
            data: expect.objectContaining({
              first_name: 'TestUser',
              quiz_profile_token: MOCK_SOPHISTICATED_PROFILE.session_token,
              personality_traits: MOCK_SOPHISTICATED_PROFILE.trait_combinations,
              profile_confidence: MOCK_SOPHISTICATED_PROFILE.confidence_score,
            }),
          },
        });
      });
    });

    it('CONVERSION-007b: Should handle API call to save advanced profile', async () => {
      const user = userEvent.setup();
      const fetchSpy = vi.spyOn(global, 'fetch');

      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Complete account creation flow
      await user.click(
        screen.getByText(/Save My sophisticated \+ confident Profile/)
      );
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'testpassword123');
      await user.type(screen.getByLabelText('First Name'), 'TestUser');
      await user.click(
        screen.getByRole('button', {
          name: /Save sophisticated \+ confident Profile/,
        })
      );

      // Should call API to save advanced profile
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/quiz/save-advanced-profile',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining(
              MOCK_SOPHISTICATED_PROFILE.session_token
            ),
          })
        );
      });
    });

    it('CONVERSION-007c: Should show enhanced success messaging with profile activation', async () => {
      const user = userEvent.setup();
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Complete account creation to see success message
      await user.click(
        screen.getByText(/Save My sophisticated \+ confident Profile/)
      );
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'testpassword123');
      await user.type(screen.getByLabelText('First Name'), 'TestUser');
      await user.click(
        screen.getByRole('button', {
          name: /Save sophisticated \+ confident Profile/,
        })
      );

      // Should show profile activation success
      await waitFor(() => {
        expect(
          screen.getByText('Profile Successfully Activated!')
        ).toBeInTheDocument();
        expect(
          screen.getByText(/sophisticated \+ confident profile is saved/)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/AI personalization is active/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('CONVERSION-008: Conversion Rate Optimization Features', () => {
    it('CONVERSION-008a: Should track conversion events with profile context', async () => {
      const user = userEvent.setup();
      const gtagSpy = vi.spyOn(window, 'gtag');

      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Should track profile-specific conversion events
      await user.click(
        screen.getByText(/Save My sophisticated \+ confident Profile/)
      );

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        expect.any(String),
        expect.objectContaining({
          personality_traits: expect.arrayContaining([
            'sophisticated',
            'confident',
          ]),
          profile_confidence: 0.87,
        })
      );
    });

    it('CONVERSION-008b: Should optimize messaging for different confidence levels', () => {
      const lowConfidenceProfile = {
        ...MOCK_SOPHISTICATED_PROFILE,
        confidence_score: 0.6,
      };

      const { rerender } = render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // High confidence messaging
      expect(screen.getByText('87%')).toBeInTheDocument();

      // Low confidence should show different messaging
      rerender(
        <AdvancedConversionFlow
          userProfile={lowConfidenceProfile}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      expect(screen.getByText('60%')).toBeInTheDocument();
      // Should adjust messaging for lower confidence
    });

    it('CONVERSION-008c: Should provide clear value progression from guest to account', () => {
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Should clearly show what's unlocked with account
      expect(
        screen.getByText(/Unlock Your Complete Personality Profile/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/access all \d+ personalized matches/)
      ).toBeInTheDocument();

      // Should show immediate benefits
      expect(
        screen.getByText(/20% off.*personality-matched sample/)
      ).toBeInTheDocument();
    });
  });

  describe('CONVERSION-009: Mobile Optimization and Accessibility', () => {
    it('CONVERSION-009a: Should have mobile-optimized touch targets', () => {
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Main conversion button should be large enough for mobile
      const mainButton = screen.getByText(
        /Save My sophisticated \+ confident Profile/
      );
      expect(mainButton.closest('button')).toHaveClass(/py-4/); // Large padding for touch
    });

    it('CONVERSION-009b: Should provide accessible form labels and descriptions', async () => {
      const user = userEvent.setup();
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      await user.click(
        screen.getByText(/Save My sophisticated \+ confident Profile/)
      );

      // Should have proper form accessibility
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();

      // Should have descriptive placeholders
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Minimum 8 characters')
      ).toBeInTheDocument();
    });

    it('CONVERSION-009c: Should provide clear visual hierarchy and flow', () => {
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Should have clear visual hierarchy
      expect(
        screen.getByText('Your Unique Fragrance Profile')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Your Top 3 Profile Matches')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Unlock Your Complete Personality Profile')
      ).toBeInTheDocument();

      // Should have proper visual emphasis
      const mainHeading = screen.getByText('Your Unique Fragrance Profile');
      expect(mainHeading).toHaveClass(/text-3xl/);
    });
  });

  describe('CONVERSION-010: Error Handling and Edge Cases', () => {
    it('CONVERSION-010a: Should handle account creation errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock error response
      vi.doMock('@/lib/supabase-client', () => ({
        createClientSupabase: () => ({
          auth: {
            signUp: vi.fn().mockResolvedValue({
              data: { user: null },
              error: { message: 'Email already registered' },
            }),
          },
        }),
      }));

      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      await user.click(
        screen.getByText(/Save My sophisticated \+ confident Profile/)
      );
      await user.type(screen.getByLabelText('Email'), 'existing@example.com');
      await user.type(screen.getByLabelText('Password'), 'testpassword123');
      await user.type(screen.getByLabelText('First Name'), 'TestUser');
      await user.click(
        screen.getByRole('button', {
          name: /Save sophisticated \+ confident Profile/,
        })
      );

      // Should show user-friendly error
      await waitFor(() => {
        expect(
          screen.getByText('Email already exists. Try signing in instead.')
        ).toBeInTheDocument();
      });
    });

    it('CONVERSION-010b: Should handle profile save API failures', async () => {
      const user = userEvent.setup();

      // Mock profile save failure
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      await user.click(
        screen.getByText(/Save My sophisticated \+ confident Profile/)
      );
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'testpassword123');
      await user.type(screen.getByLabelText('First Name'), 'TestUser');
      await user.click(
        screen.getByRole('button', {
          name: /Save sophisticated \+ confident Profile/,
        })
      );

      // Should show profile save error
      await waitFor(() => {
        expect(
          screen.getByText('Failed to save your profile. Please try again.')
        ).toBeInTheDocument();
      });
    });

    it('CONVERSION-010c: Should validate form fields with profile context', async () => {
      const user = userEvent.setup();
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      await user.click(
        screen.getByText(/Save My sophisticated \+ confident Profile/)
      );

      // Try to submit with missing fields
      await user.click(
        screen.getByRole('button', {
          name: /Save sophisticated \+ confident Profile/,
        })
      );

      // Should show validation error with profile context
      await waitFor(() => {
        expect(
          screen.getByText('Please fill in all required fields')
        ).toBeInTheDocument();
      });

      // Try with short password
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), '123');
      await user.type(screen.getByLabelText('First Name'), 'TestUser');
      await user.click(
        screen.getByRole('button', {
          name: /Save sophisticated \+ confident Profile/,
        })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Password must be at least 8 characters')
        ).toBeInTheDocument();
      });
    });
  });

  describe('CONVERSION-011: Success Flow and Next Steps', () => {
    it('CONVERSION-011a: Should show profile activation success with clear next steps', async () => {
      const user = userEvent.setup();
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Complete full conversion flow
      await user.click(
        screen.getByText(/Save My sophisticated \+ confident Profile/)
      );
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'testpassword123');
      await user.type(screen.getByLabelText('First Name'), 'TestUser');
      await user.click(
        screen.getByRole('button', {
          name: /Save sophisticated \+ confident Profile/,
        })
      );

      // Should show success with profile-specific messaging
      await waitFor(() => {
        expect(screen.getByText('Welcome to ScentMatch!')).toBeInTheDocument();
        expect(
          screen.getByText(/sophisticated \+ confident profile is saved/)
        ).toBeInTheDocument();
        expect(
          screen.getByText('Profile Successfully Activated!')
        ).toBeInTheDocument();
      });

      // Should show clear next steps
      expect(
        screen.getByText(/Explore All \d+ Personality Matches/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Order Your sophisticated \+ confident Sample Set/)
      ).toBeInTheDocument();
    });

    it('CONVERSION-011b: Should provide profile-specific journey guidance', async () => {
      const user = userEvent.setup();
      render(
        <AdvancedConversionFlow
          userProfile={MOCK_SOPHISTICATED_PROFILE}
          recommendations={MOCK_RECOMMENDATIONS}
          quizResponses={MOCK_QUIZ_RESPONSES}
        />
      );

      // Complete conversion to see journey guidance
      await user.click(
        screen.getByText(/Save My sophisticated \+ confident Profile/)
      );
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'testpassword123');
      await user.type(screen.getByLabelText('First Name'), 'TestUser');
      await user.click(
        screen.getByRole('button', {
          name: /Save sophisticated \+ confident Profile/,
        })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Your Personalized Journey Begins')
        ).toBeInTheDocument();
        expect(
          screen.getByText(/matched to your sophisticated \+ confident profile/)
        ).toBeInTheDocument();
        expect(
          screen.getByText('Order Personality-Matched Samples')
        ).toBeInTheDocument();
        expect(
          screen.getByText(/high-confidence matches with your 20% discount/)
        ).toBeInTheDocument();
      });
    });
  });
});
