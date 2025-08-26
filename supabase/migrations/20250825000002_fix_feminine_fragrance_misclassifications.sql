-- Fix Obviously Misclassified Feminine Fragrances
-- These fragrances have clearly feminine names/marketing but are classified as men's/unisex

-- Log the changes we're making
INSERT INTO fragrance_migration_log (migration_name, description, created_at)
VALUES (
    '20250825000002_fix_feminine_fragrance_misclassifications',
    'Fixing fragrances with obviously feminine names that were misclassified as men''s or unisex',
    NOW()
);

-- Update fragrances with clearly feminine names to women's category
UPDATE fragrances 
SET 
    gender = 'women',
    last_updated = NOW()
WHERE id IN (
    -- Fragrances with "Blush" in name
    'burberry__my-burberry-blush',
    'calvin-klein__eternity-rose-blush', 
    'valentino__valentina-blush',
    
    -- Fragrances with "Baby" + feminine terms
    'versace__baby-rose-jeans',
    
    -- Pink/feminine color terms
    'aquolina__pink-sugar',
    
    -- Princess/feminine titles
    'by-kilian__i-don-t-need-a-prince-by-my-side-to-be-a-princess',
    'by-kilian__i-don-t-need-a-prince-by-my-side-to-be-a-princess-rose-de-mai',
    
    -- Flora line (Gucci's women's line)
    'gucci__flora-by-gucci-gracious-tuberose',
    'gucci__flora-gorgeous-jasmine',
    
    -- Classic women's fragrances misclassified
    'paco-rabanne__calandre'  -- Famous 1970s women's fragrance
);

-- Fix the obvious error: "Polo Sport Woman" classified as men's
UPDATE fragrances 
SET 
    gender = 'women',
    last_updated = NOW()
WHERE id = 'ralph-lauren__polo-sport-woman'
AND gender = 'men';

-- Log the specific changes
INSERT INTO data_quality_issues (
    issue_type,
    severity,
    description,
    affected_records,
    resolution_status,
    created_at
) VALUES (
    'gender_misclassification',
    'high',
    'Fixed 11 fragrances with obviously feminine names that were classified as men''s or unisex. These were appearing in men''s recommendations inappropriately.',
    11,
    'resolved',
    NOW()
);

-- PART 2: Fix "For Her" and other obviously women's fragrances
-- Applied as separate migration: fix_for_her_fragrance_misclassifications

-- All "For Her" fragrances should obviously be women's
UPDATE fragrances 
SET 
    gender = 'women',
    last_updated = NOW()
WHERE id IN (
    -- "For Her" fragrances
    'creed__aventus-for-her',
    'paco-rabanne__black-xs-for-her',
    'paco-rabanne__black-xs-for-her-eau-de-parfum',
    'paco-rabanne__black-xs-l-exces-for-her',
    'calvin-klein__ck-one-red-edition-for-her',
    'calvin-klein__ck-one-shock-for-her',
    'calvin-klein__ck-one-shock-street-edition-for-her',
    'giorgio-armani__emporio-armani-city-glam-for-her',
    'giorgio-armani__emporio-remix-for-her',
    'giorgio-armani__emporio-armani-white-for-her',
    'givenchy__play-for-her-intense',
    'hugo-boss__boss-the-scent-for-her',
    'hugo-boss__boss-the-scent-for-her-absolute',
    'hugo-boss__boss-the-scent-private-accord-for-her',
    
    -- Burberry "Her" line (women's line)
    'burberry__her',
    'burberry__her-eau-de-toilette', 
    'burberry__her-elixir-de-parfum',
    'burberry__her-intense',
    
    -- Other obviously feminine names
    'giorgio-armani__emporio-armani-she',  -- "She"
    'by-kilian__sunkissed-goddess'  -- "Goddess"
);

-- SUMMARY: Fixed 31 total fragrances with obvious gender misclassifications
-- 11 fragrances with feminine names (blush, rose, pink, princess, flora)
-- 20 "For Her" and other explicitly women's fragrances
--
-- These were appearing incorrectly in men's recommendations and causing user confusion