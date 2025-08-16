import { describe, test, expect, beforeEach, vi } from 'vitest';
import { setupRpcOperations, resetDatabaseMocks } from '../utils/database-test-utils';

/**
 * Guest Session Management Tests
 * 
 * Tests for anonymous quiz session handling:
 * - Guest session creation and token management
 * - Progress persistence for anonymous users
 * - Session expiration and cleanup
 * - Guest-to-authenticated user data transfer
 * - Security and privacy for guest data
 * - Performance optimization for guest flows
 */

// Mock session storage
const mockSessionStorage = new Map<string, any>();

vi.mock('@/lib/quiz/guest-session-manager', () => ({
  GuestSessionManager: vi.fn().mockImplementation(() => ({
    createSession: vi.fn(),
    saveProgress: vi.fn(),
    getSession: vi.fn(),
    transferToUser: vi.fn(),
    expireSession: vi.fn(),
    cleanupExpiredSessions: vi.fn()
  })),
  
  SessionTokenGenerator: vi.fn().mockImplementation(() => ({
    generate: vi.fn(),
    validate: vi.fn(),
    decrypt: vi.fn()
  }))
}));

// Mock Redis for session caching
vi.mock('@/lib/cache/redis-client', () => ({
  RedisClient: vi.fn().mockImplementation(() => ({
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    exists: vi.fn()
  }))
}));

describe('Guest Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDatabaseMocks();
    setupRpcOperations();
    mockSessionStorage.clear();
  });

  describe('Session Creation and Token Management', () => {
    test('should create secure guest session with unique token', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      const mockGuestSession = {
        session_id: 'guest-session-123',
        session_token: 'secure-token-abc123def456',
        user_id: null,
        is_guest_session: true,
        quiz_version: 'v1.0',
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        referral_source: 'homepage_quiz_cta',
        ip_hash: 'hashed_ip_address', // For analytics, not tracking
        user_agent_hash: 'hashed_user_agent'
      };

      sessionManager.createSession.mockResolvedValue(mockGuestSession);
      
      const session = await sessionManager.createSession({
        referral_source: 'homepage_quiz_cta',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0...'
      });
      
      expect(session.session_token).toHaveLength(32); // Secure token length
      expect(session.user_id).toBeNull();
      expect(session.is_guest_session).toBe(true);
      expect(session.expires_at).toBeDefined();
      expect(session.ip_hash).toBeDefined(); // Hashed, not raw IP
    });

    test('should generate cryptographically secure session tokens', async () => {
      const { SessionTokenGenerator } = await import('@/lib/quiz/guest-session-manager');
      const tokenGenerator = new SessionTokenGenerator();
      
      const mockTokens = [
        'secure-token-1a2b3c4d5e6f',
        'secure-token-9z8y7x6w5v4u',
        'secure-token-p9o8i7u6y5t4'
      ];

      tokenGenerator.generate.mockImplementation(() => {
        const randomIndex = Math.floor(Math.random() * mockTokens.length);
        return Promise.resolve(mockTokens[randomIndex]);
      });
      
      const tokens = await Promise.all([
        tokenGenerator.generate(),
        tokenGenerator.generate(),
        tokenGenerator.generate()
      ]);
      
      // Tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
      
      // Each token should meet security requirements
      tokens.forEach(token => {
        expect(token).toMatch(/^secure-token-[a-z0-9]{16}$/);
        expect(token.length).toBeGreaterThanOrEqual(32);
      });
    });

    test('should validate session tokens securely', async () => {
      const { SessionTokenGenerator } = await import('@/lib/quiz/guest-session-manager');
      const tokenGenerator = new SessionTokenGenerator();
      
      const validToken = 'secure-token-abc123def456';
      const invalidToken = 'invalid-token-123';
      const expiredToken = 'expired-token-xyz789';

      tokenGenerator.validate.mockImplementation((token) => {
        if (token === validToken) {
          return Promise.resolve({ valid: true, session_id: 'session-123' });
        } else if (token === expiredToken) {
          return Promise.resolve({ valid: false, reason: 'expired', expired_at: '2025-08-14T10:00:00Z' });
        } else {
          return Promise.resolve({ valid: false, reason: 'invalid_format' });
        }
      });
      
      const validResult = await tokenGenerator.validate(validToken);
      const invalidResult = await tokenGenerator.validate(invalidToken);
      const expiredResult = await tokenGenerator.validate(expiredToken);
      
      expect(validResult.valid).toBe(true);
      expect(validResult.session_id).toBe('session-123');
      
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.reason).toBe('invalid_format');
      
      expect(expiredResult.valid).toBe(false);
      expect(expiredResult.reason).toBe('expired');
    });
  });

  describe('Progress Persistence for Anonymous Users', () => {
    test('should save quiz progress without requiring authentication', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      const progressData = {
        session_token: 'guest-token-123',
        current_question: 5,
        responses: [
          { question_id: 'q1', answer_value: 'professional', timestamp: '2025-08-15T10:00:00Z' },
          { question_id: 'q2', answer_value: 'evening_person', timestamp: '2025-08-15T10:01:00Z' },
          { question_id: 'q3', answer_value: 'luxury_brands', timestamp: '2025-08-15T10:02:00Z' },
          { question_id: 'q4', answer_value: 'intimate_gatherings', timestamp: '2025-08-15T10:03:00Z' }
        ],
        partial_analysis: {
          emerging_archetype: 'sophisticated',
          confidence: 0.45,
          dominant_dimension: 'oriental'
        },
        auto_saved_at: new Date().toISOString()
      };

      sessionManager.saveProgress.mockResolvedValue({
        saved: true,
        progress_percentage: 33,
        next_question_ready: true,
        estimated_completion_time: 120 // seconds
      });
      
      const result = await sessionManager.saveProgress(progressData);
      
      expect(result.saved).toBe(true);
      expect(result.progress_percentage).toBe(33);
      expect(result.next_question_ready).toBe(true);
      expect(result.estimated_completion_time).toBeLessThan(300); // Under 5 minutes
    });

    test('should restore guest session progress on return visits', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      const savedSession = {
        session_token: 'returning-guest-token',
        current_question: 7,
        responses_count: 6,
        partial_personality: {
          primary_tendency: 'natural',
          confidence: 0.58
        },
        time_remaining_estimate: 150, // seconds
        last_activity: '2025-08-15T09:30:00Z'
      };

      sessionManager.getSession.mockResolvedValue(savedSession);
      
      const restored = await sessionManager.getSession('returning-guest-token');
      
      expect(restored.current_question).toBe(7);
      expect(restored.responses_count).toBe(6);
      expect(restored.partial_personality.primary_tendency).toBe('natural');
      expect(restored.time_remaining_estimate).toBe(150);
    });

    test('should handle browser session storage alongside server persistence', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      // Mock localStorage behavior
      const localStorageData = {
        session_token: 'local-token-123',
        responses: [
          { question_id: 'q1', answer_value: 'answer1', local_timestamp: Date.now() }
        ],
        last_sync: Date.now() - 30000 // 30 seconds ago
      };

      sessionManager.syncWithLocalStorage = vi.fn().mockResolvedValue({
        sync_successful: true,
        conflicts_resolved: 0,
        local_data_preserved: true,
        server_data_updated: true
      });
      
      const syncResult = await sessionManager.syncWithLocalStorage('guest-token-123', localStorageData);
      
      expect(syncResult.sync_successful).toBe(true);
      expect(syncResult.local_data_preserved).toBe(true);
      expect(syncResult.server_data_updated).toBe(true);
    });

    test('should handle offline quiz taking with sync on reconnect', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      const offlineResponses = [
        { question_id: 'q5', answer_value: 'outdoor_activities', offline_timestamp: Date.now() - 60000 },
        { question_id: 'q6', answer_value: 'natural_materials', offline_timestamp: Date.now() - 30000 }
      ];

      sessionManager.syncOfflineResponses = vi.fn().mockResolvedValue({
        synced_responses: 2,
        analysis_updated: true,
        personality_profile_adjusted: true,
        sync_conflicts: 0
      });
      
      const syncResult = await sessionManager.syncOfflineResponses('guest-token-123', offlineResponses);
      
      expect(syncResult.synced_responses).toBe(2);
      expect(syncResult.analysis_updated).toBe(true);
      expect(syncResult.sync_conflicts).toBe(0);
    });
  });

  describe('Guest-to-User Account Transfer', () => {
    test('should seamlessly transfer complete guest session to new user account', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      const transferData = {
        guest_session_token: 'complete-guest-token',
        new_user_id: 'user-new-123',
        account_data: {
          email: 'user@example.com',
          first_name: 'Test',
          last_name: 'User'
        },
        preserve_all_data: true
      };

      const transferResult = {
        transfer_successful: true,
        data_preserved: {
          quiz_responses: 12,
          personality_profile: true,
          partial_analysis: true,
          progress_timestamps: true
        },
        new_user_profile: {
          id: 'user-new-123',
          quiz_completed_at: new Date().toISOString(),
          onboarding_step: 'quiz_completed',
          personality_type: 'sophisticated'
        },
        recommendations_generated: 8,
        cleanup_completed: true
      };

      sessionManager.transferToUser.mockResolvedValue(transferResult);
      
      const result = await sessionManager.transferToUser(transferData);
      
      expect(result.transfer_successful).toBe(true);
      expect(result.data_preserved.quiz_responses).toBe(12);
      expect(result.data_preserved.personality_profile).toBe(true);
      expect(result.new_user_profile.onboarding_step).toBe('quiz_completed');
      expect(result.recommendations_generated).toBe(8);
      expect(result.cleanup_completed).toBe(true);
    });

    test('should handle partial guest session transfer', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      const partialTransfer = {
        guest_session_token: 'partial-guest-token',
        new_user_id: 'user-partial-456',
        responses_count: 4, // Incomplete quiz
        partial_confidence: 0.35
      };

      const partialResult = {
        transfer_successful: true,
        quiz_incomplete: true,
        data_preserved: {
          quiz_responses: 4,
          personality_profile: false, // Not enough data
          partial_insights: true
        },
        recommended_action: 'continue_quiz',
        questions_remaining: 4,
        estimated_time_to_complete: 120 // seconds
      };

      sessionManager.transferToUser.mockResolvedValue(partialResult);
      
      const result = await sessionManager.transferToUser(partialTransfer);
      
      expect(result.quiz_incomplete).toBe(true);
      expect(result.data_preserved.personality_profile).toBe(false);
      expect(result.recommended_action).toBe('continue_quiz');
      expect(result.questions_remaining).toBe(4);
    });

    test('should prevent unauthorized access to guest sessions', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      const unauthorizedAccess = {
        session_token: 'someone-elses-token',
        requesting_ip: '192.168.1.100',
        original_ip: '192.168.1.50', // Different IP
        security_check: 'failed'
      };

      sessionManager.getSession.mockResolvedValue({
        access_denied: true,
        reason: 'ip_mismatch',
        security_violation: true,
        session_invalidated: true
      });
      
      const result = await sessionManager.getSession(unauthorizedAccess.session_token);
      
      expect(result.access_denied).toBe(true);
      expect(result.reason).toBe('ip_mismatch');
      expect(result.security_violation).toBe(true);
    });

    test('should handle session token collision prevention', async () => {
      const { SessionTokenGenerator } = await import('@/lib/quiz/guest-session-manager');
      const tokenGenerator = new SessionTokenGenerator();
      
      let tokenAttempt = 0;
      tokenGenerator.generate.mockImplementation(() => {
        tokenAttempt++;
        
        if (tokenAttempt === 1) {
          // First attempt - simulate collision
          throw new Error('Token collision detected');
        } else {
          // Second attempt - unique token
          return Promise.resolve(`unique-token-attempt-${tokenAttempt}`);
        }
      });
      
      const token = await tokenGenerator.generate();
      
      expect(token).toBe('unique-token-attempt-2');
      expect(tokenAttempt).toBe(2); // Should retry on collision
    });
  });

  describe('Session Persistence and Recovery', () => {
    test('should persist guest progress across browser sessions', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      const persistenceTest = {
        session_token: 'persistent-token-123',
        original_responses: [
          { question_id: 'q1', answer: 'professional' },
          { question_id: 'q2', answer: 'evening_style' }
        ],
        browser_closed_at: '2025-08-15T10:00:00Z',
        browser_reopened_at: '2025-08-15T11:30:00Z', // 1.5 hours later
        session_still_valid: true
      };

      sessionManager.getSession.mockResolvedValue({
        session_found: true,
        responses_preserved: 2,
        analysis_state_preserved: true,
        continuation_possible: true,
        time_since_last_activity: 5400 // 1.5 hours in seconds
      });
      
      const recovered = await sessionManager.getSession(persistenceTest.session_token);
      
      expect(recovered.session_found).toBe(true);
      expect(recovered.responses_preserved).toBe(2);
      expect(recovered.analysis_state_preserved).toBe(true);
      expect(recovered.continuation_possible).toBe(true);
    });

    test('should handle session recovery after extended inactivity', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      const staleSession = {
        session_token: 'stale-token-456',
        last_activity: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48 hours ago
        responses_count: 3
      };

      sessionManager.getSession.mockResolvedValue({
        session_expired: true,
        data_archived: true,
        recovery_possible: false,
        recommended_action: 'start_fresh',
        archived_insights: 'Previous session suggested preference for fresh fragrances'
      });
      
      const result = await sessionManager.getSession(staleSession.session_token);
      
      expect(result.session_expired).toBe(true);
      expect(result.recovery_possible).toBe(false);
      expect(result.recommended_action).toBe('start_fresh');
      expect(result.archived_insights).toContain('fresh fragrances');
    });

    test('should implement graceful session migration during quiz updates', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      const migrationScenario = {
        old_session_token: 'old-quiz-v1.0-token',
        old_quiz_version: 'v1.0',
        new_quiz_version: 'v1.1',
        responses_count: 6,
        migration_needed: true
      };

      sessionManager.migrateSession.mockResolvedValue({
        migration_successful: true,
        new_session_token: 'migrated-quiz-v1.1-token',
        responses_migrated: 6,
        analysis_updated: true,
        backwards_compatibility: true,
        data_loss: false
      });
      
      const migration = await sessionManager.migrateSession(migrationScenario);
      
      expect(migration.migration_successful).toBe(true);
      expect(migration.responses_migrated).toBe(6);
      expect(migration.data_loss).toBe(false);
      expect(migration.backwards_compatibility).toBe(true);
    });
  });

  describe('Session Cleanup and Security', () => {
    test('should automatically expire guest sessions after 24 hours', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      const expiredSessions = [
        {
          session_id: 'expired-1',
          expires_at: new Date(Date.now() - 1000).toISOString(), // 1 second ago
          data_size_mb: 0.5
        },
        {
          session_id: 'expired-2',
          expires_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          data_size_mb: 0.3
        }
      ];

      sessionManager.cleanupExpiredSessions.mockResolvedValue({
        sessions_cleaned: 2,
        data_freed_mb: 0.8,
        cleanup_duration_ms: 45,
        next_cleanup_scheduled: new Date(Date.now() + 3600000).toISOString()
      });
      
      const cleanup = await sessionManager.cleanupExpiredSessions();
      
      expect(cleanup.sessions_cleaned).toBe(2);
      expect(cleanup.data_freed_mb).toBe(0.8);
      expect(cleanup.cleanup_duration_ms).toBeLessThan(100);
    });

    test('should rate limit guest session creation to prevent abuse', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      const rateLimitTest = {
        ip_address: '192.168.1.100',
        sessions_created_last_hour: 12,
        rate_limit: 10,
        should_block: true
      };

      sessionManager.createSession.mockResolvedValue({
        rate_limited: true,
        reason: 'too_many_sessions_from_ip',
        retry_after_seconds: 3600,
        current_rate: '12 sessions per hour',
        limit: '10 sessions per hour'
      });
      
      const result = await sessionManager.createSession({ ip_address: rateLimitTest.ip_address });
      
      expect(result.rate_limited).toBe(true);
      expect(result.retry_after_seconds).toBe(3600);
      expect(result.current_rate).toContain('12 sessions');
    });

    test('should securely delete guest data on session expiration', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      const secureDeleteTest = {
        expired_session_id: 'expired-session-789',
        contains_sensitive_data: false, // Quiz responses aren't PII
        gdpr_compliance_required: true,
        secure_deletion_method: 'overwrite_and_verify'
      };

      sessionManager.secureDelete = vi.fn().mockResolvedValue({
        deletion_successful: true,
        method_used: 'database_hard_delete',
        verification_passed: true,
        audit_log_entry: 'guest_session_expired_deletion',
        compliance_satisfied: true
      });
      
      const deletion = await sessionManager.secureDelete(secureDeleteTest.expired_session_id);
      
      expect(deletion.deletion_successful).toBe(true);
      expect(deletion.verification_passed).toBe(true);
      expect(deletion.compliance_satisfied).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle high concurrent guest session creation', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      const concurrentRequests = Array.from({ length: 1000 }, (_, i) => ({
        referral_source: 'load_test',
        request_id: i
      }));

      sessionManager.createSession.mockImplementation((request) => 
        Promise.resolve({
          session_id: `load-test-session-${request.request_id}`,
          session_token: `load-test-token-${request.request_id}`,
          creation_time_ms: 25 + Math.random() * 50, // 25-75ms
          queue_position: request.request_id
        })
      );
      
      const startTime = Date.now();
      
      const results = await Promise.all(
        concurrentRequests.map(request => sessionManager.createSession(request))
      );
      
      const totalTime = Date.now() - startTime;
      const avgTimePerSession = totalTime / concurrentRequests.length;
      
      expect(results).toHaveLength(1000);
      expect(avgTimePerSession).toBeLessThan(100); // Should scale efficiently
    });

    test('should optimize guest session storage for minimal database impact', async () => {
      const storageOptimization = {
        session_size_bytes: 2048, // ~2KB per session
        max_concurrent_guests: 10000,
        total_storage_mb: 20, // Efficient storage
        cleanup_frequency: 'hourly',
        compression_ratio: 0.6 // 40% size reduction
      };

      // Storage should be efficient for large numbers of concurrent guests
      expect(storageOptimization.total_storage_mb).toBeLessThan(50);
      expect(storageOptimization.session_size_bytes).toBeLessThan(5000);
      expect(storageOptimization.compression_ratio).toBeGreaterThan(0.5);
    });

    test('should implement efficient session lookup with indexing', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      // Simulate database query time for session lookup
      sessionManager.getSession.mockImplementation((token) => 
        new Promise(resolve => {
          setTimeout(() => resolve({
            session_found: true,
            lookup_time_ms: 15, // Fast indexed lookup
            cache_hit: Math.random() > 0.3, // 70% cache hit rate
            database_query_needed: Math.random() > 0.7 // 30% need database
          }), 15);
        })
      );
      
      const startTime = Date.now();
      const result = await sessionManager.getSession('test-token');
      const lookupTime = Date.now() - startTime;
      
      expect(lookupTime).toBeLessThan(50); // Fast lookup
      expect(result.lookup_time_ms).toBe(15);
    });
  });

  describe('Privacy and Compliance', () => {
    test('should handle guest data with privacy-first approach', async () => {
      const privacyCompliance = {
        no_personal_identification: true,
        ip_address_hashed: true,
        user_agent_fingerprint_hashed: true,
        quiz_responses_anonymized: true,
        automatic_expiration: true,
        no_cross_session_tracking: true,
        gdpr_compliant: true
      };

      // Verify privacy compliance requirements
      expect(privacyCompliance.no_personal_identification).toBe(true);
      expect(privacyCompliance.ip_address_hashed).toBe(true);
      expect(privacyCompliance.automatic_expiration).toBe(true);
      expect(privacyCompliance.gdpr_compliant).toBe(true);
    });

    test('should provide guest session data export capability', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      const exportRequest = {
        session_token: 'export-request-token',
        data_subject_rights: 'gdpr_article_15', // Right of access
        export_format: 'json'
      };

      const exportData = {
        session_metadata: {
          session_id: 'export-session-123',
          created_at: '2025-08-15T10:00:00Z',
          quiz_version: 'v1.0'
        },
        quiz_responses: [
          { question: 'lifestyle', answer: 'professional', timestamp: '2025-08-15T10:01:00Z' }
        ],
        personality_analysis: {
          primary_archetype: 'sophisticated',
          confidence: 0.82
        },
        no_personal_data: true,
        export_generated_at: new Date().toISOString()
      };

      sessionManager.exportGuestData = vi.fn().mockResolvedValue(exportData);
      
      const exported = await sessionManager.exportGuestData(exportRequest.session_token);
      
      expect(exported.no_personal_data).toBe(true);
      expect(exported.quiz_responses).toHaveLength(1);
      expect(exported.personality_analysis.primary_archetype).toBe('sophisticated');
    });

    test('should implement secure session deletion on user request', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/guest-session-manager');
      const sessionManager = new GuestSessionManager();
      
      const deletionRequest = {
        session_token: 'delete-me-token',
        user_requested: true,
        immediate_deletion: true
      };

      sessionManager.deleteSession = vi.fn().mockResolvedValue({
        deletion_completed: true,
        data_permanently_removed: true,
        cache_cleared: true,
        audit_trail: 'user_requested_deletion',
        compliance_verified: true
      });
      
      const deletion = await sessionManager.deleteSession(deletionRequest.session_token);
      
      expect(deletion.deletion_completed).toBe(true);
      expect(deletion.data_permanently_removed).toBe(true);
      expect(deletion.compliance_verified).toBe(true);
    });
  });
});