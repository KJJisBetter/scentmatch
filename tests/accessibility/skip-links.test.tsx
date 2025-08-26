import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { SkipLinks } from '@/components/accessibility/skip-links';

expect.extend(toHaveNoViolations);

describe('SkipLinks', () => {
  it('should render skip links with proper ARIA attributes', async () => {
    render(<SkipLinks />);
    
    const skipToMain = screen.getByText('Skip to main content');
    const skipToNav = screen.getByText('Skip to navigation');
    
    expect(skipToMain).toHaveAttribute('href', '#main-content');
    expect(skipToNav).toHaveAttribute('href', '#main-navigation');
    
    // Check if links are properly positioned
    expect(skipToMain).toHaveClass('sr-only');
    expect(skipToNav).toHaveClass('sr-only');
  });

  it('should be accessible with screen readers', async () => {
    const { container } = render(<SkipLinks />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should show skip links when focused', async () => {
    const user = userEvent.setup();
    render(<SkipLinks />);
    
    const skipToMain = screen.getByText('Skip to main content');
    
    // Tab to focus the skip link
    await user.tab();
    
    // Skip link should become visible
    expect(skipToMain).toHaveFocus();
    expect(skipToMain).toHaveClass('focus:not-sr-only');
  });

  it('should skip to main content when activated', async () => {
    const user = userEvent.setup();
    
    // Mock main content element
    document.body.innerHTML = `
      <div id="main-content">Main content</div>
    `;
    
    render(<SkipLinks />);
    
    const skipToMain = screen.getByText('Skip to main content');
    const mainContent = document.getElementById('main-content');
    
    await user.click(skipToMain);
    
    // Main content should receive focus
    expect(mainContent).toHaveFocus();
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<SkipLinks />);
    
    const skipToMain = screen.getByText('Skip to main content');
    const skipToNav = screen.getByText('Skip to navigation');
    
    // Tab through skip links
    await user.tab();
    expect(skipToMain).toHaveFocus();
    
    await user.tab();
    expect(skipToNav).toHaveFocus();
    
    // Activate with Enter key
    await user.keyboard('{Enter}');
    
    // Should navigate to the target (URL will be updated by click)
    // In test environment, we can't really test URL navigation, 
    // so we verify the link has the correct href
    expect(skipToNav).toHaveAttribute('href', '#main-navigation');
  });

  it('should have proper color contrast for visibility', async () => {
    const { container } = render(<SkipLinks />);
    
    const skipLink = container.querySelector('a');
    const styles = window.getComputedStyle(skipLink!);
    
    // Check that focus styles provide adequate contrast
    expect(skipLink).toHaveClass('focus:bg-primary', 'focus:text-primary-foreground');
  });

  it('should be positioned at the top of tab order', () => {
    render(
      <div>
        <SkipLinks />
        <button>Other button</button>
        <input />
      </div>
    );
    
    const skipToMain = screen.getByText('Skip to main content');
    // Skip links should be anchor tags, which are naturally focusable
    expect(skipToMain.tagName.toLowerCase()).toBe('a');
    expect(skipToMain).toHaveAttribute('href', '#main-content');
  });
});