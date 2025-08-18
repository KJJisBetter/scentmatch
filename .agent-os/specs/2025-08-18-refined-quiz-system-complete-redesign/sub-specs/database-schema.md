# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-18-refined-quiz-system-complete-redesign/spec.md

## Fragrance Data Cleanup Migration

### Current Data Issues

- Fragrance names contain gender suffixes: "Coach for Men", "Chanel No. 5 for Women"
- Inconsistent brand name formatting
- Missing structured fields for intensity and usage guidance
- Gender information embedded in names rather than separate field

### Migration Script Requirements

#### Phase 1: Data Backup

```sql
-- Create backup table before any modifications
CREATE TABLE fragrances_backup AS
SELECT * FROM fragrances;
```

#### Phase 2: Name Cleanup

```sql
-- Remove " for Men" suffixes
UPDATE fragrances
SET name = REPLACE(name, ' for Men', '')
WHERE name LIKE '% for Men';

-- Remove " for Women" suffixes
UPDATE fragrances
SET name = REPLACE(name, ' for Women', '')
WHERE name LIKE '% for Women';

-- Remove " Men's" suffixes
UPDATE fragrances
SET name = REPLACE(name, ' Men''s', '')
WHERE name LIKE '% Men''s';

-- Remove " Women's" suffixes
UPDATE fragrances
SET name = REPLACE(name, ' Women''s', '')
WHERE name LIKE '% Women''s';

-- Clean up brand names (standardize capitalization)
UPDATE fragrances
SET brand = TRIM(brand);
```

#### Phase 3: Add New Fields

```sql
-- Add intensity classification field
ALTER TABLE fragrances
ADD COLUMN intensity VARCHAR(20) CHECK (intensity IN ('subtle', 'moderate', 'intense'));

-- Add longevity field
ALTER TABLE fragrances
ADD COLUMN longevity VARCHAR(20) CHECK (longevity IN ('3-5 hours', '4-6 hours', '6-8+ hours'));

-- Add spray guidance field
ALTER TABLE fragrances
ADD COLUMN spray_guidance VARCHAR(20) CHECK (spray_guidance IN ('1-2 sprays', '2-3 sprays', '3-4 sprays'));

-- Add structured gender field if not exists
ALTER TABLE fragrances
ADD COLUMN gender VARCHAR(10) CHECK (gender IN ('women', 'men', 'unisex'))
WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fragrances' AND column_name = 'gender');
```

#### Phase 4: Populate New Fields Based on Existing Data

```sql
-- Set default intensity based on fragrance type/brand patterns
UPDATE fragrances
SET intensity = CASE
    WHEN brand IN ('Tom Ford', 'Creed', 'Maison Margiela') THEN 'intense'
    WHEN brand IN ('Calvin Klein', 'Marc Jacobs', 'Dolce & Gabbana') THEN 'moderate'
    ELSE 'moderate'
END
WHERE intensity IS NULL;

-- Set default longevity based on intensity
UPDATE fragrances
SET longevity = CASE
    WHEN intensity = 'intense' THEN '6-8+ hours'
    WHEN intensity = 'moderate' THEN '4-6 hours'
    WHEN intensity = 'subtle' THEN '3-5 hours'
    ELSE '4-6 hours'
END
WHERE longevity IS NULL;

-- Set spray guidance based on intensity
UPDATE fragrances
SET spray_guidance = CASE
    WHEN intensity = 'intense' THEN '1-2 sprays'
    WHEN intensity = 'moderate' THEN '2-3 sprays'
    WHEN intensity = 'subtle' THEN '3-4 sprays'
    ELSE '2-3 sprays'
END
WHERE spray_guidance IS NULL;
```

### Data Validation Queries

#### Verify Cleanup Success

```sql
-- Check for remaining gender suffixes
SELECT id, name, brand
FROM fragrances
WHERE name LIKE '% for Men'
   OR name LIKE '% for Women'
   OR name LIKE '% Men''s'
   OR name LIKE '% Women''s';

-- Verify all required fields populated
SELECT COUNT(*) as missing_intensity
FROM fragrances
WHERE intensity IS NULL;

SELECT COUNT(*) as missing_longevity
FROM fragrances
WHERE longevity IS NULL;

SELECT COUNT(*) as missing_spray_guidance
FROM fragrances
WHERE spray_guidance IS NULL;
```

#### Data Quality Checks

```sql
-- Check for duplicate fragrances after cleanup
SELECT name, brand, COUNT(*) as duplicate_count
FROM fragrances
GROUP BY name, brand
HAVING COUNT(*) > 1;

-- Verify intensity distribution is reasonable
SELECT intensity, COUNT(*) as count
FROM fragrances
GROUP BY intensity;
```

### Post-Migration Updates

#### Update Application Queries

- Remove any existing gender-based filtering that relied on name patterns
- Update fragrance display components to use cleaned names
- Add intensity and spray guidance to recommendation logic
- Update search functionality to work with cleaned data

#### API Response Format Updates

```json
{
  "fragrance_id": "123",
  "name": "Coach",
  "brand": "Coach",
  "gender": "men",
  "intensity": "moderate",
  "longevity": "4-6 hours",
  "spray_guidance": "2-3 sprays",
  "rating": 4.2,
  "notes": ["citrus", "woods", "amber"]
}
```

### Rollback Plan

```sql
-- If migration fails, restore from backup
DROP TABLE fragrances;
ALTER TABLE fragrances_backup RENAME TO fragrances;
```

### Migration Validation Checklist

- [ ] Backup created successfully
- [ ] All gender suffixes removed from names
- [ ] New fields added with proper constraints
- [ ] All records have intensity, longevity, spray guidance populated
- [ ] No duplicate fragrances created
- [ ] API responses use new format
- [ ] Frontend displays cleaned names correctly
- [ ] Search functionality works with cleaned data
