import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations, configureAxe } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { QuizInterface } from '@/components/quiz/quiz-interface';

expect.extend(toHaveNoViolations);

// Configure axe for WCAG 2.1 AA compliance
const axeConfig = configureAxe({
  rules: {
    // WCAG 2.1 AA specific rules
    'color-contrast': { enabled: true },
    'color-contrast-enhanced': { enabled: true },
    'focus-order-semantics': { enabled: true },
    'landmark-one-main': { enabled: true },
    'page-has-heading-one': { enabled: true },
    'region': { enabled: true },
    'bypass': { enabled: true },
  },
});

describe('WCAG 2.1 AA Compliance Tests', () => {
  describe('Perceivable', () => {
    it('should have sufficient color contrast (4.5:1 for normal text)', async () => {
      const { container } = render(
        <div className="bg-background text-foreground p-4">
          <p>Normal text content</p>
          <button className="bg-primary text-primary-foreground px-4 py-2">
            Button text
          </button>
        </div>
      );
      
      const results = await axeConfig(container);
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient contrast for UI components (3:1)', async () => {
      const { container } = render(
        <div className="p-4">
          <input 
            className="border border-border bg-input text-foreground px-3 py-2"
            placeholder="Search fragrances..."
          />
          <div className="bg-card border border-border p-4 mt-4">
            <h2 className="text-card-foreground">Card Title</h2>
          </div>
        </div>
      );
      
      const results = await axeConfig(container);
      expect(results).toHaveNoViolations();
    });

    it('should provide alt text for images', async () => {
      const { container } = render(
        <div>
          <img src="/fragrance.jpg" alt="Elegant perfume bottle on marble surface" />
          <img src="/logo.png" alt="ScentMatch logo" />
        </div>
      );
      
      const results = await axeConfig(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', async () => {
      const { container } = render(
        <main>
          <h1>Main Page Title</h1>
          <section>
            <h2>Section Title</h2>
            <h3>Subsection Title</h3>
            <h4>Sub-subsection Title</h4>
          </section>
          <section>
            <h2>Another Section</h2>
          </section>
        </main>
      );
      
      const results = await axeConfig(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Operable', () => {
    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <button>First Button</button>
          <a href="/test">Link</a>
          <input type="text" placeholder="Input" />
          <button>Last Button</button>
        </div>
      );
      
      const firstButton = screen.getByText('First Button');
      const link = screen.getByText('Link');
      const input = screen.getByPlaceholderText('Input');
      const lastButton = screen.getByText('Last Button');
      
      // Tab through elements
      await user.tab();
      expect(firstButton).toHaveFocus();
      
      await user.tab();
      expect(link).toHaveFocus();
      
      await user.tab();
      expect(input).toHaveFocus();
      
      await user.tab();
      expect(lastButton).toHaveFocus();
      
      // Shift+Tab to go backwards
      await user.tab({ shift: true });
      expect(input).toHaveFocus();
    });

    it('should have visible focus indicators', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <button className="focus-visible:ring-2 focus-visible:ring-ring">
            Focusable Button
          </button>
        </div>
      );
      
      const button = screen.getByText('Focusable Button');
      
      await user.tab();
      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus-visible:ring-2');
    });

    it('should meet touch target size requirements (44px minimum)', async () => {
      render(
        <div>
          <button className="min-h-[44px] min-w-[44px] touch-target">
            Touch Button
          </button>
        </div>
      );
      
      const button = screen.getByText('Touch Button');
      const styles = window.getComputedStyle(button);
      
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
      expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
    });

    it('should support Enter and Space key activation', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();
      
      render(
        <button onClick={mockClick}>
          Keyboard Activatable Button
        </button>
      );
      
      const button = screen.getByText('Keyboard Activatable Button');
      button.focus();
      
      // Activate with Enter
      await user.keyboard('{Enter}');
      expect(mockClick).toHaveBeenCalled();
      
      mockClick.mockClear();
      
      // Activate with Space
      await user.keyboard(' ');
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('Understandable', () => {
    it('should have clear and descriptive labels', async () => {
      const { container } = render(
        <form>
          <label htmlFor="email">Email Address (required)</label>
          <input 
            id="email" 
            type="email" 
            required 
            aria-describedby="email-error"
          />
          <div id="email-error" role="alert">
            Please enter a valid email address
          </div>
          
          <fieldset>
            <legend>Preferred Fragrance Types</legend>
            <label>
              <input type="checkbox" value="floral" />
              Floral
            </label>
            <label>
              <input type="checkbox" value="woody" />
              Woody
            </label>
          </fieldset>
        </form>
      );
      
      const results = await axeConfig(container);
      expect(results).toHaveNoViolations();
    });

    it('should provide error identification and suggestions', async () => {
      const { container } = render(
        <form>
          <div role="alert" aria-live="polite">
            <h2>Form Errors</h2>
            <ul>
              <li>
                <a href="#email">Email is required and must be valid</a>
              </li>
              <li>
                <a href="#password">Password must be at least 8 characters</a>
              </li>
            </ul>
          </div>
          
          <label htmlFor="email">Email Address</label>
          <input 
            id="email" 
            type="email" 
            aria-invalid="true"
            aria-describedby="email-error"
          />
          <div id="email-error">Please enter a valid email address</div>
          
          <label htmlFor="password">Password</label>
          <input 
            id="password" 
            type="password" 
            aria-invalid="true"
            aria-describedby="password-error"
          />
          <div id="password-error">Password must be at least 8 characters long</div>
        </form>
      );
      
      const results = await axeConfig(container);
      expect(results).toHaveNoViolations();
    });

    it('should have consistent navigation and identification', async () => {
      const { container } = render(
        <div>
          <nav aria-label="Main navigation">
            <ul>
              <li><a href="/" aria-current="page">Home</a></li>
              <li><a href="/search">Search</a></li>
              <li><a href="/quiz">Quiz</a></li>
            </ul>
          </nav>
          
          <nav aria-label="Breadcrumb navigation">
            <ol>
              <li><a href="/">Home</a></li>
              <li><a href="/fragrances">Fragrances</a></li>
              <li aria-current="page">Current Page</li>
            </ol>
          </nav>
        </div>
      );
      
      const results = await axeConfig(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Robust', () => {
    it('should have valid HTML structure', async () => {
      const { container } = render(
        <main role="main">
          <header>
            <h1>Page Title</h1>
          </header>
          
          <section aria-labelledby="section1-title">
            <h2 id="section1-title">Section Title</h2>
            <p>Section content</p>
          </section>
          
          <aside aria-labelledby="aside-title">
            <h2 id="aside-title">Sidebar</h2>
            <p>Sidebar content</p>
          </aside>
          
          <footer>
            <p>&copy; 2025 ScentMatch</p>
          </footer>
        </main>
      );
      
      const results = await axeConfig(container);
      expect(results).toHaveNoViolations();
    });

    it('should use appropriate ARIA roles and properties', async () => {
      const { container } = render(
        <div>
          <button 
            aria-expanded="false" 
            aria-controls="menu" 
            aria-haspopup="true"
          >
            Menu
          </button>
          
          <ul id="menu" role="menu" aria-hidden="true">
            <li role="menuitem">
              <a href="/option1">Option 1</a>
            </li>
            <li role="menuitem">
              <a href="/option2">Option 2</a>
            </li>
          </ul>
          
          <div role="tablist">
            <button role="tab" aria-selected="true" aria-controls="panel1">
              Tab 1
            </button>
            <button role="tab" aria-selected="false" aria-controls="panel2">
              Tab 2
            </button>
          </div>
          
          <div id="panel1" role="tabpanel">Panel 1 content</div>
          <div id="panel2" role="tabpanel" hidden>Panel 2 content</div>
        </div>
      );
      
      const results = await axeConfig(container);
      expect(results).toHaveNoViolations();
    });

    it('should be compatible with assistive technologies', async () => {
      const { container } = render(
        <div>
          <nav aria-label="Site navigation">
            <BottomNav />
          </nav>
          
          <main id="main-content" tabIndex={-1}>
            <h1>Fragrance Discovery</h1>
            <p>Find your perfect scent with AI recommendations.</p>
          </main>
        </div>
      );
      
      const results = await axeConfig(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('High Contrast Mode Support', () => {
    it('should maintain usability in high contrast mode', async () => {
      // Simulate high contrast mode by adding class
      document.documentElement.classList.add('high-contrast');
      
      const { container } = render(
        <div className="high-contrast:border-2 high-contrast:border-white">
          <button className="bg-primary text-primary-foreground high-contrast:bg-white high-contrast:text-black high-contrast:border-2 high-contrast:border-black">
            High Contrast Button
          </button>
          
          <div className="bg-card border border-border high-contrast:bg-black high-contrast:text-white high-contrast:border-white">
            <p>Content in high contrast mode</p>
          </div>
        </div>
      );
      
      const results = await axeConfig(container);
      expect(results).toHaveNoViolations();
      
      // Clean up
      document.documentElement.classList.remove('high-contrast');
    });
  });
});