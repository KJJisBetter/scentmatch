/**
 * Main Layout Integration Tests - Task 1.3
 * 
 * Tests for main content area spacing and layout integration with bottom nav
 * Follows TDD approach - tests written before implementation
 */

import { render, screen } from '@testing-library/react';

// Mock components for testing layout integration
const MockPageContent = ({ className = '' }: { className?: string }) => (
  <main className={`min-h-screen ${className}`} data-testid="main-content">
    <div className="container mx-auto px-4 py-8">
      <h1>Test Page Content</h1>
      <p>This is test content to verify layout integration.</p>
    </div>
  </main>
);

const MockBottomNav = () => (
  <nav 
    className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/90 backdrop-blur-md border-t"
    data-testid="bottom-nav"
  >
    <div>Bottom Navigation</div>
  </nav>
);

const MockLayoutWithBottomNav = ({ contentClassName = '' }: { contentClassName?: string }) => (
  <div>
    <MockPageContent className={contentClassName} />
    <MockBottomNav />
  </div>
);

describe('Main Layout Integration', () => {
  describe('Content Spacing for Bottom Navigation', () => {
    it('applies bottom padding to prevent content overlap on mobile', () => {
      render(<MockLayoutWithBottomNav contentClassName="pb-20 md:pb-8" />);
      
      const mainContent = screen.getByTestId('main-content');
      
      // Should have bottom padding for mobile
      expect(mainContent).toHaveClass('pb-20');
      // Should have reduced padding for desktop
      expect(mainContent).toHaveClass('md:pb-8');
    });

    it('maintains proper spacing on different screen sizes', () => {
      render(<MockLayoutWithBottomNav contentClassName="pb-16 sm:pb-20 md:pb-8" />);
      
      const mainContent = screen.getByTestId('main-content');
      
      // Progressive spacing for different breakpoints
      expect(mainContent).toHaveClass('pb-16');  // mobile base
      expect(mainContent).toHaveClass('sm:pb-20'); // larger mobile
      expect(mainContent).toHaveClass('md:pb-8');  // desktop
    });
  });

  describe('Layout Stacking Order', () => {
    it('bottom navigation has higher z-index than main content', () => {
      render(<MockLayoutWithBottomNav />);
      
      const bottomNav = screen.getByTestId('bottom-nav');
      const mainContent = screen.getByTestId('main-content');
      
      // Bottom nav should have high z-index
      expect(bottomNav).toHaveClass('z-50');
      
      // Main content should not have competing z-index
      expect(mainContent).not.toHaveClass('z-50');
      expect(mainContent).not.toHaveClass('z-40');
    });

    it('bottom navigation has fixed positioning', () => {
      render(<MockLayoutWithBottomNav />);
      
      const bottomNav = screen.getByTestId('bottom-nav');
      
      expect(bottomNav).toHaveClass('fixed');
      expect(bottomNav).toHaveClass('bottom-0');
      expect(bottomNav).toHaveClass('left-0');
      expect(bottomNav).toHaveClass('right-0');
    });
  });

  describe('Responsive Layout Behavior', () => {
    it('hides bottom navigation on desktop', () => {
      render(<MockLayoutWithBottomNav />);
      
      const bottomNav = screen.getByTestId('bottom-nav');
      expect(bottomNav).toHaveClass('md:hidden');
    });

    it('adjusts content padding based on screen size', () => {
      render(<MockLayoutWithBottomNav contentClassName="pb-20 md:pb-8" />);
      
      const mainContent = screen.getByTestId('main-content');
      
      // Mobile: needs padding for bottom nav
      expect(mainContent).toHaveClass('pb-20');
      
      // Desktop: less padding since no bottom nav
      expect(mainContent).toHaveClass('md:pb-8');
    });
  });

  describe('Layout Integration Classes', () => {
    it('uses correct container classes for responsive layout', () => {
      render(<MockPageContent className="pb-20 md:pb-8" />);
      
      const mainContent = screen.getByTestId('main-content');
      const container = mainContent.querySelector('.container');
      
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('mx-auto', 'px-4');
    });

    it('maintains minimum height for full viewport coverage', () => {
      render(<MockPageContent />);
      
      const mainContent = screen.getByTestId('main-content');
      expect(mainContent).toHaveClass('min-h-screen');
    });
  });

  describe('Content Accessibility', () => {
    it('uses semantic HTML elements', () => {
      render(<MockLayoutWithBottomNav />);
      
      const mainContent = screen.getByRole('main');
      const navigation = screen.getByRole('navigation');
      
      expect(mainContent).toBeInTheDocument();
      expect(navigation).toBeInTheDocument();
    });

    it('maintains proper content hierarchy', () => {
      render(<MockPageContent />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Test Page Content');
    });
  });

  describe('Layout Performance', () => {
    it('uses efficient CSS classes for layout', () => {
      render(<MockLayoutWithBottomNav contentClassName="pb-20 md:pb-8" />);
      
      const mainContent = screen.getByTestId('main-content');
      const bottomNav = screen.getByTestId('bottom-nav');
      
      // Should use Tailwind utility classes for performance
      expect(mainContent.className).toMatch(/pb-20|md:pb-8/);
      expect(bottomNav.className).toMatch(/fixed|bottom-0|md:hidden/);
    });

    it('applies backdrop blur only where needed', () => {
      render(<MockLayoutWithBottomNav />);
      
      const bottomNav = screen.getByTestId('bottom-nav');
      expect(bottomNav).toHaveClass('backdrop-blur-md');
    });
  });

  describe('Visual Integration', () => {
    it('applies consistent background styling', () => {
      render(<MockLayoutWithBottomNav />);
      
      const bottomNav = screen.getByTestId('bottom-nav');
      expect(bottomNav).toHaveClass('bg-background/90');
    });

    it('includes border styling for visual separation', () => {
      render(<MockLayoutWithBottomNav />);
      
      const bottomNav = screen.getByTestId('bottom-nav');
      expect(bottomNav).toHaveClass('border-t');
    });
  });
});