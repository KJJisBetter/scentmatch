/**
 * Fragrance Data Validator
 * Validates fragrance data consistency and completeness for SCE-62 fixes
 * Spec: @.agent-os/specs/2025-08-22-beginner-experience-optimization/
 */

export interface FragranceValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions?: FamilySuggestion[]
  completenessScore: number
}

export interface FamilySuggestion {
  suggestedFamily: string | null
  confidence: number
  reason: string
}

export interface DataCompletenessMetrics {
  overallScore: number
  totalRecords: number
  completeRecords: number
  missingFamilyCount: number
  invalidFamilyCount: number
  emptyAccordsCount: number
  missingGenderCount: number
  missingNameCount: number
  missingBrandCount: number
}

// Valid fragrance families based on industry standards
const VALID_FRAGRANCE_FAMILIES = new Set([
  'oriental', 'amber', 'woody', 'woods', 'fresh', 'citrus', 'aquatic',
  'floral', 'white floral', 'gourmand', 'sweet', 'fougere', 'aromatic',
  'chypre', 'mossy', 'green', 'herbal', 'spicy', 'warm spicy',
  'leather', 'animalic', 'powdery', 'soft', 'fruity', 'tropical'
])

// Valid main accords
const VALID_MAIN_ACCORDS = new Set([
  'citrus', 'woody', 'floral', 'fresh', 'spicy', 'sweet', 'powdery',
  'warm spicy', 'green', 'fruity', 'aquatic', 'oriental', 'amber',
  'leather', 'smoky', 'vanilla', 'musky', 'earthy', 'herbal', 'aromatic',
  'rose', 'jasmine', 'lavender', 'bergamot', 'sandalwood', 'cedar',
  'patchouli', 'oud', 'iris', 'tuberose', 'ylang-ylang', 'neroli',
  'geranium', 'mint', 'basil', 'thyme', 'rosemary', 'sage', 'pine',
  'fir', 'juniper', 'oakmoss', 'vetiver', 'galbanum', 'petitgrain'
])

// Valid gender values
const VALID_GENDERS = new Set(['men', 'women', 'unisex'])

/**
 * Validates a fragrance family name
 */
export function validateFragranceFamily(family: string | null | undefined): boolean {
  if (!family || typeof family !== 'string') {
    return false
  }
  
  const normalized = family.toLowerCase().trim()
  return VALID_FRAGRANCE_FAMILIES.has(normalized)
}

/**
 * Suggests a correction for an invalid fragrance family
 */
export function suggestFamilyCorrection(family: string | null | undefined): FamilySuggestion {
  if (!family || typeof family !== 'string') {
    return { suggestedFamily: null, confidence: 0, reason: 'No family provided' }
  }

  const normalized = family.toLowerCase().trim()
  
  // Already valid
  if (VALID_FRAGRANCE_FAMILIES.has(normalized)) {
    return { suggestedFamily: normalized, confidence: 1.0, reason: 'Already valid' }
  }

  // Pattern matching for common variations
  const suggestions: Array<{ family: string; confidence: number; reason: string }> = []

  // Oriental/Amber patterns (check first for priority)
  if (normalized.includes('oriental') || normalized.includes('amber')) {
    suggestions.push({ family: 'oriental', confidence: 0.9, reason: 'Contains oriental/amber keywords' })
  }
  
  // Check for 'woods' specifically before 'woody'  
  else if (normalized.includes('woods')) {
    suggestions.push({ family: 'woods', confidence: 0.9, reason: 'Contains woods keyword' })
  }
  
  // Woody patterns
  else if (normalized.includes('wood') || normalized.includes('cedar') || 
      normalized.includes('sandalwood') || normalized.includes('pine')) {
    suggestions.push({ family: 'woody', confidence: 0.9, reason: 'Contains woody keywords' })
  }

  // Floral patterns
  else if (normalized.includes('floral') || normalized.includes('flower') ||
      normalized.includes('rose') || normalized.includes('jasmine') ||
      normalized.includes('lily') || normalized.includes('iris')) {
    suggestions.push({ family: 'floral', confidence: 0.9, reason: 'Contains floral keywords' })
  }

  // Fresh patterns (prioritize 'fresh' over 'citrus')
  else if (normalized.includes('fresh') || normalized.includes('marine') || 
      normalized.includes('aquatic') || normalized.includes('ocean') || 
      normalized.includes('water')) {
    suggestions.push({ family: 'fresh', confidence: 0.9, reason: 'Contains fresh/aquatic keywords' })
  }
  
  // Citrus patterns (separate from fresh)
  else if (normalized.includes('citrus')) {
    suggestions.push({ family: 'citrus', confidence: 0.9, reason: 'Contains citrus keywords' })
  }

  // Sweet/Gourmand patterns
  else if (normalized.includes('sweet') || normalized.includes('gourmand') ||
      normalized.includes('vanilla') || normalized.includes('caramel') ||
      normalized.includes('chocolate') || normalized.includes('honey')) {
    suggestions.push({ family: 'gourmand', confidence: 0.8, reason: 'Contains sweet/gourmand keywords' })
  }

  // Spicy patterns
  else if (normalized.includes('spic') || normalized.includes('pepper') ||
      normalized.includes('cinnamon') || normalized.includes('clove')) {
    suggestions.push({ family: 'spicy', confidence: 0.8, reason: 'Contains spicy keywords' })
  }

  // Green/Herbal patterns
  else if (normalized.includes('green') || normalized.includes('herb') ||
      normalized.includes('mint') || normalized.includes('basil')) {
    suggestions.push({ family: 'green', confidence: 0.8, reason: 'Contains green/herbal keywords' })
  }

  // Fruity patterns
  else if (normalized.includes('fruit') || normalized.includes('berry') ||
      normalized.includes('apple') || normalized.includes('peach')) {
    suggestions.push({ family: 'fruity', confidence: 0.8, reason: 'Contains fruity keywords' })
  }

  // Return best suggestion or null
  if (suggestions.length > 0) {
    const best = suggestions.reduce((a, b) => a.confidence > b.confidence ? a : b)
    return { suggestedFamily: best.family, confidence: best.confidence, reason: best.reason }
  }

  return { suggestedFamily: null, confidence: 0, reason: 'No suitable mapping found' }
}

/**
 * Validates main accords array
 */
export function validateMainAccords(accords: string[] | null | undefined): boolean {
  if (!accords || !Array.isArray(accords) || accords.length === 0) {
    return false
  }

  // Check for empty strings
  if (accords.some(accord => !accord || typeof accord !== 'string' || accord.trim() === '')) {
    return false
  }

  // Validate each accord (more lenient than families)
  return accords.every(accord => {
    const normalized = accord.toLowerCase().trim()
    return VALID_MAIN_ACCORDS.has(normalized) || normalized.length > 0
  })
}

/**
 * Validates a complete fragrance record
 */
export function validateFragranceRecord(record: any): FragranceValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: FamilySuggestion[] = []

  // Required field validation
  if (!record?.id || typeof record.id !== 'string' || record.id.trim() === '') {
    errors.push('Missing or invalid fragrance ID')
  }

  if (!record?.brand_id || typeof record.brand_id !== 'string' || record.brand_id.trim() === '') {
    errors.push('Missing or invalid brand_id')
  }

  if (!record?.name || typeof record.name !== 'string' || record.name.trim() === '') {
    errors.push('Missing or invalid fragrance name')
  }

  if (!record?.gender || !VALID_GENDERS.has(record.gender)) {
    errors.push('Missing or invalid gender (must be: men, women, unisex)')
  }

  // Fragrance family validation
  if (!validateFragranceFamily(record?.fragrance_family)) {
    errors.push('Missing or invalid fragrance family')
    
    const suggestion = suggestFamilyCorrection(record?.fragrance_family)
    if (suggestion.suggestedFamily) {
      suggestions.push(suggestion)
    }
  }

  // Main accords validation
  if (!validateMainAccords(record?.main_accords)) {
    errors.push('Missing or invalid main accords (must be non-empty array)')
  }

  // Optional field warnings
  if (!record?.launch_year || typeof record.launch_year !== 'number') {
    warnings.push('Missing launch year')
  }

  if (!record?.rating_value || typeof record.rating_value !== 'number') {
    warnings.push('Missing rating value')
  }

  if (!record?.image_url || typeof record.image_url !== 'string') {
    warnings.push('Missing image URL')
  }

  if (!record?.full_description || typeof record.full_description !== 'string') {
    warnings.push('Missing full description')
  }

  // Calculate completeness score
  const totalFields = 12 // Core fields we care about
  let completedFields = 0

  if (record?.id && typeof record.id === 'string' && record.id.trim()) completedFields++
  if (record?.brand_id && typeof record.brand_id === 'string' && record.brand_id.trim()) completedFields++
  if (record?.name && typeof record.name === 'string' && record.name.trim()) completedFields++
  if (record?.gender && VALID_GENDERS.has(record.gender)) completedFields++
  if (validateFragranceFamily(record?.fragrance_family)) completedFields++
  if (validateMainAccords(record?.main_accords)) completedFields++
  if (record?.launch_year && typeof record.launch_year === 'number') completedFields++
  if (record?.rating_value && typeof record.rating_value === 'number') completedFields++
  if (record?.image_url && typeof record.image_url === 'string') completedFields++
  if (record?.full_description && typeof record.full_description === 'string') completedFields++
  if (record?.perfumers && Array.isArray(record.perfumers) && record.perfumers.length > 0) completedFields++
  if (record?.top_notes && Array.isArray(record.top_notes) && record.top_notes.length > 0) completedFields++

  const completenessScore = completedFields / totalFields

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    completenessScore
  }
}

/**
 * Calculates data completeness metrics for a collection of fragrance records
 */
export function calculateDataCompletenessScore(records: any[]): DataCompletenessMetrics {
  if (!records || records.length === 0) {
    return {
      overallScore: 0.0,
      totalRecords: 0,
      completeRecords: 0,
      missingFamilyCount: 0,
      invalidFamilyCount: 0,
      emptyAccordsCount: 0,
      missingGenderCount: 0,
      missingNameCount: 0,
      missingBrandCount: 0
    }
  }

  let completeRecords = 0
  let missingFamilyCount = 0
  let invalidFamilyCount = 0
  let emptyAccordsCount = 0
  let missingGenderCount = 0
  let missingNameCount = 0
  let missingBrandCount = 0

  records.forEach(record => {
    if (!record) return

    // Count missing/invalid data
    if (!record.fragrance_family) {
      missingFamilyCount++
    } else if (!validateFragranceFamily(record.fragrance_family)) {
      invalidFamilyCount++
    }

    if (!validateMainAccords(record.main_accords)) {
      emptyAccordsCount++
    }

    if (!record.gender || !VALID_GENDERS.has(record.gender)) {
      missingGenderCount++
    }

    if (!record.name || typeof record.name !== 'string' || record.name.trim() === '') {
      missingNameCount++
    }

    if (!record.brand_id || typeof record.brand_id !== 'string' || record.brand_id.trim() === '') {
      missingBrandCount++
    }

    // Count complete records (all required fields valid)
    const hasValidFamily = validateFragranceFamily(record.fragrance_family)
    const hasValidAccords = validateMainAccords(record.main_accords)
    const hasValidGender = record.gender && VALID_GENDERS.has(record.gender)
    const hasValidName = record.name && typeof record.name === 'string' && record.name.trim() !== ''
    const hasValidBrand = record.brand_id && typeof record.brand_id === 'string' && record.brand_id.trim() !== ''
    
    if (hasValidFamily && hasValidAccords && hasValidGender && hasValidName && hasValidBrand) {
      completeRecords++
    }
  })

  const overallScore = records.length > 0 ? completeRecords / records.length : 0

  return {
    overallScore,
    totalRecords: records.length,
    completeRecords,
    missingFamilyCount,
    invalidFamilyCount,
    emptyAccordsCount,
    missingGenderCount,
    missingNameCount,
    missingBrandCount
  }
}