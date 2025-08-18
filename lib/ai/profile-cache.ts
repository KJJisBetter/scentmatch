import {
  AIProfileGenerator,
  type ExperienceLevel,
} from './ai-profile-generator';

interface CacheEntry {
  profile: any;
  timestamp: number;
  source: 'cache' | 'template' | 'ai';
  hits?: number;
}

interface CacheResult {
  profile: any;
  source: 'cache' | 'template' | 'ai';
  fromCache: boolean;
}

/**
 * 3-Tier Profile Caching System
 *
 * Implements cache → template → AI fallback hierarchy for optimal
 * performance and cost optimization:
 *
 * Tier 1: In-memory cache (instant, 24-hour expiration)
 * Tier 2: Template-based generation (fast, ~50ms)
 * Tier 3: AI generation (slower, ~2-5s, highest quality)
 */
export class ProfileCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 1000; // LRU limit
  private readonly AI_TIMEOUT = 2000; // 2 second timeout for AI (faster fallback)
  private generator: AIProfileGenerator;

  constructor() {
    this.generator = new AIProfileGenerator();

    // Set up periodic cache cleanup
    setInterval(() => this.cleanupExpiredEntries(), 60 * 60 * 1000); // Every hour
  }

  /**
   * Get or generate profile using 3-tier system
   */
  async getOrGenerateProfile(
    profileKey: string,
    profileData: any
  ): Promise<CacheResult> {
    // Tier 1: Check cache
    const cached = this.getFromCache(profileKey);
    if (cached) {
      return {
        profile: cached.profile,
        source: 'cache',
        fromCache: true,
      };
    }

    try {
      // Tier 3: Try AI generation with timeout
      const aiProfile = (await Promise.race([
        this.generator.generateUniqueProfile(
          profileData,
          this.getAllCachedNames()
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI timeout')), this.AI_TIMEOUT)
        ),
      ])) as any;

      // Cache successful AI result
      this.setInCache(profileKey, {
        profile: aiProfile,
        timestamp: Date.now(),
        source: 'ai',
      });

      return {
        profile: aiProfile,
        source: 'ai',
        fromCache: false,
      };
    } catch (error) {
      console.warn('AI generation failed, falling back to template:', error);

      // Tier 2: Template fallback
      const templateProfile = await this.generateTemplateProfile(profileData);

      // Cache template result (shorter duration)
      this.setInCache(profileKey, {
        profile: templateProfile,
        timestamp: Date.now(),
        source: 'template',
      });

      return {
        profile: templateProfile,
        source: 'template',
        fromCache: false,
      };
    }
  }

  /**
   * Get profile from cache if valid and not expired
   */
  private getFromCache(key: string): CacheEntry | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check expiration
    const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hits = (entry.hits || 0) + 1;

    return entry;
  }

  /**
   * Set entry in cache with LRU eviction
   */
  private setInCache(key: string, entry: CacheEntry): void {
    // LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, entry);
  }

  /**
   * Generate template-based profile (Tier 2 fallback)
   */
  private async generateTemplateProfile(profileData: any): Promise<any> {
    const { experience_level, personality_type, dimensions } = profileData;

    // Generate name using non-AI method
    const profileName = this.generator.generateUniqueProfileName(profileData);

    // Generate style descriptor
    const styleDescriptor = this.generateTemplateStyleDescriptor(
      experience_level,
      dimensions
    );

    // Use template description
    const description = this.generateTemplateDescription(
      profileName,
      experience_level,
      personality_type,
      dimensions,
      profileData.selected_favorites || []
    );

    return {
      profile_name: profileName,
      style_descriptor: styleDescriptor,
      description,
      uniqueness_score: this.generator.calculateUniquenessScore({
        profile_name: profileName,
        style_descriptor: styleDescriptor,
        experience_level,
      }),
      experience_context: experience_level,
      generation_method: 'template',
      personality_insights: this.extractTemplateInsights(profileData),
      seasonal_preferences: profileData.seasonal_preferences || [],
    };
  }

  /**
   * Generate template-based style descriptor
   */
  private generateTemplateStyleDescriptor(
    experienceLevel: ExperienceLevel,
    dimensions: Record<string, number>
  ): string {
    const descriptorSets = {
      beginner: ['approachable', 'delightful', 'charming', 'sweet'],
      enthusiast: ['sophisticated', 'refined', 'elegant', 'balanced'],
      collector: ['masterful', 'distinguished', 'avant-garde', 'exquisite'],
    };

    const descriptors = descriptorSets[experienceLevel];
    return descriptors[Math.floor(Math.random() * descriptors.length)];
  }

  /**
   * Generate template-based description
   */
  private generateTemplateDescription(
    profileName: string,
    experienceLevel: ExperienceLevel,
    personalityType: string,
    dimensions: Record<string, number>,
    selectedFavorites: Array<{ id: string; name: string; brand: string }>
  ): string {
    const dominantDim = Object.entries(dimensions).reduce((a, b) =>
      dimensions[a[0]] > dimensions[b[0]] ? a : b
    )[0];

    // Base templates by experience and dimension
    const templates = {
      beginner: {
        fresh: `You are the ${profileName}, someone who is drawn to fresh, clean scents that make you feel confident and energized. Your approach to fragrance is intuitive and joyful.`,
        floral: `You are the ${profileName}, attracted to beautiful floral fragrances that enhance your natural femininity and grace. Your style celebrates romantic elegance.`,
        woody: `You are the ${profileName}, who finds comfort in warm, grounding woody scents that reflect your authentic, down-to-earth nature.`,
      },
      enthusiast: {
        fresh: `You are the ${profileName}, a fragrance enthusiast with a refined appreciation for fresh, sophisticated compositions that balance complexity with pure elegance.`,
        floral: `You are the ${profileName}, an enthusiast who has developed sophisticated taste for floral masterpieces that blend classic beauty with modern artistry.`,
        woody: `You are the ${profileName}, a knowledgeable enthusiast who appreciates the craftsmanship and grounding sophistication of exceptional woody fragrances.`,
      },
      collector: {
        fresh: `You are the ${profileName}, a sophisticated collector whose expertise in fresh compositions spans from classic masterpieces to avant-garde innovations.`,
        floral: `You are the ${profileName}, a master collector with deep knowledge of floral perfumery, from vintage treasures to revolutionary modern interpretations.`,
        woody: `You are the ${profileName}, an expert collector whose profound understanding encompasses traditional woody artistry and cutting-edge innovations.`,
      },
    };

    const baseTemplate =
      templates[experienceLevel][
        dominantDim as keyof (typeof templates)[typeof experienceLevel]
      ] || templates[experienceLevel].fresh;

    // Add lifestyle paragraph
    const lifestyleParagraph = this.generateLifestyleParagraph(
      experienceLevel,
      dominantDim,
      selectedFavorites
    );

    // Add discovery paragraph
    const discoveryParagraph = this.generateDiscoveryParagraph(
      experienceLevel,
      dominantDim
    );

    return [baseTemplate, lifestyleParagraph, discoveryParagraph].join('\n\n');
  }

  /**
   * Generate lifestyle integration paragraph
   */
  private generateLifestyleParagraph(
    experienceLevel: ExperienceLevel,
    dominantDim: string,
    selectedFavorites: Array<{ id: string; name: string; brand: string }>
  ): string {
    const lifestyleTemplates = {
      beginner: `Your fragrance choices reflect your developing personal style and growing confidence. You're learning to choose scents that make you feel your best and complement your daily activities.`,
      enthusiast: `Your fragrance wardrobe reflects thoughtful curation and an understanding of how scent enhances different aspects of your life. You appreciate both signature scents and seasonal rotations.`,
      collector: `Your collection represents a carefully curated library of olfactory experiences, each piece selected for its artistry, uniqueness, and place in the broader story of your fragrance journey.`,
    };

    let paragraph = lifestyleTemplates[experienceLevel];

    // Add favorites reference for advanced users
    if (selectedFavorites.length > 0 && experienceLevel !== 'beginner') {
      const favoritesBrands = selectedFavorites.map(f => f.brand);
      const uniqueBrands = [...new Set(favoritesBrands)];

      if (uniqueBrands.length > 0) {
        paragraph += ` Your appreciation for ${uniqueBrands.join(' and ')} demonstrates your refined taste and quality standards.`;
      }
    }

    return paragraph;
  }

  /**
   * Generate discovery potential paragraph
   */
  private generateDiscoveryParagraph(
    experienceLevel: ExperienceLevel,
    dominantDim: string
  ): string {
    const discoveryTemplates = {
      beginner: `As you continue exploring, you'll discover fragrances that perfectly capture your unique spirit and style. Your growing understanding will lead you to scents that feel like perfect extensions of yourself.`,
      enthusiast: `Your journey continues toward discovering exceptional fragrances that challenge and inspire while honoring your established preferences. You seek the perfect balance between familiar comfort and exciting discovery.`,
      collector: `Your pursuit centers on discovering rare and exceptional pieces that represent the highest levels of artistry and innovation. You seek fragrances that push boundaries and showcase the evolution of perfumery as an art form.`,
    };

    return discoveryTemplates[experienceLevel];
  }

  /**
   * Extract template-based insights
   */
  private extractTemplateInsights(profileData: any): string[] {
    const insights: string[] = [];
    const { experience_level, dimensions, occasion_preferences } = profileData;

    // Experience level insight
    const experienceInsights = {
      beginner: 'exploring fragrance for the first time',
      enthusiast: 'developing sophisticated fragrance preferences',
      collector: 'possesses expert-level fragrance knowledge',
    };
    insights.push(experienceInsights[experience_level]);

    // Top dimension insight
    const topDimension = Object.entries(dimensions).reduce((a, b) =>
      dimensions[a[0]] > dimensions[b[0]] ? a : b
    )[0];

    const dimensionInsights = {
      fresh: 'prefers clean, energizing scents',
      floral: 'loves romantic, feminine fragrances',
      oriental: 'drawn to mysterious, exotic compositions',
      woody: 'appreciates grounding, natural scents',
      fruity: 'enjoys vibrant, joyful fragrances',
      gourmand: 'attracted to comforting, sweet scents',
    };
    insights.push(
      dimensionInsights[topDimension as keyof typeof dimensionInsights]
    );

    return insights;
  }

  /**
   * LRU eviction when cache is full
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get all cached profile names for uniqueness checking
   */
  private getAllCachedNames(): string[] {
    const names: string[] = [];

    for (const entry of this.cache.values()) {
      if (entry.profile?.profile_name) {
        names.push(entry.profile.profile_name);
      }
    }

    return names;
  }

  /**
   * Utility methods for testing and debugging
   */
  public getCacheStats() {
    const now = Date.now();
    let expired = 0;
    let totalHits = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        expired++;
      }
      totalHits += entry.hits || 0;
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries: expired,
      totalHits,
      hitRate: totalHits / Math.max(this.cache.size, 1),
    };
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  public set(key: string, entry: CacheEntry): void {
    this.setInCache(key, entry);
  }
}
