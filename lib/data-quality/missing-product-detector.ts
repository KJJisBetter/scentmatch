/**
 * Missing Product Intelligence System
 * Handles searches for products not in database with intelligent alternatives
 * Addresses Linear issue SCE-50: "Coach For Men" not found destroys trust
 */

import { createServerSupabase } from '@/lib/supabase/server';
import { FragranceNormalizer } from './fragrance-normalizer';

export interface AlternativeSuggestion {
  fragrance_id: string;
  name: string;
  brand: string;
  similarity_score: number;
  match_reason: string;
  image_url?: string;
}

export interface MissingProductResponse {
  message: string;
  alternatives: AlternativeSuggestion[];
  actions: Array<{
    type: string;
    label: string;
    endpoint: string;
  }>;
  metadata: {
    searchQuery: string;
    missingProductId: string;
    alternativeCount: number;
  };
}

export interface ProductAnalysis {
  extractedBrand?: string;
  extractedProduct?: string;
  category: 'fragrance' | 'brand' | 'unknown';
  gender?: 'men' | 'women' | 'unisex';
  notes?: string[];
}

export class MissingProductDetector {
  private normalizer = new FragranceNormalizer();

  private async getSupabase() {
    return await createServerSupabase();
  }

  // Known brand patterns for extraction
  private readonly BRAND_PATTERNS: Record<string, RegExp> = {
    coach: /\bcoach\b/i,
    'tom ford': /\btom\s+ford\b/i,
    chanel: /\bchanel\b/i,
    dior: /\b(dior|christian\s+dior)\b/i,
    'giorgio armani': /\b(giorgio\s+)?armani\b/i,
    'yves saint laurent': /\b(ysl|yves\s+saint\s+laurent)\b/i,
    'dolce & gabbana': /\b(d&g|dolce\s*&\s*gabbana)\b/i,
    'calvin klein': /\b(ck|calvin\s+klein)\b/i,
    versace: /\bversace\b/i,
    prada: /\bprada\b/i,
  };

  // Gender indicators in product names
  private readonly GENDER_INDICATORS = {
    men: ['for men', 'homme', 'man', 'masculine', "men's"],
    women: ['for women', 'femme', 'woman', 'feminine', "women's", 'for her'],
    unisex: ['unisex', 'for all', 'everyone'],
  };

  // Common fragrance notes for similarity matching
  private readonly NOTE_PATTERNS: Record<string, string[]> = {
    fresh: [
      'fresh',
      'clean',
      'aquatic',
      'marine',
      'citrus',
      'lemon',
      'bergamot',
    ],
    woody: ['woody', 'cedar', 'sandalwood', 'vetiver', 'oud', 'oak'],
    oriental: ['oriental', 'amber', 'vanilla', 'spicy', 'cinnamon', 'cardamom'],
    floral: ['floral', 'rose', 'jasmine', 'lily', 'peony', 'gardenia'],
    fruity: ['fruity', 'apple', 'pear', 'peach', 'berries', 'tropical'],
    gourmand: ['gourmand', 'chocolate', 'coffee', 'caramel', 'honey', 'sweet'],
  };

  /**
   * Main handler for product not found scenarios
   */
  async handleProductNotFound(
    searchQuery: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<MissingProductResponse> {
    try {
      // Step 1: Log the missing product request
      const missingProductId = await this.logMissingProduct(
        searchQuery,
        userId,
        ipAddress,
        userAgent
      );

      // Step 2: Analyze the search query
      const analysis = this.analyzeSearchQuery(searchQuery);

      // Step 3: Get request count for priority assessment
      const requestCount = await this.getMissingProductCount(searchQuery);

      // Step 4: Find alternative suggestions
      const alternatives = await this.findAlternatives(searchQuery, analysis);

      // Step 5: Check if sourcing threshold reached
      if (requestCount >= 10) {
        await this.triggerProductSourcing(searchQuery, requestCount);
      }

      // Step 6: Build response with actions
      const actions = [
        {
          type: 'notify',
          label: 'Notify me when available',
          endpoint: '/api/missing-products/notify',
        },
        {
          type: 'suggest',
          label: 'Suggest this product',
          endpoint: '/api/missing-products/suggest-product',
        },
      ];

      return {
        message: "We couldn't find that exact product",
        alternatives,
        actions,
        metadata: {
          searchQuery,
          missingProductId,
          alternativeCount: alternatives.length,
        },
      };
    } catch (error) {
      console.error('Error handling missing product:', error);

      // Return minimal response on error
      return {
        message: 'Product not found',
        alternatives: [],
        actions: [],
        metadata: {
          searchQuery,
          missingProductId: '',
          alternativeCount: 0,
        },
      };
    }
  }

  /**
   * Log missing product request for demand tracking
   */
  async logMissingProduct(
    searchQuery: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    try {
      const analysis = this.analyzeSearchQuery(searchQuery);

      const { data, error } = await (this.supabase as any).rpc(
        'log_missing_product_request',
        {
          query: searchQuery,
          user_id_param: userId || null,
          ip_param: ipAddress || null,
          user_agent_param: userAgent || null,
        }
      );

      if (error) {
        // Fallback to direct insert if RPC fails
        const { data: fallbackData, error: fallbackError } = await (
          this.supabase as any
        )
          .from('missing_product_requests')
          .insert({
            search_query: searchQuery,
            user_id: userId || null,
            ip_address: ipAddress || null,
            user_agent: userAgent || null,
            category: analysis.category,
            extracted_brand: analysis.extractedBrand,
            extracted_product: analysis.extractedProduct,
          })
          .select('id')
          .single();

        if (fallbackError) throw fallbackError;
        return fallbackData.id;
      }

      return data;
    } catch (error) {
      console.error('Error logging missing product:', error);
      return 'error-' + Date.now();
    }
  }

  /**
   * Get count of requests for a missing product
   */
  async getMissingProductCount(searchQuery: string): Promise<number> {
    try {
      const normalizedQuery = searchQuery.toLowerCase().trim();

      const { data, error } = await (this.supabase as any)
        .from('missing_product_summary')
        .select('request_count')
        .eq('normalized_query', normalizedQuery)
        .single();

      if (error || !data) return 0;
      return data.request_count || 0;
    } catch (error) {
      console.error('Error getting missing product count:', error);
      return 0;
    }
  }

  /**
   * Find alternative suggestions for missing products
   */
  async findAlternatives(
    searchQuery: string,
    analysis?: ProductAnalysis
  ): Promise<AlternativeSuggestion[]> {
    const productAnalysis = analysis || this.analyzeSearchQuery(searchQuery);
    const alternatives: AlternativeSuggestion[] = [];

    try {
      // Strategy 1: Same brand alternatives (highest priority)
      if (productAnalysis.extractedBrand) {
        const brandAlternatives = await this.findSameBrandAlternatives(
          productAnalysis.extractedBrand,
          productAnalysis.gender
        );
        alternatives.push(...brandAlternatives);
      }

      // Strategy 2: Gender-specific alternatives
      if (productAnalysis.gender && alternatives.length < 5) {
        const genderAlternatives = await this.findGenderSpecificAlternatives(
          productAnalysis.gender,
          productAnalysis.extractedBrand
        );
        alternatives.push(...genderAlternatives);
      }

      // Strategy 3: Note-based similarity
      if (productAnalysis.notes && alternatives.length < 8) {
        const noteAlternatives = await this.findNoteBasedAlternatives(
          productAnalysis.notes
        );
        alternatives.push(...noteAlternatives);
      }

      // Strategy 4: Fuzzy text matching
      if (alternatives.length < 10) {
        const fuzzyAlternatives =
          await this.findFuzzyTextAlternatives(searchQuery);
        alternatives.push(...fuzzyAlternatives);
      }

      // Remove duplicates and rank by similarity
      const uniqueAlternatives = this.deduplicateAndRank(alternatives);

      return uniqueAlternatives.slice(0, 10); // Limit to top 10
    } catch (error) {
      console.error('Error finding alternatives:', error);
      return [];
    }
  }

  /**
   * Analyze search query to extract brand, product, and characteristics
   */
  analyzeSearchQuery(searchQuery: string): ProductAnalysis {
    const query = searchQuery.toLowerCase().trim();
    let extractedBrand: string | undefined;
    let category: 'fragrance' | 'brand' | 'unknown' = 'unknown';
    let gender: 'men' | 'women' | 'unisex' | undefined;
    let extractedProduct: string | undefined;

    // Extract brand
    for (const [brand, pattern] of Object.entries(this.BRAND_PATTERNS)) {
      if (pattern.test(query)) {
        extractedBrand = brand;
        category = 'fragrance';

        // Extract product name (everything after brand)
        const brandMatch = query.match(pattern);
        if (brandMatch) {
          const afterBrand = query
            .substring(brandMatch.index! + brandMatch[0].length)
            .trim();
          if (afterBrand.length > 0) {
            extractedProduct = afterBrand;
          }
        }
        break;
      }
    }

    // If no brand found but looks like fragrance name, still categorize as fragrance
    if (!extractedBrand) {
      const fragranceIndicators = [
        'perfume',
        'cologne',
        'fragrance',
        'scent',
        'edp',
        'edt',
        'eau de',
      ];
      if (fragranceIndicators.some(indicator => query.includes(indicator))) {
        category = 'fragrance';
      }
    }

    // Extract gender
    for (const [genderType, indicators] of Object.entries(
      this.GENDER_INDICATORS
    )) {
      if (indicators.some(indicator => query.includes(indicator))) {
        gender = genderType as 'men' | 'women' | 'unisex';
        break;
      }
    }

    // Extract notes/characteristics
    const notes: string[] = [];
    for (const [noteFamily, noteList] of Object.entries(this.NOTE_PATTERNS)) {
      if (noteList.some(note => query.includes(note))) {
        notes.push(noteFamily);
      }
    }

    return {
      extractedBrand,
      extractedProduct,
      category,
      gender,
      notes: notes.length > 0 ? notes : undefined,
    };
  }

  /**
   * Find alternatives from the same brand
   */
  private async findSameBrandAlternatives(
    brandName: string,
    gender?: string
  ): Promise<AlternativeSuggestion[]> {
    try {
      let query = (this.supabase as any)
        .from('fragrances')
        .select('id, name, brand_id, gender, popularity_score, main_accords')
        .ilike('brand_id', `%${brandName.replace(/\s+/g, '-')}%`)
        .eq('sample_available', true)
        .order('popularity_score', { ascending: false })
        .limit(5);

      // Filter by gender if specified
      if (gender && gender !== 'unisex') {
        query = query.or(`gender.eq.${gender},gender.eq.unisex`);
      }

      const { data: fragrances, error } = await query;

      if (error || !fragrances) return [];

      return fragrances.map(fragrance => ({
        fragrance_id: fragrance.id,
        name: fragrance.name,
        brand: brandName,
        similarity_score: 0.8 + (fragrance.popularity_score || 0) * 0.002, // Boost popular items
        match_reason: `Same brand (${brandName}), popular choice`,
        image_url: `/images/fragrances/${fragrance.id}.jpg`,
      }));
    } catch (error) {
      console.error('Error finding same brand alternatives:', error);
      return [];
    }
  }

  /**
   * Find gender-specific alternatives
   */
  private async findGenderSpecificAlternatives(
    gender: string,
    excludeBrand?: string
  ): Promise<AlternativeSuggestion[]> {
    try {
      let query = (this.supabase as any)
        .from('fragrances')
        .select('id, name, brand_id, gender, popularity_score, main_accords')
        .or(`gender.eq.${gender},gender.eq.unisex`)
        .eq('sample_available', true)
        .order('popularity_score', { ascending: false })
        .limit(5);

      // Exclude the brand we already found alternatives for
      if (excludeBrand) {
        query = query.not(
          'brand_id',
          'ilike',
          `%${excludeBrand.replace(/\s+/g, '-')}%`
        );
      }

      const { data: fragrances, error } = await query;

      if (error || !fragrances) return [];

      return fragrances.map(fragrance => ({
        fragrance_id: fragrance.id,
        name: fragrance.name,
        brand: fragrance.brand_id.replace(/-/g, ' '), // Simple brand name extraction
        similarity_score: 0.6 + (fragrance.popularity_score || 0) * 0.001,
        match_reason: `Popular ${gender === 'men' ? 'masculine' : gender === 'women' ? 'feminine' : 'unisex'} fragrance`,
        image_url: `/images/fragrances/${fragrance.id}.jpg`,
      }));
    } catch (error) {
      console.error('Error finding gender alternatives:', error);
      return [];
    }
  }

  /**
   * Find alternatives based on fragrance notes
   */
  private async findNoteBasedAlternatives(
    notes: string[]
  ): Promise<AlternativeSuggestion[]> {
    try {
      // Build query to find fragrances with similar note profiles
      const { data: fragrances, error } = await (this.supabase as any)
        .from('fragrances')
        .select('id, name, brand_id, main_accords, popularity_score')
        .overlaps('main_accords', notes)
        .eq('sample_available', true)
        .order('popularity_score', { ascending: false })
        .limit(5);

      if (error || !fragrances) return [];

      return fragrances.map(fragrance => {
        const matchingNotes =
          fragrance.main_accords?.filter(accord =>
            notes.some(note => accord.toLowerCase().includes(note))
          ) || [];

        return {
          fragrance_id: fragrance.id,
          name: fragrance.name,
          brand: fragrance.brand_id.replace(/-/g, ' '),
          similarity_score:
            0.4 +
            matchingNotes.length * 0.1 +
            (fragrance.popularity_score || 0) * 0.001,
          match_reason: `Similar scent profile: ${matchingNotes.slice(0, 2).join(', ')} notes`,
          image_url: `/images/fragrances/${fragrance.id}.jpg`,
        };
      });
    } catch (error) {
      console.error('Error finding note-based alternatives:', error);
      return [];
    }
  }

  /**
   * Find alternatives using fuzzy text matching
   */
  private async findFuzzyTextAlternatives(
    searchQuery: string
  ): Promise<AlternativeSuggestion[]> {
    try {
      // Normalize the query first
      const normalized = this.normalizer.normalizeFragranceName(searchQuery);

      // Use PostgreSQL similarity search
      const { data: fragrances, error } = await (this.supabase as any).rpc(
        'similarity_search_fragrances',
        {
          query_text: normalized.canonicalName,
          threshold: 0.3,
          limit_count: 5,
        }
      );

      if (error || !fragrances) {
        // Fallback to basic text search if similarity function fails
        const { data: fallbackResults } = await (this.supabase as any)
          .from('fragrances')
          .select('id, name, brand_id, popularity_score')
          .textSearch('search_vector', searchQuery.split(' ').join(' | '))
          .eq('sample_available', true)
          .limit(5);

        if (fallbackResults) {
          return fallbackResults.map(fragrance => ({
            fragrance_id: fragrance.id,
            name: fragrance.name,
            brand: fragrance.brand_id.replace(/-/g, ' '),
            similarity_score: 0.5 + (fragrance.popularity_score || 0) * 0.001,
            match_reason: `Text match for "${searchQuery}"`,
            image_url: `/images/fragrances/${fragrance.id}.jpg`,
          }));
        }

        return [];
      }

      return fragrances.map((fragrance: any) => ({
        fragrance_id: fragrance.fragrance_id,
        name: fragrance.fragrance_name,
        brand: fragrance.brand_name,
        similarity_score: fragrance.similarity_score,
        match_reason: `Similar name: "${fragrance.fragrance_name}"`,
        image_url: `/images/fragrances/${fragrance.fragrance_id}.jpg`,
      }));
    } catch (error) {
      console.error('Error finding fuzzy alternatives:', error);
      return [];
    }
  }

  /**
   * Remove duplicates and rank alternatives by similarity score
   */
  private deduplicateAndRank(
    alternatives: AlternativeSuggestion[]
  ): AlternativeSuggestion[] {
    // Remove duplicates by fragrance_id
    const unique = alternatives.filter(
      (alt, index, arr) =>
        arr.findIndex(a => a.fragrance_id === alt.fragrance_id) === index
    );

    // Sort by similarity score (descending)
    return unique.sort((a, b) => b.similarity_score - a.similarity_score);
  }

  /**
   * Trigger product sourcing workflow when threshold reached
   */
  private async triggerProductSourcing(
    searchQuery: string,
    requestCount: number
  ): Promise<void> {
    try {
      // Update summary with sourcing status
      await (this.supabase as any)
        .from('missing_product_summary')
        .update({
          sourcing_status: 'sourcing',
          priority_score: Math.min(10, Math.floor(requestCount / 5)),
        })
        .eq('normalized_query', searchQuery.toLowerCase().trim());

      // Log sourcing trigger (could trigger external systems)
      console.log(
        `🎯 SOURCING TRIGGERED: "${searchQuery}" reached ${requestCount} requests`
      );

      // In production, this could:
      // - Send notification to product team
      // - Create task in project management system
      // - Trigger automated product research
      // - Add to vendor sourcing queue
    } catch (error) {
      console.error('Error triggering product sourcing:', error);
    }
  }

  /**
   * Check if a product exists in the database (exact or similar)
   */
  async checkProductExists(searchQuery: string): Promise<{
    exists: boolean;
    exact_match?: any;
    similar_matches?: any[];
  }> {
    try {
      // Check for exact match first
      const { data: exactMatch } = await (this.supabase as any)
        .from('fragrances')
        .select('id, name, brand_id')
        .ilike('name', searchQuery)
        .single();

      if (exactMatch) {
        return {
          exists: true,
          exact_match: exactMatch,
        };
      }

      // Check for similar matches using trigram similarity
      const { data: similarMatches } = await (this.supabase as any)
        .from('fragrances')
        .select('id, name, brand_id')
        .textSearch('search_vector', searchQuery.split(' ').join(' | '))
        .limit(5);

      return {
        exists: false,
        similar_matches: similarMatches || [],
      };
    } catch (error) {
      console.error('Error checking product existence:', error);
      return { exists: false };
    }
  }

  /**
   * Get missing product statistics for admin dashboard
   */
  async getMissingProductStats(): Promise<{
    total_requests: number;
    unique_products: number;
    top_missing: Array<{
      query: string;
      request_count: number;
      priority_score: number;
    }>;
  }> {
    try {
      // Get total request count
      const { count: totalRequests } = await (this.supabase as any)
        .from('missing_product_requests')
        .select('*', { count: 'exact', head: true });

      // Get unique products count
      const { count: uniqueProducts } = await (this.supabase as any)
        .from('missing_product_summary')
        .select('*', { count: 'exact', head: true });

      // Get top missing products
      const { data: topMissing } = await (this.supabase as any)
        .from('missing_product_summary')
        .select('normalized_query, request_count, priority_score')
        .order('priority_score', { ascending: false })
        .order('request_count', { ascending: false })
        .limit(10);

      return {
        total_requests: totalRequests || 0,
        unique_products: uniqueProducts || 0,
        top_missing:
          topMissing?.map(item => ({
            query: item.normalized_query,
            request_count: item.request_count,
            priority_score: item.priority_score,
          })) || [],
      };
    } catch (error) {
      console.error('Error getting missing product stats:', error);
      return {
        total_requests: 0,
        unique_products: 0,
        top_missing: [],
      };
    }
  }

  /**
   * Mark a missing product as sourced/added
   */
  async markProductSourced(
    searchQuery: string,
    newFragranceId: string,
    notes?: string
  ): Promise<void> {
    try {
      const normalizedQuery = searchQuery.toLowerCase().trim();

      // Update summary
      await (this.supabase as any)
        .from('missing_product_summary')
        .update({
          sourcing_status: 'added',
          notes: notes || `Added as fragrance ID: ${newFragranceId}`,
        })
        .eq('normalized_query', normalizedQuery);

      // Update individual requests
      await (this.supabase as any)
        .from('missing_product_requests')
        .update({
          status: 'added',
          sourced_at: new Date().toISOString(),
          notes: notes || `Sourced as: ${newFragranceId}`,
        })
        .eq('search_query', searchQuery);

      console.log(`✅ Marked "${searchQuery}" as sourced: ${newFragranceId}`);
    } catch (error) {
      console.error('Error marking product as sourced:', error);
    }
  }
}
