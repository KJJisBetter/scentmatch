/**
 * Database-Powered Recommendation Engine
 * 
 * Replaces JSON-based WorkingRecommendationEngine with direct Supabase RPC function calls.
 * Uses analyze_quiz_personality() and get_quiz_recommendations() database functions
 * for true database integration.
 */

import { createServiceSupabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

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
  gender_target?: string;
  scent_family?: string;
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
 * Database-powered recommendation engine using Supabase RPC functions
 */
export class DatabaseRecommendationEngine {
  private supabase: ReturnType<typeof createServiceSupabase>;

  constructor() {
    this.supabase = createServiceSupabase();
  }

  /**
   * Generate recommendations using database functions
   */
  async generateRecommendations(
    responses: QuizResponse[],
    sessionToken: string
  ): Promise<RecommendationResult> {
    const startTime = Date.now();

    try {
      if (responses.length < 3) {
        throw new Error('Insufficient quiz responses for recommendations');
      }

      // Step 1: Store quiz session in database
      const sessionId = await this.createQuizSession(sessionToken, responses);
      console.log(`✅ Created quiz session: ${sessionId}`);

      // Step 2: Store quiz responses in database
      await this.storeQuizResponses(sessionId, responses);
      console.log(`✅ Stored ${responses.length} quiz responses`);

      // Step 3: Mark session as completed
      await this.markSessionCompleted(sessionId);
      console.log(`✅ Session marked as completed`);

      // Step 4: Analyze personality using database function
      const personalityAnalysis = await this.analyzePersonality(sessionToken);
      console.log(`✅ Personality analysis: ${personalityAnalysis ? 'completed' : 'fallback used'}`);

      // Step 5: Get recommendations using database function
      const recommendations = await this.getRecommendations(sessionToken);
      console.log(`✅ Generated ${recommendations.length} recommendations`);

      return {
        recommendations,
        quiz_session_token: sessionToken,
        total_processing_time_ms: Date.now() - startTime,
        recommendation_method: 'database_functions',
        success: true,
        personality_analysis: personalityAnalysis
      };

    } catch (error) {
      console.error('Database recommendation generation failed:', error);

      // Fallback to basic database query instead of JSON
      const fallbackRecs = await this.getDatabaseFallbackRecommendations(responses);

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
   * Create quiz session in database
   */
  private async createQuizSession(sessionToken: string, responses: QuizResponse[]): Promise<string> {
    const { data: session, error } = await this.supabase
      .from('user_quiz_sessions')
      .insert({
        session_token: sessionToken,
        quiz_version: 'v1.0',
        current_question: responses.length,
        total_questions: responses.length,
        is_completed: false,
        is_guest_session: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create quiz session: ${error.message}`);
    }

    return session.id;
  }

  /**
   * Store quiz responses in database
   */
  private async storeQuizResponses(sessionId: string, responses: QuizResponse[]): Promise<void> {
    const dbResponses = responses.map(response => ({
      session_id: sessionId,
      question_id: response.question_id,
      question_text: this.getQuestionText(response.question_id),
      question_type: 'multiple_choice',
      answer_value: response.answer_value,
      response_time_ms: 3000 // Default response time
    }));

    const { error } = await this.supabase
      .from('user_quiz_responses')
      .insert(dbResponses);

    if (error) {
      throw new Error(`Failed to store quiz responses: ${error.message}`);
    }
  }

  /**
   * Mark session as completed
   */
  private async markSessionCompleted(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_quiz_sessions')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to mark session completed: ${error.message}`);
    }
  }

  /**
   * Analyze personality using database function
   */
  private async analyzePersonality(sessionToken: string): Promise<any> {
    try {
      const { data: analysis, error } = await this.supabase
        .rpc('analyze_quiz_personality', {
          target_session_id: sessionToken
        });

      if (error) {
        if (error.code === 'PGRST202' || error.code === '42883') {
          console.log('analyze_quiz_personality function not available - using manual analysis');
          return await this.createManualPersonalityAnalysis(sessionToken);
        }
        throw new Error(`Personality analysis failed: ${error.message}`);
      }

      return analysis;
    } catch (error) {
      console.log('Database personality analysis failed, using manual fallback');
      return await this.createManualPersonalityAnalysis(sessionToken);
    }
  }

  /**
   * Get recommendations using database function
   */
  private async getRecommendations(sessionToken: string): Promise<FragranceRecommendation[]> {
    try {
      const { data: recommendations, error } = await this.supabase
        .rpc('get_quiz_recommendations', {
          target_session_id: sessionToken,
          max_results: 3
        });

      if (error) {
        if (error.code === 'PGRST202' || error.code === '42883') {
          console.log('get_quiz_recommendations function not available - using manual query');
          return await this.getManualRecommendations(sessionToken);
        }
        throw new Error(`Recommendations failed: ${error.message}`);
      }

      // Convert database result to expected format
      return this.formatDatabaseRecommendations(recommendations || []);
    } catch (error) {
      console.log('Database recommendations failed, using manual query');
      return await this.getManualRecommendations(sessionToken);
    }
  }

  /**
   * Manual personality analysis fallback
   */
  private async createManualPersonalityAnalysis(sessionToken: string): Promise<any> {
    // Get quiz responses to analyze manually
    const { data: responses, error } = await this.supabase
      .from('user_quiz_responses')
      .select('*')
      .eq('session_id', sessionToken);

    if (error || !responses?.length) {
      return null;
    }

    // Extract basic personality from responses
    const genderPref = responses.find(r => r.question_id === 'gender_preference')?.answer_value || 'unisex';
    const experienceLevel = responses.find(r => r.question_id === 'experience_level')?.answer_value || 'beginner';
    const scentPrefs = responses.find(r => r.question_id.includes('scent_preferences'))?.answer_value || 'fresh_clean';

    const personalityType = this.inferPersonalityType(scentPrefs, experienceLevel);

    // Store manual analysis in database
    const { data: personality, error: personalityError } = await this.supabase
      .from('user_fragrance_personalities')
      .insert({
        session_id: sessionToken,
        personality_type: personalityType,
        style_descriptor: this.generateStyleDescription(personalityType, scentPrefs),
        confidence_score: 0.75,
        dimension_fresh: this.calculateDimension('fresh', scentPrefs),
        dimension_floral: this.calculateDimension('floral', scentPrefs),
        dimension_oriental: this.calculateDimension('oriental', scentPrefs),
        dimension_woody: this.calculateDimension('woody', scentPrefs),
        dimension_fruity: this.calculateDimension('fruity', scentPrefs),
        dimension_gourmand: this.calculateDimension('gourmand', scentPrefs),
        quiz_version: 'v1.0',
        ai_enhanced: false
      })
      .select()
      .single();

    if (personalityError) {
      console.log(`Warning: Could not store personality analysis: ${personalityError.message}`);
    }

    return personality;
  }

  /**
   * Manual recommendations fallback using database queries
   */
  private async getManualRecommendations(sessionToken: string): Promise<FragranceRecommendation[]> {
    // Get user preferences from quiz responses
    const { data: responses } = await this.supabase
      .from('user_quiz_responses')
      .select('*')
      .eq('session_id', sessionToken);

    if (!responses?.length) {
      return await this.getPopularRecommendations();
    }

    const genderPref = responses.find(r => r.question_id === 'gender_preference')?.answer_value || 'unisex';
    const scentPrefs = responses.find(r => r.question_id.includes('scent_preferences'))?.answer_value || '';

    // Query fragrances from database based on preferences
    let query = this.supabase
      .from('fragrances')
      .select(`
        id,
        name,
        brand_id,
        gender,
        sample_available,
        sample_price_usd,
        rating_value,
        accords,
        fragrance_brands:brand_id (
          name
        )
      `)
      .eq('sample_available', true)
      .not('sample_price_usd', 'is', null)
      .limit(10);

    // Apply gender filtering
    if (genderPref === 'men') {
      query = query.in('gender', ['for men', 'unisex']);
    } else if (genderPref === 'women') {
      query = query.in('gender', ['for women', 'unisex']);
    }

    const { data: fragrances, error } = await query;

    if (error || !fragrances?.length) {
      console.log('Database query failed, using popular fallback');
      return await this.getPopularRecommendations();
    }

    // Score and select top 3
    const scored = this.scoreFragrancesFromDatabase(fragrances, scentPrefs);
    const top3 = scored.slice(0, 3);

    return top3.map(frag => this.formatFragranceRecommendation(frag, scentPrefs));
  }

  /**
   * Score fragrances from database results
   */
  private scoreFragrancesFromDatabase(fragrances: any[], scentPrefs: string): any[] {
    return fragrances
      .map(frag => {
        let score = 50;

        // Scent preference matching
        if (scentPrefs.includes('fresh') && frag.accords?.includes('fresh')) score += 20;
        if (scentPrefs.includes('sweet') && frag.accords?.includes('sweet')) score += 20;
        if (scentPrefs.includes('floral') && frag.accords?.includes('floral')) score += 20;
        if (scentPrefs.includes('woody') && frag.accords?.includes('woody')) score += 20;

        // Rating boost
        if (frag.rating_value > 4.0) score += 15;
        if (frag.rating_value > 4.5) score += 10;

        // Brand recognition boost
        const brandName = frag.fragrance_brands?.name || '';
        if (['Chanel', 'Dior', 'Tom Ford', 'Creed'].includes(brandName)) {
          score += 10;
        }

        return { ...frag, match_score: score };
      })
      .sort((a, b) => b.match_score - a.match_score);
  }

  /**
   * Format database fragrance as recommendation
   */
  private formatFragranceRecommendation(frag: any, scentPrefs: string): FragranceRecommendation {
    const brandName = frag.fragrance_brands?.name || 'Unknown Brand';
    
    return {
      id: frag.id,
      name: frag.name,
      brand: brandName,
      image_url: undefined,
      sample_price_usd: frag.sample_price_usd || 15.99,
      match_percentage: Math.min(frag.match_score, 100),
      ai_insight: `${frag.name} by ${brandName} offers a perfect match for your ${scentPrefs.replace('_', ' ')} preferences.`,
      reasoning: `Selected based on your quiz responses and high user ratings (${frag.rating_value || 'N/A'}/5).`,
      confidence_level: frag.match_score > 85 ? 'high' : frag.match_score > 75 ? 'medium' : 'good',
      why_recommended: 'Database analysis match',
      sample_available: frag.sample_available || false,
      gender_target: this.normalizeGender(frag.gender),
      scent_family: frag.accords?.[0] || 'miscellaneous'
    };
  }

  /**
   * Format database RPC function results
   */
  private formatDatabaseRecommendations(dbResults: any[]): FragranceRecommendation[] {
    return dbResults.map(result => ({
      id: result.fragrance_id,
      name: result.name || 'Unknown Fragrance',
      brand: result.brand || 'Unknown Brand',
      image_url: undefined,
      sample_price_usd: result.sample_price || 15.99,
      match_percentage: Math.round(result.match_score * 100) || 75,
      ai_insight: result.quiz_reasoning || 'Recommended based on your quiz responses.',
      reasoning: result.quiz_reasoning || 'Database analysis indicates this matches your preferences.',
      confidence_level: result.archetype_alignment > 0.8 ? 'high' : result.archetype_alignment > 0.6 ? 'medium' : 'good',
      why_recommended: 'AI database analysis',
      sample_available: true,
      gender_target: 'unisex', // Database function should handle gender filtering
      scent_family: 'various'
    }));
  }

  /**
   * Popular recommendations fallback
   */
  private async getPopularRecommendations(): Promise<FragranceRecommendation[]> {
    const { data: popular, error } = await this.supabase
      .from('fragrances')
      .select(`
        id,
        name,
        brand_id,
        sample_available,
        sample_price_usd,
        rating_value,
        fragrance_brands:brand_id (
          name
        )
      `)
      .eq('sample_available', true)
      .not('sample_price_usd', 'is', null)
      .order('rating_value', { ascending: false, nullsLast: true })
      .limit(3);

    if (error || !popular?.length) {
      console.log('No database fragrances available');
      return [];
    }

    return popular.map((frag, index) => ({
      id: frag.id,
      name: frag.name,
      brand: frag.fragrance_brands?.name || 'Unknown Brand',
      image_url: undefined,
      sample_price_usd: frag.sample_price_usd || 15.99,
      match_percentage: 85 - index * 5, // 85%, 80%, 75%
      ai_insight: 'This popular fragrance is highly rated and makes an excellent choice for exploring your preferences.',
      reasoning: 'Selected based on high user ratings and sample availability.',
      confidence_level: 'good' as const,
      why_recommended: 'Popular and well-reviewed',
      sample_available: frag.sample_available || false
    }));
  }

  /**
   * Helper methods
   */
  private getQuestionText(questionId: string): string {
    const questionTexts: { [key: string]: string } = {
      'gender_preference': 'What gender fragrances do you prefer?',
      'experience_level': 'How experienced are you with fragrances?',
      'scent_preferences_beginner': 'What scent types appeal to you?',
      'scent_preferences_enthusiast': 'What scent families do you enjoy?',
      'scent_preferences_experienced': 'What are your favorite scent profiles?',
      'personality_style': 'What describes your style?',
      'occasions_beginner': 'When would you wear fragrance?',
      'occasions_enthusiast': 'What occasions do you dress for?',
      'occasions_experienced': 'When do you like to wear fragrance?'
    };

    return questionTexts[questionId] || 'Quiz question';
  }

  private normalizeGender(gender?: string): string {
    if (!gender) return 'unisex';
    
    const norm = gender.toLowerCase();
    if (norm.includes('women') && !norm.includes('men')) return 'women';
    if (norm.includes('men') && !norm.includes('women')) return 'men';
    return 'unisex';
  }

  private inferPersonalityType(scentPrefs: string, experienceLevel: string): string {
    if (scentPrefs.includes('fresh') || scentPrefs.includes('clean')) return 'natural';
    if (scentPrefs.includes('floral') || scentPrefs.includes('pretty')) return 'romantic';
    if (scentPrefs.includes('woody') || scentPrefs.includes('sophisticated')) return 'sophisticated';
    if (experienceLevel === 'beginner') return 'classic';
    return 'classic';
  }

  private generateStyleDescription(personalityType: string, scentPrefs: string): string {
    const descriptions = {
      natural: `You prefer fresh, clean fragrances that capture the essence of nature and simplicity.`,
      romantic: `You love feminine, floral scents that enhance your romantic and graceful nature.`,
      sophisticated: `You appreciate complex, elegant fragrances perfect for refined settings.`,
      classic: `You enjoy timeless, balanced fragrances that work beautifully for any occasion.`
    };

    return descriptions[personalityType as keyof typeof descriptions] || descriptions.classic;
  }

  private calculateDimension(dimension: string, scentPrefs: string): number {
    const baseScore = 20;
    
    if (scentPrefs.includes(dimension)) return baseScore + 60;
    if (scentPrefs.includes('open') || scentPrefs.includes('anything')) return baseScore + 30;
    return baseScore;
  }
}