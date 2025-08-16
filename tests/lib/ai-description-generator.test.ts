import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateFragranceDescription, getOrCreateDescription } from '@/lib/ai/description-generator';

// Mock Voyage AI client
vi.mock('@/lib/ai/voyage-client', () => ({
  generateText: vi.fn(),
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createServerSupabase: vi.fn(),
}));

describe('AI Fragrance Description Generator', () => {
  const mockFragrance = {
    id: '123',
    name: 'Aventus',
    brand: 'Creed',
    notes: ['pineapple', 'birch', 'blackcurrant', 'oakmoss'],
    scent_family: 'fruity',
    description: 'A bold and confident fragrance',
    intensity_score: 8.5,
    longevity_hours: 8,
    mood_tags: ['confident', 'sophisticated', 'masculine']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateFragranceDescription', () => {
    it('should generate personality-focused description from fragrance data', async () => {
      const { generateText } = await import('@/lib/ai/voyage-client');
      (generateText as any).mockResolvedValue('This is a bold, confident fragrance that exudes sophistication and masculine energy. Perfect for the modern professional who wants to make a lasting impression.');

      const result = await generateFragranceDescription(mockFragrance);

      expect(result).toContain('bold');
      expect(result).toContain('confident');
      expect(result.length).toBeGreaterThan(50);
      expect(generateText).toHaveBeenCalledWith(expect.stringContaining('Aventus'));
    });

    it('should handle AI generation failures gracefully', async () => {
      const { generateText } = await import('@/lib/ai/voyage-client');
      (generateText as any).mockRejectedValue(new Error('AI service unavailable'));

      const result = await generateFragranceDescription(mockFragrance);

      expect(result).toBe(mockFragrance.description); // Should fall back to original
    });

    it('should create appropriate prompts for different fragrance types', async () => {
      const { generateText } = await import('@/lib/ai/voyage-client');
      (generateText as any).mockResolvedValue('Elegant floral description');

      const floralFragrance = {
        ...mockFragrance,
        name: 'Chanel No. 5',
        brand: 'Chanel',
        scent_family: 'floral',
        notes: ['ylang-ylang', 'rose', 'jasmine'],
        mood_tags: ['elegant', 'timeless', 'feminine']
      };

      await generateFragranceDescription(floralFragrance);

      const callArgs = (generateText as any).mock.calls[0][0];
      expect(callArgs).toContain('floral');
      expect(callArgs).toContain('Chanel No. 5');
      expect(callArgs).toContain('elegant');
    });

    it('should include scent notes in the prompt', async () => {
      const { generateText } = await import('@/lib/ai/voyage-client');
      (generateText as any).mockResolvedValue('Description with notes');

      await generateFragranceDescription(mockFragrance);

      const callArgs = (generateText as any).mock.calls[0][0];
      expect(callArgs).toContain('pineapple');
      expect(callArgs).toContain('birch');
      expect(callArgs).toContain('blackcurrant');
    });
  });

  describe('getOrCreateDescription', () => {
    it('should return cached description if exists', async () => {
      const { createServerSupabase } = await import('@/lib/supabase');
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { ai_description: 'Cached description' },
                error: null
              }))
            }))
          }))
        }))
      };
      (createServerSupabase as any).mockResolvedValue(mockSupabase);

      const result = await getOrCreateDescription('123', mockFragrance);

      expect(result).toBe('Cached description');
    });

    it('should generate and cache new description if none exists', async () => {
      const { createServerSupabase } = await import('@/lib/supabase');
      const { generateText } = await import('@/lib/ai/voyage-client');
      
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: null
              }))
            }))
          })),
          upsert: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      };
      (createServerSupabase as any).mockResolvedValue(mockSupabase);
      (generateText as any).mockResolvedValue('New AI description');

      const result = await getOrCreateDescription('123', mockFragrance);

      expect(result).toBe('New AI description');
      expect(mockSupabase.from).toHaveBeenCalledWith('fragrance_ai_cache');
    });

    it('should fall back to original description if caching fails', async () => {
      const { createServerSupabase } = await import('@/lib/supabase');
      const { generateText } = await import('@/lib/ai/voyage-client');
      
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: null
              }))
            }))
          })),
          upsert: vi.fn(() => ({
            data: null,
            error: new Error('Database error')
          }))
        }))
      };
      (createServerSupabase as any).mockResolvedValue(mockSupabase);
      (generateText as any).mockResolvedValue('New AI description');

      const result = await getOrCreateDescription('123', mockFragrance);

      expect(result).toBe('A bold and confident fragrance'); // Original description
    });
  });

  describe('AI Description Quality', () => {
    it('should generate descriptions with appropriate length', async () => {
      const { generateText } = await import('@/lib/ai/voyage-client');
      (generateText as any).mockResolvedValue('This is a sophisticated fragrance that captures the essence of modern masculinity. With its bold opening of fresh pineapple and rich blackcurrant, it immediately commands attention. The heart reveals a complex interplay of birch and jasmine, creating a unique tension between strength and elegance.');

      const result = await generateFragranceDescription(mockFragrance);

      expect(result.length).toBeGreaterThan(100);
      expect(result.length).toBeLessThan(1000);
    });

    it('should focus on personality and mood over technical details', async () => {
      const { generateText } = await import('@/lib/ai/voyage-client');
      (generateText as any).mockResolvedValue('This fragrance embodies confidence and sophistication, perfect for someone who wants to project authority while maintaining elegance.');

      const result = await generateFragranceDescription(mockFragrance);

      // Should focus on personality traits
      expect(result.toLowerCase()).toMatch(/confident|sophisticat|bold|elegant/);
      // Should avoid overly technical language
      expect(result).not.toMatch(/esters|aldehydes|molecular/);
    });

    it('should handle edge cases like missing notes gracefully', async () => {
      const { generateText } = await import('@/lib/ai/voyage-client');
      (generateText as any).mockResolvedValue('A mysterious and intriguing fragrance');

      const fragranceWithoutNotes = {
        ...mockFragrance,
        notes: [],
        mood_tags: []
      };

      const result = await generateFragranceDescription(fragranceWithoutNotes);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});