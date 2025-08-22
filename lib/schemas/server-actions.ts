import { z } from 'zod';
import { 
  CollectionActionParamsSchema,
  CollectionActionResultSchema,
  WishlistActionParamsSchema,
  WishlistActionResultSchema,
  FeedbackParamsSchema,
  FeedbackResultSchema,
  GetCollectionResultSchema,
  GetWishlistResultSchema,
} from './entities';

/**
 * Server Action Validation Schemas
 * 
 * Specialized schemas for Server Action input/output validation.
 * These extend the base entity schemas with Server Action-specific requirements.
 */

// Enhanced Collection Server Action Schemas
export const UpdateUserCollectionParamsSchema = z.object({
  action: z.enum(['add', 'remove', 'rate', 'update'], {
    required_error: 'Action is required',
    invalid_type_error: 'Invalid action type',
  }),
  fragrance_id: z.string().uuid('Invalid fragrance ID format'),
  metadata: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    notes: z.string().max(1000, 'Notes too long').optional(),
    tags: z.array(z.string().max(50, 'Tag too long')).max(10, 'Too many tags').optional(),
  }).optional(),
});

export type UpdateUserCollectionParams = z.infer<typeof UpdateUserCollectionParamsSchema>;

export const UpdateUserCollectionResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  data: z.object({
    id: z.string().uuid().optional(),
    in_collection: z.boolean(),
    action_performed: z.enum(['add', 'remove', 'rate', 'update']),
    message: z.string(),
  }).optional(),
});

export type UpdateUserCollectionResult = z.infer<typeof UpdateUserCollectionResultSchema>;

// Enhanced Wishlist Server Action Schemas  
export const UpdateUserWishlistParamsSchema = z.object({
  action: z.enum(['add', 'remove', 'bulk_add', 'clear'], {
    required_error: 'Action is required', 
    invalid_type_error: 'Invalid action type',
  }),
  fragrance_ids: z.union([
    z.string().uuid('Invalid fragrance ID format'),
    z.array(z.string().uuid('Invalid fragrance ID format')).min(1, 'At least one fragrance ID required'),
  ]),
});

export type UpdateUserWishlistParams = z.infer<typeof UpdateUserWishlistParamsSchema>;

export const UpdateUserWishlistResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  count: z.number().int().min(0).optional(),
  data: z.object({
    action_performed: z.enum(['add', 'remove', 'bulk_add', 'clear']),
    items_affected: z.number().int().min(0),
    message: z.string(),
  }).optional(),
});

export type UpdateUserWishlistResult = z.infer<typeof UpdateUserWishlistResultSchema>;

// Enhanced Feedback Server Action Schemas
export const SubmitRecommendationFeedbackParamsSchema = z.object({
  recommendation_id: z.string().uuid('Invalid recommendation ID format'),
  feedback: z.object({
    rating: z.number().int().min(1).max(5),
    helpful: z.boolean(),
    notes: z.string().max(500, 'Notes too long').optional(),
    feedback_type: z.enum(['like', 'dislike', 'love', 'maybe', 'dismiss']).optional(),
    confidence: z.number().min(0).max(1).default(0.8),
    time_to_feedback_seconds: z.number().positive().optional(),
    context: z.record(z.any()).optional(),
  }),
});

export type SubmitRecommendationFeedbackParams = z.infer<typeof SubmitRecommendationFeedbackParamsSchema>;

export const SubmitRecommendationFeedbackResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  feedback_id: z.string().uuid().optional(),
  learning_applied: z.boolean().default(false),
  recommendations_refreshed: z.boolean().default(false),
  message: z.string(),
});

export type SubmitRecommendationFeedbackResult = z.infer<typeof SubmitRecommendationFeedbackResultSchema>;

// Status Check Schemas
export const CollectionStatusResultSchema = z.object({
  success: z.boolean(),
  in_collection: z.boolean(),
  error: z.string().optional(),
});

export type CollectionStatusResult = z.infer<typeof CollectionStatusResultSchema>;

export const WishlistStatusResultSchema = z.object({
  success: z.boolean(),
  in_wishlist: z.boolean(),
  error: z.string().optional(),
});

export type WishlistStatusResult = z.infer<typeof WishlistStatusResultSchema>;

// Batch Operation Schemas
export const BatchCollectionActionParamsSchema = z.object({
  actions: z.array(z.object({
    fragrance_id: z.string().uuid('Invalid fragrance ID format'),
    action: z.enum(['add', 'remove', 'rate']),
    rating: z.number().int().min(1).max(5).optional(),
    notes: z.string().max(500, 'Notes too long').optional(),
  })).min(1, 'At least one action required').max(50, 'Too many actions in batch'),
});

export type BatchCollectionActionParams = z.infer<typeof BatchCollectionActionParamsSchema>;

export const BatchCollectionActionResultSchema = z.object({
  success: z.boolean(),
  results: z.array(z.object({
    fragrance_id: z.string().uuid(),
    success: z.boolean(),
    error: z.string().optional(),
  })),
  total_processed: z.number().int().min(0),
  successful: z.number().int().min(0),
  failed: z.number().int().min(0),
});

export type BatchCollectionActionResult = z.infer<typeof BatchCollectionActionResultSchema>;

// Server Action Input Validation Helpers
export const validateServerActionInput = <T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errorMessage = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    return { success: false, error: errorMessage };
  }
};

// Form Data Validation (for form submissions)
export const validateFormData = (formData: FormData, schema: z.ZodSchema) => {
  const data: Record<string, any> = {};
  
  // Convert FormData to plain object
  for (const [key, value] of formData.entries()) {
    if (key.endsWith('[]')) {
      // Handle array fields
      const arrayKey = key.slice(0, -2);
      if (!data[arrayKey]) data[arrayKey] = [];
      data[arrayKey].push(value);
    } else {
      data[key] = value;
    }
  }
  
  return validateServerActionInput(schema, data);
};

// JSON Validation (for JSON payloads)
export const validateJSONData = async (request: Request, schema: z.ZodSchema) => {
  try {
    const data = await request.json();
    return validateServerActionInput(schema, data);
  } catch (error) {
    return { success: false, error: 'Invalid JSON payload' };
  }
};

// Export all validation schemas for easy access
export {
  CollectionActionParamsSchema,
  CollectionActionResultSchema,
  WishlistActionParamsSchema,
  WishlistActionResultSchema,
  FeedbackParamsSchema,
  FeedbackResultSchema,
  GetCollectionResultSchema,
  GetWishlistResultSchema,
} from './entities';

// Re-export entity schemas for convenience
export * from './entities';