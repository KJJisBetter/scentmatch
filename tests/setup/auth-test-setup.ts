import { vi } from 'vitest';
import { mockSupabaseClient } from '../mocks/supabase';
import {
  mockUser,
  mockSession,
  mockAuthResponse,
  mockAuthError,
  authStateChanges,
} from '../fixtures/auth';

/**
 * Authentication test setup utilities
 * Provides helper functions for setting up auth-related test scenarios
 */

export class AuthTestSetup {
  private static instance: AuthTestSetup;

  static getInstance(): AuthTestSetup {
    if (!AuthTestSetup.instance) {
      AuthTestSetup.instance = new AuthTestSetup();
    }
    return AuthTestSetup.instance;
  }

  /**
   * Set up successful authentication scenario
   */
  setupSuccessfulAuth() {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
      mockAuthResponse
    );
    mockSupabaseClient.auth.signUp.mockResolvedValue(mockAuthResponse);
  }

  /**
   * Set up failed authentication scenario
   */
  setupFailedAuth() {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockAuthError);
    mockSupabaseClient.auth.signUp.mockResolvedValue(mockAuthError);
  }

  /**
   * Set up authentication loading state
   */
  setupAuthLoading() {
    const pendingPromise = new Promise(() => {}); // Never resolves

    mockSupabaseClient.auth.getSession.mockReturnValue(pendingPromise);
    mockSupabaseClient.auth.getUser.mockReturnValue(pendingPromise);
  }

  /**
   * Set up auth state change listener
   */
  setupAuthStateChangeListener(callback?: Function) {
    const mockUnsubscribe = vi.fn();

    mockSupabaseClient.auth.onAuthStateChange.mockImplementation(cb => {
      if (callback) {
        // Immediately call the callback with test data
        setTimeout(() => {
          cb(
            authStateChanges.signedIn.event,
            authStateChanges.signedIn.session
          );
        }, 0);
      }

      return {
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe,
          },
        },
      };
    });

    return { mockUnsubscribe };
  }

  /**
   * Simulate auth state change
   */
  simulateAuthStateChange(
    event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED'
  ) {
    const authChange =
      authStateChanges[
        event.toLowerCase().replace('_', '') as keyof typeof authStateChanges
      ];

    // Get the callback from the last call to onAuthStateChange
    const calls = mockSupabaseClient.auth.onAuthStateChange.mock.calls;
    if (calls.length > 0) {
      const callback = calls[calls.length - 1][0];
      callback(authChange.event, authChange.session);
    }
  }

  /**
   * Set up password reset scenario
   */
  setupPasswordReset(shouldSucceed = true) {
    if (shouldSucceed) {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });
    } else {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: { message: 'Email not found', status: 404 },
      });
    }
  }

  /**
   * Set up email verification scenario
   */
  setupEmailVerification(shouldSucceed = true) {
    if (shouldSucceed) {
      mockSupabaseClient.auth.verifyOtp.mockResolvedValue(mockAuthResponse);
    } else {
      mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid OTP', status: 400 },
      });
    }
  }

  /**
   * Set up social authentication scenario
   */
  setupSocialAuth(
    provider: 'google' | 'apple' | 'github',
    shouldSucceed = true
  ) {
    if (shouldSucceed) {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: {
          provider,
          url: `https://oauth.${provider}.com/auth`,
        },
        error: null,
      });
    } else {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { provider, url: null },
        error: { message: 'OAuth setup failed', status: 500 },
      });
    }
  }

  /**
   * Set up session refresh scenario
   */
  setupSessionRefresh(shouldSucceed = true) {
    if (shouldSucceed) {
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });
    } else {
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Refresh token invalid', status: 401 },
      });
    }
  }

  /**
   * Set up sign out scenario
   */
  setupSignOut(shouldSucceed = true) {
    if (shouldSucceed) {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });
    } else {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed', status: 500 },
      });
    }
  }

  /**
   * Reset all auth mocks to default state
   */
  resetAuthMocks() {
    vi.clearAllMocks();

    // Set default return values
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });

    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });

    mockSupabaseClient.auth.signOut.mockResolvedValue({
      error: null,
    });
  }

  /**
   * Create a mock user with custom properties
   */
  createMockUser(overrides: Partial<typeof mockUser> = {}) {
    return {
      ...mockUser,
      ...overrides,
    };
  }

  /**
   * Create a mock session with custom properties
   */
  createMockSession(overrides: Partial<typeof mockSession> = {}) {
    return {
      ...mockSession,
      ...overrides,
    };
  }

  /**
   * Validate authentication state
   */
  validateAuthState(expectedUser: any, expectedSession: any) {
    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
    expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();

    // Additional validation logic can be added here
    return true;
  }
}

// Export singleton instance
export const authTestSetup = AuthTestSetup.getInstance();

// Export commonly used setup functions for convenience
export const {
  setupSuccessfulAuth,
  setupFailedAuth,
  setupAuthLoading,
  setupAuthStateChangeListener,
  simulateAuthStateChange,
  setupPasswordReset,
  setupEmailVerification,
  setupSocialAuth,
  setupSessionRefresh,
  setupSignOut,
  resetAuthMocks,
  createMockUser,
  createMockSession,
  validateAuthState,
} = authTestSetup;
