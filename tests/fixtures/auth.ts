/**
 * Test fixtures for authentication flows
 * These fixtures provide consistent test data for authentication-related tests
 */

export const mockUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  created_at: '2025-08-14T00:00:00.000Z',
  updated_at: '2025-08-14T00:00:00.000Z',
  email_confirmed_at: '2025-08-14T00:00:00.000Z',
  last_sign_in_at: '2025-08-14T00:00:00.000Z',
  app_metadata: {
    provider: 'email',
    providers: ['email'],
  },
  user_metadata: {
    name: 'Test User',
  },
  aud: 'authenticated',
  role: 'authenticated',
};

export const mockSession = {
  access_token: 'mock-access-token-123',
  refresh_token: 'mock-refresh-token-456',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: mockUser,
};

export const mockAuthResponse = {
  data: {
    user: mockUser,
    session: mockSession,
  },
  error: null,
};

export const mockAuthError = {
  data: {
    user: null,
    session: null,
  },
  error: {
    message: 'Invalid credentials',
    status: 400,
  },
};

export const validTestCredentials = {
  email: 'test@example.com',
  password: 'SecurePassword123!',
};

export const invalidTestCredentials = {
  email: 'invalid@example.com',
  password: 'wrongpassword',
};

export const weakPasswordCredentials = {
  email: 'test@example.com',
  password: '123',
};

export const invalidEmailCredentials = {
  email: 'not-an-email',
  password: 'SecurePassword123!',
};

export const testUserProfile = {
  id: mockUser.id,
  email: mockUser.email,
  full_name: 'Test User',
  avatar_url: null,
  preferences: {
    emailNotifications: true,
    preferredFragranceTypes: ['woody', 'citrus'],
  },
  created_at: '2025-08-14T00:00:00.000Z',
  updated_at: '2025-08-14T00:00:00.000Z',
};

export const authStateChanges = {
  signedIn: {
    event: 'SIGNED_IN',
    session: mockSession,
  },
  signedOut: {
    event: 'SIGNED_OUT',
    session: null,
  },
  tokenRefreshed: {
    event: 'TOKEN_REFRESHED',
    session: mockSession,
  },
  userUpdated: {
    event: 'USER_UPDATED',
    session: mockSession,
  },
};

export const passwordResetRequest = {
  email: 'test@example.com',
};

export const passwordResetError = {
  error: {
    message: 'Email not found',
    status: 404,
  },
};

export const socialAuthProviders = ['google', 'apple', 'github'] as const;

export const mockSocialAuthResponse = {
  data: {
    provider: 'google',
    url: 'https://mock-oauth-url.com/auth',
  },
  error: null,
};
