/**
 * Fragrance Name Normalization Engine Tests
 * Tests for normalizing malformed fragrance names to professional standards
 * Spec: @.agent-os/specs/2025-08-20-fragrance-data-quality-system/
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FragranceNormalizer, type NormalizationResult } from '@/lib/data-quality/fragrance-normalizer'

describe('Fragrance Name Normalization Engine', () => {
  let normalizer: FragranceNormalizer

  beforeEach(() => {
    normalizer = new FragranceNormalizer()
  })

  describe('NORM-001: Critical Linear Issue Cases (SCE-49/51)', () => {
    it('NORM-001a: Bleu De EDP → Bleu de Chanel EDP', () => {
      const result = normalizer.normalizeFragranceName('Bleu De EDP', 'Chanel')
      
      expect(result.canonicalName).toBe('Chanel Bleu de Chanel Eau de Parfum')
      expect(result.fragranceLine).toBe('Bleu de Chanel')
      expect(result.concentration).toBe('Eau de Parfum')
      expect(result.needsNormalization).toBe(true)
      expect(result.changes).toContain('Fixed capitalization: De → de')
      expect(result.changes).toContain('Expanded concentration: EDP → Eau de Parfum')
      expect(result.changes).toContain('Added brand context: Chanel')
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    it('NORM-001b: N05 Eau Premiere → Chanel No 5 Eau Premiere', () => {
      const result = normalizer.normalizeFragranceName('N05 Eau Premiere', 'Chanel')
      
      expect(result.canonicalName).toBe('Chanel No 5 Eau Premiere')
      expect(result.fragranceLine).toBe('No 5')
      expect(result.needsNormalization).toBe(true)
      expect(result.changes).toContain('Fixed abbreviation: N05 → No 5')
      expect(result.changes).toContain('Added brand context: Chanel')
      expect(result.confidence).toBeGreaterThan(0.85)
    })

    it('NORM-001c: Coromandel EDP → Les Exclusifs de Chanel Coromandel', () => {
      const result = normalizer.normalizeFragranceName('Coromandel EDP', 'Chanel')
      
      expect(result.canonicalName).toBe('Chanel Les Exclusifs de Chanel Coromandel Eau de Parfum')
      expect(result.fragranceLine).toBe('Les Exclusifs de Chanel Coromandel')
      expect(result.concentration).toBe('Eau de Parfum')
      expect(result.needsNormalization).toBe(true)
      expect(result.changes).toContain('Added collection context: Les Exclusifs de Chanel')
      expect(result.changes).toContain('Expanded concentration: EDP → Eau de Parfum')
    })

    it('NORM-001d: Bleu De (2) → Bleu de Chanel EDT', () => {
      const result = normalizer.normalizeFragranceName('Bleu De (2)', 'Chanel')
      
      expect(result.canonicalName).toBe('Chanel Bleu de Chanel Eau de Toilette')
      expect(result.fragranceLine).toBe('Bleu de Chanel')
      expect(result.concentration).toBe('Eau de Toilette')
      expect(result.needsNormalization).toBe(true)
      expect(result.changes).toContain('Fixed capitalization: De → de')
      expect(result.changes).toContain('Resolved variant number: (2) → EDT')
      expect(result.confidence).toBeGreaterThan(0.8)
    })
  })

  describe('NORM-002: Concentration Normalization', () => {
    it('NORM-002a: EDP Expansion', () => {
      const result = normalizer.normalizeFragranceName('Sauvage EDP', 'Dior')
      
      expect(result.canonicalName).toContain('Eau de Parfum')
      expect(result.concentration).toBe('Eau de Parfum')
      expect(result.changes).toContain('Expanded concentration: EDP → Eau de Parfum')
    })

    it('NORM-002b: EDT Expansion', () => {
      const result = normalizer.normalizeFragranceName('Light Blue EDT', 'Dolce & Gabbana')
      
      expect(result.canonicalName).toContain('Eau de Toilette')
      expect(result.concentration).toBe('Eau de Toilette')
      expect(result.changes).toContain('Expanded concentration: EDT → Eau de Toilette')
    })

    it('NORM-002c: Multiple Concentration Formats', () => {
      const concentrations = [
        { input: 'EDP', expected: 'Eau de Parfum' },
        { input: 'EDT', expected: 'Eau de Toilette' },
        { input: 'EDC', expected: 'Eau de Cologne' },
        { input: 'Parfum', expected: 'Extrait de Parfum' },
        { input: 'Cologne', expected: 'Eau de Cologne' },
        { input: 'Aftershave', expected: 'Aftershave' }
      ]

      concentrations.forEach(({ input, expected }) => {
        const result = normalizer.normalizeFragranceName(`Test ${input}`, 'Test Brand')
        expect(result.concentration).toBe(expected)
      })
    })

    it('NORM-002d: Case Insensitive Concentration Detection', () => {
      const result = normalizer.normalizeFragranceName('Sauvage edp', 'Dior')
      
      expect(result.concentration).toBe('Eau de Parfum')
      expect(result.changes).toContain('Expanded concentration: edp → Eau de Parfum')
    })
  })

  describe('NORM-003: Capitalization Fixes', () => {
    it('NORM-003a: Article Capitalization (De, And, Of, The)', () => {
      const testCases = [
        { input: 'Fleur De Orchidee', expected: 'fleur de orchidee' },
        { input: 'Beauty And The Beast', expected: 'beauty and the beast' },
        { input: 'Tears Of The Moon', expected: 'tears of the moon' },
        { input: 'The One For Men', expected: 'the one for men' }
      ]

      testCases.forEach(({ input, expected }) => {
        const result = normalizer.normalizeFragranceName(input, 'Test Brand')
        expect(result.fragranceLine.toLowerCase()).toContain(expected)
        expect(result.changes).toContain('Fixed capitalization of articles and prepositions')
      })
    })

    it('NORM-003b: All-Caps Word Fixes', () => {
      const result = normalizer.normalizeFragranceName('SAUVAGE EDP', 'Dior')
      
      expect(result.canonicalName).not.toContain('SAUVAGE')
      expect(result.canonicalName).toContain('Sauvage')
      expect(result.changes).toContain('Fixed all-caps: SAUVAGE → Sauvage')
    })

    it('NORM-003c: Preserve Valid All-Caps (USA, NYC, UK)', () => {
      const result = normalizer.normalizeFragranceName('NYC Edition', 'Test Brand')
      
      expect(result.canonicalName).toContain('NYC')
      expect(result.changes).not.toContain('Fixed all-caps: NYC')
    })
  })

  describe('NORM-004: Year and Edition Handling', () => {
    it('NORM-004a: Remove Old Year Suffixes', () => {
      const testCases = [
        'Homme Intense 2011',
        'Angel (2019)',
        'Opium 2009'
      ]

      testCases.forEach(input => {
        const result = normalizer.normalizeFragranceName(input, 'Test Brand')
        expect(result.canonicalName).not.toMatch(/20\d{2}/)
        expect(result.changes).toContain('Removed year suffix')
      })
    })

    it('NORM-004b: Keep Recent Years (2020+)', () => {
      const result = normalizer.normalizeFragranceName('New Release 2024', 'Test Brand')
      
      expect(result.canonicalName).toContain('2024')
      expect(result.changes).not.toContain('Removed year suffix')
    })

    it('NORM-004c: Handle Parenthetical Years', () => {
      const result = normalizer.normalizeFragranceName('Classic Scent (2015)', 'Test Brand')
      
      expect(result.canonicalName).not.toContain('(2015)')
      expect(result.changes).toContain('Removed year suffix')
    })
  })

  describe('NORM-005: Brand Context Addition', () => {
    it('NORM-005a: Add Missing Brand Context', () => {
      const result = normalizer.normalizeFragranceName('Sauvage', 'Dior')
      
      expect(result.canonicalName).toContain('Dior')
      expect(result.changes).toContain('Added brand context: Dior')
    })

    it('NORM-005b: Skip When Brand Already Present', () => {
      const result = normalizer.normalizeFragranceName('Dior Sauvage', 'Dior')
      
      expect(result.changes).not.toContain('Added brand context')
      expect(result.canonicalName).toBe('Dior Sauvage') // No duplication
    })

    it('NORM-005c: Handle Case-Insensitive Brand Detection', () => {
      const result = normalizer.normalizeFragranceName('chanel no 5', 'Chanel')
      
      expect(result.changes).not.toContain('Added brand context')
      expect(result.canonicalName).toContain('Chanel')
    })
  })

  describe('NORM-006: Special Chanel Cases', () => {
    it('NORM-006a: Number Abbreviation N05 → No 5', () => {
      const testCases = [
        { input: 'N05', expected: 'No 5' },
        { input: 'N19', expected: 'No 19' },
        { input: 'N22', expected: 'No 22' }
      ]

      testCases.forEach(({ input, expected }) => {
        const result = normalizer.normalizeFragranceName(input, 'Chanel')
        expect(result.fragranceLine).toContain(expected)
        expect(result.changes).toContain(`Fixed abbreviation: ${input} → ${expected}`)
      })
    })

    it('NORM-006b: Les Exclusifs Collection Detection', () => {
      const exclusifsFragrances = [
        'Coromandel',
        'Sycomore', 
        'Cuir de Russie',
        'Gardénia'
      ]

      exclusifsFragrances.forEach(fragrance => {
        const result = normalizer.normalizeFragranceName(fragrance, 'Chanel')
        expect(result.canonicalName).toContain('Les Exclusifs de Chanel')
        expect(result.changes).toContain('Added collection context: Les Exclusifs de Chanel')
      })
    })
  })

  describe('NORM-007: Brand Alias Normalization', () => {
    it('NORM-007a: Common Brand Abbreviations', () => {
      const aliases = [
        { input: 'CK One', brand: 'Calvin Klein', expected: 'Calvin Klein' },
        { input: 'JPG Le Male', brand: 'Jean Paul Gaultier', expected: 'Jean Paul Gaultier' },
        { input: 'YSL Y', brand: 'Yves Saint Laurent', expected: 'Yves Saint Laurent' },
        { input: 'D&G Light Blue', brand: 'Dolce & Gabbana', expected: 'Dolce & Gabbana' }
      ]

      aliases.forEach(({ input, brand, expected }) => {
        const result = normalizer.normalizeFragranceName(input, brand)
        expect(result.canonicalName).toContain(expected)
      })
    })
  })

  describe('NORM-008: Edge Cases and Error Handling', () => {
    it('NORM-008a: Empty or Invalid Input', () => {
      const edgeCases = ['', '   ', null, undefined]
      
      edgeCases.forEach(input => {
        expect(() => {
          normalizer.normalizeFragranceName(input as any, 'Test Brand')
        }).not.toThrow()
      })
    })

    it('NORM-008b: Very Long Names', () => {
      const longName = 'Extremely Long Fragrance Name That Goes On And On With Many Many Words EDP 2019 Limited Edition'
      const result = normalizer.normalizeFragranceName(longName, 'Test Brand')
      
      expect(result.canonicalName.length).toBeLessThan(150) // Reasonable length
      expect(result.needsNormalization).toBe(true)
    })

    it('NORM-008c: Special Characters and Accents', () => {
      const result = normalizer.normalizeFragranceName('Fleur d\'Oranger', 'L\'Artisan Parfumeur')
      
      expect(result.canonicalName).toContain('Fleur d\'Oranger')
      expect(result.needsNormalization).toBe(true) // Should add brand context
    })

    it('NORM-008d: Numbers in Fragrance Names', () => {
      const testCases = [
        { input: 'CH Men Prive 2019', expected: 'CH Men Prive' },
        { input: 'Angel Number 1', expected: 'Angel Number 1' }, // Keep meaningful numbers
        { input: 'Molecule 01', expected: 'Molecule 01' } // Keep meaningful numbers
      ]

      testCases.forEach(({ input, expected }) => {
        const result = normalizer.normalizeFragranceName(input, 'Test Brand')
        expect(result.fragranceLine).toContain(expected.replace(' 2019', ''))
      })
    })
  })

  describe('NORM-009: Confidence Scoring', () => {
    it('NORM-009a: High Confidence for Simple Changes', () => {
      const result = normalizer.normalizeFragranceName('Sauvage EDP', 'Dior')
      
      // Simple changes should have high confidence
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    it('NORM-009b: Medium Confidence for Complex Changes', () => {
      const result = normalizer.normalizeFragranceName('BLEU DE (2) 2011', 'Chanel')
      
      // Multiple complex changes should have medium confidence
      expect(result.confidence).toBeGreaterThan(0.7)
      expect(result.confidence).toBeLessThan(0.9)
    })

    it('NORM-009c: Lower Confidence for Ambiguous Cases', () => {
      const result = normalizer.normalizeFragranceName('Unknown Fragrance X1', 'Unknown Brand')
      
      // Ambiguous or unknown patterns should have lower confidence
      expect(result.confidence).toBeLessThan(0.8)
    })

    it('NORM-009d: Perfect Confidence for No Changes', () => {
      const result = normalizer.normalizeFragranceName('Chanel No 5 Eau de Parfum', 'Chanel')
      
      expect(result.needsNormalization).toBe(false)
      expect(result.confidence).toBe(1.0)
    })
  })

  describe('NORM-010: Multiple Pattern Combinations', () => {
    it('NORM-010a: All Issues Combined', () => {
      const result = normalizer.normalizeFragranceName('BLEU DE EDP 2015', 'Chanel')
      
      expect(result.canonicalName).toBe('Chanel Bleu de Chanel Eau de Parfum')
      expect(result.changes).toContain('Fixed all-caps: BLEU → Bleu')
      expect(result.changes).toContain('Fixed capitalization: DE → de')
      expect(result.changes).toContain('Expanded concentration: EDP → Eau de Parfum')
      expect(result.changes).toContain('Removed year suffix')
      expect(result.changes).toContain('Added brand context: Chanel')
    })

    it('NORM-010b: Complex Chanel Normalization', () => {
      const result = normalizer.normalizeFragranceName('N05 EAU PREMIERE 2019', 'Chanel')
      
      expect(result.canonicalName).toBe('Chanel No 5 Eau Premiere')
      expect(result.changes).toContain('Fixed abbreviation: N05 → No 5')
      expect(result.changes).toContain('Fixed all-caps: EAU PREMIERE → Eau Premiere')
      expect(result.changes).toContain('Removed year suffix')
    })
  })

  describe('NORM-011: Performance and Accuracy Requirements', () => {
    it('NORM-011a: Normalization Speed Target (<50ms)', () => {
      const testNames = [
        'Bleu De EDP',
        'SAUVAGE EDT 2019',
        'N05 Eau Premiere',
        'Coromandel EDP',
        'Angel 2011'
      ]

      const startTime = Date.now()
      
      testNames.forEach(name => {
        normalizer.normalizeFragranceName(name, 'Test Brand')
      })
      
      const totalTime = Date.now() - startTime
      const averageTime = totalTime / testNames.length
      
      expect(averageTime).toBeLessThan(50) // Target <50ms per normalization
    })

    it('NORM-011b: Batch Normalization Accuracy', () => {
      const testBatch = [
        { input: 'Bleu De EDP', brand: 'Chanel', expected: 'Chanel Bleu de Chanel Eau de Parfum' },
        { input: 'Sauvage EDT', brand: 'Dior', expected: 'Dior Sauvage Eau de Toilette' },
        { input: 'N05', brand: 'Chanel', expected: 'Chanel No 5' },
        { input: 'Angel 2019', brand: 'Mugler', expected: 'Mugler Angel' },
        { input: 'ACQUA DI GIO', brand: 'Giorgio Armani', expected: 'Giorgio Armani Acqua di Gio' }
      ]

      let correctNormalizations = 0
      
      testBatch.forEach(({ input, brand, expected }) => {
        const result = normalizer.normalizeFragranceName(input, brand)
        if (result.canonicalName === expected) {
          correctNormalizations++
        }
      })
      
      const accuracy = correctNormalizations / testBatch.length
      expect(accuracy).toBeGreaterThan(0.95) // Target 95%+ accuracy
    })
  })

  describe('NORM-012: Variant Detection and Mapping', () => {
    it('NORM-012a: Detect Malformed Variants', () => {
      const malformedCases = [
        'BLEU DE EDP', // All caps + wrong capitalization
        'N05 Eau Premiere', // Number abbreviation
        'Sauvage (2)', // Variant number without context
        'Angel 2011' // Old year suffix
      ]

      malformedCases.forEach(input => {
        const result = normalizer.normalizeFragranceName(input, 'Test Brand')
        expect(result.needsNormalization).toBe(true)
        expect(result.changes.length).toBeGreaterThan(0)
      })
    })

    it('NORM-012b: Confidence Based on Change Complexity', () => {
      const complexityTests = [
        { input: 'Sauvage EDP', expectedConfidence: 0.95 }, // Simple concentration fix
        { input: 'BLEU DE EDP', expectedConfidence: 0.85 }, // Multiple fixes
        { input: 'N05 EAU PREMIERE 2019', expectedConfidence: 0.75 } // Complex multiple fixes
      ]

      complexityTests.forEach(({ input, expectedConfidence }) => {
        const result = normalizer.normalizeFragranceName(input, 'Test Brand')
        expect(result.confidence).toBeCloseTo(expectedConfidence, 1)
      })
    })
  })

  describe('NORM-013: Real-World Edge Cases', () => {
    it('NORM-013a: Tom Ford Private Blend Collection', () => {
      const result = normalizer.normalizeFragranceName('Tobacco Vanille', 'Tom Ford')
      
      expect(result.canonicalName).toBe('Tom Ford Tobacco Vanille')
      expect(result.changes).toContain('Added brand context: Tom Ford')
    })

    it('NORM-013b: Designer vs Emporio Armani Distinction', () => {
      const designerResult = normalizer.normalizeFragranceName('Stronger With You', 'Emporio Armani')
      const giorgioResult = normalizer.normalizeFragranceName('Acqua di Gio', 'Giorgio Armani')
      
      expect(designerResult.canonicalName).toContain('Emporio Armani')
      expect(giorgioResult.canonicalName).toContain('Giorgio Armani')
    })

    it('NORM-013c: Niche Brand Full Names', () => {
      const result = normalizer.normalizeFragranceName('Delina', 'Parfums de Marly')
      
      expect(result.canonicalName).toBe('Parfums de Marly Delina')
      expect(result.changes).toContain('Added brand context: Parfums de Marly')
    })
  })

  describe('NORM-014: Quality Validation', () => {
    it('NORM-014a: No False Positives on Good Names', () => {
      const goodNames = [
        { name: 'Chanel No 5 Eau de Parfum', brand: 'Chanel' },
        { name: 'Tom Ford Black Orchid', brand: 'Tom Ford' },
        { name: 'Creed Aventus', brand: 'Creed' }
      ]

      goodNames.forEach(({ name, brand }) => {
        const result = normalizer.normalizeFragranceName(name, brand)
        expect(result.needsNormalization).toBe(false)
        expect(result.changes).toHaveLength(0)
        expect(result.confidence).toBe(1.0)
      })
    })

    it('NORM-014b: Preserve Important Details', () => {
      const result = normalizer.normalizeFragranceName('Aventus for Her', 'Creed')
      
      expect(result.canonicalName).toContain('for Her')
      expect(result.fragranceLine).toContain('Aventus for Her')
    })
  })
})