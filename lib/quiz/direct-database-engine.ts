/**
 * Direct Database Quiz Engine
 * 
 * Simple approach: Use existing working database functions directly
 * instead of reimplementing session management
 */

import { createServiceSupabase } from '@/lib/supabase';

export interface QuizResponse {
  question_id: string;
  answer_value: string;
  timestamp: string;
  experience_level?: string;
}

export interface FragranceRecommendation {
  id: string;
  name: string;
  brand: string;
  image_url?: string;
  sample_price_usd: number;
  match_percentage: number;
  ai_insight: string;
  reasoning: string;
  confidence_level: 'high' | 'medium' | 'good';
  why_recommended: string;
  sample_available: boolean;
}

export interface RecommendationResult {
  recommendations: FragranceRecommendation[];
  quiz_session_token: string;
  total_processing_time_ms: number;
  recommendation_method: 'database_functions';
  success: boolean;
  personality_analysis?: any;
}

/**
 * Direct database engine - uses working RPC functions
 */
export class DirectDatabaseEngine {
  private supabase: ReturnType<typeof createServiceSupabase>;

  constructor() {
    this.supabase = createServiceSupabase();
  }

  /**
   * Generate recommendations using working database functions
   */
  async generateRecommendations(
    responses: QuizResponse[],
    sessionToken: string
  ): Promise<RecommendationResult> {
    const startTime = Date.now();

    try {
      // Store responses in database first
      await this.storeSessionAndResponses(sessionToken, responses);

      // Use working database function for personality analysis
      const personalityResult = await this.supabase.rpc('analyze_quiz_personality', {
        target_session_id: sessionToken
      });

      if (personalityResult.error) {
        throw new Error(`Personality analysis failed: ${personalityResult.error.message}`);
      }

      // Use working database function for recommendations  
      const recommendationsResult = await this.supabase.rpc('get_quiz_recommendations', {
        target_session_id: sessionToken,
        max_results: 3
      });

      if (recommendationsResult.error) {
        throw new Error(`Recommendations failed: ${recommendationsResult.error.message}`);
      }

      // Format recommendations for API response (enhanced with fragrance details)
      const formattedRecs = await this.getEnhancedRecommendations(recommendationsResult.data || []);

      return {
        recommendations: formattedRecs,
        quiz_session_token: sessionToken,
        total_processing_time_ms: Date.now() - startTime,
        recommendation_method: 'database_functions',
        success: true,
        personality_analysis: personalityResult.data
      };

    } catch (error) {
      console.error('Database recommendation generation failed:', error);

      // Fallback to basic database query with gender filtering
      const fallbackRecs = await this.getFallbackRecommendations(responses);

      return {
        recommendations: fallbackRecs,
        quiz_session_token: sessionToken,
        total_processing_time_ms: Date.now() - startTime,
        recommendation_method: 'database_functions',
        success: false
      };
    }
  }

  /**
   * Store session and responses (simplified approach)
   */
  private async storeSessionAndResponses(sessionToken: string, responses: QuizResponse[]): Promise<void> {
    // Check if session already exists
    const { data: existingSession } = await this.supabase
      .from('user_quiz_sessions')
      .select('id')
      .eq('session_token', sessionToken)
      .single();

    let sessionId;

    if (existingSession) {
      sessionId = existingSession.id;
    } else {
      // Create new session
      const { data: newSession, error: sessionError } = await this.supabase
        .from('user_quiz_sessions')
        .insert({
          session_token: sessionToken,
          quiz_version: 'v1.0',
          current_question: responses.length,
          total_questions: responses.length,
          is_completed: true,
          is_guest_session: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .select('id')
        .single();

      if (sessionError) {
        throw new Error(`Failed to create session: ${sessionError.message}`);
      }
      sessionId = newSession.id;
    }

    // Store responses (with conflict handling)
    for (const response of responses) {
      await this.supabase
        .from('user_quiz_responses')
        .insert({
          session_id: sessionId,
          question_id: response.question_id,
          question_text: this.getQuestionText(response.question_id),
          question_type: 'multiple_choice',
          answer_value: response.answer_value,
          response_time_ms: 3000
        })
        .select()
        .single()
        .then(result => {
          if (result.error && !result.error.message.includes('duplicate')) {
            console.warn(`Response storage warning: ${result.error.message}`);
          }
        });
    }
  }

  /**
   * Format database recommendations for API response
   */
  private formatRecommendations(dbResults: any[]): FragranceRecommendation[] {
    return dbResults.map(result => ({
      id: result.fragrance_id,
      name: 'Database Recommendation', // Would get from fragrance table
      brand: 'Various Brands',
      image_url: undefined,
      sample_price_usd: 15.99,
      match_percentage: Math.round(Number(result.match_score) * 100),
      ai_insight: result.quiz_reasoning || 'Recommended based on your quiz responses.',
      reasoning: result.quiz_reasoning || 'Database analysis indicates this matches your preferences.',
      confidence_level: Number(result.archetype_alignment) > 0.8 ? 'high' : 
                        Number(result.archetype_alignment) > 0.6 ? 'medium' : 'good',
      why_recommended: 'AI database analysis',
      sample_available: true
    }));
  }

  /**
   * Enhanced recommendations with fragrance details
   */
  private async getEnhancedRecommendations(dbResults: any[]): Promise<FragranceRecommendation[]> {
    if (!dbResults.length) return [];

    const fragranceIds = dbResults.map(r => r.fragrance_id);
    
    const { data: fragrances } = await this.supabase
      .from('fragrances')
      .select(`
        id,
        name,
        brand_id,
        sample_price_usd,
        sample_available,
        fragrance_brands:brand_id (
          name
        )
      `)
      .in('id', fragranceIds);

    return dbResults.map(result => {
      const fragrance = fragrances?.find(f => f.id === result.fragrance_id);
      const brandName = (fragrance?.fragrance_brands as any)?.name || 'Unknown Brand';

      return {
        id: result.fragrance_id,
        name: fragrance?.name || 'Unknown Fragrance',
        brand: brandName,
        image_url: undefined,
        sample_price_usd: fragrance?.sample_price_usd || 15.99,
        match_percentage: Math.round(Number(result.match_score) * 100),
        ai_insight: `${fragrance?.name} by ${brandName} ${result.quiz_reasoning?.toLowerCase() || 'matches your quiz responses'}.`,
        reasoning: result.quiz_reasoning || 'Selected based on your personality analysis.',
        confidence_level: Number(result.archetype_alignment) > 0.8 ? 'high' : 
                          Number(result.archetype_alignment) > 0.6 ? 'medium' : 'good',
        why_recommended: 'AI personality match',
        sample_available: fragrance?.sample_available || true
      };
    });
  }

  /**
   * Fallback recommendations using database with gender filtering
   */
  private async getFallbackRecommendations(responses?: QuizResponse[]): Promise<FragranceRecommendation[]> {
    // Extract gender preference from responses
    const genderPreference = responses?.find(r => r.question_id === 'gender_preference')?.answer_value;
    
    let query = this.supabase
      .from('fragrances')
      .select(`
        id,
        name,
        gender,
        sample_price_usd,
        fragrance_brands:brand_id (
          name
        )
      `)
      .eq('sample_available', true)
      .not('sample_price_usd', 'is', null);
    
    // Apply gender filtering - FIXED to match actual database values
    if (genderPreference && genderPreference !== 'unisex') {
      if (genderPreference === 'men') {
        query = query.in('gender', ['men', 'unisex']);
      } else if (genderPreference === 'women') {
        query = query.in('gender', ['women', 'unisex']);
      }
    }
    
    const { data: popular } = await query
      .order('rating_value', { ascending: false, nullsFirst: false })
      .limit(3);

    return (popular || []).map((frag, index) => ({
      id: frag.id,
      name: frag.name,
      brand: (frag.fragrance_brands as any)?.name || 'Unknown Brand',
      image_url: undefined,
      sample_price_usd: frag.sample_price_usd || 15.99,
      match_percentage: 85 - index * 5,
      ai_insight: `This popular ${frag.gender || 'unisex'} fragrance is highly rated and makes an excellent choice for exploring your preferences.`,
      reasoning: `Selected based on high user ratings, sample availability, and ${genderPreference || 'your'} preferences.`,
      confidence_level: 'good' as const,
      why_recommended: 'Popular and well-reviewed',
      sample_available: true
    }));
  }

  /**
   * Helper to get question text
   */
  private getQuestionText(questionId: string): string {
    const questionTexts: { [key: string]: string } = {
      'gender_preference': 'What gender fragrances do you prefer?',
      'experience_level': 'How experienced are you with fragrances?',
      'style_aspects': 'What style aspects appeal to you?',
      'fragrance_families_multiple': 'What fragrance families do you enjoy?',
      'occasions_detailed_multiple': 'What occasions do you dress for?',
      'fragrance_characteristics': 'What fragrance characteristics do you prefer?',
      'favorite_fragrances': 'What are some of your favorite fragrances?'
    };

    return questionTexts[questionId] || 'Quiz question';
  }
}