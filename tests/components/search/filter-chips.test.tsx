/**
 * Filter Chips Component Tests
 * TDD approach for Task 2.1: Filter Chips System
 * 
 * Testing Requirements:
 * - Real-time result count updates
 * - Removable filter tags with animations
 * - AI-powered filter suggestions using UnifiedRecommendationEngine
 * - Mobile-optimized touch targets (44px minimum)
 * - Debounced search queries (300ms)
 * - Optimistic UI updates
 * - Performance impact <100ms response time
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FilterChips, FilterChipData, FilterChipsProps } from '@/components/search/filter-chips';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock UnifiedRecommendationEngine
vi.mock('@/lib/ai-sdk/unified-recommendation-engine', () => ({
  UnifiedRecommendationEngine: vi.fn(() => ({
    generateRecommendations: vi.fn().mockResolvedValue({
      success: true,
      recommendations: [],
      metadata: {
        strategy_used: 'ai',
        total_candidates: 0,
        algorithm_version: 'unified_v1.0',
      },
    }),
  })),
}));

const mockFilterData: FilterChipData[] = [
  {
    id: 'citrus',
    label: 'Citrus',
    category: 'notes',
    count: 45,
    isActive: false,
    isRemovable: false,
  },
  {
    id: 'woody',
    label: 'Woody',
    category: 'notes', 
    count: 32,
    isActive: false,
    isRemovable: false,
  },
  {
    id: 'creed',
    label: 'Creed',
    category: 'brand',
    count: 28,
    isActive: true,
    isRemovable: true,
  },
  {
    id: 'office',
    label: 'Office',
    category: 'occasion',
    count: 15,
    isActive: false,
    isRemovable: false,
  },
];

const defaultProps: FilterChipsProps = {
  initialFilters: mockFilterData,
  onFilterChange: vi.fn(),
  onCountUpdate: vi.fn(),
  searchQuery: '',
  debounceMs: 300,
  performanceTarget: 100,
};

describe('FilterChips Component', () => {
  let mockOnFilterChange: ReturnType<typeof vi.fn>;
  let mockOnCountUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnFilterChange = vi.fn();
    mockOnCountUpdate = vi.fn();
    
    // Reset fetch mock
    (global.fetch as any).mockClear();
    
    // Mock successful search API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        total: 42,
        fragrances: [],
        metadata: {
          processing_time_ms: 85,
        },
      }),
    });
    
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders all filter chips with correct labels', () => {
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      expect(screen.getByText('Citrus')).toBeInTheDocument();
      expect(screen.getByText('Woody')).toBeInTheDocument();
      expect(screen.getByText('Creed')).toBeInTheDocument();
      expect(screen.getByText('Office')).toBeInTheDocument();
    });

    it('shows result counts for each filter', () => {
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      expect(screen.getByText('45')).toBeInTheDocument(); // Citrus count
      expect(screen.getByText('32')).toBeInTheDocument(); // Woody count
      expect(screen.getByText('28')).toBeInTheDocument(); // Creed count
      expect(screen.getByText('15')).toBeInTheDocument(); // Office count
    });

    it('shows active state for selected filters', () => {
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const creedChip = screen.getByTestId('filter-chip-creed');
      expect(creedChip).toHaveClass('ring-2'); // Active styling
    });

    it('shows remove button only for removable active filters', () => {
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      // Creed is active and removable
      expect(screen.getByTestId('remove-filter-creed')).toBeInTheDocument();
      
      // Others should not have remove buttons
      expect(screen.queryByTestId('remove-filter-citrus')).not.toBeInTheDocument();
      expect(screen.queryByTestId('remove-filter-woody')).not.toBeInTheDocument();
      expect(screen.queryByTestId('remove-filter-office')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Touch Targets', () => {
    it('ensures minimum 44px touch targets for mobile', () => {
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const filterChips = screen.getAllByRole('button');
      filterChips.forEach(chip => {
        const styles = window.getComputedStyle(chip);
        const minHeight = parseInt(styles.minHeight);
        expect(minHeight).toBeGreaterThanOrEqual(44);
      });
    });

    it('has adequate spacing between touch targets', () => {
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const container = screen.getByTestId('filter-chips-container');
      expect(container).toHaveClass('gap-2'); // 8px gap minimum
    });
  });

  describe('Filter Selection and Removal', () => {
    it('toggles filter state when clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const citrusChip = screen.getByTestId('filter-chip-citrus');
      await user.click(citrusChip);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        id: 'citrus',
        label: 'Citrus',
        category: 'notes',
        count: 45,
        isActive: true,
        isRemovable: true,
      });
    });

    it('removes active filter when remove button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const removeButton = screen.getByTestId('remove-filter-creed');
      await user.click(removeButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        id: 'creed',
        label: 'Creed',
        category: 'brand',
        count: 28,
        isActive: false,
        isRemovable: false,
      });
    });

    it('shows removal animation before removing filter', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const removeButton = screen.getByTestId('remove-filter-creed');
      await user.click(removeButton);

      // Check for animation class
      const creedChip = screen.getByTestId('filter-chip-creed');
      expect(creedChip).toHaveClass('animate-out');

      // Fast-forward animation
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockOnFilterChange).toHaveBeenCalled();
    });
  });

  describe('Real-time Count Updates', () => {
    it('updates counts immediately when filter is toggled (optimistic)', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const citrusChip = screen.getByTestId('filter-chip-citrus');
      await user.click(citrusChip);

      // Should show optimistic update immediately
      expect(mockOnCountUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          optimistic: true,
          estimatedTotal: expect.any(Number),
        })
      );
    });

    it('debounces API calls for count updates', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      // Click multiple filters quickly
      const citrusChip = screen.getByTestId('filter-chip-citrus');
      const woodyChip = screen.getByTestId('filter-chip-woody');
      
      await user.click(citrusChip);
      await user.click(woodyChip);

      // Should not call API immediately
      expect(global.fetch).not.toHaveBeenCalled();

      // Advance timers past debounce period
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Now API should be called once with final filter state
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith('/api/search?count_only=true&scent_families=citrus,woody');
      });
    });

    it('updates counts with real data after API response', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const citrusChip = screen.getByTestId('filter-chip-citrus');
      await user.click(citrusChip);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockOnCountUpdate).toHaveBeenLastCalledWith(
          expect.objectContaining({
            optimistic: false,
            actualTotal: 42,
            processingTime: 85,
          })
        );
      });
    });
  });

  describe('AI-Powered Filter Suggestions', () => {
    it('shows AI suggestion chips based on current selection', async () => {
      // Mock AI suggestions response
      const mockSuggestions = [
        { id: 'fresh', label: 'Fresh', category: 'notes', count: 22, confidence: 0.85 },
        { id: 'summer', label: 'Summer', category: 'occasion', count: 18, confidence: 0.78 },
      ];

      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            suggestions: mockSuggestions,
            metadata: { confidence: 0.8 },
          }),
        })
      );

      render(
        <FilterChips
          {...defaultProps}
          showAISuggestions={true}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      // Wait for AI suggestions to load
      await waitFor(() => {
        expect(screen.getByText('Fresh')).toBeInTheDocument();
        expect(screen.getByText('Summer')).toBeInTheDocument();
      });

      // Check suggestion styling
      const suggestionChip = screen.getByTestId('suggestion-chip-fresh');
      expect(suggestionChip).toHaveClass('ring-1', 'ring-dashed'); // AI suggestion styling
    });

    it('updates suggestions when filters change', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <FilterChips
          {...defaultProps}
          showAISuggestions={true}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const citrusChip = screen.getByTestId('filter-chip-citrus');
      await user.click(citrusChip);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should call AI suggestions API with new context
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/search/suggestions'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('citrus'),
          })
        );
      });
    });
  });

  describe('Performance Requirements', () => {
    it('meets <100ms response time target for filter updates', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const startTime = performance.now();
      
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const citrusChip = screen.getByTestId('filter-chip-citrus');
      await user.click(citrusChip);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(100);
    });

    it('tracks and reports performance metrics', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
          onPerformanceMetric={vi.fn()}
        />
      );

      const citrusChip = screen.getByTestId('filter-chip-citrus');
      await user.click(citrusChip);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockOnCountUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            processingTime: expect.any(Number),
            performanceTarget: 100,
            targetMet: expect.any(Boolean),
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const container = screen.getByRole('group', { name: /filter chips/i });
      expect(container).toBeInTheDocument();

      const chips = screen.getAllByRole('button');
      chips.forEach(chip => {
        expect(chip).toHaveAttribute('aria-pressed');
      });
    });

    it('announces filter state changes to screen readers', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const citrusChip = screen.getByTestId('filter-chip-citrus');
      await user.click(citrusChip);

      expect(citrusChip).toHaveAttribute('aria-pressed', 'true');
      
      const announcement = screen.getByTestId('filter-announcements');
      expect(announcement).toHaveTextContent(/citrus filter applied/i);
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const firstChip = screen.getByTestId('filter-chip-citrus');
      firstChip.focus();

      await user.keyboard('{Tab}');
      expect(screen.getByTestId('filter-chip-woody')).toHaveFocus();

      await user.keyboard('{Space}');
      expect(mockOnFilterChange).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles API failures gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));
      
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const citrusChip = screen.getByTestId('filter-chip-citrus');
      await user.click(citrusChip);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockOnCountUpdate).toHaveBeenLastCalledWith(
          expect.objectContaining({
            error: 'Failed to update counts',
            fallbackCount: expect.any(Number),
          })
        );
      });
    });

    it('shows error state without breaking the component', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));
      
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const citrusChip = screen.getByTestId('filter-chip-citrus');
      await user.click(citrusChip);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Component should still be functional
      await waitFor(() => {
        expect(citrusChip).toBeInTheDocument();
        expect(citrusChip).toHaveClass('ring-2'); // Still shows active state
      });
    });
  });

  describe('Integration with Search Query', () => {
    it('updates filter suggestions based on search query context', async () => {
      const { rerender } = render(
        <FilterChips
          {...defaultProps}
          searchQuery=""
          showAISuggestions={true}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      // Change search query
      rerender(
        <FilterChips
          {...defaultProps}
          searchQuery="aventus"
          showAISuggestions={true}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/search/suggestions'),
          expect.objectContaining({
            body: expect.stringContaining('aventus'),
          })
        );
      });
    });
  });
});