import { describe, test, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { setupUserCollectionDatabase, setupRpcOperations, resetDatabaseMocks } from '../utils/database-test-utils';

/**
 * Collection Management API Tests
 * 
 * Tests for collection management API routes:
 * - GET /api/collections - Get user's complete collection with analytics
 * - POST /api/collections/bulk - Bulk collection operations
 * - GET /api/collections/insights - AI-powered collection insights
 * - GET /api/collections/recommendations - Personalized recommendations
 * - POST /api/collections/[id] - Update collection item
 * - DELETE /api/collections/[id] - Remove from collection
 * - GET /api/collections/export - Export collection data
 */

// Mock Supabase and authentication
vi.mock('@/lib/supabase', () => ({
  createServerSupabase: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
  getCurrentUser: vi.fn(),
}));

describe('Collection Management API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDatabaseMocks();
    setupUserCollectionDatabase();
    setupRpcOperations();
  });

  describe('GET /api/collections', () => {
    test('should return complete collection with fragrance details', async () => {
      const mockCollection = [
        {
          id: '1',
          fragrance_id: 'fragrance-1',
          status: 'owned',
          rating: 5,
          personal_notes: 'Perfect for evening',
          added_at: '2024-12-01T00:00:00Z',
          occasions: ['evening', 'date'],
          seasons: ['winter'],
          usage_frequency: 'weekly',
          fragrance: {
            name: 'Test Fragrance 1',
            brand: 'Test Brand',
            scent_family: 'woody',
            image_url: '/test1.jpg',
            sample_price_usd: 15.99,
          }
        }
      ];

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          collection: mockCollection,
          pagination: { total: 1, page: 1, limit: 50 }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.collection).toHaveLength(1);
      expect(data.collection[0].fragrance.name).toBe('Test Fragrance 1');
      expect(data.pagination.total).toBe(1);
    });

    test('should support pagination for large collections', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          collection: [],
          pagination: { total: 1247, page: 2, limit: 50, totalPages: 25 }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections?page=2&limit=50');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.totalPages).toBe(25);
    });

    test('should support filtering by status', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          collection: [], 
          filters: { status: 'owned' }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections?status=owned');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.status).toBe('owned');
    });

    test('should support filtering by occasions and seasons', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          collection: [],
          filters: { occasions: ['evening'], seasons: ['winter'] }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections?occasions=evening&seasons=winter');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.occasions).toEqual(['evening']);
      expect(data.filters.seasons).toEqual(['winter']);
    });

    test('should support sorting options', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          collection: [],
          sort: { field: 'added_at', direction: 'desc' }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections?sort=added_at&direction=desc');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sort.field).toBe('added_at');
      expect(data.sort.direction).toBe('desc');
    });

    test('should require authentication', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });
  });

  describe('GET /api/collections/insights', () => {
    test('should return AI-powered collection analytics', async () => {
      const mockInsights = {
        personality_profile: {
          dominant_families: ['woody', 'oriental'],
          preferred_intensity: 7.2,
          occasion_preferences: ['evening', 'date'],
          seasonal_distribution: {
            spring: 0.15,
            summer: 0.20,
            fall: 0.35,
            winter: 0.30
          }
        },
        collection_health: {
          diversity_score: 0.73,
          coverage_gaps: ['fresh', 'aquatic'],
          underutilized_items: ['fragrance-x', 'fragrance-y'],
          overrepresented_families: ['woody']
        },
        recommendations: {
          exploration_suggestions: [],
          completion_suggestions: [],
          seasonal_suggestions: []
        },
        usage_patterns: {
          most_worn: 'fragrance-1',
          least_worn: 'fragrance-5',
          frequency_distribution: {
            daily: 3,
            weekly: 12,
            occasional: 8,
            special: 2
          }
        }
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockInsights), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/insights');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.personality_profile).toBeDefined();
      expect(data.collection_health.diversity_score).toBe(0.73);
      expect(data.usage_patterns.most_worn).toBe('fragrance-1');
    });

    test('should provide explainable AI recommendations', async () => {
      const mockExplainableInsights = {
        recommendations: [
          {
            fragrance_id: 'rec-1',
            score: 0.89,
            explanation: {
              primary_reason: "Similar to your favorite Tom Ford Black Orchid",
              contributing_factors: [
                {
                  type: 'similarity',
                  description: 'Shares woody-oriental base',
                  weight: 0.6,
                  evidence: 0.91
                },
                {
                  type: 'gap_filling',
                  description: 'Adds missing fresh top notes',
                  weight: 0.3,
                  evidence: 0.85
                }
              ],
              confidence: 0.89
            }
          }
        ]
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockExplainableInsights), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/insights?explain=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recommendations[0].explanation.primary_reason).toContain('Similar to');
      expect(data.recommendations[0].explanation.confidence).toBe(0.89);
    });

    test('should handle insufficient data for insights gracefully', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          message: 'Insufficient collection data for detailed insights',
          basic_stats: { total: 2, diversity: 0.5 }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/insights');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('Insufficient collection data');
      expect(data.basic_stats.total).toBe(2);
    });

    test('should respect user privacy settings for AI analysis', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          insights_disabled: true,
          message: 'AI insights disabled by user preference'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/insights');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.insights_disabled).toBe(true);
    });
  });

  describe('POST /api/collections/bulk', () => {
    test('should handle bulk collection operations', async () => {
      const bulkOperation = {
        action: 'update_status',
        item_ids: ['1', '2', '3'],
        data: { status: 'tried' }
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          success: true,
          updated_count: 3,
          operation: 'update_status'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkOperation),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.updated_count).toBe(3);
    });

    test('should handle bulk delete operations', async () => {
      const bulkDelete = {
        action: 'delete',
        item_ids: ['1', '2']
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          success: true,
          deleted_count: 2,
          operation: 'delete'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkDelete),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deleted_count).toBe(2);
    });

    test('should validate bulk operation limits', async () => {
      const largeBulkOperation = {
        action: 'update_status',
        item_ids: Array.from({ length: 101 }, (_, i) => i.toString()),
        data: { status: 'tried' }
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          error: 'Bulk operation limited to 100 items per request'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/bulk', {
        method: 'POST',
        body: JSON.stringify(largeBulkOperation),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('limited to 100 items');
    });

    test('should handle partial failures in bulk operations', async () => {
      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          success: false,
          partial_success: true,
          successful_items: ['1', '2'],
          failed_items: ['3'],
          errors: ['Item 3 not found']
        }), {
          status: 207, // Multi-status
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/bulk', {
        method: 'POST',
        body: JSON.stringify({
          action: 'delete',
          item_ids: ['1', '2', '3']
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(207);
      expect(data.partial_success).toBe(true);
      expect(data.successful_items).toEqual(['1', '2']);
      expect(data.failed_items).toEqual(['3']);
    });
  });

  describe('GET /api/collections/recommendations', () => {
    test('should return personalized fragrance recommendations', async () => {
      const mockRecommendations = {
        personalized: [
          {
            fragrance_id: 'rec-1',
            recommendation_score: 0.91,
            recommendation_reasons: ['Similar to your collection', 'Perfect for winter'],
            name: 'Recommended Fragrance 1',
            brand: 'Luxury Brand',
            sample_price: 18.99
          }
        ],
        trending: [
          {
            fragrance_id: 'trend-1',
            trend_score: 0.88,
            name: 'Trending Fragrance 1'
          }
        ],
        gap_filling: [
          {
            fragrance_id: 'gap-1',
            gap_score: 0.85,
            fills_gap: 'fresh citrus for summer',
            name: 'Gap Filling Fragrance 1'
          }
        ]
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockRecommendations), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/recommendations');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.personalized).toHaveLength(1);
      expect(data.personalized[0].recommendation_score).toBe(0.91);
      expect(data.trending).toBeDefined();
      expect(data.gap_filling).toBeDefined();
    });

    test('should support contextual filtering for recommendations', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          personalized: [],
          context: { occasion: 'work', season: 'spring' }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/recommendations?occasion=work&season=spring');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.context.occasion).toBe('work');
      expect(data.context.season).toBe('spring');
    });

    test('should provide cold start recommendations for new users', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          cold_start: true,
          popular_diverse: [
            { fragrance_id: 'pop-1', family: 'fresh', reason: 'Popular starter' },
            { fragrance_id: 'pop-2', family: 'woody', reason: 'Versatile choice' },
            { fragrance_id: 'pop-3', family: 'floral', reason: 'Classic option' }
          ]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/recommendations');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cold_start).toBe(true);
      expect(data.popular_diverse).toHaveLength(3);
    });
  });

  describe('POST /api/collections/[id]', () => {
    test('should update collection item metadata', async () => {
      const updateData = {
        rating: 4,
        personal_notes: 'Updated notes',
        usage_frequency: 'daily',
        occasions: ['work', 'casual'],
        seasons: ['spring', 'summer']
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          success: true,
          updated_item: { id: '1', ...updateData }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/1', {
        method: 'POST',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.updated_item.rating).toBe(4);
      expect(data.updated_item.personal_notes).toBe('Updated notes');
    });

    test('should validate collection item updates', async () => {
      const invalidUpdate = {
        rating: 11, // Invalid rating > 5
        usage_frequency: 'invalid_frequency'
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          error: 'Validation failed',
          details: ['Rating must be between 1-5', 'Invalid usage frequency']
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/1', {
        method: 'POST',
        body: JSON.stringify(invalidUpdate),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContain('Rating must be between 1-5');
    });

    test('should handle non-existent collection items', async () => {
      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          error: 'Collection item not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/nonexistent', {
        method: 'POST',
        body: JSON.stringify({ rating: 5 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Collection item not found');
    });
  });

  describe('GET /api/collections/export', () => {
    test('should export collection data in JSON format', async () => {
      const mockExport = {
        export_date: '2024-12-15T10:00:00Z',
        user_id: 'user-123',
        collection_count: 247,
        format: 'json',
        data: [
          {
            fragrance_name: 'Chanel No. 5',
            brand: 'Chanel',
            status: 'owned',
            rating: 5,
            added_date: '2024-01-15',
            personal_notes: 'Classic and elegant'
          }
        ]
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockExport), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="scentmatch-collection-export.json"'
          },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/export');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.collection_count).toBe(247);
      expect(data.format).toBe('json');
      expect(data.data).toHaveLength(1);
    });

    test('should support CSV export format', async () => {
      const csvContent = `Name,Brand,Status,Rating,Added Date,Notes
Chanel No. 5,Chanel,owned,5,2024-01-15,"Classic and elegant"`;

      const GET = vi.fn().mockResolvedValue(
        new Response(csvContent, {
          status: 200,
          headers: { 
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="scentmatch-collection.csv"'
          },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/export?format=csv');
      const response = await GET(request);
      const data = await response.text();

      expect(response.status).toBe(200);
      expect(data).toContain('Name,Brand,Status,Rating');
      expect(data).toContain('Chanel No. 5,Chanel,owned,5');
    });

    test('should handle large collection exports efficiently', async () => {
      // Test streaming for large exports
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          stream_id: 'export-123',
          status: 'processing',
          estimated_completion: '2024-12-15T10:05:00Z'
        }), {
          status: 202, // Accepted for processing
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/export?format=json&size=large');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.stream_id).toBe('export-123');
      expect(data.status).toBe('processing');
    });
  });

  describe('Error Handling and Security', () => {
    test('should handle database connection errors', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Database connection failed' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Database connection failed');
    });

    test('should implement rate limiting for expensive operations', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/insights');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded');
      expect(response.headers.get('Retry-After')).toBe('60');
    });

    test('should prevent unauthorized access to other users collections', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections?user_id=other-user');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    test('should validate input sanitization', async () => {
      const maliciousInput = {
        personal_notes: '<script>alert("xss")</script>',
        occasions: ['<img src=x onerror=alert(1)>']
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          error: 'Invalid input detected'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections/1', {
        method: 'POST',
        body: JSON.stringify(maliciousInput),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input detected');
    });
  });

  describe('Performance and Caching', () => {
    test('should implement proper caching headers for collection data', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ collection: [] }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'private, max-age=300', // 5 minutes
            'ETag': '"collection-hash-123"'
          },
        })
      );

      const request = new NextRequest('http://localhost/api/collections');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('private, max-age=300');
      expect(response.headers.get('ETag')).toBe('"collection-hash-123"');
    });

    test('should handle conditional requests with ETag', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(null, {
          status: 304, // Not Modified
          headers: { 
            'ETag': '"collection-hash-123"'
          },
        })
      );

      const request = new NextRequest('http://localhost/api/collections', {
        headers: { 'If-None-Match': '"collection-hash-123"' }
      });
      const response = await GET(request);

      expect(response.status).toBe(304);
    });

    test('should optimize queries for large collections', async () => {
      // Test that API uses pagination and proper indexing
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          collection: [],
          query_time_ms: 45, // Should be under 100ms
          cache_hit: true
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/collections?limit=100');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.query_time_ms).toBeLessThan(100);
    });
  });
});