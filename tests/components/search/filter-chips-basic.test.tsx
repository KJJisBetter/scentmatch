/**
 * Filter Chips Basic Component Tests
 * Simplified tests to verify core functionality without complex async operations
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FilterChips, FilterChipData, FilterChipsProps } from '@/components/search/filter-chips';

// Mock fetch for API calls
global.fetch = vi.fn();

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
];

const defaultProps: FilterChipsProps = {
  initialFilters: mockFilterData,
  onFilterChange: vi.fn(),
  onCountUpdate: vi.fn(),
  searchQuery: '',
  showAISuggestions: false, // Disable AI suggestions for basic tests
  debounceMs: 300,
  performanceTarget: 100,
};

describe('FilterChips Basic Component', () => {
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
      // For active removable filters, the ring-2 class is on the parent div
      expect(creedChip.closest('div')).toHaveClass('ring-2');
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
    });
  });

  describe('Mobile Touch Targets', () => {
    it('ensures minimum height for mobile touch targets', () => {
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      // Check main filter chip containers have minimum height
      const citrusChip = screen.getByTestId('filter-chip-citrus');
      const woodyChip = screen.getByTestId('filter-chip-woody');
      const creedChip = screen.getByTestId('filter-chip-creed');
      
      // For inactive filters, the min-h-[44px] is on the Button element
      expect(citrusChip).toHaveClass('min-h-[44px]');
      expect(woodyChip).toHaveClass('min-h-[44px]');
      
      // For active removable filters, the min-h-[44px] is on the parent div
      expect(creedChip.closest('div')).toHaveClass('min-h-[44px]');
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

  describe('Filter Selection', () => {
    it('calls onFilterChange when filter is clicked', async () => {
      const user = userEvent.setup();
      
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

    it('calls onFilterChange when remove button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const removeButton = screen.getByTestId('remove-filter-creed');
      await user.click(removeButton);

      // Wait for the async operation and animation to complete
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        id: 'creed',
        label: 'Creed',
        category: 'brand',
        count: 28,
        isActive: false,
        isRemovable: false,
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

      const citrusChip = screen.getByTestId('filter-chip-citrus');
      expect(citrusChip).toHaveAttribute('aria-pressed', 'false');
      
      const creedChip = screen.getByTestId('filter-chip-creed');
      expect(creedChip).toHaveAttribute('aria-pressed', 'true');
    });

    it('has screen reader announcements container', () => {
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const announcement = screen.getByTestId('filter-announcements');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveAttribute('aria-atomic', 'true');
    });

    it('announces filter state changes to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <FilterChips
          {...defaultProps}
          onFilterChange={mockOnFilterChange}
          onCountUpdate={mockOnCountUpdate}
        />
      );

      const citrusChip = screen.getByTestId('filter-chip-citrus');
      await user.click(citrusChip);

      const announcement = screen.getByTestId('filter-announcements');
      expect(announcement).toHaveTextContent(/citrus filter applied/i);
    });
  });

  describe('Performance Requirements', () => {
    it('calls onCountUpdate with optimistic data immediately', async () => {
      const user = userEvent.setup();
      
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
  });
});