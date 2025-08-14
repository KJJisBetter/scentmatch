# System Architecture: Authentication & Fragrance Database Foundation

## Executive Summary

This architecture defines a scalable, secure foundation for ScentMatch that supports millions of users and hundreds of thousands of fragrances. The design prioritizes performance for vector similarity searches, security through Row-Level Security (RLS), and cost optimization through intelligent caching and query patterns.

## System Components

### 1. Database Architecture (Supabase PostgreSQL + pgvector)

#### Core Schema Design

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For compound indexes

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'enthusiast', 'collector')),
  scent_preferences JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'expert')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30)
);

-- Fragrance brands
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  country TEXT,
  founded_year INTEGER,
  luxury_level TEXT CHECK (luxury_level IN ('designer', 'niche', 'indie', 'celebrity')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main fragrances table
CREATE TABLE public.fragrances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  year_released INTEGER,
  perfumer TEXT[],
  concentration TEXT CHECK (concentration IN ('parfum', 'edp', 'edt', 'edc', 'cologne', 'oil')),
  gender TEXT CHECK (gender IN ('masculine', 'feminine', 'unisex')),
  
  -- Scent profile
  scent_profile JSONB DEFAULT '{}', -- Detailed note breakdown
  top_notes TEXT[],
  heart_notes TEXT[],
  base_notes TEXT[],
  accords TEXT[],
  
  -- Characteristics
  longevity DECIMAL(3,2) CHECK (longevity >= 0 AND longevity <= 5),
  sillage DECIMAL(3,2) CHECK (sillage >= 0 AND sillage <= 5),
  value_rating DECIMAL(3,2) CHECK (value_rating >= 0 AND value_rating <= 5),
  versatility DECIMAL(3,2) CHECK (versatility >= 0 AND versatility <= 5),
  
  -- Vector embeddings for AI similarity
  embedding VECTOR(1024), -- Voyage AI voyage-3.5 dimensions
  embedding_model TEXT DEFAULT 'voyage-3.5',
  embedding_generated_at TIMESTAMPTZ,
  
  -- Metadata
  description TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  affiliate_links JSONB DEFAULT '[]',
  sample_available BOOLEAN DEFAULT false,
  discontinued BOOLEAN DEFAULT false,
  
  -- Statistics (denormalized for performance)
  avg_rating DECIMAL(3,2),
  total_ratings INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  popularity_score DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for brand + name
  CONSTRAINT unique_brand_fragrance UNIQUE (brand_id, name)
);

-- User fragrance collections
CREATE TABLE public.user_fragrances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  fragrance_id UUID REFERENCES public.fragrances(id) ON DELETE CASCADE,
  
  -- Collection status
  status TEXT NOT NULL CHECK (status IN ('owned', 'wishlist', 'tested', 'decant', 'sample')),
  acquisition_date DATE,
  bottle_size INTEGER, -- in ml
  purchase_price DECIMAL(10,2),
  
  -- Personal ratings
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  longevity_rating DECIMAL(3,2) CHECK (longevity_rating >= 0 AND longevity_rating <= 5),
  sillage_rating DECIMAL(3,2) CHECK (sillage_rating >= 0 AND sillage_rating <= 5),
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_worn DATE,
  seasons TEXT[] DEFAULT '{}',
  occasions TEXT[] DEFAULT '{}',
  
  -- Notes
  personal_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique per user and fragrance
  CONSTRAINT unique_user_fragrance UNIQUE (user_id, fragrance_id)
);

-- Reviews and ratings
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  fragrance_id UUID REFERENCES public.fragrances(id) ON DELETE CASCADE,
  
  rating DECIMAL(3,2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  
  -- Detailed ratings
  longevity_rating DECIMAL(3,2) CHECK (longevity_rating >= 0 AND longevity_rating <= 5),
  sillage_rating DECIMAL(3,2) CHECK (sillage_rating >= 0 AND sillage_rating <= 5),
  value_rating DECIMAL(3,2) CHECK (value_rating >= 0 AND value_rating <= 5),
  
  -- Review metadata
  verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One review per user per fragrance
  CONSTRAINT unique_user_review UNIQUE (user_id, fragrance_id)
);

-- User preferences for AI recommendations
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Preference vectors (generated from collection analysis)
  preference_embedding VECTOR(1024),
  anti_preference_embedding VECTOR(1024), -- What they dislike
  
  -- Structured preferences
  favorite_notes TEXT[],
  disliked_notes TEXT[],
  favorite_accords TEXT[],
  preferred_concentration TEXT[],
  preferred_seasons TEXT[],
  preferred_occasions TEXT[],
  
  -- Budget preferences
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  prefer_samples BOOLEAN DEFAULT true,
  
  -- Recommendation settings
  include_discontinued BOOLEAN DEFAULT false,
  adventure_level INTEGER DEFAULT 3 CHECK (adventure_level >= 1 AND adventure_level <= 5),
  
  -- Computed preferences (updated via triggers)
  computed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recommendation cache
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  fragrance_id UUID REFERENCES public.fragrances(id) ON DELETE CASCADE,
  
  -- Recommendation metadata
  score DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
  reason TEXT NOT NULL,
  recommendation_type TEXT CHECK (recommendation_type IN ('similar', 'complementary', 'adventure', 'trending', 'seasonal')),
  
  -- Tracking
  viewed BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,
  
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique active recommendation
  CONSTRAINT unique_active_recommendation UNIQUE (user_id, fragrance_id, recommendation_type)
);

-- Indexes for performance
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_experience ON public.profiles(experience_level);

CREATE INDEX idx_brands_slug ON public.brands(slug);
CREATE INDEX idx_brands_name_gin ON public.brands USING gin(name gin_trgm_ops);

CREATE INDEX idx_fragrances_brand ON public.fragrances(brand_id);
CREATE INDEX idx_fragrances_slug ON public.fragrances(slug);
CREATE INDEX idx_fragrances_name_gin ON public.fragrances USING gin(name gin_trgm_ops);
CREATE INDEX idx_fragrances_notes_gin ON public.fragrances USING gin(top_notes || heart_notes || base_notes);
CREATE INDEX idx_fragrances_accords_gin ON public.fragrances USING gin(accords);
CREATE INDEX idx_fragrances_embedding ON public.fragrances USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_fragrances_popularity ON public.fragrances(popularity_score DESC);
CREATE INDEX idx_fragrances_sample ON public.fragrances(sample_available) WHERE sample_available = true;

CREATE INDEX idx_user_fragrances_user ON public.user_fragrances(user_id);
CREATE INDEX idx_user_fragrances_fragrance ON public.user_fragrances(fragrance_id);
CREATE INDEX idx_user_fragrances_status ON public.user_fragrances(user_id, status);

CREATE INDEX idx_reviews_fragrance ON public.reviews(fragrance_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.reviews(fragrance_id, rating DESC);

CREATE INDEX idx_user_preferences_user ON public.user_preferences(user_id);
CREATE INDEX idx_user_preferences_embedding ON public.user_preferences USING ivfflat (preference_embedding vector_cosine_ops) WITH (lists = 50);

CREATE INDEX idx_recommendations_user ON public.recommendations(user_id, expires_at DESC);
CREATE INDEX idx_recommendations_type ON public.recommendations(user_id, recommendation_type, score DESC);
```

### 2. Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fragrances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_fragrances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Brands policies (read-only for users)
CREATE POLICY "Brands are viewable by everyone"
  ON public.brands FOR SELECT
  USING (true);

-- Fragrances policies (read-only for users)
CREATE POLICY "Fragrances are viewable by everyone"
  ON public.fragrances FOR SELECT
  USING (true);

-- User fragrances policies
CREATE POLICY "Users can view own collection"
  ON public.user_fragrances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own collection"
  ON public.user_fragrances FOR ALL
  USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Recommendations policies
CREATE POLICY "Users can view own recommendations"
  ON public.recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage recommendations"
  ON public.recommendations FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### 3. Authentication Architecture

#### Supabase Auth Configuration

```typescript
// Authentication flow structure
interface AuthConfig {
  providers: {
    email: {
      enabled: true,
      confirmEmail: true,
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireNumbers: true,
    },
    google: {
      enabled: true,
      scopes: ['email', 'profile'],
    },
    apple: {
      enabled: true,
      scopes: ['email', 'name'],
    },
  },
  jwt: {
    expiryTime: '1h',
    refreshWindow: '30d',
  },
  rateLimit: {
    emailSignups: '5/hour/ip',
    loginAttempts: '10/hour/ip',
    passwordReset: '3/hour/email',
  },
}
```

#### Authentication Middleware

```typescript
// app/middleware/auth.ts
export class AuthMiddleware {
  // Session validation
  async validateSession(token: string): Promise<User | null>
  
  // Permission checks
  async hasPermission(userId: string, resource: string, action: string): Promise<boolean>
  
  // Rate limiting
  async checkRateLimit(identifier: string, action: string): Promise<boolean>
  
  // Token refresh
  async refreshToken(refreshToken: string): Promise<TokenPair>
}
```

### 4. API Structure (Next.js App Router)

#### API Route Organization

```
app/
├── api/
│   ├── auth/
│   │   ├── login/route.ts
│   │   ├── logout/route.ts
│   │   ├── signup/route.ts
│   │   ├── refresh/route.ts
│   │   └── callback/[provider]/route.ts
│   ├── fragrances/
│   │   ├── route.ts                    # List/search fragrances
│   │   ├── [id]/route.ts              # Get single fragrance
│   │   ├── [id]/reviews/route.ts      # Fragrance reviews
│   │   ├── [id]/similar/route.ts      # Similar fragrances
│   │   └── trending/route.ts          # Trending fragrances
│   ├── collection/
│   │   ├── route.ts                    # User's collection
│   │   ├── add/route.ts               # Add to collection
│   │   ├── remove/route.ts            # Remove from collection
│   │   └── stats/route.ts             # Collection statistics
│   ├── recommendations/
│   │   ├── route.ts                    # Get recommendations
│   │   ├── generate/route.ts          # Generate new recommendations
│   │   └── feedback/route.ts          # Recommendation feedback
│   ├── embeddings/
│   │   ├── generate/route.ts          # Generate embeddings (admin)
│   │   └── status/route.ts            # Embedding generation status
│   └── search/
│       ├── route.ts                    # Text search
│       └── vector/route.ts             # Vector similarity search
```

#### Server Actions Structure

```typescript
// app/actions/fragrances.ts
'use server'

export async function searchFragrances(query: string, filters: FilterOptions) {
  // Input validation
  // RLS-protected database query
  // Response caching
  // Error handling
}

export async function getSimilarFragrances(fragranceId: string, limit: number = 10) {
  // Vector similarity search
  // Result ranking
  // Cache management
}
```

### 5. Vector Embedding Pipeline

#### Embedding Generation Strategy

```typescript
// Automatic embedding generation via Supabase Edge Functions
interface EmbeddingPipeline {
  // Triggered on fragrance insert/update
  async generateFragranceEmbedding(fragrance: Fragrance): Promise<void> {
    // 1. Construct embedding text
    const text = buildEmbeddingText(fragrance)
    
    // 2. Call Voyage AI API
    const embedding = await voyageAI.embed(text, {
      model: 'voyage-3.5',
      inputType: 'document',
    })
    
    // 3. Store in database
    await updateFragranceEmbedding(fragrance.id, embedding)
    
    // 4. Invalidate recommendation cache
    await invalidateRecommendationCache(fragrance.id)
  }
  
  // User preference embedding
  async generateUserPreferenceEmbedding(userId: string): Promise<void> {
    // 1. Analyze user's collection
    const preferences = await analyzeUserCollection(userId)
    
    // 2. Generate preference vector
    const embedding = await generatePreferenceVector(preferences)
    
    // 3. Store and cache
    await updateUserPreferenceEmbedding(userId, embedding)
  }
}
```

### 6. Caching Architecture

#### Multi-Layer Cache Strategy

```typescript
interface CacheStrategy {
  layers: {
    // L1: In-memory cache (Next.js)
    memory: {
      ttl: 300, // 5 minutes
      maxSize: '100MB',
      keys: ['hot-fragrances', 'trending', 'user-sessions'],
    },
    
    // L2: Redis cache (Upstash)
    redis: {
      ttl: 3600, // 1 hour
      keys: [
        'fragrance-details',
        'user-collections',
        'recommendations',
        'search-results',
      ],
    },
    
    // L3: Database materialized views
    database: {
      refresh: 'hourly',
      views: [
        'popular_fragrances',
        'trending_by_season',
        'brand_statistics',
      ],
    },
    
    // L4: CDN edge cache (Vercel)
    cdn: {
      ttl: 86400, // 1 day
      paths: [
        '/api/fragrances/trending',
        '/api/brands',
        '/images/*',
      ],
    },
  },
}
```

### 7. Performance Optimization

#### Query Optimization Patterns

```sql
-- Materialized view for popular fragrances
CREATE MATERIALIZED VIEW popular_fragrances AS
SELECT 
  f.*,
  COUNT(DISTINCT uf.user_id) as owner_count,
  AVG(r.rating) as avg_rating,
  COUNT(r.id) as review_count
FROM fragrances f
LEFT JOIN user_fragrances uf ON f.id = uf.fragrance_id
LEFT JOIN reviews r ON f.id = r.fragrance_id
GROUP BY f.id
ORDER BY owner_count DESC, avg_rating DESC;

-- Refresh strategy
CREATE OR REPLACE FUNCTION refresh_popular_fragrances()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY popular_fragrances;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every hour
SELECT cron.schedule('refresh-popular', '0 * * * *', 'SELECT refresh_popular_fragrances()');
```

#### Vector Search Optimization

```typescript
// Optimized vector similarity search
async function findSimilarFragrances(embedding: number[], limit: number = 10) {
  // Use approximate nearest neighbor with IVFFlat index
  const query = `
    SELECT 
      id,
      name,
      brand_id,
      1 - (embedding <=> $1::vector) as similarity
    FROM fragrances
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT $2
  `;
  
  // Pre-filter by user preferences for better performance
  const filteredQuery = `
    WITH user_prefs AS (
      SELECT preferred_concentration, max_price
      FROM user_preferences
      WHERE user_id = $3
    )
    SELECT 
      f.id,
      f.name,
      f.brand_id,
      1 - (f.embedding <=> $1::vector) as similarity
    FROM fragrances f, user_prefs up
    WHERE f.embedding IS NOT NULL
      AND (up.preferred_concentration IS NULL OR f.concentration = up.preferred_concentration)
      AND (up.max_price IS NULL OR f.avg_price <= up.max_price)
    ORDER BY f.embedding <=> $1::vector
    LIMIT $2
  `;
}
```

### 8. Error Handling & Monitoring

#### Comprehensive Error Strategy

```typescript
// Error handling middleware
export class ErrorHandler {
  // Categorized error types
  errors = {
    AUTH: {
      INVALID_TOKEN: { code: 'AUTH001', status: 401 },
      EXPIRED_SESSION: { code: 'AUTH002', status: 401 },
      INSUFFICIENT_PERMISSIONS: { code: 'AUTH003', status: 403 },
    },
    DATA: {
      NOT_FOUND: { code: 'DATA001', status: 404 },
      VALIDATION_FAILED: { code: 'DATA002', status: 400 },
      DUPLICATE_ENTRY: { code: 'DATA003', status: 409 },
    },
    EXTERNAL: {
      VOYAGE_AI_ERROR: { code: 'EXT001', status: 503 },
      SUPABASE_ERROR: { code: 'EXT002', status: 503 },
      RATE_LIMIT_EXCEEDED: { code: 'EXT003', status: 429 },
    },
  }
  
  // Logging with Sentry
  async logError(error: AppError, context: ErrorContext) {
    // Development: console
    if (process.env.NODE_ENV === 'development') {
      console.error(error, context)
    }
    
    // Production: Sentry
    Sentry.captureException(error, {
      tags: {
        component: context.component,
        userId: context.userId,
        action: context.action,
      },
      extra: context.metadata,
    })
  }
  
  // User-friendly error messages
  getUserMessage(error: AppError): string {
    const messages = {
      AUTH001: 'Please log in to continue',
      DATA001: 'The requested item was not found',
      EXT001: 'Our recommendation service is temporarily unavailable',
    }
    return messages[error.code] || 'An unexpected error occurred'
  }
}
```

#### Monitoring Architecture

```typescript
interface MonitoringSetup {
  // Application metrics
  metrics: {
    // Performance
    apiResponseTime: Histogram,
    databaseQueryTime: Histogram,
    vectorSearchTime: Histogram,
    cacheHitRate: Gauge,
    
    // Business metrics
    dailyActiveUsers: Counter,
    recommendationClickRate: Gauge,
    collectionAdditions: Counter,
    reviewsCreated: Counter,
  },
  
  // Health checks
  healthChecks: {
    database: '/api/health/db',
    redis: '/api/health/redis',
    voyageAI: '/api/health/voyage',
    storage: '/api/health/storage',
  },
  
  // Alerting rules
  alerts: {
    highErrorRate: 'error_rate > 0.01',
    slowApiResponse: 'p95_response_time > 2000ms',
    lowCacheHitRate: 'cache_hit_rate < 0.7',
    databaseConnectionPool: 'available_connections < 5',
  },
}
```

## Data Flow Diagrams

### Authentication Flow
```
User → Next.js App → Supabase Auth → PostgreSQL
         ↓              ↓
     Session Cookie   JWT Token
         ↓              ↓
     Protected API   RLS Policies
```

### Recommendation Generation Flow
```
User Collection → Analyze Preferences → Generate Embedding
                                              ↓
                                         Voyage AI API
                                              ↓
                                    Vector Similarity Search
                                              ↓
                                     Filter & Rank Results
                                              ↓
                                        Cache Results
                                              ↓
                                      Return to User
```

## Scaling Strategy

### Horizontal Scaling Triggers

1. **Database Connections > 80%**: Add read replicas
2. **API Response Time p95 > 2s**: Add more Vercel functions
3. **Vector Search Time > 500ms**: Increase IVFFlat lists parameter
4. **Cache Memory > 80%**: Upgrade Redis tier
5. **Storage > 80%**: Implement CDN for static assets

### Scaling Mechanisms

```typescript
// Auto-scaling configuration
const scalingConfig = {
  database: {
    minConnections: 10,
    maxConnections: 100,
    idleTimeout: 30000,
    readReplicas: {
      enabled: true,
      minReplicas: 0,
      maxReplicas: 3,
      scaleUpThreshold: 0.7, // CPU utilization
      scaleDownThreshold: 0.3,
    },
  },
  
  vercel: {
    functions: {
      maxDuration: 10, // seconds
      memory: 1024, // MB
      regions: ['iad1'], // Primary region
    },
  },
  
  redis: {
    maxMemory: '256mb',
    evictionPolicy: 'allkeys-lru',
    maxConnections: 50,
  },
}
```

## Security Model

### Defense in Depth

1. **Network Level**: Cloudflare DDoS protection
2. **Application Level**: Rate limiting, input validation
3. **API Level**: JWT validation, CORS policies
4. **Database Level**: RLS policies, prepared statements
5. **Data Level**: Encryption at rest, PII masking

### Security Checklist

- [ ] All database queries use RLS
- [ ] API endpoints validate JWT tokens
- [ ] Input sanitization on all user inputs
- [ ] Rate limiting on all public endpoints
- [ ] HTTPS only with HSTS headers
- [ ] Content Security Policy headers
- [ ] SQL injection protection via parameterized queries
- [ ] XSS protection via React's built-in escaping
- [ ] CSRF protection via SameSite cookies
- [ ] Secrets management via Vercel environment variables

## Migration Strategy

### Phase 1: Initial Schema (Week 1)
1. Deploy core tables (profiles, brands, fragrances)
2. Set up authentication flow
3. Implement basic RLS policies
4. Deploy to staging environment

### Phase 2: Collection Features (Week 2)
1. Deploy user_fragrances and reviews tables
2. Implement collection management APIs
3. Add caching layer
4. Load test with simulated data

### Phase 3: AI Integration (Week 3)
1. Deploy embedding columns and indexes
2. Set up Voyage AI integration
3. Implement embedding generation pipeline
4. Deploy recommendation system

### Phase 4: Optimization (Week 4)
1. Create materialized views
2. Optimize indexes based on query patterns
3. Implement full caching strategy
4. Performance testing and tuning

## Seed Data Strategy

```typescript
// Seed data pipeline
interface SeedStrategy {
  sources: {
    fragrances: {
      initial: 1000, // Top fragrances
      expansion: 10000, // Full catalog
      source: 'Fragrantica API / Web scraping',
    },
    brands: {
      count: 500,
      priority: ['designer', 'niche', 'indie'],
    },
    samples: {
      // Prioritize fragrances with available samples
      sources: ['LuckyScent', 'Surrender to Chance', 'The Perfumed Court'],
    },
  },
  
  automation: {
    // Supabase Edge Function for batch processing
    batchSize: 100,
    parallelEmbeddings: 10,
    retryStrategy: 'exponential-backoff',
  },
}
```

## Cost Analysis

### Estimated Monthly Costs at Scale

| Component | 1K Users | 10K Users | 100K Users |
|-----------|----------|-----------|------------|
| Supabase (Database) | $25 | $135 | $599 |
| Vercel (Hosting) | $20 | $20 | $150 |
| Voyage AI (Embeddings) | $10 | $50 | $400 |
| Redis (Caching) | $0 | $10 | $120 |
| CDN/Storage | $5 | $20 | $200 |
| **Total** | **$60** | **$235** | **$1,469** |

### Cost Optimization Strategies

1. **Embedding Caching**: Cache embeddings indefinitely, regenerate only on update
2. **Batch Processing**: Process embeddings in batches during off-peak hours
3. **Smart Caching**: Cache popular queries and recommendations
4. **Database Optimization**: Use connection pooling and read replicas
5. **CDN Strategy**: Serve all static assets from CDN

## Risk Assessment

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Voyage AI API downtime | High | Low | Fallback to OpenAI embeddings |
| Database connection exhaustion | High | Medium | Connection pooling + read replicas |
| Vector search performance degradation | Medium | Medium | Index optimization + caching |
| Cache invalidation issues | Low | Medium | TTL-based expiry + manual purge |
| Authentication vulnerabilities | High | Low | Regular security audits |

### Mitigation Strategies

1. **Multi-provider fallback**: OpenAI as backup for Voyage AI
2. **Database resilience**: Read replicas + connection pooling
3. **Performance monitoring**: Real-time alerts on degradation
4. **Security scanning**: Automated vulnerability scanning
5. **Backup strategy**: Daily automated backups with point-in-time recovery

## Implementation Checklist

### Week 1: Foundation
- [ ] Set up Supabase project
- [ ] Deploy authentication schema and RLS policies
- [ ] Implement auth flows with Next.js
- [ ] Create basic API structure
- [ ] Set up error handling and logging

### Week 2: Core Features
- [ ] Deploy fragrance and collection schemas
- [ ] Implement fragrance search and display
- [ ] Create collection management APIs
- [ ] Add basic caching layer
- [ ] Implement user profile management

### Week 3: AI Integration
- [ ] Set up Voyage AI integration
- [ ] Deploy embedding generation pipeline
- [ ] Implement vector similarity search
- [ ] Create recommendation engine
- [ ] Add preference learning system

### Week 4: Production Readiness
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing
- [ ] Monitoring setup
- [ ] Documentation completion

## Conclusion

This architecture provides a robust, scalable foundation for ScentMatch that can grow from MVP to millions of users. The design prioritizes performance through intelligent caching and indexing, security through comprehensive RLS policies, and cost optimization through efficient resource utilization. The modular structure allows for incremental feature development while maintaining system stability.