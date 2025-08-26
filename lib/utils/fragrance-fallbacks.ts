/**
 * Fragrance Data Fallback Utilities
 * Provides graceful handling for missing fragrance data (SCE-62, SCE-64)
 * Spec: @.agent-os/specs/2025-08-22-beginner-experience-optimization/
 */

export interface FragranceWithFallbacks {
  id: string
  name: string
  brand_id: string
  display_name: string
  display_family: string
  display_accords: string[]
  display_image: string
  display_rating: number | null
  display_description: string
  has_missing_data: boolean
  missing_fields: string[]
}

const DEFAULT_FAMILY_LABELS = {
  'oriental': 'Oriental & Amber',
  'amber': 'Oriental & Amber', 
  'woody': 'Woody',
  'woods': 'Woody',
  'fresh': 'Fresh & Clean',
  'citrus': 'Fresh & Citrus',
  'aquatic': 'Fresh & Aquatic',
  'floral': 'Floral',
  'white floral': 'White Floral',
  'gourmand': 'Sweet & Gourmand',
  'sweet': 'Sweet & Gourmand',
  'fougere': 'Aromatic Fougere',
  'aromatic': 'Aromatic',
  'chypre': 'Chypre',
  'mossy': 'Chypre & Mossy',
  'green': 'Green & Herbal',
  'herbal': 'Green & Herbal',
  'spicy': 'Spicy',
  'warm spicy': 'Warm Spicy',
  'leather': 'Leather',
  'animalic': 'Animalic',
  'powdery': 'Soft & Powdery',
  'soft': 'Soft & Powdery',
  'fruity': 'Fruity',
  'tropical': 'Tropical'
}

const FALLBACK_ACCORDS = [
  'aromatic', 'fresh', 'warm', 'sophisticated'
]

const FALLBACK_DESCRIPTIONS = {
  'oriental': 'A warm and sophisticated fragrance with rich, exotic notes',
  'amber': 'A warm and inviting fragrance with amber and resinous notes',
  'woody': 'A natural and grounding fragrance with wood-based notes',
  'fresh': 'A clean and invigorating fragrance perfect for everyday wear',
  'citrus': 'A bright and energizing fragrance with fresh citrus notes',
  'floral': 'A romantic and elegant fragrance with beautiful flower notes',
  'gourmand': 'A delicious and comforting fragrance with sweet, edible notes',
  'spicy': 'A dynamic and warming fragrance with exotic spice notes',
  'green': 'A natural and crisp fragrance with green, herbal notes',
  'fruity': 'A playful and fresh fragrance with juicy fruit notes'
}

/**
 * Provides fallback image URL for fragrances
 */
export function getFragranceFallbackImage(fragrance: any): string {
  // Try multiple image sources
  if (fragrance.image_url && typeof fragrance.image_url === 'string') {
    return fragrance.image_url
  }
  
  // Use gender and family for fallback image
  const gender = fragrance.gender || 'unisex'
  const family = fragrance.fragrance_family || 'unknown'
  
  return `/images/fallback/fragrance-${gender}-${family}.svg`
}

/**
 * Provides fallback family display name
 */
export function getFragranceFamilyDisplay(family: string | null | undefined): string {
  if (!family || typeof family !== 'string') {
    return 'Signature Fragrance'
  }
  
  const normalized = family.toLowerCase().trim()
  return DEFAULT_FAMILY_LABELS[normalized as keyof typeof DEFAULT_FAMILY_LABELS] || 
         family.charAt(0).toUpperCase() + family.slice(1)
}

/**
 * Provides fallback main accords
 */
export function getFragranceAccordsDisplay(accords: string[] | null | undefined): string[] {
  if (accords && Array.isArray(accords) && accords.length > 0) {
    return accords.filter(accord => accord && typeof accord === 'string' && accord.trim() !== '')
  }
  
  return FALLBACK_ACCORDS
}

/**
 * Provides fallback description based on family
 */
export function getFragranceDescriptionFallback(fragrance: any): string {
  if (fragrance.full_description && typeof fragrance.full_description === 'string') {
    return fragrance.full_description
  }
  
  if (fragrance.short_description && typeof fragrance.short_description === 'string') {
    return fragrance.short_description
  }
  
  const family = fragrance.fragrance_family || 'fresh'
  const normalized = family.toLowerCase().trim()
  
  const baseDescription = FALLBACK_DESCRIPTIONS[normalized as keyof typeof FALLBACK_DESCRIPTIONS] || 
                         'A distinctive fragrance with unique character and appeal'
  
  // Add brand context if available
  if (fragrance.brand_id) {
    const brandName = fragrance.brand_id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    return `${baseDescription}. Crafted by ${brandName} with attention to quality and style.`
  }
  
  return baseDescription
}

/**
 * Provides fallback display name
 */
export function getFragranceDisplayName(fragrance: any): string {
  if (fragrance.name && typeof fragrance.name === 'string' && fragrance.name.trim() !== '') {
    return fragrance.name.trim()
  }
  
  return 'Signature Fragrance'
}

/**
 * Provides fallback rating
 */
export function getFragranceRatingDisplay(fragrance: any): number | null {
  if (fragrance.rating_value && typeof fragrance.rating_value === 'number') {
    return Math.round(fragrance.rating_value * 10) / 10 // Round to 1 decimal
  }
  
  return null // Don't show fake ratings
}

/**
 * Main function to add fallbacks to fragrance data
 */
export function addFragranceFallbacks(fragrance: any): FragranceWithFallbacks {
  const missingFields: string[] = []
  
  // Check for missing required fields
  if (!fragrance.fragrance_family) missingFields.push('family')
  if (!fragrance.main_accords || fragrance.main_accords.length === 0) missingFields.push('accords')
  if (!fragrance.image_url) missingFields.push('image')
  if (!fragrance.full_description && !fragrance.short_description) missingFields.push('description')
  if (!fragrance.rating_value) missingFields.push('rating')
  
  return {
    id: fragrance.id || '',
    name: fragrance.name || '',
    brand_id: fragrance.brand_id || '',
    display_name: getFragranceDisplayName(fragrance),
    display_family: getFragranceFamilyDisplay(fragrance.fragrance_family),
    display_accords: getFragranceAccordsDisplay(fragrance.main_accords),
    display_image: getFragranceFallbackImage(fragrance),
    display_rating: getFragranceRatingDisplay(fragrance),
    display_description: getFragranceDescriptionFallback(fragrance),
    has_missing_data: missingFields.length > 0,
    missing_fields: missingFields
  }
}

/**
 * Batch process multiple fragrances with fallbacks
 */
export function addFragranceFallbacksBatch(fragrances: any[]): FragranceWithFallbacks[] {
  if (!Array.isArray(fragrances)) {
    return []
  }
  
  return fragrances.map(fragrance => addFragranceFallbacks(fragrance))
}

/**
 * Check if fragrance has critical missing data
 */
export function hasFragranceCriticalIssues(fragrance: any): boolean {
  const criticalFields = ['name', 'brand_id', 'fragrance_family']
  
  return criticalFields.some(field => {
    const value = fragrance[field]
    return !value || (typeof value === 'string' && value.trim() === '')
  })
}

/**
 * Get quality score for fragrance completeness (0-1)
 */
export function getFragranceQualityScore(fragrance: any): number {
  const fields = [
    'name', 'brand_id', 'fragrance_family', 'main_accords', 'image_url',
    'full_description', 'rating_value', 'launch_year', 'gender'
  ]
  
  let score = 0
  
  fields.forEach(field => {
    const value = fragrance[field]
    
    if (field === 'main_accords') {
      if (value && Array.isArray(value) && value.length > 0) score += 1
    } else if (value !== null && value !== undefined && value !== '') {
      score += 1
    }
  })
  
  return score / fields.length
}

/**
 * Generate user-friendly error messages for missing data
 */
export function getFragranceDataStatusMessage(fragrance: any): string | null {
  const issues = []
  
  if (!fragrance.fragrance_family) {
    issues.push('fragrance family')
  }
  
  if (!fragrance.main_accords || fragrance.main_accords.length === 0) {
    issues.push('fragrance notes')
  }
  
  if (!fragrance.image_url) {
    issues.push('product image')
  }
  
  if (issues.length === 0) {
    return null
  }
  
  if (issues.length === 1) {
    return `Missing ${issues[0]} information`
  }
  
  return `Missing ${issues.slice(0, -1).join(', ')} and ${issues[issues.length - 1]} information`
}