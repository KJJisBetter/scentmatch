# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-25-critical-product-page-404-fix/spec.md

> Created: 2025-08-25
> Version: 1.0.0

## Endpoints

### Quiz Recommendation Validation

**POST /api/quiz/validate-recommendations**

Validates fragrance IDs before displaying quiz results to prevent 404s.

```typescript
// Request
interface ValidateRecommendationsRequest {
  fragranceIds: string[];
  sessionId: string;
  fallbackCount?: number; // Default: 3
}

// Response
interface ValidateRecommendationsResponse {
  validatedRecommendations: ValidatedRecommendation[];
  invalidIds: string[];
  fallbacksUsed: number;
}

interface ValidatedRecommendation {
  originalId: string;
  validatedId: string;
  fragmentData: FragranceData;
  isFallback: boolean;
  fallbackReason?: 'not_found' | 'invalid_format' | 'inactive';
}
```

**Implementation:**
```typescript
// app/api/quiz/validate-recommendations/route.ts
export async function POST(request: Request) {
  const { fragranceIds, sessionId, fallbackCount = 3 } = await request.json();
  
  const validator = new RecommendationValidator();
  const results = await validator.validateBatch(fragranceIds, {
    sessionId,
    fallbackCount,
    logResults: true
  });
  
  return Response.json(results);
}
```

### Fragrance Lookup with Fallback

**GET /api/fragrance/[id]?fallback=true**

Enhanced fragrance lookup that provides fallbacks for missing fragrances.

```typescript
// Response for valid fragrance
interface FragranceLookupResponse {
  fragrance: FragranceData;
  isValid: true;
  isFallback: false;
}

// Response for invalid fragrance with fallbacks
interface FragranceFallbackResponse {
  fragrance: FragranceData | null;
  isValid: false;
  isFallback: boolean;
  fallbackOptions: FragranceData[];
  errorReason: 'not_found' | 'invalid_format' | 'inactive';
}
```

**Implementation:**
```typescript
// app/api/fragrance/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const useFallback = searchParams.get('fallback') === 'true';
  
  const lookup = new FragranceLookupService();
  const result = await lookup.findWithFallback(params.id, {
    useFallback,
    maxFallbacks: 5
  });
  
  return Response.json(result);
}
```

### Data Consistency Monitoring

**GET /api/admin/fragrance-consistency**

Internal endpoint for monitoring ID consistency issues.

```typescript
interface ConsistencyReport {
  orphanedRecommendations: OrphanedRecommendation[];
  duplicateIds: DuplicateIdInfo[];
  invalidFormats: InvalidFormatInfo[];
  summary: {
    totalFragrances: number;
    totalOrphaned: number;
    totalDuplicates: number;
    consistencyScore: number; // 0-100
  };
}

interface OrphanedRecommendation {
  recommendedId: string;
  occurrenceCount: number;
  potentialMatches: string[];
  lastSeen: string;
}
```

## Controllers

### RecommendationValidator

**Primary validation service for quiz recommendations:**

```typescript
// lib/services/recommendation-validator.ts
export class RecommendationValidator {
  async validateBatch(
    fragranceIds: string[],
    options: ValidationOptions
  ): Promise<ValidationResult> {
    const results: ValidatedRecommendation[] = [];
    
    for (const id of fragranceIds) {
      const validation = await this.validateSingle(id, options);
      results.push(validation);
      
      // Log for monitoring
      await this.logValidationResult(id, validation, options.sessionId);
    }
    
    return {
      validatedRecommendations: results,
      invalidIds: results.filter(r => !r.isValid).map(r => r.originalId),
      fallbacksUsed: results.filter(r => r.isFallback).length
    };
  }
  
  private async validateSingle(
    fragranceId: string,
    options: ValidationOptions
  ): Promise<ValidatedRecommendation> {
    // 1. Try direct lookup
    const directMatch = await this.findDirectMatch(fragranceId);
    if (directMatch) {
      return {
        originalId: fragranceId,
        validatedId: directMatch.normalized_id,
        fragmentData: directMatch,
        isValid: true,
        isFallback: false
      };
    }
    
    // 2. Try fuzzy matching
    const fuzzyMatch = await this.findFuzzyMatch(fragranceId);
    if (fuzzyMatch && options.fallbackCount > 0) {
      return {
        originalId: fragranceId,
        validatedId: fuzzyMatch.normalized_id,
        fragmentData: fuzzyMatch,
        isValid: false,
        isFallback: true,
        fallbackReason: 'not_found'
      };
    }
    
    // 3. Return best alternative
    const alternatives = await this.findAlternatives(fragranceId);
    return {
      originalId: fragranceId,
      validatedId: alternatives[0]?.normalized_id || '',
      fragmentData: alternatives[0] || null,
      isValid: false,
      isFallback: true,
      fallbackReason: 'not_found'
    };
  }
}
```

### FragranceLookupService

**Enhanced lookup service with fallback support:**

```typescript
// lib/services/fragrance-lookup-service.ts
export class FragranceLookupService {
  async findWithFallback(
    fragranceId: string,
    options: LookupOptions
  ): Promise<FragranceLookupResult> {
    // 1. Direct lookup by normalized ID
    const directMatch = await this.supabase
      .from('fragrances')
      .select('*')
      .eq('normalized_id', this.normalizeId(fragranceId))
      .single();
      
    if (directMatch.data) {
      return {
        fragrance: directMatch.data,
        isValid: true,
        isFallback: false
      };
    }
    
    // 2. Legacy lookup patterns (for backward compatibility)
    const legacyMatch = await this.tryLegacyPatterns(fragranceId);
    if (legacyMatch) {
      return {
        fragrance: legacyMatch,
        isValid: true,
        isFallback: false
      };
    }
    
    // 3. Fallback options
    if (options.useFallback) {
      const fallbacks = await this.findSimilarFragrances(fragranceId, options.maxFallbacks);
      return {
        fragrance: null,
        isValid: false,
        isFallback: true,
        fallbackOptions: fallbacks,
        errorReason: 'not_found'
      };
    }
    
    return {
      fragrance: null,
      isValid: false,
      isFallback: false,
      fallbackOptions: [],
      errorReason: 'not_found'
    };
  }
}
```

### ConsistencyMonitor

**Service for tracking and reporting data consistency:**

```typescript
// lib/services/consistency-monitor.ts
export class ConsistencyMonitor {
  async generateReport(): Promise<ConsistencyReport> {
    const [orphaned, duplicates, invalid] = await Promise.all([
      this.findOrphanedRecommendations(),
      this.findDuplicateIds(),
      this.findInvalidFormats()
    ]);
    
    const totalFragrances = await this.getTotalFragranceCount();
    const consistencyScore = this.calculateConsistencyScore({
      totalFragrances,
      orphanedCount: orphaned.length,
      duplicateCount: duplicates.length
    });
    
    return {
      orphanedRecommendations: orphaned,
      duplicateIds: duplicates,
      invalidFormats: invalid,
      summary: {
        totalFragrances,
        totalOrphaned: orphaned.length,
        totalDuplicates: duplicates.length,
        consistencyScore
      }
    };
  }
  
  private calculateConsistencyScore(metrics: {
    totalFragrances: number;
    orphanedCount: number;
    duplicateCount: number;
  }): number {
    const issues = metrics.orphanedCount + metrics.duplicateCount;
    const score = Math.max(0, 100 - (issues / metrics.totalFragrances * 100));
    return Math.round(score);
  }
}