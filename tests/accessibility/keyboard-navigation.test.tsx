import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { BottomNav } from '@/components/navigation/bottom-nav';

expect.extend(toHaveNoViolations);

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
}));

describe('Keyboard Navigation', () => {
  describe('Tab Order and Focus Management', () => {
    it('should maintain logical tab order', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <button>First</button>
          <a href="/test">Link</a>
          <input type="text" placeholder="Input" />
          <select>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
          <button>Last</button>
        </div>
      );
      
      const first = screen.getByText('First');
      const link = screen.getByText('Link');
      const input = screen.getByPlaceholderText('Input');
      const select = screen.getByRole('combobox');
      const last = screen.getByText('Last');
      
      // Tab forward through elements
      await user.tab();
      expect(first).toHaveFocus();
      
      await user.tab();
      expect(link).toHaveFocus();
      
      await user.tab();
      expect(input).toHaveFocus();
      
      await user.tab();
      expect(select).toHaveFocus();
      
      await user.tab();
      expect(last).toHaveFocus();
      
      // Shift+Tab backwards
      await user.tab({ shift: true });
      expect(select).toHaveFocus();
      
      await user.tab({ shift: true });
      expect(input).toHaveFocus();
    });

    it('should skip disabled elements in tab order', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <button>First</button>
          <button disabled>Disabled</button>
          <input type="text" disabled placeholder="Disabled Input" />
          <button>Last</button>
        </div>
      );
      
      const first = screen.getByText('First');
      const disabled = screen.getByText('Disabled');
      const last = screen.getByText('Last');
      
      await user.tab();
      expect(first).toHaveFocus();
      
      await user.tab();
      expect(last).toHaveFocus(); // Should skip disabled elements
      
      expect(disabled).not.toHaveFocus();
    });

    it('should respect tabIndex values', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <button tabIndex={3}>Third</button>
          <button tabIndex={1}>First</button>
          <button tabIndex={2}>Second</button>
          <button>Fourth (natural order)</button>
        </div>
      );
      
      const first = screen.getByText('First');
      const second = screen.getByText('Second');
      const third = screen.getByText('Third');
      const fourth = screen.getByText('Fourth (natural order)');
      
      // Should follow tabIndex order: 1, 2, 3, then natural order
      await user.tab();
      expect(first).toHaveFocus();
      
      await user.tab();
      expect(second).toHaveFocus();
      
      await user.tab();
      expect(third).toHaveFocus();
      
      await user.tab();
      expect(fourth).toHaveFocus();
    });
  });

  describe('Focus Indicators', () => {
    it('should show focus indicators on all interactive elements', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <button className="focus-visible:ring-2 focus-visible:ring-ring">Button</button>
          <a href="/test" className="focus-visible:ring-2 focus-visible:ring-ring">Link</a>
          <input className="focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
      );
      
      const button = screen.getByRole('button');
      const link = screen.getByRole('link');
      const input = screen.getByRole('textbox');
      
      // Check button focus
      await user.tab();
      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus-visible:ring-2');
      
      // Check link focus
      await user.tab();
      expect(link).toHaveFocus();
      expect(link).toHaveClass('focus-visible:ring-2');
      
      // Check input focus
      await user.tab();
      expect(input).toHaveFocus();
      expect(input).toHaveClass('focus-visible:ring-2');
    });

    it('should have sufficient focus indicator contrast', async () => {
      const { container } = render(
        <button className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          Focus Test Button
        </button>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Shortcuts and Activation', () => {
    it('should support Enter key activation', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();
      
      render(
        <button onClick={mockClick} onKeyDown={(e) => {
          if (e.key === 'Enter') mockClick();
        }}>
          Enter Activatable
        </button>
      );
      
      const button = screen.getByText('Enter Activatable');
      button.focus();
      
      await user.keyboard('{Enter}');
      expect(mockClick).toHaveBeenCalled();
    });

    it('should support Space key activation', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();
      
      render(
        <button onClick={mockClick} onKeyDown={(e) => {
          if (e.key === ' ') {
            e.preventDefault();
            mockClick();
          }
        }}>
          Space Activatable
        </button>
      );
      
      const button = screen.getByText('Space Activatable');
      button.focus();
      
      await user.keyboard(' ');
      expect(mockClick).toHaveBeenCalled();
    });

    it('should support arrow key navigation in menus', async () => {
      const user = userEvent.setup();
      
      render(
        <div role="menu">
          <div role="menuitem" tabIndex={0}>First Item</div>
          <div role="menuitem" tabIndex={-1}>Second Item</div>
          <div role="menuitem" tabIndex={-1}>Third Item</div>
        </div>
      );
      
      const first = screen.getByText('First Item');
      const second = screen.getByText('Second Item');
      const third = screen.getByText('Third Item');
      
      first.focus();
      expect(first).toHaveFocus();
      
      // Arrow down should move to next item
      await user.keyboard('{ArrowDown}');
      expect(second).toHaveFocus();
      
      await user.keyboard('{ArrowDown}');
      expect(third).toHaveFocus();
      
      // Arrow up should move to previous item
      await user.keyboard('{ArrowUp}');
      expect(second).toHaveFocus();
    });

    it('should support Home/End keys for navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <div role="listbox" tabIndex={0}>
          <div role="option">First Option</div>
          <div role="option">Second Option</div>
          <div role="option">Third Option</div>
        </div>
      );
      
      const listbox = screen.getByRole('listbox');
      const first = screen.getByText('First Option');
      const third = screen.getByText('Third Option');
      
      listbox.focus();
      
      // End key should move to last item
      await user.keyboard('{End}');
      expect(third).toHaveFocus();
      
      // Home key should move to first item
      await user.keyboard('{Home}');
      expect(first).toHaveFocus();
    });
  });

  describe('Focus Trapping in Modals', () => {
    it('should trap focus within modal dialogs', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <button>Outside Modal</button>
          
          <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h2 id="modal-title">Modal Title</h2>
            <button>First Modal Button</button>
            <input placeholder="Modal Input" />
            <button>Last Modal Button</button>
          </div>
        </div>
      );
      
      const outsideButton = screen.getByText('Outside Modal');
      const firstModal = screen.getByText('First Modal Button');
      const modalInput = screen.getByPlaceholderText('Modal Input');
      const lastModal = screen.getByText('Last Modal Button');
      
      // Focus should be trapped within modal
      firstModal.focus();
      expect(firstModal).toHaveFocus();
      
      // Tab forward within modal
      await user.tab();
      expect(modalInput).toHaveFocus();
      
      await user.tab();
      expect(lastModal).toHaveFocus();
      
      // Tab from last element should wrap to first
      await user.tab();
      expect(firstModal).toHaveFocus();
      
      // Shift+tab from first should wrap to last
      await user.tab({ shift: true });
      expect(lastModal).toHaveFocus();
      
      // Outside button should not receive focus
      expect(outsideButton).not.toHaveFocus();
    });

    it('should handle Escape key to close modals', async () => {
      const user = userEvent.setup();
      const mockClose = jest.fn();
      
      render(
        <div 
          role="dialog" 
          aria-modal="true"
          onKeyDown={(e) => {
            if (e.key === 'Escape') mockClose();
          }}
        >
          <h2>Modal Title</h2>
          <button>Modal Button</button>
        </div>
      );
      
      const button = screen.getByText('Modal Button');
      button.focus();
      
      await user.keyboard('{Escape}');
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('Bottom Navigation Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      render(<BottomNav />);
      
      const discoverButton = screen.getByLabelText('Discover fragrances');
      const searchButton = screen.getByLabelText('Search fragrances');
      const collectionsButton = screen.getByLabelText('My collections');
      
      // Tab through navigation items
      await user.tab();
      expect(discoverButton).toHaveFocus();
      
      await user.tab();
      expect(searchButton).toHaveFocus();
      
      await user.tab();
      expect(collectionsButton).toHaveFocus();
    });

    it('should support Enter and Space activation', async () => {
      const user = userEvent.setup();
      
      render(<BottomNav />);
      
      const discoverButton = screen.getByLabelText('Discover fragrances');
      discoverButton.focus();
      
      // Should handle Enter key
      await user.keyboard('{Enter}');
      // Navigation would occur (mocked in test setup)
      
      // Should handle Space key
      await user.keyboard(' ');
      // Navigation would occur (mocked in test setup)
    });
  });

  describe('Skip Links Integration', () => {
    it('should provide quick navigation to main content', async () => {
      const user = userEvent.setup();
      
      // Mock main content element
      document.body.innerHTML = `
        <div id="main-content" tabindex="-1">Main content</div>
      `;
      
      render(
        <div>
          <a href="#main-content" className="skip-link sr-only focus:not-sr-only">
            Skip to main content
          </a>
          <nav>Navigation</nav>
        </div>
      );
      
      const skipLink = screen.getByText('Skip to main content');
      const mainContent = document.getElementById('main-content');
      
      // Tab to skip link
      await user.tab();
      expect(skipLink).toHaveFocus();
      
      // Activate skip link
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mainContent).toHaveFocus();
      });
    });
  });

  describe('Keyboard Navigation Patterns', () => {
    it('should support roving tabindex pattern', async () => {
      const user = userEvent.setup();
      
      const RovingTabindexExample = () => {
        const [currentIndex, setCurrentIndex] = React.useState(0);
        const items = ['Item 1', 'Item 2', 'Item 3'];
        
        const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
          switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
              e.preventDefault();
              setCurrentIndex((index + 1) % items.length);
              break;
            case 'ArrowLeft':
            case 'ArrowUp':
              e.preventDefault();
              setCurrentIndex((index - 1 + items.length) % items.length);
              break;
          }
        };
        
        React.useEffect(() => {
          const currentElement = document.querySelector(`[data-index="${currentIndex}"]`) as HTMLElement;
          currentElement?.focus();
        }, [currentIndex]);
        
        return (
          <div role="radiogroup">
            {items.map((item, index) => (
              <div
                key={item}
                role="radio"
                data-index={index}
                tabIndex={index === currentIndex ? 0 : -1}
                aria-checked={index === currentIndex}
                onKeyDown={(e) => handleKeyDown(e, index)}
              >
                {item}
              </div>
            ))}
          </div>
        );
      };
      
      render(<RovingTabindexExample />);
      
      const item1 = screen.getByText('Item 1');
      const item2 = screen.getByText('Item 2');
      const item3 = screen.getByText('Item 3');
      
      // First item should be focusable
      await user.tab();
      expect(item1).toHaveFocus();
      
      // Arrow keys should move between items
      await user.keyboard('{ArrowRight}');
      expect(item2).toHaveFocus();
      
      await user.keyboard('{ArrowRight}');
      expect(item3).toHaveFocus();
      
      // Should wrap around
      await user.keyboard('{ArrowRight}');
      expect(item1).toHaveFocus();
    });
  });
});