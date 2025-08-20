/**
 * Generate Initial User Preference Models
 * 
 * Creates AI-powered user preference models from existing interaction data
 * for all users in the system, enabling personalized recommendations.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { AIClient } from '@/lib/ai/ai-client';

interface UserPreferenceGeneration {
  generation_id: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  users_processed: {
    total_users: number;
    successful: number;
    failed: number;
    skipped: number;
    authenticated_users: number;
    guest_users: number;
  };
  preference_models: {
    high_confidence: number; // >0.7 preference strength
    medium_confidence: number; // 0.4-0.7
    low_confidence: number; // <0.4
    cold_start_users: number; // No interaction data
  };
  embedding_stats: {
    models_generated: number;
    avg_dimensions: number;
    avg_preference_strength: number;
    embedding_quality_score: number;
  };
  performance: {
    duration_ms: number;
    users_per_second: number;
    ai_calls_made: number;
    total_cost_usd: number;
  };
  errors: PreferenceGenerationError[];
}

interface PreferenceGenerationError {
  user_id: string;
  error_type: string;
  error_message: string;
  timestamp: string;
  retry_count: number;
  interaction_count: number;
}

interface UserInteractionSummary {
  user_id: string;
  total_interactions: number;
  interaction_types: Record<string, number>;
  fragrance_ratings: { fragrance_id: string; rating: number; notes?: string }[];
  collection_items: { fragrance_id: string; collection_type: string; created_at: string }[];
  search_queries: string[];
  view_patterns: { fragrance_id: string; total_views: number; avg_duration: number }[];
  recent_activity: boolean;
  preference_indicators: PreferenceIndicator[];
}

interface PreferenceIndicator {
  category: 'scent_family' | 'brand' | 'price_range' | 'occasion' | 'season' | 'complexity';
  value: string;
  confidence: number;
  evidence_count: number;
  evidence_types: string[];
}

interface GeneratedPreferenceModel {
  user_id: string;
  user_embedding: number[];
  preference_strength: number;
  preference_indicators: PreferenceIndicator[];
  embedding_metadata: {
    model_used: string;
    dimensions: number;
    source_interactions: number;
    quality_score: number;
    generation_method: 'weighted_average' | 'ai_generated' | 'hybrid';
  };
  confidence_factors: {
    interaction_volume: number;
    rating_consistency: number;
    behavioral_patterns: number;
    temporal_consistency: number;
  };
}

export class UserPreferenceModelGenerator {
  private supabase: ReturnType<typeof createClient<Database>>;
  private aiClient: AIClient;
  private generationId: string;
  private stats: UserPreferenceGeneration;
  private batchSize = 50;
  private preferenceCache = new Map<string, any>();

  constructor(supabaseUrl?: string, supabaseKey?: string, aiClient?: AIClient) {
    this.supabase = createClient<Database>(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.aiClient = aiClient || new AIClient();
    this.generationId = `pref_gen_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    this.stats = this.initializeStats();
  }

  private initializeStats(): UserPreferenceGeneration {
    return {
      generation_id: this.generationId,
      started_at: new Date().toISOString(),
      status: 'running',
      users_processed: {
        total_users: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        authenticated_users: 0,
        guest_users: 0
      },
      preference_models: {
        high_confidence: 0,
        medium_confidence: 0,
        low_confidence: 0,
        cold_start_users: 0
      },
      embedding_stats: {
        models_generated: 0,
        avg_dimensions: 2048,
        avg_preference_strength: 0,
        embedding_quality_score: 0
      },
      performance: {
        duration_ms: 0,
        users_per_second: 0,
        ai_calls_made: 0,
        total_cost_usd: 0
      },
      errors: []
    };
  }

  /**
   * Generate preference models for all users
   */
  async generateAllUserPreferences(): Promise<UserPreferenceGeneration> {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Starting user preference model generation: ${this.generationId}`);
      
      // Get all users with interaction data
      const users = await this.getAllUsersWithInteractions();
      this.stats.users_processed.total_users = users.length;
      
      console.log(`👥 Found ${users.length} users with interaction data`);
      
      // Process users in batches
      for (let i = 0; i < users.length; i += this.batchSize) {
        const batch = users.slice(i, i + this.batchSize);
        await this.processBatch(batch);
        
        console.log(`   Processed ${Math.min(i + this.batchSize, users.length)}/${users.length} users`);
      }
      
      // Complete generation
      this.stats.status = 'completed';
      this.stats.completed_at = new Date().toISOString();
      this.stats.performance.duration_ms = Date.now() - startTime;
      this.stats.performance.users_per_second = this.stats.users_processed.successful / (this.stats.performance.duration_ms / 1000);
      
      // Calculate embedding statistics
      await this.calculateEmbeddingStatistics();
      
      // Log completion
      await this.logGenerationCompletion();
      
      console.log(`✅ Preference model generation completed!`);
      this.printGenerationSummary();
      
      return this.stats;
      
    } catch (error) {
      console.error('❌ Preference model generation failed:', error);
      this.stats.status = 'failed';
      this.stats.completed_at = new Date().toISOString();
      throw error;
    }
  }

  /**
   * Get all users with interaction data
   */
  private async getAllUsersWithInteractions(): Promise<string[]> {
    try {
      const { data: users, error } = await this.supabase
        .from('user_interactions')
        .select('user_id')
        .neq('user_id', 'anonymous');

      if (error) throw error;

      // Get unique users
      const uniqueUsers = [...new Set(users?.map(u => u.user_id) || [])];
      
      // Categorize users
      const authenticatedUsers = uniqueUsers.filter(id => !id.startsWith('guest_'));
      const guestUsers = uniqueUsers.filter(id => id.startsWith('guest_'));
      
      this.stats.users_processed.authenticated_users = authenticatedUsers.length;
      this.stats.users_processed.guest_users = guestUsers.length;
      
      return uniqueUsers;
      
    } catch (error) {
      console.error('Failed to get users with interactions:', error);
      return [];
    }
  }

  /**
   * Process a batch of users
   */
  private async processBatch(userIds: string[]): Promise<void> {
    const batchPromises = userIds.map(userId => this.generateUserPreferenceModel(userId));
    const results = await Promise.allSettled(batchPromises);
    
    // Process results
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const userId = userIds[i];
      
      if (result.status === 'fulfilled') {
        this.stats.users_processed.successful++;
        
        if (result.value) {
          const model = result.value;
          if (model.preference_strength > 0.7) {
            this.stats.preference_models.high_confidence++;
          } else if (model.preference_strength > 0.4) {
            this.stats.preference_models.medium_confidence++;
          } else {
            this.stats.preference_models.low_confidence++;
          }
        }
      } else {
        this.stats.users_processed.failed++;
        this.recordError(userId, 'batch_processing', result.reason?.message || 'Unknown error');
      }
    }
  }

  /**
   * Generate preference model for a single user
   */
  async generateUserPreferenceModel(userId: string): Promise<GeneratedPreferenceModel | null> {
    try {
      // Get user interaction summary
      const interactionSummary = await this.getUserInteractionSummary(userId);
      
      if (interactionSummary.total_interactions === 0) {
        this.stats.preference_models.cold_start_users++;
        this.stats.users_processed.skipped++;
        return null;
      }

      // Generate preference model
      const preferenceModel = await this.buildPreferenceModel(interactionSummary);
      
      // Store in database
      await this.storePreferenceModel(preferenceModel);
      
      this.stats.embedding_stats.models_generated++;
      
      return preferenceModel;
      
    } catch (error) {
      this.recordError(userId, 'model_generation', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Get comprehensive interaction summary for user
   */
  private async getUserInteractionSummary(userId: string): Promise<UserInteractionSummary> {
    const { data: interactions, error } = await this.supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');

    if (error) throw error;

    const summary: UserInteractionSummary = {
      user_id: userId,
      total_interactions: interactions?.length || 0,
      interaction_types: {},
      fragrance_ratings: [],
      collection_items: [],
      search_queries: [],
      view_patterns: [],
      recent_activity: false,
      preference_indicators: []
    };

    if (!interactions || interactions.length === 0) {
      return summary;
    }

    // Analyze interactions
    for (const interaction of interactions) {
      // Count interaction types
      const type = interaction.interaction_type;
      summary.interaction_types[type] = (summary.interaction_types[type] || 0) + 1;

      // Extract ratings
      if (type === 'rating' && interaction.interaction_value) {
        summary.fragrance_ratings.push({
          fragrance_id: interaction.fragrance_id!,
          rating: interaction.interaction_value,
          notes: interaction.interaction_context?.notes
        });
      }

      // Extract collection items
      if (type === 'collection_add') {
        summary.collection_items.push({
          fragrance_id: interaction.fragrance_id!,
          collection_type: interaction.interaction_context?.collection_type || 'saved',
          created_at: interaction.created_at
        });
      }

      // Extract search queries
      if (type === 'search' && interaction.interaction_context?.query) {
        summary.search_queries.push(interaction.interaction_context.query);
      }

      // Track view patterns
      if (type === 'view') {
        const existingView = summary.view_patterns.find(v => v.fragrance_id === interaction.fragrance_id);
        if (existingView) {
          existingView.total_views++;
          existingView.avg_duration = (existingView.avg_duration + (interaction.interaction_value || 0)) / 2;
        } else {
          summary.view_patterns.push({
            fragrance_id: interaction.fragrance_id!,
            total_views: 1,
            avg_duration: interaction.interaction_value || 0
          });
        }
      }
    }

    // Check for recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    summary.recent_activity = interactions.some(i => new Date(i.created_at) > thirtyDaysAgo);

    // Generate preference indicators
    summary.preference_indicators = await this.extractPreferenceIndicators(summary, interactions);

    return summary;
  }

  /**
   * Extract preference indicators from user interactions
   */
  private async extractPreferenceIndicators(
    summary: UserInteractionSummary,
    interactions: any[]
  ): Promise<PreferenceIndicator[]> {
    const indicators: PreferenceIndicator[] = [];

    // Get fragrance data for analysis
    const fragranceIds = [...new Set(interactions.map(i => i.fragrance_id).filter(Boolean))];
    
    if (fragranceIds.length === 0) return indicators;

    const { data: fragrances, error } = await this.supabase
      .from('fragrances')
      .select('id, scent_family, brand_name, price_tier, occasion_tags, seasonal_appropriateness')
      .in('id', fragranceIds);

    if (error || !fragrances) return indicators;

    // Analyze scent family preferences
    const scentFamilyPrefs = this.analyzeScenFamilyPreferences(summary, fragrances);
    indicators.push(...scentFamilyPrefs);

    // Analyze brand preferences
    const brandPrefs = this.analyzeBrandPreferences(summary, fragrances);
    indicators.push(...brandPrefs);

    // Analyze price preferences
    const pricePrefs = this.analyzePricePreferences(summary, fragrances);
    indicators.push(...pricePrefs);

    // Analyze seasonal preferences
    const seasonalPrefs = this.analyzeSeasonalPreferences(summary, fragrances);
    indicators.push(...seasonalPrefs);

    return indicators;
  }

  private analyzeScenFamilyPreferences(
    summary: UserInteractionSummary,
    fragrances: any[]
  ): PreferenceIndicator[] {
    const scentFamilyScores: Record<string, { score: number; evidence: number; types: Set<string> }> = {};

    // Analyze ratings
    for (const rating of summary.fragrance_ratings) {
      const fragrance = fragrances.find(f => f.id === rating.fragrance_id);
      if (fragrance?.scent_family) {
        const families = Array.isArray(fragrance.scent_family) ? fragrance.scent_family : [fragrance.scent_family];
        
        for (const family of families) {
          if (!scentFamilyScores[family]) {
            scentFamilyScores[family] = { score: 0, evidence: 0, types: new Set() };
          }
          
          // Weight by rating (higher ratings = stronger preference)
          const weight = rating.rating / 5;
          scentFamilyScores[family].score += weight;
          scentFamilyScores[family].evidence++;
          scentFamilyScores[family].types.add('rating');
        }
      }
    }

    // Analyze collection items
    for (const item of summary.collection_items) {
      const fragrance = fragrances.find(f => f.id === item.fragrance_id);
      if (fragrance?.scent_family) {
        const families = Array.isArray(fragrance.scent_family) ? fragrance.scent_family : [fragrance.scent_family];
        
        for (const family of families) {
          if (!scentFamilyScores[family]) {
            scentFamilyScores[family] = { score: 0, evidence: 0, types: new Set() };
          }
          
          // Weight collection items lower than ratings
          const weight = item.collection_type === 'owned' ? 0.8 : 
                        item.collection_type === 'wishlist' ? 0.6 : 0.4;
          scentFamilyScores[family].score += weight;
          scentFamilyScores[family].evidence++;
          scentFamilyScores[family].types.add('collection');
        }
      }
    }

    // Convert to preference indicators
    const indicators: PreferenceIndicator[] = [];
    
    for (const [family, data] of Object.entries(scentFamilyScores)) {
      if (data.evidence >= 2) { // Require at least 2 pieces of evidence
        const confidence = Math.min(data.score / data.evidence, 1.0);
        
        if (confidence > 0.3) {
          indicators.push({
            category: 'scent_family',
            value: family,
            confidence,
            evidence_count: data.evidence,
            evidence_types: Array.from(data.types)
          });
        }
      }
    }

    return indicators.sort((a, b) => b.confidence - a.confidence);
  }

  private analyzeBrandPreferences(
    summary: UserInteractionSummary,
    fragrances: any[]
  ): PreferenceIndicator[] {
    const brandScores: Record<string, { score: number; evidence: number; types: Set<string> }> = {};

    // Similar analysis for brands
    for (const rating of summary.fragrance_ratings) {
      const fragrance = fragrances.find(f => f.id === rating.fragrance_id);
      if (fragrance?.brand_name) {
        if (!brandScores[fragrance.brand_name]) {
          brandScores[fragrance.brand_name] = { score: 0, evidence: 0, types: new Set() };
        }
        
        const weight = rating.rating / 5;
        brandScores[fragrance.brand_name].score += weight;
        brandScores[fragrance.brand_name].evidence++;
        brandScores[fragrance.brand_name].types.add('rating');
      }
    }

    for (const item of summary.collection_items) {
      const fragrance = fragrances.find(f => f.id === item.fragrance_id);
      if (fragrance?.brand_name) {
        if (!brandScores[fragrance.brand_name]) {
          brandScores[fragrance.brand_name] = { score: 0, evidence: 0, types: new Set() };
        }
        
        const weight = item.collection_type === 'owned' ? 0.7 : 0.5;
        brandScores[fragrance.brand_name].score += weight;
        brandScores[fragrance.brand_name].evidence++;
        brandScores[fragrance.brand_name].types.add('collection');
      }
    }

    const indicators: PreferenceIndicator[] = [];
    
    for (const [brand, data] of Object.entries(brandScores)) {
      if (data.evidence >= 2 && data.score / data.evidence > 0.4) {
        indicators.push({
          category: 'brand',
          value: brand,
          confidence: Math.min(data.score / data.evidence, 1.0),
          evidence_count: data.evidence,
          evidence_types: Array.from(data.types)
        });
      }
    }

    return indicators.sort((a, b) => b.confidence - a.confidence).slice(0, 5); // Top 5 brands
  }

  private analyzePricePreferences(
    summary: UserInteractionSummary,
    fragrances: any[]
  ): PreferenceIndicator[] {
    const priceRanges = ['budget', 'mid_range', 'luxury', 'ultra_luxury'];
    const priceScores: Record<string, { score: number; evidence: number }> = {};

    // Initialize
    priceRanges.forEach(range => {
      priceScores[range] = { score: 0, evidence: 0 };
    });

    // Analyze collection and rating patterns
    const allUserFragrances = [...summary.fragrance_ratings, ...summary.collection_items];
    
    for (const item of allUserFragrances) {
      const fragrance = fragrances.find(f => f.id === item.fragrance_id);
      if (fragrance?.price_tier) {
        const weight = 'rating' in item ? item.rating / 5 : 0.6;
        priceScores[fragrance.price_tier].score += weight;
        priceScores[fragrance.price_tier].evidence++;
      }
    }

    const indicators: PreferenceIndicator[] = [];
    
    for (const [range, data] of Object.entries(priceScores)) {
      if (data.evidence > 0) {
        indicators.push({
          category: 'price_range',
          value: range,
          confidence: Math.min(data.score / data.evidence, 1.0),
          evidence_count: data.evidence,
          evidence_types: ['collection', 'rating']
        });
      }
    }

    return indicators.sort((a, b) => b.confidence - a.confidence);
  }

  private analyzeSeasonalPreferences(
    summary: UserInteractionSummary,
    fragrances: any[]
  ): PreferenceIndicator[] {
    // Simplified seasonal analysis
    const seasons = ['spring', 'summer', 'fall', 'winter'];
    const seasonalScores: Record<string, { score: number; evidence: number }> = {};

    seasons.forEach(season => {
      seasonalScores[season] = { score: 0, evidence: 0 };
    });

    // Would analyze seasonal appropriateness from fragrance data
    // For now, return empty array (to be implemented based on actual data structure)
    return [];
  }

  /**
   * Build preference model from interaction summary
   */
  private async buildPreferenceModel(summary: UserInteractionSummary): Promise<GeneratedPreferenceModel> {
    const userId = summary.user_id;
    
    // Determine generation method based on data quality
    const generationMethod = this.determineGenerationMethod(summary);
    
    let userEmbedding: number[];
    let qualityScore: number;

    if (generationMethod === 'weighted_average') {
      const result = await this.generateEmbeddingFromWeightedAverage(summary);
      userEmbedding = result.embedding;
      qualityScore = result.quality;
    } else if (generationMethod === 'ai_generated') {
      const result = await this.generateEmbeddingFromAI(summary);
      userEmbedding = result.embedding;
      qualityScore = result.quality;
      this.stats.performance.ai_calls_made++;
      this.stats.performance.total_cost_usd += result.cost || 0;
    } else {
      // Hybrid approach
      const weightedResult = await this.generateEmbeddingFromWeightedAverage(summary);
      const aiResult = await this.generateEmbeddingFromAI(summary);
      
      // Combine embeddings (70% weighted, 30% AI)
      userEmbedding = this.combineEmbeddings(weightedResult.embedding, aiResult.embedding, 0.7);
      qualityScore = (weightedResult.quality + aiResult.quality) / 2;
      
      this.stats.performance.ai_calls_made++;
      this.stats.performance.total_cost_usd += aiResult.cost || 0;
    }

    // Calculate preference strength
    const preferenceStrength = this.calculatePreferenceStrength(summary);

    // Calculate confidence factors
    const confidenceFactors = {
      interaction_volume: Math.min(summary.total_interactions / 20, 1.0),
      rating_consistency: this.calculateRatingConsistency(summary.fragrance_ratings),
      behavioral_patterns: this.calculateBehavioralPatternScore(summary),
      temporal_consistency: summary.recent_activity ? 1.0 : 0.7
    };

    return {
      user_id: userId,
      user_embedding: userEmbedding,
      preference_strength: preferenceStrength,
      preference_indicators: summary.preference_indicators,
      embedding_metadata: {
        model_used: 'voyage-3-large',
        dimensions: 2048,
        source_interactions: summary.total_interactions,
        quality_score: qualityScore,
        generation_method: generationMethod
      },
      confidence_factors: confidenceFactors
    };
  }

  private determineGenerationMethod(summary: UserInteractionSummary): 'weighted_average' | 'ai_generated' | 'hybrid' {
    const ratingCount = summary.fragrance_ratings.length;
    const collectionCount = summary.collection_items.length;
    
    if (ratingCount >= 5 && collectionCount >= 3) {
      return 'hybrid'; // Best of both approaches
    } else if (ratingCount >= 3 || collectionCount >= 5) {
      return 'weighted_average'; // Sufficient data for mathematical approach
    } else {
      return 'ai_generated'; // Need AI to infer from limited data
    }
  }

  private async generateEmbeddingFromWeightedAverage(summary: UserInteractionSummary): Promise<{ embedding: number[]; quality: number }> {
    // Get fragrance embeddings for rated/collected items
    const fragranceIds = [
      ...summary.fragrance_ratings.map(r => r.fragrance_id),
      ...summary.collection_items.map(c => c.fragrance_id)
    ];

    if (fragranceIds.length === 0) {
      return { embedding: Array(2048).fill(0), quality: 0 };
    }

    const { data: fragrances, error } = await this.supabase
      .from('fragrances')
      .select('id, embedding')
      .in('id', fragranceIds)
      .not('embedding', 'is', null);

    if (error || !fragrances || fragrances.length === 0) {
      return { embedding: Array(2048).fill(0), quality: 0 };
    }

    // Calculate weighted average
    let weightedSum: number[] = Array(2048).fill(0);
    let totalWeight = 0;

    for (const fragrance of fragrances) {
      const embedding = JSON.parse(fragrance.embedding as any);
      
      // Calculate weight based on user's interaction with this fragrance
      let weight = 0.5; // Base weight
      
      const rating = summary.fragrance_ratings.find(r => r.fragrance_id === fragrance.id);
      if (rating) {
        weight = rating.rating / 5; // 0.2 to 1.0 based on rating
      }
      
      const collection = summary.collection_items.find(c => c.fragrance_id === fragrance.id);
      if (collection) {
        const collectionWeight = collection.collection_type === 'owned' ? 0.8 : 
                                collection.collection_type === 'wishlist' ? 0.6 : 0.4;
        weight = Math.max(weight, collectionWeight);
      }

      // Apply weight to embedding
      for (let i = 0; i < 2048; i++) {
        weightedSum[i] += embedding[i] * weight;
      }
      totalWeight += weight;
    }

    // Normalize
    if (totalWeight > 0) {
      for (let i = 0; i < 2048; i++) {
        weightedSum[i] /= totalWeight;
      }
    }

    const quality = Math.min(fragrances.length / 10, 1.0); // Quality based on data volume

    return { embedding: weightedSum, quality };
  }

  private async generateEmbeddingFromAI(summary: UserInteractionSummary): Promise<{ embedding: number[]; quality: number; cost?: number }> {
    try {
      // Create text description of user preferences
      const preferenceText = this.generatePreferenceText(summary);
      
      // Generate embedding using AI
      const response = await this.aiClient.generateEmbedding(preferenceText);
      
      return {
        embedding: response.embedding,
        quality: 0.8, // AI-generated quality estimate
        cost: response.cost
      };
      
    } catch (error) {
      console.warn('Failed to generate AI embedding, using fallback:', error);
      return { embedding: Array(2048).fill(0.1), quality: 0.2 };
    }
  }

  private generatePreferenceText(summary: UserInteractionSummary): string {
    const elements: string[] = [];

    // Add favorite scent families
    const topScentFamilies = summary.preference_indicators
      .filter(ind => ind.category === 'scent_family')
      .slice(0, 3)
      .map(ind => ind.value);
    
    if (topScentFamilies.length > 0) {
      elements.push(`Prefers ${topScentFamilies.join(', ')} fragrances`);
    }

    // Add brand preferences
    const topBrands = summary.preference_indicators
      .filter(ind => ind.category === 'brand')
      .slice(0, 2)
      .map(ind => ind.value);
    
    if (topBrands.length > 0) {
      elements.push(`Enjoys ${topBrands.join(' and ')} brands`);
    }

    // Add rating patterns
    const avgRating = summary.fragrance_ratings.length > 0 ?
      summary.fragrance_ratings.reduce((sum, r) => sum + r.rating, 0) / summary.fragrance_ratings.length : 0;
    
    if (avgRating > 4) {
      elements.push('Has high standards and appreciates quality fragrances');
    } else if (avgRating > 3) {
      elements.push('Enjoys a variety of fragrances with moderate selectivity');
    }

    // Add interaction patterns
    if (summary.view_patterns.length > 10) {
      elements.push('Actively explores and discovers new fragrances');
    }

    // Combine into coherent description
    const baseText = elements.length > 0 ? elements.join('. ') : 'User with developing fragrance preferences';
    
    return `Fragrance user profile: ${baseText}. Shows interest in discovering new scents and building a personal collection.`;
  }

  private combineEmbeddings(embedding1: number[], embedding2: number[], weight1: number): number[] {
    const combined: number[] = [];
    const weight2 = 1 - weight1;
    
    for (let i = 0; i < 2048; i++) {
      combined[i] = (embedding1[i] * weight1) + (embedding2[i] * weight2);
    }
    
    return combined;
  }

  private calculatePreferenceStrength(summary: UserInteractionSummary): number {
    const factors = {
      interaction_volume: Math.min(summary.total_interactions / 20, 1.0),
      rating_count: Math.min(summary.fragrance_ratings.length / 10, 1.0),
      collection_size: Math.min(summary.collection_items.length / 15, 1.0),
      interaction_diversity: Math.min(Object.keys(summary.interaction_types).length / 5, 1.0),
      recent_activity: summary.recent_activity ? 1.0 : 0.6
    };

    const weights = {
      interaction_volume: 0.3,
      rating_count: 0.3,
      collection_size: 0.2,
      interaction_diversity: 0.1,
      recent_activity: 0.1
    };

    let strength = 0;
    for (const [factor, value] of Object.entries(factors)) {
      strength += value * weights[factor as keyof typeof weights];
    }

    return Math.min(strength, 1.0);
  }

  private calculateRatingConsistency(ratings: { rating: number }[]): number {
    if (ratings.length < 2) return 0.5;
    
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    const variance = ratings.reduce((sum, r) => sum + Math.pow(r.rating - avgRating, 2), 0) / ratings.length;
    
    // Lower variance = higher consistency
    return Math.max(0, 1 - (variance / 2.5)); // Normalize variance to 0-1 scale
  }

  private calculateBehavioralPatternScore(summary: UserInteractionSummary): number {
    let score = 0;
    
    // Consistent viewing patterns
    if (summary.view_patterns.length > 5) score += 0.2;
    
    // Search behavior
    if (summary.search_queries.length > 0) score += 0.2;
    
    // Collection building behavior
    if (summary.collection_items.length > 3) score += 0.3;
    
    // Rating behavior
    if (summary.fragrance_ratings.length > 2) score += 0.3;
    
    return Math.min(score, 1.0);
  }

  /**
   * Store preference model in database
   */
  private async storePreferenceModel(model: GeneratedPreferenceModel): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_preferences')
        .upsert({
          user_id: model.user_id,
          user_embedding: JSON.stringify(model.user_embedding),
          embedding_model: model.embedding_metadata.model_used,
          preference_strength: model.preference_strength,
          last_updated: new Date().toISOString(),
          interaction_count: model.embedding_metadata.source_interactions,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Store preference indicators in cache
      await this.supabase
        .from('collection_analysis_cache')
        .upsert({
          user_id: model.user_id,
          analysis_type: 'preference_indicators',
          analysis_data: {
            indicators: model.preference_indicators,
            confidence_factors: model.confidence_factors,
            embedding_metadata: model.embedding_metadata,
            generated_at: new Date().toISOString()
          },
          confidence_score: model.preference_strength,
          cache_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });

    } catch (error) {
      this.recordError(model.user_id, 'preference_storage', 'storage_failed', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Calculate final embedding statistics
   */
  private async calculateEmbeddingStatistics(): Promise<void> {
    try {
      const { data: preferences, error } = await this.supabase
        .from('user_preferences')
        .select('preference_strength, user_embedding')
        .not('user_embedding', 'is', null);

      if (error) throw error;

      if (preferences && preferences.length > 0) {
        this.stats.embedding_stats.avg_preference_strength = 
          preferences.reduce((sum, p) => sum + (p.preference_strength || 0), 0) / preferences.length;
        
        this.stats.embedding_stats.embedding_quality_score = 
          this.stats.embedding_stats.avg_preference_strength * 0.8; // Simplified quality metric
      }
    } catch (error) {
      console.warn('Failed to calculate embedding statistics:', error);
    }
  }

  private async logGenerationCompletion(): Promise<void> {
    try {
      await this.supabase
        .from('ai_processing_queue')
        .insert({
          task_type: 'preference_generation_complete',
          task_data: {
            generation_id: this.generationId,
            stats: this.stats,
            completion_timestamp: new Date().toISOString()
          },
          priority: 10,
          status: 'completed'
        });
    } catch (error) {
      console.warn('Failed to log generation completion:', error);
    }
  }

  private recordError(userId: string, errorType: string, errorMessage: string): void {
    this.stats.errors.push({
      user_id: userId,
      error_type: errorType,
      error_message: errorMessage,
      timestamp: new Date().toISOString(),
      retry_count: 0,
      interaction_count: 0
    });
  }

  private printGenerationSummary(): void {
    console.log('\n📊 Preference Model Generation Summary:');
    console.log('==========================================');
    console.log(`Generation ID: ${this.stats.generation_id}`);
    console.log(`Status: ${this.stats.status}`);
    console.log(`Duration: ${(this.stats.performance.duration_ms / 1000).toFixed(2)}s`);
    console.log(`Users/second: ${this.stats.performance.users_per_second.toFixed(2)}`);
    console.log(`\nUsers Processed:`);
    console.log(`  - Total: ${this.stats.users_processed.total_users}`);
    console.log(`  - Successful: ${this.stats.users_processed.successful}`);
    console.log(`  - Failed: ${this.stats.users_processed.failed}`);
    console.log(`  - Skipped: ${this.stats.users_processed.skipped}`);
    console.log(`\nPreference Models:`);
    console.log(`  - High Confidence: ${this.stats.preference_models.high_confidence}`);
    console.log(`  - Medium Confidence: ${this.stats.preference_models.medium_confidence}`);
    console.log(`  - Low Confidence: ${this.stats.preference_models.low_confidence}`);
    console.log(`  - Cold Start Users: ${this.stats.preference_models.cold_start_users}`);
    console.log(`\nAI Performance:`);
    console.log(`  - AI Calls Made: ${this.stats.performance.ai_calls_made}`);
    console.log(`  - Total Cost: $${this.stats.performance.total_cost_usd.toFixed(4)}`);
    console.log(`  - Avg Preference Strength: ${this.stats.embedding_stats.avg_preference_strength.toFixed(3)}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️  Errors: ${this.stats.errors.length}`);
    }
    console.log('==========================================\n');
  }

  /**
   * Get generation statistics
   */
  getStats(): UserPreferenceGeneration {
    return { ...this.stats };
  }
}

// Export factory function
export const createUserPreferenceModelGenerator = (
  supabaseUrl?: string,
  supabaseKey?: string,
  aiClient?: AIClient
) => {
  return new UserPreferenceModelGenerator(supabaseUrl, supabaseKey, aiClient);
};

// CLI interface
if (require.main === module) {
  (async () => {
    try {
      console.log('🚀 Starting user preference model generation...');
      
      const generator = createUserPreferenceModelGenerator();
      const stats = await generator.generateAllUserPreferences();
      
      console.log('🎉 User preference model generation completed!');
      console.log('📋 Final stats:', JSON.stringify(stats, null, 2));
      
    } catch (error) {
      console.error('💥 Preference model generation failed:', error);
      process.exit(1);
    }
  })();
}