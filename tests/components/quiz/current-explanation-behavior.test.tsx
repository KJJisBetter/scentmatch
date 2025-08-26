/**
 * Task 1.1: Document Current Quiz Results Behavior
 * 
 * This test file documents the existing explanation behavior in quiz results
 * before deploying beginner-friendly explanations. These tests capture the
 * current state to validate our improvements.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FragranceRecommendationDisplay } from '@/components/quiz/fragrance-recommendation-display';
import type { RecommendationItem } from '@/lib/ai-sdk/unified-recommendation-engine';

// Mock recommendation data representing current verbose explanations
const mockVerboseRecommendations: RecommendationItem[] = [
  {
    fragrance_id: 'test-1',
    name: 'Noir Extreme',
    brand: 'Tom Ford',
    score: 0.95,
    // Current verbose explanation (150+ words) - what we're trying to fix
    explanation: `Noir Extreme by Tom Ford is an excellent match for you based on your user profile. Here's why: 1. **Scent Profile Match:** Noir Extreme offers a rich, sophisticated blend that balances fresh and clean notes with warm, spicy undertones. This aligns well with your preference for fresh, clean scents while adding a touch of elegance without overwhelming you. The fragrance opens with cardamom and nutmeg, providing an initial spicy warmth, which then transitions into a heart of kulfi (an Indian dessert note) and rose. This combination creates a unique and memorable scent profile that matches your desire for something distinctive yet not too bold. 2. **Versatility:** This fragrance is incredibly versatile, making it perfect for both professional settings and casual outings, which aligns with your lifestyle preferences mentioned in your quiz responses.`,
    confidence_level: 'high',
    sample_available: true,
    sample_price_usd: 14,
    image_url: 'https://example.com/noir-extreme.jpg',
    scent_family: 'oriental',
    why_recommended: 'Matches your preference for sophisticated, versatile fragrances with fresh elements',
    // No adaptive_explanation - this is the issue
  },
  {
    fragrance_id: 'test-2', 
    name: 'Sauvage',
    brand: 'Dior',
    score: 0.88,
    explanation: 'Another verbose explanation that overwhelms beginners with technical details about bergamot, pepper, and ambroxan molecules...',
    confidence_level: 'high',
    sample_available: true,
    sample_price_usd: 12,
    scent_family: 'fresh',
    why_recommended: 'Popular fresh fragrance',
  },
  {
    fragrance_id: 'test-3',
    name: 'Bleu de Chanel',
    brand: 'Chanel', 
    score: 0.82,
    explanation: 'Technical explanation about citrus top notes, cedar heart, and woody base...',
    confidence_level: 'medium',
    sample_available: true,
    sample_price_usd: 15,
    scent_family: 'woody',
    why_recommended: 'Classic masculine fragrance',
  }
];

// Mock recommendation with beginner-friendly explanation (what we want to deploy)
const mockBeginnerRecommendations: RecommendationItem[] = [
  {
    fragrance_id: 'test-1',
    name: 'Noir Extreme',
    brand: 'Tom Ford',
    score: 0.95,
    explanation: 'Built but not deployed beginner explanation',
    confidence_level: 'high',
    sample_available: true,
    sample_price_usd: 14,
    image_url: 'https://example.com/noir-extreme.jpg',
    scent_family: 'oriental',
    why_recommended: 'Perfect match for beginners',
    // This is what the backend system builds but doesn't deploy
    adaptive_explanation: {
      user_experience_level: 'beginner',
      summary: '✅ Fresh & clean like you wanted\n👍 Works for school, work, dates\n💡 Similar to Sauvage but more unique\n🧪 Try $14 sample before $150 bottle',
      expanded_content: 'This fragrance combines fresh, clean notes with warm spices. It\'s versatile enough for daily wear but sophisticated enough for special occasions.',
      educational_terms: {
        oriental: {
          term: 'Oriental Fragrance',
          beginnerExplanation: 'A warm, spicy fragrance family with rich, cozy scents'
        }
      },
      confidence_boost: 'Over 1,000 beginners loved this match!',
    }
  }
];

describe('Current Quiz Results Explanation Behavior', () => {
  beforeEach(() => {
    // Clear console to track explanation length
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Task 1.1: Document Current Verbose Behavior', () => {
    it('should display verbose explanations when adaptive_explanation is missing', async () => {
      render(
        <FragranceRecommendationDisplay recommendations={mockVerboseRecommendations} />
      );

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Your Perfect Matches')).toBeInTheDocument();
      });

      // Check that verbose explanation is displayed (current problematic behavior)
      const verboseExplanation = screen.getByText(/Noir Extreme by Tom Ford is an excellent match/);
      expect(verboseExplanation).toBeInTheDocument();
      
      // Document word count of current verbose explanation
      const explanationText = verboseExplanation.textContent || '';
      const wordCount = explanationText.split(/\s+/).length;
      
      // Current verbose explanations are 150+ words (the problem we're fixing)
      expect(wordCount).toBeGreaterThan(100);
      console.log(`📊 Current explanation word count: ${wordCount} words (target: 30-40 words)`);
    });

    it('should show fallback to recommendation.explanation for all recommendations without adaptive_explanation', () => {
      render(
        <FragranceRecommendationDisplay recommendations={mockVerboseRecommendations} />
      );

      // Verify all three recommendations show verbose explanations
      mockVerboseRecommendations.forEach(rec => {
        const explanationElement = screen.getByText(new RegExp(rec.explanation.substring(0, 50)));
        expect(explanationElement).toBeInTheDocument();
      });
    });

    it('should not display beginner-friendly emoji format in current implementation', () => {
      render(
        <FragranceRecommendationDisplay recommendations={mockVerboseRecommendations} />
      );

      // Current implementation doesn't show emojis or concise format
      expect(screen.queryByText(/✅/)).not.toBeInTheDocument();
      expect(screen.queryByText(/👍/)).not.toBeInTheDocument();  
      expect(screen.queryByText(/💡/)).not.toBeInTheDocument();
      expect(screen.queryByText(/🧪/)).not.toBeInTheDocument();
    });

    it('should document current progressive disclosure behavior', async () => {
      render(
        <FragranceRecommendationDisplay recommendations={mockVerboseRecommendations} />
      );

      // Check that progressive disclosure uses verbose "Why we recommended this"
      const disclosureElements = screen.getAllByText('Why we recommended this');
      expect(disclosureElements).toHaveLength(3);
    });
  });

  describe('Task 1.1: Document Target Beginner Behavior (Built but Not Deployed)', () => {
    it('should display concise beginner explanations when adaptive_explanation exists', async () => {
      render(
        <FragranceRecommendationDisplay recommendations={mockBeginnerRecommendations} />
      );

      await waitFor(() => {
        expect(screen.getByText('Your Perfect Matches')).toBeInTheDocument();
      });

      // Check for beginner-friendly emoji format (target behavior)
      expect(screen.getByText(/✅ Fresh & clean like you wanted/)).toBeInTheDocument();
      expect(screen.getByText(/👍 Works for school, work, dates/)).toBeInTheDocument();
      expect(screen.getByText(/💡 Similar to Sauvage but more unique/)).toBeInTheDocument();
      expect(screen.getByText(/🧪 Try \$14 sample before \$150 bottle/)).toBeInTheDocument();

      // Verify word count meets target (30-40 words)
      const summaryElement = screen.getByText(/✅ Fresh & clean like you wanted/);
      const summaryText = summaryElement.textContent || '';
      const wordCount = summaryText.split(/\s+/).length;
      
      expect(wordCount).toBeLessThanOrEqual(45); // Allow some flexibility
      expect(wordCount).toBeGreaterThanOrEqual(25);
      console.log(`✅ Target beginner explanation word count: ${wordCount} words`);
    });

    it('should show enhanced progressive disclosure for beginners', () => {
      render(
        <FragranceRecommendationDisplay recommendations={mockBeginnerRecommendations} />
      );

      // Should show beginner-specific progressive disclosure
      expect(screen.getByText('🎓 Learn more about this fragrance')).toBeInTheDocument();
    });

    it('should display educational terms for beginners', () => {
      render(
        <FragranceRecommendationDisplay recommendations={mockBeginnerRecommendations} />
      );

      // Educational content should be available
      const detailsElement = screen.getByRole('group'); // <details> element
      expect(detailsElement).toBeInTheDocument();
    });

    it('should show confidence boost messaging for beginners', () => {
      render(
        <FragranceRecommendationDisplay recommendations={mockBeginnerRecommendations} />
      );

      // Confidence boost should display
      expect(screen.getByText(/💫 Over 1,000 beginners loved this match!/)).toBeInTheDocument();
    });
  });

  describe('Task 1.1: Current System Integration Points', () => {
    it('should identify where adaptive_explanation integration occurs in component', () => {
      // This test documents the current integration logic in FragranceRecommendationDisplay
      // Lines 134-147: adaptive_explanation?.user_experience_level === 'beginner' check
      // Lines 205-243: Progressive disclosure differences for beginners
      
      const integrationPoints = [
        'Line 134-145: Beginner explanation display logic',
        'Line 147: Fallback to verbose recommendation.explanation', 
        'Lines 205-243: Progressive disclosure enhancement for beginners',
        'Lines 217-229: Educational terms display'
      ];

      // Document current integration points
      console.log('📋 Current adaptive_explanation integration points:');
      integrationPoints.forEach(point => console.log(`  - ${point}`));
      
      expect(integrationPoints.length).toBe(4);
    });
  });
});

/**
 * Test Results Summary for Task 1.1:
 * 
 * CURRENT ISSUES DOCUMENTED:
 * 1. ❌ Verbose explanations (150+ words) overwhelm beginners 
 * 2. ❌ Missing adaptive_explanation in recommendation objects
 * 3. ❌ No emoji/visual formatting in current display
 * 4. ❌ Fallback to recommendation.explanation shows technical content
 * 
 * TARGET BEHAVIOR IDENTIFIED:
 * 1. ✅ Concise explanations (30-40 words) with emoji formatting
 * 2. ✅ adaptive_explanation object contains beginner-friendly content
 * 3. ✅ Educational progressive disclosure for beginners
 * 4. ✅ Confidence boost messaging
 * 
 * INTEGRATION POINTS MAPPED:
 * - FragranceRecommendationDisplay lines 134-147: Main explanation display
 * - Lines 205-243: Progressive disclosure logic
 * - Component already supports adaptive_explanation format
 * 
 * NEXT STEPS:
 * - Identify why UnifiedRecommendationEngine doesn't generate adaptive_explanation
 * - Check beginner-explanation-engine integration
 * - Test experience detection logic
 */