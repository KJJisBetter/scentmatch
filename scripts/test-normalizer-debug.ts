#!/usr/bin/env ts-node

/**
 * Debug script to test specific normalization cases
 */

import { FragranceNormalizer } from '../lib/data-quality/fragrance-normalizer'

const normalizer = new FragranceNormalizer()

// Test the specific failing case
console.log('Testing: "N05 EAU PREMIERE 2019" with brand "Chanel"')
const result = normalizer.normalizeFragranceName('N05 EAU PREMIERE 2019', 'Chanel')

console.log('Result:', JSON.stringify(result, null, 2))

// Test regex directly
console.log('\nTesting multi-word caps regex:')
const testString = 'N05 EAU PREMIERE 2019'
const multiWordCapsRegex = /\b[A-Z]{2,}\s+[A-Z]{2,}\b/g
const matches = testString.match(multiWordCapsRegex)
console.log('Matches:', matches)

// Test after N05 replacement
const afterN05 = 'No 5 EAU PREMIERE 2019'
const matches2 = afterN05.match(multiWordCapsRegex)
console.log('After N05 replacement matches:', matches2)