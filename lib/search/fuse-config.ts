/**
 * Fuse.js Configuration for ScentMatch Fragrance Search
 *
 * Optimized configuration for fuzzy search with weighted fields,
 * proper threshold, and fragrance-specific search patterns.
 */

import Fuse from 'fuse.js';

export interface FragranceSearchItem {
  id: string;
  name: string;
  brand: string;
  scent_family?: string;
  main_accords?: string[];
  notes_top?: string[];
  notes_middle?: string[];
  notes_base?: string[];
  gender?: string;
  description?: string;
  popularity_score?: number;
  rating_value?: number;
  sample_available?: boolean;
  sample_price_usd?: number;
  year_released?: number;
}

export interface SearchableFragrance extends FragranceSearchItem {
  // Computed fields for better search
  searchable_text: string;
  brand_variants: string[];
  note_combinations: string[];
  accent_keywords: string[];
}

/**
 * Primary Fuse.js configuration optimized for fragrance search
 */
export const fuseConfig: Fuse.IFuseOptions<SearchableFragrance> = {
  // Search configuration
  threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything - 0.4 good balance for typos
  distance: 100, // Maximum distance between characters to consider a match
  minMatchCharLength: 2, // Minimum character length for a match

  // Performance settings
  includeScore: true, // Include similarity score in results
  includeMatches: true, // Include match information for highlighting
  shouldSort: true, // Sort results by relevance
  findAllMatches: false, // Stop after finding the best matches

  // Field weights - higher values = more important
  keys: [
    // Primary identifiers (highest weight)
    {
      name: 'name',
      weight: 0.4, // Fragrance name is most important
    },
    {
      name: 'brand',
      weight: 0.3, // Brand is very important
    },

    // Secondary identifiers
    {
      name: 'brand_variants',
      weight: 0.15, // Brand variations (e.g., "YSL" for "Yves Saint Laurent")
    },
    {
      name: 'scent_family',
      weight: 0.1, // Scent family for categorization
    },

    // Fragrance characteristics (medium weight)
    {
      name: 'main_accords',
      weight: 0.08,
    },
    {
      name: 'notes_top',
      weight: 0.06,
    },
    {
      name: 'notes_middle',
      weight: 0.05,
    },
    {
      name: 'notes_base',
      weight: 0.04,
    },

    // Searchable content (lower weight for broad matching)
    {
      name: 'searchable_text',
      weight: 0.03,
    },
    {
      name: 'note_combinations',
      weight: 0.02,
    },
    {
      name: 'accent_keywords',
      weight: 0.02,
    },
    {
      name: 'description',
      weight: 0.01, // Description has lowest weight
    },
  ],

  // Advanced options
  ignoreLocation: true, // Don't penalize matches at the end of strings
  ignoreFieldNorm: false, // Consider field length in scoring
  fieldNormWeight: 1, // Field length normalization weight
};

/**
 * Alternative config for exact/near-exact matches
 * Use when user wants precise results
 */
export const exactMatchConfig: Fuse.IFuseOptions<SearchableFragrance> = {
  ...fuseConfig,
  threshold: 0.2, // Much stricter threshold
  distance: 50, // Shorter distance for exact matches
  minMatchCharLength: 3,
};

/**
 * Config for broad discovery search
 * Use when showing "related" or "similar" results
 */
export const discoveryConfig: Fuse.IFuseOptions<SearchableFragrance> = {
  ...fuseConfig,
  threshold: 0.6, // More lenient threshold
  distance: 200, // Longer distance for broader matching
  minMatchCharLength: 1,
};

/**
 * Suggestion/autocomplete config
 * Optimized for real-time search suggestions
 */
export const suggestionConfig: Fuse.IFuseOptions<SearchableFragrance> = {
  threshold: 0.3, // Medium threshold for suggestions
  distance: 100,
  minMatchCharLength: 2,
  includeScore: true,
  includeMatches: false, // Skip matches for performance
  shouldSort: true,
  findAllMatches: false,

  // Focus on primary fields for suggestions
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'brand', weight: 0.3 },
    { name: 'brand_variants', weight: 0.2 },
  ],

  ignoreLocation: true,
  ignoreFieldNorm: false,
};

/**
 * Transform fragrance data for optimal search performance
 */
export function transformFragranceForSearch(
  fragrance: FragranceSearchItem
): SearchableFragrance {
  // Create brand variants for better brand matching
  const brandVariants = generateBrandVariants(fragrance.brand);

  // Combine all notes for comprehensive note searching
  const allNotes = [
    ...(fragrance.notes_top || []),
    ...(fragrance.notes_middle || []),
    ...(fragrance.notes_base || []),
  ];

  // Create note combinations (e.g., "woody amber", "fresh citrus")
  const noteCombinations = generateNoteCombinations(allNotes);

  // Create accent keywords for better discoverability
  const accentKeywords = generateAccentKeywords(fragrance);

  // Create comprehensive searchable text
  const searchableText = [
    fragrance.name,
    fragrance.brand,
    fragrance.scent_family,
    ...(fragrance.main_accords || []),
    ...allNotes,
    fragrance.description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return {
    ...fragrance,
    searchable_text: searchableText,
    brand_variants: brandVariants,
    note_combinations: noteCombinations,
    accent_keywords: accentKeywords,
  };
}

/**
 * Generate brand name variants for better matching
 */
function generateBrandVariants(brand: string): string[] {
  const variants = [brand];
  const lowerBrand = brand.toLowerCase();

  // Common brand abbreviations and variants
  const brandMappings: Record<string, string[]> = {
    'yves saint laurent': ['ysl', 'saint laurent'],
    'calvin klein': ['ck'],
    'dolce & gabbana': ['d&g', 'dolce gabbana'],
    'giorgio armani': ['armani'],
    'tom ford': ['tf'],
    'jean paul gaultier': ['jpg', 'gaultier'],
    'thierry mugler': ['mugler'],
    'maison francis kurkdjian': ['mfk', 'francis kurkdjian'],
    creed: ['house of creed'],
    'by kilian': ['kilian'],
  };

  // Check for known mappings
  for (const [fullName, abbreviations] of Object.entries(brandMappings)) {
    if (lowerBrand.includes(fullName)) {
      variants.push(...abbreviations);
    }
    if (abbreviations.some(abbr => lowerBrand.includes(abbr))) {
      variants.push(fullName);
    }
  }

  // Add common variations
  if (brand.includes(' ')) {
    variants.push(brand.replace(/\s+/g, '')); // Remove spaces
    variants.push(brand.replace(/\s+/g, '-')); // Replace with hyphens
  }

  return [...new Set(variants)]; // Remove duplicates
}

/**
 * Generate note combinations for better note-based searching
 */
function generateNoteCombinations(notes: string[]): string[] {
  if (!notes || notes.length === 0) return [];

  const combinations: string[] = [];

  // Single notes
  combinations.push(...notes);

  // Two-note combinations
  for (let i = 0; i < notes.length - 1; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      combinations.push(`${notes[i]} ${notes[j]}`);
    }
  }

  return combinations;
}

/**
 * Generate accent keywords for discoverability
 */
function generateAccentKeywords(fragrance: FragranceSearchItem): string[] {
  const keywords: string[] = [];

  // Gender-based keywords
  if (fragrance.gender) {
    keywords.push(fragrance.gender);
    if (fragrance.gender === 'men') {
      keywords.push('masculine', 'for him', 'mens');
    } else if (fragrance.gender === 'women') {
      keywords.push('feminine', 'for her', 'womens');
    }
  }

  // Sample availability
  if (fragrance.sample_available) {
    keywords.push('sample', 'travel size', 'discovery');
  }

  // Year-based keywords
  if (fragrance.year_released) {
    const year = fragrance.year_released;
    if (year >= 2020) keywords.push('new', 'recent', 'modern');
    if (year >= 2010 && year < 2020) keywords.push('contemporary');
    if (year < 2010) keywords.push('classic', 'vintage');
  }

  // Rating-based keywords
  if (fragrance.rating_value && fragrance.rating_value >= 4.5) {
    keywords.push('highly rated', 'popular', 'bestseller');
  }

  // Price-based keywords
  if (fragrance.sample_price_usd) {
    if (fragrance.sample_price_usd <= 10) keywords.push('affordable');
    if (fragrance.sample_price_usd >= 25) keywords.push('premium', 'luxury');
  }

  return keywords;
}

/**
 * Performance optimizations for large datasets
 */
export const performanceConfig = {
  // Use Web Workers for large search operations (future enhancement)
  useWebWorker: false,

  // Batch size for processing large datasets
  batchSize: 100,

  // Cache results for repeated searches
  enableCaching: true,
  cacheSize: 50, // Number of searches to cache

  // Lazy loading for very large datasets
  enableLazyLoading: false,
  lazyLoadThreshold: 1000, // Load more data when searching > 1000 items
};
