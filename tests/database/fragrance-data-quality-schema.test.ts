/**
 * Fragrance Data Quality System - Database Schema Tests  
 * Tests canonical fragrance schema, variants tracking, and quality monitoring
 * Spec: @.agent-os/specs/2025-08-20-fragrance-data-quality-system/
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yekstmwcgyiltxinqamf.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlla3N0bXdjZ3lpbHR4aW5xYW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNzc3MzEsImV4cCI6MjA0OTg1MzczMX0.nR1UlCkn_rXGWzKaOrvnW_vMHfJM5LfJ6Yap1AO0wCA'

const supabase = createClient(supabaseUrl, supabaseKey)

describe('Fragrance Data Quality System - Schema Tests', () => {
  describe('CANONICAL-001: fragrances_canonical Table Structure', () => {
    it('CANONICAL-001a: Table Creation and Basic Structure', async () => {
      // Test table exists with expected columns
      const { data, error } = await supabase
        .from('fragrances_canonical')
        .select('id, canonical_name, brand_id, fragrance_line, concentration, quality_score')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('CANONICAL-001b: Required Constraints Validation', async () => {
      // Test canonical name is required
      const { error: missingNameError } = await supabase
        .from('fragrances_canonical')
        .insert({
          brand_id: 'test-brand-id',
          fragrance_line: 'Test Line'
        })

      expect(missingNameError).not.toBeNull()
      expect(missingNameError?.message).toContain('canonical_name')

      // Test fragrance line is required
      const { error: missingLineError } = await supabase
        .from('fragrances_canonical')
        .insert({
          canonical_name: 'Test Fragrance',
          brand_id: 'test-brand-id'
        })

      expect(missingLineError).not.toBeNull()
      expect(missingLineError?.message).toContain('fragrance_line')
    })

    it('CANONICAL-001c: Unique Constraint on Canonical Name + Brand', async () => {
      const testCanonical = {
        canonical_name: 'Test Canonical Unique',
        brand_id: 'chanel', // Use existing brand
        fragrance_line: 'Test Line'
      }

      // Insert first record
      const { data: first, error: firstError } = await supabase
        .from('fragrances_canonical')
        .insert(testCanonical)
        .select()

      expect(firstError).toBeNull()
      expect(first).toBeDefined()

      // Try to insert duplicate
      const { error: duplicateError } = await supabase
        .from('fragrances_canonical')
        .insert(testCanonical)

      expect(duplicateError).not.toBeNull()
      expect(duplicateError?.message).toContain('duplicate key')

      // Cleanup
      await supabase
        .from('fragrances_canonical')
        .delete()
        .eq('canonical_name', 'Test Canonical Unique')
    })

    it('CANONICAL-001d: Vector Embedding Column Validation', async () => {
      // Test embedding column accepts vector data
      const testEmbedding = Array(1536).fill(0.1)
      
      const { data, error } = await supabase
        .from('fragrances_canonical')
        .insert({
          canonical_name: 'Test Embedding Fragrance',
          brand_id: 'chanel',
          fragrance_line: 'Test Line',
          embedding: testEmbedding
        })
        .select()

      expect(error).toBeNull()
      expect(data?.[0]?.embedding).toBeDefined()

      // Cleanup
      await supabase
        .from('fragrances_canonical')
        .delete()
        .eq('canonical_name', 'Test Embedding Fragrance')
    })

    it('CANONICAL-001e: Quality Score Default and Range', async () => {
      const { data, error } = await supabase
        .from('fragrances_canonical')
        .insert({
          canonical_name: 'Test Quality Score',
          brand_id: 'chanel',
          fragrance_line: 'Test Line'
        })
        .select('quality_score')

      expect(error).toBeNull()
      expect(data?.[0]?.quality_score).toBe(0.0) // Default value

      // Cleanup
      await supabase
        .from('fragrances_canonical')
        .delete()
        .eq('canonical_name', 'Test Quality Score')
    })
  })

  describe('VARIANTS-001: fragrance_variants Table Structure', () => {
    let testCanonicalId: string

    beforeAll(async () => {
      // Create test canonical fragrance
      const { data, error } = await supabase
        .from('fragrances_canonical')
        .insert({
          canonical_name: 'Test Canonical for Variants',
          brand_id: 'chanel',
          fragrance_line: 'Test Line'
        })
        .select('id')
        .single()

      expect(error).toBeNull()
      testCanonicalId = data.id
    })

    afterAll(async () => {
      // Cleanup test data
      await supabase
        .from('fragrance_variants')
        .delete()
        .eq('canonical_id', testCanonicalId)
      
      await supabase
        .from('fragrances_canonical')
        .delete()
        .eq('id', testCanonicalId)
    })

    it('VARIANTS-001a: Basic Variant Creation', async () => {
      const { data, error } = await supabase
        .from('fragrance_variants')
        .insert({
          canonical_id: testCanonicalId,
          variant_name: 'Test Variant Name',
          source: 'manual',
          confidence: 0.95
        })
        .select()

      expect(error).toBeNull()
      expect(data?.[0]).toHaveProperty('id')
      expect(data?.[0]?.variant_name).toBe('Test Variant Name')
      expect(data?.[0]?.confidence).toBe(0.95)
    })

    it('VARIANTS-001b: Source Type Constraint', async () => {
      // Test valid source types
      const validSources = ['user_input', 'import', 'ocr', 'manual']
      
      for (const source of validSources) {
        const { error } = await supabase
          .from('fragrance_variants')
          .insert({
            canonical_id: testCanonicalId,
            variant_name: `Test Variant ${source}`,
            source: source
          })

        expect(error).toBeNull()
      }

      // Test invalid source type
      const { error: invalidError } = await supabase
        .from('fragrance_variants')
        .insert({
          canonical_id: testCanonicalId,
          variant_name: 'Invalid Source Variant',
          source: 'invalid_source'
        })

      expect(invalidError).not.toBeNull()
      expect(invalidError?.message).toContain('check constraint')
    })

    it('VARIANTS-001c: Confidence Score Range Validation', async () => {
      // Test confidence within valid range
      const { error: validError } = await supabase
        .from('fragrance_variants')
        .insert({
          canonical_id: testCanonicalId,
          variant_name: 'Valid Confidence Variant',
          confidence: 0.8
        })

      expect(validError).toBeNull()

      // Test confidence outside range (> 1.0)
      const { error: highError } = await supabase
        .from('fragrance_variants')
        .insert({
          canonical_id: testCanonicalId,
          variant_name: 'High Confidence Variant',
          confidence: 1.5
        })

      expect(highError).not.toBeNull()
      expect(highError?.message).toContain('check constraint')

      // Test confidence outside range (< 0.0)
      const { error: lowError } = await supabase
        .from('fragrance_variants')
        .insert({
          canonical_id: testCanonicalId,
          variant_name: 'Low Confidence Variant',
          confidence: -0.1
        })

      expect(lowError).not.toBeNull()
      expect(lowError?.message).toContain('check constraint')
    })

    it('VARIANTS-001d: Unique Variant Name Constraint', async () => {
      const testVariantName = 'Unique Variant Test'
      
      // Insert first variant
      const { error: firstError } = await supabase
        .from('fragrance_variants')
        .insert({
          canonical_id: testCanonicalId,
          variant_name: testVariantName,
          source: 'manual'
        })

      expect(firstError).toBeNull()

      // Try to insert duplicate variant name
      const { error: duplicateError } = await supabase
        .from('fragrance_variants')
        .insert({
          canonical_id: testCanonicalId,
          variant_name: testVariantName,
          source: 'import'
        })

      expect(duplicateError).not.toBeNull()
      expect(duplicateError?.message).toContain('duplicate key')
    })

    it('VARIANTS-001e: Foreign Key Constraint', async () => {
      // Test foreign key constraint with non-existent canonical ID
      const { error } = await supabase
        .from('fragrance_variants')
        .insert({
          canonical_id: '00000000-0000-0000-0000-000000000000',
          variant_name: 'Orphan Variant',
          source: 'manual'
        })

      expect(error).not.toBeNull()
      expect(error?.message).toContain('foreign key constraint')
    })
  })

  describe('MISSING-001: missing_product_requests Table Structure', () => {
    it('MISSING-001a: Basic Request Logging', async () => {
      const { data, error } = await supabase
        .from('missing_product_requests')
        .insert({
          search_query: 'Coach For Me',
          category: 'fragrance',
          extracted_brand: 'Coach',
          extracted_product: 'For Me'
        })
        .select()

      expect(error).toBeNull()
      expect(data?.[0]?.search_query).toBe('Coach For Me')
      expect(data?.[0]?.status).toBe('pending') // Default status
      expect(data?.[0]?.priority_score).toBe(1) // Default priority

      // Cleanup
      await supabase
        .from('missing_product_requests')
        .delete()
        .eq('search_query', 'Coach For Me')
    })

    it('MISSING-001b: Status Constraint Validation', async () => {
      const validStatuses = ['pending', 'sourcing', 'added', 'rejected']
      
      for (const status of validStatuses) {
        const { error } = await supabase
          .from('missing_product_requests')
          .insert({
            search_query: `Test Status ${status}`,
            status: status
          })

        expect(error).toBeNull()
      }

      // Test invalid status
      const { error: invalidError } = await supabase
        .from('missing_product_requests')
        .insert({
          search_query: 'Invalid Status Test',
          status: 'invalid_status'
        })

      expect(invalidError).not.toBeNull()
      expect(invalidError?.message).toContain('check constraint')

      // Cleanup
      await supabase
        .from('missing_product_requests')
        .delete()
        .like('search_query', 'Test Status %')
    })
  })

  describe('QUALITY-001: data_quality_scores Table Structure', () => {
    it('QUALITY-001a: Quality Score Creation', async () => {
      const { data, error } = await supabase
        .from('data_quality_scores')
        .insert({
          overall_score: 0.85,
          name_formatting_score: 0.90,
          completeness_score: 0.80,
          duplicate_score: 0.95,
          variant_mapping_score: 0.75,
          total_products: 1500,
          malformed_names: 25,
          missing_fields: 30,
          duplicate_products: 3,
          orphaned_variants: 12
        })
        .select()

      expect(error).toBeNull()
      expect(data?.[0]?.overall_score).toBe(0.85)
      expect(data?.[0]?.total_products).toBe(1500)

      // Cleanup
      await supabase
        .from('data_quality_scores')
        .delete()
        .eq('overall_score', 0.85)
    })

    it('QUALITY-001b: Score Range Constraints', async () => {
      // Test valid score range (0.0-1.0)
      const { error: validError } = await supabase
        .from('data_quality_scores')
        .insert({
          overall_score: 0.75
        })

      expect(validError).toBeNull()

      // Test score > 1.0
      const { error: highError } = await supabase
        .from('data_quality_scores')
        .insert({
          overall_score: 1.5
        })

      expect(highError).not.toBeNull()
      expect(highError?.message).toContain('check constraint')

      // Test score < 0.0
      const { error: lowError } = await supabase
        .from('data_quality_scores')
        .insert({
          overall_score: -0.1
        })

      expect(lowError).not.toBeNull()
      expect(lowError?.message).toContain('check constraint')

      // Cleanup
      await supabase
        .from('data_quality_scores')
        .delete()
        .eq('overall_score', 0.75)
    })
  })

  describe('QUALITY-002: data_quality_issues Table Structure', () => {
    it('QUALITY-002a: Issue Creation with Severity', async () => {
      const { data, error } = await supabase
        .from('data_quality_issues')
        .insert({
          issue_type: 'malformed_name',
          severity: 'high',
          description: 'Fragrance name contains malformed abbreviations'
        })
        .select()

      expect(error).toBeNull()
      expect(data?.[0]?.issue_type).toBe('malformed_name')
      expect(data?.[0]?.severity).toBe('high')
      expect(data?.[0]?.status).toBe('open') // Default status

      // Cleanup
      await supabase
        .from('data_quality_issues')
        .delete()
        .eq('issue_type', 'malformed_name')
    })

    it('QUALITY-002b: Severity and Status Constraints', async () => {
      const validSeverities = ['low', 'medium', 'high', 'critical']
      const validStatuses = ['open', 'resolved', 'ignored']

      // Test valid severities
      for (const severity of validSeverities) {
        const { error } = await supabase
          .from('data_quality_issues')
          .insert({
            issue_type: 'test_issue',
            severity: severity,
            description: `Test ${severity} severity issue`
          })

        expect(error).toBeNull()
      }

      // Test valid statuses
      for (const status of validStatuses) {
        const { error } = await supabase
          .from('data_quality_issues')
          .insert({
            issue_type: 'test_issue',
            severity: 'medium',
            status: status,
            description: `Test ${status} status issue`
          })

        expect(error).toBeNull()
      }

      // Cleanup
      await supabase
        .from('data_quality_issues')
        .delete()
        .eq('issue_type', 'test_issue')
    })
  })

  describe('MIGRATION-001: fragrance_migration_log Table Structure', () => {
    it('MIGRATION-001a: Migration Log Creation', async () => {
      const { data, error } = await supabase
        .from('fragrance_migration_log')
        .insert({
          original_fragrance_id: 'chanel__coco-mademoiselle',
          migration_type: 'normalized',
          original_name: 'Coco Mademoiselle EDP',
          canonical_name: 'Coco Mademoiselle Eau de Parfum',
          normalization_applied: true
        })
        .select()

      expect(error).toBeNull()
      expect(data?.[0]?.migration_type).toBe('normalized')
      expect(data?.[0]?.normalization_applied).toBe(true)

      // Cleanup
      await supabase
        .from('fragrance_migration_log')
        .delete()
        .eq('original_fragrance_id', 'chanel__coco-mademoiselle')
    })

    it('MIGRATION-001b: Migration Type Constraint', async () => {
      const validMigrationTypes = ['direct', 'normalized', 'merged']

      for (const type of validMigrationTypes) {
        const { error } = await supabase
          .from('fragrance_migration_log')
          .insert({
            original_fragrance_id: `test-${type}`,
            migration_type: type
          })

        expect(error).toBeNull()
      }

      // Test invalid migration type
      const { error: invalidError } = await supabase
        .from('fragrance_migration_log')
        .insert({
          original_fragrance_id: 'test-invalid',
          migration_type: 'invalid_type'
        })

      expect(invalidError).not.toBeNull()
      expect(invalidError?.message).toContain('check constraint')

      // Cleanup
      await supabase
        .from('fragrance_migration_log')
        .delete()
        .like('original_fragrance_id', 'test-%')
    })
  })
})

describe('Extensions and Indexes Tests', () => {
  describe('EXT-001: PostgreSQL Extensions', () => {
    it('EXT-001a: pg_trgm Extension Available', async () => {
      const { data, error } = await supabase
        .rpc('check_extension_exists', { extension_name: 'pg_trgm' })

      expect(error).toBeNull()
      expect(data).toBe(true)
    })

    it('EXT-001b: pgvector Extension Available', async () => {
      const { data, error } = await supabase
        .rpc('check_extension_exists', { extension_name: 'vector' })

      expect(error).toBeNull()
      expect(data).toBe(true)
    })
  })

  describe('IDX-001: Index Performance Tests', () => {
    it('IDX-001a: Canonical Fragrance Search Performance', async () => {
      // Test search performance with canonical table
      const startTime = Date.now()
      const { data, error } = await supabase
        .from('fragrances_canonical')
        .select('id, canonical_name')
        .limit(10)
      
      const queryTime = Date.now() - startTime
      
      expect(error).toBeNull()
      expect(queryTime).toBeLessThan(100) // Target <100ms
    })

    it('IDX-001b: Variant Trigram Search Performance', async () => {
      // Test trigram similarity performance on variants
      const startTime = Date.now()
      const { data, error } = await supabase
        .rpc('similarity_search_variants', { query_text: 'chanel', threshold: 0.3 })
      
      const queryTime = Date.now() - startTime
      
      expect(error).toBeNull()
      expect(queryTime).toBeLessThan(200) // Target <200ms for fuzzy search
    })
  })
})

describe('Database Functions Tests', () => {
  describe('FUNC-001: search_fragrances_smart Function', () => {
    it('FUNC-001a: Basic Search Function Exists', async () => {
      const { data, error } = await supabase
        .rpc('search_fragrances_smart', { query_text: 'test' })

      // Function should exist (may return empty results)
      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    it('FUNC-001b: Search with Embedding Parameter', async () => {
      const testEmbedding = Array(1536).fill(0.1)
      
      const { data, error } = await supabase
        .rpc('search_fragrances_smart', { 
          query_text: 'test',
          query_embedding: testEmbedding
        })

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('FUNC-002: run_data_quality_checks Function', () => {
    it('FUNC-002a: Quality Check Function Execution', async () => {
      const { data, error } = await supabase
        .rpc('run_data_quality_checks')

      expect(error).toBeNull()
      expect(typeof data).toBe('string') // Should return UUID
      expect(data).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    })

    it('FUNC-002b: Quality Check Results Stored', async () => {
      // Run quality check
      const { data: checkId, error: runError } = await supabase
        .rpc('run_data_quality_checks')

      expect(runError).toBeNull()

      // Verify results were stored
      const { data: results, error: fetchError } = await supabase
        .from('data_quality_scores')
        .select('*')
        .eq('id', checkId)
        .single()

      expect(fetchError).toBeNull()
      expect(results?.overall_score).toBeGreaterThanOrEqual(0)
      expect(results?.overall_score).toBeLessThanOrEqual(1)
    })
  })
})