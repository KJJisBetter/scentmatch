/**
 * Client-only Fragrance Validation Service
 * 
 * Provides validation and lookup services to prevent 404 errors when navigating
 * from quiz recommendations to fragrance detail pages.
 * 
 * Fixes SCE-71: Critical Quiz Recommendation 404 Issues
 * 
 * This version only uses client-side Supabase and is safe for Pages Router.
 */

import { createClient } from '@supabase/supabase-js';

interface FragranceValidationResult {
  exists: boolean;
  validId: string | null;
  fragranceName?: string;
  brandName?: string;
  alternativeIds?: string[];
}

/**
 * Client-side fragrance validation service
 * Uses public Supabase client for client-side validation
 */
export class FragranceValidationService {
  private supabase;

  constructor() {
    // Use public client for client-side validation
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Validate fragrance exists and get correct ID format
   */
  async validateFragranceId(fragranceId: string): Promise<FragranceValidationResult> {
    try {
      console.log(`🔍 VALIDATING: Checking fragrance ID "${fragranceId}"`);

      // First try exact match
      const { data: exactMatch, error: exactError } = await this.supabase
        .from('fragrances')
        .select(`
          id,
          name,
          fragrance_brands!inner(name)
        `)
        .eq('id', fragranceId)
        .single();

      if (exactMatch && !exactError) {
        console.log(`✅ EXACT MATCH: Found "${fragranceId}"`);
        return {
          exists: true,
          validId: exactMatch.id,
          fragranceName: exactMatch.name,
          brandName: exactMatch.fragrance_brands?.name,
        };
      }

      // If exact match fails, try fuzzy matching with common normalization patterns
      console.log(`🔄 FUZZY SEARCH: Trying alternative formats for "${fragranceId}"`);
      
      const alternativeIds = this.generateAlternativeIds(fragranceId);
      console.log(`🎯 ALTERNATIVES: ${alternativeIds.join(', ')}`);

      // Try each alternative ID
      for (const altId of alternativeIds) {
        const { data: altMatch, error: altError } = await this.supabase
          .from('fragrances')
          .select(`
            id,
            name,
            fragrance_brands!inner(name)
          `)
          .eq('id', altId)
          .single();

        if (altMatch && !altError) {
          console.log(`✅ ALTERNATIVE MATCH: Found "${altId}" for original "${fragranceId}"`);
          return {
            exists: true,
            validId: altMatch.id,
            fragranceName: altMatch.name,
            brandName: altMatch.fragrance_brands?.name,
            alternativeIds: [fragranceId, ...alternativeIds],
          };
        }
      }

      // If still not found, try partial name matching as last resort
      console.log(`🔍 NAME SEARCH: Attempting partial name match for "${fragranceId}"`);
      
      // Extract potential name parts from ID
      const nameParts = fragranceId.toLowerCase()
        .replace(/[-_]+/g, ' ')
        .split(' ')
        .filter(part => part.length > 2); // Filter out short parts

      if (nameParts.length > 0) {
        const nameQuery = nameParts.join(' & ');
        
        const { data: nameMatches, error: nameError } = await this.supabase
          .from('fragrances')
          .select(`
            id,
            name,
            fragrance_brands!inner(name)
          `)
          .textSearch('name', nameQuery)
          .limit(1);

        if (nameMatches && nameMatches.length > 0 && !nameError) {
          const match = nameMatches[0];
          console.log(`✅ NAME MATCH: Found "${match.id}" via name search for "${fragranceId}"`);
          return {
            exists: true,
            validId: match.id,
            fragranceName: match.name,
            brandName: match.fragrance_brands?.name,
            alternativeIds: [fragranceId, ...alternativeIds],
          };
        }
      }

      console.log(`❌ NOT FOUND: No matches for "${fragranceId}"`);
      return {
        exists: false,
        validId: null,
        alternativeIds: alternativeIds,
      };

    } catch (error) {
      console.error('❌ VALIDATION ERROR:', error);
      return {
        exists: false,
        validId: null,
      };
    }
  }

  /**
   * Generate alternative ID formats for fuzzy matching
   */
  private generateAlternativeIds(originalId: string): string[] {
    const alternatives = new Set<string>();
    
    // Remove the original ID from alternatives
    const baseId = originalId.toLowerCase().trim();
    
    // Common normalization patterns
    alternatives.add(baseId.replace(/[-_]+/g, '__')); // Convert to double underscore
    alternatives.add(baseId.replace(/[-_]+/g, '-'));  // Convert to single dash
    alternatives.add(baseId.replace(/[-_]+/g, '_'));  // Convert to single underscore  
    alternatives.add(baseId.replace(/[-_]+/g, ''));   // Remove all separators
    alternatives.add(baseId.replace(/__+/g, '_'));    // Double to single underscore
    alternatives.add(baseId.replace(/__+/g, '-'));    // Double underscore to dash
    alternatives.add(baseId.replace(/_+/g, '__'));    // Single to double underscore
    
    // URL encoding variations
    alternatives.add(encodeURIComponent(baseId));
    alternatives.add(decodeURIComponent(baseId));
    
    // Remove original and empty strings
    alternatives.delete(originalId);
    alternatives.delete('');
    
    return Array.from(alternatives);
  }
}

/**
 * Singleton instance for client-side usage
 */
export const fragranceValidator = new FragranceValidationService();

/**
 * Safe navigation helper for fragrance detail pages
 */
export async function safeNavigateToFragrance(
  fragranceId: string,
  fallbackAction?: () => void
): Promise<void> {
  const validation = await fragranceValidator.validateFragranceId(fragranceId);
  
  if (validation.exists && validation.validId) {
    // Navigate to the validated fragrance page
    const url = `/fragrance/${validation.validId}`;
    console.log(`✅ SAFE NAVIGATION: Opening ${url}`);
    window.open(url, '_blank');
  } else {
    // Handle failed validation
    console.warn(`❌ NAVIGATION BLOCKED: Fragrance "${fragranceId}" not found`);
    
    if (fallbackAction) {
      fallbackAction();
    } else {
      // Default fallback - show user-friendly message
      alert(`Sorry, this fragrance is temporarily unavailable. Please try another recommendation.`);
    }
  }
}