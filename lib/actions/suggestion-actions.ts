'use server';

import { unstable_rethrow } from 'next/navigation';
import { searchService } from '@/lib/search/search-service';

/**
 * Get Search Suggestions Server Action
 *
 * Provides autocomplete suggestions using FuseSearchService
 */
export async function getSearchSuggestions(
  query: string,
  limit = 8
): Promise<{
  success: boolean;
  error?: string;
  suggestions?: Array<{
    text: string;
    type: 'fragrance' | 'brand' | 'note' | 'family';
    confidence: number;
  }>;
}> {
  try {
    if (!query || typeof query !== 'string' || query.length < 2) {
      return { success: true, suggestions: [] };
    }

    const suggestions = await searchService.getSuggestions(query.trim(), limit);

    return {
      success: true,
      suggestions,
    };
  } catch (error) {
    console.error('Suggestions Server Action error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Suggestions temporarily unavailable',
    };
  }
}
