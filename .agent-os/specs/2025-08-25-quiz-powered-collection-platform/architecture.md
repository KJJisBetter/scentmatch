# Technical Architecture - Quiz-Powered Collection Platform

## System Overview

This document outlines the technical architecture for transforming ScentMatch into a collection-powered platform where AI quiz results drive user engagement through collection building.

## Architecture Principles

### 1. Collection-First Design
- Collections are the primary user engagement mechanism
- Quiz results flow directly into collection building
- All features designed to enhance collection value

### 2. Performance-Optimized
- Server-side rendering for core pages
- Optimistic UI updates for collection actions
- Efficient caching strategies for analytics
- Mobile-first responsive design

### 3. Scalable Social Features
- Real-time social proof without performance impact
- Viral mechanics built into core flows
- Privacy-compliant social sharing

## Core Architecture Components

### 1. Data Layer Architecture

#### Enhanced Database Schema

```sql
-- Enhanced user_collections table (existing, extend)
ALTER TABLE user_collections ADD COLUMN IF NOT EXISTS quiz_session_token TEXT;
ALTER TABLE user_collections ADD COLUMN IF NOT EXISTS social_metadata JSONB;
ALTER TABLE user_collections ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0;

-- New: Collection analytics tracking
CREATE TABLE collection_analytics_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    event_type TEXT NOT NULL, -- 'collection_created', 'item_added', 'shared', etc.
    event_data JSONB,
    quiz_session_token TEXT, -- Link back to originating quiz
    created_at TIMESTAMP DEFAULT NOW()
);

-- New: Social sharing tracking
CREATE TABLE collection_shares (
    id BIGSERIAL PRIMARY KEY,
    collection_owner_id UUID NOT NULL,
    shared_by_user_id UUID, -- May be different from owner
    share_type TEXT NOT NULL, -- 'collection', 'quiz_results', 'single_fragrance'
    share_platform TEXT, -- 'twitter', 'instagram', 'direct_link', etc.
    share_data JSONB,
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0, -- Referrals who create accounts
    created_at TIMESTAMP DEFAULT NOW()
);

-- New: User engagement scoring
CREATE TABLE user_engagement_scores (
    user_id UUID PRIMARY KEY,
    collection_size INTEGER DEFAULT 0,
    quiz_completion_count INTEGER DEFAULT 0,
    social_engagement_score INTEGER DEFAULT 0,
    last_active_at TIMESTAMP,
    engagement_level TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'expert'
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_collection_analytics_user_id ON collection_analytics_events(user_id);
CREATE INDEX idx_collection_analytics_event_type ON collection_analytics_events(event_type);
CREATE INDEX idx_collection_shares_owner ON collection_shares(collection_owner_id);
CREATE INDEX idx_engagement_scores_level ON user_engagement_scores(engagement_level);
```

#### Data Access Patterns

**Collection Management:**
```typescript
// Primary pattern: Server Actions for mutations
await updateUserCollection('add', fragranceId, { notes: 'Love this!' });

// Read pattern: Direct database queries with caching
const collection = await getUserCollection();
const insights = await getCollectionInsights(userId);
```

**Analytics & Insights:**
```typescript
// Async processing for heavy analytics
await calculateCollectionInsights.background(userId);

// Real-time metrics with caching
const stats = await getCachedCollectionStats(userId);
```

### 2. Application Layer Architecture

#### Server Actions Pattern (Existing + Enhanced)

```
lib/actions/
├── collections.ts (EXISTING - core collection CRUD)
├── quiz-collection.ts (NEW - quiz-to-collection conversion)
├── social-sharing.ts (NEW - sharing and viral features)
└── collection-analytics.ts (NEW - analytics and insights)
```

**Key Server Actions:**

```typescript
// Quiz-to-collection conversion
export async function saveQuizRecommendations(params: {
  quiz_session_token: string;
  fragrance_ids: string[];
  user_id?: string;
  guest_session_id?: string;
}): Promise<CollectionSaveResult>

// Collection sharing
export async function shareCollection(params: {
  collection_data: CollectionShareData;
  share_type: 'collection' | 'quiz_results';
  platform: string;
}): Promise<ShareResult>

// Analytics tracking
export async function trackCollectionEvent(params: {
  user_id: string;
  event_type: string;
  event_data: any;
}): Promise<void>
```

#### Component Architecture

```
components/
├── quiz/
│   ├── collection-preview.tsx (NEW - quiz-to-collection bridge)
│   ├── conversion-flow.tsx (ENHANCED - collection-first)
│   └── quiz-to-collection-bridge.tsx (NEW - integration component)
├── collection/
│   ├── collection-dashboard.tsx (NEW - main dashboard)
│   ├── collection-analytics.tsx (NEW - insights display)
│   ├── collection-organizer.tsx (NEW - management tools)
│   └── collection-insights.tsx (NEW - personalized insights)
├── social/
│   ├── collection-share-card.tsx (NEW - sharing components)
│   ├── social-proof-signals.tsx (NEW - community signals)
│   └── viral-mechanics.tsx (NEW - growth features)
```

### 3. Service Layer Architecture

#### Analytics Service

```typescript
// lib/services/collection-analytics.ts
class CollectionAnalyticsService {
  // Real-time metrics with caching
  async getCollectionStats(userId: string): Promise<CollectionStats>
  
  // Deep insights (background processing)
  async calculateCollectionInsights(userId: string): Promise<CollectionInsights>
  
  // Performance tracking
  async trackPerformanceMetrics(action: string, timing: number): Promise<void>
}
```

#### Social Service

```typescript
// lib/services/social-sharing.ts
class SocialSharingService {
  // Generate shareable content
  async generateShareableCard(data: ShareableData): Promise<ShareCard>
  
  // Track social interactions
  async trackSocialEngagement(shareId: string, interaction: string): Promise<void>
  
  // Viral mechanics
  async processReferral(referrerUserId: string, newUserId: string): Promise<void>
}
```

#### Progressive Engagement Service

```typescript
// lib/services/progressive-engagement.ts
class ProgressiveEngagementService {
  // Milestone tracking
  async checkMilestones(userId: string): Promise<Milestone[]>
  
  // Personalized recommendations
  async generateProgressiveRecommendations(userId: string): Promise<Recommendation[]>
  
  // Engagement scoring
  async updateEngagementScore(userId: string): Promise<EngagementScore>
}
```

## Integration Points

### 1. Quiz System Integration

**Current Flow:**
```
Quiz → UnifiedRecommendationEngine → FragranceRecommendationDisplay → ConversionFlow
```

**Enhanced Flow:**
```
Quiz → UnifiedRecommendationEngine → CollectionPreview → SaveRecommendations → CollectionDashboard
```

**Integration Components:**

```typescript
// components/quiz/collection-preview.tsx
interface CollectionPreviewProps {
  recommendations: FragranceRecommendation[];
  quiz_session_token: string;
  onSaveCollection: (data: CollectionSaveData) => Promise<void>;
  onSkip: () => void;
}

// Bridge component for seamless integration
// components/quiz/quiz-to-collection-bridge.tsx
export function QuizToCollectionBridge({ quizResults }: Props) {
  const [showPreview, setShowPreview] = useState(true);
  
  return showPreview ? (
    <CollectionPreview {...quizResults} onSave={handleSave} />
  ) : (
    <ConversionFlow {...quizResults} enhanced={true} />
  );
}
```

### 2. Collection Management Integration

**Enhanced Collection Actions:**

```typescript
// lib/actions/collections.ts (enhanced)
export async function updateUserCollection(
  action: 'add' | 'remove' | 'rate' | 'update' | 'organize',
  fragranceId: string,
  metadata?: CollectionMetadata
): Promise<CollectionActionResult>

// New quiz-specific collection action
// lib/actions/quiz-collection.ts
export async function saveQuizRecommendations(
  params: QuizCollectionParams
): Promise<CollectionSaveResult>
```

### 3. Social Features Integration

**Sharing Integration Points:**

```typescript
// Integration with existing fragrance display
// components/fragrance/fragrance-card.tsx (enhanced)
export function FragranceCard({ fragrance, showSocialActions = false }: Props) {
  return (
    <Card>
      {/* Existing fragrance display */}
      {showSocialActions && (
        <SocialActionButtons 
          fragrance={fragrance}
          onShare={handleShare}
          onSaveToCollection={handleSave}
        />
      )}
    </Card>
  );
}
```

## Performance Considerations

### 1. Database Optimization

**Query Patterns:**
- Collection reads: JOIN with fragrances table, limit results
- Analytics queries: Use materialized views for expensive calculations
- Social metrics: Cache frequently accessed counts

**Indexing Strategy:**
```sql
-- Optimized indexes for collection queries
CREATE INDEX CONCURRENTLY idx_user_collections_user_engagement 
  ON user_collections(user_id, created_at DESC, collection_type);

-- Analytics performance
CREATE INDEX CONCURRENTLY idx_collection_analytics_user_date
  ON collection_analytics_events(user_id, created_at DESC);

-- Social features performance  
CREATE INDEX CONCURRENTLY idx_collection_shares_trending
  ON collection_shares(created_at DESC, view_count DESC);
```

### 2. Caching Strategy

**Multi-Layer Caching:**

```typescript
// 1. Application-level caching (React Query/SWR)
const { data: collection } = useSWR(
  `collection-${userId}`,
  () => getUserCollection(),
  { revalidateOnFocus: false, dedupingInterval: 30000 }
);

// 2. Server-side caching (Redis/Memory)
const cachedStats = await getCachedCollectionStats(userId, {
  ttl: 300, // 5 minutes
  revalidate: 'background'
});

// 3. Database-level caching (Materialized views)
-- Refresh materialized view every hour
REFRESH MATERIALIZED VIEW CONCURRENTLY collection_trending_view;
```

### 3. Component Performance

**Optimization Strategies:**

```typescript
// Lazy loading for non-critical components
const CollectionInsights = lazy(() => import('./collection-insights'));

// Memoization for expensive calculations
const CollectionStats = memo(function CollectionStats({ data }: Props) {
  const processedStats = useMemo(
    () => calculateComplexStats(data),
    [data.user_id, data.last_updated]
  );
  
  return <StatsDisplay stats={processedStats} />;
});

// Virtual scrolling for large collections
import { FixedSizeGrid as Grid } from 'react-window';

function CollectionGrid({ fragrances }: Props) {
  return (
    <Grid
      columnCount={3}
      columnWidth={200}
      height={600}
      rowCount={Math.ceil(fragrances.length / 3)}
      rowHeight={250}
    >
      {FragranceCard}
    </Grid>
  );
}
```

## Security Considerations

### 1. Data Privacy

**Collection Privacy Controls:**
```typescript
// User-controlled sharing permissions
interface CollectionPrivacySettings {
  is_public: boolean;
  allow_social_sharing: boolean;
  share_analytics: boolean;
  anonymous_recommendations: boolean;
}

// Privacy-compliant analytics
function trackEvent(event: AnalyticsEvent) {
  if (!user.privacy_settings.allow_analytics) return;
  
  // Hash PII data
  const anonymizedEvent = {
    ...event,
    user_id: hashUserId(event.user_id),
    fragrance_data: anonymizeFragranceData(event.fragrance_data)
  };
  
  analyticsService.track(anonymizedEvent);
}
```

### 2. Social Feature Security

**Content Moderation:**
```typescript
// Automated content filtering for shared collections
async function validateSharedContent(content: ShareableContent): Promise<ValidationResult> {
  // Check for inappropriate content
  const moderationResult = await contentModerationService.check(content);
  
  // Validate data structure
  const schemaValidation = validateShareSchema(content);
  
  return {
    approved: moderationResult.safe && schemaValidation.valid,
    issues: [...moderationResult.issues, ...schemaValidation.errors]
  };
}
```

## Monitoring & Analytics

### 1. Performance Monitoring

**Key Metrics to Track:**
- Collection dashboard load times
- Quiz-to-collection conversion rate
- Social sharing engagement
- Database query performance
- Cache hit rates

```typescript
// Performance monitoring integration
import { performance } from 'perf_hooks';

async function trackCollectionAction(action: string, userId: string) {
  const startTime = performance.now();
  
  try {
    const result = await executeAction(action, userId);
    const duration = performance.now() - startTime;
    
    // Track successful action
    await analyticsService.track('collection_action', {
      action,
      duration,
      success: true,
      user_engagement_level: await getUserEngagementLevel(userId)
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    // Track failed action
    await analyticsService.track('collection_action_error', {
      action,
      duration,
      error: error.message,
      stack_trace: error.stack
    });
    
    throw error;
  }
}
```

### 2. Business Analytics

**Collection Success Metrics:**
```typescript
interface CollectionMetrics {
  conversion_rates: {
    quiz_to_collection: number;
    collection_to_account: number;
    collection_to_share: number;
  };
  
  engagement_metrics: {
    average_collection_size: number;
    daily_active_collection_users: number;
    collection_retention_7_day: number;
    collection_retention_30_day: number;
  };
  
  social_metrics: {
    shares_per_collection: number;
    referrals_from_shares: number;
    viral_coefficient: number;
  };
}
```

## Deployment Strategy

### 1. Database Migrations

**Migration Sequence:**
1. Add new columns to existing tables (non-breaking)
2. Create new analytics and social tables
3. Create indexes (concurrently to avoid locks)
4. Populate initial data for existing users

### 2. Feature Rollout

**Phased Deployment:**
```typescript
// Feature flags for gradual rollout
const featureFlags = {
  COLLECTION_PREVIEW: process.env.FEATURE_COLLECTION_PREVIEW === 'true',
  SOCIAL_SHARING: process.env.FEATURE_SOCIAL_SHARING === 'true',
  ADVANCED_ANALYTICS: process.env.FEATURE_ADVANCED_ANALYTICS === 'true'
};

// Gradual user rollout based on engagement level
function shouldShowCollectionFeatures(user: User): boolean {
  if (!featureFlags.COLLECTION_PREVIEW) return false;
  
  // Show to engaged users first
  if (user.engagement_level === 'expert') return true;
  if (user.engagement_level === 'intermediate') return Math.random() < 0.5;
  
  // 10% of beginners
  return Math.random() < 0.1;
}
```

### 3. Rollback Strategy

**Graceful Degradation:**
```typescript
// Fallback to existing flow if collection features fail
function CollectionFlowWithFallback({ quizResults }: Props) {
  const [collectionError, setCollectionError] = useState<Error | null>(null);
  
  if (collectionError) {
    // Log error and fallback to original conversion flow
    console.error('Collection flow error, falling back:', collectionError);
    return <ConversionFlow quizResults={quizResults} />;
  }
  
  return <EnhancedCollectionFlow quizResults={quizResults} onError={setCollectionError} />;
}
```

---

**Architecture Review Checkpoints:**
- [ ] Database schema review with @database-operations-expert
- [ ] Performance optimization with @performance-optimizer  
- [ ] Security assessment with @security-expert
- [ ] Component architecture with @react-component-expert
- [ ] Testing strategy with @qa-specialist