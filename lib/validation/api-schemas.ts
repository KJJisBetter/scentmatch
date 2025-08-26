import { z } from 'zod';

/**
 * API Input Validation Schemas
 *
 * Comprehensive Zod schemas for all API endpoints to prevent:
 * - SQL injection attacks
 * - XSS attacks
 * - Data corruption
 * - Malformed requests
 */

// Common validation patterns
const safeString = z
  .string()
  .trim()
  .min(1, 'Field cannot be empty')
  .refine(val => {
    if (val.length > 1000) return false;
    if (val.includes('<script')) return false;
    if (val.includes('javascript:')) return false;
    if (val.includes('data:text/html')) return false;
    return true;
  }, 'Invalid characters or length detected');

const sessionToken = z
  .string()
  .trim()
  .min(10, 'Invalid session token')
  .max(100, 'Invalid session token')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid session token format');

const uuid = z.string().uuid('Invalid UUID format');

// Quiz API validation schemas
export const quizAnalyzeSchema = z.object({
  responses: z
    .array(
      z.object({
        question_id: z.enum(
          [
            'gender_preference',
            'experience_level',
            'style',
            'occasions',
            'preferences',
            'intensity',
            'budget',
            'scent_preferences_enthusiast',
            'personality_style',
            'occasions_enthusiast',
            'seasons_vibe',
            'scent_preferences_beginner',
            'occasions_beginner',
          ],
          { required_error: 'Invalid question ID' }
        ),
        answer_value: safeString,
        answer: safeString.optional(),
        timestamp: z.string().datetime().optional(),
      })
    )
    .min(1, 'At least one response required')
    .max(20, 'Too many responses'),
  session_token: sessionToken.optional(),
  user_id: uuid.optional(),
});

export type QuizAnalyzeInput = z.infer<typeof quizAnalyzeSchema>;

// Search API validation schemas
export const searchQuerySchema = z.object({
  q: z.string().max(200, 'Search query too long').optional(),
  scent_families: z.array(z.string().max(50)).max(10).optional(),
  occasions: z.array(z.string().max(50)).max(10).optional(),
  seasons: z.array(z.string().max(50)).max(10).optional(),
  sample_only: z.boolean().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  enhanced: z.boolean().default(true),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

// Social API validation schemas
export const socialContextSchema = z.object({
  fragrance_id: uuid,
  user_demographics: z
    .object({
      age_range: z.enum(['18-24', '25-34', '35-44', '45-54', '55+']).optional(),
      location: z.string().max(100).optional(),
    })
    .optional(),
});

export type SocialContextInput = z.infer<typeof socialContextSchema>;

export const socialRatingSchema = z.object({
  fragrance_id: uuid,
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
  user_id: uuid.optional(),
});

export type SocialRatingInput = z.infer<typeof socialRatingSchema>;

// Collection/Wishlist validation schemas
export const collectionItemSchema = z.object({
  fragrance_id: uuid,
  notes: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export type CollectionItemInput = z.infer<typeof collectionItemSchema>;

// Analytics validation schemas
export const analyticsEventSchema = z.object({
  event_type: z.enum([
    'page_view',
    'search',
    'quiz_start',
    'quiz_complete',
    'fragrance_view',
    'collection_add',
    'sample_interest',
  ]),
  event_data: z.record(z.any()).optional(),
  user_id: uuid.optional(),
  session_id: sessionToken.optional(),
});

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;

// Rate limiting validation
export const rateLimitBypassSchema = z.object({
  bypass_token: z
    .string()
    .regex(/^admin_[a-zA-Z0-9]{20,}$/, 'Invalid bypass token'),
});

// Fragrance data validation schemas
export const fragranceDataSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().min(1).max(100),
  gender: z.enum(['men', 'women', 'unisex']),
  scent_family: z.string().max(100).optional(),
  notes: z
    .object({
      top: z.array(z.string().max(50)).max(20).optional(),
      middle: z.array(z.string().max(50)).max(20).optional(),
      base: z.array(z.string().max(50)).max(20).optional(),
    })
    .optional(),
  image_url: z.string().url().max(500).optional(),
  product_url: z.string().url().max(500).optional(),
});

export type FragranceDataInput = z.infer<typeof fragranceDataSchema>;

// Security validation helpers
export const validateApiInput = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } => {
  try {
    const result = schema.safeParse(data);

    if (!result.success) {
      const errorMessage = result.error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');

      return {
        success: false,
        error: `Validation error: ${errorMessage}`,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid input data',
    };
  }
};

// SQL injection prevention
export const sanitizeForDatabase = (input: string): string => {
  return input
    .replace(/['";\\]/g, '') // Remove SQL special characters
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim();
};

// XSS prevention
export const sanitizeForOutput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};
