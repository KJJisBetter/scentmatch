/**
 * Client-side brand normalization utilities
 * Handles brand variations and ensures consistent display
 */

export interface BrandInfo {
  canonical_name: string;
  parent_brand: string;
  sub_brand: string;
}

/**
 * Normalize a brand name client-side
 * Matches the server-side logic for consistency
 */
export function normalizeBrandName(brandName: string): BrandInfo {
  if (!brandName || typeof brandName !== 'string') {
    return {
      canonical_name: 'Unknown Brand',
      parent_brand: 'Unknown Brand', 
      sub_brand: ''
    };
  }

  const brand = brandName.toLowerCase().trim();

  // Emporio Armani - Completely separate brand
  if (brand.includes('emporio armani') || brand.includes('emporio')) {
    return {
      canonical_name: 'Emporio Armani',
      parent_brand: 'Emporio Armani',
      sub_brand: ''
    };
  }
  
  // Giorgio Armani - Completely separate brand  
  if (brand.includes('giorgio armani') || (brand.includes('giorgio') && brand.includes('armani'))) {
    return {
      canonical_name: 'Giorgio Armani',
      parent_brand: 'Giorgio Armani', 
      sub_brand: ''
    };
  }
  
  // Generic Armani (rare case)
  if (brand === 'armani') {
    return {
      canonical_name: 'Armani',
      parent_brand: 'Armani',
      sub_brand: ''
    };
  }

  // Dior family handling
  if (brand.includes('dior')) {
    if (brand.includes('christian')) {
      return {
        canonical_name: 'Christian Dior',
        parent_brand: 'Dior',
        sub_brand: 'Christian Dior'
      };
    } else if (brand === 'dior') {
      return {
        canonical_name: 'Dior',
        parent_brand: 'Dior',
        sub_brand: ''
      };
    }
  }

  // Chanel family handling
  if (brand.includes('chanel')) {
    return {
      canonical_name: 'Chanel',
      parent_brand: 'Chanel',
      sub_brand: ''
    };
  }

  // Tom Ford handling
  if (brand.includes('tom ford') || brand.includes('tomford')) {
    return {
      canonical_name: 'Tom Ford',
      parent_brand: 'Tom Ford',
      sub_brand: ''
    };
  }

  // Yves Saint Laurent family
  if (brand.includes('yves saint laurent') || brand.includes('ysl') || brand.includes('saint laurent')) {
    return {
      canonical_name: 'Yves Saint Laurent',
      parent_brand: 'Saint Laurent',
      sub_brand: 'YSL'
    };
  }

  // Dolce & Gabbana variations
  if (brand.includes('dolce') && brand.includes('gabbana')) {
    return {
      canonical_name: 'Dolce & Gabbana',
      parent_brand: 'Dolce & Gabbana',
      sub_brand: ''
    };
  }

  // Calvin Klein variations
  if (brand.includes('calvin klein') || brand.includes('ck ')) {
    return {
      canonical_name: 'Calvin Klein',
      parent_brand: 'Calvin Klein',
      sub_brand: ''
    };
  }

  // Marc Jacobs variations
  if (brand.includes('marc jacobs')) {
    return {
      canonical_name: 'Marc Jacobs',
      parent_brand: 'Marc Jacobs',
      sub_brand: ''
    };
  }

  // Ralph Lauren family
  if (brand.includes('ralph lauren') || brand.includes('polo ')) {
    if (brand.includes('polo')) {
      return {
        canonical_name: 'Polo Ralph Lauren',
        parent_brand: 'Ralph Lauren',
        sub_brand: 'Polo'
      };
    } else {
      return {
        canonical_name: 'Ralph Lauren',
        parent_brand: 'Ralph Lauren',
        sub_brand: ''
      };
    }
  }

  // Hugo Boss variations
  if (brand.includes('hugo boss') || brand.includes('boss ')) {
    if (brand.includes('hugo') && brand.includes('boss')) {
      return {
        canonical_name: 'Hugo Boss',
        parent_brand: 'Hugo Boss',
        sub_brand: ''
      };
    } else if (brand.startsWith('boss ')) {
      return {
        canonical_name: 'Boss',
        parent_brand: 'Hugo Boss',
        sub_brand: 'Boss'
      };
    }
  }

  // Default case - apply title case
  const titleCase = brandName.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return {
    canonical_name: titleCase,
    parent_brand: titleCase,
    sub_brand: ''
  };
}

/**
 * Clean and normalize brand name for display
 * Also checks fragrance name for brand clues (e.g., "Emporio" in fragrance name)
 */
export function getDisplayBrandName(brandName: string, fragranceName?: string): string {
  // First check if fragrance name gives us brand clues
  if (fragranceName) {
    const fragLower = fragranceName.toLowerCase();
    
    // If fragrance name contains "emporio", it's Emporio Armani regardless of database brand
    if (fragLower.includes('emporio')) {
      return 'Emporio Armani';
    }
    
    // If fragrance name contains "acqua di gio" or "stronger with you", could be Giorgio Armani
    if (fragLower.includes('acqua di gio') || fragLower.includes('stronger with you')) {
      // But only if it doesn't contain "emporio"
      if (!fragLower.includes('emporio')) {
        return 'Giorgio Armani';  
      }
    }
  }
  
  const normalized = normalizeBrandName(brandName);
  return normalized.canonical_name;
}

/**
 * Get brand hierarchy information
 */
export function getBrandHierarchy(brandName: string) {
  const normalized = normalizeBrandName(brandName);
  
  return {
    hasParent: normalized.parent_brand !== normalized.canonical_name,
    isSubBrand: normalized.sub_brand !== '',
    parentBrand: normalized.parent_brand,
    subBrand: normalized.sub_brand,
    displayName: normalized.canonical_name
  };
}

/**
 * Check if two brand names refer to the same brand family
 */
export function isSameBrandFamily(brand1: string, brand2: string): boolean {
  const norm1 = normalizeBrandName(brand1);
  const norm2 = normalizeBrandName(brand2);
  
  return norm1.parent_brand.toLowerCase() === norm2.parent_brand.toLowerCase();
}

/**
 * Get all related brands in the same family
 */
export function getBrandFamilyVariations(brandName: string): string[] {
  const normalized = normalizeBrandName(brandName);
  const parentBrand = normalized.parent_brand.toLowerCase();
  
  // Define brand family variations - Emporio and Giorgio are separate!
  const brandFamilies: Record<string, string[]> = {
    'emporio armani': ['Emporio Armani'],  // Separate brand
    'giorgio armani': ['Giorgio Armani'],  // Separate brand
    'armani': ['Armani'],                  // Generic armani (rare)
    'dior': ['Dior', 'Christian Dior'],
    'saint laurent': ['Yves Saint Laurent', 'YSL', 'Saint Laurent'],
    'ralph lauren': ['Ralph Lauren', 'Polo Ralph Lauren', 'Polo'],
    'hugo boss': ['Hugo Boss', 'Boss'],
    'dolce & gabbana': ['Dolce & Gabbana', 'D&G'],
    'calvin klein': ['Calvin Klein', 'CK']
  };
  
  return brandFamilies[parentBrand] || [normalized.canonical_name];
}

/**
 * Remove year information from fragrance names to avoid confusion about availability
 * Examples: "Homme Intense 2011" → "Homme Intense", "Aventus (2019)" → "Aventus"
 */
export function removeYearFromFragranceName(fragranceName: string): string {
  if (!fragranceName || typeof fragranceName !== 'string') {
    return fragranceName || '';
  }

  // Remove years in various formats
  const cleaned = fragranceName
    // Remove standalone years: "Fragrance 2011", "Fragrance 2019"
    .replace(/\s+(19|20)\d{2}(\s|$)/g, '$2')
    // Remove years in parentheses: "Fragrance (2011)", "Fragrance (2019)"
    .replace(/\s*\((19|20)\d{2}\)/g, '')
    // Remove years with hyphens: "Fragrance-2011", "Fragrance - 2019"
    .replace(/\s*-\s*(19|20)\d{2}/g, '')
    // Remove "Edition YYYY" patterns
    .replace(/\s+Edition\s+(19|20)\d{2}/gi, '')
    // Remove reformulation indicators: "New 2019", "Original 2011"
    .replace(/\s+(New|Original|Reformulated)\s+(19|20)\d{2}/gi, '')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Get clean fragrance name for display (WITHOUT concentration)
 * Enhanced to fix malformed names and separate concentration (SCE-49/51)
 * Following major platform patterns (Sephora, Ulta, FragranceX)
 */
export function getDisplayFragranceName(fragranceName: string, brandName?: string): string {
  // First remove years (existing functionality)
  let cleaned = removeYearFromFragranceName(fragranceName);
  
  // Apply basic normalization fixes for immediate launch improvement
  cleaned = cleaned
    // Fix common capitalization issues (SCE-49)
    .replace(/\bDe\b/g, 'de')         // "Bleu De EDP" → "Bleu de EDP"
    .replace(/\bAnd\b/g, 'and')       // "Beauty And Beast" → "Beauty and Beast"
    .replace(/\bOf\b/g, 'of')         // "Angel Of Death" → "Angel of Death"
    .replace(/\bThe\b/g, 'the')       // "The One" → "the One"
    
    // Fix Chanel number abbreviations (SCE-49/51)
    .replace(/\bN05\b/g, 'No 5')              // "N05 Eau Premiere" → "No 5 Eau Premiere"
    .replace(/\bN19\b/g, 'No 19')             // "N19" → "No 19"
    .replace(/\bN22\b/g, 'No 22')             // "N22" → "No 22"
    
    // Fix specific Chanel fragrance line completions (SCE-49/51)
    .replace(/^Bleu de$/g, 'Bleu de Chanel')  // "Bleu de" → "Bleu de Chanel"
    
    // Fix common all-caps issues
    .replace(/\bSAUVAGE\b/g, 'Sauvage')       // "SAUVAGE EDT" → "Sauvage EDT"
    .replace(/\bBLEU\b/g, 'Bleu')             // "BLEU DE" → "Bleu de"
    .replace(/\bPREMIERE\b/g, 'Premiere')     // "EAU PREMIERE" → "Eau Premiere"
    .replace(/\bEAU\b/g, 'Eau')               // "EAU DE PARFUM" → "Eau de Parfum"
    
    // REMOVE concentrations from name (will be shown separately)
    .replace(/\s+Eau de Parfum\s*$/gi, '')
    .replace(/\s+Eau de Toilette\s*$/gi, '')
    .replace(/\s+Eau de Cologne\s*$/gi, '')
    .replace(/\s+Extrait de Parfum\s*$/gi, '')
    .replace(/\s+Parfum\s*$/gi, '')
    .replace(/\s+EDP\s*$/gi, '')
    .replace(/\s+EDT\s*$/gi, '')
    .replace(/\s+EDC\s*$/gi, '')
    
    // Clean up spacing
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned;
}

/**
 * Extract concentration from fragrance name for separate display
 * Returns standardized concentration format for UI badges/subtitles
 */
export function extractConcentration(fragranceName: string): {
  name: string;
  concentration: string | null;
  abbreviation: string | null;
} {
  let name = fragranceName;
  let concentration: string | null = null;
  let abbreviation: string | null = null;

  // Define concentration patterns and their display formats
  const concentrationMap = [
    { pattern: /\bEau de Parfum\b/gi, display: 'Eau de Parfum', abbrev: 'EDP' },
    { pattern: /\bEau de Toilette\b/gi, display: 'Eau de Toilette', abbrev: 'EDT' },
    { pattern: /\bEau de Cologne\b/gi, display: 'Eau de Cologne', abbrev: 'EDC' },
    { pattern: /\bExtrait de Parfum\b/gi, display: 'Extrait de Parfum', abbrev: 'Extrait' },
    { pattern: /\bParfum\b/gi, display: 'Parfum', abbrev: 'Parfum' },
    { pattern: /\bEDP\b/gi, display: 'Eau de Parfum', abbrev: 'EDP' },
    { pattern: /\bEDT\b/gi, display: 'Eau de Toilette', abbrev: 'EDT' },
    { pattern: /\bEDC\b/gi, display: 'Eau de Cologne', abbrev: 'EDC' },
    { pattern: /\bCologne\b/gi, display: 'Eau de Cologne', abbrev: 'EDC' },
    { pattern: /\bAfter\s*shave\b/gi, display: 'Aftershave', abbrev: 'AS' }
  ];

  // Find and extract concentration
  for (const { pattern, display, abbrev } of concentrationMap) {
    if (pattern.test(name)) {
      concentration = display;
      abbreviation = abbrev;
      name = name.replace(pattern, '').trim();
      break;
    }
  }

  // Apply basic fixes to extracted name (avoid circular dependency)
  name = name
    .replace(/\bDe\b/g, 'de')
    .replace(/\bN05\b/g, 'No 5')
    .replace(/\bN19\b/g, 'No 19')
    .replace(/\bN22\b/g, 'No 22')
    .replace(/^Bleu de$/g, 'Bleu de Chanel')
    .replace(/\bSAUVAGE\b/g, 'Sauvage')
    .replace(/\bBLEU\b/g, 'Bleu')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    name,
    concentration,
    abbreviation
  };
}