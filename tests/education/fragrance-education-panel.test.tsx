/**
 * Tests for Fragrance Education Panel
 * 
 * Ensures the educational panel displays appropriate content
 * for different contexts and user experience levels.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { FragranceEducationPanel } from '@/components/education/fragrance-education-panel';

// Mock the education context hook
const mockEducationContext = {
  shouldShowEducation: vi.fn(),
  isBeginnerMode: true,
  getTooltipSettings: vi.fn(() => ({
    showDetailed: true,
    showConfidence: true,
    showExamples: true
  }))
};

vi.mock('@/lib/education/useEducationContext', () => ({
  useEducationContext: () => mockEducationContext
}));

describe('FragranceEducationPanel', () => {
  beforeEach(() => {
    mockEducationContext.shouldShowEducation.mockReturnValue(true);
    mockEducationContext.isBeginnerMode = true;
  });

  it('renders collapsed by default', () => {
    render(<FragranceEducationPanel context="fragrance_page" />);

    expect(screen.getByText('Fragrance Learning Center')).toBeInTheDocument();
    expect(screen.getByText('Quick explanations to help you shop with confidence')).toBeInTheDocument();
    
    // Educational content should not be visible initially
    expect(screen.queryByText('You\'re in Good Company')).not.toBeInTheDocument();
  });

  it('expands when defaultExpanded is true', () => {
    render(<FragranceEducationPanel context="quiz" defaultExpanded={true} />);

    expect(screen.getByText('You\'re in Good Company')).toBeInTheDocument();
    expect(screen.getByText('96%')).toBeInTheDocument();
    expect(screen.getByText('find their match')).toBeInTheDocument();
  });

  it('can be toggled open and closed', async () => {
    render(<FragranceEducationPanel context="fragrance_page" />);

    const trigger = screen.getByRole('button');
    
    // Click to open
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('You\'re in Good Company')).toBeInTheDocument();
    });

    // Click to close
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(screen.queryByText('You\'re in Good Company')).not.toBeInTheDocument();
    });
  });

  it('displays success statistics', () => {
    render(<FragranceEducationPanel context="fragrance_page" defaultExpanded={true} />);

    expect(screen.getByText('96%')).toBeInTheDocument();
    expect(screen.getByText('find their match')).toBeInTheDocument();
    expect(screen.getByText('3-5')).toBeInTheDocument();
    expect(screen.getByText('tries on average')).toBeInTheDocument();
    expect(screen.getByText('94%')).toBeInTheDocument();
    expect(screen.getByText('satisfaction')).toBeInTheDocument();
  });

  it('shows fragrance page specific content', () => {
    render(<FragranceEducationPanel context="fragrance_page" defaultExpanded={true} />);

    expect(screen.getByText('Understanding This Fragrance')).toBeInTheDocument();
    expect(screen.getByText(/Notes.*These are the scent ingredients/)).toBeInTheDocument();
    expect(screen.getByText(/Intensity.*How strong the fragrance feels/)).toBeInTheDocument();
    expect(screen.getByText(/Longevity.*How many hours it lasts/)).toBeInTheDocument();
    expect(screen.getByText(/Sillage.*How far the scent travels/)).toBeInTheDocument();
  });

  it('shows quiz specific content', () => {
    render(<FragranceEducationPanel context="quiz" defaultExpanded={true} />);

    expect(screen.getByText('Taking the Quiz')).toBeInTheDocument();
    expect(screen.getByText(/Choose answers that feel right to you/)).toBeInTheDocument();
    expect(screen.getByText(/Think about scents you already enjoy/)).toBeInTheDocument();
    expect(screen.getByText(/You can always retake the quiz/)).toBeInTheDocument();
  });

  it('shows search specific content', () => {
    render(<FragranceEducationPanel context="search" defaultExpanded={true} />);

    expect(screen.getByText('Finding Your Perfect Match')).toBeInTheDocument();
    expect(screen.getByText(/Start with fragrance families/)).toBeInTheDocument();
    expect(screen.getByText(/Use filters to narrow down/)).toBeInTheDocument();
    expect(screen.getByText(/Look for "Beginner Friendly" badges/)).toBeInTheDocument();
  });

  it('displays concentration quick guide', () => {
    render(<FragranceEducationPanel context="fragrance_page" defaultExpanded={true} />);

    expect(screen.getByText('Fragrance Strengths Quick Guide')).toBeInTheDocument();
    expect(screen.getByText('EDP')).toBeInTheDocument();
    expect(screen.getByText('EDT')).toBeInTheDocument();
    expect(screen.getByText('Parfum')).toBeInTheDocument();
    expect(screen.getByText('EDC')).toBeInTheDocument();
  });

  it('displays confidence boosters', () => {
    render(<FragranceEducationPanel context="fragrance_page" defaultExpanded={true} />);

    expect(screen.getByText('Confidence Boosters')).toBeInTheDocument();
    expect(screen.getByText(/96% of beginners find their match within 3 tries/)).toBeInTheDocument();
    expect(screen.getByText(/Most people need to try 5-8 before finding/)).toBeInTheDocument();
    expect(screen.getByText(/Don't love it\? We'll help you find something else/)).toBeInTheDocument();
  });

  it('shows action button for more resources', () => {
    render(<FragranceEducationPanel context="fragrance_page" defaultExpanded={true} />);

    const actionButton = screen.getByRole('button', { name: /See More Learning Resources/ });
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveClass('text-amber-700', 'border-amber-300');
  });

  it('does not render for advanced users', () => {
    mockEducationContext.shouldShowEducation.mockReturnValue(false);
    
    render(<FragranceEducationPanel context="fragrance_page" />);

    expect(screen.queryByText('Fragrance Learning Center')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <FragranceEducationPanel 
        context="fragrance_page" 
        className="custom-class"
      />
    );

    const panel = screen.getByText('Fragrance Learning Center').closest('.custom-class');
    expect(panel).toBeInTheDocument();
  });

  it('has proper beginner friendly badge', () => {
    render(<FragranceEducationPanel context="fragrance_page" />);

    expect(screen.getByText('Beginner Friendly')).toBeInTheDocument();
    expect(screen.getByText('Beginner Friendly')).toHaveClass('bg-amber-100', 'text-amber-800');
  });

  it('has accessible expand/collapse button', () => {
    render(<FragranceEducationPanel context="fragrance_page" />);

    const expandButton = screen.getByRole('button');
    expect(expandButton).toBeInTheDocument();
    
    // Should have visual indicators for expand/collapse state
    expect(screen.getByTestId('chevron-down') || screen.getByTestId('chevron-up')).toBeTruthy();
  });

  it('displays appropriate icons throughout', () => {
    render(<FragranceEducationPanel context="fragrance_page" defaultExpanded={true} />);

    // Should have various icons for visual appeal
    expect(screen.getByTestId('book-open') || screen.getByLabelText(/book/i)).toBeTruthy();
    expect(screen.getByTestId('trending-up') || screen.getByLabelText(/trending/i)).toBeTruthy();
    expect(screen.getByTestId('target') || screen.getByLabelText(/target/i)).toBeTruthy();
    expect(screen.getByTestId('lightbulb') || screen.getByLabelText(/lightbulb/i)).toBeTruthy();
    expect(screen.getByTestId('users') || screen.getByLabelText(/users/i)).toBeTruthy();
  });

  it('has proper color scheme and styling', () => {
    render(<FragranceEducationPanel context="fragrance_page" />);

    const panel = screen.getByText('Fragrance Learning Center').closest('div');
    expect(panel).toHaveClass('border-amber-200', 'bg-gradient-to-br', 'from-amber-50', 'to-cream-50');
  });

  it('integrates with education tooltip system', () => {
    render(<FragranceEducationPanel context="fragrance_page" defaultExpanded={true} />);

    // The concentration terms should be wrapped with educational tooltips
    const edpElement = screen.getByText('EDP');
    expect(edpElement).toBeInTheDocument();
    
    // Should have cursor-help class from tooltip wrapper
    expect(edpElement.closest('[class*="cursor-help"]')).toBeTruthy();
  });
});

describe('Context-specific Education Content', () => {
  beforeEach(() => {
    mockEducationContext.shouldShowEducation.mockReturnValue(true);
  });

  it('shows different content for each context', () => {
    const { rerender } = render(
      <FragranceEducationPanel context="fragrance_page" defaultExpanded={true} />
    );
    
    expect(screen.getByText('Understanding This Fragrance')).toBeInTheDocument();

    rerender(<FragranceEducationPanel context="quiz" defaultExpanded={true} />);
    expect(screen.getByText('Taking the Quiz')).toBeInTheDocument();
    expect(screen.queryByText('Understanding This Fragrance')).not.toBeInTheDocument();

    rerender(<FragranceEducationPanel context="search" defaultExpanded={true} />);
    expect(screen.getByText('Finding Your Perfect Match')).toBeInTheDocument();
    expect(screen.queryByText('Taking the Quiz')).not.toBeInTheDocument();
  });

  it('provides appropriate guidance for each context', () => {
    // Quiz context
    render(<FragranceEducationPanel context="quiz" defaultExpanded={true} />);
    expect(screen.getByText(/no wrong choices/)).toBeInTheDocument();
    expect(screen.getByText(/retake the quiz/)).toBeInTheDocument();

    // Search context  
    const { rerender } = render(
      <FragranceEducationPanel context="search" defaultExpanded={true} />
    );
    expect(screen.getByText(/fragrance families/)).toBeInTheDocument();
    expect(screen.getByText(/Beginner Friendly.*badges/)).toBeInTheDocument();

    // Fragrance page context
    rerender(<FragranceEducationPanel context="fragrance_page" defaultExpanded={true} />);
    expect(screen.getByText(/scent ingredients/)).toBeInTheDocument();
    expect(screen.getByText(/1-10 scale/)).toBeInTheDocument();
  });
});