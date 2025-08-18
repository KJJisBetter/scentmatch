# Fragrance Database Rebuild - Implementation Guide

**Date:** 2025-08-18  
**Status:** Ready for Implementation  
**Target:** Expand from 1,467 to 2,000+ popular fragrances

## Quick Start Implementation

### Immediate Actions (This Week)

**1. Set Up Data Collection Infrastructure**

```bash
# Create data collection directories
mkdir -p data/collection/{raw,processed,validated}
mkdir -p scripts/data-processing

# Install required packages
npm install apify-client puppeteer csv-parser
```

**2. Create Data Processing Scripts**

Create `/scripts/data-processing/fragrantica-collector.ts`:

```typescript
import { ApifyClient } from 'apify-client';

interface FragranticaRecord {
  name: string;
  brand: string;
  rating: number;
  votes: number;
  accords: string[];
  notes: string;
  url: string;
  year?: number;
}

export async function collectTopFragrances(
  limit = 2500
): Promise<FragranticaRecord[]> {
  const client = new ApifyClient({
    token: process.env.APIFY_TOKEN, // Get from apify.com
  });

  // Target high-rated fragrances with significant vote counts
  const searchQueries = [
    'https://www.fragrantica.com/search/?query=&order=rating&min_votes=1000',
    'https://www.fragrantica.com/search/?query=&order=popularity',
    'https://www.fragrantica.com/awards/',
    'https://www.fragrantica.com/perfume/bestsellers/',
  ];

  const allResults: FragranticaRecord[] = [];

  for (const query of searchQueries) {
    try {
      const run = await client.actor('lexis-solutions/fragrantica').call({
        startUrls: [{ url: query }],
        maxItems: Math.ceil(limit / searchQueries.length),
        proxyConfiguration: { useApifyProxy: true },
      });

      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      allResults.push(...items.map(transformRecord));
    } catch (error) {
      console.error(`Failed to collect from ${query}:`, error);
    }
  }

  return deduplicateByNameAndBrand(allResults);
}

function transformRecord(raw: any): FragranticaRecord {
  return {
    name: cleanFragranceName(raw.title || raw.name),
    brand: extractBrand(raw.title || raw.description),
    rating: parseFloat(raw.rating) || 0,
    votes: parseInt(raw.votes) || 0,
    accords: extractAccords(raw.description),
    notes: raw.notes || '',
    url: raw.url,
    year: extractYear(raw.description),
  };
}

function cleanFragranceName(name: string): string {
  return name
    .replace(/\s+(for men|for women|cologne|eau de parfum|edp|edt)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}
```

**3. Create Popularity Score Calculator**

Create `/scripts/data-processing/popularity-calculator.ts`:

```typescript
interface PopularityFactors {
  salesRank?: number; // Amazon/retail ranking
  ratingValue: number; // 1-5 scale
  ratingCount: number; // Number of reviews
  socialMentions?: number; // TikTok/Instagram posts
  searchVolume?: number; // Google Trends
  availability: boolean; // Currently for sale
  brandPrestige: number; // 1-10 scale
}

export function calculatePopularityScore(factors: PopularityFactors): number {
  const {
    salesRank = 10000,
    ratingValue,
    ratingCount,
    socialMentions = 0,
    searchVolume = 0,
    availability,
    brandPrestige,
  } = factors;

  // Normalize sales rank (lower is better)
  const salesScore = Math.max(0, (10000 - salesRank) / 10000);

  // Rating weighted by count
  const ratingScore = (ratingValue / 5) * Math.min(1, ratingCount / 1000);

  // Social media presence
  const socialScore = Math.min(1, socialMentions / 10000);

  // Search volume
  const searchScore = Math.min(1, searchVolume / 100000);

  // Availability bonus
  const availabilityBonus = availability ? 0.1 : 0;

  // Brand prestige factor
  const prestigeScore = brandPrestige / 10;

  // Weighted combination
  return (
    salesScore * 0.35 +
    ratingScore * 0.3 +
    socialScore * 0.15 +
    searchScore * 0.1 +
    prestigeScore * 0.1 +
    availabilityBonus
  );
}
```

**4. Create Validation System**

Create `/scripts/data-processing/data-validator.ts`:

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

export function validateFragranceRecord(record: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!record.name?.trim()) errors.push('Missing name');
  if (!record.brand?.trim()) errors.push('Missing brand');

  // Rating validation
  if (record.ratingValue < 0 || record.ratingValue > 5) {
    errors.push('Invalid rating value');
  }

  // Minimum credibility threshold
  if (record.ratingCount < 50) {
    warnings.push('Low rating count - may be unreliable');
  }

  // Name quality checks
  if (record.name.includes('grandefor') || record.name.includes('by by')) {
    warnings.push('Name formatting issue detected');
  }

  // Duplicate detection
  if (isDuplicateName(record.name)) {
    warnings.push('Potential duplicate detected');
  }

  const score = calculateDataQualityScore(record, errors, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score,
  };
}

function calculateDataQualityScore(
  record: any,
  errors: string[],
  warnings: string[]
): number {
  let score = 100;
  score -= errors.length * 25; // Major penalty for errors
  score -= warnings.length * 5; // Minor penalty for warnings

  // Bonus for completeness
  if (record.perfumers?.length > 0) score += 5;
  if (record.accords?.length >= 3) score += 5;
  if (record.ratingCount >= 1000) score += 10;

  return Math.max(0, Math.min(100, score));
}
```

### Implementation Steps

**Step 1: Data Collection Setup**

```bash
# Set up Apify account and get API token
# Add to environment variables
echo "APIFY_TOKEN=your_token_here" >> .env

# Run initial data collection
npm run collect-fragrances
```

**Step 2: Data Processing Pipeline**

```bash
# Process collected data
npm run process-fragrance-data

# Validate data quality
npm run validate-fragrance-data

# Calculate popularity scores
npm run calculate-popularity-scores
```

**Step 3: Database Integration**

```typescript
// Update existing data structure
interface EnhancedFragranceRecord {
  // Existing fields
  id: string;
  brandId: string;
  brandName: string;
  name: string;
  slug: string;
  ratingValue: number;
  ratingCount: number;
  gender: string;
  accords: string[];
  perfumers: string[];
  url: string;

  // New fields
  popularityScore: number;
  dataQualityScore: number;
  launchYear?: number;
  availability: 'available' | 'discontinued' | 'limited';
  sources: string[];
  lastUpdated: string;
  notes?: {
    top: string[];
    middle: string[];
    base: string[];
  };
}
```

**Step 4: Quality Assurance**

```bash
# Run comprehensive validation
npm run validate-all-data

# Generate quality report
npm run generate-quality-report

# Manual review of top 100 entries
npm run generate-manual-review-list
```

## Specific Data Source Implementation

### 1. Fragrantica Integration

```typescript
// High-priority fragrance categories to collect
const PRIORITY_SEARCHES = [
  'best rated perfumes',
  'most popular fragrances 2024',
  'best selling cologne',
  'top women perfumes',
  'niche fragrances',
  'designer fragrances',
];

// Target specific high-performance brands
const PRIORITY_BRANDS = [
  'Dior',
  'Chanel',
  'Creed',
  'Tom Ford',
  'Gucci',
  'Versace',
  'YSL',
  'Armani',
  'Prada',
  'Burberry',
  'Maison Francis Kurkdjian',
  'Parfums de Marly',
];
```

### 2. Sales Data Validation

```typescript
// Amazon bestseller validation
const AMAZON_BESTSELLER_URLS = [
  'https://www.amazon.com/Best-Sellers-Beauty-Womens-Eau-de-Parfum/zgbs/beauty/11055981',
  'https://www.amazon.com/Best-Sellers-Beauty-Mens-Eau-de-Parfum/zgbs/beauty/11056011',
];

// Retail validation sources
const RETAIL_SOURCES = [
  'sephora.com/category/fragrance',
  'ulta.com/fragrance',
  'nordstrom.com/browse/beauty/fragrance',
];
```

### 3. Social Media Trending

```typescript
// TikTok trending hashtags to monitor
const TIKTOK_HASHTAGS = [
  '#perfumetok',
  '#fragrance',
  '#perfumereview',
  '#scentoftheday',
  '#fragrancetiktok',
  '#perfumecollection',
];

// Instagram popularity indicators
const INSTAGRAM_METRICS = [
  'hashtag post counts',
  'brand mention frequency',
  'influencer partnerships',
];
```

## Expected Results

### Database Expansion

- **Current:** 1,467 fragrances
- **Target:** 2,000+ fragrances
- **Quality Improvement:** Better data consistency and accuracy
- **Coverage:** More 2024-2025 releases and trending fragrances

### Data Quality Enhancements

- **Naming Consistency:** Standardized fragrance names
- **Popularity Signals:** Multi-source validation
- **Availability Status:** Current production verification
- **Trend Alignment:** Social media and sales data integration

### User Experience Improvements

- **Better Recommendations:** More accurate popularity weighting
- **Trend Discovery:** Current popular fragrances highlighted
- **Search Relevance:** Popular fragrances rank higher
- **Market Alignment:** Database reflects actual consumer preferences

## Monitoring and Maintenance

### Automated Updates

```typescript
// Weekly data refresh
const WEEKLY_TASKS = [
  'collect_new_releases',
  'update_popularity_scores',
  'validate_availability_status',
];

// Monthly comprehensive refresh
const MONTHLY_TASKS = [
  'full_fragrantica_sync',
  'sales_data_validation',
  'social_media_trend_analysis',
  'data_quality_audit',
];
```

### Quality Monitoring

```typescript
// Data quality KPIs
const QUALITY_METRICS = {
  completeness: 0.95, // 95% of records have all required fields
  accuracy: 0.98, // 98% pass validation checks
  freshness: 30, // Data updated within 30 days
  duplicateRate: 0.02, // <2% duplicate rate
};
```

## Risk Mitigation

### Data Collection Risks

- **Rate Limiting:** Implement respectful scraping with delays
- **Source Changes:** Monitor for website structure changes
- **Legal Compliance:** Only use publicly available data

### Quality Risks

- **Validation Gates:** Multi-stage quality checks
- **Manual Review:** Spot check top performers
- **Rollback Plan:** Maintain current database during migration

### Technical Risks

- **Incremental Deployment:** Phase in new data gradually
- **Performance Monitoring:** Track system impact
- **Error Handling:** Graceful failure recovery

## Success Criteria

### Quantitative Goals

- ✅ 2,000+ high-quality fragrance records
- ✅ 95%+ data completeness rate
- ✅ 98%+ validation pass rate
- ✅ <2% duplicate rate

### Qualitative Goals

- ✅ Improved user satisfaction with recommendations
- ✅ Better alignment with market trends
- ✅ Enhanced discovery of popular fragrances
- ✅ Reliable data for business decisions

---

**Ready to implement:** This guide provides all necessary technical details and scripts to begin the fragrance database rebuild immediately. The phased approach ensures quality while minimizing risks to the existing system.
