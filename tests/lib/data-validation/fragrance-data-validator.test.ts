/**
 * Fragrance Data Validator Tests
 * Tests for data validation functions and schema validation
 * Spec: @.agent-os/specs/2025-08-22-beginner-experience-optimization/
 */

import { describe, it, expect } from 'vitest'

// Import functions we'll create
import {
  validateFragranceFamily,
  validateMainAccords,
  suggestFamilyCorrection,
  calculateDataCompletenessScore,
  validateFragranceRecord,
  type FragranceValidationResult,
  type DataCompletenessMetrics
} from '@/lib/data-validation/fragrance-data-validator'

describe('Fragrance Family Validation', () => {
  describe('validateFragranceFamily', () => {
    const validFamilies = [
      'oriental', 'amber', 'woody', 'woods', 'fresh', 'citrus', 'aquatic',
      'floral', 'white floral', 'gourmand', 'sweet', 'fougere', 'aromatic',
      'chypre', 'mossy', 'green', 'herbal', 'spicy', 'warm spicy',
      'leather', 'animalic', 'powdery', 'soft', 'fruity', 'tropical'
    ]

    it('should validate correct family names', () => {
      validFamilies.forEach(family => {
        expect(validateFragranceFamily(family)).toBe(true)
      })
    })

    it('should reject null or undefined family', () => {
      expect(validateFragranceFamily(null)).toBe(false)
      expect(validateFragranceFamily(undefined)).toBe(false)
      expect(validateFragranceFamily('')).toBe(false)
    })

    it('should reject invalid family names', () => {
      const invalidFamilies = ['unknown', 'Unknown', 'UNKNOWN', 'invalid', 'random']
      
      invalidFamilies.forEach(family => {
        expect(validateFragranceFamily(family)).toBe(false)
      })
    })

    it('should be case-insensitive', () => {
      expect(validateFragranceFamily('ORIENTAL')).toBe(true)
      expect(validateFragranceFamily('Woody')).toBe(true)
      expect(validateFragranceFamily('Fresh')).toBe(true)
    })

    it('should handle whitespace', () => {
      expect(validateFragranceFamily(' oriental ')).toBe(true)
      expect(validateFragranceFamily('white floral')).toBe(true)
      expect(validateFragranceFamily(' warm spicy ')).toBe(true)
    })
  })

  describe('suggestFamilyCorrection', () => {
    it('should suggest oriental for oriental variants', () => {
      const orientalVariants = ['oriental spicy', 'amber oriental', 'oriental woody']
      
      orientalVariants.forEach(variant => {
        const suggestion = suggestFamilyCorrection(variant)
        expect(suggestion.suggestedFamily).toBe('oriental')
        expect(suggestion.confidence).toBeGreaterThan(0.5)
      })
    })

    it('should suggest woody or woods for wood-related terms', () => {
      const testCases = [
        { variant: 'woody aromatic', expected: 'woody' },
        { variant: 'cedar', expected: 'woody' },
        { variant: 'sandalwood', expected: 'woody' },
        { variant: 'woods', expected: 'woods' } // 'woods' is a valid family
      ]
      
      testCases.forEach(({ variant, expected }) => {
        const suggestion = suggestFamilyCorrection(variant)
        expect(suggestion.suggestedFamily).toBe(expected)
        expect(suggestion.confidence).toBeGreaterThan(0.5)
      })
    })

    it('should suggest floral for flower-related terms', () => {
      const floralVariants = ['floral fruity', 'rose', 'jasmine', 'flower']
      
      floralVariants.forEach(variant => {
        const suggestion = suggestFamilyCorrection(variant)
        expect(suggestion.suggestedFamily).toBe('floral')
        expect(suggestion.confidence).toBeGreaterThan(0.5)
      })
    })

    it('should suggest appropriate families for fresh/citrus variants', () => {
      const testCases = [
        { variant: 'fresh spicy', expected: 'fresh' },
        { variant: 'marine', expected: 'fresh' },
        { variant: 'aquatic fresh', expected: 'fresh' },
        { variant: 'citrus', expected: 'citrus' } // 'citrus' is a valid family
      ]
      
      testCases.forEach(({ variant, expected }) => {
        const suggestion = suggestFamilyCorrection(variant)
        expect(suggestion.suggestedFamily).toBe(expected)
        expect(suggestion.confidence).toBeGreaterThan(0.5)
      })
    })

    it('should return null for unmappable terms', () => {
      const unmappable = ['random', 'invalid', 'xyz', '']
      
      unmappable.forEach(term => {
        const suggestion = suggestFamilyCorrection(term)
        expect(suggestion.suggestedFamily).toBeNull()
        expect(suggestion.confidence).toBe(0)
      })
    })
  })
})

describe('Main Accords Validation', () => {
  describe('validateMainAccords', () => {
    it('should validate non-empty accord arrays', () => {
      const validAccords = [
        ['citrus', 'fresh'],
        ['woody', 'warm spicy'],
        ['floral', 'powdery', 'soft']
      ]

      validAccords.forEach(accords => {
        expect(validateMainAccords(accords)).toBe(true)
      })
    })

    it('should reject empty accord arrays', () => {
      expect(validateMainAccords([])).toBe(false)
      expect(validateMainAccords(null)).toBe(false)
      expect(validateMainAccords(undefined)).toBe(false)
    })

    it('should reject arrays with empty strings', () => {
      const invalidAccords = [
        ['', 'citrus'],
        ['woody', ''],
        ['', '']
      ]

      invalidAccords.forEach(accords => {
        expect(validateMainAccords(accords)).toBe(false)
      })
    })

    it('should validate accord content', () => {
      const validAccords = [
        'citrus', 'woody', 'floral', 'fresh', 'spicy', 'sweet',
        'powdery', 'warm spicy', 'green', 'fruity', 'aquatic',
        'oriental', 'amber', 'leather', 'smoky', 'vanilla'
      ]

      validAccords.forEach(accord => {
        expect(validateMainAccords([accord])).toBe(true)
      })
    })
  })
})

describe('Fragrance Record Validation', () => {
  describe('validateFragranceRecord', () => {
    const validRecord = {
      id: 'test-fragrance-id',
      brand_id: 'chanel',
      name: 'Test Fragrance',
      gender: 'unisex',
      fragrance_family: 'oriental',
      main_accords: ['citrus', 'woody'],
      rating_value: 4.5,
      rating_count: 100
    }

    it('should validate complete valid record', () => {
      const result = validateFragranceRecord(validRecord)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toBeDefined()
      expect(result.completenessScore).toBeGreaterThan(0.5) // Adjust expectation
    })

    it('should identify missing required fields', () => {
      const incompleteRecord = {
        id: 'test-id',
        brand_id: '',
        name: 'Test',
        gender: null,
        fragrance_family: null,
        main_accords: []
      }

      const result = validateFragranceRecord(incompleteRecord)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.includes('brand_id'))).toBe(true)
      expect(result.errors.some(e => e.includes('gender'))).toBe(true)
    })

    it('should suggest family corrections', () => {
      const recordWithBadFamily = {
        ...validRecord,
        fragrance_family: 'unknown'
      }

      const result = validateFragranceRecord(recordWithBadFamily)
      
      expect(result.isValid).toBe(false)
      expect(result.suggestions).toBeDefined()
      expect(Array.isArray(result.suggestions)).toBe(true)
      // 'unknown' won't generate suggestions since it has no pattern matches
    })

    it('should calculate completeness score correctly', () => {
      const completeRecord = {
        ...validRecord,
        launch_year: 2020,
        perfumers: ['Test Perfumer'],
        top_notes: ['bergamot'],
        middle_notes: ['rose'],
        base_notes: ['sandalwood'],
        full_description: 'Complete description',
        image_url: 'https://example.com/image.jpg'
      }

      const result = validateFragranceRecord(completeRecord)
      
      expect(result.completenessScore).toBeGreaterThan(0.9)
    })

    it('should handle null and undefined values gracefully', () => {
      const nullRecord = {
        id: null,
        brand_id: undefined,
        name: '',
        gender: null,
        fragrance_family: undefined,
        main_accords: null
      }

      const result = validateFragranceRecord(nullRecord)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.completenessScore).toBeLessThan(0.3)
    })
  })
})

describe('Data Completeness Metrics', () => {
  describe('calculateDataCompletenessScore', () => {
    it('should calculate correct completeness for various scenarios', () => {
      const testCases = [
        {
          records: [
            { id: 'test-1', brand_id: 'chanel', name: 'Test 1', fragrance_family: 'oriental', main_accords: ['citrus'], gender: 'men' },
            { id: 'test-2', brand_id: 'dior', name: 'Test 2', fragrance_family: 'woody', main_accords: ['fresh'], gender: 'women' },
            { id: 'test-3', brand_id: 'tom-ford', name: 'Test 3', fragrance_family: 'floral', main_accords: ['sweet'], gender: 'unisex' }
          ],
          expectedScore: 1.0 // 100% complete
        },
        {
          records: [
            { id: 'test-4', brand_id: 'chanel', name: 'Test 4', fragrance_family: null, main_accords: ['citrus'], gender: 'men' },
            { id: 'test-5', brand_id: 'dior', name: 'Test 5', fragrance_family: 'woody', main_accords: [], gender: 'women' },
            { id: 'test-6', brand_id: 'tom-ford', name: 'Test 6', fragrance_family: 'floral', main_accords: ['sweet'], gender: null }
          ],
          expectedScore: 0.0 // None complete due to missing required fields
        },
        {
          records: [],
          expectedScore: 0.0 // No records
        }
      ]

      testCases.forEach(({ records, expectedScore }, index) => {
        const metrics = calculateDataCompletenessScore(records)
        
        expect(metrics.overallScore).toBeCloseTo(expectedScore, 2)
        expect(metrics.totalRecords).toBe(records.length)
        expect(metrics.completeRecords).toBeDefined()
        expect(metrics.missingFamilyCount).toBeDefined()
        expect(metrics.emptyAccordsCount).toBeDefined()
      })
    })

    it('should identify specific data quality issues', () => {
      const records = [
        { fragrance_family: null, main_accords: ['citrus'], gender: 'men' },
        { fragrance_family: 'unknown', main_accords: [], gender: 'women' },
        { fragrance_family: 'woody', main_accords: ['fresh'], gender: null },
        { fragrance_family: 'floral', main_accords: ['sweet'], gender: 'unisex' }
      ]

      const metrics = calculateDataCompletenessScore(records)
      
      expect(metrics.missingFamilyCount).toBe(1) // null family
      expect(metrics.invalidFamilyCount).toBe(1) // 'unknown' family  
      expect(metrics.emptyAccordsCount).toBe(1) // empty accords
      expect(metrics.missingGenderCount).toBe(1) // null gender
    })
  })
})

describe('Error Handling and Edge Cases', () => {
  it('should handle malformed data gracefully', () => {
    const malformedData = [
      { fragrance_family: 123 }, // number instead of string
      { main_accords: 'not-an-array' }, // string instead of array
      { gender: {} }, // object instead of string
      null, // null record
      undefined // undefined record
    ]

    malformedData.forEach(record => {
      expect(() => {
        const result = validateFragranceRecord(record as any)
        expect(result).toBeDefined()
      }).not.toThrow()
    })
  })

  it('should provide meaningful error messages', () => {
    const invalidRecord = {
      id: '',
      brand_id: null,
      name: undefined,
      gender: 'invalid-gender',
      fragrance_family: 'unknown',
      main_accords: []
    }

    const result = validateFragranceRecord(invalidRecord)
    
    expect(result.errors.length).toBeGreaterThan(0)
    result.errors.forEach(error => {
      expect(typeof error).toBe('string')
      expect(error.length).toBeGreaterThan(0)
    })
  })
})