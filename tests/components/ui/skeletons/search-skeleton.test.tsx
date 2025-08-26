import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SearchSkeleton, SearchResultsLoadingSkeleton } from '@/components/ui/skeletons/search-skeleton';

describe('SearchSkeleton', () => {
  it('renders grid variant by default', () => {
    render(<SearchSkeleton />);
    
    // Should render grid layout with default count of 6
    const container = document.querySelector('.grid');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3');
    
    // Should have 6 skeleton cards by default
    const cards = document.querySelectorAll('[data-testid="skeleton-card"]');
    expect(cards).toHaveLength(6);
  });

  it('renders specified count of skeleton items', () => {
    render(<SearchSkeleton count={12} />);
    
    const cards = document.querySelectorAll('[data-testid="skeleton-card"]');
    expect(cards).toHaveLength(12);
  });

  it('applies staggered animation delays', () => {
    render(<SearchSkeleton count={3} />);
    
    const cards = document.querySelectorAll('[data-testid="skeleton-card"]');
    cards.forEach((card, index) => {
      const style = window.getComputedStyle(card);
      const expectedDelay = `${index * 0.1}s`;
      expect(style.animationDelay).toBe(expectedDelay);
    });
  });

  it('renders list variant with horizontal layout', () => {
    render(<SearchSkeleton variant="list" />);
    
    // Should not have grid classes
    const container = document.querySelector('.space-y-4');
    expect(container).toBeInTheDocument();
    
    // Cards should have flex layout for list view
    const cards = document.querySelectorAll('[data-testid="skeleton-card"]');
    cards.forEach(card => {
      expect(card.querySelector('.flex')).toBeInTheDocument();
    });
  });

  it('renders filters variant with filter structure', () => {
    render(<SearchSkeleton variant="filters" />);
    
    // Should have filter sections
    const filterSections = document.querySelectorAll('.space-y-3');
    expect(filterSections.length).toBeGreaterThan(2);
    
    // Should have checkboxes and labels
    const checkboxes = document.querySelectorAll('[data-testid="skeleton-checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('renders suggestions variant with dropdown structure', () => {
    render(<SearchSkeleton variant="suggestions" />);
    
    // Should have dropdown positioning
    const dropdown = document.querySelector('.absolute.top-full');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveClass('z-50', 'shadow-lg');
  });

  it('applies custom className', () => {
    const customClass = 'custom-skeleton-class';
    render(<SearchSkeleton className={customClass} />);
    
    const container = document.querySelector(`.${customClass}`);
    expect(container).toBeInTheDocument();
  });

  it('uses proper accessibility attributes', () => {
    render(<SearchSkeleton />);
    
    const cards = document.querySelectorAll('[data-testid="skeleton-card"]');
    cards.forEach(card => {
      expect(card).toHaveAttribute('role', 'status');
      expect(card).toHaveAttribute('aria-label');
    });
  });

  it('matches fragrance card dimensions', () => {
    render(<SearchSkeleton />);
    
    // Image containers should be square aspect ratio
    const imageContainers = document.querySelectorAll('.aspect-square');
    expect(imageContainers.length).toBeGreaterThan(0);
    
    // Content should match card structure
    const content = document.querySelectorAll('[data-testid="skeleton-content"]');
    content.forEach(contentEl => {
      expect(contentEl).toHaveClass('p-4');
    });
  });
});

describe('SearchResultsLoadingSkeleton', () => {
  it('renders complete search results structure', () => {
    render(<SearchResultsLoadingSkeleton />);
    
    // Should have header skeleton
    const header = document.querySelector('[data-testid="skeleton-header"]');
    expect(header).toBeInTheDocument();
    
    // Should have results grid
    const grid = document.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    
    // Should have pagination
    const pagination = document.querySelector('[data-testid="skeleton-pagination"]');
    expect(pagination).toBeInTheDocument();
  });

  it('includes proper loading states', () => {
    render(<SearchResultsLoadingSkeleton />);
    
    // Results count skeleton
    const resultCount = document.querySelector('[data-testid="skeleton-result-count"]');
    expect(resultCount).toBeInTheDocument();
    
    // Sort options skeleton
    const sortOptions = document.querySelector('[data-testid="skeleton-sort"]');
    expect(sortOptions).toBeInTheDocument();
  });
});