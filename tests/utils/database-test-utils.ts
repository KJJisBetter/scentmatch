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
  setupRpcOperations,
  testDatabaseConnection,
  resetDatabaseMocks,
  createTestData,
  validateDatabaseResult,
} = databaseTestHelper;
