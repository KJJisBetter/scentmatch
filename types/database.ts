/**
 * Database type definitions for ScentMatch application
 * This file will be auto-generated from Supabase schema in the future
 * For now, we define the basic structure for user authentication
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
          first_name?: string;
          last_name?: string;
          avatar_url?: string;
          preferences?: Json;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          updated_at?: string;
          first_name?: string;
          last_name?: string;
          avatar_url?: string;
          preferences?: Json;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
          first_name?: string;
          last_name?: string;
          avatar_url?: string;
          preferences?: Json;
        };
      };
      fragrances: {
        Row: {
          id: string;
          name: string;
          brand_id: string;
          description?: string;
          notes?: string[];
          image_url?: string;
          intensity_score?: number;
          longevity_hours?: number;
          sillage_rating?: number;
          recommended_occasions?: string[];
          recommended_seasons?: string[];
          mood_tags?: string[];
          sample_available?: boolean;
          sample_price_usd?: number;
          travel_size_available?: boolean;
          travel_size_ml?: number;
          travel_size_price_usd?: number;
          scent_family?: string;
          embedding?: number[];
          search_vector?: string;
          popularity_score?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          brand_id: string;
          description?: string;
          notes?: string[];
          image_url?: string;
          intensity_score?: number;
          longevity_hours?: number;
          sillage_rating?: number;
          recommended_occasions?: string[];
          recommended_seasons?: string[];
          mood_tags?: string[];
          sample_available?: boolean;
          sample_price_usd?: number;
          travel_size_available?: boolean;
          travel_size_ml?: number;
          travel_size_price_usd?: number;
          scent_family?: string;
          embedding?: number[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          brand_id?: string;
          description?: string;
          notes?: string[];
          image_url?: string;
          intensity_score?: number;
          longevity_hours?: number;
          sillage_rating?: number;
          recommended_occasions?: string[];
          recommended_seasons?: string[];
          mood_tags?: string[];
          sample_available?: boolean;
          sample_price_usd?: number;
          travel_size_available?: boolean;
          travel_size_ml?: number;
          travel_size_price_usd?: number;
          scent_family?: string;
          embedding?: number[];
          created_at?: string;
          updated_at?: string;
        };
      };
      user_collections: {
        Row: {
          id: string;
          user_id: string;
          fragrance_id: string;
          added_at: string;
          status: 'owned' | 'wishlist' | 'tried' | 'selling';
          purchase_date?: string;
          purchase_price?: number;
          size_ml?: number;
          usage_frequency?: 'daily' | 'weekly' | 'occasional' | 'special';
          rating?: number;
          personal_notes?: string;
          occasions?: string[];
          seasons?: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          fragrance_id: string;
          added_at?: string;
          status?: 'owned' | 'wishlist' | 'tried' | 'selling';
          purchase_date?: string;
          purchase_price?: number;
          size_ml?: number;
          usage_frequency?: 'daily' | 'weekly' | 'occasional' | 'special';
          rating?: number;
          personal_notes?: string;
          occasions?: string[];
          seasons?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          fragrance_id?: string;
          added_at?: string;
          status?: 'owned' | 'wishlist' | 'tried' | 'selling';
          purchase_date?: string;
          purchase_price?: number;
          size_ml?: number;
          usage_frequency?: 'daily' | 'weekly' | 'occasional' | 'special';
          rating?: number;
          personal_notes?: string;
          occasions?: string[];
          seasons?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      fragrance_brands: {
        Row: {
          id: string;
          name: string;
          website_url?: string;
          item_count?: number;
          popularity_score?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          website_url?: string;
          item_count?: number;
          popularity_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          website_url?: string;
          item_count?: number;
          popularity_score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          preference_type: string;
          preference_value: string;
          preference_strength: number;
          learned_from?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          preference_type: string;
          preference_value: string;
          preference_strength?: number;
          learned_from?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          preference_type?: string;
          preference_value?: string;
          preference_strength?: number;
          learned_from?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_fragrance_interactions: {
        Row: {
          id: string;
          user_id: string;
          fragrance_id: string;
          interaction_type: string;
          interaction_context?: string;
          interaction_metadata?: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          fragrance_id: string;
          interaction_type: string;
          interaction_context?: string;
          interaction_metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          fragrance_id?: string;
          interaction_type?: string;
          interaction_context?: string;
          interaction_metadata?: Json;
          created_at?: string;
        };
      };
      fragrance_embeddings: {
        Row: {
          id: string;
          fragrance_id: string;
          embedding_version: string;
          embedding?: number[];
          embedding_source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          fragrance_id: string;
          embedding_version?: string;
          embedding?: number[];
          embedding_source: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          fragrance_id?: string;
          embedding_version?: string;
          embedding?: number[];
          embedding_source?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_quiz_sessions: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id?: string;
          session_token?: string;
          quiz_version?: string;
          started_at?: string;
          completed_at?: string;
          current_question?: number;
          total_questions?: number;
          is_completed?: boolean;
          is_guest_session?: boolean;
          expires_at?: string;
          referral_source?: string;
          ip_hash?: string;
          user_agent_hash?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_token?: string;
          quiz_version?: string;
          started_at?: string;
          completed_at?: string;
          current_question?: number;
          total_questions?: number;
          is_completed?: boolean;
          is_guest_session?: boolean;
          expires_at?: string;
          referral_source?: string;
          ip_hash?: string;
          user_agent_hash?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_quiz_responses: {
        Row: {
          id: string;
          session_id: string;
          question_id: string;
          question_text: string;
          question_type: string;
          answer_value: string;
          answer_metadata?: Json;
          response_time_ms?: number;
          question_weight?: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          question_id: string;
          question_text: string;
          question_type: string;
          answer_value: string;
          answer_metadata?: Json;
          response_time_ms?: number;
          question_weight?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          question_id?: string;
          question_text?: string;
          question_type?: string;
          answer_value?: string;
          answer_metadata?: Json;
          response_time_ms?: number;
          question_weight?: number;
          created_at?: string;
        };
      };
      user_fragrance_personalities: {
        Row: {
          id: string;
          user_id?: string;
          session_id?: string;
          personality_type: string;
          secondary_type?: string;
          style_descriptor: string;
          confidence_score: number;
          dimension_fresh: number;
          dimension_floral: number;
          dimension_oriental: number;
          dimension_woody: number;
          dimension_fruity: number;
          dimension_gourmand: number;
          lifestyle_factors?: Json;
          preferred_intensity?: number;
          occasion_preferences?: string[];
          seasonal_preferences?: string[];
          brand_preferences?: string[];
          quiz_version: string;
          analysis_method?: string;
          ai_enhanced: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          session_id?: string;
          personality_type: string;
          secondary_type?: string;
          style_descriptor: string;
          confidence_score: number;
          dimension_fresh?: number;
          dimension_floral?: number;
          dimension_oriental?: number;
          dimension_woody?: number;
          dimension_fruity?: number;
          dimension_gourmand?: number;
          lifestyle_factors?: Json;
          preferred_intensity?: number;
          occasion_preferences?: string[];
          seasonal_preferences?: string[];
          brand_preferences?: string[];
          quiz_version?: string;
          analysis_method?: string;
          ai_enhanced?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          personality_type?: string;
          secondary_type?: string;
          style_descriptor?: string;
          confidence_score?: number;
          dimension_fresh?: number;
          dimension_floral?: number;
          dimension_oriental?: number;
          dimension_woody?: number;
          dimension_fruity?: number;
          dimension_gourmand?: number;
          lifestyle_factors?: Json;
          preferred_intensity?: number;
          occasion_preferences?: string[];
          seasonal_preferences?: string[];
          brand_preferences?: string[];
          quiz_version?: string;
          analysis_method?: string;
          ai_enhanced?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          experience_level: string;
          favorite_accords: string[];
          disliked_accords: string[];
          profile_privacy: string;
          onboarding_completed: boolean;
          avatar_url?: string;
          bio?: string;
          location?: string;
          birthday?: string;
          gender_preference?: string;
          budget_range?: string;
          skin_type?: string;
          quiz_completed_at?: string;
          quiz_personality_type?: string;
          onboarding_step: string;
          referral_source?: string;
          quiz_completion_time_seconds?: number;
          personality_confidence?: number;
          privacy_settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string;
          experience_level?: string;
          favorite_accords?: string[];
          disliked_accords?: string[];
          profile_privacy?: string;
          onboarding_completed?: boolean;
          avatar_url?: string;
          bio?: string;
          location?: string;
          birthday?: string;
          gender_preference?: string;
          budget_range?: string;
          skin_type?: string;
          quiz_completed_at?: string;
          quiz_personality_type?: string;
          onboarding_step?: string;
          referral_source?: string;
          quiz_completion_time_seconds?: number;
          personality_confidence?: number;
          privacy_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          experience_level?: string;
          favorite_accords?: string[];
          disliked_accords?: string[];
          profile_privacy?: string;
          onboarding_completed?: boolean;
          avatar_url?: string;
          bio?: string;
          location?: string;
          birthday?: string;
          gender_preference?: string;
          budget_range?: string;
          skin_type?: string;
          quiz_completed_at?: string;
          quiz_personality_type?: string;
          onboarding_step?: string;
          referral_source?: string;
          quiz_completion_time_seconds?: number;
          personality_confidence?: number;
          privacy_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_similar_fragrances: {
        Args: {
          target_fragrance_id: string;
          similarity_threshold?: number;
          max_results?: number;
          embedding_version?: string;
        };
        Returns: {
          fragrance_id: string;
          similarity_score: number;
          name: string;
          brand: string;
        }[];
      };
      match_fragrances: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
        };
        Returns: {
          id: string;
          similarity: number;
        }[];
      };
      get_collection_insights: {
        Args: {
          target_user_id: string;
        };
        Returns: Json;
      };
      get_personalized_recommendations: {
        Args: {
          target_user_id: string;
          max_results?: number;
          include_owned?: boolean;
          occasion_filter?: string;
          season_filter?: string;
        };
        Returns: {
          fragrance_id: string;
          recommendation_score: number;
          recommendation_reasons: string[];
          name: string;
          brand: string;
          sample_price: number;
        }[];
      };
      advanced_fragrance_search: {
        Args: {
          query_text?: string;
          scent_families?: string[];
          intensity_min?: number;
          intensity_max?: number;
          longevity_min?: number;
          occasions?: string[];
          seasons?: string[];
          sample_available_only?: boolean;
          max_results?: number;
        };
        Returns: {
          fragrance_id: string;
          name: string;
          brand: string;
          scent_family: string;
          relevance_score: number;
        }[];
      };
      get_collection_timeline: {
        Args: {
          target_user_id: string;
          time_period?: string;
        };
        Returns: {
          period_start: string;
          period_end: string;
          additions_count: number;
          dominant_family: string;
          avg_price: number;
        }[];
      };
      multi_vector_similarity: {
        Args: {
          fragrance_id: string;
          embedding_versions?: string[];
          max_results?: number;
        };
        Returns: {
          similar_fragrance_id: string;
          avg_similarity: number;
          version_scores: Json;
        }[];
      };
      get_database_health: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      refresh_embedding_cache: {
        Args: {
          embedding_version?: string;
          batch_size?: number;
        };
        Returns: Json;
      };
      analyze_quiz_personality: {
        Args: {
          target_session_id: string;
        };
        Returns: Json;
      };
      calculate_personality_from_responses: {
        Args: {
          target_session_id: string;
        };
        Returns: Json;
      };
      get_next_quiz_question: {
        Args: {
          target_session_id: string;
          question_number?: number;
        };
        Returns: Json;
      };
      get_quiz_recommendations: {
        Args: {
          target_session_id: string;
          max_results?: number;
        };
        Returns: {
          fragrance_id: string;
          match_score: number;
          quiz_reasoning: string;
          archetype_alignment: number;
        }[];
      };
      get_archetype_recommendations: {
        Args: {
          archetype_code: string;
          max_results?: number;
        };
        Returns: {
          fragrance_id: string;
          archetype_match_score: number;
          reasoning: string;
        }[];
      };
      transfer_guest_session_to_user: {
        Args: {
          guest_session_token: string;
          target_user_id: string;
        };
        Returns: Json;
      };
      cleanup_expired_quiz_sessions: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_quiz_analytics: {
        Args: {
          time_period?: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;
