/**
 * Tests for Educational Tooltip System
 * 
 * Ensures tooltips display correctly and provide appropriate
 * educational content for different user experience levels.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { 
  EducationalTooltip, 
  InlineEducationalHelp,
  EducationalHighlight 
} from '@/components/education/educational-tooltip';
import { EDUCATIONAL_GUIDANCE } from '@/lib/education/content';

// Mock tooltip content for testing
const mockTooltipContent = {
  term: 'EDP',
  shortExplanation: 'Stronger scent, lasts 6-8 hours',
  detailedExplanation: 'Eau de Parfum contains 15-20% fragrance oil, making it stronger and longer-lasting than EDT.',
  category: 'concentrations' as const,
  confidence_building: 'Most people choose EDP for their signature scent',
  example: 'Apply 2-3 sprays in the morning for all-day fragrance'
};

describe('EducationalTooltip', () => {
  beforeEach(() => {
    // Reset any localStorage or context before each test
    localStorage.clear();
  });

  it('renders trigger element correctly', () => {
    render(
      <EducationalTooltip content={mockTooltipContent}>
        <span>EDP</span>
      </EducationalTooltip>
    );

    expect(screen.getByText('EDP')).toBeInTheDocument();
  });

  it('shows tooltip content on hover', async () => {
    render(
      <EducationalTooltip content={mockTooltipContent}>
        <span>EDP</span>
      </EducationalTooltip>
    );

    const trigger = screen.getByText('EDP');
    
    // Hover over the trigger
    fireEvent.mouseEnter(trigger);

    // Wait for tooltip to appear
    await waitFor(() => {
      expect(screen.getByText('EDP (Eau de Parfum)')).toBeInTheDocument();
      expect(screen.getByText('Stronger scent, lasts 6-8 hours')).toBeInTheDocument();
    });
  });

  it('shows detailed explanation for beginners', async () => {
    render(
      <EducationalTooltip 
        content={mockTooltipContent}
        userLevel="beginner"
        showDetailed={true}
      >
        <span>EDP</span>
      </EducationalTooltip>
    );

    const trigger = screen.getByText('EDP');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText(/Eau de Parfum contains 15-20% fragrance oil/)).toBeInTheDocument();
    });
  });

  it('shows confidence building message for beginners', async () => {
    render(
      <EducationalTooltip 
        content={mockTooltipContent}
        userLevel="beginner"
        showConfidence={true}
      >
        <span>EDP</span>
      </EducationalTooltip>
    );

    const trigger = screen.getByText('EDP');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Most people choose EDP for their signature scent')).toBeInTheDocument();
    });
  });

  it('hides detailed content for advanced users', async () => {
    render(
      <EducationalTooltip 
        content={mockTooltipContent}
        userLevel="advanced"
        showDetailed={false}
      >
        <span>EDP</span>
      </EducationalTooltip>
    );

    // For advanced users, should not render tooltip at all
    expect(screen.getByText('EDP')).toBeInTheDocument();
    
    const trigger = screen.getByText('EDP');
    fireEvent.mouseEnter(trigger);

    // Should not show tooltip content
    await waitFor(() => {
      expect(screen.queryByText('EDP (Eau de Parfum)')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('displays category badge correctly', async () => {
    render(
      <EducationalTooltip content={mockTooltipContent}>
        <span>EDP</span>
      </EducationalTooltip>
    );

    const trigger = screen.getByText('EDP');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('concentrations')).toBeInTheDocument();
    });
  });

  it('shows example when provided', async () => {
    render(
      <EducationalTooltip content={mockTooltipContent}>
        <span>EDP</span>
      </EducationalTooltip>
    );

    const trigger = screen.getByText('EDP');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText(/Apply 2-3 sprays in the morning/)).toBeInTheDocument();
    });
  });
});

describe('InlineEducationalHelp', () => {
  it('renders help icon', () => {
    render(
      <InlineEducationalHelp content={mockTooltipContent} />
    );

    // Should render a help icon button
    const helpButton = screen.getByRole('button');
    expect(helpButton).toBeInTheDocument();
    expect(helpButton).toHaveAttribute('aria-label', 'Learn about EDP');
  });

  it('shows tooltip on help icon hover', async () => {
    render(
      <InlineEducationalHelp content={mockTooltipContent} />
    );

    const helpButton = screen.getByRole('button');
    fireEvent.mouseEnter(helpButton);

    await waitFor(() => {
      expect(screen.getByText('EDP (Eau de Parfum)')).toBeInTheDocument();
    });
  });
});

describe('EducationalHighlight', () => {
  it('renders highlighted term', () => {
    render(
      <EducationalHighlight 
        term="EDP"
        content={mockTooltipContent}
      />
    );

    const highlightedTerm = screen.getByText('EDP');
    expect(highlightedTerm).toBeInTheDocument();
    expect(highlightedTerm).toHaveClass('underline');
  });

  it('shows tooltip on highlighted term hover', async () => {
    render(
      <EducationalHighlight 
        term="EDP"
        content={mockTooltipContent}
      />
    );

    const highlightedTerm = screen.getByText('EDP');
    fireEvent.mouseEnter(highlightedTerm);

    await waitFor(() => {
      expect(screen.getByText('EDP (Eau de Parfum)')).toBeInTheDocument();
    });
  });
});

describe('Real Educational Content Integration', () => {
  it('works with real concentration guidance', async () => {
    const edpContent = EDUCATIONAL_GUIDANCE.concentration_help['EDP'];
    
    render(
      <EducationalTooltip content={edpContent}>
        <span>EDP</span>
      </EducationalTooltip>
    );

    const trigger = screen.getByText('EDP');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('EDP (Eau de Parfum)')).toBeInTheDocument();
      expect(screen.getByText('Stronger scent, lasts 6-8 hours')).toBeInTheDocument();
    });
  });

  it('works with real note explanations', async () => {
    const floralContent = EDUCATIONAL_GUIDANCE.note_explanations['Floral'];
    
    render(
      <EducationalTooltip content={floralContent}>
        <span>Floral</span>
      </EducationalTooltip>
    );

    const trigger = screen.getByText('Floral');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Floral Notes')).toBeInTheDocument();
      expect(screen.getByText('Flower scents like rose, jasmine, lily')).toBeInTheDocument();
    });
  });
});

describe('Accessibility', () => {
  it('has proper ARIA labels', () => {
    render(
      <InlineEducationalHelp content={mockTooltipContent} />
    );

    const helpButton = screen.getByRole('button');
    expect(helpButton).toHaveAttribute('aria-label', 'Learn about EDP');
  });

  it('supports keyboard navigation', async () => {
    render(
      <EducationalTooltip content={mockTooltipContent}>
        <span>EDP</span>
      </EducationalTooltip>
    );

    const trigger = screen.getByText('EDP');
    
    // Focus the trigger
    trigger.focus();
    
    // Press Enter to activate
    fireEvent.keyDown(trigger, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('EDP (Eau de Parfum)')).toBeInTheDocument();
    });
  });

  it('has screen reader friendly content', async () => {
    render(
      <EducationalTooltip content={mockTooltipContent}>
        <span>EDP</span>
      </EducationalTooltip>
    );

    const trigger = screen.getByText('EDP');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      // Check that the tooltip content is in the DOM and accessible
      const tooltipContent = screen.getByText('EDP (Eau de Parfum)');
      expect(tooltipContent).toBeInTheDocument();
      
      // Verify the content is not hidden from screen readers
      expect(tooltipContent).toBeVisible();
    });
  });
});