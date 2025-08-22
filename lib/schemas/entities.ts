import { z } from 'zod';

/**
 * Entity Validation Schemas
 * 
 * Comprehensive Zod schemas for all ScentMatch entities, replacing
 * TypeScript interfaces with runtime-validated schemas.
 * 
 * This consolidates User, Fragrance, Collection, Wishlist, and Recommendation
 * schemas with proper validation rules and type inference.
 */

// Base User Schema
export const UserSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  email: z.string().email('Invalid email format'),
  created_at: z.string().datetime('Invalid date format').optional(),
  updated_at: z.string().datetime('Invalid date format').optional(),
});

export type User = z.infer<typeof UserSchema>;

// Enhanced Fragrance Schema (extending the existing one)
export const FragranceSchema = z.object({
  id: z.string().uuid('Invalid fragrance ID format'),
  name: z.string().min(1, 'Fragrance name is required').max(200, 'Fragrance name too long'),
  brand: z.string().min(1, 'Brand name is required').max(100, 'Brand name too long'),
  scent_family: z.string().max(50, 'Scent family too long').nullable(),
  gender: z.enum(['Men', 'Women', 'Unisex']).nullable(),
  concentration: z.enum(['EDT', 'EDP', 'PARFUM', 'COLOGNE', 'OTHER']).default('OTHER'),
  launch_year: z.number().int().min(1900).max(new Date().getFullYear()).nullable(),
  sample_available: z.boolean().nullable(),
  sample_price_usd: z.number().positive('Sample price must be positive').nullable(),
  notes: z.object({
    top: z.array(z.string()).default([]),
    middle: z.array(z.string()).default([]),
    base: z.array(z.string()).default([]),
  }).default({ top: [], middle: [], base: [] }),
  image_url: z.string().url('Invalid image URL').nullable(),
  product_url: z.string().url('Invalid product URL').nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Fragrance = z.infer<typeof FragranceSchema>;

// Collection Item Schema
export const CollectionItemSchema = z.object({
  id: z.string().uuid('Invalid collection item ID format'),
  user_id: z.string().uuid('Invalid user ID format'),
  fragrance_id: z.string().uuid('Invalid fragrance ID format'),
  collection_type: z.enum(['owned', 'wishlist', 'tried', 'sample']),
  rating: z.number().int().min(1).max(5).nullable(),
  notes: z.string().max(1000, 'Notes too long').nullable(),
  added_at: z.string().datetime('Invalid date format'),
  updated_at: z.string().datetime('Invalid date format').optional(),
  
  // Optional fragrance details for populated responses
  fragrance: FragranceSchema.optional(),
});

export type CollectionItem = z.infer<typeof CollectionItemSchema>;

// Collection Action Schemas
export const CollectionActionParamsSchema = z.object({
  fragrance_id: z.string().min(1, 'Fragrance ID is required')
    .refine(id => {
      // Accept both UUID format and slug format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const slugRegex = /^[\w\-]+(__|[\w\-]+)*$/;
      return uuidRegex.test(id) || slugRegex.test(id);
    }, 'Invalid fragrance ID format'),
  action: z.enum(['add', 'remove'], {
    required_error: 'Action is required',
    invalid_type_error: 'Action must be either "add" or "remove"',
  }),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

export type CollectionActionParams = z.infer<typeof CollectionActionParamsSchema>;

export const CollectionActionResultSchema = z.object({
  success: z.boolean(),
  in_collection: z.boolean(),
  message: z.string(),
  error: z.string().optional(),
});

export type CollectionActionResult = z.infer<typeof CollectionActionResultSchema>;

// Wishlist Action Schemas
export const WishlistActionParamsSchema = z.object({
  fragrance_id: z.string().uuid('Invalid fragrance ID format'),
  action: z.enum(['add', 'remove'], {
    required_error: 'Action is required',
    invalid_type_error: 'Action must be either "add" or "remove"',
  }),
});

export type WishlistActionParams = z.infer<typeof WishlistActionParamsSchema>;

export const WishlistActionResultSchema = z.object({
  success: z.boolean(),
  in_wishlist: z.boolean(),
  message: z.string(),
  error: z.string().optional(),
});

export type WishlistActionResult = z.infer<typeof WishlistActionResultSchema>;

// Recommendation Schema
export const RecommendationSchema = z.object({
  id: z.string().uuid('Invalid recommendation ID format'),
  user_id: z.string().uuid('Invalid user ID format'),
  fragrance_id: z.string().uuid('Invalid fragrance ID format'),
  algorithm_used: z.enum(['hybrid', 'ai_similarity', 'collaborative', 'content_based', 'thompson_sampling']),
  confidence_score: z.number().min(0).max(1),
  recommendation_reason: z.string().max(500, 'Recommendation reason too long').optional(),
  position: z.number().int().min(1).optional(),
  session_id: z.string().optional(),
  created_at: z.string().datetime('Invalid date format'),
  
  // Optional fragrance details for populated responses  
  fragrance: FragranceSchema.optional(),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

// Feedback Schemas
export const FeedbackParamsSchema = z.object({
  fragrance_id: z.string().uuid('Invalid fragrance ID format'),
  feedback_type: z.enum([
    'like', 'dislike', 'rating', 'purchase_intent', 
    'love', 'maybe', 'dismiss'
  ], {
    required_error: 'Feedback type is required',
    invalid_type_error: 'Invalid feedback type',
  }),
  rating_value: z.number().int().min(1).max(5).optional(),
  confidence: z.number().min(0).max(1).default(0.8),
  reason: z.string().max(500, 'Feedback reason too long').optional(),
  recommendation_id: z.string().uuid('Invalid recommendation ID format').optional(),
  source: z.string().max(50, 'Source too long').optional(),
  position: z.number().int().min(1).optional(),
  context: z.record(z.any()).optional(),
  algorithm_used: z.string().max(50, 'Algorithm name too long').optional(),
  session_id: z.string().optional(),
  time_to_action_seconds: z.number().positive().optional(),
  time_spent_before_rating: z.number().positive().optional(),
  previous_interactions: z.number().int().min(0).optional(),
});

export type FeedbackParams = z.infer<typeof FeedbackParamsSchema>;

export const FeedbackResultSchema = z.object({
  success: z.boolean(),
  feedback_processed: z.boolean(),
  feedback_id: z.string().optional(),
  learning_impact: z.number().min(0).max(1).optional(),
  preference_update: z.object({
    preferences_updated: z.boolean(),
    embedding_updated: z.boolean(),
    confidence_change: z.number(),
    learning_weight: z.number().min(0).max(1),
  }).optional(),
  recommendation_refresh: z.object({
    cache_invalidated: z.boolean(),
    new_recommendations_available: z.boolean(),
    refresh_recommended: z.boolean(),
  }).optional(),
  feedback_quality: z.object({
    reliability_score: z.number().min(0).max(1),
    quality_level: z.enum(['low', 'medium', 'high']),
    trust_factors: z.record(z.any()),
  }).optional(),
  bandit_optimization: z.object({
    algorithm_updated: z.boolean(),
    new_success_rate: z.number().min(0).max(1),
    bandit_learning_impact: z.number().min(0).max(1),
    processing_time_ms: z.number().positive(),
  }).nullable(),
  user_message: z.string(),
  metadata: z.object({
    processing_time_ms: z.number().positive(),
    ai_learning_applied: z.boolean(),
    bandit_learning_applied: z.boolean(),
    preference_adjustment_type: z.any(),
  }).optional(),
  error: z.string().optional(),
});

export type FeedbackResult = z.infer<typeof FeedbackResultSchema>;

// User Preferences Schema
export const UserPreferencesSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  scent_families: z.array(z.string()).default([]),
  preferred_concentration: z.array(z.enum(['EDT', 'EDP', 'PARFUM', 'COLOGNE'])).default([]),
  gender_preference: z.enum(['Men', 'Women', 'Unisex', 'All']).default('All'),
  budget_range: z.object({
    min: z.number().min(0).default(0),
    max: z.number().positive().default(200),
  }).default({ min: 0, max: 200 }),
  experience_level: z.enum(['beginner', 'enthusiast', 'experienced']).default('beginner'),
  sample_preference: z.boolean().default(true),
  seasonal_preferences: z.array(z.enum(['spring', 'summer', 'fall', 'winter'])).default([]),
  occasion_preferences: z.array(z.string()).default([]),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// API Response Schemas
export const GetCollectionResultSchema = z.object({
  success: z.boolean(),
  collection: z.array(CollectionItemSchema).optional(),
  total: z.number().int().min(0).optional(),
  error: z.string().optional(),
});

export type GetCollectionResult = z.infer<typeof GetCollectionResultSchema>;

export const GetWishlistResultSchema = z.object({
  success: z.boolean(),
  wishlist: z.array(CollectionItemSchema).optional(),
  total: z.number().int().min(0).optional(),
  error: z.string().optional(),
});

export type GetWishlistResult = z.infer<typeof GetWishlistResultSchema>;

// Utility validation functions
export const validateFragranceId = (id: string): boolean => {
  const result = z.string().uuid().safeParse(id);
  return result.success;
};

export const validateUserId = (id: string): boolean => {
  const result = z.string().uuid().safeParse(id);
  return result.success;
};

export const validateRating = (rating: number): boolean => {
  const result = z.number().int().min(1).max(5).safeParse(rating);
  return result.success;
};

// Schema validation helpers
export const createCollectionItem = (data: unknown): CollectionItem => {
  return CollectionItemSchema.parse(data);
};

export const validateCollectionAction = (data: unknown): { success: boolean; data?: CollectionActionParams; error?: string } => {
  const result = CollectionActionParamsSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { 
      success: false, 
      error: result.error.issues.map(issue => issue.message).join(', ')
    };
  }
};

export const validateWishlistAction = (data: unknown): { success: boolean; data?: WishlistActionParams; error?: string } => {
  const result = WishlistActionParamsSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { 
      success: false, 
      error: result.error.issues.map(issue => issue.message).join(', ')
    };
  }
};

export const validateFeedbackParams = (data: unknown): { success: boolean; data?: FeedbackParams; error?: string } => {
  const result = FeedbackParamsSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { 
      success: false, 
      error: result.error.issues.map(issue => issue.message).join(', ')
    };
  }
};