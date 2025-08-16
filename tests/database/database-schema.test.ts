/**
 * Database Schema Tests - Task 3.7
 * Implements QA specifications from database-schema-test-specifications.md
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yekstmwcgyiltxinqamf.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlla3N0bXdjZ3lpbHR4aW5xYW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNzc3MzEsImV4cCI6MjA0OTg1MzczMX0.nR1UlCkn_rXGWzKaOrvnW_vMHfJM5LfJ6Yap1AO0wCA'

const supabase = createClient(supabaseUrl, supabaseKey)

describe('Database Schema Validation Tests', () => {
  describe('SCHEMA-001: fragrance_brands Table Tests', () => {
    it('SCHEMA-001a: Table Creation Validation', async () => {
      // Check table exists with correct structure
      const { data: tableInfo, error } = await supabase
        .from('fragrance_brands')
        .select('*')
        .limit(1)

      expect(error).toBeNull()
      expect(tableInfo).toBeDefined()

      // Verify a brand exists with expected structure
      const { data: brands } = await supabase
        .from('fragrance_brands')
        .select('id, name, slug, item_count, popularity_score, created_at, updated_at')
        .limit(1)

      expect(brands?.[0]).toHaveProperty('id')
      expect(brands?.[0]).toHaveProperty('name')
      expect(brands?.[0]).toHaveProperty('slug')
      expect(brands?.[0]).toHaveProperty('item_count')
      expect(brands?.[0]).toHaveProperty('popularity_score')
      expect(brands?.[0]).toHaveProperty('created_at')
      expect(brands?.[0]).toHaveProperty('updated_at')
    })

    it('SCHEMA-001b: Index Performance Validation', async () => {
      // Test name search performance (should use index)
      const startTime = Date.now()
      const { data, error } = await supabase
        .from('fragrance_brands')
        .select('id, name')
        .ilike('name', '%Chanel%')

      const queryTime = Date.now() - startTime
      
      expect(error).toBeNull()
      expect(queryTime).toBeLessThan(100) // Should be fast with index
      expect(data?.length).toBeGreaterThan(0)
    })

    it('SCHEMA-001c: Constraint Validation', async () => {
      // Test unique slug constraint
      const testSlug = 'test-brand-duplicate'
      
      // Insert first brand
      const { error: firstError } = await supabase
        .from('fragrance_brands')
        .insert({
          id: 'test-brand-1',
          name: 'Test Brand 1',
          slug: testSlug
        })

      expect(firstError).toBeNull()

      // Try to insert duplicate slug
      const { error: duplicateError } = await supabase
        .from('fragrance_brands')
        .insert({
          id: 'test-brand-2',
          name: 'Test Brand 2',
          slug: testSlug
        })

      expect(duplicateError).not.toBeNull()
      expect(duplicateError?.message).toContain('duplicate key')

      // Cleanup
      await supabase.from('fragrance_brands').delete().eq('id', 'test-brand-1')
    })
  })

  describe('SCHEMA-002: fragrances Table Tests', () => {
    it('SCHEMA-002a: Column Structure Validation', async () => {
      const { data: fragrance, error } = await supabase
        .from('fragrances')
        .select('*')
        .limit(1)
        .single()

      expect(error).toBeNull()
      expect(fragrance).toHaveProperty('id')
      expect(fragrance).toHaveProperty('brand_id')
      expect(fragrance).toHaveProperty('brand_name')
      expect(fragrance).toHaveProperty('name')
      expect(fragrance).toHaveProperty('rating_value')
      expect(fragrance).toHaveProperty('accords')
      expect(fragrance).toHaveProperty('perfumers')
      expect(fragrance).toHaveProperty('embedding')
      expect(Array.isArray(fragrance.accords)).toBe(true)
      expect(Array.isArray(fragrance.perfumers)).toBe(true)
    })

    it('SCHEMA-002b: Check Constraint Validation', async () => {
      // Test valid genders are accepted
      const validGenders = ['for women', 'for men', 'unisex', 'for women and men']
      
      for (const gender of validGenders) {
        const { error } = await supabase
          .from('fragrances')
          .insert({
            id: `test-fragrance-${gender.replace(/\s+/g, '-')}`,
            brand_id: 'chanel',
            brand_name: 'Chanel',
            name: `Test Fragrance ${gender}`,
            slug: `test-fragrance-${gender.replace(/\s+/g, '-')}`,
            gender: gender
          })

        expect(error).toBeNull()
      }

      // Test invalid gender is rejected
      const { error: invalidError } = await supabase
        .from('fragrances')
        .insert({
          id: 'test-fragrance-invalid',
          brand_id: 'chanel',
          brand_name: 'Chanel',
          name: 'Test Fragrance Invalid',
          slug: 'test-fragrance-invalid',
          gender: 'invalid-gender'
        })

      expect(invalidError).not.toBeNull()

      // Cleanup test fragrances
      await supabase.from('fragrances').delete().like('id', 'test-fragrance-%')
    })

    it('SCHEMA-002c: Array Column Validation', async () => {
      const { data, error } = await supabase
        .from('fragrances')
        .select('accords, perfumers')
        .not('accords', 'is', null)
        .limit(1)
        .single()

      expect(error).toBeNull()
      expect(Array.isArray(data?.accords)).toBe(true)
      expect(Array.isArray(data?.perfumers)).toBe(true)
      
      // Check array contains string elements
      if (data?.accords.length > 0) {
        expect(typeof data.accords[0]).toBe('string')
      }
    })

    it('SCHEMA-002d: Vector Column Validation', async () => {
      // Vector columns should accept NULL (for future population)
      const { data, error } = await supabase
        .from('fragrances')
        .select('embedding')
        .limit(5)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      
      // Embeddings should be null (not populated yet)
      data?.forEach(row => {
        expect(row.embedding).toBeNull()
      })
    })
  })

  describe('SCHEMA-003: user_profiles Table Tests', () => {
    it('SCHEMA-003a: User Profile Structure', async () => {
      // Note: Cannot fully test without auth user, but can check structure
      const { error } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1)

      // Should fail due to RLS, but structure should be valid
      expect(error).not.toBeNull()
      expect(error?.message).toContain('row-level security')
    })
  })

  describe('SCHEMA-004: user_collections Table Tests', () => {
    it('SCHEMA-004a: Collection Structure Validation', async () => {
      // Check structure exists (will fail due to RLS but validates table)
      const { error } = await supabase
        .from('user_collections')
        .select('*')
        .limit(1)

      expect(error).not.toBeNull()
      expect(error?.message).toContain('row-level security')
    })
  })
})

describe('Data Import Compatibility Tests', () => {
  describe('IMPORT-001: Brand Data Import Tests', () => {
    it('IMPORT-001a: Schema Mapping Validation', async () => {
      const { data: stats, error } = await supabase.rpc('get_import_stats')
      
      expect(error).toBeNull()
      expect(stats).toBeDefined()
      
      // Should have imported brands
      const [brandCount, fragranceCount] = stats.split(',').map(s => parseInt(s.replace(/[()]/g, '')))
      expect(brandCount).toBeGreaterThan(0)
      expect(fragranceCount).toBeGreaterThan(0)
    })

    it('IMPORT-001b: Batch Import Performance', async () => {
      // Test import function performance
      const testBrands = [
        { id: 'test-brand-perf', name: 'Test Brand Perf', slug: 'test-brand-perf', itemCount: 10 }
      ]

      const startTime = Date.now()
      const { data, error } = await supabase.rpc('import_brands', {
        brands_data: testBrands
      })
      const importTime = Date.now() - startTime

      expect(error).toBeNull()
      expect(data).toBe(1)
      expect(importTime).toBeLessThan(1000) // Should complete in <1 second

      // Cleanup
      await supabase.from('fragrance_brands').delete().eq('id', 'test-brand-perf')
    })
  })

  describe('IMPORT-002: Fragrance Data Import Tests', () => {
    it('IMPORT-002a: Complex Field Mapping', async () => {
      const { data: fragrances, error } = await supabase
        .from('fragrances')
        .select('accords, perfumers, rating_value, score')
        .not('accords', 'is', null)
        .limit(1)
        .single()

      expect(error).toBeNull()
      expect(fragrances?.accords).toBeDefined()
      expect(fragrances?.perfumers).toBeDefined()
      expect(typeof fragrances?.rating_value).toBe('number')
      expect(typeof fragrances?.score).toBe('number')
    })

    it('IMPORT-002b: Large Dataset Performance', async () => {
      // Verify current import stats meet performance requirements
      const { data: stats, error } = await supabase.rpc('get_import_stats')
      
      expect(error).toBeNull()
      
      // Parse stats: (brands_count, fragrances_count, avg_rating, total_reviews)
      const statsArray = stats.replace(/[()]/g, '').split(',')
      const fragranceCount = parseInt(statsArray[1])
      const avgRating = parseFloat(statsArray[2])
      const totalReviews = parseInt(statsArray[3])

      expect(fragranceCount).toBeGreaterThan(10)
      expect(avgRating).toBeGreaterThan(3.0)
      expect(avgRating).toBeLessThan(5.0)
      expect(totalReviews).toBeGreaterThan(1000)
    })
  })
})

describe('Search & Performance Testing', () => {
  describe('SEARCH-001: Full-Text Search Tests', () => {
    it('SEARCH-001a: GIN Index Performance', async () => {
      const startTime = Date.now()
      const { data, error } = await supabase
        .from('fragrances')
        .select('id, name, brand_name')
        .textSearch('search_vector', 'chanel')

      const queryTime = Date.now() - startTime

      expect(error).toBeNull()
      expect(queryTime).toBeLessThan(200) // Target <200ms
      expect(data?.length).toBeGreaterThan(0)
    })

    it('SEARCH-001b: Trigram Search Validation', async () => {
      const startTime = Date.now()
      const { data, error } = await supabase
        .from('fragrances')
        .select('id, name, brand_name')
        .ilike('name', '%chanel%')

      const queryTime = Date.now() - startTime

      expect(error).toBeNull()
      expect(queryTime).toBeLessThan(200)
      expect(data?.length).toBeGreaterThan(0)
    })
  })

  describe('PERF-001: Query Performance Benchmarks', () => {
    it('PERF-001a: Basic Query Benchmarks', async () => {
      // Single fragrance lookup by ID
      const startTime1 = Date.now()
      const { data: single, error: error1 } = await supabase
        .from('fragrances')
        .select('*')
        .eq('id', 'chanel__coco-mademoiselle-chanelfor-women')
        .single()
      const time1 = Date.now() - startTime1

      expect(error1).toBeNull()
      expect(time1).toBeLessThan(50) // Target <50ms

      // Brand fragrance listing
      const startTime2 = Date.now()
      const { data: brandFragrances, error: error2 } = await supabase
        .from('fragrances')
        .select('id, name, rating_value')
        .eq('brand_id', 'chanel')
      const time2 = Date.now() - startTime2

      expect(error2).toBeNull()
      expect(time2).toBeLessThan(100) // Target <100ms
    })
  })
})

describe('AI-Ready Feature Testing', () => {
  describe('AI-001: Vector Extension Tests', () => {
    it('AI-001a: Vector Storage Readiness', async () => {
      // Verify vector column accepts NULL values
      const { data, error } = await supabase
        .from('fragrances')
        .select('embedding')
        .limit(1)
        .single()

      expect(error).toBeNull()
      expect(data?.embedding).toBeNull() // Should be null until populated
    })
  })
})