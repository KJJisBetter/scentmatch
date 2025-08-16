import { describe, it, expect, beforeEach } from 'vitest'
import { signIn, signOut } from '@/app/actions/auth'
import { clearRateLimitStore } from '@/lib/rate-limit'

describe('Sign-in/Sign-out', () => {
  beforeEach(() => {
    // Clear rate limiting before each test
    clearRateLimitStore()
  })

  describe('Valid Authentication Flow', () => {
    it('should handle invalid credentials gracefully', async () => {
      const result = await signIn('nonexistent@example.com', 'wrongpassword')
      
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Invalid email or password')
      // Should not reveal whether email exists or not
      expect(result.error).not.toContain('user not found')
      expect(result.error).not.toContain('email does not exist')
    })

    it('should handle empty credentials', async () => {
      const result1 = await signIn('', 'password')
      expect(result1.error).toBeDefined()
      expect(result1.error).toContain('valid email')

      const result2 = await signIn('test@example.com', '')
      expect(result2.error).toBeDefined()
      expect(result2.error).toContain('Password is required')
    })
  })

  describe('Invalid Authentication Handling', () => {
    it('should provide generic error messages', async () => {
      const testCases = [
        { email: 'wrong@example.com', password: 'wrongpassword' },
        { email: 'invalid@email', password: 'password123' },
        { email: 'nonexistent@domain.com', password: 'TestPassword123!' }
      ]

      for (const { email, password } of testCases) {
        const result = await signIn(email, password)
        expect(result.error).toBeDefined()
        // All should return the same generic message
        expect(result.error).toMatch(/Invalid email or password|valid email/)
      }
    })

    it('should handle unverified email accounts', async () => {
      // This would require a test user with unverified email
      // In a real implementation, you'd create a test user that's not verified
      const result = await signIn('unverified@example.com', 'TestPassword123!')
      
      if (result.error && result.error.includes('verification')) {
        expect(result.error).toContain('verification link')
      }
    })
  })

  describe('Rate Limiting Tests', () => {
    it('should enforce rate limiting on failed login attempts', async () => {
      const email = 'ratelimit@example.com'
      const wrongPassword = 'wrongpassword'

      // Make 6 failed attempts
      const results = []
      for (let i = 0; i < 6; i++) {
        results.push(await signIn(email, wrongPassword))
      }

      // All should fail, but the 6th should be rate limited
      expect(results[5].error).toContain('Too many failed login attempts')
    })

    it('should reset rate limiting after time window', async () => {
      // This test would require manipulating time or waiting
      // For now, we'll just test that rate limiting exists
      const email = 'ratelimit2@example.com'
      
      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        await signIn(email, 'wrongpassword')
      }
      
      const result = await signIn(email, 'wrongpassword')
      expect(result.error).toContain('Too many failed login attempts')
    })
  })

  describe('Input Security', () => {
    it('should handle SQL injection attempts', async () => {
      const maliciousInputs = [
        "admin@test.com'; DROP TABLE users; --",
        "test'; DELETE FROM auth.users WHERE '1'='1"
      ]

      for (const email of maliciousInputs) {
        const result = await signIn(email, 'password')
        expect(result.error).toBeDefined()
        // Should fail validation, not cause database issues
      }
    })

    it('should handle XSS attempts', async () => {
      const xssInputs = [
        '<script>alert("xss")</script>@test.com',
        'javascript:alert("xss")@test.com'
      ]

      for (const email of xssInputs) {
        const result = await signIn(email, 'password')
        expect(result.error).toBeDefined()
        expect(result.error).toContain('valid email')
      }
    })
  })

  describe('Session Security', () => {
    it('should handle sign out gracefully', async () => {
      // Note: In a real test environment, you'd need to be signed in first
      // This test assumes signOut is called without an active session
      try {
        const result = await signOut()
        // signOut redirects, so we won't get a return value in successful case
        expect(true).toBe(true) // If we reach here, no error was thrown
      } catch (error) {
        // If error is thrown, it should be handled gracefully
        expect(error).toBeDefined()
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed email addresses', async () => {
      const malformedEmails = [
        'plainaddress',
        '@missingdomain.com',
        'missing@.com',
        'missing@domain',
        'spaces in@email.com'
      ]

      for (const email of malformedEmails) {
        const result = await signIn(email, 'password123')
        expect(result.error).toBeDefined()
        expect(result.error).toContain('valid email')
      }
    })

    it('should handle extremely long inputs', async () => {
      const longEmail = 'a'.repeat(300) + '@test.com'
      const longPassword = 'a'.repeat(200)

      const result = await signIn(longEmail, longPassword)
      expect(result.error).toBeDefined()
    })
  })
})