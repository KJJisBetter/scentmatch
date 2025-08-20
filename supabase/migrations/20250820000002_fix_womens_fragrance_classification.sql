-- Fix Women's Fragrance Gender Classification
-- 
-- Problem: Fragrances with "For Women", "Women", "Lady", etc. in names are incorrectly 
-- classified as "unisex" instead of "women", causing severe gender imbalance in browse results
--
-- Solution: Properly classify obvious women's fragrances as "women" gender

-- Update fragrances with clear women's naming patterns
UPDATE fragrances 
SET gender = 'women'
WHERE gender = 'unisex' 
  AND (
    -- Direct women indicators
    name ILIKE '%for women%' OR
    name ILIKE '%women%' OR
    name ILIKE '%woman%' OR
    name ILIKE '%lady%' OR
    name ILIKE '%feminine%' OR
    name ILIKE '%girl%' OR
    name ILIKE '%miss%' OR
    name ILIKE '%her%' OR
    name ILIKE '%she%' OR
    name ILIKE '%mademoiselle%' OR
    name ILIKE '%madame%' OR
    name ILIKE '%belle%' OR
    name ILIKE '%donna%' OR
    name ILIKE '%femme%'
  );

-- Log the changes made
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % fragrances from unisex to women gender classification', updated_count;
END $$;

-- Verify the gender distribution after changes
SELECT 
  gender,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM fragrances), 1) as percentage
FROM fragrances 
GROUP BY gender
ORDER BY count DESC;