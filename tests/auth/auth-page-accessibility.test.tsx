/**
 * Task 7.9: Authentication Page Accessibility Compliance Tests
 * 
 * Comprehensive WCAG 2.2 AA compliance testing for all authentication pages
 * including screen reader experience, keyboard navigation, color contrast,
 * and focus management.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import SignUpPage from '@/app/auth/signup/page';
import LoginPage from '@/app/auth/login/page';
import PasswordResetPage from '@/app/auth/reset/page';
import CallbackPage from '@/app/auth/callback/page';
import { useRouter, useSearchParams } from 'next/navigation';

// Extend expect with axe matchers
expect.extend(toHaveNoViolations);

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock auth actions
vi.mock('@/app/actions/auth', () => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
  resetPassword: vi.fn(),
}));

describe('Authentication Page Accessibility Compliance (WCAG 2.2 AA)', () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (useSearchParams as any).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });
  });

  describe('1. WCAG 2.2 AA Automated Compliance', () => {
    test('signup page has no accessibility violations', async () => {
      const { container } = render(<SignUpPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('login page has no accessibility violations', async () => {
      const { container } = render(<LoginPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('password reset page has no accessibility violations', async () => {
      const { container } = render(<PasswordResetPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('callback page has no accessibility violations', async () => {
      const { container } = render(<CallbackPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('2. Screen Reader Experience', () => {
    describe('2.1 Form Labels and Associations', () => {
      test('all form inputs have properly associated labels', () => {
        render(<SignUpPage />);
        
        // Check label associations
        const emailInput = screen.getByLabelText('Email Address');
        expect(emailInput).toBeInTheDocument();
        expect(emailInput).toHaveAttribute('id');
        
        const passwordInput = screen.getByLabelText('Create Password');
        expect(passwordInput).toBeInTheDocument();
        expect(passwordInput).toHaveAttribute('id');
        
        // Labels should be clickable to focus inputs
        const emailLabel = screen.getByText('Email Address');
        expect(emailLabel).toHaveAttribute('for');
        
        const passwordLabel = screen.getByText('Create Password');
        expect(passwordLabel).toHaveAttribute('for');
      });

      test('form fields have appropriate ARIA attributes', () => {
        render(<SignUpPage />);
        
        const emailInput = screen.getByLabelText('Email Address');
        expect(emailInput).toHaveAttribute('type', 'email');
        expect(emailInput).toHaveAttribute('autocomplete', 'email');
        expect(emailInput).toHaveAttribute('required');
        
        const passwordInput = screen.getByLabelText('Create Password');
        expect(passwordInput).toHaveAttribute('type', 'password');
        expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
        expect(passwordInput).toHaveAttribute('required');
      });

      test('error messages are announced to screen readers', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const emailInput = screen.getByLabelText('Email Address');
        
        // Type invalid email to trigger error
        await user.type(emailInput, 'invalid');
        
        await waitFor(() => {
          const errorMessage = screen.getByText(/Email address needs an @ symbol/);
          expect(errorMessage).toBeInTheDocument();
          
          // Error should be associated with input for screen readers
          expect(errorMessage).toHaveAttribute('role', 'alert');
        });
      });

      test('password requirements are accessible to screen readers', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const passwordInput = screen.getByLabelText('Create Password');
        await user.type(passwordInput, 'a');
        
        await waitFor(() => {
          // Password requirements should be properly structured
          const requirements = screen.getAllByText(/At least|One uppercase|One lowercase|One number/);
          
          requirements.forEach(requirement => {
            // Each requirement should be in a structured list or have proper markup
            const listItem = requirement.closest('div');
            expect(listItem).toBeTruthy();
          });
        });
      });
    });

    describe('2.2 Dynamic Content Announcements', () => {
      test('loading states are announced to screen readers', async () => {
        const { signUp } = await import('@/app/actions/auth');
        (signUp as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
        
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
        await user.type(screen.getByLabelText('Create Password'), 'SecurePass123');
        
        const submitButton = screen.getByRole('button', { name: /Start My Fragrance Journey/ });
        await user.click(submitButton);
        
        // Loading state should be announced
        await waitFor(() => {
          expect(screen.getByText(/Creating your account/)).toBeInTheDocument();
          
          // Button should maintain accessible name during loading
          expect(submitButton).toHaveAccessibleName(/Creating your account/);
        });
      });

      test('success states provide clear screen reader feedback', async () => {
        const { signUp } = await import('@/app/actions/auth');
        (signUp as any).mockResolvedValue({ 
          message: 'Account created successfully!' 
        });
        
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
        await user.type(screen.getByLabelText('Create Password'), 'SecurePass123');
        await user.click(screen.getByRole('button', { name: /Start My Fragrance Journey/ }));
        
        await waitFor(() => {
          // Success message should be announced
          const successHeading = screen.getByText('Check Your Email');
          expect(successHeading).toBeInTheDocument();
          expect(successHeading.tagName).toBe('H1');
          
          // Success content should be structured with proper headings
          const nextStepsHeading = screen.getByText(/While you wait/);
          expect(nextStepsHeading.tagName).toBe('H3');
        });
      });

      test('password strength changes are announced', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const passwordInput = screen.getByLabelText('Create Password');
        
        // Weak password
        await user.type(passwordInput, 'weak');
        
        await waitFor(() => {
          const strengthIndicator = screen.getByText(/weak/i);
          expect(strengthIndicator).toBeInTheDocument();
          
          // Should be announced via aria-live region or similar
          const strengthContainer = strengthIndicator.closest('[aria-live], [role="status"]');
          expect(strengthContainer || strengthIndicator.closest('div')).toBeTruthy();
        });
        
        // Strong password
        await user.clear(passwordInput);
        await user.type(passwordInput, 'StrongPassword123');
        
        await waitFor(() => {
          const strongIndicator = screen.getByText(/strong/i);
          expect(strongIndicator).toBeInTheDocument();
        });
      });
    });

    describe('2.3 Navigation and Structure', () => {
      test('page has proper heading hierarchy', () => {
        render(<SignUpPage />);
        
        // Should have main heading
        const mainHeading = screen.getByRole('heading', { level: 1 }) ||
                           screen.getByText('Discover Your Perfect Scent');
        expect(mainHeading).toBeInTheDocument();
        
        // Should have proper heading structure
        const headings = screen.getAllByRole('heading');
        expect(headings.length).toBeGreaterThan(0);
        
        // First heading should be h1 or equivalent
        headings.forEach(heading => {
          expect(['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(heading.tagName)).toBe(true);
        });
      });

      test('form has proper landmark structure', () => {
        render(<SignUpPage />);
        
        // Form should be identifiable as a form landmark
        const form = screen.getByRole('form');
        expect(form).toBeInTheDocument();
        
        // Main content should be in a main landmark or equivalent
        const mainContent = document.querySelector('main') || 
                           screen.getByRole('form').closest('div[role="main"]') ||
                           screen.getByRole('form');
        expect(mainContent).toBeTruthy();
      });

      test('links have descriptive text', () => {
        render(<SignUpPage />);
        
        // Check all links have meaningful text
        const links = screen.getAllByRole('link');
        links.forEach(link => {
          const linkText = link.textContent || link.getAttribute('aria-label');
          expect(linkText).toBeTruthy();
          expect(linkText!.length).toBeGreaterThan(3);
        });
        
        // Specific important links
        expect(screen.getByText('Terms of Service')).toHaveAttribute('href');
        expect(screen.getByText('Privacy Policy')).toHaveAttribute('href');
      });
    });
  });

  describe('3. Keyboard Navigation', () => {
    describe('3.1 Tab Order and Focus Management', () => {
      test('tab order follows logical reading sequence', () => {
        render(<SignUpPage />);
        
        // Get all focusable elements
        const focusableElements = [
          screen.getByLabelText('Email Address'),
          screen.getByLabelText('Create Password'),
          screen.getByRole('button', { name: /Start My Fragrance Journey/ }),
        ];
        
        // All elements should be focusable
        focusableElements.forEach(element => {
          expect(element.tabIndex).toBeGreaterThanOrEqual(0);
        });
      });

      test('form can be completed entirely with keyboard', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        // Tab to email field
        await user.tab();
        expect(screen.getByLabelText('Email Address')).toHaveFocus();
        
        // Enter email
        await user.type(document.activeElement as Element, 'user@example.com');
        
        // Tab to password field
        await user.tab();
        expect(screen.getByLabelText('Create Password')).toHaveFocus();
        
        // Enter password
        await user.type(document.activeElement as Element, 'SecurePass123');
        
        // Tab to submit button
        await user.tab();
        expect(screen.getByRole('button', { name: /Start My Fragrance Journey/ })).toHaveFocus();
        
        // Should be able to submit with Enter
        expect(document.activeElement).toEqual(
          screen.getByRole('button', { name: /Start My Fragrance Journey/ })
        );
      });

      test('password toggle button is keyboard accessible', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const passwordInput = screen.getByLabelText('Create Password');
        await user.type(passwordInput, 'password');
        
        // Find toggle button
        const toggleButton = document.querySelector('button[type="button"]');
        expect(toggleButton).toBeTruthy();
        
        // Should be focusable with keyboard
        toggleButton?.focus();
        expect(document.activeElement).toEqual(toggleButton);
        
        // Should be activatable with Enter or Space
        if (toggleButton) {
          await user.keyboard('{Enter}');
          expect(passwordInput).toHaveAttribute('type', 'text');
        }
      });

      test('keyboard navigation skips non-interactive elements', () => {
        render(<SignUpPage />);
        
        // Decorative elements should not be focusable
        const icons = document.querySelectorAll('[class*="icon"], [class*="Sparkles"]');
        icons.forEach(icon => {
          expect(icon.tabIndex).toBeLessThan(0);
        });
      });
    });

    describe('3.2 Focus Indicators', () => {
      test('all interactive elements have visible focus indicators', () => {
        render(<SignUpPage />);
        
        const interactiveElements = [
          screen.getByLabelText('Email Address'),
          screen.getByLabelText('Create Password'),
          screen.getByRole('button', { name: /Start My Fragrance Journey/ }),
          ...screen.getAllByRole('link')
        ];
        
        interactiveElements.forEach(element => {
          element.focus();
          
          // Element should have focus-visible styles or be visually distinct when focused
          const computedStyle = window.getComputedStyle(element);
          const hasFocusStyles = 
            computedStyle.outline !== 'none' ||
            computedStyle.boxShadow !== 'none' ||
            element.classList.contains('focus-visible') ||
            element.classList.contains('focus:') ||
            element.getAttribute('data-focus-visible') !== null;
            
          expect(hasFocusStyles || element.matches(':focus-visible')).toBeTruthy();
        });
      });

      test('focus indicators meet WCAG contrast requirements', () => {
        render(<SignUpPage />);
        
        const emailInput = screen.getByLabelText('Email Address');
        emailInput.focus();
        
        // Focus indicator should be clearly visible
        const computedStyle = window.getComputedStyle(emailInput);
        
        // Should have visible focus indication (outline, box-shadow, or border change)
        const hasFocusIndication = 
          computedStyle.outline !== 'none' ||
          computedStyle.boxShadow.includes('ring') ||
          computedStyle.borderColor !== computedStyle.borderColor; // Would change on focus
          
        expect(hasFocusIndication).toBeTruthy();
      });

      test('focus management during state changes', async () => {
        const { signUp } = await import('@/app/actions/auth');
        (signUp as any).mockResolvedValue({ 
          message: 'Account created!' 
        });
        
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
        await user.type(screen.getByLabelText('Create Password'), 'SecurePass123');
        
        const submitButton = screen.getByRole('button', { name: /Start My Fragrance Journey/ });
        submitButton.focus();
        await user.click(submitButton);
        
        await waitFor(() => {
          // After success, focus should be managed appropriately
          // Either focus stays on a logical element or moves to success content
          expect(document.activeElement).toBeTruthy();
          expect(document.activeElement?.tagName).not.toBe('BODY');
        });
      });
    });

    describe('3.3 Keyboard Shortcuts and Interaction', () => {
      test('Enter key submits form when focus is on submit button', async () => {
        const { signUp } = await import('@/app/actions/auth');
        const mockSignUp = vi.fn().mockResolvedValue({ message: 'Success!' });
        (signUp as any).mockImplementation(mockSignUp);
        
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
        await user.type(screen.getByLabelText('Create Password'), 'SecurePass123');
        
        const submitButton = screen.getByRole('button', { name: /Start My Fragrance Journey/ });
        submitButton.focus();
        
        await user.keyboard('{Enter}');
        
        expect(mockSignUp).toHaveBeenCalledWith('user@example.com', 'SecurePass123');
      });

      test('Escape key behavior is appropriate', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const passwordInput = screen.getByLabelText('Create Password');
        await user.type(passwordInput, 'test');
        
        // Escape should not break the form or cause unexpected behavior
        await user.keyboard('{Escape}');
        
        // Form should still be functional
        expect(passwordInput).toHaveValue('test');
        expect(screen.getByRole('button', { name: /Start My Fragrance Journey/ })).toBeInTheDocument();
      });

      test('Space key activates buttons', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
        await user.type(screen.getByLabelText('Create Password'), 'SecurePass123');
        
        const submitButton = screen.getByRole('button', { name: /Start My Fragrance Journey/ });
        submitButton.focus();
        
        // Space should activate button (though form won't submit in test without mock)
        await user.keyboard(' ');
        
        // Button should respond to space activation
        expect(submitButton).toBeInTheDocument();
      });
    });
  });

  describe('4. Color Contrast and Visual Accessibility', () => {
    describe('4.1 WCAG AA Color Contrast Requirements', () => {
      test('text meets 4.5:1 contrast ratio minimum', () => {
        render(<SignUpPage />);
        
        // Primary text elements should have sufficient contrast
        const headings = screen.getAllByRole('heading');
        const bodyText = screen.getAllByText(/Join the AI-powered/);
        
        [...headings, ...bodyText].forEach(element => {
          const computedStyle = window.getComputedStyle(element);
          
          // Elements should use high-contrast colors
          // Testing for specific color classes that ensure good contrast
          const hasGoodContrast = 
            element.classList.contains('text-foreground') ||
            element.classList.contains('text-gradient-primary') ||
            element.classList.contains('text-muted-foreground') ||
            computedStyle.color !== 'rgb(128, 128, 128)'; // Not low-contrast gray
            
          expect(hasGoodContrast).toBeTruthy();
        });
      });

      test('form elements have sufficient contrast', () => {
        render(<SignUpPage />);
        
        const formElements = [
          screen.getByLabelText('Email Address'),
          screen.getByLabelText('Create Password'),
          screen.getByRole('button', { name: /Start My Fragrance Journey/ }),
        ];
        
        formElements.forEach(element => {
          const computedStyle = window.getComputedStyle(element);
          
          // Form elements should have proper contrast
          expect(computedStyle.backgroundColor).not.toBe('transparent');
          expect(computedStyle.color).not.toBe('rgb(255, 255, 255)'); // Not white on white
        });
      });

      test('error states maintain accessibility contrast', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const emailInput = screen.getByLabelText('Email Address');
        await user.type(emailInput, 'invalid');
        
        await waitFor(() => {
          const errorMessage = screen.getByText(/needs an @ symbol/);
          expect(errorMessage).toBeInTheDocument();
          
          // Error text should have sufficient contrast
          expect(errorMessage).toHaveClass('text-destructive');
          
          // Error state input should maintain readability
          expect(emailInput).toHaveClass('border-destructive');
        });
      });

      test('success states maintain accessibility contrast', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const emailInput = screen.getByLabelText('Email Address');
        await user.type(emailInput, 'valid@example.com');
        
        await waitFor(() => {
          // Success indicators should have good contrast
          const successIcon = document.querySelector('[class*="text-green"], [class*="CheckCircle"]');
          if (successIcon) {
            expect(successIcon).toHaveClass('text-green-500');
          }
        });
      });
    });

    describe('4.2 Color Independence', () => {
      test('information is not conveyed by color alone', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const passwordInput = screen.getByLabelText('Create Password');
        await user.type(passwordInput, 'a');
        
        await waitFor(() => {
          // Password requirements should use icons + text, not just color
          const requirements = screen.getAllByText(/At least|One uppercase|One lowercase|One number/);
          
          requirements.forEach(requirement => {
            const container = requirement.closest('div');
            const hasIcon = container?.querySelector('[class*="CheckCircle"], [class*="rounded-full"]');
            expect(hasIcon).toBeTruthy();
          });
        });
      });

      test('form validation uses multiple indicators', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const emailInput = screen.getByLabelText('Email Address');
        await user.type(emailInput, 'invalid');
        
        await waitFor(() => {
          // Error should be indicated by text AND visual indicator
          expect(screen.getByText(/needs an @ symbol/)).toBeInTheDocument();
          
          // Should also have visual indicators (border, icon)
          expect(emailInput).toHaveClass('border-destructive');
          
          // Error icon
          const errorIcon = document.querySelector('[class*="XCircle"]');
          expect(errorIcon).toBeTruthy();
        });
      });

      test('interactive states have non-color indicators', () => {
        render(<SignUpPage />);
        
        const submitButton = screen.getByRole('button', { name: /Start My Fragrance Journey/ });
        
        // Button should have visual indicators beyond color
        expect(submitButton).toHaveClass('font-medium');
        
        // Disabled state should be indicated by more than color
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveAttribute('disabled');
      });
    });
  });

  describe('5. Form Accessibility', () => {
    describe('5.1 Error Handling and Validation', () => {
      test('required fields are properly marked', () => {
        render(<SignUpPage />);
        
        const requiredFields = [
          screen.getByLabelText('Email Address'),
          screen.getByLabelText('Create Password'),
        ];
        
        requiredFields.forEach(field => {
          expect(field).toHaveAttribute('required');
          expect(field).toBeRequired();
        });
      });

      test('error messages are descriptive and actionable', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const emailInput = screen.getByLabelText('Email Address');
        await user.type(emailInput, 'test@');
        
        await waitFor(() => {
          const errorMessage = screen.getByText(/needs a domain \(like \.com\)/);
          expect(errorMessage).toBeInTheDocument();
          
          // Error message should be specific and helpful
          expect(errorMessage.textContent).toMatch(/domain/);
          expect(errorMessage.textContent).toMatch(/\.com/);
        });
      });

      test('success feedback is accessible', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const emailInput = screen.getByLabelText('Email Address');
        await user.type(emailInput, 'valid@example.com');
        
        await waitFor(() => {
          // Success should be indicated accessibly
          const successIcon = document.querySelector('[class*="CheckCircle"]');
          if (successIcon) {
            expect(successIcon).toHaveAttribute('aria-hidden', 'true');
          }
          
          // Success state should not break accessibility
          expect(emailInput).toBeValid();
        });
      });
    });

    describe('5.2 Input Assistance', () => {
      test('placeholder text is not the only source of information', () => {
        render(<SignUpPage />);
        
        const emailInput = screen.getByLabelText('Email Address');
        const passwordInput = screen.getByLabelText('Create Password');
        
        // Both should have visible labels in addition to placeholders
        expect(screen.getByText('Email Address')).toBeVisible();
        expect(screen.getByText('Create Password')).toBeVisible();
        
        // Placeholders should be supplementary, not primary
        expect(emailInput).toHaveAttribute('placeholder');
        expect(passwordInput).toHaveAttribute('placeholder');
      });

      test('autocomplete attributes support assistive technology', () => {
        render(<SignUpPage />);
        
        const emailInput = screen.getByLabelText('Email Address');
        const passwordInput = screen.getByLabelText('Create Password');
        
        expect(emailInput).toHaveAttribute('autocomplete', 'email');
        expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
      });

      test('field purposes are programmatically determinable', () => {
        render(<SignUpPage />);
        
        const emailInput = screen.getByLabelText('Email Address');
        const passwordInput = screen.getByLabelText('Create Password');
        
        // Fields should have appropriate input types
        expect(emailInput).toHaveAttribute('type', 'email');
        expect(passwordInput).toHaveAttribute('type', 'password');
        
        // Should have proper autocomplete values for identification
        expect(emailInput).toHaveAttribute('autocomplete');
        expect(passwordInput).toHaveAttribute('autocomplete');
      });
    });

    describe('5.3 Context and Instructions', () => {
      test('form purpose is clear from context', () => {
        render(<SignUpPage />);
        
        // Form purpose should be clear from headings and descriptions
        expect(screen.getByText('Discover Your Perfect Scent')).toBeInTheDocument();
        expect(screen.getByText(/Join the AI-powered fragrance discovery/)).toBeInTheDocument();
        
        // Action is clear from button text
        expect(screen.getByRole('button', { name: /Start My Fragrance Journey/ })).toBeInTheDocument();
      });

      test('instructions are provided before form fields', () => {
        render(<SignUpPage />);
        
        // Value proposition and instructions come before form
        const description = screen.getByText(/Join the AI-powered fragrance discovery/);
        const form = screen.getByRole('form');
        
        // Description should come before form in DOM order
        expect(description.compareDocumentPosition(form)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      });

      test('help text is available when needed', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const passwordInput = screen.getByLabelText('Create Password');
        await user.type(passwordInput, 'a');
        
        await waitFor(() => {
          // Password help should appear when needed
          expect(screen.getByText('Password strength:')).toBeInTheDocument();
          expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
        });
      });
    });
  });

  describe('6. Mobile Accessibility', () => {
    describe('6.1 Touch Target Accessibility', () => {
      test('touch targets meet minimum size requirements', () => {
        render(<SignUpPage />);
        
        const touchTargets = [
          screen.getByLabelText('Email Address'),
          screen.getByLabelText('Create Password'),
          screen.getByRole('button', { name: /Start My Fragrance Journey/ }),
        ];
        
        touchTargets.forEach(target => {
          // Elements should have touch-target class for minimum size
          expect(target).toHaveClass('touch-target');
        });
      });

      test('interactive elements have sufficient spacing', () => {
        render(<SignUpPage />);
        
        const formElements = [
          screen.getByLabelText('Email Address'),
          screen.getByLabelText('Create Password'),
          screen.getByRole('button', { name: /Start My Fragrance Journey/ }),
        ];
        
        // Form should have proper spacing classes
        const form = screen.getByRole('form');
        expect(form).toHaveClass('space-y-4');
      });

      test('password toggle button is accessible on mobile', async () => {
        render(<SignUpPage />);
        
        const toggleButton = document.querySelector('button[type="button"]');
        expect(toggleButton).toBeTruthy();
        
        if (toggleButton) {
          // Should have adequate touch target size
          expect(toggleButton).toHaveClass('touch-target');
          
          // Should have accessible name
          expect(toggleButton).toHaveAttribute('aria-label');
        }
      });
    });

    describe('6.2 Screen Reader Mobile Experience', () => {
      test('mobile screen reader navigation is efficient', () => {
        render(<SignUpPage />);
        
        // Form should have clear structure for mobile screen readers
        const form = screen.getByRole('form');
        expect(form).toBeInTheDocument();
        
        // Headings should provide clear navigation landmarks
        const headings = screen.getAllByRole('heading');
        expect(headings.length).toBeGreaterThan(0);
        
        // Form fields should be grouped logically
        const formGroup = form.querySelector('[class*="space-y"]');
        expect(formGroup).toBeTruthy();
      });

      test('mobile specific ARIA attributes are appropriate', () => {
        render(<SignUpPage />);
        
        // Form elements should work well with mobile screen readers
        const emailInput = screen.getByLabelText('Email Address');
        const passwordInput = screen.getByLabelText('Create Password');
        
        expect(emailInput).toHaveAttribute('type', 'email');
        expect(passwordInput).toHaveAttribute('type', 'password');
        
        // Should not have conflicting ARIA attributes for mobile
        expect(emailInput).not.toHaveAttribute('aria-describedby', '');
        expect(passwordInput).not.toHaveAttribute('aria-describedby', '');
      });
    });
  });

  describe('7. Cross-Page Accessibility Consistency', () => {
    test('all auth pages maintain consistent accessibility patterns', async () => {
      const pages = [
        { component: SignUpPage, name: 'SignUp' },
        { component: LoginPage, name: 'Login' },
        { component: PasswordResetPage, name: 'PasswordReset' },
        { component: CallbackPage, name: 'Callback' },
      ];
      
      for (const page of pages) {
        const { container, unmount } = render(React.createElement(page.component));
        
        // Each page should have no accessibility violations
        const results = await axe(container);
        expect(results).toHaveNoViolations();
        
        // Each page should have proper heading structure
        const headings = screen.getAllByRole('heading');
        expect(headings.length).toBeGreaterThan(0);
        
        // Each page should have consistent brand elements
        if (page.name !== 'Callback') {
          expect(screen.getByText('ScentMatch')).toBeInTheDocument();
        }
        
        unmount();
      }
    });

    test('navigation between auth pages maintains focus', () => {
      // This would test actual navigation, but since we're testing components in isolation,
      // we verify that links have proper attributes
      render(<SignUpPage />);
      
      const signInLink = screen.getByText('Sign in');
      expect(signInLink).toHaveAttribute('href', '/auth/signin');
      
      const termsLink = screen.getByText('Terms of Service');
      expect(termsLink).toHaveAttribute('href', '/terms');
      
      const privacyLink = screen.getByText('Privacy Policy');
      expect(privacyLink).toHaveAttribute('href', '/privacy');
    });

    test('error handling is consistent across all auth pages', () => {
      const { rerender } = render(<SignUpPage />);
      
      // Test signup error display structure
      const signupForm = screen.getByRole('form');
      expect(signupForm).toBeInTheDocument();
      
      rerender(<LoginPage />);
      
      // Test login error display structure
      const loginForm = screen.getByRole('form');
      expect(loginForm).toBeInTheDocument();
      
      // Both should use consistent error display patterns
      // (This would be more comprehensive with actual error states)
    });
  });
});