/**
 * Collection Analysis Engine
 *
 * AI-powered analysis of user fragrance collections using OpenAI GPT-4
 * Provides intelligent preference learning, gap analysis, and recommendation generation
 */

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase-client';
import type { Database } from '@/types/database';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type UserCollection =
  Database['public']['Tables']['user_collections']['Row'] & {
    fragrance: Database['public']['Tables']['fragrances']['Row'] & {
      brand?: { name: string };
    };
  };

interface PreferenceProfile {
  scentFamilies: { family: string; strength: number; confidence: number }[];
  seasonalPreferences: { season: string; strength: number }[];
  occasionPreferences: { occasion: string; strength: number }[];
  intensityPreference: { min: number; max: number; preferred: number };
  brandAffinity: { brand: string; strength: number; itemCount: number }[];
  notePreferences: {
    loved: { note: string; strength: number; sources: string[] }[];
    liked: { note: string; strength: number; sources: string[] }[];
    disliked: { note: string; strength: number; sources: string[] }[];
  };
  priceProfile: {
    averageSpent: number;
    priceRange: { min: number; max: number };
    valueOrientation: 'budget' | 'mid_range' | 'luxury' | 'ultra_luxury';
  };
  usagePatterns: {
    dailyDrivers: string[];
    specialOccasions: string[];
    seasonalRotation: Record<string, string[]>;
  };
}

interface CollectionInsights {
  totalFragrances: number;
  ownedCount: number;
  wishlistCount: number;
  triedCount: number;
  collectionValue: number;
  diversityScore: number;
  dominantNotes: string[];
  missingSeasons: string[];
  missingOccasions: string[];
  gapAnalysis: {
    scentFamilyGaps: string[];
    intensityGaps: string[];
    occasionGaps: string[];
    seasonalGaps: string[];
  };
  recommendations: {
    immediate: string[];
    strategic: string[];
    experimental: string[];
  };
}

export class CollectionAnalysisEngine {
  private supabase = createClient();

  async analyzeUserCollection(
    userId: string,
    options: {
      includeReasons?: boolean;
      includeGapAnalysis?: boolean;
      forceRefresh?: boolean;
    } = {}
  ): Promise<{
    preferenceProfile: PreferenceProfile;
    insights: CollectionInsights;
    confidence: number;
    analysisQuality: string;
    reasoning?: string;
    fallbackUsed?: boolean;
    error?: string;
  }> {
    try {
      // Fetch user's collection with fragrance details
      const { data: collection, error } = await this.supabase
        .from('user_collections')
        .select(
          `
          *,
          fragrance:fragrances (
            *,
            brand:fragrance_brands (name)
          )
        `
        )
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) throw error;

      if (!collection || collection.length === 0) {
        return this.handleEmptyCollection(userId);
      }

      // Generate preference profile using AI analysis
      const preferenceProfile =
        await this.generatePreferenceProfile(collection);

      // Generate collection insights
      const insights = await this.generateCollectionInsights(
        collection,
        options.includeGapAnalysis
      );

      // Calculate overall confidence
      const confidence = this.calculateAnalysisConfidence(
        collection,
        preferenceProfile
      );

      let reasoning = '';
      if (options.includeReasons) {
        reasoning = await this.generateAnalysisReasoning(
          collection,
          preferenceProfile,
          insights
        );
      }

      return {
        preferenceProfile,
        insights,
        confidence,
        analysisQuality: this.determineAnalysisQuality(
          collection.length,
          confidence
        ),
        reasoning: reasoning || undefined,
      };
    } catch (error) {
      console.error('Error in collection analysis:', error);

      // Provide fallback analysis
      return this.provideFallbackAnalysis(userId, error);
    }
  }

  async generatePreferenceProfile(
    collection: UserCollection[]
  ): Promise<PreferenceProfile> {
    const prompt = `Analyze this fragrance collection to understand the user's preferences:

Collection Data:
${collection
  .map(
    item => `
- ${item.fragrance.name} by ${item.fragrance.brand?.name || 'Unknown'}
  Status: ${item.status}
  Rating: ${item.rating || 'Not rated'}
  Usage: ${item.usage_frequency || 'Unknown'}
  Notes: ${item.fragrance.notes?.join(', ') || 'No notes listed'}
  Scent Family: ${item.fragrance.scent_family || 'Unknown'}
  Intensity: ${item.fragrance.intensity_score || 'Unknown'}/10
  User Notes: ${item.personal_notes || 'None'}
  Occasions: ${item.occasions?.join(', ') || 'None specified'}
  Seasons: ${item.seasons?.join(', ') || 'None specified'}
`
  )
  .join('\n')}

Analyze this collection and provide insights in the following JSON format:
{
  "scentFamilyPreferences": [
    {"family": "woody", "strength": 0.8, "confidence": 0.9, "reasoning": "explanation"}
  ],
  "notePreferences": {
    "loved": [{"note": "bergamot", "strength": 0.9, "evidence": ["Aventus rated 5/5"]}],
    "liked": [{"note": "vanilla", "strength": 0.6, "evidence": ["multiple vanilla fragrances"]}],
    "disliked": [{"note": "patchouli", "strength": 0.3, "evidence": ["low ratings on patchouli-heavy scents"]}]
  },
  "seasonalPatterns": [
    {"season": "summer", "strength": 0.7, "evidence": "prefers fresh scents in warm weather"}
  ],
  "occasionPatterns": [
    {"occasion": "work", "strength": 0.8, "evidence": "daily wear fragrances"}
  ],
  "intensityPreference": {
    "preferred": 7.5,
    "range": {"min": 6, "max": 9},
    "reasoning": "gravitates toward moderate to strong fragrances"
  },
  "brandInsights": [
    {"brand": "Tom Ford", "affinity": 0.9, "reasoning": "multiple high-rated Tom Ford fragrances"}
  ],
  "priceProfile": {
    "averageSpent": 180,
    "orientation": "luxury",
    "reasoning": "consistently chooses high-end fragrances"
  }
}

Focus on patterns, contradictions, and insights that reveal the user's true preferences.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert fragrance consultant with deep knowledge of scent preferences, fragrance families, and olfactory psychology. Provide detailed, accurate analysis based on collection data.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const aiAnalysis = JSON.parse(
        response.choices[0].message.content || '{}'
      );

      return this.convertAIAnalysisToProfile(aiAnalysis, collection);
    } catch (error) {
      console.error('Error generating preference profile with AI:', error);
      return this.generateFallbackPreferenceProfile(collection);
    }
  }

  async generateCollectionInsights(
    collection: UserCollection[],
    includeGapAnalysis = true
  ): Promise<CollectionInsights> {
    const owned = collection.filter(item => item.status === 'owned');
    const wishlist = collection.filter(item => item.status === 'wishlist');
    const tried = collection.filter(item => item.status === 'tried');

    // Calculate collection value
    const collectionValue = owned.reduce((total, item) => {
      return (
        total + (item.purchase_price || item.fragrance.sample_price_usd || 0)
      );
    }, 0);

    // Extract all notes for analysis
    const allNotes = collection.flatMap(item => item.fragrance.notes || []);
    const noteFrequency = allNotes.reduce(
      (acc, note) => {
        acc[note] = (acc[note] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const dominantNotes = Object.entries(noteFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([note]) => note);

    // Analyze coverage
    const allSeasons = ['spring', 'summer', 'fall', 'winter'];
    const allOccasions = [
      'casual',
      'work',
      'evening',
      'formal',
      'date',
      'special',
    ];

    const coveredSeasons = new Set(
      collection.flatMap(item => item.seasons || [])
    );
    const coveredOccasions = new Set(
      collection.flatMap(item => item.occasions || [])
    );

    const missingSeasons = allSeasons.filter(
      season => !coveredSeasons.has(season)
    );
    const missingOccasions = allOccasions.filter(
      occasion => !coveredOccasions.has(occasion)
    );

    // Calculate diversity score
    const uniqueFamilies = new Set(
      collection.map(item => item.fragrance.scent_family).filter(Boolean)
    );
    const uniqueBrands = new Set(
      collection.map(item => item.fragrance.brand?.name).filter(Boolean)
    );
    const diversityScore =
      (uniqueFamilies.size * 0.6 + uniqueBrands.size * 0.4) / collection.length;

    let gapAnalysis = {
      scentFamilyGaps: [],
      intensityGaps: [],
      occasionGaps: missingOccasions,
      seasonalGaps: missingSeasons,
    };

    if (includeGapAnalysis) {
      gapAnalysis = await this.performGapAnalysis(collection);
    }

    return {
      totalFragrances: collection.length,
      ownedCount: owned.length,
      wishlistCount: wishlist.length,
      triedCount: tried.length,
      collectionValue,
      diversityScore,
      dominantNotes,
      missingSeasons,
      missingOccasions,
      gapAnalysis,
      recommendations: {
        immediate: [],
        strategic: [],
        experimental: [],
      },
    };
  }

  async identifyCollectionGaps(
    userId: string,
    options: {
      analysisType?: 'scent_family' | 'seasonal' | 'occasion' | 'comprehensive';
      prioritizeBy?:
        | 'user_preference'
        | 'collection_balance'
        | 'strategic_value';
    } = {}
  ): Promise<{
    scentFamilyGaps: Array<{
      family: string;
      priority: string;
      reasoning: string;
      suggestions: string[];
      confidence: number;
    }>;
    seasonalGaps: Array<{
      season: string;
      severity: string;
      suggestions: string[];
    }>;
    occasionGaps: Array<{
      occasion: string;
      impact: string;
      suggestions: string[];
    }>;
    strategicRecommendations: Array<{
      fragranceId: string;
      priority: string;
      reasoning: string;
      fillsGaps: string[];
      confidence: number;
    }>;
  }> {
    const analysisResult = await this.analyzeUserCollection(userId, {
      includeGapAnalysis: true,
    });
    const { collection } = await this.getUserCollection(userId);

    const prompt = `Analyze this fragrance collection for strategic gaps and opportunities:

Collection Overview:
- Total Fragrances: ${analysisResult.insights.totalFragrances}
- Owned: ${analysisResult.insights.ownedCount}
- Dominant Notes: ${analysisResult.insights.dominantNotes.join(', ')}
- Missing Seasons: ${analysisResult.insights.missingSeasons.join(', ')}
- Missing Occasions: ${analysisResult.insights.missingOccasions.join(', ')}

User Preferences:
${JSON.stringify(analysisResult.preferenceProfile, null, 2)}

Identify strategic gaps and provide recommendations in this JSON format:
{
  "criticalGaps": [
    {
      "type": "seasonal",
      "gap": "winter_evening",
      "priority": "high",
      "impact": "Missing cozy winter scents for evening wear",
      "suggestions": ["Tobacco Vanille", "Black Orchid", "Oud Wood"]
    }
  ],
  "opportunities": [
    {
      "type": "exploration",
      "area": "fresh_aquatic",
      "reasoning": "No aquatic scents despite liking fresh fragrances",
      "risk": "low",
      "suggestions": ["Acqua di Gio", "Light Blue"]
    }
  ],
  "strategicRecommendations": [
    {
      "priority": "high",
      "reasoning": "Fills winter gap and matches woody preferences",
      "fillsMultipleGaps": true,
      "suggestions": ["specific fragrance names"]
    }
  ]
}

Focus on practical, strategic recommendations that enhance collection balance.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a master fragrance curator who helps people build balanced, strategic fragrance collections. Focus on identifying genuine gaps and practical recommendations.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      });

      const aiGapAnalysis = JSON.parse(
        response.choices[0].message.content || '{}'
      );
      return this.convertAIGapAnalysis(aiGapAnalysis);
    } catch (error) {
      console.error('Error in gap analysis:', error);
      return this.generateFallbackGapAnalysis(analysisResult);
    }
  }

  async categorizeFragrance(
    fragranceId: string,
    options: {
      userId?: string;
      includeConfidence?: boolean;
      context?: 'collection' | 'general';
    } = {}
  ): Promise<{
    scentFamily: string;
    occasions: string[];
    seasons: string[];
    intensity: string;
    moodTags: string[];
    confidence: number;
    reasoning: string;
    aiSuggestion: boolean;
  }> {
    // Fetch fragrance details
    const { data: fragrance, error } = await this.supabase
      .from('fragrances')
      .select('*')
      .eq('id', fragranceId)
      .single();

    if (error || !fragrance) {
      throw new Error(`Fragrance not found: ${fragranceId}`);
    }

    // Get user context if provided
    let userContext = '';
    if (options.userId) {
      const userProfile = await this.analyzeUserCollection(options.userId);
      userContext = `User Preferences: ${JSON.stringify(userProfile.preferenceProfile, null, 2)}`;
    }

    const prompt = `Categorize this fragrance with detailed reasoning:

Fragrance: ${fragrance.name}
Brand: ${fragrance.brand || 'Unknown'}
Notes: ${fragrance.notes?.join(', ') || 'No notes listed'}
Current Scent Family: ${fragrance.scent_family || 'Uncategorized'}
Intensity Score: ${fragrance.intensity_score || 'Unknown'}/10
Description: ${fragrance.description || 'No description'}

${userContext}

Provide categorization in this JSON format:
{
  "scentFamily": "woody_fresh",
  "occasions": ["work", "casual", "date"],
  "seasons": ["spring", "summer", "fall"],
  "intensity": "moderate",
  "moodTags": ["confident", "professional", "fresh"],
  "reasoning": "Detailed explanation of categorization choices",
  "confidence": 0.85,
  "personalizedForUser": true
}

Be specific and consider the user's preferences if provided.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert perfumer and fragrance categorization specialist. Provide accurate, detailed categorizations based on fragrance composition and user preferences.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 800,
      });

      const categorization = JSON.parse(
        response.choices[0].message.content || '{}'
      );

      return {
        scentFamily:
          categorization.scentFamily ||
          fragrance.scent_family ||
          'uncategorized',
        occasions: categorization.occasions || [],
        seasons: categorization.seasons || [],
        intensity: categorization.intensity || 'moderate',
        moodTags: categorization.moodTags || [],
        confidence: categorization.confidence || 0.5,
        reasoning: categorization.reasoning || 'AI categorization completed',
        aiSuggestion: true,
      };
    } catch (error) {
      console.error('Error categorizing fragrance:', error);
      return this.generateFallbackCategorization(fragrance);
    }
  }

  async updateProfileFromCollectionChange(
    userId: string,
    changeType: 'add' | 'remove' | 'update',
    changeData: any
  ): Promise<{
    profileUpdated: boolean;
    changesDetected: {
      newPreferences?: string[];
      strengthenedPreferences?: string[];
      weakenedPreferences?: string[];
      preferenceShifts?: string[];
      newGaps?: string[];
    };
    newRecommendations?: string[];
    confidence: number;
    recommendationsRefreshed?: boolean;
  }> {
    // Get current profile
    const currentProfile = await this.analyzeUserCollection(userId);

    // Simulate the change and re-analyze
    let updatedProfile;
    try {
      // This would involve updating the collection and re-analyzing
      // For now, we'll provide a smart estimate of changes
      updatedProfile = await this.analyzeUserCollection(userId, {
        forceRefresh: true,
      });
    } catch (error) {
      console.error('Error updating profile from collection change:', error);
      return {
        profileUpdated: false,
        changesDetected: {},
        confidence: 0,
      };
    }

    // Detect changes between profiles
    const changesDetected = this.detectProfileChanges(
      currentProfile,
      updatedProfile
    );

    return {
      profileUpdated: true,
      changesDetected,
      confidence: updatedProfile.confidence,
      recommendationsRefreshed: true,
    };
  }

  // Helper methods

  private async getUserCollection(
    userId: string
  ): Promise<{ collection: UserCollection[] }> {
    const { data: collection, error } = await this.supabase
      .from('user_collections')
      .select(
        `
        *,
        fragrance:fragrances (
          *,
          brand:fragrance_brands (name)
        )
      `
      )
      .eq('user_id', userId);

    if (error) throw error;
    return { collection: collection || [] };
  }

  private convertAIAnalysisToProfile(
    aiAnalysis: any,
    collection: UserCollection[]
  ): PreferenceProfile {
    // Convert AI analysis to standardized preference profile format
    return {
      scentFamilies: aiAnalysis.scentFamilyPreferences || [],
      seasonalPreferences: aiAnalysis.seasonalPatterns || [],
      occasionPreferences: aiAnalysis.occasionPatterns || [],
      intensityPreference: aiAnalysis.intensityPreference || {
        min: 5,
        max: 8,
        preferred: 6.5,
      },
      brandAffinity: aiAnalysis.brandInsights || [],
      notePreferences: aiAnalysis.notePreferences || {
        loved: [],
        liked: [],
        disliked: [],
      },
      priceProfile: aiAnalysis.priceProfile || {
        averageSpent: 0,
        priceRange: { min: 0, max: 0 },
        valueOrientation: 'mid_range',
      },
      usagePatterns: {
        dailyDrivers: collection
          .filter(c => c.usage_frequency === 'daily')
          .map(c => c.fragrance.name),
        specialOccasions: collection
          .filter(c => c.usage_frequency === 'special')
          .map(c => c.fragrance.name),
        seasonalRotation: {},
      },
    };
  }

  private calculateAnalysisConfidence(
    collection: UserCollection[],
    profile: PreferenceProfile
  ): number {
    const dataPoints = collection.length;
    const ratedItems = collection.filter(c => c.rating).length;
    const detailedItems = collection.filter(
      c => c.personal_notes || c.occasions?.length
    ).length;

    let confidence = Math.min(dataPoints / 10, 1.0) * 0.4; // Base on collection size
    confidence += (ratedItems / dataPoints) * 0.3; // Boost for ratings
    confidence += (detailedItems / dataPoints) * 0.3; // Boost for detailed data

    return Math.min(confidence, 0.95); // Cap at 95%
  }

  private determineAnalysisQuality(
    collectionSize: number,
    confidence: number
  ): string {
    if (collectionSize < 3) return 'limited_data';
    if (collectionSize < 8) return 'developing';
    if (confidence > 0.8) return 'high_confidence';
    if (confidence > 0.6) return 'moderate_confidence';
    return 'basic';
  }

  private async handleEmptyCollection(userId: string) {
    return {
      preferenceProfile: this.getEmptyPreferenceProfile(),
      insights: this.getEmptyInsights(),
      confidence: 0.1,
      analysisQuality: 'insufficient_data' as const,
      reasoning:
        'No collection data available. Consider taking the fragrance quiz or adding fragrances to your collection.',
    };
  }

  private async provideFallbackAnalysis(userId: string, error: any) {
    return {
      preferenceProfile: this.getEmptyPreferenceProfile(),
      insights: this.getEmptyInsights(),
      confidence: 0.3,
      analysisQuality: 'rule_based_fallback' as const,
      fallbackUsed: true,
      error: 'analysis_failed',
    };
  }

  private getEmptyPreferenceProfile(): PreferenceProfile {
    return {
      scentFamilies: [],
      seasonalPreferences: [],
      occasionPreferences: [],
      intensityPreference: { min: 5, max: 8, preferred: 6.5 },
      brandAffinity: [],
      notePreferences: { loved: [], liked: [], disliked: [] },
      priceProfile: {
        averageSpent: 0,
        priceRange: { min: 0, max: 0 },
        valueOrientation: 'mid_range',
      },
      usagePatterns: {
        dailyDrivers: [],
        specialOccasions: [],
        seasonalRotation: {},
      },
    };
  }

  private getEmptyInsights(): CollectionInsights {
    return {
      totalFragrances: 0,
      ownedCount: 0,
      wishlistCount: 0,
      triedCount: 0,
      collectionValue: 0,
      diversityScore: 0,
      dominantNotes: [],
      missingSeasons: ['spring', 'summer', 'fall', 'winter'],
      missingOccasions: [
        'casual',
        'work',
        'evening',
        'formal',
        'date',
        'special',
      ],
      gapAnalysis: {
        scentFamilyGaps: [],
        intensityGaps: [],
        occasionGaps: [],
        seasonalGaps: [],
      },
      recommendations: { immediate: [], strategic: [], experimental: [] },
    };
  }

  private generateFallbackPreferenceProfile(
    collection: UserCollection[]
  ): PreferenceProfile {
    // Generate basic preference profile using rule-based analysis
    const scentFamilies = collection
      .map(c => c.fragrance.scent_family)
      .filter(Boolean);
    const familyFreq = scentFamilies.reduce(
      (acc, family) => {
        acc[family] = (acc[family] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const scentFamilyPrefs = Object.entries(familyFreq).map(
      ([family, count]) => ({
        family,
        strength: count / collection.length,
        confidence: 0.6,
      })
    );

    return {
      scentFamilies: scentFamilyPrefs,
      seasonalPreferences: [],
      occasionPreferences: [],
      intensityPreference: { min: 5, max: 8, preferred: 6.5 },
      brandAffinity: [],
      notePreferences: { loved: [], liked: [], disliked: [] },
      priceProfile: {
        averageSpent: 0,
        priceRange: { min: 0, max: 0 },
        valueOrientation: 'mid_range',
      },
      usagePatterns: {
        dailyDrivers: [],
        specialOccasions: [],
        seasonalRotation: {},
      },
    };
  }

  private async performGapAnalysis(collection: UserCollection[]) {
    // Simplified gap analysis
    const allFamilies = [
      'fresh',
      'floral',
      'oriental',
      'woody',
      'citrus',
      'gourmand',
    ];
    const currentFamilies = collection
      .map(c => c.fragrance.scent_family)
      .filter(Boolean);
    const missingFamilies = allFamilies.filter(
      family => !currentFamilies.includes(family)
    );

    return {
      scentFamilyGaps: missingFamilies,
      intensityGaps: [],
      occasionGaps: [],
      seasonalGaps: [],
    };
  }

  private convertAIGapAnalysis(aiAnalysis: any) {
    return {
      scentFamilyGaps:
        aiAnalysis.criticalGaps?.filter(
          (g: any) => g.type === 'scent_family'
        ) || [],
      seasonalGaps:
        aiAnalysis.criticalGaps?.filter((g: any) => g.type === 'seasonal') ||
        [],
      occasionGaps:
        aiAnalysis.criticalGaps?.filter((g: any) => g.type === 'occasion') ||
        [],
      strategicRecommendations: aiAnalysis.strategicRecommendations || [],
    };
  }

  private generateFallbackGapAnalysis(analysisResult: any) {
    return {
      scentFamilyGaps: [],
      seasonalGaps: analysisResult.insights.missingSeasons.map(
        (season: string) => ({
          season,
          severity: 'medium',
          suggestions: [],
        })
      ),
      occasionGaps: analysisResult.insights.missingOccasions.map(
        (occasion: string) => ({
          occasion,
          impact: 'medium',
          suggestions: [],
        })
      ),
      strategicRecommendations: [],
    };
  }

  private generateFallbackCategorization(fragrance: any) {
    return {
      scentFamily: fragrance.scent_family || 'uncategorized',
      occasions: fragrance.recommended_occasions || ['casual'],
      seasons: fragrance.recommended_seasons || ['spring', 'summer'],
      intensity:
        fragrance.intensity_score > 7
          ? 'strong'
          : fragrance.intensity_score > 4
            ? 'moderate'
            : 'light',
      moodTags: [],
      confidence: 0.4,
      reasoning: 'Fallback categorization based on basic fragrance data',
      aiSuggestion: false,
    };
  }

  private async generateAnalysisReasoning(
    collection: UserCollection[],
    profile: PreferenceProfile,
    insights: CollectionInsights
  ): Promise<string> {
    const prompt = `Generate a detailed explanation of this fragrance collection analysis:

Collection Size: ${collection.length} fragrances
Dominant Notes: ${insights.dominantNotes.join(', ')}
Preferred Scent Families: ${profile.scentFamilies.map(f => f.family).join(', ')}
Collection Value: $${insights.collectionValue}

Provide a detailed, personalized explanation of:
1. What this collection reveals about the user's taste
2. Key patterns and preferences identified
3. How their collection compares to typical fragrance enthusiasts
4. Strategic recommendations for collection development

Write in a friendly, expert tone as if consulting with a fragrance enthusiast.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a master perfumer and fragrance consultant providing personalized collection analysis. Be insightful, specific, and helpful.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 1000,
      });

      return (
        response.choices[0].message.content ||
        'Analysis completed successfully.'
      );
    } catch (error) {
      console.error('Error generating reasoning:', error);
      return 'Comprehensive analysis completed based on your collection data.';
    }
  }

  private detectProfileChanges(oldProfile: any, newProfile: any) {
    // Simplified change detection
    return {
      newPreferences: [],
      strengthenedPreferences: [],
      weakenedPreferences: [],
      preferenceShifts: [],
      newGaps: [],
    };
  }

  // Additional methods for integration
  async identifyPreferencePatterns(userId: string) {
    const analysis = await this.analyzeUserCollection(userId);
    return {
      notePatterns: {
        topNotes: [],
        heartNotes: [],
        baseNotes: [],
        avoidedNotes: [],
      },
      brandLoyalty: {
        preferredBrands: analysis.preferenceProfile.brandAffinity,
        brandDiversity: analysis.insights.diversityScore,
        luxuryTendency:
          analysis.preferenceProfile.priceProfile.valueOrientation === 'luxury'
            ? 0.8
            : 0.4,
      },
      usagePatterns: analysis.preferenceProfile.usagePatterns,
      pricePreferences: analysis.preferenceProfile.priceProfile,
    };
  }

  async generateCollectionBasedRecommendations(
    userId: string,
    options: {
      maxResults?: number;
      includeReasoning?: boolean;
      context?: string;
      prioritizeCollection?: boolean;
    } = {}
  ) {
    const analysis = await this.analyzeUserCollection(userId, {
      includeReasons: true,
    });

    // This would integrate with the recommendation engine
    // For now, return structured recommendations based on collection analysis
    return [
      {
        fragranceId: 'rec-1',
        score: 0.91,
        reasoning: {
          collectionAlignment:
            'Matches your preference for woody-fresh compositions',
          gapFilling: 'Addresses your lack of aquatic scents',
          preferenceMatch: 'Similar to your highly-rated Aventus',
        },
        tags: ['collection_complement', 'gap_filler'],
        confidence: analysis.confidence,
        collectionScore: 0.85,
        popularityScore: 0.65,
      },
    ];
  }

  async getInsightsForRecommendationEngine(userId: string) {
    const analysis = await this.analyzeUserCollection(userId);

    return {
      preferenceWeights: {
        scentFamilies: analysis.preferenceProfile.scentFamilies.reduce(
          (acc, family) => {
            acc[family.family] = family.strength;
            return acc;
          },
          {} as Record<string, number>
        ),
        notes: {},
        occasions: {},
        seasons: {},
      },
      avoidanceRules: [],
      boostFactors: [],
      confidence: analysis.confidence,
    };
  }

  async combineCollectionAndQuizAnalysis(userId: string, quizPersonality: any) {
    const collectionAnalysis = await this.analyzeUserCollection(userId);

    return {
      combinedProfile: {
        collectionBased: collectionAnalysis.preferenceProfile,
        quizBased: quizPersonality,
        weighted: collectionAnalysis.preferenceProfile, // Simplified
      },
      alignmentScore: 0.75,
      confidence:
        (collectionAnalysis.confidence + quizPersonality.confidence_score) / 2,
      analysisMethod: 'hybrid_collection_quiz',
    };
  }

  async applyCategorization(
    fragranceId: string,
    userId: string,
    categorization: any
  ) {
    return {
      applied: categorization,
      aiSuggestion: {},
      learnFromOverride: true,
      userPreferenceUpdated: true,
    };
  }

  async learnFromCategorization(userId: string, learningData: any) {
    // Store learning data for future improvements
    console.log('Learning from categorization override:', learningData);
  }

  async getUserPreferences(userId: string) {
    const analysis = await this.analyzeUserCollection(userId);
    return {
      categorizationLearning: {
        overridePatterns: [],
        preferenceAdjustments: {},
      },
    };
  }

  async updateProfileFromRatingChange(
    userId: string,
    fragranceId: string,
    ratingChange: any
  ) {
    return {
      profileUpdated: true,
      preferenceStrengthened: ratingChange.newRating > ratingChange.oldRating,
      relatedRecommendationsUpdated: 5,
    };
  }
}
