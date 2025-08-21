import { describe, it, expect, beforeEach } from 'vitest';
import { signUp, signIn, resetPassword } from '@/app/actions/auth';
import { clearMemoryRateLimitStore } from '@/lib/rate-limit';

describe('Authentication Security', () => {
  beforeEach(() => {
    // Clear rate limiting before each test
    clearMemoryRateLimitStore();
  });

  describe('Input Sanitization', () => {
    it('should prevent SQL injection in all auth functions', async () => {
      const sqlPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin@test.com'; DELETE FROM auth.users; --",
        "' UNION SELECT * FROM users; --",
      ];

      for (const payload of sqlPayloads) {
        // Test signup
        const signupResult = await signUp(payload, 'TestPassword123!');
        expect(signupResult.error).toBeDefined();
        expect(signupResult.error).toContain('Invalid email');

        // Test signin
        const signinResult = await signIn(payload, 'password');
        expect(signinResult.error).toBeDefined();

        // Test password reset
        const resetResult = await resetPassword(payload);
        expect(resetResult.error).toBeDefined();
        expect(resetResult.error).toContain('valid email');
      }
    });

    it('should prevent XSS attacks in all auth functions', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>@test.com',
        '<img src=x onerror=alert("xss")>@test.com',
        'javascript:alert("xss")@test.com',
        '"><script>alert("xss")</script>@test.com',
      ];

      for (const payload of xssPayloads) {
        // Test signup
        const signupResult = await signUp(payload, 'TestPassword123!');
        expect(signupResult.error).toBeDefined();
        expect(signupResult.error).toContain('Invalid email');

        // Test signin
        const signinResult = await signIn(payload, 'password');
        expect(signinResult.error).toBeDefined();

        // Test password reset
        const resetResult = await resetPassword(payload);
        expect(resetResult.error).toBeDefined();
        expect(resetResult.error).toContain('valid email');
      }
    });

    it('should handle NoSQL injection attempts', async () => {
      const nosqlPayloads = [
        '{"$ne": ""}',
        '{"$regex": ".*"}',
        '{"$where": "this.email"}',
        '{"$gt": ""}',
      ];

      for (const payload of nosqlPayloads) {
        const signupResult = await signUp(payload, 'TestPassword123!');
        expect(signupResult.error).toBeDefined();
        expect(signupResult.error).toContain('Invalid email');
      }
    });
  });

  describe('Rate Limiting Security', () => {
    it('should protect against signup brute force', async () => {
      const email = 'brute@force.com';

      // Exhaust rate limit
      for (let i = 0; i < 3; i++) {
        await signUp(`${email}${i}`, 'TestPassword123!');
      }

      // Next attempt should be blocked
      const result = await signUp('blocked@test.com', 'TestPassword123!');
      expect(result.error).toContain('Too many registration attempts');
    });

    it('should protect against login brute force', async () => {
      const email = 'brutelogin@test.com';

      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        await signIn(email, 'wrongpassword');
      }

      // Next attempt should be blocked
      const result = await signIn(email, 'wrongpassword');
      expect(result.error).toContain('Too many failed login attempts');
    });

    it('should protect against password reset brute force', async () => {
      const email = 'brutereset@test.com';

      // Exhaust rate limit
      for (let i = 0; i < 3; i++) {
        await resetPassword(email);
      }

      // Next attempt should be blocked
      const result = await resetPassword(email);
      expect(result.error).toContain('Too many password reset requests');
    });
  });

  describe('Input Validation Security', () => {
    it('should enforce maximum input lengths', async () => {
      const longEmail = 'a'.repeat(300) + '@test.com';
      const longPassword = 'A'.repeat(150) + 'a1!';

      // Test signup with long inputs
      const signupResult = await signUp(longEmail, longPassword);
      expect(signupResult.error).toBeDefined();
      expect(signupResult.error).toMatch(/Email too long|Password too long/);

      // Test signin with long email
      const signinResult = await signIn(longEmail, 'password');
      expect(signinResult.error).toBeDefined();

      // Test reset with long email
      const resetResult = await resetPassword(longEmail);
      expect(resetResult.error).toBeDefined();
      expect(resetResult.error).toContain('Email too long');
    });

    it('should handle null bytes and special characters', async () => {
      const maliciousInputs = [
        'test@example.com\0',
        'test@example.com\r\n',
        'test@example.com\x00',
        'test@example.com%00',
      ];

      for (const input of maliciousInputs) {
        const result = await signUp(input, 'TestPassword123!');
        expect(result.error).toBeDefined();
      }
    });

    it('should validate unicode normalization', async () => {
      // Test unicode variants that might bypass validation
      const unicodeEmails = [
        'tëst@example.com',
        'test@ëxample.com',
        'test@example.cöm',
      ];

      for (const email of unicodeEmails) {
        const result = await signUp(email, 'TestPassword123!');
        // Should either succeed or fail gracefully
        expect(result.success || result.error).toBeDefined();
        if (result.error) {
          expect(result.error).not.toContain('undefined');
        }
      }
    });
  });

  describe('Error Message Security', () => {
    it('should not reveal user enumeration information', async () => {
      const nonExistentEmail = 'nonexistent@example.com';
      const existingEmail = 'existing@example.com';

      // Create a user first (this will fail in test env, but test the pattern)
      await signUp(existingEmail, 'TestPassword123!');

      // Try to sign in with both emails
      const result1 = await signIn(nonExistentEmail, 'wrongpassword');
      const result2 = await signIn(existingEmail, 'wrongpassword');

      // Both should return similar generic error messages
      expect(result1.error).toBeDefined();
      expect(result2.error).toBeDefined();

      // Errors should be generic, not reveal user existence
      expect(result1.error).not.toContain('user not found');
      expect(result1.error).not.toContain('does not exist');
      expect(result2.error).not.toContain('wrong password');
      expect(result2.error).not.toContain('user exists');
    });

    it('should provide consistent password reset messages', async () => {
      const nonExistentEmail = 'doesnotexist@example.com';
      const malformedEmail = 'notanemail';

      const result1 = await resetPassword(nonExistentEmail);
      const result2 = await resetPassword(malformedEmail);

      // Valid email should get success message
      expect(result1.success).toBe(true);
      expect(result1.message).toContain('password reset link');

      // Invalid email should get validation error
      expect(result2.error).toBeDefined();
      expect(result2.error).toContain('valid email');
    });
  });

  describe('Password Security', () => {
    it('should enforce strong password requirements', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'Password',
        'PASSWORD',
        'password123',
        'PASSWORD123',
        'Passw0rd',
        '12345678',
        'abcdefgh',
        'ABCDEFGH',
      ];

      for (const password of weakPasswords) {
        const result = await signUp('test@example.com', password);
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Password must contain');
      }
    });

    it('should accept strong passwords', async () => {
      const strongPasswords = [
        'StrongPassword123!',
        'MySecureP@ssw0rd',
        'Complex1Password!',
        'Valid8Password@',
      ];

      for (const password of strongPasswords) {
        const email = `strong${Date.now()}@example.com`;
        const result = await signUp(email, password);
        // Should succeed (or fail due to env, not password validation)
        if (result.error) {
          expect(result.error).not.toContain('Password must contain');
        }
      }
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle edge case input lengths', async () => {
      // Test minimum valid inputs
      const minEmail = 'a@b.co';
      const minPassword = 'Aa1Bb2Cc';

      const result1 = await signUp(minEmail, minPassword);
      if (result1.error) {
        expect(result1.error).not.toContain('too short');
      }

      // Test maximum valid inputs
      const maxEmail = 'a'.repeat(244) + '@test.com'; // 255 chars total
      const maxPassword = 'A'.repeat(119) + 'a1234567'; // 128 chars total

      const result2 = await signUp(maxEmail, maxPassword);
      if (result2.error) {
        expect(result2.error).not.toContain('Password must contain');
      }
    });

    it('should handle empty and whitespace inputs', async () => {
      const emptyTests = [
        { email: '', password: 'ValidPassword123!' },
        { email: 'test@example.com', password: '' },
        { email: '   ', password: 'ValidPassword123!' },
        { email: 'test@example.com', password: '   ' },
        { email: '\t\n', password: 'ValidPassword123!' },
      ];

      for (const test of emptyTests) {
        const result = await signUp(test.email, test.password);
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Race Condition Protection', () => {
    it('should handle concurrent requests safely', async () => {
      const email = 'concurrent@test.com';
      const password = 'TestPassword123!';

      // Send multiple concurrent requests
      const promises = Array(5)
        .fill(null)
        .map(() => signUp(`${email}${Math.random()}`, password));

      const results = await Promise.all(promises);

      // All requests should complete without errors or crashes
      results.forEach(result => {
        expect(result.success || result.error).toBeDefined();
        if (result.error) {
          expect(result.error).not.toContain('undefined');
          expect(result.error).not.toContain('null');
        }
      });
    });
  });
});
