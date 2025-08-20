/**
 * Data Quality API Tests
 * Tests for normalization and quality management API endpoints
 * Spec: @.agent-os/specs/2025-08-20-fragrance-data-quality-system/
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServiceSupabase } from '@/lib/supabase'

// Test data setup
let testCanonicalId: string
const supabase = createServiceSupabase()

describe('Data Quality API Endpoints', () => {
  beforeAll(async () => {
    // Create test canonical fragrance for variants testing
    const { data, error } = await supabase
      .from('fragrances_canonical')
      .insert({
        canonical_name: 'Test Canonical for API',
        brand_id: 'chanel',
        fragrance_line: 'Test Line API'
      })
      .select('id')
      .single()

    if (error) throw error
    testCanonicalId = data.id

    // Create test variants
    await supabase
      .from('fragrance_variants')
      .insert([
        {
          canonical_id: testCanonicalId,
          variant_name: 'Test Variant API 1',
          source: 'manual',
          confidence: 0.9,
          is_malformed: false
        },
        {
          canonical_id: testCanonicalId,
          variant_name: 'TEST VARIANT API 2',
          source: 'import',
          confidence: 0.7,
          is_malformed: true
        }
      ])
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

    // Cleanup any test quality issues
    await supabase
      .from('data_quality_issues')
      .delete()
      .like('description', '%API test%')
  })

  describe('API-001: POST /api/data-quality/normalize', () => {
    it('API-001a: Basic Normalization Request', async () => {
      const response = await fetch('http://localhost:3000/api/data-quality/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Bleu De EDP',
          brand: 'Chanel'
        })
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.canonical_name).toContain('Bleu de Chanel')
      expect(data.data.concentration).toBe('Eau de Parfum')
      expect(data.data.confidence).toBeGreaterThan(0.8)
      expect(Array.isArray(data.data.changes_applied)).toBe(true)
    })

    it('API-001b: Invalid Input Validation', async () => {
      const response = await fetch('http://localhost:3000/api/data-quality/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '' // Empty name
        })
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_INPUT')
    })

    it('API-001c: Low Confidence Rejection', async () => {
      const response = await fetch('http://localhost:3000/api/data-quality/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Unknown Fragrance X1',
          brand: 'Unknown Brand',
          confidence_threshold: 0.95
        })
      })

      expect(response.status).toBe(422)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NORMALIZATION_FAILED')
    })

    it('API-001d: Performance Target (<50ms)', async () => {
      const startTime = Date.now()
      
      const response = await fetch('http://localhost:3000/api/data-quality/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sauvage EDT',
          brand: 'Dior'
        })
      })

      const totalTime = Date.now() - startTime
      expect(totalTime).toBeLessThan(100) // API overhead + processing
      
      const data = await response.json()
      expect(data.data.processing_time_ms).toBeLessThan(50)
    })
  })

  describe('API-002: GET /api/data-quality/variants/{canonical_id}', () => {
    it('API-002a: Retrieve Variants for Canonical Fragrance', async () => {
      const response = await fetch(`http://localhost:3000/api/data-quality/variants/${testCanonicalId}`)

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.canonical_name).toBe('Test Canonical for API')
      expect(Array.isArray(data.data.variants)).toBe(true)
      expect(data.data.variants.length).toBeGreaterThan(0)
    })

    it('API-002b: Include Malformed Variants Parameter', async () => {
      const response = await fetch(`http://localhost:3000/api/data-quality/variants/${testCanonicalId}?include_malformed=true`)

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.variants.length).toBe(2) // Should include both variants
      expect(data.data.malformed_count).toBe(1)
    })

    it('API-002c: Exclude Malformed Variants by Default', async () => {
      const response = await fetch(`http://localhost:3000/api/data-quality/variants/${testCanonicalId}`)

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.data.variants.length).toBe(1) // Should exclude malformed
      expect(data.data.malformed_count).toBe(1) // But still report count
    })

    it('API-002d: Invalid UUID Validation', async () => {
      const response = await fetch('http://localhost:3000/api/data-quality/variants/invalid-uuid')

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_INPUT')
    })

    it('API-002e: Non-existent Canonical ID', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000'
      const response = await fetch(`http://localhost:3000/api/data-quality/variants/${fakeUuid}`)

      expect(response.status).toBe(404)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FRAGRANCE_NOT_FOUND')
    })
  })

  describe('API-003: POST /api/data-quality/report-issue', () => {
    it('API-003a: Report Valid Data Quality Issue', async () => {
      const response = await fetch('http://localhost:3000/api/data-quality/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fragrance_id: testCanonicalId,
          issue_type: 'malformed_name',
          description: 'API test - fragrance name contains formatting issues',
          severity: 'medium'
        })
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.issue_id).toBeDefined()
      expect(data.data.status).toBe('open')
      expect(data.data.created_at).toBeDefined()
    })

    it('API-003b: Invalid Issue Type Validation', async () => {
      const response = await fetch('http://localhost:3000/api/data-quality/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fragrance_id: testCanonicalId,
          issue_type: 'invalid_issue_type',
          description: 'Test invalid issue type'
        })
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_INPUT')
      expect(data.error.message).toContain('Invalid issue_type')
    })

    it('API-003c: Invalid Severity Validation', async () => {
      const response = await fetch('http://localhost:3000/api/data-quality/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fragrance_id: testCanonicalId,
          issue_type: 'malformed_name',
          description: 'Test invalid severity',
          severity: 'invalid_severity'
        })
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_INPUT')
      expect(data.error.message).toContain('Invalid severity level')
    })

    it('API-003d: Missing Required Parameters', async () => {
      const response = await fetch('http://localhost:3000/api/data-quality/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fragrance_id: testCanonicalId
          // Missing issue_type and description
        })
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_INPUT')
    })
  })

  describe('API-004: Error Handling and Edge Cases', () => {
    it('API-004a: Malformed JSON Request', async () => {
      const response = await fetch('http://localhost:3000/api/data-quality/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json }'
      })

      expect(response.status).toBe(400)
    })

    it('API-004b: Missing Content-Type Header', async () => {
      const response = await fetch('http://localhost:3000/api/data-quality/normalize', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' })
        // Missing Content-Type header
      })

      // Should handle gracefully or return appropriate error
      expect([400, 415, 500]).toContain(response.status)
    })

    it('API-004c: Large Request Body', async () => {
      const largeDescription = 'x'.repeat(10000) // 10KB description
      
      const response = await fetch('http://localhost:3000/api/data-quality/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fragrance_id: testCanonicalId,
          issue_type: 'other',
          description: largeDescription
        })
      })

      // Should handle large requests appropriately
      expect([200, 413, 400]).toContain(response.status)
    })
  })

  describe('API-005: Integration Tests', () => {
    it('API-005a: End-to-End Normalization Flow', async () => {
      // Test complete flow: normalize → report issue → retrieve variants
      
      // Step 1: Normalize a fragrance name
      const normalizeResponse = await fetch('http://localhost:3000/api/data-quality/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'ACQUA DI GIO EDT 2019',
          brand: 'Giorgio Armani'
        })
      })

      expect(normalizeResponse.status).toBe(200)
      
      const normalizeData = await normalizeResponse.json()
      expect(normalizeData.success).toBe(true)
      expect(normalizeData.data.changes_applied.length).toBeGreaterThan(0)

      // Step 2: If there's an issue, report it  
      if (normalizeData.data.confidence < 0.9) {
        const reportResponse = await fetch('http://localhost:3000/api/data-quality/report-issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fragrance_id: 'giorgio-armani__acqua-di-gio',
            issue_type: 'malformed_name',
            description: 'API test - normalization confidence below threshold',
            severity: 'low'
          })
        })

        expect([200, 404]).toContain(reportResponse.status) // 404 if fragrance doesn't exist
      }
    })

    it('API-005b: Performance Under Load', async () => {
      // Test multiple concurrent normalization requests
      const requests = Array.from({ length: 10 }, (_, i) => 
        fetch('http://localhost:3000/api/data-quality/normalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Test Fragrance ${i} EDP`,
            brand: 'Test Brand'
          })
        })
      )

      const startTime = Date.now()
      const responses = await Promise.all(requests)
      const totalTime = Date.now() - startTime

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Average time per request should be reasonable
      const avgTime = totalTime / requests.length
      expect(avgTime).toBeLessThan(200) // 200ms average under concurrent load
    })
  })
})