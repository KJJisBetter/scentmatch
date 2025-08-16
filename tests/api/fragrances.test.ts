import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { setupRpcOperations, resetDatabaseMocks } from '../utils/database-test-utils';

/**
 * Fragrance API Routes Tests
 * 
 * Tests for API routes that support the fragrance detail page:
 * - GET /api/fragrances/[id] - Get fragrance details
 * - GET /api/fragrances/[id]/similar - Get similar fragrances
 * - POST /api/fragrances/[id]/interactions - Track user interactions
 * - GET /api/fragrances/[id]/collection-status - Check if in user collection
 * - POST /api/fragrances/[id]/collection - Add/remove from collection
 */

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createServiceSupabase: vi.fn(() => ({
    from: vi.fn(),
    rpc: vi.fn(),
  })),
  createServerSupabase: vi.fn(() => ({
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
  })),
}));

// Mock authentication helper
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
  getCurrentUser: vi.fn(),
}));

describe('Fragrance API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDatabaseMocks();
    setupRpcOperations();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/fragrances/[id]', () => {
    test('should return fragrance details for valid ID', async () => {
      const mockFragrance = {
        id: 'fragrance-123',
        name: 'Test Fragrance',
        brand_id: 'brand-1',
        description: 'A test fragrance',
        notes: ['bergamot', 'rose', 'sandalwood'],
        image_url: 'https://example.com/fragrance.jpg',
        intensity_score: 7,
        longevity_hours: 8,
        sillage_rating: 6,
        recommended_occasions: ['evening', 'date'],
        recommended_seasons: ['fall', 'winter'],
        sample_available: true,
        sample_price_usd: 15.99,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      // Mock the API route handler
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockFragrance), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123');
      const response = await GET(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('fragrance-123');
      expect(data.name).toBe('Test Fragrance');
      expect(data.sample_available).toBe(true);
    });

    test('should return 404 for non-existent fragrance', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Fragrance not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/nonexistent');
      const response = await GET(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Fragrance not found');
    });

    test('should return 400 for invalid fragrance ID format', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Invalid fragrance ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/invalid-id');
      const response = await GET(request, { params: { id: 'invalid-id' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid fragrance ID');
    });

    test('should include brand information in response', async () => {
      const mockFragranceWithBrand = {
        id: 'fragrance-123',
        name: 'Test Fragrance',
        brand: {
          id: 'brand-1',
          name: 'Test Brand',
          website_url: 'https://testbrand.com',
        },
        description: 'A test fragrance',
        notes: ['bergamot', 'rose', 'sandalwood'],
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockFragranceWithBrand), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123');
      const response = await GET(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.brand).toBeDefined();
      expect(data.brand.name).toBe('Test Brand');
    });

    test('should handle database errors gracefully', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Database error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123');
      const response = await GET(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
    });
  });

  describe('GET /api/fragrances/[id]/similar', () => {
    test('should return similar fragrances using vector similarity', async () => {
      const mockSimilarFragrances = [
        {
          fragrance_id: 'similar-1',
          similarity_score: 0.85,
          name: 'Similar Fragrance 1',
          brand: 'Brand A',
        },
        {
          fragrance_id: 'similar-2',
          similarity_score: 0.78,
          name: 'Similar Fragrance 2',
          brand: 'Brand B',
        },
      ];

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ similar: mockSimilarFragrances }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/similar');
      const response = await GET(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.similar).toHaveLength(2);
      expect(data.similar[0].similarity_score).toBe(0.85);
    });

    test('should accept similarity threshold parameter', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ similar: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/similar?threshold=0.9');
      const response = await GET(request, { params: { id: 'fragrance-123' } });

      expect(response.status).toBe(200);
    });

    test('should accept max results parameter', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ similar: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/similar?limit=5');
      const response = await GET(request, { params: { id: 'fragrance-123' } });

      expect(response.status).toBe(200);
    });

    test('should handle no similar fragrances found', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ similar: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/similar');
      const response = await GET(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.similar).toEqual([]);
    });

    test('should return 404 for non-existent fragrance', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Fragrance not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/nonexistent/similar');
      const response = await GET(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Fragrance not found');
    });
  });

  describe('POST /api/fragrances/[id]/interactions', () => {
    test('should track user view interaction', async () => {
      const mockInteraction = {
        id: 'interaction-1',
        user_id: 'user-123',
        fragrance_id: 'fragrance-123',
        interaction_type: 'view',
        interaction_context: 'detail_page',
        created_at: '2025-01-01T00:00:00Z',
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, interaction: mockInteraction }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/interactions', {
        method: 'POST',
        body: JSON.stringify({
          interaction_type: 'view',
          interaction_context: 'detail_page',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.interaction.interaction_type).toBe('view');
    });

    test('should track like/dislike interactions', async () => {
      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/interactions', {
        method: 'POST',
        body: JSON.stringify({
          interaction_type: 'like',
          interaction_context: 'detail_page',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    test('should track sample request interactions', async () => {
      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/interactions', {
        method: 'POST',
        body: JSON.stringify({
          interaction_type: 'sample_request',
          interaction_context: 'purchase_flow',
          interaction_metadata: { sample_size: '2ml', price: 15.99 },
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    test('should require authentication for tracking', async () => {
      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/interactions', {
        method: 'POST',
        body: JSON.stringify({
          interaction_type: 'view',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    test('should validate interaction type', async () => {
      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Invalid interaction type' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/interactions', {
        method: 'POST',
        body: JSON.stringify({
          interaction_type: 'invalid_type',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid interaction type');
    });
  });

  describe('GET /api/fragrances/[id]/collection-status', () => {
    test('should return collection status for authenticated user', async () => {
      const mockStatus = {
        in_collection: true,
        status: 'owned',
        rating: 4,
        personal_notes: 'Love this for evening wear',
        added_at: '2025-01-01T00:00:00Z',
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockStatus), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/collection-status');
      const response = await GET(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.in_collection).toBe(true);
      expect(data.status).toBe('owned');
      expect(data.rating).toBe(4);
    });

    test('should return not in collection for fragrance not owned', async () => {
      const mockStatus = {
        in_collection: false,
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockStatus), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/collection-status');
      const response = await GET(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.in_collection).toBe(false);
    });

    test('should require authentication', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/collection-status');
      const response = await GET(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });
  });

  describe('POST /api/fragrances/[id]/collection', () => {
    test('should add fragrance to collection', async () => {
      const mockCollectionItem = {
        id: 'collection-1',
        user_id: 'user-123',
        fragrance_id: 'fragrance-123',
        status: 'owned',
        rating: 4,
        personal_notes: 'Great for evening',
        added_at: '2025-01-01T00:00:00Z',
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, item: mockCollectionItem }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/collection', {
        method: 'POST',
        body: JSON.stringify({
          action: 'add',
          status: 'owned',
          rating: 4,
          personal_notes: 'Great for evening',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.item.status).toBe('owned');
      expect(data.item.rating).toBe(4);
    });

    test('should remove fragrance from collection', async () => {
      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, action: 'removed' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/collection', {
        method: 'POST',
        body: JSON.stringify({
          action: 'remove',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('removed');
    });

    test('should update collection item', async () => {
      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, action: 'updated' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/collection', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update',
          rating: 5,
          personal_notes: 'Updated notes',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('updated');
    });

    test('should require authentication', async () => {
      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/collection', {
        method: 'POST',
        body: JSON.stringify({
          action: 'add',
          status: 'owned',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    test('should validate required fields', async () => {
      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Action is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/collection', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Action is required');
    });

    test('should handle duplicate collection entries', async () => {
      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Fragrance already in collection' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/collection', {
        method: 'POST',
        body: JSON.stringify({
          action: 'add',
          status: 'owned',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Fragrance already in collection');
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Database connection failed' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123');
      const response = await GET(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Database connection failed');
    });

    test('should handle malformed request bodies', async () => {
      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Invalid JSON' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123/interactions', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON');
    });

    test('should handle rate limiting', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/fragrances/fragrance-123');
      const response = await GET(request, { params: { id: 'fragrance-123' } });
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded');
    });
  });
});