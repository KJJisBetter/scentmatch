/**
 * Quiz System Type Definitions
 * 
 * TypeScript interfaces for the fragrance personality quiz system
 * Includes session management, responses, personality profiles, and analysis
 */

export interface QuizSession {
  id: string;
  user_id?: string;
  session_token: string;
  quiz_version: string;
  started_at: string;
  completed_at?: string;
  current_question: number;
  total_questions: number;
  is_completed: boolean;
  is_guest_session: boolean;
  expires_at?: string;
  referral_source?: string;
  ip_hash?: string;
  user_agent_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface QuizResponse {
  id: string;
  session_id: string;
  question_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'slider_scale' | 'image_selection' | 'scenario_based';
  answer_value: string;
  answer_metadata?: {
    confidence?: number;
    response_time_ms?: number;
    branching_triggered?: string[];
    [key: string]: any;
  };
  response_time_ms?: number;
  question_weight?: number;
  created_at: string;
}

export interface FragrancePersonality {
  id: string;
  user_id?: string;
  session_id?: string;
  personality_type: FragranceArchetype;
  secondary_type?: FragranceArchetype;
  style_descriptor: string;
  confidence_score: number;
  
  // Dimension scores (0-100)
  dimension_fresh: number;
  dimension_floral: number;
  dimension_oriental: number;
  dimension_woody: number;
  dimension_fruity: number;
  dimension_gourmand: number;
  
  // Preferences and factors
  lifestyle_factors?: {
    work_style?: string;
    social_preference?: string;
    fashion_style?: string;
    [key: string]: any;
  };
  preferred_intensity?: number;
  occasion_preferences?: string[];
  seasonal_preferences?: string[];
  brand_preferences?: string[];
  
  // Metadata
  quiz_version: string;
  analysis_method?: string;
  ai_enhanced: boolean;
  created_at: string;
  updated_at: string;
}

export type FragranceArchetype = 
  | 'romantic'
  | 'sophisticated' 
  | 'natural'
  | 'bold'
  | 'playful'
  | 'mysterious'
  | 'classic'
  | 'modern';

export interface QuizQuestion {
  id: string;
  question_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'slider_scale' | 'image_selection' | 'scenario_based';
  question_category: 'lifestyle' | 'environment' | 'personality' | 'preferences' | 'scenarios' | 'style';
  importance_weight: number;
  reliability_score: number;
  quiz_version: string;
  is_active: boolean;
  options?: QuizQuestionOption[];
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  branching_logic?: {
    [optionValue: string]: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface QuizQuestionOption {
  id: string;
  question_id: string;
  option_value: string;
  option_text: string;
  option_description?: string;
  image_url?: string;
  display_order: number;
  
  // Dimension impact scores (-1 to 1)
  dimension_fresh: number;
  dimension_floral: number;
  dimension_oriental: number;
  dimension_woody: number;
  dimension_fruity: number;
  dimension_gourmand: number;
  
  // Branching logic
  triggers_questions?: string[];
  skip_questions?: string[];
  created_at: string;
}

export interface PersonalityArchetype {
  id: string;
  archetype_code: FragranceArchetype;
  archetype_name: string;
  archetype_description: string;
  
  // Template dimension scores (0-100)
  template_fresh: number;
  template_floral: number;
  template_oriental: number;
  template_woody: number;
  template_fruity: number;
  template_gourmand: number;
  
  // Associated characteristics
  typical_occasions: string[];
  typical_seasons: string[];
  fragrance_families: string[];
  style_keywords: string[];
  created_at: string;
}

// API Request/Response Types
export interface StartQuizRequest {
  user_id?: string;
  referral_source?: string;
  quiz_version?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface StartQuizResponse {
  session_id: string;
  session_token?: string; // For guest sessions
  user_id?: string;
  is_guest_session: boolean;
  expires_at?: string;
  first_question: QuizQuestion;
  estimated_completion_time: number;
  privacy_notice?: string;
}

export interface SubmitAnswerRequest {
  session_token: string;
  question_id: string;
  answer_value: string;
  response_time_ms?: number;
  confidence?: number;
  metadata?: any;
}

export interface SubmitAnswerResponse {
  answer_processed: boolean;
  immediate_insight?: string;
  progress: {
    current_question: number;
    total_questions: number;
    percentage: number;
    estimated_remaining_time: number;
  };
  next_question?: QuizQuestion;
  quiz_completed?: boolean;
  partial_analysis?: {
    emerging_archetype?: FragranceArchetype;
    confidence: number;
    dominant_dimensions: string[];
  };
  validation_errors?: string[];
}

export interface QuizResultsResponse {
  quiz_completed: boolean;
  session_metadata: {
    session_id: string;
    completed_at?: string;
    total_questions_answered: number;
    completion_time_seconds?: number;
  };
  personality_profile?: {
    primary_archetype: FragranceArchetype;
    secondary_archetype?: FragranceArchetype;
    confidence: number;
    style_descriptor: string;
    detailed_analysis: {
      dimension_scores: {
        fresh: number;
        floral: number;
        oriental: number;
        woody: number;
        fruity: number;
        gourmand: number;
      };
      lifestyle_factors: {
        work_environment: string;
        social_style: string;
        fashion_preference: string;
        [key: string]: any;
      };
      fragrance_recommendations: {
        signature_style: string;
        day_fragrance: string;
        evening_fragrance: string;
        special_occasion: string;
      };
    };
  };
  personalized_insights: {
    key_preferences: string[];
    style_evolution: string;
    collection_building: string;
  };
  initial_recommendations: QuizRecommendation[];
  next_steps?: {
    create_account?: string;
    try_samples?: string;
    explore_collection?: string;
  };
}

export interface QuizRecommendation {
  fragrance_id: string;
  name: string;
  brand: string;
  match_percentage: number;
  quiz_reasoning: string;
  sample_price: number;
  confidence: number;
  archetype_alignment?: number;
  source: 'quiz_personality' | 'archetype_match' | 'dimension_based';
}

export interface ConvertToAccountRequest {
  session_token: string;
  user_data: {
    email: string;
    password: string;
    first_name: string;
    last_name?: string;
    marketing_opt_in?: boolean;
  };
  preserve_quiz_data: boolean;
  immediate_recommendations?: boolean;
}

export interface ConvertToAccountResponse {
  account_created: boolean;
  user_id?: string;
  quiz_data_transferred: boolean;
  transfer_summary: {
    quiz_responses: number;
    personality_profile: boolean;
    progress_preserved: boolean;
    recommendations_enhanced: boolean;
  };
  enhanced_profile: {
    onboarding_completed: boolean;
    quiz_personality_type: FragranceArchetype;
    personalization_confidence: number;
    initial_collection_suggestions: number;
  };
  immediate_benefits: {
    personalized_recommendations: number;
    quiz_accuracy_bonus: number;
    sample_recommendations: number;
    account_creation_bonus?: string;
  };
  next_steps: {
    redirect_to: string;
    onboarding_step: string;
  };
  error?: string;
  validation_errors?: string[];
}

// Quiz Engine Types
export interface QuizEngineConfig {
  quiz_version: string;
  total_questions: number;
  confidence_threshold: number;
  minimum_questions: number;
  branching_enabled: boolean;
  ai_analysis_enabled: boolean;
  guest_session_duration_hours: number;
}

export interface PersonalityAnalysisResult {
  session_id: string;
  personality_profile: FragrancePersonality;
  confidence_score: number;
  dimension_scores: {
    fresh: number;
    floral: number;
    oriental: number;
    woody: number;
    fruity: number;
    gourmand: number;
  };
  archetype_scores: {
    [archetype in FragranceArchetype]: number;
  };
  processing_time_ms: number;
  analysis_method: string;
  recommendations?: QuizRecommendation[];
  quiz_completed?: boolean;
  progress_percentage?: number;
  confidence_boost?: number;
}

export interface QuizValidationResult {
  valid: boolean;
  confidence_sufficient: boolean;
  minimum_questions_met: boolean;
  response_consistency: number;
  validation_errors: string[];
  recommended_action: 'complete' | 'continue' | 'clarify' | 'restart';
}

// Utility Types
export type QuestionCategory = 'lifestyle' | 'environment' | 'personality' | 'preferences' | 'scenarios' | 'style';
export type QuestionType = 'multiple_choice' | 'slider_scale' | 'image_selection' | 'scenario_based';
export type OnboardingStep = 'welcome' | 'quiz' | 'quiz_completed' | 'account_created' | 'recommendations_viewed' | 'completed';

// Export database schema additions for quiz tables
export interface QuizDatabaseSchema {
  user_quiz_sessions: {
    Row: QuizSession;
    Insert: Omit<QuizSession, 'id' | 'created_at' | 'updated_at'> & {
      id?: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Omit<QuizSession, 'id' | 'created_at'>> & {
      updated_at?: string;
    };
  };
  user_quiz_responses: {
    Row: QuizResponse;
    Insert: Omit<QuizResponse, 'id' | 'created_at'> & {
      id?: string;
      created_at?: string;
    };
    Update: Partial<Omit<QuizResponse, 'id' | 'created_at'>>;
  };
  user_fragrance_personalities: {
    Row: FragrancePersonality;
    Insert: Omit<FragrancePersonality, 'id' | 'created_at' | 'updated_at'> & {
      id?: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Omit<FragrancePersonality, 'id' | 'created_at'>> & {
      updated_at?: string;
    };
  };
}