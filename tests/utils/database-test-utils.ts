import { vi } from 'vitest';
import { mockSupabaseClient } from '../mocks/supabase';
import type { Database } from '@/types/database';

/**
 * Database testing utilities for ScentMatch
 * Provides comprehensive database operation testing helpers
 */

// Type definitions for database operations
type DatabaseOperation =
  | 'select'
  | 'insert'
  | 'update'
  | 'delete'
  | 'upsert'
  | 'rpc';
type SupabaseResponse<T> = { data: T | null; error: any | null };

/**
 * Database test helper class
 */
export class DatabaseTestHelper {
  private static instance: DatabaseTestHelper;

  static getInstance(): DatabaseTestHelper {
    if (!DatabaseTestHelper.instance) {
      DatabaseTestHelper.instance = new DatabaseTestHelper();
    }
    return DatabaseTestHelper.instance;
  }

  /**
   * Set up successful database operations
   */
  setupSuccessfulOperations() {
    // Mock successful select operations
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 1, name: 'Test Item' },
            error: null,
          }),
          limit: vi.fn().mockResolvedValue({
            data: [{ id: 1, name: 'Test Item' }],
            error: null,
          }),
        }),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 1, name: 'Test Item' }],
          error: null,
        }),
        range: vi.fn().mockResolvedValue({
          data: [{ id: 1, name: 'Test Item' }],
          error: null,
          count: 1,
        }),
      }),
      // Mock successful insert operations
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: 1, name: 'New Item' }],
          error: null,
        }),
      }),
      // Mock successful update operations
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{ id: 1, name: 'Updated Item' }],
            error: null,
          }),
        }),
      }),
      // Mock successful delete operations
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    });
  }

  /**
   * Set up database error scenarios
   */
  setupDatabaseErrors(
    errorType: 'network' | 'permission' | 'validation' | 'notFound' = 'network'
  ) {
    const errors = {
      network: {
        message: 'Network error',
        code: '500',
        details: 'Connection failed',
      },
      permission: {
        message: 'Permission denied',
        code: '403',
        details: 'Insufficient privileges',
      },
      validation: {
        message: 'Validation error',
        code: '400',
        details: 'Invalid data format',
      },
      notFound: {
        message: 'Record not found',
        code: '404',
        details: 'Resource does not exist',
      },
    };

    const error = errors[errorType];

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error }),
          limit: vi.fn().mockResolvedValue({ data: null, error }),
        }),
        limit: vi.fn().mockResolvedValue({ data: null, error }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: null, error }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: null, error }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error }),
      }),
    });
  }

  /**
   * Set up pagination testing
   */
  setupPagination(totalItems: number, pageSize: number = 10) {
    const pages = Math.ceil(totalItems / pageSize);
    const currentPage = 0;

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        range: vi.fn().mockImplementation((start: number, end: number) => {
          const page = Math.floor(start / pageSize);
          const items = Array.from(
            { length: Math.min(pageSize, totalItems - start) },
            (_, i) => ({
              id: start + i + 1,
              name: `Item ${start + i + 1}`,
            })
          );

          return Promise.resolve({
            data: items,
            error: null,
            count: totalItems,
          });
        }),
      }),
    });
  }

  /**
   * Set up real-time subscription testing
   */
  setupRealtimeSubscription() {
    const mockSubscription = {
      subscribe: vi.fn().mockImplementation(callback => {
        // Simulate real-time updates
        setTimeout(() => {
          callback({
            eventType: 'INSERT',
            new: { id: 999, name: 'Real-time Item' },
            old: null,
          });
        }, 100);

        return {
          unsubscribe: vi.fn(),
        };
      }),
    };

    mockSupabaseClient.channel = vi.fn().mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: mockSubscription.subscribe,
      }),
    });

    return mockSubscription;
  }

  /**
   * Mock fragrance-specific database operations
   */
  setupFragranceDatabase() {
    const mockFragrances = [
      {
        id: 1,
        name: 'Chanel No. 5',
        brand: 'Chanel',
        notes: ['aldehydes', 'ylang-ylang', 'neroli', 'sandalwood'],
        price: 150,
        size: '100ml',
        concentration: 'EDP',
      },
      {
        id: 2,
        name: 'Acqua di Gio',
        brand: 'Giorgio Armani',
        notes: ['bergamot', 'marine', 'jasmine', 'white musk'],
        price: 85,
        size: '100ml',
        concentration: 'EDT',
      },
    ];

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'fragrances') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockFragrances[0],
                error: null,
              }),
            }),
            limit: vi.fn().mockResolvedValue({
              data: mockFragrances,
              error: null,
            }),
            ilike: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockFragrances.filter(f =>
                  f.name.toLowerCase().includes('chanel')
                ),
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ ...mockFragrances[0], id: 3 }],
              error: null,
            }),
          }),
        };
      }
      // Default return for other tables
      return this.getDefaultMockTable();
    });
  }

  /**
   * Mock user collection database operations
   */
  setupUserCollectionDatabase() {
    const mockCollections = [
      {
        id: 1,
        user_id: 'user-123',
        fragrance_id: 1,
        rating: 4,
        notes: 'Love this scent for evening wear',
        date_added: '2025-01-01',
        collection_type: 'owned',
        added_at: '2025-01-01T00:00:00Z',
        usage_frequency: 'weekly',
        occasions: ['evening', 'date'],
        seasons: ['fall', 'winter']
      },
    ];

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_collections') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockCollections,
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [mockCollections[0]],
              error: null,
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [{ ...mockCollections[0], rating: 5 }],
                error: null,
              }),
            }),
          }),
        };
      }
      return this.getDefaultMockTable();
    });
  }

  /**
   * Mock user preferences database operations
   */
  setupUserPreferencesDatabase() {
    const mockPreferences = [
      {
        id: '1',
        user_id: 'user-123',
        preference_type: 'scent_family',
        preference_value: 'woody',
        preference_strength: 0.8,
        learned_from: 'collection_analysis',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: '2', 
        user_id: 'user-123',
        preference_type: 'intensity',
        preference_value: 'moderate',
        preference_strength: 0.6,
        learned_from: 'quiz',
        created_at: '2025-01-01T00:00:00Z'
      }
    ];

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_preferences') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockPreferences,
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [mockPreferences[0]],
              error: null,
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [{ ...mockPreferences[0], preference_strength: 0.9 }],
                error: null,
              }),
            }),
          }),
        };
      }
      return this.getDefaultMockTable();
    });
  }

  /**
   * Mock user fragrance interactions database operations
   */
  setupUserInteractionsDatabase() {
    const mockInteractions = [
      {
        id: '1',
        user_id: 'user-123',
        fragrance_id: 1,
        interaction_type: 'view',
        interaction_context: 'recommendation',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: '2',
        user_id: 'user-123', 
        fragrance_id: 2,
        interaction_type: 'like',
        interaction_context: 'search',
        created_at: '2025-01-01T01:00:00Z'
      }
    ];

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_fragrance_interactions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockInteractions,
                error: null,
              }),
            }),
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockInteractions,
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [mockInteractions[0]],
              error: null,
            }),
          }),
        };
      }
      return this.getDefaultMockTable();
    });
  }

  /**
   * Mock fragrance embeddings database operations
   */
  setupFragranceEmbeddingsDatabase() {
    const mockEmbeddings = [
      {
        id: '1',
        fragrance_id: 1,
        embedding_version: 'voyage-3.5',
        embedding: new Array(1024).fill(0.1), // 1024-dim vector
        embedding_source: 'combined',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: '2',
        fragrance_id: 1,
        embedding_version: 'openai-ada-002', 
        embedding: new Array(1536).fill(0.1), // 1536-dim vector
        embedding_source: 'description',
        created_at: '2025-01-01T00:00:00Z'
      }
    ];

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'fragrance_embeddings') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockEmbeddings,
                error: null,
              }),
              single: vi.fn().mockResolvedValue({
                data: mockEmbeddings[0],
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [mockEmbeddings[0]],
              error: null,
            }),
          }),
        };
      }
      return this.getDefaultMockTable();
    });
  }

  /**
   * Set up RPC (stored procedure) testing
   */
  setupRpcOperations() {
    mockSupabaseClient.rpc.mockImplementation(
      (functionName: string, params?: any) => {
        switch (functionName) {
          case 'get_recommendations':
            return Promise.resolve({
              data: [
                { fragrance_id: 1, similarity_score: 0.85 },
                { fragrance_id: 2, similarity_score: 0.72 },
              ],
              error: null,
            });
          case 'search_fragrances':
            return Promise.resolve({
              data: [{ id: 1, name: 'Search Result 1', relevance: 0.9 }],
              error: null,
            });
          case 'get_similar_fragrances':
            return Promise.resolve({
              data: [
                { fragrance_id: 2, similarity_score: 0.92, name: 'Similar Scent 1', brand: 'Test Brand' },
                { fragrance_id: 3, similarity_score: 0.87, name: 'Similar Scent 2', brand: 'Test Brand' },
              ],
              error: null,
            });
          case 'get_collection_insights':
            return Promise.resolve({
              data: {
                total_fragrances: 12,
                dominant_families: [
                  { family: 'woody', count: 5 },
                  { family: 'floral', count: 4 },
                  { family: 'citrus', count: 3 }
                ],
                average_intensity: 6.2,
                most_worn_occasion: 'evening',
                collection_diversity_score: 0.75
              },
              error: null,
            });
          case 'get_personalized_recommendations':
            return Promise.resolve({
              data: [
                { 
                  fragrance_id: 4, 
                  recommendation_score: 0.91,
                  recommendation_reasons: ['Similar to your woody collection', 'Popular among users with similar tastes']
                },
                { 
                  fragrance_id: 5, 
                  recommendation_score: 0.88,
                  recommendation_reasons: ['Matches your preferred intensity level', 'Great for evening occasions']
                }
              ],
              error: null,
            });
          case 'advanced_fragrance_search':
            return Promise.resolve({
              data: [
                { id: 6, name: 'Woody Vanilla', brand: 'Luxury Brand', relevance_score: 0.95 },
                { id: 7, name: 'Oriental Spice', brand: 'Premium Brand', relevance_score: 0.89 }
              ],
              error: null,
            });
          case 'semantic_fragrance_search':
            return Promise.resolve({
              data: [
                { id: 8, name: 'Fresh Breeze', semantic_score: 0.93 },
                { id: 9, name: 'Morning Dew', semantic_score: 0.88 }
              ],
              error: null,
            });
          case 'match_fragrances':
            return Promise.resolve({
              data: [
                { id: 10, similarity: 0.84 },
                { id: 11, similarity: 0.79 }
              ],
              error: null,
            });
          case 'get_fragrance_alternatives':
            return Promise.resolve({
              data: [
                { fragrance_id: 12, price_ratio: 0.6, similarity_score: 0.88 },
                { fragrance_id: 13, price_ratio: 0.4, similarity_score: 0.82 }
              ],
              error: null,
            });
          case 'get_platform_trends':
            return Promise.resolve({
              data: [
                { fragrance_id: 14, trend_score: 0.95, trend_type: 'rising' },
                { fragrance_id: 15, trend_score: 0.91, trend_type: 'popular' }
              ],
              error: null,
            });
          default:
            return Promise.resolve({ data: null, error: null });
        }
      }
    );
  }

  /**
   * Test database connection and basic operations
   */
  async testDatabaseConnection(): Promise<boolean> {
    try {
      const { data, error } = await mockSupabaseClient
        .from('fragrances')
        .select('count')
        .limit(1);

      return !error && data !== null;
    } catch {
      return false;
    }
  }

  /**
   * Clean up database mocks
   */
  resetDatabaseMocks() {
    vi.clearAllMocks();
    this.setupSuccessfulOperations(); // Reset to default successful state
  }

  /**
   * Create test data for specific scenarios
   */
  createTestData(
    type: 'fragrance' | 'user' | 'collection',
    overrides: any = {}
  ) {
    const baseData = {
      fragrance: {
        id: 1,
        name: 'Test Fragrance',
        brand: 'Test Brand',
        notes: ['note1', 'note2'],
        price: 100,
        size: '100ml',
        concentration: 'EDP',
      },
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        preferences: ['fresh', 'citrus'],
      },
      collection: {
        id: 1,
        user_id: 'user-123',
        fragrance_id: 1,
        rating: 4,
        notes: 'Test notes',
      },
    };

    return { ...baseData[type], ...overrides };
  }

  /**
   * Validate database operation results
   */
  validateDatabaseResult<T>(
    result: SupabaseResponse<T>,
    expectSuccess: boolean = true
  ): void {
    if (expectSuccess) {
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    } else {
      expect(result.error).toBeDefined();
    }
  }

  /**
   * Default mock table for unknown tables
   */
  private getDefaultMockTable() {
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };
  }
}

// Export singleton instance
export const databaseTestHelper = DatabaseTestHelper.getInstance();

// Export commonly used functions for convenience
export const {
  setupSuccessfulOperations,
  setupDatabaseErrors,
  setupPagination,
  setupRealtimeSubscription,
  setupFragranceDatabase,
  setupUserCollectionDatabase,
  setupUserPreferencesDatabase,
  setupUserInteractionsDatabase,
  setupFragranceEmbeddingsDatabase,
  setupRpcOperations,
  testDatabaseConnection,
  resetDatabaseMocks,
  createTestData,
  validateDatabaseResult,
} = databaseTestHelper;
