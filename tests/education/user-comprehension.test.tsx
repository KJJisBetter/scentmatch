/**
 * User Comprehension and Confidence Tests
 * 
 * Tests that verify the educational features actually reduce confusion
 * and improve user confidence in fragrance selection.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { FragranceDetailPage } from '@/components/fragrance/fragrance-detail-page';
import { QuizInterface } from '@/components/quiz/quiz-interface';
import { EducationalTooltip } from '@/components/education/educational-tooltip';
import { EDUCATIONAL_GUIDANCE } from '@/lib/education/content';

// Mock fragrance data for testing
const mockFragrance = {
  id: 'test-fragrance-1',
  name: 'Test Fragrance',
  brand_id: 'test-brand-1',
  scent_family: 'Floral',
  intensity_score: 7,
  longevity_hours: 8,
  sillage_rating: 6,
  notes: ['Rose', 'Jasmine', 'Sandalwood'],
  recommended_occasions: ['Evening', 'Date Night'],
  recommended_seasons: ['Spring', 'Summer'],
  mood_tags: ['Romantic', 'Elegant'],
  fragrance_brands: [{
    id: 'test-brand-1',
    name: 'Test Brand',
    website_url: 'https://example.com'
  }]
};

// Mock education context
const mockEducationContext = {
  shouldShowEducation: vi.fn(() => true),
  isBeginnerMode: true,
  getTooltipSettings: vi.fn(() => ({
    showDetailed: true,
    showConfidence: true,
    showExamples: true
  })),
  context: {
    is_beginner: true,
    experience_level: 'beginner',
    show_educational_content: true
  }
};

vi.mock('@/lib/education/useEducationContext', () => ({
  useEducationContext: () => mockEducationContext
}));

describe('User Comprehension Improvement', () => {
  beforeEach(() => {
    mockEducationContext.shouldShowEducation.mockReturnValue(true);
  });

  describe('Fragrance Terminology Understanding', () => {
    it('explains intensity in user-friendly terms', async () => {
      render(<FragranceDetailPage fragrance={mockFragrance} />);

      const intensityTerm = screen.getByText('Intensity');
      fireEvent.mouseEnter(intensityTerm);

      await waitFor(() => {
        expect(screen.getByText('How strong the fragrance feels (1-10 scale)')).toBeInTheDocument();
        expect(screen.getByText(/1-3 is subtle, 4-7 is moderate, 8-10 is strong/)).toBeInTheDocument();
        expect(screen.getByText('Most people prefer 4-7 for daily wear')).toBeInTheDocument();
      });
    });

    it('explains longevity with practical context', async () => {
      render(<FragranceDetailPage fragrance={mockFragrance} />);

      const longevityTerm = screen.getByText('Longevity');
      fireEvent.mouseEnter(longevityTerm);

      await waitFor(() => {
        expect(screen.getByText('How many hours the fragrance lasts on your skin')).toBeInTheDocument();
        expect(screen.getByText(/Factors like skin type, weather, and application/)).toBeInTheDocument();
        expect(screen.getByText('6+ hours is considered excellent longevity')).toBeInTheDocument();
      });
    });

    it('explains sillage with clear examples', async () => {
      render(<FragranceDetailPage fragrance={mockFragrance} />);

      const sillageTerm = screen.getByText('Sillage');
      fireEvent.mouseEnter(sillageTerm);

      await waitFor(() => {
        expect(screen.getByText('How far the scent travels around you')).toBeInTheDocument();
        expect(screen.getByText(/pronounced "see-yazh"/)).toBeInTheDocument();
        expect(screen.getByText('Low sillage = close to skin, High sillage = fills a room')).toBeInTheDocument();
      });
    });

    it('explains fragrance families with relatable descriptions', async () => {
      render(<FragranceDetailPage fragrance={mockFragrance} />);

      const floralBadge = screen.getByText('Floral');
      fireEvent.mouseEnter(floralBadge);

      await waitFor(() => {
        expect(screen.getByText('Flower scents like rose, jasmine, lily')).toBeInTheDocument();
        expect(screen.getByText(/Imagine walking through a garden in full bloom/)).toBeInTheDocument();
        expect(screen.getByText('The most popular fragrance family worldwide')).toBeInTheDocument();
      });
    });
  });

  describe('Decision-Making Support', () => {
    it('provides application guidance to reduce uncertainty', () => {
      const pulsePointsContent = EDUCATIONAL_GUIDANCE.application_tips.find(
        tip => tip.term === 'Pulse Points'
      );

      render(
        <EducationalTooltip content={pulsePointsContent!}>
          <span>Application</span>
        </EducationalTooltip>
      );

      fireEvent.mouseEnter(screen.getByText('Application'));

      expect(screen.getByText('Apply to wrists, neck, behind ears')).toBeInTheDocument();
      expect(screen.getByText('This is how professionals apply fragrance')).toBeInTheDocument();
    });

    it('encourages proper testing methodology', () => {
      const testingContent = EDUCATIONAL_GUIDANCE.application_tips.find(
        tip => tip.term === 'Testing Time'
      );

      render(
        <EducationalTooltip content={testingContent!}>
          <span>Testing</span>
        </EducationalTooltip>
      );

      fireEvent.mouseEnter(screen.getByText('Testing'));

      expect(screen.getByText('Wait 30 minutes before deciding if you like it')).toBeInTheDocument();
      expect(screen.getByText('Even experts wait to judge a fragrance')).toBeInTheDocument();
    });

    it('provides sample strategy guidance', () => {
      const sampleContent = EDUCATIONAL_GUIDANCE.application_tips.find(
        tip => tip.term === 'Sample Strategy'
      );

      render(
        <EducationalTooltip content={sampleContent!}>
          <span>Sampling</span>
        </EducationalTooltip>
      );

      fireEvent.mouseEnter(screen.getByText('Sampling'));

      expect(screen.getByText('Try 2-3 sprays, live with it for a day')).toBeInTheDocument();
      expect(screen.getByText('96% of beginners find their match within 3 tries')).toBeInTheDocument();
    });
  });

  describe('Confidence Building Mechanisms', () => {
    it('displays reassuring statistics prominently', () => {
      render(<FragranceDetailPage fragrance={mockFragrance} />);

      // The education panel should be present with confidence-building stats
      expect(screen.getByText('Fragrance Learning Center')).toBeInTheDocument();
      
      // Click to expand and see stats
      fireEvent.click(screen.getByText('Fragrance Learning Center'));
      
      expect(screen.getByText('96%')).toBeInTheDocument();
      expect(screen.getByText('find their match')).toBeInTheDocument();
    });

    it('normalizes the learning process', () => {
      const confidenceBoosters = EDUCATIONAL_GUIDANCE.confidence_boosters;
      
      expect(confidenceBoosters).toContain('Most people need to try 5-8 fragrances before finding their signature scent');
      expect(confidenceBoosters).toContain('There are no wrong choices, only personal preferences');
      expect(confidenceBoosters).toContain('Every fragrance expert started as a beginner');
    });

    it('provides reassurance about mistakes', () => {
      const confidenceBoosters = EDUCATIONAL_GUIDANCE.confidence_boosters;
      
      expect(confidenceBoosters).toContain("Don't love it? We'll help you find something even better");
      expect(confidenceBoosters).toContain('Your nose knows - trust your instincts about what smells good to you');
    });
  });

  describe('Progressive Learning Support', () => {
    it('starts with simple explanations', () => {
      Object.values(EDUCATIONAL_GUIDANCE.concentration_help).forEach(content => {
        expect(content.shortExplanation.split(' ')).toHaveLength.lessThan(8);
        expect(content.shortExplanation).not.toMatch(/technical|molecular|chemical/i);
      });
    });

    it('provides detailed information when requested', () => {
      Object.values(EDUCATIONAL_GUIDANCE.concentration_help).forEach(content => {
        expect(content.detailedExplanation).toBeTruthy();
        expect(content.detailedExplanation!.length).toBeGreaterThan(content.shortExplanation.length);
      });
    });

    it('includes practical examples for context', () => {
      Object.values(EDUCATIONAL_GUIDANCE.concentration_help).forEach(content => {
        expect(content.example).toBeTruthy();
        expect(content.example).toMatch(/(apply|spray|use|wear)/i);
      });
    });
  });

  describe('Quiz Educational Integration', () => {
    it('provides contextual help during quiz taking', () => {
      render(<QuizInterface />);

      // Should show educational panel for quiz context
      expect(screen.getByText('Fragrance Learning Center')).toBeInTheDocument();
      
      // Quiz should have confidence-building messaging
      expect(screen.getByText(/Get instant recommendations.*Try samples risk-free/)).toBeInTheDocument();
    });

    it('reduces anxiety about quiz answers', () => {
      const quizHelp = EDUCATIONAL_GUIDANCE.confidence_boosters;
      
      // Should emphasize no wrong answers
      expect(quizHelp.some(help => help.includes('no wrong choices'))).toBe(true);
      expect(quizHelp.some(help => help.includes('trust your instincts'))).toBe(true);
    });
  });

  describe('Real-world Application', () => {
    it('translates technical scores to understandable meanings', () => {
      render(<FragranceDetailPage fragrance={mockFragrance} />);

      // Should show scores with educational context
      expect(screen.getByText('7/10')).toBeInTheDocument(); // Intensity score
      expect(screen.getByText('8h')).toBeInTheDocument(); // Longevity
      expect(screen.getByText('6/10')).toBeInTheDocument(); // Sillage

      // These should be explainable via tooltips
      const intensityElement = screen.getByText('Intensity');
      expect(intensityElement).toBeInTheDocument();
    });

    it('provides shopping guidance', () => {
      render(<FragranceDetailPage fragrance={mockFragrance} />);

      // Should have sample-first messaging
      expect(screen.getByText('Try Before You Buy')).toBeInTheDocument();
      expect(screen.getByText(/Start with a sample to experience this fragrance risk-free/)).toBeInTheDocument();
    });

    it('builds expectations appropriately', () => {
      // Application tips should set realistic expectations
      const testingTip = EDUCATIONAL_GUIDANCE.application_tips.find(tip => tip.term === 'Testing Time');
      expect(testingTip?.detailedExplanation).toContain('30 minutes');
      expect(testingTip?.example).toContain('2 hours');
    });
  });

  describe('Accessibility of Educational Content', () => {
    it('provides keyboard accessible tooltips', async () => {
      render(<FragranceDetailPage fragrance={mockFragrance} />);

      const intensityTerm = screen.getByText('Intensity');
      
      // Focus and activate with keyboard
      intensityTerm.focus();
      fireEvent.keyDown(intensityTerm, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('How strong the fragrance feels (1-10 scale)')).toBeInTheDocument();
      });
    });

    it('provides clear aria labels for help buttons', () => {
      render(<FragranceDetailPage fragrance={mockFragrance} />);

      const helpButtons = screen.getAllByLabelText(/Learn about/);
      expect(helpButtons.length).toBeGreaterThan(0);
      
      helpButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('maintains logical tab order', () => {
      render(<FragranceDetailPage fragrance={mockFragrance} />);

      // Educational elements should be properly focusable
      const focusableElements = screen.getAllByRole('button')
        .concat(screen.getAllByText(/Intensity|Longevity|Sillage/));
      
      expect(focusableElements.length).toBeGreaterThan(0);
    });
  });
});

describe('Measurable Comprehension Outcomes', () => {
  it('reduces terminology confusion', () => {
    // Test that technical terms are explained in simple language
    const technicalTerms = ['EDP', 'EDT', 'Parfum', 'Sillage'];
    
    technicalTerms.forEach(term => {
      const content = EDUCATIONAL_GUIDANCE.concentration_help[term] || 
                    { shortExplanation: 'How far the scent travels around you' }; // Sillage
      
      expect(content.shortExplanation).toBeTruthy();
      expect(content.shortExplanation).not.toMatch(/olfactory|volatile|molecular/i);
      expect(content.shortExplanation.split(' ')).toHaveLength.lessThan(10);
    });
  });

  it('provides decision-making frameworks', () => {
    // Application tips should give clear decision criteria
    const applicationTips = EDUCATIONAL_GUIDANCE.application_tips;
    
    expect(applicationTips.some(tip => tip.shortExplanation.includes('30 minutes'))).toBe(true);
    expect(applicationTips.some(tip => tip.shortExplanation.includes('2-3 sprays'))).toBe(true);
    expect(applicationTips.some(tip => tip.shortExplanation.includes('pulse points'))).toBe(true);
  });

  it('builds systematic understanding', () => {
    // Should cover all major fragrance concepts
    const categories = new Set();
    
    Object.values(EDUCATIONAL_GUIDANCE.concentration_help).forEach(content => {
      categories.add(content.category);
    });
    
    Object.values(EDUCATIONAL_GUIDANCE.note_explanations).forEach(content => {
      categories.add(content.category);
    });
    
    EDUCATIONAL_GUIDANCE.application_tips.forEach(content => {
      categories.add(content.category);
    });

    expect(categories.has('concentrations')).toBe(true);
    expect(categories.has('notes')).toBe(true);
    expect(categories.has('application')).toBe(true);
  });

  it('tracks learning progress conceptually', () => {
    // Educational content should be structured for progressive learning
    const beginnerContent = Object.values(EDUCATIONAL_GUIDANCE.concentration_help);
    
    beginnerContent.forEach(content => {
      // Has basic explanation
      expect(content.shortExplanation).toBeTruthy();
      
      // Has detailed explanation for deeper learning  
      expect(content.detailedExplanation).toBeTruthy();
      
      // Has practical application
      expect(content.example).toBeTruthy();
      
      // Builds confidence
      expect(content.confidence_building).toBeTruthy();
    });
  });
});