/**
 * Collection Analytics Types - Task 1.4
 * 
 * Comprehensive type definitions for collection analytics system
 * Ensures type safety across analytics features and components
 */

// Core Analytics Types
export interface CollectionStats {
  collection_size: number;
  total_ratings: number;
  average_rating: number;
  most_recent_addition: string | null;
  scent_family_breakdown: ScentFamilyBreakdown[];
  completion_rate: number;
}

export interface ScentFamilyBreakdown {
  family: string;
  count: number;
  percentage: number;
}

// Comprehensive Insights
export interface CollectionInsights {
  scent_profile_analysis: ScentProfileAnalysis;
  discovery_stats: DiscoveryStats;
  social_context: SocialContext;
  engagement_metrics: EngagementMetrics;
}

export interface ScentProfileAnalysis {
  dominant_families: string[];
  intensity_preferences: IntensityLevel;
  seasonal_patterns: SeasonalPreference[];
  complexity_preference: ComplexityLevel;
  accord_preferences?: AccordPreference[];
  fragrance_personality?: FragrancePersonality;
}

export interface DiscoveryStats {
  quiz_accuracy_score: number;
  collection_growth_rate: number;
  exploration_diversity: number;
  recommendation_acceptance_rate: number;
  discovery_timeline?: DiscoveryTimelineEvent[];
}

export interface SocialContext {
  similar_users_count: number;
  trending_in_collection: string[];
  community_recommendations: string[];
  sharing_activity: number;
  social_influence_score?: number;
  peer_comparison?: PeerComparison;
}

export interface EngagementMetrics {
  engagement_level: EngagementLevel;
  engagement_score: number;
  days_active: number;
  milestone_progress: MilestoneProgress[];
  activity_streak?: number;
  last_interaction?: string;
}

// Supporting Types
export type IntensityLevel = 'light' | 'moderate' | 'intense';
export type ComplexityLevel = 'simple' | 'complex' | 'varied';
export type EngagementLevel = 'beginner' | 'intermediate' | 'expert';

export interface SeasonalPreference {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  fragrance_count: number;
  preference_strength: number; // 0-1 scale
  trend_direction?: 'increasing' | 'stable' | 'decreasing';
}

export interface AccordPreference {
  accord: string;
  frequency: number;
  preference_score: number;
  trend: 'rising' | 'stable' | 'declining';
}

export interface FragrancePersonality {
  primary_traits: string[];
  secondary_traits: string[];
  personality_score: number;
  confidence_level: 'high' | 'medium' | 'low';
}

export interface MilestoneProgress {
  milestone_type: string;
  current_progress: number;
  target: number;
  completed: boolean;
  estimated_completion: string | null;
  reward_unlocked?: string;
  next_milestone?: string;
}

export interface DiscoveryTimelineEvent {
  date: string;
  event_type: 'quiz_completed' | 'collection_saved' | 'fragrance_rated' | 'milestone_reached';
  description: string;
  impact_score: number;
}

export interface PeerComparison {
  percentile_rank: number;
  collection_size_vs_peers: 'above' | 'average' | 'below';
  diversity_vs_peers: 'above' | 'average' | 'below';
  engagement_vs_peers: 'above' | 'average' | 'below';
}

// Analytics Events
export interface AnalyticsEvent {
  user_id?: string;
  guest_session_id?: string;
  event_type: AnalyticsEventType;
  event_data: Record<string, any>;
  quiz_session_token?: string;
  timestamp?: string;
}

export type AnalyticsEventType = 
  | 'quiz_to_collection_conversion'
  | 'collection_item_added'
  | 'collection_item_removed'
  | 'collection_viewed'
  | 'collection_shared'
  | 'collection_organized'
  | 'fragrance_rated'
  | 'sample_ordered'
  | 'collection_milestone_reached'
  | 'engagement_level_changed'
  | 'insights_generated'
  | 'social_interaction';

// Database Schema Types
export interface CollectionAnalyticsEventRow {
  id: string;
  user_id: string | null;
  guest_session_id: string | null;
  event_type: string;
  event_data: Record<string, any>;
  quiz_session_token: string | null;
  created_at: string;
}

export interface CollectionShareRow {
  id: string;
  collection_owner_id: string;
  shared_by_user_id: string | null;
  share_type: ShareType;
  share_platform: SharePlatform;
  share_data: Record<string, any>;
  view_count: number;
  click_count: number;
  conversion_count: number;
  created_at: string;
  expires_at: string | null;
  share_url: string | null;
  share_token: string | null;
}

export interface UserEngagementScoreRow {
  user_id: string;
  collection_size: number;
  quiz_completion_count: number;
  social_engagement_score: number;
  last_active_at: string;
  days_since_signup: number;
  fragrance_ratings_count: number;
  shares_created: number;
  engagement_level: EngagementLevel;
  engagement_score_raw: number;
  preferred_scent_families: string[];
  activity_patterns: Record<string, any>;
  updated_at: string;
  created_at: string;
}

export interface CollectionInsightsCacheRow {
  id: string;
  user_id: string;
  insight_type: InsightType;
  insight_data: Record<string, any>;
  generated_at: string;
  expires_at: string;
  cache_version: number;
  generation_time_ms: number;
}

// Enums and Constants
export type ShareType = 'collection' | 'quiz_results' | 'single_fragrance';
export type SharePlatform = 'twitter' | 'instagram' | 'facebook' | 'direct_link' | 'email' | 'other';

export type InsightType = 
  | 'scent_profile_analysis'
  | 'collection_statistics'
  | 'recommendation_accuracy'
  | 'seasonal_preferences'
  | 'brand_affinity'
  | 'discovery_patterns'
  | 'social_context'
  | 'comprehensive_insights';

// Performance and Caching Types
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  force_refresh?: boolean;
  background_refresh?: boolean;
}

export interface AnalyticsPerformanceMetrics {
  query_time_ms: number;
  cache_hit: boolean;
  data_size_kb: number;
  complexity_score: number;
}

// API Response Types
export interface CollectionStatsResponse {
  success: boolean;
  data?: CollectionStats;
  error?: string;
  performance?: AnalyticsPerformanceMetrics;
}

export interface CollectionInsightsResponse {
  success: boolean;
  data?: CollectionInsights;
  error?: string;
  cached?: boolean;
  generated_at?: string;
  performance?: AnalyticsPerformanceMetrics;
}

export interface EngagementLevelResponse {
  success: boolean;
  engagement_level?: EngagementLevel;
  engagement_score?: number;
  error?: string;
}

// Component Props Types
export interface CollectionStatsProps {
  userId: string;
  showPerformance?: boolean;
  refreshInterval?: number;
}

export interface CollectionInsightsProps {
  userId: string;
  insightTypes?: InsightType[];
  forceRefresh?: boolean;
  onInsightsGenerated?: (insights: CollectionInsights) => void;
}

export interface EngagementDisplayProps {
  userId: string;
  showMilestones?: boolean;
  showComparison?: boolean;
  interactive?: boolean;
}

// Utility Types
export interface AnalyticsServiceConfig {
  cache_default_ttl: number;
  background_refresh_enabled: boolean;
  performance_tracking_enabled: boolean;
  social_features_enabled: boolean;
  cleanup_old_events_days: number;
}

// Error Types
export interface AnalyticsError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Export utility type for analytics service methods
export type AnalyticsServiceMethod = 
  | 'getCollectionStats'
  | 'getCollectionInsights'
  | 'trackEvent'
  | 'getUserEngagementLevel'
  | 'updateEngagementMetrics';

// Constants for analytics system
export const ANALYTICS_CONSTANTS = {
  DEFAULT_CACHE_TTL: 3600, // 1 hour in seconds
  MAX_INSIGHT_GENERATION_TIME: 30000, // 30 seconds
  ENGAGEMENT_SCORE_RANGES: {
    beginner: { min: 0, max: 149 },
    intermediate: { min: 150, max: 399 },
    expert: { min: 400, max: 1000 }
  },
  COLLECTION_SIZE_MILESTONES: [1, 5, 10, 15, 25, 50, 100],
  ANALYTICS_EVENT_BATCH_SIZE: 100,
  CACHE_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
} as const;