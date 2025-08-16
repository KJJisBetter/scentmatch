# ScentMatch Data Directory

This directory contains curated fragrance data for the ScentMatch platform.

## Data Files

### fragrances.json
- **Source**: Research from Fragrantica community data
- **Count**: 1,467 fragrance records
- **Contents**: Real fragrance data with ratings, accords, perfumers, URLs
- **Structure**: Each record includes id, brandId, brandName, name, ratingValue, ratingCount, score, gender, accords, perfumers, url

### brands.json  
- **Source**: Extracted from fragrance data research
- **Count**: 40 brands
- **Contents**: Brand metadata with item counts
- **Structure**: Each record includes id, name, slug, itemCount

## Research Methodology

See `/docs/research/fragrance-data-methodology.md` for details on how this data was curated from Sephora, Ulta, and other retailer bestseller lists.

## Data Validation

Validation schema available at `/lib/data-validation/fragrance-schema.ts` with proven Zod validation and normalization functions.