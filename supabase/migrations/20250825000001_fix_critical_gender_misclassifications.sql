-- Fix Critical Gender Classification Issues
-- 
-- Problem: Several fragrances are misclassified causing serious UX issues where:
-- 1. Men receive women's fragrance recommendations (feminine florals classified as men/unisex)
-- 2. Women receive men's fragrance recommendations (masculine fragrances classified as women)
--
-- Solution: Fix confirmed misclassifications and pattern-based issues

BEGIN;

-- =============================================================================
-- PART 1: Fix Confirmed Women's Fragrances Currently Misclassified
-- =============================================================================

-- Fix the 5 specific fragrances confirmed to be women's fragrances
UPDATE fragrances 
SET gender = 'women', last_updated = NOW()
WHERE id IN (
  'givenchy__live-irresistible-rosy-crush',         -- Currently: unisex → Should be: women
  'giorgio-armani__acqua-di-gioia-jasmine',         -- Currently: men → Should be: women  
  'guerlain__elixir-charnel-floral-romantique',     -- Currently: men → Should be: women
  'guerlain__mon-guerlain-bloom-of-rose',           -- Currently: unisex → Should be: women
  'guerlain__mon-guerlain-bloom-of-rose-eau-de-parfum', -- Currently: unisex → Should be: women
  'by-kilian__a-kiss-from-a-rose'                   -- Currently: unisex → Should be: women
);

-- =============================================================================
-- PART 2: Fix Pattern-Based Women's Fragrance Misclassifications  
-- =============================================================================

-- Fix fragrances with obvious feminine naming patterns currently classified as men
UPDATE fragrances 
SET gender = 'women', last_updated = NOW()
WHERE gender = 'men' 
  AND (
    -- Floral/feminine indicators that should never be classified as men
    name ILIKE '%jasmine%' OR
    name ILIKE '%floral romantique%' OR
    name ILIKE '%bloom intense%' OR
    (name ILIKE '%bloom%' AND name ILIKE '%rose%') OR
    (name ILIKE '%petite robe noire%' AND name ILIKE '%florale%')
  )
  -- No exclusions needed for now - all feminine patterns should be classified as women
  ;

-- =============================================================================
-- PART 3: Fix Pattern-Based Men's Fragrance Misclassifications
-- =============================================================================

-- Fix fragrances with obvious masculine naming patterns currently classified as women
UPDATE fragrances 
SET gender = 'men', last_updated = NOW()
WHERE gender = 'women' 
  AND name ILIKE '%pour homme%';

-- =============================================================================
-- PART 4: Logging and Verification
-- =============================================================================

-- Log the changes made for audit trail
DO $$
DECLARE
  women_fixes INTEGER;
  men_fixes INTEGER;
BEGIN
  -- Count women's fragrance fixes
  SELECT COUNT(*) INTO women_fixes
  FROM fragrances 
  WHERE gender = 'women' 
    AND last_updated >= NOW() - INTERVAL '1 minute'
    AND (
      id IN (
        'givenchy__live-irresistible-rosy-crush',
        'giorgio-armani__acqua-di-gioia-jasmine', 
        'guerlain__elixir-charnel-floral-romantique',
        'guerlain__mon-guerlain-bloom-of-rose',
        'guerlain__mon-guerlain-bloom-of-rose-eau-de-parfum',
        'by-kilian__a-kiss-from-a-rose'
      ) OR (
        (name ILIKE '%jasmine%' OR
         name ILIKE '%floral romantique%' OR
         name ILIKE '%bloom intense%' OR
         (name ILIKE '%bloom%' AND name ILIKE '%rose%') OR
         (name ILIKE '%petite robe noire%' AND name ILIKE '%florale%'))
      )
    );
    
  -- Count men's fragrance fixes  
  SELECT COUNT(*) INTO men_fixes
  FROM fragrances 
  WHERE gender = 'men' 
    AND last_updated >= NOW() - INTERVAL '1 minute'
    AND name ILIKE '%pour homme%';
    
  RAISE NOTICE 'Gender Classification Fix Summary:';
  RAISE NOTICE '- Fixed % fragrances to women gender classification', women_fixes;
  RAISE NOTICE '- Fixed % fragrances to men gender classification', men_fixes;
  RAISE NOTICE '- Total fixes: %', women_fixes + men_fixes;
END $$;

-- Verify current gender distribution after fixes
SELECT 
  gender,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM fragrances), 1) as percentage
FROM fragrances 
GROUP BY gender
ORDER BY count DESC;

-- Show specific fragrances that were fixed for verification
SELECT 
  'FIXED TO WOMEN' as fix_type,
  name,
  gender,
  brand_id
FROM fragrances 
WHERE gender = 'women' 
  AND last_updated >= NOW() - INTERVAL '1 minute'
  AND (
    id IN (
      'givenchy__live-irresistible-rosy-crush',
      'giorgio-armani__acqua-di-gioia-jasmine', 
      'guerlain__elixir-charnel-floral-romantique',
      'guerlain__mon-guerlain-bloom-of-rose',
      'guerlain__mon-guerlain-bloom-of-rose-eau-de-parfum',
      'by-kilian__a-kiss-from-a-rose'
    ) OR (
      name ILIKE '%jasmine%' OR
      name ILIKE '%floral romantique%' OR  
      name ILIKE '%bloom intense%' OR
      (name ILIKE '%bloom%' AND name ILIKE '%rose%') OR
      (name ILIKE '%petite robe noire%' AND name ILIKE '%florale%')
    )
  )

UNION ALL

SELECT 
  'FIXED TO MEN' as fix_type,
  name,
  gender,
  brand_id
FROM fragrances 
WHERE gender = 'men' 
  AND last_updated >= NOW() - INTERVAL '1 minute'
  AND name ILIKE '%pour homme%'

ORDER BY fix_type, name;

COMMIT;