import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { signUp } from '@/app/actions/auth'
import { clearRateLimitStore } from '@/lib/rate-limit'

// Test configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

describe('User Registration', () => {
  beforeEach(() => {
    // Clear rate limiting before each test
    clearRateLimitStore()
  })

  afterEach(async () => {
    // Clean up test users (if any were created)
    // This would typically use the service role to clean up test data
  })

  describe('Valid Registration Flow', () => {
    it('should create account with valid email and password', async () => {
      const testEmail = `test.${Date.now()}@scentmatch.com`
      const testPassword = 'TestPassword123!'

      const result = await signUp(testEmail, testPassword)

      expect(result.success).toBe(true)
      expect(result.message).toContain('verification link')
      expect(result.error).toBeUndefined()
    })

    it('should handle duplicate email registration gracefully', async () => {
      const testEmail = 'duplicate@scentmatch.com'
      const testPassword = 'TestPassword123!'

      // First registration
      await signUp(testEmail, testPassword)
      
      // Second registration with same email
      const result = await signUp(testEmail, testPassword)

      // Should not reveal that email already exists
      expect(result.error).toBeDefined()
      expect(result.error).not.toContain('already exists')
    })
  })

  describe('Registration Validation', () => {
    it('should reject invalid email formats', async () => {
      const invalidEmails = ['test', 'test@', '@domain.com', 'test@domain']
      const password = 'TestPassword123!'

      for (const email of invalidEmails) {
        const result = await signUp(email, password)
        expect(result.error).toBeDefined()
        expect(result.error).toContain('Invalid email')
      }
    })

    it('should enforce password strength requirements', async () => {
      const email = 'test@example.com'
      const weakPasswords = ['123', 'password', 'abc123', 'PASSWORD123', 'TestPassword']

      for (const password of weakPasswords) {
        const result = await signUp(email, password)
        expect(result.error).toBeDefined()
        expect(result.error).toContain('Password must contain')
      }
    })

    it('should accept strong passwords', async () => {
      const email = `strong.${Date.now()}@scentmatch.com`
      const strongPassword = 'StrongPass123!'

      const result = await signUp(email, strongPassword)
      expect(result.success).toBe(true)
    })
  })

  describe('Security Tests', () => {
    it('should prevent SQL injection in email field', async () => {
      const maliciousEmails = [
        "'; DROP TABLE users; --",
        "admin@test.com'; DELETE FROM auth.users; --"
      ]
      const password = 'TestPassword123!'

      for (const email of maliciousEmails) {
        const result = await signUp(email, password)
        expect(result.error).toBeDefined()
        // Should fail validation, not cause database issues
      }
    })

    it('should handle XSS attempts in inputs', async () => {
      const xssEmail = '<script>alert("xss")</script>@test.com'
      const password = 'TestPassword123!'

      const result = await signUp(xssEmail, password)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Invalid email')
    })

    it('should enforce rate limiting on registration', async () => {
      const email = 'ratelimit@test.com'
      const password = 'TestPassword123!'

      // Make multiple registration attempts
      const results = []
      for (let i = 0; i < 5; i++) {
        results.push(await signUp(`${email}${i}`, password))
      }

      // First 3 should work, then rate limiting should kick in
      expect(results[0].success || results[0].error).toBeDefined()
      expect(results[1].success || results[1].error).toBeDefined()
      expect(results[2].success || results[2].error).toBeDefined()
      
      // 4th attempt should be rate limited
      const rateLimitedResult = await signUp('ratelimited@test.com', password)
      expect(rateLimitedResult.error).toContain('Too many registration attempts')
    })
  })

  describe('Input Validation Edge Cases', () => {
    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(250) + '@test.com'
      const password = 'TestPassword123!'

      const result = await signUp(longEmail, password)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Email too long')
    })

    it('should handle very long passwords', async () => {
      const email = 'test@example.com'
      const longPassword = 'a'.repeat(130) + 'A1'

      const result = await signUp(email, longPassword)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Password too long')
    })

    it('should handle empty inputs', async () => {
      const result1 = await signUp('', 'TestPassword123!')
      expect(result1.error).toBeDefined()

      const result2 = await signUp('test@example.com', '')
      expect(result2.error).toBeDefined()
    })
  })
})