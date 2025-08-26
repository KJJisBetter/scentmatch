-- Fix Gender Classifications Based on Original CSV Data
-- Generated on 2025-08-25T05:46:47.325Z
--
-- Root cause: standardizeGender() function was over-complicated and 
-- incorrectly converted clean CSV gender values to unisex
--
-- This migration restores the original, correct gender classifications

-- Fix fragrances that should be "women" (69)
UPDATE fragrances SET 
  gender = 'women',
  last_updated = now()
WHERE id IN (
  'dolce-gabbana__dolce-rosa-excelsa' -- Rosa Excelsa by Dolce & Gabbana,
  'tom-ford__cafe-rose-2023' -- Cafe Rose 2023 by Tom Ford,
  'chanel__no-5-eau-de-parfum' -- No 5 EDP by Chanel,
  'guerlain__la-petite-robe-noire' -- La Petite Robe Noire by Guerlain,
  'by-kilian__can-t-stop-loving-you' -- Can T Stop Loving You by By Kilian,
  'chanel__no-5-parfum' -- No 5 Parfum by Chanel,
  'dolce-gabbana__dolce-shine' -- Shine by Dolce & Gabbana,
  'dior__me-dior-me-not' -- Me Me Not by Christian Dior,
  'dolce-gabbana__dolce-floral-drops' -- Floral Drops by Dolce & Gabbana,
  'giorgio-armani__emporio-armani-diamonds' -- Emporio Diamonds by Giorgio Armani,
  'gucci__bloom' -- Bloom by Gucci,
  'gucci__rush' -- Rush by Gucci,
  'giorgio-armani__emporio-armani-because-it-s-you' -- Emporio Because It S You by Giorgio Armani,
  'givenchy__irresistible-givenchy-rose-velvet' -- Irresistible Rose Velvet by Givenchy,
  'gucci__bloom-nettare-di-fiori' -- Bloom Nettare Di Fiori by Gucci,
  'giorgio-armani__acqua-di-gioia-essenza' -- Acqua Di Gioia Essenza by Giorgio Armani,
  'dolce-gabbana__light-blue' -- Light Blue by Dolce & Gabbana,
  'givenchy__eaudemoiselle-de-givenchy' -- Eaudemoiselle De by Givenchy,
  'giorgio-armani__acqua-di-gioia' -- Acqua Di Gioia by Giorgio Armani,
  'gucci__guilty' -- Guilty by Gucci,
  'gucci__guilty-eau' -- Guilty Eau by Gucci,
  'gucci__bloom-ambrosia-di-fiori' -- Bloom Ambrosia Di Fiori by Gucci,
  'versace__crystal-noir' -- Crystal Noir by Versace,
  'giorgio-armani__acqua-di-gioia-intense' -- Acqua Di Gioia Intense by Giorgio Armani,
  'gucci__guilty-eau-de-parfum' -- Guilty EDP by Gucci,
  'prada__paradoxe-intense' -- Paradoxe Intense by Prada,
  'dior__eau-de-dolce-vita' -- Eau de Dolce Vita by Christian Dior,
  'givenchy__eaudemoiselle-de-givenchy-eau-fraiche' -- Eaudemoiselle De Eau Fraiche by Givenchy,
  'giorgio-armani__acqua-di-gioia-eau-fraiche' -- Acqua Di Gioia Eau Fraiche by Giorgio Armani,
  'guerlain__black-perfecto-by-la-petite-robe-noire' -- Black Perfecto By la Petite Robe Noire by Guerlain,
  'dolce-gabbana__l-eau-the-one' -- L Eau The One by Dolce & Gabbana,
  'gucci__by-gucci-eau-de-parfum' -- By EDP by Gucci,
  'chanel__no-5-eau-de-toilette' -- No 5 EDT by Chanel,
  'guerlain__la-petite-robe-noire-legere' -- La Petite Robe Noire Legere by Guerlain,
  'dolce-gabbana__light-blue-escape-to-panarea' -- Light Blue Escape To Panarea by Dolce & Gabbana,
  'giorgio-armani__armani-code-absolu-femme' -- Code Absolu Femme by Giorgio Armani,
  'chanel__no-5-eau-de-cologne' -- No 5 Cologne by Chanel,
  'guerlain__idylle-eau-sublime' -- Idylle Eau Sublime by Guerlain,
  'valentino__donna' -- Donna by Valentino,
  'gucci__accenti' -- Accenti by Gucci,
  'yves-saint-laurent__nu-eau-de-toilette' -- Nu EDT by Yves Saint Laurent,
  'chanel__n019' -- N019 by Chanel,
  'gucci__guilty-eau-de-toilette' -- Guilty EDT by Gucci,
  'valentino__v' -- V by Valentino,
  'chanel__1932-eau-de-parfum' -- 1932 by Chanel,
  'lolita-lempicka__l-de-lolita-lempicka' -- L De by Lolita Lempicka,
  'valentino__donna-acqua' -- Donna Acqua by Valentino,
  'chanel__no-19-poudre' -- No 19 Poudre by Chanel,
  'gucci__eau-de-parfum-ii' -- Ii by Gucci,
  'ralph-lauren__blue' -- Blue by Ralph Lauren,
  'giorgio-armani__armani-code-satin' -- Code Satin by Giorgio Armani,
  'givenchy__l-interdit-eau-de-parfum-intense' -- L Interdit Intense by Givenchy,
  'bath-body-works__you-re-the-one' -- You Re The One by Bath Body Works,
  'chanel__no-19-eau-de-parfum' -- No 19 EDP by Chanel,
  'guerlain__l-instant-de-guerlain-eau-de-parfum' -- L Instant De EDP by Guerlain,
  'dior__remember-me' -- Remember Me by Christian Dior,
  'chanel__n022-eau-de-parfum' -- N022 EDP by Chanel,
  'givenchy__les-parfums-mythiques-extravagance-d-amarige' -- Les Parfums Mythiques Extravagance D Amarige by Givenchy,
  'chanel__n022' -- N022 by Chanel,
  'guerlain__eau-de-shalimar-2009' -- Eau de Shalimar 2009 by Guerlain,
  'dior__essence' -- Essence by Christian Dior,
  'giorgio-armani__armani' -- Armani by Giorgio Armani,
  'guerlain__mon-guerlain-eau-de-parfum-intense' -- Mon Intense by Guerlain,
  'paco-rabanne__la-nuit' -- La Nuit by Paco Rabanne,
  'givenchy__iii' -- Iii by Givenchy,
  'guerlain__spiritueuse-double-vanille' -- Spiritueuse Double Vanille by Guerlain,
  'guerlain__l-instant-de-guerlain-extract' -- L Instant de Extract by Guerlain,
  'chanel__no-5-l-eau-red-edition' -- No 5 L Eau Red Edition by Chanel,
  'guerlain__shalimar-eau-de-parfum-serie-limitee' -- Shalimar Serie Limitee by Guerlain
);

-- Fix fragrances that should be "men" (27)
UPDATE fragrances SET 
  gender = 'men',
  last_updated = now()
WHERE id IN (
  'dolce-gabbana__k-by-dolce-gabbana' -- K By (2) by Dolce & Gabbana,
  'yves-saint-laurent__y' -- Y (2) by Yves Saint Laurent,
  'montblanc__legend' -- Legend by Montblanc,
  'giorgio-armani__armani-code-eau-de-toilette' -- Code EDT by Giorgio Armani,
  'dolce-gabbana__k-by-dolce-gabbana-eau-de-parfum' -- K By EDP by Dolce & Gabbana,
  'amouage__silver-man' -- Silver Man by Amouage,
  'bottega-veneta__illusione-for-him' -- Illusione For Him by Bottega Veneta,
  'paco-rabanne__black-xs-2018' -- Black Xs 2018 by Paco Rabanne,
  'giorgio-armani__emporio-armani-lui' -- Emporio Lui by Giorgio Armani,
  'yves-saint-laurent__l-homme-parfum-intense' -- L Homme Intense by Yves Saint Laurent,
  'guerlain__arsene-lupin-voyou-eau-de-parfum' -- Arsene Lupin Voyou by Guerlain,
  'yves-saint-laurent__y-eau-de-toilette' -- Y EDT by Yves Saint Laurent,
  'yves-saint-laurent__y-eau-fraiche' -- Y Eau Fraiche by Yves Saint Laurent,
  'givenchy__play-intense' -- Play Intense by Givenchy,
  'giorgio-armani__armani-eau-de-nuit' -- Eau de Nuit by Giorgio Armani,
  'montblanc__legend-eau-de-parfum' -- Legend EDP by Montblanc,
  'ralph-lauren__romance-for-men' -- Romance For Men by Ralph Lauren,
  'chanel__pour-monsieur-concentree' -- Pour Monsieur Concentree by Chanel,
  'bvlgari__man-in-black' -- Man In Black by Bvlgari,
  'giorgio-armani__armani-attitude' -- Attitude by Giorgio Armani,
  'giorgio-armani__armani-code-parfum' -- Code Parfum by Giorgio Armani,
  'chanel__bleu-de-chanel-parfum' -- Bleu De Parfum by Chanel,
  'guerlain__homme-intense' -- Homme Intense by Guerlain,
  'guerlain__heritage-eau-de-toilette' -- Heritage EDT by Guerlain,
  'valentino__uomo-intense' -- Uomo Intense by Valentino,
  'guerlain__habit-rouge-eau-de-cologne' -- Habit Rouge Cologne by Guerlain,
  'valentino__uomo-intense-2021' -- Uomo Intense 2021 by Valentino
);

-- Fix fragrances that should be "unisex" (22)
UPDATE fragrances SET 
  gender = 'unisex',
  last_updated = now()
WHERE id IN (
  'by-kilian__sunkissed-goddess' -- Sunkissed Goddess by By Kilian,
  'calvin-klein__ck-one-collector-s-edition' -- Ck One Collector S Edition by Calvin Klein,
  'by-kilian__yes-i-was-madly-in-love-but-that-was-yesterday' -- Yes I Was Madly In Love But That Was Yesterday by By Kilian,
  'guerlain__petit-guerlain' -- Petit by Guerlain,
  'roja-dove__manhattan-eau-de-parfum' -- Manhattan by Roja Dove,
  'tom-ford__costa-azzurra-acqua' -- Costa Azzurra Acqua by Tom Ford,
  'tom-ford__cafe-rose' -- Cafe Rose by Tom Ford,
  'dior__sakura' -- Sakura by Christian Dior,
  'calvin-klein__ck-one-reflections' -- Ck One Reflections by Calvin Klein,
  'tom-ford__sole-di-positano' -- Sole Di Positano by Tom Ford,
  'chanel__le-lion-eau-de-parfum' -- Le Lion by Chanel,
  'dior__eau-noire' -- Eau Noire by Christian Dior,
  'by-kilian__i-don-t-need-a-prince-by-my-side-to-be-a-princess-rose-de-mai' -- I Don T Need A Prince My Side To Be A Princess Rose de Mai by By Kilian,
  'guerlain__eau-de-cashmere' -- Eau de Cashmere by Guerlain,
  'roja-dove__parfum-de-la-nuit-no-1' -- De la Nuit No 1 by Roja Dove,
  'maison-francis-kurkdjian__baccarat-rouge-540-extrait-limited-edition' -- Baccarat Rouge 540 Limited Edition by Maison Francis Kurkdjian,
  'by-kilian__i-don-t-need-a-prince-by-my-side-to-be-a-princess' -- I Don T Need A Prince My Side To Be A Princess by By Kilian,
  'guerlain__eau-de-guerlain' -- Eau De by Guerlain,
  'guerlain__neroli-outrenoir' -- Neroli Outrenoir by Guerlain,
  'guerlain__petit-guerlain-in-pink' -- Petit In Pink by Guerlain,
  'roja-dove__parfum-de-la-nuit-no-2' -- De la Nuit No 2 by Roja Dove,
  'roja-dove__united-arab-emirates-spirit-of-the-union' -- United Arab Emirates Spirit Of The Union by Roja Dove
);

-- Verification: Check gender distribution after fix
SELECT 
  gender,
  count(*) as count,
  round(count(*) * 100.0 / sum(count(*)) over(), 1) as percentage
FROM fragrances 
GROUP BY gender 
ORDER BY count DESC;
