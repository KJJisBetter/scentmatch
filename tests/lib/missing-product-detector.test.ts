/**
 * Missing Product Intelligence System Tests
 * Tests for detecting missing products and providing intelligent alternatives
 * Addresses Linear issue SCE-50: "Coach For Men" not found destroys trust
 * Spec: @.agent-os/specs/2025-08-20-fragrance-data-quality-system/
 */

import { describe, it, expect, beforeEach } from 'vitest'

// Test interfaces for missing product system
interface AlternativeSuggestion {
  fragrance_id: string
  name: string
  brand: string
  similarity_score: number
  match_reason: string
  image_url?: string
}

interface MissingProductResponse {
  message: string
  alternatives: AlternativeSuggestion[]
  actions: Array<{
    type: string
    label: string
    endpoint: string
  }>
  metadata: {
    searchQuery: string
    missingProductId: string
    alternativeCount: number
  }
}

interface MissingProductDetector {
  handleProductNotFound(searchQuery: string, userId?: string): Promise<MissingProductResponse>
  findAlternatives(query: string): Promise<AlternativeSuggestion[]>
  logMissingProduct(query: string, userId?: string): Promise<string>
  getMissingProductCount(query: string): Promise<number>
}

// Mock implementation for testing
class MockMissingProductDetector implements MissingProductDetector {
  async handleProductNotFound(searchQuery: string, userId?: string): Promise<MissingProductResponse> {
    return {
      message: "We couldn't find that exact product",
      alternatives: [],
      actions: [],
      metadata: {
        searchQuery,
        missingProductId: 'test-id',
        alternativeCount: 0
      }
    }
  }

  async findAlternatives(query: string): Promise<AlternativeSuggestion[]> {
    return []
  }

  async logMissingProduct(query: string, userId?: string): Promise<string> {
    return 'test-id'
  }

  async getMissingProductCount(query: string): Promise<number> {
    return 1
  }
}

describe('Missing Product Intelligence System', () => {
  let detector: MissingProductDetector

  beforeEach(() => {
    detector = new MockMissingProductDetector()
  })

  describe('MISSING-001: Critical Linear Issue - Coach For Men (SCE-50)', () => {
    it('MISSING-001a: Handle Coach For Men Search', async () => {
      const response = await detector.handleProductNotFound('Coach For Men')
      
      expect(response.message).toBe("We couldn't find that exact product")
      expect(response.alternatives).toBeDefined()
      expect(Array.isArray(response.alternatives)).toBe(true)
      expect(response.actions).toBeDefined()
      expect(response.actions.length).toBeGreaterThan(0)
      expect(response.metadata.searchQuery).toBe('Coach For Men')
    })

    it('MISSING-001b: Find Coach Brand Alternatives', async () => {
      const alternatives = await detector.findAlternatives('Coach For Men')
      
      expect(Array.isArray(alternatives)).toBe(true)
      
      // Should find other Coach fragrances as alternatives
      alternatives.forEach(alt => {
        expect(alt).toHaveProperty('fragrance_id')
        expect(alt).toHaveProperty('name')
        expect(alt).toHaveProperty('brand')
        expect(alt).toHaveProperty('similarity_score')
        expect(alt).toHaveProperty('match_reason')
        expect(alt.similarity_score).toBeGreaterThan(0)
        expect(alt.similarity_score).toBeLessThanOrEqual(1)
      })
    })

    it('MISSING-001c: Log Missing Product Request', async () => {
      const requestId = await detector.logMissingProduct('Coach For Men', 'test-user-id')
      
      expect(typeof requestId).toBe('string')
      expect(requestId.length).toBeGreaterThan(0)
    })

    it('MISSING-001d: Track Request Count and Trigger Thresholds', async () => {
      // Log multiple requests for same product
      await detector.logMissingProduct('Coach For Men')
      await detector.logMissingProduct('Coach For Men')
      await detector.logMissingProduct('Coach For Men')
      
      const count = await detector.getMissingProductCount('Coach For Men')
      expect(count).toBeGreaterThanOrEqual(3)
    })
  })

  describe('MISSING-002: Alternative Suggestion Engine', () => {
    it('MISSING-002a: Brand-Based Alternatives', async () => {
      const alternatives = await detector.findAlternatives('Coach Platinum')
      
      // Should prioritize same-brand products
      expect(alternatives.length).toBeGreaterThan(0)
      alternatives.slice(0, 3).forEach(alt => {
        expect(alt.brand.toLowerCase()).toContain('coach')
        expect(alt.match_reason).toContain('Same brand')
      })
    })

    it('MISSING-002b: Gender-Specific Alternatives', async () => {
      const menAlternatives = await detector.findAlternatives('Unknown Fragrance For Men')
      
      menAlternatives.forEach(alt => {
        expect(alt.match_reason.toLowerCase()).toMatch(/men|masculine|male/)
      })
    })

    it('MISSING-002c: Note-Based Similarity Matching', async () => {
      const alternatives = await detector.findAlternatives('Fresh Citrus Summer Fragrance')
      
      alternatives.forEach(alt => {
        expect(alt.match_reason.toLowerCase()).toMatch(/fresh|citrus|summer|aquatic|clean/)
        expect(alt.similarity_score).toBeGreaterThan(0.3)
      })
    })

    it('MISSING-002d: Similarity Score Ranking', async () => {
      const alternatives = await detector.findAlternatives('Coach For Men')
      
      // Alternatives should be sorted by similarity score (descending)
      for (let i = 1; i < alternatives.length; i++) {
        expect(alternatives[i-1].similarity_score).toBeGreaterThanOrEqual(alternatives[i].similarity_score)
      }
    })
  })

  describe('MISSING-003: Demand Tracking and Prioritization', () => {
    it('MISSING-003a: Request Logging with User Context', async () => {
      const requestId = await detector.logMissingProduct('Popular Missing Fragrance', 'user-123')
      
      expect(typeof requestId).toBe('string')
      expect(requestId).toMatch(/^[0-9a-f-]+$/) // UUID format
    })

    it('MISSING-003b: Anonymous Request Logging', async () => {
      const requestId = await detector.logMissingProduct('Popular Missing Fragrance')
      
      expect(typeof requestId).toBe('string')
      // Should work without user ID
    })

    it('MISSING-003c: Request Count Aggregation', async () => {
      const query = 'High Demand Missing Product'
      
      // Log multiple requests
      await detector.logMissingProduct(query)
      await detector.logMissingProduct(query)
      await detector.logMissingProduct(query)
      
      const count = await detector.getMissingProductCount(query)
      expect(count).toBeGreaterThanOrEqual(3)
    })

    it('MISSING-003d: Priority Score Calculation', async () => {
      // High-demand product should get higher priority
      const highDemandQuery = 'Very Popular Missing Fragrance'
      
      // Simulate multiple user requests
      for (let i = 0; i < 10; i++) {
        await detector.logMissingProduct(highDemandQuery, `user-${i}`)
      }
      
      const count = await detector.getMissingProductCount(highDemandQuery)
      expect(count).toBeGreaterThanOrEqual(10)
    })
  })

  describe('MISSING-004: Search Query Analysis', () => {
    it('MISSING-004a: Extract Brand from Query', async () => {
      const testQueries = [
        'Coach For Men',
        'Dior Homme Intense 2021', 
        'Tom Ford Tobacco Vanille Sample',
        'Chanel Bleu de Chanel Travel Size'
      ]

      for (const query of testQueries) {
        const response = await detector.handleProductNotFound(query)
        expect(response.metadata.searchQuery).toBe(query)
      }
    })

    it('MISSING-004b: Categorize Search Type', async () => {
      const testCases = [
        { query: 'Coach For Men', expectedCategory: 'fragrance' },
        { query: 'Tom Ford', expectedCategory: 'brand' },
        { query: 'xyz123', expectedCategory: 'unknown' }
      ]

      for (const { query, expectedCategory } of testCases) {
        const response = await detector.handleProductNotFound(query)
        // Category should be determined during processing
        expect(response.metadata).toBeDefined()
      }
    })

    it('MISSING-004c: Handle Typos and Variations', async () => {
      const variations = [
        'Coach for men', // Different capitalization
        'Coach 4 Men', // Number substitution
        'Coach For Man', // Singular vs plural
        'Couch For Men' // Typo
      ]

      for (const variation of variations) {
        const alternatives = await detector.findAlternatives(variation)
        expect(alternatives.length).toBeGreaterThan(0)
        
        // Should find Coach brand products despite variations
        const hasCoachAlternatives = alternatives.some(alt => 
          alt.brand.toLowerCase().includes('coach')
        )
        expect(hasCoachAlternatives).toBe(true)
      }
    })
  })

  describe('MISSING-005: User Experience Flow', () => {
    it('MISSING-005a: Complete Missing Product Response Structure', async () => {
      const response = await detector.handleProductNotFound('Coach For Men')
      
      // Should provide complete user experience
      expect(response.message).toBeDefined()
      expect(response.alternatives).toBeDefined()
      expect(response.actions).toBeDefined()
      expect(response.metadata).toBeDefined()
      
      // Actions should include notification signup
      const notifyAction = response.actions.find(action => action.type === 'notify')
      expect(notifyAction).toBeDefined()
      expect(notifyAction?.label).toContain('Notify')
      expect(notifyAction?.endpoint).toBe('/api/missing-products/notify')
      
      // Actions should include suggestion submission
      const suggestAction = response.actions.find(action => action.type === 'suggest')
      expect(suggestAction).toBeDefined()
      expect(suggestAction?.label).toContain('Suggest')
    })

    it('MISSING-005b: Alternative Quality and Relevance', async () => {
      const alternatives = await detector.findAlternatives('Coach For Men')
      
      alternatives.forEach(alt => {
        // Each alternative should have clear reasoning
        expect(alt.match_reason).toBeDefined()
        expect(alt.match_reason.length).toBeGreaterThan(5)
        
        // Similarity scores should be meaningful
        expect(alt.similarity_score).toBeGreaterThan(0.3)
        
        // Names should be clean and professional
        expect(alt.name).not.toMatch(/[A-Z]{3,}/) // No all-caps
        expect(alt.name.length).toBeGreaterThan(3)
      })
    })

    it('MISSING-005c: Maximum Alternatives Limit', async () => {
      const alternatives = await detector.findAlternatives('Coach For Men')
      
      // Should return reasonable number of alternatives (not overwhelming)
      expect(alternatives.length).toBeLessThanOrEqual(10)
      expect(alternatives.length).toBeGreaterThanOrEqual(3) // Minimum useful amount
    })
  })

  describe('MISSING-006: Performance and Scalability', () => {
    it('MISSING-006a: Alternative Generation Speed', async () => {
      const startTime = Date.now()
      
      const alternatives = await detector.findAlternatives('Coach For Men')
      
      const processingTime = Date.now() - startTime
      expect(processingTime).toBeLessThan(200) // Target <200ms for alternatives
      expect(alternatives.length).toBeGreaterThan(0)
    })

    it('MISSING-006b: Logging Performance', async () => {
      const startTime = Date.now()
      
      const requestId = await detector.logMissingProduct('Performance Test Product')
      
      const loggingTime = Date.now() - startTime
      expect(loggingTime).toBeLessThan(100) // Target <100ms for logging
      expect(requestId).toBeDefined()
    })

    it('MISSING-006c: Concurrent Request Handling', async () => {
      const concurrentRequests = Array.from({ length: 5 }, (_, i) => 
        detector.logMissingProduct(`Concurrent Test ${i}`, `user-${i}`)
      )

      const startTime = Date.now()
      const results = await Promise.all(concurrentRequests)
      const totalTime = Date.now() - startTime

      expect(results.length).toBe(5)
      results.forEach(requestId => {
        expect(typeof requestId).toBe('string')
        expect(requestId.length).toBeGreaterThan(0)
      })
      
      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(500)
    })
  })

  describe('MISSING-007: Real-World Missing Product Cases', () => {
    it('MISSING-007a: Popular Missing Fragrances', async () => {
      const popularMissing = [
        'Coach For Men',
        'Victoria Secret Bombshell',
        'Bath and Body Works Japanese Cherry Blossom',
        'Ariana Grande Cloud',
        'Kayali Vanilla 28'
      ]

      for (const query of popularMissing) {
        const response = await detector.handleProductNotFound(query)
        
        expect(response.alternatives.length).toBeGreaterThan(0)
        expect(response.actions.length).toBeGreaterThanOrEqual(2) // Notify + Suggest actions
        
        // Should provide relevant alternatives for each
        const hasRelevantAlternatives = response.alternatives.some(alt => 
          alt.similarity_score > 0.5
        )
        expect(hasRelevantAlternatives).toBe(true)
      }
    })

    it('MISSING-007b: Brand-Specific Missing Products', async () => {
      const brandQueries = [
        'Coach Dreams', // Coach brand
        'Tom Ford Ebene Fume', // Tom Ford brand  
        'Chanel Gabrielle Essence', // Chanel brand
        'Dior Midnight Poison' // Dior brand
      ]

      for (const query of brandQueries) {
        const alternatives = await detector.findAlternatives(query)
        
        // Extract brand from query
        const queryBrand = query.split(' ')[0].toLowerCase()
        
        // Should prioritize same-brand alternatives
        const sameBrandAlts = alternatives.filter(alt => 
          alt.brand.toLowerCase().includes(queryBrand)
        )
        
        if (sameBrandAlts.length > 0) {
          expect(sameBrandAlts[0].similarity_score).toBeGreaterThan(0.6)
          expect(sameBrandAlts[0].match_reason).toContain('Same brand')
        }
      }
    })

    it('MISSING-007c: Discontinued Product Handling', async () => {
      const discontinuedQueries = [
        'Acqua di Gio Profumo', // Often discontinued/reformulated
        'Angel Original Formula',
        'Opium Vintage Formula'
      ]

      for (const query of discontinuedQueries) {
        const alternatives = await detector.findAlternatives(query)
        
        // Should suggest current alternatives
        expect(alternatives.length).toBeGreaterThan(0)
        alternatives.forEach(alt => {
          expect(alt.match_reason).toBeDefined()
          expect(alt.match_reason.length).toBeGreaterThan(10) // Detailed reasoning
        })
      }
    })
  })

  describe('MISSING-008: Alternative Suggestion Quality', () => {
    it('MISSING-008a: Reasoning Quality', async () => {
      const alternatives = await detector.findAlternatives('Coach For Men')
      
      alternatives.forEach(alt => {
        // Each alternative should have meaningful reasoning
        expect(alt.match_reason).toBeDefined()
        expect(alt.match_reason.length).toBeGreaterThan(15)
        
        // Reasoning should explain the connection
        const validReasonPatterns = [
          /same brand/i,
          /similar.*scent/i,
          /masculine.*profile/i,
          /woody.*notes/i,
          /fresh.*composition/i,
          /popular.*alternative/i
        ]
        
        const hasValidReason = validReasonPatterns.some(pattern => 
          pattern.test(alt.match_reason)
        )
        expect(hasValidReason).toBe(true)
      })
    })

    it('MISSING-008b: Similarity Score Accuracy', async () => {
      const testCases = [
        { query: 'Coach For Men', minSimilarity: 0.7 }, // Same brand should be high
        { query: 'Fresh Aquatic Summer', minSimilarity: 0.5 }, // Note-based matching
        { query: 'Luxury Niche Oriental', minSimilarity: 0.4 } // Style-based matching
      ]

      for (const { query, minSimilarity } of testCases) {
        const alternatives = await detector.findAlternatives(query)
        
        if (alternatives.length > 0) {
          expect(alternatives[0].similarity_score).toBeGreaterThan(minSimilarity)
        }
      }
    })

    it('MISSING-008c: Alternative Diversity', async () => {
      const alternatives = await detector.findAlternatives('Coach For Men')
      
      if (alternatives.length >= 3) {
        // Should provide diverse alternatives, not all same product line
        const uniqueBrands = new Set(alternatives.map(alt => alt.brand))
        const uniqueLines = new Set(alternatives.map(alt => alt.name.split(' ')[0]))
        
        // At least some diversity in suggestions
        expect(uniqueLines.size).toBeGreaterThan(1)
      }
    })
  })

  describe('MISSING-009: Notification and Follow-up System', () => {
    it('MISSING-009a: Notification Request Structure', async () => {
      const response = await detector.handleProductNotFound('Coach For Men')
      
      const notifyAction = response.actions.find(action => action.type === 'notify')
      expect(notifyAction).toBeDefined()
      expect(notifyAction?.endpoint).toBe('/api/missing-products/notify')
      expect(notifyAction?.label).toContain('notify')
    })

    it('MISSING-009b: Product Suggestion Structure', async () => {
      const response = await detector.handleProductNotFound('Coach For Men')
      
      const suggestAction = response.actions.find(action => action.type === 'suggest')
      expect(suggestAction).toBeDefined()
      expect(suggestAction?.endpoint).toBe('/api/missing-products/suggest-product')
      expect(suggestAction?.label).toContain('suggest')
    })
  })

  describe('MISSING-010: Edge Cases and Error Handling', () => {
    it('MISSING-010a: Empty or Invalid Queries', async () => {
      const invalidQueries = ['', '   ', 'a', '12345']
      
      for (const query of invalidQueries) {
        const response = await detector.handleProductNotFound(query)
        
        // Should handle gracefully
        expect(response.message).toBeDefined()
        expect(response.alternatives).toBeDefined()
        expect(Array.isArray(response.alternatives)).toBe(true)
      }
    })

    it('MISSING-010b: Very Long Query Handling', async () => {
      const longQuery = 'Very Long Fragrance Name That Goes On And On With Many Words And Descriptions EDP 2024 Limited Edition Summer Release'
      
      const response = await detector.handleProductNotFound(longQuery)
      
      expect(response.message).toBeDefined()
      expect(response.metadata.searchQuery).toBe(longQuery)
    })

    it('MISSING-010c: Special Characters and Accents', async () => {
      const specialQueries = [
        'L\'Artisan Thé Pour Un Été',
        'Hermès Terre d\'Hermès',
        'Maison Margiela REPLICA Jazz Club'
      ]

      for (const query of specialQueries) {
        const response = await detector.handleProductNotFound(query)
        
        expect(response.alternatives).toBeDefined()
        expect(response.metadata.searchQuery).toBe(query)
      }
    })
  })

  describe('MISSING-011: Integration with Normalization Engine', () => {
    it('MISSING-011a: Query Normalization Before Search', async () => {
      // Test that missing product detector normalizes queries first
      const variations = [
        'coach for men',
        'COACH FOR MEN', 
        'Coach For Men',
        'Coach for Men'
      ]

      const responses = await Promise.all(
        variations.map(query => detector.handleProductNotFound(query))
      )

      // All variations should produce similar results
      responses.forEach(response => {
        expect(response.alternatives.length).toBeGreaterThan(0)
      })
    })

    it('MISSING-011b: Leverage Normalization for Better Alternatives', async () => {
      // Test that alternatives benefit from name normalization
      const alternatives = await detector.findAlternatives('coach for men edp')
      
      alternatives.forEach(alt => {
        // Alternative names should be properly formatted
        expect(alt.name).not.toMatch(/[A-Z]{3,}/) // No all-caps
        expect(alt.name).not.toMatch(/\b(edp|edt)\b/i) // No abbreviations if normalized
      })
    })
  })

  describe('MISSING-012: Business Intelligence and Insights', () => {
    it('MISSING-012a: Demand Pattern Recognition', async () => {
      // Test system's ability to recognize demand patterns
      const brandDemandTest = [
        'Coach For Men',
        'Coach Dreams',
        'Coach Platinum',
        'Coach Blue'
      ]

      for (const query of brandDemandTest) {
        await detector.logMissingProduct(query)
      }

      // System should recognize Coach brand demand pattern
      const coachCount = await detector.getMissingProductCount('Coach')
      expect(coachCount).toBeGreaterThan(0)
    })

    it('MISSING-012b: Seasonal Demand Tracking', async () => {
      const seasonalQueries = [
        'Summer Beach Fragrance',
        'Winter Warm Spicy Scent', 
        'Spring Floral Bloom',
        'Fall Autumn Woods'
      ]

      for (const query of seasonalQueries) {
        const response = await detector.handleProductNotFound(query)
        expect(response.alternatives.length).toBeGreaterThan(0)
      }
    })
  })
})