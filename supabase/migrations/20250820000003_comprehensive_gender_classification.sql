-- Comprehensive Gender Classification Fix
-- 
-- Problem: 1,186 fragrances (60%) are marked as "unisex" when many should be properly 
-- classified as "women" or "men" based on traditional marketing and target demographics
--
-- Solution: Use intelligent pattern matching to properly classify fragrances

-- Update traditionally women's fragrances currently marked as unisex
UPDATE fragrances 
SET gender = 'women'
WHERE gender = 'unisex' 
  AND (
    -- Classic women's fragrance names
    name ILIKE '%poison%' OR           -- Dior Poison, Midnight Poison
    name ILIKE '%velvet orchid%' OR    -- Tom Ford Velvet Orchid
    name ILIKE '%addict%' OR           -- Dior Addict
    name ILIKE '%gabrielle%' OR        -- Chanel Gabrielle
    name ILIKE '%no 5%' OR            -- Chanel No 5
    name ILIKE '%coco mademoiselle%' OR
    name ILIKE '%chance%' OR           -- Chanel Chance series
    name ILIKE '%allure sensuelle%' OR
    name ILIKE '%flowerbomb%' OR       -- Viktor & Rolf Flowerbomb
    name ILIKE '%good girl%' OR        -- Carolina Herrera Good Girl
    name ILIKE '%very irresistible%' OR
    name ILIKE '%daisy%' OR            -- Marc Jacobs Daisy
    name ILIKE '%black opium%' OR      -- YSL Black Opium
    name ILIKE '%libre%' OR            -- YSL Libre
    name ILIKE '%olympea%' OR          -- Paco Rabanne Olympea
    name ILIKE '%lady million%' OR     -- Paco Rabanne Lady Million
    name ILIKE '%scandal%' OR          -- Jean Paul Gaultier Scandal
    name ILIKE '%classique%' OR        -- Jean Paul Gaultier Classique
    name ILIKE '%si%' AND brand_id = 'giorgio-armani' OR  -- Armani Si
    name ILIKE '%romance%' OR          -- Ralph Lauren Romance
    name ILIKE '%beautiful%' OR        -- Estee Lauder Beautiful
    name ILIKE '%white tea%' OR        -- Elizabeth Arden White Tea
    name ILIKE '%pleasures%' OR        -- Estee Lauder Pleasures
    name ILIKE '%eternity%' AND name NOT ILIKE '%homme%' AND name NOT ILIKE '%men%' OR
    name ILIKE '%obsession%' AND name NOT ILIKE '%homme%' AND name NOT ILIKE '%men%' OR
    name ILIKE '%escape%' AND name NOT ILIKE '%homme%' AND name NOT ILIKE '%men%' OR
    name ILIKE '%contradiction%' OR
    name ILIKE '%white linen%' OR
    name ILIKE '%youth dew%' OR
    name ILIKE '%private collection%' AND name NOT ILIKE '%men%' OR
    name ILIKE '%knowing%' OR
    name ILIKE '%cinnabar%' OR
    name ILIKE '%bronze goddess%' OR
    name ILIKE '%jasmine%' OR          -- Floral indicators
    name ILIKE '%peony%' OR
    name ILIKE '%magnolia%' OR
    name ILIKE '%gardenia%' OR
    name ILIKE '%tuberose%' OR
    name ILIKE '%iris%' OR
    name ILIKE '%violet%' OR
    name ILIKE '%cherry blossom%' OR
    name ILIKE '%white flowers%'
  );

-- Update traditionally men's fragrances currently marked as unisex  
UPDATE fragrances 
SET gender = 'men'
WHERE gender = 'unisex' 
  AND (
    -- Classic men's fragrance names
    name ILIKE '%sauvage%' OR          -- Dior Sauvage
    name ILIKE '%acqua di gio%' OR     -- Armani Acqua di Gio
    name ILIKE '%bleu de%' OR          -- Chanel Bleu de Chanel
    name ILIKE '%aventus%' OR          -- Creed Aventus
    name ILIKE '%green irish tweed%' OR
    name ILIKE '%millisime imperial%' OR
    name ILIKE '%silver mountain%' OR
    name ILIKE '%allure homme%' OR
    name ILIKE '%egoiste%' OR
    name ILIKE '%antaeus%' OR
    name ILIKE '%polo%' AND brand_id = 'ralph-lauren' OR
    name ILIKE '%one million%' OR      -- Paco Rabanne One Million
    name ILIKE '%invictus%' OR         -- Paco Rabanne Invictus
    name ILIKE '%le male%' OR          -- Jean Paul Gaultier Le Male
    name ILIKE '%ultra male%' OR
    name ILIKE '%la nuit de%' OR       -- YSL La Nuit de L'Homme
    name ILIKE '%l homme%' OR
    name ILIKE '%homme%' OR            -- General "Homme" indicator
    name ILIKE '%man%' AND name NOT ILIKE '%woman%' AND name NOT ILIKE '%human%' OR
    name ILIKE '%noir extreme%' OR     -- Tom Ford Noir Extreme
    name ILIKE '%oud wood%' OR         -- Typically masculine oud
    name ILIKE '%tobacco%' OR          -- Tobacco typically masculine
    name ILIKE '%stronger with you%' OR
    name ILIKE '%code%' AND brand_id = 'giorgio-armani' AND name NOT ILIKE '%women%' OR
    name ILIKE '%reflection man%' OR
    name ILIKE '%jubilation xxv%' OR
    name ILIKE '%interlude%' OR
    name ILIKE '%epic%' AND name NOT ILIKE '%woman%'
  );

-- Log the comprehensive changes made
DO $$
DECLARE
  women_count INTEGER;
  men_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO women_count FROM fragrances WHERE gender = 'women';
  SELECT COUNT(*) INTO men_count FROM fragrances WHERE gender = 'men';
  
  RAISE NOTICE 'After comprehensive classification: % women fragrances, % men fragrances', women_count, men_count;
END $$;

-- Final gender distribution
SELECT 
  gender,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM fragrances), 1) as percentage
FROM fragrances 
WHERE gender IS NOT NULL
GROUP BY gender
ORDER BY count DESC;