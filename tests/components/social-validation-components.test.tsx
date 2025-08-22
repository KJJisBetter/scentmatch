import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  SocialProofBadges,
  DemographicContext,
  PopularityIndicator,
  SocialProofSummary
} from '@/components/social/social-proof-badges';
import {
  UniquenessGuide,
  QuickUniquenessIndicator
} from '@/components/social/uniqueness-guide';
import type { SocialValidationBadge, SocialContext, UniquenessScore } from '@/lib/services/social-context';

/**
 * SCE-69: Social Validation Components Tests
 * 
 * Tests all social proof and uniqueness components for:
 * - Badge rendering and styling
 * - Social context display
 * - User interaction handling
 * - Accessibility compliance
 * - Performance with large datasets
 */

// Mock data for testing
const mockSocialContext: SocialContext = {
  overall: {
    demographic_groups: 5,
    avg_approval: 4.2,
    total_approvals: 150,
    love_percentage: 78.5,
    confidence: 0.85
  },
  peer_context: {
    approval_rating: 4.5,
    approval_count: 25,
    love_percentage: 84.0,
    beginner_friendly: 4.3,
    experienced_approval: 4.1,
    confidence: 0.92
  },
  trending: {
    trending_score: 7.8,
    velocity: 2.3,
    rank_in_category: 5,
    percentile: 85.2
  },
  uniqueness: {
    popularity_level: 8.5,
    distinctiveness: 3.2,
    market_saturation: 12.5,
    conformity_pressure: 7.0
  }
};

const mockBadges: SocialValidationBadge[] = [
  {
    type: 'demographic',
    label: 'Popular with 18–24 beginners',
    value: '84%',
    confidence: 0.92,
    description: '25 similar users rated this fragrance',
    icon: '👥'
  },
  {
    type: 'peer_approval',
    label: 'Highly recommended',
    value: '4.2/5',
    confidence: 0.85,
    description: 'Based on 150 peer reviews',
    icon: '⭐'
  },
  {
    type: 'trending',
    label: 'Trending now',
    value: '+230%',
    confidence: 0.9,
    description: 'Rising popularity this month',
    icon: '🔥'
  }
];

const mockUniquenessScore: UniquenessScore = {
  popularity_score: 8.5,
  distinctiveness_score: 3.2,
  market_saturation: 12.5,
  conformity_pressure: 7.0,
  similar_but_unique: [
    { id: 'alt1', name: 'Alternative 1', similarity: 0.85 },
    { id: 'alt2', name: 'Alternative 2', similarity: 0.78 }
  ]
};

const mockAlternatives = [
  {
    id: 'alt1',
    name: 'Unique Alternative 1',
    brand: 'Test Brand',
    similarity: 0.85,
    uniqueness_advantage: 2.3
  },
  {
    id: 'alt2',
    name: 'Distinctive Option 2',
    brand: 'Another Brand',
    similarity: 0.78,
    uniqueness_advantage: 3.1
  }
];

describe('SocialProofBadges Component', () => {
  test('renders compact badges correctly', () => {
    render(
      <SocialProofBadges 
        badges={mockBadges}
        variant="compact"
      />
    );

    // Should show first 3 badges in compact mode
    expect(screen.getByText('Popular with 18–24 beginners')).toBeInTheDocument();
    expect(screen.getByText('84%')).toBeInTheDocument();
    expect(screen.getByText('Highly recommended')).toBeInTheDocument();
    expect(screen.getByText('4.2/5')).toBeInTheDocument();
    expect(screen.getByText('Trending now')).toBeInTheDocument();
    expect(screen.getByText('+230%')).toBeInTheDocument();

    // Should have emoji icons
    expect(screen.getByText('👥')).toBeInTheDocument();
    expect(screen.getByText('⭐')).toBeInTheDocument();
    expect(screen.getByText('🔥')).toBeInTheDocument();
  });

  test('renders detailed badges with descriptions', () => {
    render(
      <SocialProofBadges 
        badges={mockBadges}
        variant="detailed"
      />
    );

    // Should show descriptions in detailed mode
    expect(screen.getByText('25 similar users rated this fragrance')).toBeInTheDocument();
    expect(screen.getByText('Based on 150 peer reviews')).toBeInTheDocument();
    expect(screen.getByText('Rising popularity this month')).toBeInTheDocument();

    // Should have progress bars for confidence
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(3);
  });

  test('handles empty badges gracefully', () => {
    const { container } = render(
      <SocialProofBadges badges={[]} />
    );

    expect(container.firstChild).toBeNull();
  });

  test('applies correct badge variants based on type and confidence', () => {
    render(
      <SocialProofBadges 
        badges={[
          { ...mockBadges[0], confidence: 0.3 }, // Low confidence
          { ...mockBadges[1], confidence: 0.9 }   // High confidence
        ]}
        variant="compact"
      />
    );

    const badges = screen.getAllByRole('button', { hidden: true });
    expect(badges).toHaveLength(2);
  });
});

describe('DemographicContext Component', () => {
  test('renders demographic context correctly', () => {
    render(
      <DemographicContext 
        context={mockSocialContext}
        userAgeGroup="18-24"
        userExperienceLevel="beginner"
      />
    );

    expect(screen.getByText('People Like You')).toBeInTheDocument();
    expect(screen.getByText('18–24 year olds · beginners')).toBeInTheDocument();
    expect(screen.getByText('25 reviews')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('84%')).toBeInTheDocument();
  });

  test('shows beginner-friendly badge for beginners', () => {
    render(
      <DemographicContext 
        context={mockSocialContext}
        userAgeGroup="18-24"
        userExperienceLevel="beginner"
      />
    );

    expect(screen.getByText('Beginner-Friendly')).toBeInTheDocument();
    expect(screen.getByText(/Great choice for someone new to fragrances/)).toBeInTheDocument();
  });

  test('does not render without peer context', () => {
    const contextWithoutPeer = {
      ...mockSocialContext,
      peer_context: undefined
    };

    const { container } = render(
      <DemographicContext 
        context={contextWithoutPeer}
        userAgeGroup="18-24"
        userExperienceLevel="beginner"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('handles different experience levels correctly', () => {
    render(
      <DemographicContext 
        context={mockSocialContext}
        userAgeGroup="25-34"
        userExperienceLevel="experienced"
      />
    );

    expect(screen.getByText('25–34 year olds · experienced users')).toBeInTheDocument();
    expect(screen.queryByText('Beginner-Friendly')).not.toBeInTheDocument();
  });
});

describe('PopularityIndicator Component', () => {
  test('renders trending indicator when trending', () => {
    render(
      <PopularityIndicator context={mockSocialContext} />
    );

    expect(screen.getByText('Trending')).toBeInTheDocument();
    expect(screen.getByText('+230%')).toBeInTheDocument();
    expect(screen.getByText('this month')).toBeInTheDocument();
  });

  test('renders popularity meter', () => {
    render(
      <PopularityIndicator context={mockSocialContext} />
    );

    expect(screen.getByText('Popularity')).toBeInTheDocument();
    expect(screen.getByText('Very Common')).toBeInTheDocument();

    // Should have progress bar
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  test('does not render without trending or uniqueness data', () => {
    const minimalContext = {
      overall: mockSocialContext.overall
    };

    const { container } = render(
      <PopularityIndicator context={minimalContext as SocialContext} />
    );

    expect(container.firstChild).toBeNull();
  });

  test('shows correct popularity labels', () => {
    const testCases = [
      { score: 9.0, expected: 'Very Common' },
      { score: 7.0, expected: 'Popular' },
      { score: 5.0, expected: 'Moderate' },
      { score: 2.0, expected: 'Unique' }
    ];

    testCases.forEach(({ score, expected }) => {
      const contextWithScore = {
        ...mockSocialContext,
        uniqueness: {
          ...mockSocialContext.uniqueness!,
          popularity_level: score
        }
      };

      const { rerender } = render(
        <PopularityIndicator context={contextWithScore} />
      );

      expect(screen.getByText(expected)).toBeInTheDocument();
      
      rerender(<div />); // Clear between tests
    });
  });
});

describe('SocialProofSummary Component', () => {
  test('renders comprehensive social proof summary', () => {
    render(
      <SocialProofSummary 
        context={mockSocialContext}
        userAgeGroup="18-24"
        userExperienceLevel="beginner"
      />
    );

    expect(screen.getByText('Social Validation')).toBeInTheDocument();
    expect(screen.getByText(/78% of 150 users recommend this/)).toBeInTheDocument();
    expect(screen.getByText(/Popular with 18–24 year olds/)).toBeInTheDocument();
    expect(screen.getByText(/Very popular choice/)).toBeInTheDocument();
  });

  test('handles empty social data', () => {
    const emptyContext = {
      overall: {
        demographic_groups: 0,
        avg_approval: 0,
        total_approvals: 0,
        love_percentage: 0,
        confidence: 0
      }
    };

    render(
      <SocialProofSummary context={emptyContext as SocialContext} />
    );

    expect(screen.getByText(/Be the first to try and rate this fragrance/)).toBeInTheDocument();
  });

  test('shows confidence indicator', () => {
    render(
      <SocialProofSummary context={mockSocialContext} />
    );

    expect(screen.getByText('Confidence:')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });
});

describe('UniquenessGuide Component', () => {
  test('renders main uniqueness assessment', () => {
    render(
      <UniquenessGuide 
        uniquenessScore={mockUniquenessScore}
        context={mockSocialContext}
        alternatives={mockAlternatives}
      />
    );

    expect(screen.getByText('Popular Classic')).toBeInTheDocument();
    expect(screen.getByText(/A widely-loved fragrance that's popular for good reason/)).toBeInTheDocument();
  });

  test('shows popularity and distinctiveness meters', () => {
    render(
      <UniquenessGuide 
        uniquenessScore={mockUniquenessScore}
        context={mockSocialContext}
      />
    );

    expect(screen.getByText('Popularity')).toBeInTheDocument();
    expect(screen.getByText('Distinctiveness')).toBeInTheDocument();
    expect(screen.getByText('Extremely Popular')).toBeInTheDocument();
    expect(screen.getByText('Somewhat Common')).toBeInTheDocument();

    // Should have progress bars
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThanOrEqual(2);
  });

  test('shows personality match assessment', () => {
    render(
      <UniquenessGuide 
        uniquenessScore={mockUniquenessScore}
        context={mockSocialContext}
        userUniquenessPreference={3} // Prefers popular
      />
    );

    expect(screen.getByText('Personal Fit')).toBeInTheDocument();
    expect(screen.getByText(/Great choice for your preference for popular scents/)).toBeInTheDocument();
  });

  test('shows social pressure warning for high conformity pressure', () => {
    const highPressureScore = {
      ...mockUniquenessScore,
      conformity_pressure: 8.5
    };

    render(
      <UniquenessGuide 
        uniquenessScore={highPressureScore}
        context={mockSocialContext}
      />
    );

    expect(screen.getByText('Social Pressure Alert')).toBeInTheDocument();
    expect(screen.getByText(/This fragrance carries significant social expectations/)).toBeInTheDocument();
  });

  test('toggles alternatives display', async () => {
    render(
      <UniquenessGuide 
        uniquenessScore={mockUniquenessScore}
        context={mockSocialContext}
        alternatives={mockAlternatives}
      />
    );

    const alternativesButton = screen.getByText('Similar but More Unique Alternatives');
    expect(alternativesButton).toBeInTheDocument();

    // Initially collapsed
    expect(screen.queryByText('Unique Alternative 1')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(alternativesButton);
    
    await waitFor(() => {
      expect(screen.getByText('Unique Alternative 1')).toBeInTheDocument();
      expect(screen.getByText('Distinctive Option 2')).toBeInTheDocument();
      expect(screen.getByText('85% similar')).toBeInTheDocument();
      expect(screen.getByText('78% similar')).toBeInTheDocument();
    });

    // Click to collapse
    fireEvent.click(alternativesButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Unique Alternative 1')).not.toBeInTheDocument();
    });
  });

  test('displays pros and cons correctly', () => {
    render(
      <UniquenessGuide 
        uniquenessScore={mockUniquenessScore}
        context={mockSocialContext}
      />
    );

    expect(screen.getByText('✅ Pros')).toBeInTheDocument();
    expect(screen.getByText('⚠️ Considerations')).toBeInTheDocument();
    expect(screen.getByText(/Proven appeal/)).toBeInTheDocument();
    expect(screen.getByText(/Very common scent/)).toBeInTheDocument();
  });
});

describe('QuickUniquenessIndicator Component', () => {
  test('renders correct indicator for very popular fragrance', () => {
    render(
      <QuickUniquenessIndicator 
        popularityScore={9.0}
        distinctivenessScore={3.0}
      />
    );

    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('Very Popular')).toBeInTheDocument();
    expect(screen.getByText('You might smell like others')).toBeInTheDocument();
  });

  test('renders correct indicator for distinctive fragrance', () => {
    render(
      <QuickUniquenessIndicator 
        popularityScore={3.0}
        distinctivenessScore={8.0}
      />
    );

    expect(screen.getByText('💎')).toBeInTheDocument();
    expect(screen.getByText('Distinctive')).toBeInTheDocument();
    expect(screen.getByText('Stand out from the crowd')).toBeInTheDocument();
  });

  test('renders balanced indicator', () => {
    render(
      <QuickUniquenessIndicator 
        popularityScore={6.0}
        distinctivenessScore={6.0}
      />
    );

    expect(screen.getByText('⚖️')).toBeInTheDocument();
    expect(screen.getByText('Balanced')).toBeInTheDocument();
    expect(screen.getByText('Popular yet distinctive')).toBeInTheDocument();
  });
});

describe('Accessibility and Performance', () => {
  test('components have proper ARIA labels and roles', () => {
    render(
      <div>
        <SocialProofBadges badges={mockBadges} variant="detailed" />
        <DemographicContext 
          context={mockSocialContext}
          userAgeGroup="18-24"
          userExperienceLevel="beginner"
        />
        <UniquenessGuide 
          uniquenessScore={mockUniquenessScore}
          context={mockSocialContext}
        />
      </div>
    );

    // Progress bars should have proper roles
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);

    // Buttons should be accessible
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('handles large datasets efficiently', () => {
    const largeBadgeSet = Array.from({ length: 20 }, (_, i) => ({
      ...mockBadges[0],
      label: `Badge ${i + 1}`,
      value: `${i + 1}%`
    }));

    const startTime = performance.now();
    
    render(
      <SocialProofBadges badges={largeBadgeSet} variant="compact" />
    );
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(100); // Should render quickly

    // Should only show first 3 in compact mode
    expect(screen.getByText('Badge 1')).toBeInTheDocument();
    expect(screen.getByText('Badge 2')).toBeInTheDocument();
    expect(screen.getByText('Badge 3')).toBeInTheDocument();
    expect(screen.queryByText('Badge 4')).not.toBeInTheDocument();
  });

  test('gracefully handles missing or undefined props', () => {
    expect(() => {
      render(
        <div>
          <SocialProofBadges badges={[]} />
          <DemographicContext context={{} as SocialContext} />
          <PopularityIndicator context={{} as SocialContext} />
          <QuickUniquenessIndicator popularityScore={0} distinctivenessScore={0} />
        </div>
      );
    }).not.toThrow();
  });
});