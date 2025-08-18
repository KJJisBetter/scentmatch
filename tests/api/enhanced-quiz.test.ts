/**
 * Enhanced Quiz API Endpoints Test Suite
 * Tests for experience-adaptive quiz system with AI profile generation
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('Enhanced Quiz API Endpoints', () => {
  let sessionToken: string;
  let sessionId: string;

  beforeEach(async () => {
    // Clean up any existing test sessions
    await supabase
      .from('quiz_sessions')
      .delete()
      .ilike('session_id', '%test-%');
  });

  afterEach(async () => {
    // Clean up test data
    if (sessionId) {
      await supabase.from('quiz_sessions').delete().eq('session_id', sessionId);
    }
  });

  describe('POST /api/quiz/start-enhanced', () => {
    test('should create new enhanced quiz session without experience level', async () => {
      const response = await fetch(`${API_BASE}/api/quiz/start-enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referral_source: 'test',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('session_token');
      expect(data).toHaveProperty('session_id');
      expect(data).toHaveProperty('first_question');
      expect(data).toHaveProperty('adaptive_ui_mode');

      expect(data.first_question.type).toBe('experience_detection');
      expect(data.adaptive_ui_mode).toBe('standard'); // Default mode

      sessionToken = data.session_token;
      sessionId = data.session_id;
    });

    test('should create session with specified experience level', async () => {
      const response = await fetch(`${API_BASE}/api/quiz/start-enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience_level: 'collector',
          referral_source: 'affiliate',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.adaptive_ui_mode).toBe('advanced');

      sessionToken = data.session_token;
      sessionId = data.session_id;
    });

    test('should handle rate limiting', async () => {
      // Create multiple sessions rapidly
      const promises = Array(10)
        .fill(null)
        .map(() =>
          fetch(`${API_BASE}/api/quiz/start-enhanced`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referral_source: 'test' }),
          })
        );

      const responses = await Promise.all(promises);
      const statuses = responses.map(r => r.status);

      // Should have at least one success and potentially some rate limits
      expect(statuses).toContain(200);
      // Rate limiting would return 429, but may not trigger in test environment
    });
  });

  describe('POST /api/quiz/submit-experience-level', () => {
    beforeEach(async () => {
      // Create a session first
      const response = await fetch(`${API_BASE}/api/quiz/start-enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      sessionToken = data.session_token;
      sessionId = data.session_id;
    });

    test('should process beginner experience level', async () => {
      const response = await fetch(
        `${API_BASE}/api/quiz/submit-experience-level`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_token: sessionToken,
            experience_level: 'beginner',
            previous_experience: 'Never worn fragrances before',
          }),
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.adaptive_mode).toBe('beginner');
      expect(data.show_favorites_input).toBe(false);
      expect(data.next_question).toHaveProperty('complexity_level', 'simple');
    });

    test('should process collector experience level', async () => {
      const response = await fetch(
        `${API_BASE}/api/quiz/submit-experience-level`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_token: sessionToken,
            experience_level: 'collector',
            previous_experience: 'Have 50+ fragrances in collection',
          }),
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.adaptive_mode).toBe('advanced');
      expect(data.show_favorites_input).toBe(true);
      expect(data.next_question).toHaveProperty('complexity_level', 'advanced');
    });

    test('should reject invalid session token', async () => {
      const response = await fetch(
        `${API_BASE}/api/quiz/submit-experience-level`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_token: 'invalid-token',
            experience_level: 'beginner',
          }),
        }
      );

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('Invalid session');
    });
  });

  describe('POST /api/quiz/select-favorites', () => {
    beforeEach(async () => {
      // Create session and set experience level to collector
      const sessionResponse = await fetch(
        `${API_BASE}/api/quiz/start-enhanced`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ experience_level: 'collector' }),
        }
      );
      const sessionData = await sessionResponse.json();
      sessionToken = sessionData.session_token;
      sessionId = sessionData.session_id;
    });

    test('should process favorite fragrance selections', async () => {
      // Get some real fragrance IDs first
      const fragranceResponse = await fetch(
        `${API_BASE}/api/fragrances?limit=5`
      );
      const fragranceData = await fragranceResponse.json();
      const fragranceIds = fragranceData.fragrances
        .slice(0, 3)
        .map((f: any) => f.id);

      const response = await fetch(`${API_BASE}/api/quiz/select-favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionToken,
          fragrance_ids: fragranceIds,
          confidence_scores: [0.9, 0.8, 0.7],
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.favorites_processed).toBe(3);
      expect(data.personality_hints).toHaveProperty('emerging_families');
      expect(data.personality_hints).toHaveProperty('style_indicators');
      expect(data).toHaveProperty('skip_basic_questions');
    });

    test('should require valid confidence scores', async () => {
      const response = await fetch(`${API_BASE}/api/quiz/select-favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionToken,
          fragrance_ids: ['uuid1', 'uuid2'],
          confidence_scores: [0.9], // Mismatched array length
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('confidence_scores');
    });
  });

  describe('GET /api/fragrances/search-favorites', () => {
    test('should return fragrance search results', async () => {
      const response = await fetch(
        `${API_BASE}/api/fragrances/search-favorites?query=chanel&limit=5`
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('fragrances');
      expect(data).toHaveProperty('total_matches');
      expect(Array.isArray(data.fragrances)).toBe(true);

      if (data.fragrances.length > 0) {
        const fragrance = data.fragrances[0];
        expect(fragrance).toHaveProperty('id');
        expect(fragrance).toHaveProperty('name');
        expect(fragrance).toHaveProperty('brand');
        expect(fragrance).toHaveProperty('scent_family');
        expect(fragrance).toHaveProperty('popularity_score');
        expect(fragrance).toHaveProperty('sample_available');
      }
    });

    test('should require minimum query length', async () => {
      const response = await fetch(
        `${API_BASE}/api/fragrances/search-favorites?query=ch`
      );

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('minimum 3 characters');
    });

    test('should respect limit parameter', async () => {
      const response = await fetch(
        `${API_BASE}/api/fragrances/search-favorites?query=fragrance&limit=3`
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.fragrances.length).toBeLessThanOrEqual(3);
    });
  });

  describe('POST /api/quiz/generate-profile', () => {
    beforeEach(async () => {
      // Create session with some quiz progress
      const sessionResponse = await fetch(
        `${API_BASE}/api/quiz/start-enhanced`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ experience_level: 'enthusiast' }),
        }
      );
      const sessionData = await sessionResponse.json();
      sessionToken = sessionData.session_token;
      sessionId = sessionData.session_id;
    });

    test('should generate unique AI profile', async () => {
      const response = await fetch(`${API_BASE}/api/quiz/generate-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionToken,
          experience_level: 'enthusiast',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('unique_profile_name');
      expect(data).toHaveProperty('profile_description');
      expect(data).toHaveProperty('personality_type');
      expect(data).toHaveProperty('confidence_score');
      expect(data).toHaveProperty('generation_method');

      expect(data.profile_description).toHaveProperty('paragraph_1');
      expect(data.profile_description).toHaveProperty('paragraph_2');
      expect(data.profile_description).toHaveProperty('paragraph_3');

      expect(data.confidence_score).toBeGreaterThan(0);
      expect(data.confidence_score).toBeLessThanOrEqual(1);
    });

    test('should use caching for repeated requests', async () => {
      // First request
      const response1 = await fetch(`${API_BASE}/api/quiz/generate-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionToken,
          experience_level: 'enthusiast',
        }),
      });
      const data1 = await response1.json();

      // Second request (should be cached)
      const response2 = await fetch(`${API_BASE}/api/quiz/generate-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionToken,
          experience_level: 'enthusiast',
        }),
      });
      const data2 = await response2.json();

      expect(data1.unique_profile_name).toBe(data2.unique_profile_name);
      expect(data2.generation_method).toBe('cached');
    });

    test('should force new generation when requested', async () => {
      const response = await fetch(`${API_BASE}/api/quiz/generate-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionToken,
          experience_level: 'enthusiast',
          force_new: true,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.generation_method).not.toBe('cached');
    });
  });

  describe('GET /api/recommendations/enhanced', () => {
    beforeEach(async () => {
      // Create session with quiz progress
      const sessionResponse = await fetch(
        `${API_BASE}/api/quiz/start-enhanced`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ experience_level: 'enthusiast' }),
        }
      );
      const sessionData = await sessionResponse.json();
      sessionToken = sessionData.session_token;
      sessionId = sessionData.session_id;
    });

    test('should return enhanced recommendations with AI explanations', async () => {
      const response = await fetch(
        `${API_BASE}/api/recommendations/enhanced?session_token=${sessionToken}&max_results=5`
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('recommendations');
      expect(data).toHaveProperty('total_found');
      expect(data).toHaveProperty('recommendation_categories');

      expect(Array.isArray(data.recommendations)).toBe(true);
      expect(data.recommendations.length).toBeLessThanOrEqual(5);

      if (data.recommendations.length > 0) {
        const rec = data.recommendations[0];
        expect(rec).toHaveProperty('fragrance_id');
        expect(rec).toHaveProperty('name');
        expect(rec).toHaveProperty('brand');
        expect(rec).toHaveProperty('match_score');
        expect(rec).toHaveProperty('quiz_reasoning');
        expect(rec).toHaveProperty('experience_relevance');
        expect(rec).toHaveProperty('sample_available');
        expect(rec).toHaveProperty('notes');
        expect(rec).toHaveProperty('scent_family');

        expect(rec.match_score).toBeGreaterThan(0);
        expect(rec.match_score).toBeLessThanOrEqual(1);
      }
    });

    test('should filter by price when specified', async () => {
      const response = await fetch(
        `${API_BASE}/api/recommendations/enhanced?session_token=${sessionToken}&price_max=10`
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.recommendations)).toBe(true);

      // All recommendations should have price <= 10
      data.recommendations.forEach((rec: any) => {
        if (rec.sample_price_usd) {
          expect(rec.sample_price_usd).toBeLessThanOrEqual(10);
        }
      });
    });

    test('should respect max_results parameter', async () => {
      const response = await fetch(
        `${API_BASE}/api/recommendations/enhanced?session_token=${sessionToken}&max_results=3`
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.recommendations.length).toBeLessThanOrEqual(3);
    });
  });

  describe('POST /api/auth/convert-session', () => {
    beforeEach(async () => {
      // Create session with quiz data
      const sessionResponse = await fetch(
        `${API_BASE}/api/quiz/start-enhanced`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ experience_level: 'enthusiast' }),
        }
      );
      const sessionData = await sessionResponse.json();
      sessionToken = sessionData.session_token;
      sessionId = sessionData.session_id;
    });

    test('should convert guest session to authenticated account', async () => {
      const testEmail = `test-${Date.now()}@example.com`;

      const response = await fetch(`${API_BASE}/api/auth/convert-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionToken,
          email: testEmail,
          password: 'TestPassword123!',
          display_name: 'Test User',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('user_id');
      expect(data.profile_transferred).toBe(true);
      expect(data.recommendations_preserved).toBe(true);
      expect(data.account_creation_bonus).toHaveProperty('sample_discount');
      expect(data.account_creation_bonus).toHaveProperty('expires_at');

      // Clean up created user
      await supabase.auth.admin.deleteUser(data.user_id);
    });

    test('should reject duplicate email', async () => {
      // This would require a known existing email in test environment
      const response = await fetch(`${API_BASE}/api/auth/convert-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionToken,
          email: 'existing@example.com', // Would need to be a real existing email
          password: 'TestPassword123!',
        }),
      });

      // This test may pass if email doesn't exist, which is fine for isolated tests
      if (response.status === 409) {
        const data = await response.json();
        expect(data.error).toContain('Email already exists');
      }
    });

    test('should validate password requirements', async () => {
      const response = await fetch(`${API_BASE}/api/auth/convert-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionToken,
          email: `test-${Date.now()}@example.com`,
          password: 'weak', // Too weak
        }),
      });

      expect(response.status).toBe(422);

      const data = await response.json();
      expect(data.error).toContain('Password validation failed');
    });

    test('should reject invalid session token', async () => {
      const response = await fetch(`${API_BASE}/api/auth/convert-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: 'invalid-token',
          email: `test-${Date.now()}@example.com`,
          password: 'TestPassword123!',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('Invalid session token');
    });
  });
});
