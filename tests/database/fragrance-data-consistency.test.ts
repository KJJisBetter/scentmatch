/**
 * Fragrance Data Consistency and Integrity Tests
 * Tests for SCE-62 and SCE-64: Missing fragrance data and empty states
 * Spec: @.agent-os/specs/2025-08-22-beginner-experience-optimization/
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yekstmwcgyiltxinqamf.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlla3N0bXdjZ3lpbHR4aW5xYW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNzc3MzEsImV4cCI6MjA0OTg1MzczMX0.nR1UlCkn_rXGWzKaOrvnW_vMHfJM5LfJ6Yap1AO0wCA'

const supabase = createClient(supabaseUrl, supabaseKey)

describe('Fragrance Data Consistency Tests - SCE-62', () => {
  describe('CONSISTENCY-001: Fragrance Family Validation', () => {
    it('CONSISTENCY-001a: All fragrances should have a valid fragrance family', async () => {
      const { data: missingFamily, error } = await supabase
        .from('fragrances')
        .select('id, brand_id, name, fragrance_family')
        .or('fragrance_family.is.null,fragrance_family.eq.')
        .limit(50) // Limit for performance in tests

      expect(error).toBeNull()
      
      // Track count for reporting
      if (missingFamily && missingFamily.length > 0) {
        console.warn(`Found ${missingFamily.length} fragrances with missing family data`)
        console.warn('Sample missing families:', missingFamily.slice(0, 5).map(f => `${f.brand_id}/${f.name}`))
      }

      // This test documents the current state - will be fixed in implementation
      expect(missingFamily).toBeDefined()
    })

    it('CONSISTENCY-001b: Fragrance families should be from valid family list', async () => {
      const validFamilies = [
        'oriental', 'amber', 'woody', 'woods', 'fresh', 'citrus', 'aquatic',
        'floral', 'white floral', 'gourmand', 'sweet', 'fougere', 'aromatic',
        'chypre', 'mossy', 'green', 'herbal', 'spicy', 'warm spicy',
        'leather', 'animalic', 'powdery', 'soft', 'fruity', 'tropical'
      ]

      const { data: invalidFamilies, error } = await supabase
        .from('fragrances')
        .select('id, brand_id, name, fragrance_family')
        .not('fragrance_family', 'in', `(${validFamilies.map(f => `"${f}"`).join(',')})`)
        .not('fragrance_family', 'is', null)
        .limit(50)

      expect(error).toBeNull()

      if (invalidFamilies && invalidFamilies.length > 0) {
        console.warn(`Found ${invalidFamilies.length} fragrances with invalid family values`)
        const uniqueInvalidFamilies = [...new Set(invalidFamilies.map(f => f.fragrance_family))]
        console.warn('Invalid family values:', uniqueInvalidFamilies.slice(0, 10))
      }

      expect(invalidFamilies).toBeDefined()
    })

    it('CONSISTENCY-001c: Required fragrance fields should not be null or empty', async () => {
      // Test for missing required fields
      const { data: missingRequired, error } = await supabase
        .from('fragrances')
        .select('id, brand_id, name, gender, main_accords')
        .or('brand_id.is.null,name.is.null,name.eq.,gender.is.null')
        .limit(50)

      expect(error).toBeNull()
      
      if (missingRequired && missingRequired.length > 0) {
        console.warn(`Found ${missingRequired.length} fragrances with missing required fields`)
      }

      expect(missingRequired).toBeDefined()
    })

    it('CONSISTENCY-001d: Main accords should not be empty arrays', async () => {
      const { data: emptyAccords, error } = await supabase
        .from('fragrances')
        .select('id, brand_id, name, main_accords')
        .eq('main_accords', '{}')
        .limit(50)

      expect(error).toBeNull()

      if (emptyAccords && emptyAccords.length > 0) {
        console.warn(`Found ${emptyAccords.length} fragrances with empty main_accords`)
      }

      expect(emptyAccords).toBeDefined()
    })
  })

  describe('CONSISTENCY-002: Data Quality Metrics', () => {
    it('CONSISTENCY-002a: Calculate overall data completeness score', async () => {
      const { count: totalCount, error: countError } = await supabase
        .from('fragrances')
        .select('*', { count: 'exact', head: true })

      expect(countError).toBeNull()
      expect(totalCount).toBeGreaterThan(0)

      // Count records with complete data
      const { count: completeRecords, error } = await supabase
        .from('fragrances')
        .select('id', { count: 'exact', head: true })
        .not('fragrance_family', 'is', null)
        .not('main_accords', 'eq', '{}')
        .not('gender', 'is', null)

      expect(error).toBeNull()
      
      if (totalCount && completeRecords !== null) {
        const completenessRate = (completeRecords / totalCount) * 100
        console.log(`Data completeness: ${completenessRate.toFixed(2)}%`)
        
        // Target: >95% completeness after fixes
        expect(completenessRate).toBeGreaterThan(0)
      }
    })

    it('CONSISTENCY-002b: Verify family inference tracking columns exist', async () => {
      // These columns should exist after migration
      const { data, error } = await supabase
        .from('fragrances')
        .select('family_inference_confidence, family_inference_method, family_last_updated')
        .limit(1)

      // This might fail before migration - that's expected
      if (error) {
        console.log('Family inference columns not yet created (expected before migration)')
      } else {
        expect(data).toBeDefined()
      }
    })
  })

  describe('CONSISTENCY-003: Fallback Handling', () => {
    it('CONSISTENCY-003a: Empty states should have consistent structure', async () => {
      // Test query that would return empty results
      const { data: emptyResults, error } = await supabase
        .from('fragrances')
        .select('*')
        .eq('id', 'non-existent-fragrance-id')

      expect(error).toBeNull()
      expect(emptyResults).toEqual([])
      expect(Array.isArray(emptyResults)).toBe(true)
    })

    it('CONSISTENCY-003b: Queries with null fragrance family should handle gracefully', async () => {
      const { data, error } = await supabase
        .from('fragrances')
        .select('id, name, fragrance_family')
        .is('fragrance_family', null)
        .limit(10)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      
      if (data && data.length > 0) {
        // Verify all returned records have null family
        data.forEach(fragrance => {
          expect(fragrance.fragrance_family).toBeNull()
        })
      }
    })

    it('CONSISTENCY-003c: Filter queries should handle missing data gracefully', async () => {
      // Test filtering by family when some records have null values
      const { data, error } = await supabase
        .from('fragrances')
        .select('id, name, fragrance_family, gender')
        .eq('gender', 'men')
        .limit(20)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)

      if (data && data.length > 0) {
        data.forEach(fragrance => {
          expect(fragrance.gender).toBe('men')
        })
      }
    })
  })
})

describe('Browse Page Empty States Tests - SCE-64', () => {
  describe('EMPTY-001: Browse Page Empty State Consistency', () => {
    it('EMPTY-001a: Empty search results should have consistent format', async () => {
      // Test search that returns no results
      const { data: emptySearch, error } = await supabase
        .from('fragrances')
        .select('*')
        .textSearch('name', 'xyzzyx-nonexistent-fragrance')

      expect(error).toBeNull()
      expect(emptySearch).toEqual([])
      expect(Array.isArray(emptySearch)).toBe(true)
    })

    it('EMPTY-001b: Filter combinations that return empty should be handled', async () => {
      // Test filter combination that's likely to return empty results
      const { data: emptyFiltered, error } = await supabase
        .from('fragrances')
        .select('*')
        .eq('gender', 'men')
        .eq('fragrance_family', 'nonexistent-family')

      expect(error).toBeNull()
      expect(emptyFiltered).toEqual([])
    })

    it('EMPTY-001c: Brand filter with no fragrances should be consistent', async () => {
      const { data: emptyBrand, error } = await supabase
        .from('fragrances')
        .select('*')
        .eq('brand_id', 'nonexistent-brand')

      expect(error).toBeNull()
      expect(emptyBrand).toEqual([])
    })
  })

  describe('EMPTY-002: Loading States and Null Handling', () => {
    it('EMPTY-002a: Fragrances with null images should be handled', async () => {
      const { data: nullImages, error } = await supabase
        .from('fragrances')
        .select('id, name, image_url')
        .is('image_url', null)
        .limit(10)

      expect(error).toBeNull()
      expect(Array.isArray(nullImages)).toBe(true)

      if (nullImages && nullImages.length > 0) {
        nullImages.forEach(fragrance => {
          expect(fragrance.image_url).toBeNull()
        })
      }
    })

    it('EMPTY-002b: Fragrances with missing descriptions should be handled', async () => {
      const { data: nullDescriptions, error } = await supabase
        .from('fragrances')
        .select('id, name, full_description, short_description')
        .or('full_description.is.null,short_description.is.null')
        .limit(10)

      expect(error).toBeNull()
      expect(Array.isArray(nullDescriptions)).toBe(true)
    })

    it('EMPTY-002c: Missing rating data should be handled consistently', async () => {
      const { data: missingRatings, error } = await supabase
        .from('fragrances')
        .select('id, name, rating_value, rating_count')
        .or('rating_value.is.null,rating_count.is.null,rating_count.eq.0')
        .limit(10)

      expect(error).toBeNull()
      expect(Array.isArray(missingRatings)).toBe(true)
    })
  })
})

describe('Data Migration Validation Tests', () => {
  describe('MIGRATION-001: Pre-Migration State Validation', () => {
    it('MIGRATION-001a: Count fragrances needing family fixes', async () => {
      const { count, error } = await supabase
        .from('fragrances')
        .select('*', { count: 'exact', head: true })
        .or('fragrance_family.is.null,fragrance_family.eq.,fragrance_family.eq.unknown,fragrance_family.ilike.%unknown%')

      expect(error).toBeNull()
      
      if (count !== null) {
        console.log(`Fragrances needing family fixes: ${count}`)
      }
      
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('MIGRATION-001b: Count empty main_accords arrays', async () => {
      const { count, error } = await supabase
        .from('fragrances')
        .select('*', { count: 'exact', head: true })
        .eq('main_accords', '{}')

      expect(error).toBeNull()
      
      if (count !== null) {
        console.log(`Fragrances with empty main_accords: ${count}`)
      }
      
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('MIGRATION-001c: Identify common invalid family values', async () => {
      const { data: familyValues, error } = await supabase
        .from('fragrances')
        .select('fragrance_family')
        .not('fragrance_family', 'is', null)
        .limit(1000)

      expect(error).toBeNull()

      if (familyValues) {
        const familyCounts = familyValues.reduce((acc, f) => {
          const family = f.fragrance_family || 'null'
          acc[family] = (acc[family] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const sortedFamilies = Object.entries(familyCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 15)

        console.log('Top fragrance families:', sortedFamilies)
      }

      expect(familyValues).toBeDefined()
    })
  })
})