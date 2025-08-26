import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CollectionSkeleton } from '@/components/ui/skeletons/collection-skeleton';

describe('CollectionSkeleton', () => {
  it('renders stats cards skeleton', () => {
    render(<CollectionSkeleton />);
    
    // Should have 4 stats cards
    const statsCards = document.querySelectorAll('[data-testid="skeleton-stats-card"]');
    expect(statsCards).toHaveLength(4);
    
    // Each card should have icon and text skeletons
    statsCards.forEach(card => {
      expect(card.querySelector('[data-testid="skeleton-icon"]')).toBeInTheDocument();
      expect(card.querySelector('[data-testid="skeleton-stat-value"]')).toBeInTheDocument();
      expect(card.querySelector('[data-testid="skeleton-stat-label"]')).toBeInTheDocument();
    });
  });

  it('renders search and filters section', () => {
    render(<CollectionSkeleton />);
    
    // Search bar skeleton
    const searchBar = document.querySelector('[data-testid="skeleton-search"]');
    expect(searchBar).toBeInTheDocument();
    expect(searchBar).toHaveClass('h-10');
    
    // Filter buttons skeleton
    const filterButtons = document.querySelectorAll('[data-testid="skeleton-filter"]');
    expect(filterButtons.length).toBeGreaterThanOrEqual(5);
  });

  it('renders collection grid with proper staggering', () => {
    render(<CollectionSkeleton />);
    
    const gridItems = document.querySelectorAll('[data-testid="skeleton-collection-item"]');
    expect(gridItems).toHaveLength(6);
    
    // Should have staggered animation delays in DOM
    gridItems.forEach((item, index) => {
      const actualDelay = item.style.animationDelay;
      // Handle the first item having 0.15s delay (since index starts at 1)
      const expectedDelay = `${(index + 1) * 0.15}s`;
      expect(actualDelay).toBe(expectedDelay);
    });
  });

  it('includes sidebar skeleton sections', () => {
    render(<CollectionSkeleton />);
    
    // Quick actions section
    const quickActions = document.querySelector('[data-testid="skeleton-quick-actions"]');
    expect(quickActions).toBeInTheDocument();
    
    // Progress section  
    const progress = document.querySelector('[data-testid="skeleton-progress"]');
    expect(progress).toBeInTheDocument();
    
    // Recent activity section
    const recentActivity = document.querySelector('[data-testid="skeleton-recent-activity"]');
    expect(recentActivity).toBeInTheDocument();
  });

  it('matches collection dashboard layout', () => {
    render(<CollectionSkeleton />);
    
    // Main content should be 8 columns on large screens
    const mainContent = document.querySelector('.lg\\:col-span-8');
    expect(mainContent).toBeInTheDocument();
    
    // Sidebar should be 4 columns on large screens
    const sidebar = document.querySelector('.lg\\:col-span-4');
    expect(sidebar).toBeInTheDocument();
  });

  it('applies responsive grid classes', () => {
    render(<CollectionSkeleton />);
    
    // Stats should be responsive
    const statsGrid = document.querySelector('.md\\:grid-cols-2.lg\\:grid-cols-4');
    expect(statsGrid).toBeInTheDocument();
    
    // Collection grid should be responsive
    const collectionGrid = document.querySelector('.md\\:grid-cols-2.lg\\:grid-cols-3');
    expect(collectionGrid).toBeInTheDocument();
  });

  it('uses proper skeleton colors and animation', () => {
    render(<CollectionSkeleton />);
    
    // Check actual skeleton elements (not cards)
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
    
    skeletonElements.forEach(skeleton => {
      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton).toHaveClass('bg-muted');
    });
  });

  it('includes collection item structure matching real cards', () => {
    render(<CollectionSkeleton />);
    
    const collectionItems = document.querySelectorAll('[data-testid="skeleton-collection-item"]');
    collectionItems.forEach(item => {
      // Should have image skeleton
      expect(item.querySelector('[data-testid="skeleton-image"]')).toBeInTheDocument();
      
      // Should have content with title, brand, tags
      expect(item.querySelector('[data-testid="skeleton-title"]')).toBeInTheDocument();
      expect(item.querySelector('[data-testid="skeleton-brand"]')).toBeInTheDocument();
      
      // Should have rating skeleton
      const ratingStars = item.querySelectorAll('[data-testid="skeleton-star"]');
      expect(ratingStars).toHaveLength(5);
      
      // Should have action buttons
      expect(item.querySelector('[data-testid="skeleton-actions"]')).toBeInTheDocument();
    });
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-collection-skeleton';
    render(<CollectionSkeleton className={customClass} />);
    
    const container = document.querySelector(`.${customClass}`);
    expect(container).toBeInTheDocument();
  });

  it('uses proper accessibility attributes', () => {
    render(<CollectionSkeleton />);
    
    const container = document.querySelector('[role="status"]');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('aria-label', 'Loading collection dashboard');
  });
});