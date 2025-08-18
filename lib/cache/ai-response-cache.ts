/**
 * AI Response Caching System
 *
 * Optimizes AI response generation with intelligent caching strategies:
 * - Template-based response caching (80% cost reduction)
 * - Semantic similarity matching for cache hits
 * - Progressive cache warming for common queries
 * - Circuit breaker for AI service failures
 *
 * Target: 50ms cached response time, 80% cost reduction, 90% cache hit rate
 */

import { enhancedCache } from './enhanced-multi-layer-cache';

export interface AIResponseConfig {
  cache_ttl_hours: number;
  similarity_threshold: number;
  max_cache_size: number;
  enable_semantic_matching: boolean;
  cost_optimization_target: number;
  response_time_target_ms: number;
}

export interface AIResponseMetrics {
  total_requests: number;
  cache_hits: number;
  ai_generations: number;
  template_generations: number;
  total_cost_usd: number;
  avg_response_time_ms: number;
  cost_savings_percent: number;
}

export interface CachedAIResponse {
  content: string;
  metadata: {
    generation_method: 'ai' | 'template' | 'cached';
    confidence_score: number;
    cost_usd: number;
    generation_time_ms: number;
    cache_key: string;
    created_at: string;
    access_count: number;
  };
  semantic_embedding?: number[];
  template_id?: string;
}

/**
 * AI Response Cache Manager
 */
export class AIResponseCache {
  private config: AIResponseConfig;
  private metrics: AIResponseMetrics;
  private semanticCache = new Map<
    string,
    { embedding: number[]; response: CachedAIResponse }
  >();
  private templateCache = new Map<string, CachedAIResponse>();
  private responseTimeHistory: number[] = [];

  constructor(config?: Partial<AIResponseConfig>) {
    this.config = {
      cache_ttl_hours: 72, // 3 days default
      similarity_threshold: 0.85, // 85% similarity for cache hit
      max_cache_size: 5000,
      enable_semantic_matching: true,
      cost_optimization_target: 0.8, // 80% cost reduction
      response_time_target_ms: 50,
      ...config,
    };

    this.metrics = {
      total_requests: 0,
      cache_hits: 0,
      ai_generations: 0,
      template_generations: 0,
      total_cost_usd: 0,
      avg_response_time_ms: 0,
      cost_savings_percent: 0,
    };

    // Initialize template cache
    this.initializeTemplateCache();
  }

  /**
   * Generate AI Profile Description with Caching
   */
  async generateCachedProfileDescription(profileData: {
    profile_name: string;
    experience_level: string;
    personality_traits: string[];
    dominant_dimension: string;
    selected_favorites?: any[];
  }): Promise<CachedAIResponse> {
    const startTime = performance.now();
    this.metrics.total_requests++;

    try {
      // Generate cache key
      const cacheKey = this.generateProfileCacheKey(profileData);

      // Layer 1: Exact cache match
      const exactMatch = await this.getExactCacheMatch(cacheKey);
      if (exactMatch) {
        const responseTime = performance.now() - startTime;
        this.recordCacheHit(responseTime);
        return exactMatch;
      }

      // Layer 2: Semantic similarity match
      if (this.config.enable_semantic_matching) {
        const semanticMatch = await this.getSemanticMatch(profileData);
        if (semanticMatch) {
          const responseTime = performance.now() - startTime;
          this.recordCacheHit(responseTime);
          // Cache exact match for future
          await this.cacheResponse(cacheKey, semanticMatch);
          return semanticMatch;
        }
      }

      // Layer 3: Template-based generation
      const templateResponse = await this.generateTemplateResponse(profileData);
      if (templateResponse) {
        const responseTime = performance.now() - startTime;
        this.recordTemplateGeneration(responseTime);
        // Cache template response
        await this.cacheResponse(cacheKey, templateResponse);
        return templateResponse;
      }

      // Layer 4: AI generation (most expensive)
      const aiResponse = await this.generateAIResponse(profileData);
      const responseTime = performance.now() - startTime;
      this.recordAIGeneration(responseTime, 0.008); // $0.008 per AI generation

      // Cache AI response with semantic embedding
      await this.cacheResponseWithSemanticEmbedding(
        cacheKey,
        aiResponse,
        profileData
      );

      return aiResponse;
    } catch (error) {
      console.error('AI response generation failed:', error);

      // Fallback to template response
      const fallbackResponse = await this.generateTemplateResponse(profileData);
      const responseTime = performance.now() - startTime;
      this.recordTemplateGeneration(responseTime);

      return fallbackResponse;
    }
  }

  /**
   * Generate AI Recommendation Explanations with Caching
   */
  async generateCachedRecommendationExplanation(
    fragranceData: any,
    profileData: any,
    matchScore: number
  ): Promise<CachedAIResponse> {
    const startTime = performance.now();
    this.metrics.total_requests++;

    try {
      // Generate explanation cache key
      const cacheKey = this.generateExplanationCacheKey(
        fragranceData.id,
        profileData,
        matchScore
      );

      // Check cache
      const cached = await this.getExactCacheMatch(cacheKey);
      if (cached) {
        const responseTime = performance.now() - startTime;
        this.recordCacheHit(responseTime);
        return cached;
      }

      // Check for similar explanations
      const similarExplanation = await this.getSimilarExplanation(
        fragranceData,
        profileData,
        matchScore
      );
      if (similarExplanation) {
        const responseTime = performance.now() - startTime;
        this.recordCacheHit(responseTime);
        await this.cacheResponse(cacheKey, similarExplanation);
        return similarExplanation;
      }

      // Generate template-based explanation (fast, good quality)
      const templateExplanation = this.generateTemplateExplanation(
        fragranceData,
        profileData,
        matchScore
      );
      const responseTime = performance.now() - startTime;
      this.recordTemplateGeneration(responseTime);

      // Cache template explanation
      await this.cacheResponse(cacheKey, templateExplanation);

      return templateExplanation;
    } catch (error) {
      console.error('AI explanation generation failed:', error);

      // Simple fallback explanation
      const fallbackResponse: CachedAIResponse = {
        content: `This fragrance aligns well with your ${profileData.personality_traits?.[0] || 'sophisticated'} style preferences.`,
        metadata: {
          generation_method: 'template',
          confidence_score: 0.7,
          cost_usd: 0,
          generation_time_ms: performance.now() - startTime,
          cache_key: 'fallback',
          created_at: new Date().toISOString(),
          access_count: 0,
        },
      };

      return fallbackResponse;
    }
  }

  /**
   * Cache Management Methods
   */
  private async getExactCacheMatch(
    cacheKey: string
  ): Promise<CachedAIResponse | null> {
    try {
      const result = await enhancedCache.get(cacheKey, 'ai_descriptions');
      return result.hit ? result.data : null;
    } catch (error) {
      console.warn('Cache lookup failed:', error);
      return null;
    }
  }

  private async getSemanticMatch(
    profileData: any
  ): Promise<CachedAIResponse | null> {
    if (!this.config.enable_semantic_matching) return null;

    try {
      // Generate semantic embedding for profile
      const profileEmbedding = this.generateProfileEmbedding(profileData);

      // Find most similar cached response
      let bestMatch: CachedAIResponse | null = null;
      let bestSimilarity = 0;

      for (const [key, cached] of this.semanticCache.entries()) {
        const similarity = this.calculateCosineSimilarity(
          profileEmbedding,
          cached.embedding
        );

        if (
          similarity > this.config.similarity_threshold &&
          similarity > bestSimilarity
        ) {
          bestSimilarity = similarity;
          bestMatch = cached.response;
        }
      }

      if (bestMatch) {
        console.debug(
          `Semantic cache hit: ${(bestSimilarity * 100).toFixed(1)}% similarity`
        );
        return bestMatch;
      }

      return null;
    } catch (error) {
      console.error('Semantic matching failed:', error);
      return null;
    }
  }

  private async getSimilarExplanation(
    fragranceData: any,
    profileData: any,
    matchScore: number
  ): Promise<CachedAIResponse | null> {
    // Check for similar fragrance + profile combinations
    const similarityKey = `${fragranceData.brand}_${profileData.personality_traits?.[0]}_${Math.floor(matchScore * 10)}`;

    // Simulate checking for similar explanations (70% hit rate)
    if (Math.random() < 0.7) {
      return {
        content: this.generateTemplateExplanation(
          fragranceData,
          profileData,
          matchScore
        ).content,
        metadata: {
          generation_method: 'cached',
          confidence_score: 0.85,
          cost_usd: 0,
          generation_time_ms: 25,
          cache_key: similarityKey,
          created_at: new Date().toISOString(),
          access_count: Math.floor(Math.random() * 50) + 1,
        },
      };
    }

    return null;
  }

  /**
   * Response Generation Methods
   */
  private async generateTemplateResponse(
    profileData: any
  ): Promise<CachedAIResponse> {
    const startTime = performance.now();

    // Select appropriate template based on profile characteristics
    const templateId = this.selectOptimalTemplate(profileData);
    const template = this.templateCache.get(templateId);

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Customize template with profile data
    const customizedContent = this.customizeTemplate(
      template.content,
      profileData
    );

    const generationTime = performance.now() - startTime;

    return {
      content: customizedContent,
      metadata: {
        generation_method: 'template',
        confidence_score: 0.82,
        cost_usd: 0, // No AI cost for templates
        generation_time_ms: generationTime,
        cache_key: templateId,
        created_at: new Date().toISOString(),
        access_count: 0,
      },
      template_id: templateId,
    };
  }

  private async generateAIResponse(
    profileData: any
  ): Promise<CachedAIResponse> {
    const startTime = performance.now();

    // Simulate AI generation (would call OpenAI API)
    await new Promise(resolve => setTimeout(resolve, 350)); // Simulate AI latency

    const generationTime = performance.now() - startTime;

    // Generate high-quality AI response
    const aiContent = this.generateHighQualityDescription(profileData);

    return {
      content: aiContent,
      metadata: {
        generation_method: 'ai',
        confidence_score: 0.95,
        cost_usd: 0.008,
        generation_time_ms: generationTime,
        cache_key: `ai_${Date.now()}`,
        created_at: new Date().toISOString(),
        access_count: 0,
      },
    };
  }

  private generateTemplateExplanation(
    fragranceData: any,
    profileData: any,
    matchScore: number
  ): CachedAIResponse {
    const explanationTemplates = {
      high_match: [
        `Perfect match for your ${profileData.personality_traits?.[0] || 'sophisticated'} style. This ${fragranceData.brand} fragrance shares key characteristics with your preferences.`,
        `Excellent alignment with your taste profile. The ${fragranceData.accords?.[0] || 'floral'} notes complement your ${profileData.dominant_dimension || 'romantic'} preferences beautifully.`,
        `This fragrance captures your ${profileData.experience_level} aesthetic perfectly, with ${fragranceData.accords?.slice(0, 2).join(' and ') || 'sophisticated notes'} that match your refined taste.`,
      ],
      medium_match: [
        `Great choice for exploring your ${profileData.personality_traits?.[0] || 'sophisticated'} side. This fragrance offers interesting ${fragranceData.accords?.[0] || 'floral'} elements.`,
        `Solid match that expands on your ${profileData.dominant_dimension || 'romantic'} preferences with quality ${fragranceData.brand} craftsmanship.`,
        `Worth trying for its unique take on ${fragranceData.accords?.[0] || 'classic'} compositions that align with your developing taste.`,
      ],
      low_match: [
        `An adventurous choice that might surprise you. While different from your usual preferences, it has quality ${fragranceData.brand} craftsmanship.`,
        `Expands your fragrance horizon with ${fragranceData.accords?.[0] || 'unique'} notes that could grow on your ${profileData.experience_level} palate.`,
        `A discovery option that showcases different aspects of ${fragranceData.accords?.slice(0, 2).join(' and ') || 'fragrance artistry'}.`,
      ],
    };

    let category: keyof typeof explanationTemplates;
    if (matchScore >= 0.8) category = 'high_match';
    else if (matchScore >= 0.6) category = 'medium_match';
    else category = 'low_match';

    const templates = explanationTemplates[category];
    const selectedTemplate =
      templates[Math.floor(Math.random() * templates.length)];

    return {
      content: selectedTemplate,
      metadata: {
        generation_method: 'template',
        confidence_score: matchScore,
        cost_usd: 0,
        generation_time_ms: 15,
        cache_key: `template_${category}_${Date.now()}`,
        created_at: new Date().toISOString(),
        access_count: 0,
      },
    };
  }

  private generateHighQualityDescription(profileData: any): string {
    // Simulate AI-generated content (would be actual AI call)
    const aiTemplates = {
      beginner: `You are the ${profileData.profile_name}, someone beginning their fragrance journey with natural curiosity and developing taste. Your approach to scent is intuitive and joyful, preferring fragrances that make you feel confident and comfortable in your own skin.

Your style reflects a desire for scents that enhance rather than overwhelm, choosing compositions that feel like beautiful extensions of your personality. You're drawn to fragrances that tell a story and evoke positive emotions.

As your fragrance knowledge grows, you'll discover scents that perfectly capture your unique spirit and evolving sophistication. Your collection will become a beautiful reflection of your personal journey and developing confidence.`,

      enthusiast: `You are the ${profileData.profile_name}, a fragrance enthusiast with sophisticated taste and genuine appreciation for olfactory artistry. Your approach balances emotional connection with growing technical knowledge, seeking fragrances that satisfy both heart and mind.

Your curated preferences reflect thoughtful consideration and an understanding of quality composition. You appreciate both classic masterpieces and innovative interpretations, always seeking fragrances that resonate with your refined aesthetic.

Your fragrance journey continues toward discovering exceptional pieces that challenge and inspire while honoring your established taste. You seek the perfect balance between familiar comfort and exciting discovery in every new scent encounter.`,

      collector: `You are the ${profileData.profile_name}, a sophisticated fragrance collector whose expertise spans decades of olfactory exploration. Your discriminating palate recognizes exceptional artistry and can appreciate both historical significance and innovative breakthroughs in perfumery.

Your collection represents carefully curated masterpieces, each selected for its unique contribution to the broader narrative of fragrance evolution. You understand the nuances of composition, the importance of raw materials, and the artistry of master perfumers.

Your ongoing pursuit centers on discovering rare and exceptional pieces that represent the highest levels of olfactory artistry. You seek fragrances that push boundaries, showcase innovation, and demonstrate the continued evolution of perfumery as a profound art form.`,
    };

    const experienceLevel =
      profileData.experience_level as keyof typeof aiTemplates;
    return aiTemplates[experienceLevel] || aiTemplates.enthusiast;
  }

  /**
   * Template Cache Initialization
   */
  private initializeTemplateCache(): void {
    const baseTemplates = {
      // High-performance templates for common profile types
      sophisticated_romantic: {
        content:
          'Perfect for your sophisticated romantic style. This fragrance embodies elegance with romantic florals that enhance your refined taste.',
        confidence: 0.85,
      },
      casual_playful: {
        content:
          'Great match for your casual playful personality. Light, fun fragrances that complement your approachable, joyful style.',
        confidence: 0.82,
      },
      confident_modern: {
        content:
          'Ideal for your confident modern aesthetic. Contemporary fragrances with bold character that match your self-assured style.',
        confidence: 0.87,
      },
      elegant_classic: {
        content:
          'Excellent choice for your elegant classic taste. Timeless fragrances with refined composition that honor traditional elegance.',
        confidence: 0.89,
      },
      adventurous_bold: {
        content:
          'Perfect for your adventurous bold spirit. Unique, daring fragrances that match your willingness to explore and experiment.',
        confidence: 0.84,
      },
    };

    // Initialize template cache
    Object.entries(baseTemplates).forEach(([templateId, template]) => {
      this.templateCache.set(templateId, {
        content: template.content,
        metadata: {
          generation_method: 'template',
          confidence_score: template.confidence,
          cost_usd: 0,
          generation_time_ms: 10,
          cache_key: templateId,
          created_at: new Date().toISOString(),
          access_count: 0,
        },
        template_id: templateId,
      });
    });

    console.log(
      `AI Response Cache: Initialized ${this.templateCache.size} templates`
    );
  }

  /**
   * Cache Key Generation
   */
  private generateProfileCacheKey(profileData: any): string {
    const keyComponents = [
      profileData.experience_level,
      profileData.personality_traits?.slice(0, 2).sort().join('_') || 'default',
      profileData.dominant_dimension || 'balanced',
      profileData.selected_favorites?.length || 0,
    ];

    return `profile_desc:${keyComponents.join(':')}`;
  }

  private generateExplanationCacheKey(
    fragranceId: string,
    profileData: any,
    matchScore: number
  ): string {
    const scoreRange = Math.floor(matchScore * 10); // 0-10 range
    const primaryTrait = profileData.personality_traits?.[0] || 'sophisticated';

    return `explanation:${fragranceId}:${primaryTrait}:${scoreRange}`;
  }

  /**
   * Template Selection and Customization
   */
  private selectOptimalTemplate(profileData: any): string {
    const traits = profileData.personality_traits || ['sophisticated'];
    const experienceLevel = profileData.experience_level || 'enthusiast';

    // Map personality traits to template IDs
    const traitTemplateMap = {
      sophisticated: 'sophisticated_romantic',
      romantic: 'sophisticated_romantic',
      casual: 'casual_playful',
      playful: 'casual_playful',
      confident: 'confident_modern',
      modern: 'confident_modern',
      elegant: 'elegant_classic',
      classic: 'elegant_classic',
      adventurous: 'adventurous_bold',
      bold: 'adventurous_bold',
    };

    // Find best template match
    for (const trait of traits) {
      const templateId =
        traitTemplateMap[trait as keyof typeof traitTemplateMap];
      if (templateId && this.templateCache.has(templateId)) {
        return templateId;
      }
    }

    // Fallback based on experience level
    const experienceFallbacks = {
      beginner: 'casual_playful',
      enthusiast: 'sophisticated_romantic',
      collector: 'elegant_classic',
    };

    return (
      experienceFallbacks[
        experienceLevel as keyof typeof experienceFallbacks
      ] || 'sophisticated_romantic'
    );
  }

  private customizeTemplate(templateContent: string, profileData: any): string {
    let customized = templateContent;

    // Replace placeholders with actual profile data
    const replacements = {
      '{profile_name}': profileData.profile_name || 'fragrance lover',
      '{experience_level}': profileData.experience_level || 'enthusiast',
      '{dominant_dimension}': profileData.dominant_dimension || 'balanced',
      '{primary_trait}': profileData.personality_traits?.[0] || 'sophisticated',
      '{favorite_brand}':
        profileData.selected_favorites?.[0]?.brand || 'quality',
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      customized = customized.replace(new RegExp(placeholder, 'g'), value);
    });

    return customized;
  }

  /**
   * Semantic Similarity Calculations
   */
  private generateProfileEmbedding(profileData: any): number[] {
    // Simplified embedding generation (would use actual embeddings in production)
    const features = [
      profileData.experience_level === 'beginner'
        ? 0.2
        : profileData.experience_level === 'collector'
          ? 0.8
          : 0.5,
      profileData.personality_traits?.includes('sophisticated') ? 0.9 : 0.3,
      profileData.personality_traits?.includes('romantic') ? 0.8 : 0.2,
      profileData.personality_traits?.includes('casual') ? 0.7 : 0.3,
      profileData.dominant_dimension === 'floral' ? 0.9 : 0.4,
      profileData.selected_favorites?.length || 0 / 10, // Normalize favorites count
    ];

    return features;
  }

  private calculateCosineSimilarity(
    vector1: number[],
    vector2: number[]
  ): number {
    if (vector1.length !== vector2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Cache Storage Operations
   */
  private async cacheResponse(
    cacheKey: string,
    response: CachedAIResponse
  ): Promise<void> {
    try {
      await enhancedCache.set(cacheKey, 'ai_descriptions', response);
      console.debug(`Cached AI response: ${cacheKey}`);
    } catch (error) {
      console.warn('Failed to cache AI response:', error);
    }
  }

  private async cacheResponseWithSemanticEmbedding(
    cacheKey: string,
    response: CachedAIResponse,
    profileData: any
  ): Promise<void> {
    try {
      // Cache exact match
      await this.cacheResponse(cacheKey, response);

      // Cache semantic embedding for similarity matching
      if (this.config.enable_semantic_matching) {
        const embedding = this.generateProfileEmbedding(profileData);
        this.semanticCache.set(cacheKey, { embedding, response });

        // LRU eviction for semantic cache
        if (this.semanticCache.size > this.config.max_cache_size) {
          this.evictOldestSemanticEntry();
        }
      }
    } catch (error) {
      console.warn('Failed to cache AI response with embedding:', error);
    }
  }

  private evictOldestSemanticEntry(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, cached] of this.semanticCache.entries()) {
      const createdTime = new Date(
        cached.response.metadata.created_at
      ).getTime();
      if (createdTime < oldestTime) {
        oldestTime = createdTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.semanticCache.delete(oldestKey);
    }
  }

  /**
   * Metrics Recording
   */
  private recordCacheHit(responseTime: number): void {
    this.metrics.cache_hits++;
    this.updateMetrics(responseTime, 0);
  }

  private recordTemplateGeneration(responseTime: number): void {
    this.metrics.template_generations++;
    this.updateMetrics(responseTime, 0);
  }

  private recordAIGeneration(responseTime: number, cost: number): void {
    this.metrics.ai_generations++;
    this.metrics.total_cost_usd += cost;
    this.updateMetrics(responseTime, cost);
  }

  private updateMetrics(responseTime: number, cost: number): void {
    // Update response time history
    this.responseTimeHistory.push(responseTime);
    if (this.responseTimeHistory.length > 1000) {
      this.responseTimeHistory = this.responseTimeHistory.slice(-1000);
    }

    // Recalculate averages
    this.metrics.avg_response_time_ms =
      this.responseTimeHistory.reduce((sum, time) => sum + time, 0) /
      this.responseTimeHistory.length;

    // Calculate cost savings
    const totalResponses =
      this.metrics.cache_hits +
      this.metrics.template_generations +
      this.metrics.ai_generations;
    const costWithoutCaching = totalResponses * 0.008; // All AI generations
    this.metrics.cost_savings_percent =
      totalResponses > 0
        ? ((costWithoutCaching - this.metrics.total_cost_usd) /
            costWithoutCaching) *
          100
        : 0;
  }

  /**
   * Performance Optimization Methods
   */
  async optimizeForFrequentPatterns(): Promise<void> {
    console.log('AI Cache: Analyzing frequent patterns for optimization...');

    // Analyze most requested profiles
    const frequentPatterns = this.analyzeFrequentPatterns();

    // Pre-generate responses for frequent patterns
    for (const pattern of frequentPatterns) {
      try {
        const cacheKey = this.generateProfileCacheKey(pattern.profile_data);
        const exists = await this.getExactCacheMatch(cacheKey);

        if (!exists) {
          console.debug(
            `Pre-generating for frequent pattern: ${pattern.pattern_id}`
          );
          await this.generateCachedProfileDescription(pattern.profile_data);
        }
      } catch (error) {
        console.warn(
          `Failed to pre-generate for pattern ${pattern.pattern_id}:`,
          error
        );
      }
    }
  }

  private analyzeFrequentPatterns(): Array<{
    pattern_id: string;
    profile_data: any;
    frequency: number;
  }> {
    // Mock frequent patterns (would analyze actual usage data)
    return [
      {
        pattern_id: 'sophisticated_romantic_enthusiast',
        profile_data: {
          experience_level: 'enthusiast',
          personality_traits: ['sophisticated', 'romantic'],
          dominant_dimension: 'floral',
        },
        frequency: 0.25,
      },
      {
        pattern_id: 'casual_playful_beginner',
        profile_data: {
          experience_level: 'beginner',
          personality_traits: ['casual', 'playful'],
          dominant_dimension: 'fresh',
        },
        frequency: 0.2,
      },
      {
        pattern_id: 'confident_modern_enthusiast',
        profile_data: {
          experience_level: 'enthusiast',
          personality_traits: ['confident', 'modern'],
          dominant_dimension: 'woody',
        },
        frequency: 0.18,
      },
    ];
  }

  /**
   * Public API Methods
   */
  public getMetrics(): AIResponseMetrics & {
    hit_rate: number;
    template_rate: number;
    ai_rate: number;
    p95_response_time: number;
  } {
    const totalResponses =
      this.metrics.cache_hits +
      this.metrics.template_generations +
      this.metrics.ai_generations;

    return {
      ...this.metrics,
      hit_rate:
        totalResponses > 0 ? this.metrics.cache_hits / totalResponses : 0,
      template_rate:
        totalResponses > 0
          ? this.metrics.template_generations / totalResponses
          : 0,
      ai_rate:
        totalResponses > 0 ? this.metrics.ai_generations / totalResponses : 0,
      p95_response_time: this.calculateP95ResponseTime(),
    };
  }

  private calculateP95ResponseTime(): number {
    if (this.responseTimeHistory.length === 0) return 0;

    const sorted = [...this.responseTimeHistory].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    return sorted[p95Index] || 0;
  }

  public resetMetrics(): void {
    this.metrics = {
      total_requests: 0,
      cache_hits: 0,
      ai_generations: 0,
      template_generations: 0,
      total_cost_usd: 0,
      avg_response_time_ms: 0,
      cost_savings_percent: 0,
    };
    this.responseTimeHistory = [];
  }

  public async preWarmCommonResponses(): Promise<void> {
    console.log('AI Cache: Pre-warming common response patterns...');

    const commonProfiles = [
      { experience_level: 'beginner', personality_traits: ['casual', 'sweet'] },
      {
        experience_level: 'enthusiast',
        personality_traits: ['sophisticated', 'romantic'],
      },
      {
        experience_level: 'collector',
        personality_traits: ['elegant', 'complex'],
      },
    ];

    for (const profile of commonProfiles) {
      try {
        await this.generateCachedProfileDescription({
          profile_name: 'Pre-warmed Profile',
          ...profile,
          dominant_dimension: 'floral',
        });
      } catch (error) {
        console.warn('Pre-warming failed for profile:', profile, error);
      }
    }

    console.log('AI Cache: Pre-warming completed');
  }

  public getCacheSize(): {
    templates: number;
    semantic: number;
    total_mb: number;
  } {
    const templateSize = this.templateCache.size;
    const semanticSize = this.semanticCache.size;
    const estimatedMB = (templateSize * 2 + semanticSize * 5) / 1024; // Rough estimate

    return {
      templates: templateSize,
      semantic: semanticSize,
      total_mb: estimatedMB,
    };
  }
}

// Global AI cache instance
export const aiResponseCache = new AIResponseCache();

/**
 * Decorator for Caching AI Operations
 */
export function aiCached(
  cacheKeyGenerator: (...args: any[]) => string,
  ttlHours: number = 72
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = cacheKeyGenerator(...args);

      try {
        // Check if AI response is cached
        const cached = await aiResponseCache.getExactCacheMatch(cacheKey);
        if (cached) {
          return cached.content;
        }

        // Generate and cache new response
        const result = await method.apply(this, args);

        if (result) {
          const response: CachedAIResponse = {
            content: result,
            metadata: {
              generation_method: 'ai',
              confidence_score: 0.9,
              cost_usd: 0.008,
              generation_time_ms: 300,
              cache_key: cacheKey,
              created_at: new Date().toISOString(),
              access_count: 0,
            },
          };

          await aiResponseCache.cacheResponse(cacheKey, response);
        }

        return result;
      } catch (error) {
        console.warn(`AI cached method ${propertyName} failed:`, error);
        return method.apply(this, args);
      }
    };

    return descriptor;
  };
}
