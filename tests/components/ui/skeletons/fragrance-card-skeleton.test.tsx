import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FragranceCardSkeleton, FragranceGridSkeleton } from '@/components/ui/skeletons/fragrance-card-skeleton';

describe('FragranceCardSkeleton', () => {
  it('renders default variant with complete structure', () => {
    render(<FragranceCardSkeleton />);
    
    // Should have image skeleton
    const image = document.querySelector('[data-testid="skeleton-image"]');
    expect(image).toBeInTheDocument();
    
    // Image container should be square aspect ratio
    const imageContainer = document.querySelector('.aspect-square');
    expect(imageContainer).toBeInTheDocument();
    
    // Should have brand and fragrance name
    const brand = document.querySelector('[data-testid="skeleton-brand"]');
    const name = document.querySelector('[data-testid="skeleton-name"]');
    expect(brand).toBeInTheDocument();
    expect(name).toBeInTheDocument();
    
    // Should have action buttons by default
    const actions = document.querySelector('[data-testid="skeleton-actions"]');
    expect(actions).toBeInTheDocument();
  });

  it('renders compact variant with minimal structure', () => {
    render(<FragranceCardSkeleton variant="compact" />);
    
    // Should have basic structure
    const image = document.querySelector('[data-testid="skeleton-image"]');
    const brand = document.querySelector('[data-testid="skeleton-brand"]');
    const name = document.querySelector('[data-testid="skeleton-name"]');
    
    expect(image).toBeInTheDocument();
    expect(brand).toBeInTheDocument();
    expect(name).toBeInTheDocument();
    
    // Should not have price info in compact
    const price = document.querySelector('[data-testid="skeleton-price"]');
    expect(price).not.toBeInTheDocument();
  });

  it('renders detailed variant with additional elements', () => {
    render(<FragranceCardSkeleton variant="detailed" />);
    
    // Should have all basic elements
    const image = document.querySelector('[data-testid="skeleton-image"]');
    const brand = document.querySelector('[data-testid="skeleton-brand"]');
    const name = document.querySelector('[data-testid="skeleton-name"]');
    
    expect(image).toBeInTheDocument();
    expect(brand).toBeInTheDocument();
    expect(name).toBeInTheDocument();
    
    // Should have additional details
    const scentFamily = document.querySelector('[data-testid="skeleton-scent-family"]');
    expect(scentFamily).toBeInTheDocument();
    
    // Should have rating stars
    const stars = document.querySelectorAll('[data-testid="skeleton-star"]');
    expect(stars).toHaveLength(5);
  });

  it('shows/hides actions based on showActions prop', () => {
    // With actions
    const { rerender } = render(<FragranceCardSkeleton showActions={true} />);
    let actions = document.querySelector('[data-testid="skeleton-actions"]');
    expect(actions).toBeInTheDocument();
    
    // Without actions
    rerender(<FragranceCardSkeleton showActions={false} />);
    actions = document.querySelector('[data-testid="skeleton-actions"]');
    expect(actions).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-card-skeleton';
    render(<FragranceCardSkeleton className={customClass} />);
    
    const card = document.querySelector(`.${customClass}`);
    expect(card).toBeInTheDocument();
  });

  it('uses proper skeleton styling', () => {
    render(<FragranceCardSkeleton />);
    
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
    
    skeletons.forEach(skeleton => {
      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton).toHaveClass('bg-muted');
    });
  });

  it('matches real fragrance card dimensions', () => {
    render(<FragranceCardSkeleton />);
    
    // Image container should be square with proper aspect ratio
    const imageContainer = document.querySelector('.aspect-square');
    expect(imageContainer).toBeInTheDocument();
    
    // Card should have proper padding
    const card = document.querySelector('[data-testid="skeleton-card"]');
    expect(card).toHaveClass('overflow-hidden');
    
    // Content should be properly spaced
    const content = document.querySelector('[data-testid="skeleton-content"]');
    expect(content).toHaveClass('p-4');
  });

  it('includes proper accessibility attributes', () => {
    render(<FragranceCardSkeleton />);
    
    const card = document.querySelector('[data-testid="skeleton-card"]');
    expect(card).toHaveAttribute('role', 'status');
    expect(card).toHaveAttribute('aria-label');
  });
});

describe('FragranceGridSkeleton', () => {
  it('renders specified count of cards', () => {
    render(<FragranceGridSkeleton count={12} />);
    
    const cards = document.querySelectorAll('[data-testid="skeleton-card"]');
    expect(cards).toHaveLength(12);
  });

  it('applies staggered animation delays', () => {
    render(<FragranceGridSkeleton count={4} />);
    
    const cards = document.querySelectorAll('[data-testid="skeleton-card"]');
    cards.forEach((card, index) => {
      const style = window.getComputedStyle(card);
      const expectedDelay = `${index * 0.1}s`;
      expect(style.animationDelay).toBe(expectedDelay);
    });
  });

  it('uses responsive grid layout', () => {
    render(<FragranceGridSkeleton />);
    
    const grid = document.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('sm:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
    expect(grid).toHaveClass('xl:grid-cols-4');
  });

  it('passes variant to individual cards', () => {
    render(<FragranceGridSkeleton variant="detailed" count={2} />);
    
    const stars = document.querySelectorAll('[data-testid="skeleton-star"]');
    expect(stars.length).toBeGreaterThan(0); // Should have rating stars for detailed variant
  });

  it('applies custom className to grid', () => {
    const customClass = 'custom-grid-skeleton';
    render(<FragranceGridSkeleton className={customClass} />);
    
    const grid = document.querySelector(`.${customClass}`);
    expect(grid).toBeInTheDocument();
  });

  it('maintains layout stability during loading', () => {
    render(<FragranceGridSkeleton />);
    
    // Grid should maintain proper gaps
    const grid = document.querySelector('.grid');
    expect(grid).toHaveClass('gap-6');
    
    // Cards should maintain aspect ratios
    const imageContainers = document.querySelectorAll('.aspect-square');
    expect(imageContainers.length).toBeGreaterThan(0);
  });
});