#!/usr/bin/env ts-node

import { FragranceNormalizer } from '../lib/data-quality/fragrance-normalizer'

const normalizer = new FragranceNormalizer()

// Test the case sensitivity issue
console.log('Testing: "chanel no 5" with brand "Chanel"')
const result = normalizer.normalizeFragranceName('chanel no 5', 'Chanel')
console.log('Result:', JSON.stringify(result, null, 2))