import { z } from 'zod';

/**
 * Guest Engagement Schema Definitions
 * 
 * Zod schemas for tracking guest user engagement and conversion optimization
 */

export const EngagementEventSchema = z.object({
  type: z.enum([
    'fragrance_detail_view',
    'favorite_added',
    'sample_interest',
    'quiz_result_share',
    'comparison_view',
    'time_spent',
    'additional_recommendations_viewed',
    'conversion_initiated',
    'continue_as_guest'
  ]),
  fragrance_id: z.string().optional(),
  duration_seconds: z.number().optional(),
  timestamp: z.number(),
  metadata: z.record(z.any()).optional()
});

export const GuestEngagementSignalsSchema = z.object({
  session_token: z.string().min(1),
  engagement_events: z.array(EngagementEventSchema),
  investment_score: z.number().min(0).max(1).optional(),
  conversion_readiness: z.enum(['low', 'medium', 'high']).optional(),
  optimal_conversion_timing: z.boolean().optional()
});

export const ConversionTriggerSchema = z.object({
  trigger: z.enum(['high_engagement', 'extended_exploration', 'share_intent', 'multiple_favorites']),
  context: z.string(),
  investment_score: z.number().min(0).max(1),
  message: z.string().optional(),
  timing: z.enum(['poor', 'good', 'perfect', 'excellent']).optional()
});

export const ProgressiveValuePhaseSchema = z.enum(['exploration', 'investment', 'conversion', 'retention']);

export const GuestToAccountTransferSchema = z.object({
  guest_session_token: z.string().min(1),
  guest_data: z.object({
    quiz_responses: z.number().optional(),
    personality_profile: z.record(z.any()).optional(),
    engagement_history: z.array(EngagementEventSchema).optional(),
    investment_score: z.number().min(0).max(1).optional(),
    time_invested: z.number().optional()
  }),
  account_data: z.object({
    email: z.string().email(),
    first_name: z.string().min(1)
  }),
  user_id: z.string().min(1)
});

// Database table schemas

export const GuestEngagementTrackingSchema = z.object({
  id: z.string().uuid().optional(),
  session_token: z.string(),
  engagement_events: z.array(EngagementEventSchema),
  investment_score: z.number().min(0).max(1),
  conversion_readiness: z.enum(['low', 'medium', 'high']),
  tracked_at: z.string().datetime(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export const ConversionMetricsSchema = z.object({
  id: z.string().uuid().optional(),
  session_token: z.string(),
  funnel_stage: z.enum(['quiz_completion', 'results_engagement', 'value_building', 'conversion_trigger', 'account_creation']),
  stage_entry_time: z.string().datetime(),
  stage_exit_time: z.string().datetime().optional(),
  conversion_successful: z.boolean().optional(),
  drop_off_reason: z.string().optional(),
  investment_score_at_stage: z.number().min(0).max(1).optional(),
  created_at: z.string().datetime().optional()
});

// API response schemas

export const TrackEngagementResponseSchema = z.object({
  tracking_successful: z.boolean(),
  investment_score: z.number().min(0).max(1),
  engagement_quality: z.enum(['low', 'medium', 'high']),
  conversion_signals: z.object({
    favorites_added: z.number(),
    time_spent_minutes: z.number(),
    detail_views: z.number(),
    share_actions: z.number()
  }),
  recommended_action: z.enum(['offer_conversion', 'continue_building_value']),
  error: z.string().optional()
});

export const ProgressiveValueResponseSchema = z.object({
  phase_1_discovery: z.object({
    message: z.string(),
    tone: z.string(),
    call_to_action: z.string(),
    limitation_messaging: z.boolean(),
    additional_recommendations_hint: z.boolean().optional()
  }).optional(),
  phase_2_investment: z.object({
    message: z.string(),
    tone: z.string(),
    additional_value: z.boolean(),
    investment_indicators: z.array(z.string()),
    conversion_readiness: z.boolean().optional()
  }).optional(),
  phase_3_conversion: z.object({
    message: z.string(),
    tone: z.string(),
    timing: z.string(),
    forced: z.boolean()
  }).optional(),
  investment_score: z.number().min(0).max(1),
  recommended_next_phase: z.string(),
  error: z.string().optional()
});

export const ConversionTriggerResponseSchema = z.object({
  trigger_appropriate: z.boolean(),
  conversion_message: z.string().optional(),
  user_investment_level: z.number().min(0).max(1).optional(),
  timing_quality: z.string().optional(),
  expected_conversion_rate: z.number().min(0).max(1).optional(),
  personalization_applied: z.boolean().optional(),
  reason: z.string().optional(),
  recommended_action: z.string().optional(),
  current_investment: z.number().min(0).max(1).optional(),
  minimum_threshold: z.number().min(0).max(1).optional(),
  error: z.string().optional()
});

export const GuestToAccountTransferResponseSchema = z.object({
  transfer_successful: z.boolean(),
  data_preservation: z.object({
    quiz_responses: z.number(),
    personality_profile: z.boolean(),
    favorites: z.number(),
    engagement_history: z.number(),
    investment_score: z.number().min(0).max(1)
  }).optional(),
  enhanced_account: z.object({
    onboarding_completed: z.boolean(),
    personalization_active: z.boolean(),
    recommendations_count: z.number(),
    immediate_benefits_applied: z.boolean()
  }).optional(),
  user_experience: z.object({
    seamless_transition: z.boolean(),
    no_data_loss: z.boolean(),
    immediate_value_delivery: z.boolean()
  }),
  error: z.string().optional()
});

// Type exports for TypeScript

export type EngagementEvent = z.infer<typeof EngagementEventSchema>;
export type GuestEngagementSignals = z.infer<typeof GuestEngagementSignalsSchema>;
export type ConversionTrigger = z.infer<typeof ConversionTriggerSchema>;
export type ProgressiveValuePhase = z.infer<typeof ProgressiveValuePhaseSchema>;
export type GuestToAccountTransfer = z.infer<typeof GuestToAccountTransferSchema>;
export type GuestEngagementTracking = z.infer<typeof GuestEngagementTrackingSchema>;
export type ConversionMetrics = z.infer<typeof ConversionMetricsSchema>;
export type TrackEngagementResponse = z.infer<typeof TrackEngagementResponseSchema>;
export type ProgressiveValueResponse = z.infer<typeof ProgressiveValueResponseSchema>;
export type ConversionTriggerResponse = z.infer<typeof ConversionTriggerResponseSchema>;
export type GuestToAccountTransferResponse = z.infer<typeof GuestToAccountTransferResponseSchema>;