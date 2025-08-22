/**
 * Test suite for EmptyState component
 * Tests standardized empty state UI patterns across all scenarios
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmptyState } from '@/components/ui/empty-state';
import { Search, AlertCircle, Package, Wifi, Heart } from 'lucide-react';

describe('EmptyState Component', () => {
  describe('Basic Rendering', () => {
    it('should render with required props', () => {
      render(
        <EmptyState
          title="No results found"
          description="Try adjusting your search terms"
          icon={Search}
        />
      );

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search terms')).toBeInTheDocument();
    });

    it('should render icon when provided', () => {
      render(
        <EmptyState
          title="Test Title"
          description="Test Description"
          icon={Search}
          data-testid="empty-state"
        />
      );

      const container = screen.getByTestId('empty-state');
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render without icon when not provided', () => {
      render(
        <EmptyState
          title="Test Title"
          description="Test Description"
          data-testid="empty-state"
        />
      );

      const container = screen.getByTestId('empty-state');
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render primary action button', () => {
      const mockPrimaryAction = vi.fn();

      render(
        <EmptyState
          title="Test Title"
          description="Test Description"
          icon={Search}
          primaryAction={{
            label: "Try Again",
            onClick: mockPrimaryAction
          }}
        />
      );

      const primaryButton = screen.getByRole('button', { name: 'Try Again' });
      expect(primaryButton).toBeInTheDocument();
      
      fireEvent.click(primaryButton);
      expect(mockPrimaryAction).toHaveBeenCalledTimes(1);
    });

    it('should render secondary action button', () => {
      const mockSecondaryAction = vi.fn();

      render(
        <EmptyState
          title="Test Title"
          description="Test Description"
          icon={Search}
          secondaryAction={{
            label: "Go Back",
            onClick: mockSecondaryAction,
            variant: "outline"
          }}
        />
      );

      const secondaryButton = screen.getByRole('button', { name: 'Go Back' });
      expect(secondaryButton).toBeInTheDocument();
      expect(secondaryButton).toHaveClass('variant-outline');
      
      fireEvent.click(secondaryButton);
      expect(mockSecondaryAction).toHaveBeenCalledTimes(1);
    });

    it('should render both primary and secondary actions', () => {
      const mockPrimary = vi.fn();
      const mockSecondary = vi.fn();

      render(
        <EmptyState
          title="Test Title"
          description="Test Description"
          icon={Search}
          primaryAction={{
            label: "Primary",
            onClick: mockPrimary
          }}
          secondaryAction={{
            label: "Secondary", 
            onClick: mockSecondary,
            variant: "outline"
          }}
        />
      );

      expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Secondary' })).toBeInTheDocument();
    });

    it('should render without action buttons when not provided', () => {
      render(
        <EmptyState
          title="Test Title"
          description="Test Description"
          icon={Search}
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <EmptyState
          title="No results found"
          description="Try different search terms"
          icon={Search}
          data-testid="empty-state"
        />
      );

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveAttribute('role', 'status');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible heading structure', () => {
      render(
        <EmptyState
          title="No results found"
          description="Try different search terms"
          icon={Search}
        />
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('No results found');
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive classes', () => {
      render(
        <EmptyState
          title="Test Title"
          description="Test Description"
          icon={Search}
          data-testid="empty-state"
        />
      );

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveClass('text-center', 'py-12');
    });

    it('should have responsive icon sizing', () => {
      render(
        <EmptyState
          title="Test Title"
          description="Test Description"
          icon={Search}
          data-testid="empty-state"
        />
      );

      const icon = screen.getByTestId('empty-state').querySelector('svg');
      expect(icon).toHaveClass('h-12', 'w-12', 'text-muted-foreground', 'mx-auto', 'mb-4');
    });
  });

  describe('Empty State Scenarios', () => {
    it('should render no search results state', () => {
      render(
        <EmptyState
          title="No fragrances found"
          description="Try different search terms or browse our collection."
          icon={Package}
          primaryAction={{
            label: "Clear search",
            onClick: vi.fn()
          }}
        />
      );

      expect(screen.getByText('No fragrances found')).toBeInTheDocument();
      expect(screen.getByText('Try different search terms or browse our collection.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
    });

    it('should render network error state', () => {
      render(
        <EmptyState
          title="Connection error"
          description="Please check your internet connection and try again."
          icon={Wifi}
          primaryAction={{
            label: "Try again",
            onClick: vi.fn()
          }}
        />
      );

      expect(screen.getByText('Connection error')).toBeInTheDocument();
      expect(screen.getByText('Please check your internet connection and try again.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });

    it('should render loading error state', () => {
      render(
        <EmptyState
          title="Something went wrong"
          description="We're having trouble loading fragrances right now. Please try again."
          icon={AlertCircle}
          primaryAction={{
            label: "Try again",
            onClick: vi.fn()
          }}
        />
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText("We're having trouble loading fragrances right now. Please try again.")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });

    it('should render empty collection state', () => {
      render(
        <EmptyState
          title="Your collection is empty"
          description="Start adding fragrances to build your personal collection."
          icon={Heart}
          primaryAction={{
            label: "Browse fragrances",
            onClick: vi.fn()
          }}
        />
      );

      expect(screen.getByText('Your collection is empty')).toBeInTheDocument();
      expect(screen.getByText('Start adding fragrances to build your personal collection.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Browse fragrances' })).toBeInTheDocument();
    });

    it('should render initial browse state', () => {
      render(
        <EmptyState
          title="Start your fragrance discovery"
          description="Search for fragrances by name, brand, or scent notes to get started."
          icon={Search}
        />
      );

      expect(screen.getByText('Start your fragrance discovery')).toBeInTheDocument();
      expect(screen.getByText('Search for fragrances by name, brand, or scent notes to get started.')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      render(
        <EmptyState
          title="Test Title"
          description="Test Description"
          icon={Search}
          className="custom-class"
          data-testid="empty-state"
        />
      );

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveClass('custom-class');
    });

    it('should merge custom classes with default classes', () => {
      render(
        <EmptyState
          title="Test Title"
          description="Test Description"
          icon={Search}
          className="custom-padding"
          data-testid="empty-state"
        />
      );

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveClass('custom-padding', 'text-center', 'py-12');
    });
  });
});