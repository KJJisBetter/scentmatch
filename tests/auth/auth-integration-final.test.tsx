/**
 * Authentication Integration Tests - Final Validation
 * 
 * End-to-end tests validating complete authentication flows,
 * backend integration, and user journey completion.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import SignUpPage from '@/app/auth/signup/page';
import LoginPage from '@/app/auth/login/page';
import PasswordResetPage from '@/app/auth/reset/page';
import CallbackPage from '@/app/auth/callback/page';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock auth actions with realistic scenarios
vi.mock('@/app/actions/auth', () => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
  resetPassword: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      onAuthStateChange: vi.fn(),
    }
  }
}));

describe('Authentication Integration - Final Validation', () => {
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

    // Reset window location
    delete (window as any).location;
    (window as any).location = { 
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Complete User Registration Flow', () => {
    test('successful signup flow from start to email verification', async () => {
      const { signUp } = await import('@/app/actions/auth');
      (signUp as any).mockResolvedValue({ 
        message: 'Please check your email to verify your account.' 
      });

      const user = userEvent.setup();
      render(<SignUpPage />);

      // Step 1: User sees signup form
      expect(screen.getByText('Discover Your Perfect Scent')).toBeInTheDocument();
      expect(screen.getByText('Join the AI-powered fragrance discovery platform that finds scents you\'ll actually love')).toBeInTheDocument();

      // Step 2: User fills out form with valid data
      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Create Password');
      
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'SecurePassword123');

      // Step 3: Form validation passes
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Start My Fragrance Journey/ });
        expect(submitButton).not.toBeDisabled();
      });

      // Step 4: User submits form
      const submitButton = screen.getByRole('button', { name: /Start My Fragrance Journey/ });
      await user.click(submitButton);

      // Step 5: Loading state is shown
      await waitFor(() => {
        expect(screen.getByText(/Creating your account/)).toBeInTheDocument();
      });

      // Step 6: Success state is displayed
      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
        expect(screen.getByText(/newuser@example.com/)).toBeInTheDocument();
      });

      // Step 7: User sees next steps and value preview
      expect(screen.getByText('While you wait, here\'s what\'s coming:')).toBeInTheDocument();
      expect(screen.getByText('AI-powered fragrance recommendations')).toBeInTheDocument();
      expect(screen.getByText('Affordable sample discovery')).toBeInTheDocument();
      expect(screen.getByText('Join 10,000+ fragrance lovers')).toBeInTheDocument();

      // Step 8: User can access email or retry
      expect(screen.getByText('Open Email App')).toBeInTheDocument();
      expect(screen.getByText(/try again/)).toBeInTheDocument();

      // Verify backend was called correctly
      expect(signUp).toHaveBeenCalledWith('newuser@example.com', 'SecurePassword123');
    });

    test('handles registration errors gracefully with recovery options', async () => {
      const { signUp } = await import('@/app/actions/auth');
      (signUp as any).mockResolvedValue({ 
        error: 'Email address is already registered. Please sign in instead.' 
      });

      const user = userEvent.setup();
      render(<SignUpPage />);

      await user.type(screen.getByLabelText('Email Address'), 'existing@example.com');
      await user.type(screen.getByLabelText('Create Password'), 'SecurePassword123');
      await user.click(screen.getByRole('button', { name: /Start My Fragrance Journey/ }));

      // Error should be displayed with guidance
      await waitFor(() => {
        expect(screen.getByText(/Email address is already registered/)).toBeInTheDocument();
      });

      // Form should still be usable for correction
      expect(screen.getByLabelText('Email Address')).toHaveValue('existing@example.com');
      expect(screen.getByRole('button', { name: /Start My Fragrance Journey/ })).not.toBeDisabled();

      // User should be able to navigate to sign in
      expect(screen.getByText('Sign in')).toHaveAttribute('href', '/auth/signin');
    });

    test('progressive form validation guides user to success', async () => {
      const user = userEvent.setup();
      render(<SignUpPage />);

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Create Password');
      const submitButton = screen.getByRole('button', { name: /Start My Fragrance Journey/ });

      // Initially submit is disabled
      expect(submitButton).toBeDisabled();

      // Invalid email shows helpful guidance
      await user.type(emailInput, 'invalid');
      await waitFor(() => {
        expect(screen.getByText(/needs an @ symbol/)).toBeInTheDocument();
      });

      // Improving email shows progression
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid@');
      await waitFor(() => {
        expect(screen.getByText(/needs a domain \(like \.com\)/)).toBeInTheDocument();
      });

      // Valid email shows success indicator
      await user.clear(emailInput);
      await user.type(emailInput, 'user@example.com');
      
      // Password validation shows requirements
      await user.type(passwordInput, 'weak');
      await waitFor(() => {
        expect(screen.getByText('Password strength:')).toBeInTheDocument();
        expect(screen.getByText(/Weak/i)).toBeInTheDocument();
      });

      // Strong password enables submission
      await user.clear(passwordInput);
      await user.type(passwordInput, 'StrongPassword123');
      await waitFor(() => {
        expect(screen.getByText(/Strong/i)).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('2. Complete User Login Flow', () => {
    test('successful login redirects to dashboard', async () => {
      const { signIn } = await import('@/app/actions/auth');
      (signIn as any).mockResolvedValue({ 
        success: true 
      });

      const user = userEvent.setup();
      render(<LoginPage />);

      // User sees login form
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Continue your fragrance discovery journey')).toBeInTheDocument();

      // User enters credentials
      await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
      await user.type(screen.getByLabelText('Password'), 'SecurePassword123');

      // Form becomes submittable
      const submitButton = screen.getByRole('button', { name: /Sign In/ });
      expect(submitButton).not.toBeDisabled();

      // User submits
      await user.click(submitButton);

      // Loading state
      await waitFor(() => {
        expect(screen.getByText(/Signing you in/)).toBeInTheDocument();
      });

      // Redirect to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
        expect(mockRefresh).toHaveBeenCalled();
      });

      expect(signIn).toHaveBeenCalledWith('user@example.com', 'SecurePassword123');
    });

    test('handles invalid credentials with helpful guidance', async () => {
      const { signIn } = await import('@/app/actions/auth');
      (signIn as any).mockResolvedValue({ 
        error: 'Invalid email or password. Please check your credentials and try again.' 
      });

      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
      await user.type(screen.getByLabelText('Password'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /Sign In/ }));

      // Error with helpful guidance
      await waitFor(() => {
        expect(screen.getByText(/Invalid email or password/)).toBeInTheDocument();
        expect(screen.getByText(/reset your password/)).toBeInTheDocument();
      });

      // Password reset link is accessible
      const resetLink = screen.getByText(/reset your password/);
      expect(resetLink).toHaveAttribute('href', '/auth/reset');

      // Form remains usable
      expect(screen.getByLabelText('Email Address')).toHaveValue('user@example.com');
      expect(screen.getByRole('button', { name: /Sign In/ })).not.toBeDisabled();
    });

    test('remember me functionality works correctly', async () => {
      const { signIn } = await import('@/app/actions/auth');
      (signIn as any).mockResolvedValue({ success: true });

      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
      await user.type(screen.getByLabelText('Password'), 'SecurePassword123');

      // Check remember me
      const rememberCheckbox = screen.getByLabelText('Remember me on this device');
      await user.click(rememberCheckbox);
      expect(rememberCheckbox).toBeChecked();

      // Submit form
      await user.click(screen.getByRole('button', { name: /Sign In/ }));

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('user@example.com', 'SecurePassword123');
      });
    });
  });

  describe('3. Password Reset Flow', () => {
    test('complete password reset flow', async () => {
      const { resetPassword } = await import('@/app/actions/auth');
      (resetPassword as any).mockResolvedValue({ 
        message: 'Password reset email sent successfully.' 
      });

      const user = userEvent.setup();
      render(<PasswordResetPage />);

      // User sees reset form
      expect(screen.getByText(/Reset Your Password/)).toBeInTheDocument();
      expect(screen.getByText(/Enter your email address/)).toBeInTheDocument();

      // User enters email
      const emailInput = screen.getByLabelText('Email Address');
      await user.type(emailInput, 'user@example.com');

      // Form becomes submittable
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/ });
      expect(submitButton).not.toBeDisabled();

      // User submits
      await user.click(submitButton);

      // Success state
      await waitFor(() => {
        expect(screen.getByText(/Check your email/)).toBeInTheDocument();
        expect(screen.getByText(/user@example.com/)).toBeInTheDocument();
      });

      expect(resetPassword).toHaveBeenCalledWith('user@example.com');
    });
  });

  describe('4. Email Verification Callback', () => {
    test('email verification success shows celebration', () => {
      // Mock successful verification in URL params
      (useSearchParams as any).mockReturnValue({
        get: vi.fn().mockImplementation((param) => {
          if (param === 'type') return 'signup';
          if (param === 'verified') return 'true';
          return null;
        }),
      });

      render(<CallbackPage />);

      // Success celebration
      expect(screen.getByText(/Welcome to ScentMatch/)).toBeInTheDocument();
      expect(screen.getByText(/Your account has been verified/)).toBeInTheDocument();

      // Next steps
      expect(screen.getByText(/Start Discovering/)).toBeInTheDocument();
    });

    test('email verification error provides recovery options', () => {
      (useSearchParams as any).mockReturnValue({
        get: vi.fn().mockImplementation((param) => {
          if (param === 'error') return 'invalid_link';
          return null;
        }),
      });

      render(<CallbackPage />);

      // Error state
      expect(screen.getByText(/Verification Failed/)).toBeInTheDocument();
      expect(screen.getByText(/verification link has expired/)).toBeInTheDocument();

      // Recovery option
      expect(screen.getByText(/Try Again/)).toBeInTheDocument();
    });
  });

  describe('5. Cross-Page Navigation and State', () => {
    test('navigation between auth pages maintains context', () => {
      const { rerender } = render(<SignUpPage />);

      // Signup page has link to login
      const signInLink = screen.getByText('Sign in');
      expect(signInLink).toHaveAttribute('href', '/auth/signin');

      // Switch to login page
      rerender(<LoginPage />);

      // Login page has link back to signup
      const signUpLink = screen.getByText('Create your account');
      expect(signUpLink).toHaveAttribute('href', '/auth/signup');

      // Both maintain consistent branding
      expect(screen.getByText('ScentMatch')).toBeInTheDocument();
    });

    test('redirect parameter handling works correctly', () => {
      (useSearchParams as any).mockReturnValue({
        get: vi.fn().mockReturnValue('/premium-features'),
      });

      render(<LoginPage />);

      // Should handle redirect parameter
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      
      // Form should still function normally
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });
  });

  describe('6. Error Recovery and Resilience', () => {
    test('network errors are handled gracefully', async () => {
      const { signUp } = await import('@/app/actions/auth');
      (signUp as any).mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      render(<SignUpPage />);

      await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
      await user.type(screen.getByLabelText('Create Password'), 'SecurePassword123');

      const submitButton = screen.getByRole('button', { name: /Start My Fragrance Journey/ });
      
      // Submit should handle error gracefully
      await user.click(submitButton);

      // Form should remain functional after error
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      // User should be able to retry
      expect(screen.getByLabelText('Email Address')).toHaveValue('user@example.com');
      expect(screen.getByLabelText('Create Password')).toHaveValue('SecurePassword123');
    });

    test('form state persists during temporary errors', async () => {
      const { signIn } = await import('@/app/actions/auth');
      
      // First call fails, second succeeds
      (signIn as any).mockRejectedValueOnce(new Error('Temporary error'))
                     .mockResolvedValueOnce({ success: true });

      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
      await user.type(screen.getByLabelText('Password'), 'SecurePassword123');

      // First attempt fails
      await user.click(screen.getByRole('button', { name: /Sign In/ }));

      // Form data should be preserved
      await waitFor(() => {
        expect(screen.getByLabelText('Email Address')).toHaveValue('user@example.com');
        expect(screen.getByLabelText('Password')).toHaveValue('SecurePassword123');
      });

      // Second attempt should work
      await user.click(screen.getByRole('button', { name: /Sign In/ }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('7. Accessibility Integration', () => {
    test('screen reader can complete entire signup flow', async () => {
      const { signUp } = await import('@/app/actions/auth');
      (signUp as any).mockResolvedValue({ message: 'Account created!' });

      render(<SignUpPage />);

      // Screen reader should understand form structure
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeRequired();
      expect(screen.getByLabelText('Create Password')).toBeRequired();

      // All interactive elements should be accessible
      const submitButton = screen.getByRole('button', { name: /Start My Fragrance Journey/ });
      expect(submitButton).toHaveAccessibleName();

      // Navigation should be clear
      const brandLink = screen.getByText('ScentMatch').closest('a');
      expect(brandLink).toHaveAttribute('href', '/');
    });

    test('keyboard navigation covers complete flow', () => {
      render(<SignUpPage />);

      // All form elements should be keyboard accessible
      const focusableElements = [
        screen.getByLabelText('Email Address'),
        screen.getByLabelText('Create Password'),
        screen.getByRole('button', { name: /Start My Fragrance Journey/ }),
      ];

      focusableElements.forEach(element => {
        element.focus();
        expect(document.activeElement).toBe(element);
      });

      // Links should be keyboard accessible
      const signInLink = screen.getByText('Sign in');
      signInLink.focus();
      expect(document.activeElement).toBe(signInLink);
    });
  });

  describe('8. Performance Integration', () => {
    test('auth flows maintain good performance under load', async () => {
      const { signUp } = await import('@/app/actions/auth');
      (signUp as any).mockResolvedValue({ message: 'Success!' });

      const user = userEvent.setup();
      render(<SignUpPage />);

      // Simulate rapid interactions
      const startTime = performance.now();
      
      await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
      await user.type(screen.getByLabelText('Create Password'), 'SecurePassword123');
      
      const interactionTime = performance.now() - startTime;
      expect(interactionTime).toBeLessThan(500); // Should be responsive

      // Form submission should provide immediate feedback
      const submitTime = performance.now();
      await user.click(screen.getByRole('button', { name: /Start My Fragrance Journey/ }));

      await waitFor(() => {
        expect(screen.getByText(/Creating your account/)).toBeInTheDocument();
      });

      const feedbackTime = performance.now() - submitTime;
      expect(feedbackTime).toBeLessThan(100); // Immediate loading state
    });

    test('success states render efficiently', async () => {
      const { signUp } = await import('@/app/actions/auth');
      (signUp as any).mockResolvedValue({ message: 'Account created!' });

      const user = userEvent.setup();
      render(<SignUpPage />);

      await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
      await user.type(screen.getByLabelText('Create Password'), 'SecurePassword123');
      await user.click(screen.getByRole('button', { name: /Start My Fragrance Journey/ }));

      // Success state should render quickly
      const renderStart = performance.now();
      
      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      });

      const renderTime = performance.now() - renderStart;
      expect(renderTime).toBeLessThan(200); // Should render success state quickly
    });
  });

  describe('9. Brand Consistency Integration', () => {
    test('luxury brand experience maintained throughout flows', () => {
      const { rerender } = render(<SignUpPage />);

      // Check signup branding
      expect(screen.getByText('Discover Your Perfect Scent')).toHaveClass('text-gradient-primary');
      expect(screen.getByText('ScentMatch')).toHaveClass('text-gradient-primary');

      // Check login branding
      rerender(<LoginPage />);
      expect(screen.getByText('Welcome Back')).toHaveClass('text-gradient-primary');
      expect(screen.getByText('ScentMatch')).toHaveClass('text-gradient-primary');

      // Check consistent visual elements
      expect(document.querySelector('.card-elevated')).toBeTruthy();
      expect(document.querySelector('.shadow-strong')).toBeTruthy();
    });

    test('trust signals consistent across auth pages', () => {
      const { rerender } = render(<SignUpPage />);

      // Signup trust signals
      expect(screen.getByText('Secure & Private')).toBeInTheDocument();
      expect(screen.getByText('10,000+ Users')).toBeInTheDocument();

      // Login trust signals
      rerender(<LoginPage />);
      expect(screen.getByText('Secure Login')).toBeInTheDocument();
      expect(screen.getByText('10,000+ Members')).toBeInTheDocument();
    });
  });
});