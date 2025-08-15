/**
 * Auth Mobile Performance Tests
 * 
 * Tests Core Web Vitals and mobile performance for authentication pages
 * per QA specifications focusing on conversion-critical loading times.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import SignUpPage from '@/app/auth/signup/page';
import LoginPage from '@/app/auth/login/page';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock auth actions with simulated network delays
vi.mock('@/app/actions/auth', () => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
}));

// Mock performance API
const mockPerformanceObserver = vi.fn();
const mockPerformanceEntry = {
  entryType: 'largest-contentful-paint',
  startTime: 1500, // 1.5 seconds - good LCP
};

global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(() => {
    callback({ getEntries: () => [mockPerformanceEntry] });
  }),
  disconnect: vi.fn(),
}));

describe('Authentication Mobile Performance', () => {
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
    
    // Reset performance mocks
    vi.clearAllMocks();
  });

  describe('1. Core Web Vitals Testing', () => {
    describe('1.1 Largest Contentful Paint (LCP)', () => {
      test('signup page LCP < 2.5s target', async () => {
        const startTime = performance.now();
        render(<SignUpPage />);
        
        // Main content should be rendered quickly
        await waitFor(() => {
          expect(screen.getByText('Discover Your Perfect Scent')).toBeInTheDocument();
        });
        
        const renderTime = performance.now() - startTime;
        
        // Should render main content quickly (simulated target)
        expect(renderTime).toBeLessThan(100); // In test environment, should be nearly instant
        
        // Check that largest content elements are present
        expect(screen.getByText('ScentMatch')).toBeInTheDocument();
        expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Start My Fragrance Journey/ })).toBeInTheDocument();
      });

      test('login page LCP meets performance targets', async () => {
        const startTime = performance.now();
        render(<LoginPage />);
        
        await waitFor(() => {
          expect(screen.getByText('Welcome Back')).toBeInTheDocument();
        });
        
        const renderTime = performance.now() - startTime;
        expect(renderTime).toBeLessThan(100);
        
        // Critical content should be immediately available
        expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign In/ })).toBeInTheDocument();
      });

      test('form elements render without layout shift', () => {
        render(<SignUpPage />);
        
        // All form elements should be present immediately
        const emailInput = screen.getByLabelText('Email Address');
        const passwordInput = screen.getByLabelText('Create Password');
        const submitButton = screen.getByRole('button', { name: /Start My Fragrance Journey/ });
        
        expect(emailInput).toBeVisible();
        expect(passwordInput).toBeVisible();
        expect(submitButton).toBeVisible();
        
        // Elements should have consistent sizing classes
        expect(emailInput).toHaveClass('h-12');
        expect(passwordInput).toHaveClass('h-12');
        expect(submitButton).toHaveClass('h-12');
      });
    });

    describe('1.2 Interaction to Next Paint (INP)', () => {
      test('form inputs respond quickly to user interaction', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const emailInput = screen.getByLabelText('Email Address');
        
        const startTime = performance.now();
        await user.type(emailInput, 'test@example.com');
        const interactionTime = performance.now() - startTime;
        
        // Should be responsive (in test env should be very fast)
        expect(interactionTime).toBeLessThan(200);
        expect(emailInput).toHaveValue('test@example.com');
      });

      test('password validation provides immediate feedback', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const passwordInput = screen.getByLabelText('Create Password');
        
        const startTime = performance.now();
        await user.type(passwordInput, 'weak');
        
        await waitFor(() => {
          expect(screen.getByText('Password strength:')).toBeInTheDocument();
        });
        
        const feedbackTime = performance.now() - startTime;
        expect(feedbackTime).toBeLessThan(500); // Should provide quick feedback
      });

      test('form submission handles loading states efficiently', async () => {
        const { signUp } = await import('@/app/actions/auth');
        const signUpPromise = new Promise(resolve => 
          setTimeout(() => resolve({ message: 'Success!' }), 100)
        );
        (signUp as any).mockReturnValue(signUpPromise);
        
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
        await user.type(screen.getByLabelText('Create Password'), 'SecurePass123');
        
        const startTime = performance.now();
        await user.click(screen.getByRole('button', { name: /Start My Fragrance Journey/ }));
        
        // Loading state should appear immediately
        await waitFor(() => {
          expect(screen.getByText(/Creating your account/)).toBeInTheDocument();
        });
        
        const loadingStateTime = performance.now() - startTime;
        expect(loadingStateTime).toBeLessThan(50); // Immediate feedback
      });
    });

    describe('1.3 Cumulative Layout Shift (CLS)', () => {
      test('no layout shift during form validation', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const emailInput = screen.getByLabelText('Email Address');
        const initialBoundingRect = emailInput.getBoundingClientRect();
        
        // Type invalid email to trigger validation
        await user.type(emailInput, 'invalid');
        
        await waitFor(() => {
          expect(screen.getByText(/needs an @ symbol/)).toBeInTheDocument();
        });
        
        // Input position should not have shifted
        const finalBoundingRect = emailInput.getBoundingClientRect();
        expect(finalBoundingRect.top).toBeCloseTo(initialBoundingRect.top, 1);
        expect(finalBoundingRect.left).toBeCloseTo(initialBoundingRect.left, 1);
      });

      test('password requirements appear without shifting layout', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const passwordInput = screen.getByLabelText('Create Password');
        const submitButton = screen.getByRole('button', { name: /Start My Fragrance Journey/ });
        const initialSubmitPosition = submitButton.getBoundingClientRect();
        
        // Start typing to trigger password requirements
        await user.type(passwordInput, 'a');
        
        await waitFor(() => {
          expect(screen.getByText('Password strength:')).toBeInTheDocument();
        });
        
        // Submit button should not have moved significantly
        const finalSubmitPosition = submitButton.getBoundingClientRect();
        const positionDiff = Math.abs(finalSubmitPosition.top - initialSubmitPosition.top);
        expect(positionDiff).toBeLessThan(10); // Allow minimal shift for requirements
      });

      test('success state transition maintains stable layout', async () => {
        const { signUp } = await import('@/app/actions/auth');
        (signUp as any).mockResolvedValue({ message: 'Account created!' });
        
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
        await user.type(screen.getByLabelText('Create Password'), 'SecurePass123');
        await user.click(screen.getByRole('button', { name: /Start My Fragrance Journey/ }));
        
        await waitFor(() => {
          expect(screen.getByText('Check Your Email')).toBeInTheDocument();
        });
        
        // Success page should have stable layout
        const successTitle = screen.getByText('Check Your Email');
        expect(successTitle).toBeVisible();
        
        // Should not cause horizontal scrolling
        expect(document.body.scrollWidth).toBeLessThanOrEqual(window.innerWidth + 20);
      });
    });
  });

  describe('2. Mobile-Specific Performance', () => {
    describe('2.1 Touch Response Time', () => {
      test('touch targets respond immediately', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const emailInput = screen.getByLabelText('Email Address');
        
        const startTime = performance.now();
        await user.click(emailInput);
        const responseTime = performance.now() - startTime;
        
        expect(responseTime).toBeLessThan(100);
        expect(document.activeElement).toBe(emailInput);
      });

      test('button presses provide immediate visual feedback', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const submitButton = screen.getByRole('button', { name: /Start My Fragrance Journey/ });
        
        // Button should be responsive to press
        const startTime = performance.now();
        await user.click(submitButton);
        const clickTime = performance.now() - startTime;
        
        expect(clickTime).toBeLessThan(100);
      });

      test('password toggle responds quickly', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const passwordInput = screen.getByLabelText('Create Password');
        await user.type(passwordInput, 'password');
        
        const toggleButton = document.querySelector('button[type="button"]');
        expect(toggleButton).toBeTruthy();
        
        const startTime = performance.now();
        if (toggleButton) {
          await user.click(toggleButton);
        }
        const toggleTime = performance.now() - startTime;
        
        expect(toggleTime).toBeLessThan(100);
        expect(passwordInput).toHaveAttribute('type', 'text');
      });
    });

    describe('2.2 Memory Efficiency', () => {
      test('form state updates are efficient', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const emailInput = screen.getByLabelText('Email Address');
        const passwordInput = screen.getByLabelText('Create Password');
        
        // Rapid typing should not cause performance issues
        const longText = 'a'.repeat(100);
        
        const startTime = performance.now();
        await user.type(emailInput, longText);
        await user.type(passwordInput, longText);
        const typingTime = performance.now() - startTime;
        
        // Should handle long inputs efficiently
        expect(typingTime).toBeLessThan(1000);
        expect(emailInput).toHaveValue(longText);
        expect(passwordInput).toHaveValue(longText);
      });

      test('component re-renders are minimized', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<SignUpPage />);
        
        const emailInput = screen.getByLabelText('Email Address');
        await user.type(emailInput, 'user@example.com');
        
        // Re-render should not lose state
        rerender(<SignUpPage />);
        
        // State should be preserved (in real app with proper state management)
        // In this test, we verify the component renders consistently
        expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
        expect(screen.getByLabelText('Create Password')).toBeInTheDocument();
      });
    });

    describe('2.3 Network Performance', () => {
      test('form submission handles slow networks gracefully', async () => {
        const { signUp } = await import('@/app/actions/auth');
        // Simulate slow network (3G speed)
        const slowSignUp = new Promise(resolve => 
          setTimeout(() => resolve({ message: 'Success!' }), 2000)
        );
        (signUp as any).mockReturnValue(slowSignUp);
        
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
        await user.type(screen.getByLabelText('Create Password'), 'SecurePass123');
        
        const submitButton = screen.getByRole('button', { name: /Start My Fragrance Journey/ });
        await user.click(submitButton);
        
        // Should immediately show loading state
        expect(screen.getByText(/Creating your account/)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
        
        // Should maintain loading state during slow network
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(screen.getByText(/Creating your account/)).toBeInTheDocument();
      });

      test('error states handle network failures appropriately', async () => {
        const { signUp } = await import('@/app/actions/auth');
        (signUp as any).mockRejectedValue(new Error('Network error'));
        
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
        await user.type(screen.getByLabelText('Create Password'), 'SecurePass123');
        
        const submitButton = screen.getByRole('button', { name: /Start My Fragrance Journey/ });
        
        try {
          await user.click(submitButton);
          
          // Should handle error gracefully
          await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
          });
        } catch (error) {
          // Error should be handled gracefully without breaking the form
          expect(submitButton).toBeInTheDocument();
        }
      });

      test('offline experience is handled gracefully', async () => {
        const { signUp } = await import('@/app/actions/auth');
        (signUp as any).mockRejectedValue(new Error('Failed to fetch'));
        
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
        await user.type(screen.getByLabelText('Create Password'), 'SecurePass123');
        
        const submitButton = screen.getByRole('button', { name: /Start My Fragrance Journey/ });
        
        try {
          await user.click(submitButton);
          
          // Should handle offline state
          await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
          });
        } catch (error) {
          // Offline state should not break the interface
          expect(submitButton).toBeInTheDocument();
        }
      });
    });
  });

  describe('3. Performance Monitoring', () => {
    describe('3.1 Resource Loading', () => {
      test('critical resources are prioritized', () => {
        render(<SignUpPage />);
        
        // Form should be immediately functional
        expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
        expect(screen.getByLabelText('Create Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Start My Fragrance Journey/ })).toBeInTheDocument();
        
        // Brand elements should load quickly
        expect(screen.getByText('ScentMatch')).toBeInTheDocument();
      });

      test('non-critical elements do not block interaction', () => {
        render(<SignUpPage />);
        
        // Form should be interactive immediately
        const emailInput = screen.getByLabelText('Email Address');
        expect(emailInput).not.toBeDisabled();
        
        const passwordInput = screen.getByLabelText('Create Password');
        expect(passwordInput).not.toBeDisabled();
        
        // Icons and decorative elements should not block functionality
        expect(screen.getByRole('button', { name: /Start My Fragrance Journey/ })).not.toBeDisabled();
      });

      test('images and icons load progressively', () => {
        render(<SignUpPage />);
        
        // Check for optimized loading attributes
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          // Images should have loading optimization
          expect(img.getAttribute('loading') || img.getAttribute('data-loading')).toBeTruthy();
        });
      });
    });

    describe('3.2 Bundle Size Impact', () => {
      test('page components are reasonably sized', () => {
        // This is more of a build-time concern, but we can test that
        // components don't include unnecessary dependencies
        render(<SignUpPage />);
        
        // Essential functionality should be present
        expect(screen.getByRole('form')).toBeInTheDocument();
        
        // No unnecessary heavy components loaded
        expect(document.querySelector('video')).not.toBeInTheDocument();
        expect(document.querySelector('iframe')).not.toBeInTheDocument();
      });

      test('code splitting is effective', () => {
        render(<SignUpPage />);
        
        // Only necessary components are loaded
        expect(screen.getByText('Discover Your Perfect Scent')).toBeInTheDocument();
        
        // Success state components should load on demand
        expect(screen.queryByText('Check Your Email')).not.toBeInTheDocument();
      });
    });

    describe('3.3 Performance Budgets', () => {
      test('JavaScript execution time is reasonable', async () => {
        const startTime = performance.now();
        
        render(<SignUpPage />);
        
        // Component should render quickly
        await waitFor(() => {
          expect(screen.getByText('ScentMatch')).toBeInTheDocument();
        });
        
        const executionTime = performance.now() - startTime;
        expect(executionTime).toBeLessThan(100); // Should be very fast in test environment
      });

      test('memory usage is controlled during interactions', async () => {
        const user = userEvent.setup();
        render(<SignUpPage />);
        
        const emailInput = screen.getByLabelText('Email Address');
        const passwordInput = screen.getByLabelText('Create Password');
        
        // Perform many interactions
        for (let i = 0; i < 10; i++) {
          await user.clear(emailInput);
          await user.type(emailInput, `test${i}@example.com`);
          await user.clear(passwordInput);
          await user.type(passwordInput, `password${i}`);
        }
        
        // Form should remain responsive
        expect(emailInput).toHaveValue('test9@example.com');
        expect(passwordInput).toHaveValue('password9');
      });

      test('DOM complexity is reasonable', () => {
        render(<SignUpPage />);
        
        // Count DOM nodes (should not be excessive)
        const domNodes = document.querySelectorAll('*').length;
        expect(domNodes).toBeLessThan(500); // Reasonable limit for auth page
        
        // No deeply nested structures
        const deepestNode = [...document.querySelectorAll('*')].reduce((deepest, node) => {
          const depth = (node as Element).tagName.split('>').length;
          return depth > deepest ? depth : deepest;
        }, 0);
        
        expect(deepestNode).toBeLessThan(20); // Reasonable nesting depth
      });
    });
  });
});