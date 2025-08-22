import { describe, test, expect, beforeEach, vi, Mock } from 'vitest';
import { revalidatePath } from 'next/cache';
import { 
  toggleCollection, 
  getUserCollection, 
  isInCollection,
  CollectionActionParams
} from '@/lib/actions/collections';
import { 
  toggleWishlist, 
  getUserWishlist, 
  isInWishlist,
  WishlistActionParams
} from '@/lib/actions/wishlist';
import { 
  processFeedback,
  FeedbackParams
} from '@/lib/actions/feedback';

/**
 * Comprehensive Server Actions Test Suite
 * 
 * Tests for all existing Server Actions functionality:
 * - Collection management (toggleCollection, getUserCollection, isInCollection)
 * - Wishlist management (toggleWishlist, getUserWishlist, isInWishlist)
 * - Feedback processing (processFeedback with AI integration)
 * 
 * This test suite validates the existing Server Actions before modernization.
 */

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase client with proper chaining
const createMockQuery = () => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  order: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
});

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => createMockQuery()),
};

vi.mock('@/lib/supabase', () => ({
  createServerSupabase: vi.fn(() => mockSupabaseClient),
}));

// Mock AI feedback processor
vi.mock('@/lib/ai-sdk/feedback-processor', () => ({
  FeedbackProcessor: vi.fn(() => ({
    processExplicitFeedback: vi.fn(() => ({
      learning_impact: 0.15,
      preference_update_applied: true,
      updated_embedding: true,
      preference_adjustment: 'positive',
    })),
    assessFeedbackQuality: vi.fn(() => ({
      reliability_score: 0.8,
      quality_level: 'high',
      trust_factors: { consistency: 0.9 },
      learning_weight: 0.7,
    })),
  })),
  RecommendationCache: vi.fn(() => ({
    invalidateUserCache: vi.fn(() => ({
      invalidated: true,
    })),
  })),
  createThompsonSamplingService: vi.fn(() => ({
    processFeedback: vi.fn(() => ({
      algorithm_updated: true,
      new_success_rate: 0.75,
      learning_impact: 0.12,
      processing_time_ms: 45,
      processed: true,
    })),
  })),
}));

describe('Server Actions Test Suite', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockFragrance = {
    id: 'test-fragrance-id',
    name: 'Test Fragrance',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful auth response
    (mockSupabaseClient.auth.getUser as Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('Collection Server Actions', () => {
    describe('toggleCollection', () => {
      test('should successfully add fragrance to collection', async () => {
        const params: CollectionActionParams = {
          fragrance_id: 'test-fragrance-id',
          action: 'add',
        };

        // Mock fragrance exists - first call
        const fragranceQuery = createMockQuery();
        fragranceQuery.single.mockResolvedValueOnce({
          data: mockFragrance,
          error: null,
        });

        // Mock not already in collection - second call
        const checkQuery = createMockQuery();
        checkQuery.single.mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }, // No rows found
        });

        // Mock successful insert - third call
        const insertQuery = createMockQuery();
        insertQuery.single.mockResolvedValueOnce({
          data: { id: 'collection-item-id' },
          error: null,
        });

        mockSupabaseClient.from
          .mockReturnValueOnce(fragranceQuery)
          .mockReturnValueOnce(checkQuery)
          .mockReturnValueOnce(insertQuery);

        const result = await toggleCollection(params);

        expect(result.success).toBe(true);
        expect(result.in_collection).toBe(true);
        expect(result.message).toContain('Added "Test Fragrance" to your collection');
        expect(revalidatePath).toHaveBeenCalledWith('/collection');
        expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
        expect(revalidatePath).toHaveBeenCalledWith('/recommendations');
      });

      test('should successfully remove fragrance from collection', async () => {
        const params: CollectionActionParams = {
          fragrance_id: 'test-fragrance-id',
          action: 'remove',
        };

        // Mock fragrance exists
        mockSupabaseClient.from('fragrances').select().eq().single.mockResolvedValueOnce({
          data: mockFragrance,
          error: null,
        });

        // Mock successful delete
        mockSupabaseClient.from('user_collections').delete().eq().eq().eq.mockResolvedValueOnce({
          error: null,
        });

        const result = await toggleCollection(params);

        expect(result.success).toBe(true);
        expect(result.in_collection).toBe(false);
        expect(result.message).toContain('Removed "Test Fragrance" from your collection');
      });

      test('should handle authentication error', async () => {
        (mockSupabaseClient.auth.getUser as Mock).mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        });

        const params: CollectionActionParams = {
          fragrance_id: 'test-fragrance-id',
          action: 'add',
        };

        const result = await toggleCollection(params);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Authentication required');
      });

      test('should handle invalid action type', async () => {
        const params = {
          fragrance_id: 'test-fragrance-id',
          action: 'invalid',
        } as CollectionActionParams;

        const result = await toggleCollection(params);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Action must be "add" or "remove"');
      });

      test('should handle missing fragrance', async () => {
        const params: CollectionActionParams = {
          fragrance_id: 'nonexistent-id',
          action: 'add',
        };

        // Mock fragrance not found
        mockSupabaseClient.from('fragrances').select().eq().single.mockResolvedValueOnce({
          data: null,
          error: { message: 'Not found' },
        });

        const result = await toggleCollection(params);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Fragrance not found');
      });
    });

    describe('getUserCollection', () => {
      test('should return user collection with fragrance details', async () => {
        const mockCollectionData = [
          {
            id: 'collection-1',
            collection_type: 'owned',
            rating: 5,
            notes: 'Love this scent',
            created_at: '2024-01-01T00:00:00Z',
            fragrances: {
              id: 'fragrance-1',
              name: 'Test Fragrance 1',
              scent_family: 'Oriental',
              gender: 'Unisex',
              sample_available: true,
              sample_price_usd: 5.99,
              fragrance_brands: {
                name: 'Test Brand',
              },
            },
          },
        ];

        mockSupabaseClient.from('user_collections').select().eq().eq().order.mockResolvedValueOnce({
          data: mockCollectionData,
          error: null,
        });

        const result = await getUserCollection();

        expect(result.success).toBe(true);
        expect(result.collection).toHaveLength(1);
        expect(result.collection![0].fragrance.name).toBe('Test Fragrance 1');
        expect(result.collection![0].fragrance.brand).toBe('Test Brand');
        expect(result.total).toBe(1);
      });

      test('should handle empty collection', async () => {
        mockSupabaseClient.from('user_collections').select().eq().eq().order.mockResolvedValueOnce({
          data: [],
          error: null,
        });

        const result = await getUserCollection();

        expect(result.success).toBe(true);
        expect(result.collection).toHaveLength(0);
        expect(result.total).toBe(0);
      });
    });

    describe('isInCollection', () => {
      test('should return true when fragrance is in collection', async () => {
        mockSupabaseClient.from('user_collections').select().eq().eq().eq().single.mockResolvedValueOnce({
          data: { id: 'collection-item' },
          error: null,
        });

        const result = await isInCollection('test-fragrance-id');

        expect(result.success).toBe(true);
        expect(result.in_collection).toBe(true);
      });

      test('should return false when fragrance is not in collection', async () => {
        mockSupabaseClient.from('user_collections').select().eq().eq().eq().single.mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' },
        });

        const result = await isInCollection('test-fragrance-id');

        expect(result.success).toBe(true);
        expect(result.in_collection).toBe(false);
      });
    });
  });

  describe('Wishlist Server Actions', () => {
    describe('toggleWishlist', () => {
      test('should successfully add fragrance to wishlist', async () => {
        const params: WishlistActionParams = {
          fragrance_id: 'test-fragrance-id',
          action: 'add',
        };

        // Mock fragrance exists
        mockSupabaseClient.from('fragrances').select().eq().single.mockResolvedValueOnce({
          data: mockFragrance,
          error: null,
        });

        // Mock not already in wishlist
        mockSupabaseClient.from('user_collections').select().eq().eq().eq().single.mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' },
        });

        // Mock successful insert
        mockSupabaseClient.from('user_collections').insert().select().single.mockResolvedValueOnce({
          data: { id: 'wishlist-item-id' },
          error: null,
        });

        const result = await toggleWishlist(params);

        expect(result.success).toBe(true);
        expect(result.in_wishlist).toBe(true);
        expect(result.message).toContain('Added "Test Fragrance" to your wishlist');
        expect(revalidatePath).toHaveBeenCalledWith('/wishlist');
      });

      test('should successfully remove fragrance from wishlist', async () => {
        const params: WishlistActionParams = {
          fragrance_id: 'test-fragrance-id',
          action: 'remove',
        };

        // Mock fragrance exists
        mockSupabaseClient.from('fragrances').select().eq().single.mockResolvedValueOnce({
          data: mockFragrance,
          error: null,
        });

        // Mock successful delete
        mockSupabaseClient.from('user_collections').delete().eq().eq().eq.mockResolvedValueOnce({
          error: null,
        });

        const result = await toggleWishlist(params);

        expect(result.success).toBe(true);
        expect(result.in_wishlist).toBe(false);
        expect(result.message).toContain('Removed "Test Fragrance" from your wishlist');
      });
    });

    describe('getUserWishlist', () => {
      test('should return user wishlist with fragrance details', async () => {
        const mockWishlistData = [
          {
            id: 'wishlist-1',
            collection_type: 'wishlist',
            rating: null,
            notes: null,
            created_at: '2024-01-01T00:00:00Z',
            fragrances: {
              id: 'fragrance-1',
              name: 'Wishlist Fragrance',
              scent_family: 'Fresh',
              gender: 'Women',
              sample_available: true,
              sample_price_usd: 4.99,
              fragrance_brands: {
                name: 'Wishlist Brand',
              },
            },
          },
        ];

        mockSupabaseClient.from('user_collections').select().eq().eq().order.mockResolvedValueOnce({
          data: mockWishlistData,
          error: null,
        });

        const result = await getUserWishlist();

        expect(result.success).toBe(true);
        expect(result.wishlist).toHaveLength(1);
        expect(result.wishlist![0].fragrance.name).toBe('Wishlist Fragrance');
      });
    });

    describe('isInWishlist', () => {
      test('should return true when fragrance is in wishlist', async () => {
        mockSupabaseClient.from('user_collections').select().eq().eq().eq().single.mockResolvedValueOnce({
          data: { id: 'wishlist-item' },
          error: null,
        });

        const result = await isInWishlist('test-fragrance-id');

        expect(result.success).toBe(true);
        expect(result.in_wishlist).toBe(true);
      });
    });
  });

  describe('Feedback Server Actions', () => {
    describe('processFeedback', () => {
      test('should successfully process like feedback', async () => {
        const params: FeedbackParams = {
          fragrance_id: 'test-fragrance-id',
          feedback_type: 'like',
          rating_value: 4,
          confidence: 0.8,
          recommendation_id: 'rec-123',
          source: 'recommendations_page',
        };

        // Mock successful interaction insert
        mockSupabaseClient.from('user_interactions').insert.mockResolvedValueOnce({
          error: null,
        });

        const result = await processFeedback(params);

        expect(result.success).toBe(true);
        expect(result.feedback_processed).toBe(true);
        expect(result.learning_impact).toBe(0.15);
        expect(result.preference_update!.preferences_updated).toBe(true);
        expect(result.recommendation_refresh!.cache_invalidated).toBe(true);
        expect(result.bandit_optimization!.algorithm_updated).toBe(true);
        expect(result.user_message).toContain("We'll show you more fragrances like this");
        expect(revalidatePath).toHaveBeenCalledWith('/recommendations');
      });

      test('should successfully process dislike feedback', async () => {
        const params: FeedbackParams = {
          fragrance_id: 'test-fragrance-id',
          feedback_type: 'dislike',
          confidence: 0.9,
        };

        mockSupabaseClient.from('user_interactions').insert.mockResolvedValueOnce({
          error: null,
        });

        const result = await processFeedback(params);

        expect(result.success).toBe(true);
        expect(result.user_message).toContain("We'll avoid similar recommendations");
      });

      test('should handle high-impact feedback with cache invalidation', async () => {
        const params: FeedbackParams = {
          fragrance_id: 'test-fragrance-id',
          feedback_type: 'love',
          rating_value: 5,
        };

        mockSupabaseClient.from('user_interactions').insert.mockResolvedValueOnce({
          error: null,
        });

        const result = await processFeedback(params);

        expect(result.success).toBe(true);
        expect(result.recommendation_refresh!.cache_invalidated).toBe(true);
        expect(result.recommendation_refresh!.refresh_recommended).toBe(false); // 0.15 is not > 0.15
        expect(revalidatePath).toHaveBeenCalledWith('/recommendations');
      });

      test('should handle authentication error in feedback processing', async () => {
        (mockSupabaseClient.auth.getUser as Mock).mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        });

        const params: FeedbackParams = {
          fragrance_id: 'test-fragrance-id',
          feedback_type: 'like',
        };

        const result = await processFeedback(params);

        expect(result.success).toBe(false);
        expect(result.feedback_processed).toBe(false);
        expect(result.error).toBe('Authentication required');
      });

      test('should handle invalid feedback type', async () => {
        const params = {
          fragrance_id: 'test-fragrance-id',
          feedback_type: 'invalid_type',
        } as FeedbackParams;

        const result = await processFeedback(params);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid feedback type');
      });

      test('should handle missing required fields', async () => {
        const params = {
          feedback_type: 'like',
          // fragrance_id missing
        } as FeedbackParams;

        const result = await processFeedback(params);

        expect(result.success).toBe(false);
        expect(result.error).toBe('fragrance_id and feedback_type are required');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      (mockSupabaseClient.auth.getUser as Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const params: CollectionActionParams = {
        fragrance_id: 'test-fragrance-id',
        action: 'add',
      };

      const result = await toggleCollection(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
    });

    test('should handle database query errors', async () => {
      mockSupabaseClient.from('fragrances').select().eq().single.mockResolvedValueOnce({
        data: mockFragrance,
        error: null,
      });

      mockSupabaseClient.from('user_collections').insert().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database constraint violation' },
      });

      const params: CollectionActionParams = {
        fragrance_id: 'test-fragrance-id',
        action: 'add',
      };

      const result = await toggleCollection(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to add to collection');
    });
  });
});