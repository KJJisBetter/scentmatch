# Data Import Specification

This is the data import specification for the spec detailed in @.agent-os/specs/2025-08-19-fragrance-catalog-rebuild/spec.md

## Import Source Data

### Primary Dataset: fragrances-final-2025.json
- **Count:** 2,017 fragrances (vs 1,400 current)
- **Organization:** Sorted by popularity score (16.3784 → lowest)
- **Structure:** id, brandId, brandName, name, ratingValue, ratingCount, score, gender, accords, perfumers, url
- **Quality:** Complete major brand coverage (Dior 45, Chanel 45, Tom Ford 45, Ralph Lauren 57)

### Secondary Dataset: brands-final-2025.json  
- **Count:** 76 brands (vs current incomplete set)
- **Coverage:** All brands referenced in fragrance dataset
- **Missing Brands Added:** Ralph Lauren, Hugo Boss, complete luxury brands

## Data Transformation Requirements

### Brand Data Processing
```javascript
// Transform brand data for database import
const brandTransforms = {
  // Clean brand names and generate proper IDs
  generateBrandId: (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
  
  // Determine brand tier based on fragrance count and popularity
  determineBrandTier: (itemCount, avgScore) => {
    if (itemCount >= 40) return 'major';      // Dior, Chanel, etc.
    if (avgScore >= 15) return 'premium';     // High-quality boutique
    if (itemCount >= 10) return 'niche';     // Established niche
    return 'emerging';                        // New or smaller brands
  }
};
```

### Fragrance Data Processing
```javascript
// Transform fragrance data for database import
const fragranceTransforms = {
  // Clean fragrance names (remove "for women/men" suffixes)
  cleanName: (name) => name.replace(/ (for )?(women|men)( and men)?$/i, ''),
  
  // Normalize gender values
  normalizeGender: (gender) => {
    if (gender === 'for women') return 'women';
    if (gender === 'for men') return 'men';
    if (gender === 'for women and men') return 'unisex';
    return 'unisex';
  },
  
  // Calculate sample pricing based on brand tier and popularity
  calculateSamplePrice: (score, brandTier) => {
    const basePrice = brandTier === 'major' ? 18 : 
                     brandTier === 'premium' ? 15 : 
                     brandTier === 'niche' ? 12 : 10;
    const popularityBonus = score > 15 ? 3 : score > 10 ? 2 : 0;
    return Math.min(basePrice + popularityBonus, 25);
  }
};
```

## Import Process Flow

### Phase 1: Brand Import (76 records)
1. Read `brands-final-2025.json`
2. Transform brand data (ID generation, tier assignment)
3. Insert into `fragrance_brands` table
4. Validate all 76 brands imported successfully

### Phase 2: Fragrance Import (2,017 records)
1. Read `fragrances-final-2025.json`
2. Transform fragrance data (name cleaning, gender normalization)
3. Batch insert in groups of 100 for performance
4. **AUTO-EMBEDDING:** Trigger will automatically queue embedding generation
5. Validate all 2,017 fragrances imported successfully

### Phase 3: Embedding Pipeline Monitoring
1. Monitor `ai_processing_queue` for embedding tasks (should be ~2,017 tasks)
2. Verify auto-embedding trigger creates tasks with priority 3 (new fragrances)
3. Check embedding generation progress via pipeline monitoring
4. Validate embedding completion and quality

## Data Quality Validations

### Post-Import Checks
```sql
-- Verify complete import counts
SELECT COUNT(*) FROM fragrance_brands; -- Expected: 76
SELECT COUNT(*) FROM fragrances; -- Expected: 2,017

-- Verify top brands have complete collections
SELECT fb.name, COUNT(*) as fragrance_count
FROM fragrances f 
JOIN fragrance_brands fb ON f.brand_id = fb.id 
WHERE fb.name IN ('Dior', 'Chanel', 'Tom Ford', 'Ralph Lauren', 'Hugo Boss')
GROUP BY fb.name 
ORDER BY fragrance_count DESC;
-- Expected: Ralph Lauren=57, Hugo Boss=57, Dior=45, Chanel=45, Tom Ford=45

-- Verify popularity ordering works
SELECT name, popularity_score 
FROM fragrances 
ORDER BY popularity_score DESC 
LIMIT 10;
-- Should show actual popular fragrances, not alphabetical

-- Verify auto-embedding queue status
SELECT task_type, status, COUNT(*) 
FROM ai_processing_queue 
WHERE task_type = 'embedding_generation' 
GROUP BY task_type, status;
-- Should show embedding tasks being processed
```

## Import Performance Considerations

### Batch Processing Strategy
- Import brands first (fast, only 76 records)
- Import fragrances in batches of 100 to avoid timeouts
- Auto-embedding trigger will queue ~2,017 embedding tasks
- Expected total import time: 5-10 minutes + embedding processing time
- Embedding cost: ~$0.10 total for all fragrances

### Error Handling
- Validate each batch before proceeding
- Log any fragrance records that fail validation
- Ensure foreign key constraints work (brand_id references)
- Monitor embedding queue for failed tasks