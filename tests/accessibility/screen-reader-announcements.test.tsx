import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { ScreenReaderAnnouncements, useScreenReaderAnnouncement } from '@/components/accessibility/screen-reader-announcements';
import { useRouter } from 'next/navigation';

expect.extend(toHaveNoViolations);

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => '/'),
}));

const TestComponent = () => {
  const announceToScreenReader = useScreenReaderAnnouncement();
  
  return (
    <div>
      <button onClick={() => announceToScreenReader('Test announcement', 'polite')}>
        Make polite announcement
      </button>
      <button onClick={() => announceToScreenReader('Urgent announcement', 'assertive')}>
        Make assertive announcement
      </button>
    </div>
  );
};

describe('ScreenReaderAnnouncements', () => {
  beforeEach(() => {
    // Clear ARIA live regions before each test
    document.querySelectorAll('[aria-live]').forEach(el => el.remove());
  });

  it('should render live regions with proper ARIA attributes', () => {
    render(<ScreenReaderAnnouncements />);
    
    const politeRegion = screen.getByRole('status');
    const assertiveRegion = screen.getByRole('alert');
    
    expect(politeRegion).toHaveAttribute('aria-live', 'polite');
    expect(politeRegion).toHaveAttribute('aria-atomic', 'true');
    expect(politeRegion).toHaveClass('sr-only');
    
    expect(assertiveRegion).toHaveAttribute('aria-live', 'assertive');
    expect(assertiveRegion).toHaveAttribute('aria-atomic', 'true');
    expect(assertiveRegion).toHaveClass('sr-only');
  });

  it('should be accessible with screen readers', async () => {
    const { container } = render(<ScreenReaderAnnouncements />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should announce polite messages', async () => {
    render(
      <>
        <ScreenReaderAnnouncements />
        <TestComponent />
      </>
    );
    
    const politeButton = screen.getByText('Make polite announcement');
    const politeRegion = screen.getByRole('status');
    
    await userEvent.click(politeButton);
    
    await waitFor(() => {
      expect(politeRegion).toHaveTextContent('Test announcement');
    });
  });

  it('should announce assertive messages', async () => {
    render(
      <>
        <ScreenReaderAnnouncements />
        <TestComponent />
      </>
    );
    
    const assertiveButton = screen.getByText('Make assertive announcement');
    const assertiveRegion = screen.getByRole('alert');
    
    await userEvent.click(assertiveButton);
    
    await waitFor(() => {
      expect(assertiveRegion).toHaveTextContent('Urgent announcement');
    });
  });

  it('should clear messages after announcement', async () => {
    render(
      <>
        <ScreenReaderAnnouncements />
        <TestComponent />
      </>
    );
    
    const politeButton = screen.getByText('Make polite announcement');
    const politeRegion = screen.getByRole('status');
    
    await userEvent.click(politeButton);
    
    await waitFor(() => {
      expect(politeRegion).toHaveTextContent('Test announcement');
    });
    
    // Message should be cleared after a short delay
    await waitFor(() => {
      expect(politeRegion).toHaveTextContent('');
    }, { timeout: 2000 });
  });

  it('should announce route changes', async () => {
    const mockPush = vi.fn();
    (useRouter as any).mockReturnValue({ push: mockPush });
    
    render(<ScreenReaderAnnouncements />);
    
    const politeRegion = screen.getByRole('status');
    
    // Simulate route change
    window.dispatchEvent(new PopStateEvent('popstate'));
    
    await waitFor(() => {
      expect(politeRegion).toHaveTextContent(/Page loaded/i);
    });
  });

  it('should handle multiple rapid announcements', async () => {
    render(
      <>
        <ScreenReaderAnnouncements />
        <TestComponent />
      </>
    );
    
    const politeButton = screen.getByText('Make polite announcement');
    const politeRegion = screen.getByRole('status');
    
    // Make multiple rapid announcements
    await userEvent.click(politeButton);
    await userEvent.click(politeButton);
    await userEvent.click(politeButton);
    
    // Should handle the last announcement
    await waitFor(() => {
      expect(politeRegion).toHaveTextContent('Test announcement');
    });
  });

  it('should provide proper context for screen readers', () => {
    render(<ScreenReaderAnnouncements />);
    
    const politeRegion = screen.getByRole('status');
    const assertiveRegion = screen.getByRole('alert');
    
    expect(politeRegion).toHaveAccessibleName('Live announcements');
    expect(assertiveRegion).toHaveAccessibleName('Important announcements');
  });

  it('should be positioned correctly in DOM', () => {
    const { container } = render(<ScreenReaderAnnouncements />);
    
    const liveRegions = container.querySelectorAll('[aria-live]');
    
    expect(liveRegions).toHaveLength(2);
    
    // Live regions should be early in DOM for proper screen reader detection
    liveRegions.forEach(region => {
      expect(region.parentElement).toBe(container.firstChild);
    });
  });
});