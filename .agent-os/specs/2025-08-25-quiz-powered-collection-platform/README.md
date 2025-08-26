# Quiz-Powered Collection Platform Spec

**Linear Issue**: [SCE-92](https://linear.app/scentmatch/issue/SCE-92/strategic-transform-scentmatch-into-quiz-powered-collection-platform)  
**Priority**: Urgent  
**Type**: Strategic Product Evolution  
**Epic**: Collection-First Platform Transformation

## Vision Statement

Transform ScentMatch from a pure discovery tool into a **collection-powered fragrance platform** where the AI quiz drives traffic and collections create engagement that we leverage for affiliate partnerships.

## Strategic Context

### Current State Analysis

**Existing Assets:**
- ✅ AI Quiz system with UnifiedRecommendationEngine
- ✅ Basic collection management (Server Actions in `lib/actions/collections.ts`)
- ✅ Post-quiz conversion flow with account creation
- ✅ User collections database schema (`user_collections` table)
- ✅ Recommendation display system

**Missing Components:**
- ❌ Quiz-to-collection conversion optimization
- ❌ Enhanced collection engagement features
- ❌ Social sharing and viral mechanics
- ❌ Collection analytics and insights
- ❌ Progressive collection feature unlocks

### Strategic Approach: Traffic → Leverage → Monetize

#### Phase 1: Traffic & Engagement Engine 🚀 (Current Focus)

**Goal**: Build 10k+ engaged users with collections (NO monetization focus)

- Keep quiz free & viral (maximum reach)
- End-of-quiz conversion: "Save these 3 recommendations?"
- Collection features create retention and return visits
- Social sharing drives viral growth
- **Success Metrics**: Monthly active users, collection items added, quiz shares

## Technical Architecture

### Core Components

```
Quiz System (Existing) → Collection Conversion (New) → Engagement Features (New)
        ↓                         ↓                           ↓
UnifiedRecommendationEngine  →  CollectionManager    →   SocialFeatures
        ↓                         ↓                           ↓
FragranceData (Existing)     →  UserAnalytics (New)  →   ViralMechanics (New)
```

### Database Schema Enhancements

**Current Schema (user_collections):**
```sql
CREATE TABLE user_collections (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    guest_session_id TEXT,
    fragrance_id TEXT NOT NULL,
    collection_type TEXT DEFAULT 'saved' CHECK (collection_type IN ('saved', 'owned', 'wishlist', 'tried')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    purchase_date DATE,
    sample_tried BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Required Extensions:**
1. **Collection Analytics Tracking**
2. **Social Sharing Metadata** 
3. **Engagement Metrics**
4. **Quiz-Collection Attribution**

### Technical Implementation Plan

## Feature Specifications

### 1. Quiz-to-Collection Conversion Optimization

**Current Flow:**
```
Quiz Complete → FragranceRecommendationDisplay → ConversionFlow → Account Creation
```

**Enhanced Flow:**
```
Quiz Complete → Collection Preview → One-Click Save → Progressive Account Creation
```

**Components to Build:**

#### 1.1 Collection Preview Component
```typescript
// components/quiz/collection-preview.tsx
interface CollectionPreviewProps {
  recommendations: FragranceRecommendation[];
  onSaveCollection: (fragrances: string[]) => void;
  onSkip: () => void;
}
```

**Features:**
- Visual collection preview with 3 recommended fragrances
- One-click "Save My Matches" button
- Social proof messaging ("Join 50,000+ users building their scent profile")
- Progress indicator showing collection building journey

#### 1.2 Enhanced Server Actions
```typescript
// lib/actions/quiz-collection.ts
export async function saveQuizRecommendations(params: {
  quiz_session_token: string;
  fragrance_ids: string[];
  user_id?: string;
  guest_session_id?: string;
}): Promise<CollectionSaveResult>
```

### 2. Collection Engagement Features

#### 2.1 Collection Dashboard
**Route**: `/collection`
**Components**:
- Collection stats overview
- Fragrance organization (wishlist, owned, tried, favorites)
- Personal fragrance journey timeline
- Sharing controls

#### 2.2 Collection Analytics
```typescript
// lib/services/collection-analytics.ts
interface CollectionInsights {
  scent_profile_analysis: {
    dominant_families: string[];
    intensity_preferences: 'light' | 'moderate' | 'intense';
    seasonal_patterns: SeasonalPreference[];
  };
  discovery_stats: {
    quiz_accuracy_score: number;
    collection_growth_rate: number;
    exploration_diversity: number;
  };
  social_context: {
    similar_users_count: number;
    trending_in_collection: string[];
    community_recommendations: FragranceRecommendation[];
  };
}
```

### 3. Social & Viral Features

#### 3.1 Collection Sharing
**Components:**
- `components/social/collection-share-card.tsx`
- `components/social/quiz-results-share.tsx`

**Features:**
- Beautiful shareable collection images
- "My ScentMatch Profile" sharing cards
- Quiz results with personality insights
- Social media optimized formats

#### 3.2 Social Proof Integration
**Database Schema:**
```sql
-- New table for social validation
CREATE TABLE collection_social_metrics (
    id SERIAL PRIMARY KEY,
    collection_owner_id UUID NOT NULL,
    fragrance_id TEXT NOT NULL,
    social_signals JSONB, -- likes, shares, saves by others
    trending_score INTEGER DEFAULT 0,
    peer_adoption_rate DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. User Experience Enhancements

#### 4.1 Progressive Collection Building
**Flow:**
1. **Quiz Complete**: Save 3 initial recommendations
2. **Day 1**: Email with collection analytics, suggest 2 more fragrances
3. **Week 1**: "Complete your profile" - add 3 more from curated suggestions
4. **Month 1**: Seasonal collection refresh based on usage patterns

#### 4.2 Gamification Elements
- Collection completion badges
- Discovery milestones (first 5, 10, 25 fragrances)
- Scent family exploration achievements
- Community engagement rewards

## Implementation Roadmap

### Phase 1A: Enhanced Quiz-to-Collection Flow (Week 1)
- [ ] Build CollectionPreview component
- [ ] Enhance ConversionFlow with collection-first messaging
- [ ] Implement saveQuizRecommendations Server Action
- [ ] Add collection analytics foundation
- [ ] Browser testing with @qa-specialist

### Phase 1B: Collection Dashboard & Management (Week 2)
- [ ] Build comprehensive Collection Dashboard
- [ ] Implement collection organization features
- [ ] Add basic analytics display
- [ ] Create collection insights engine
- [ ] Social sharing infrastructure

### Phase 1C: Social & Viral Features (Week 3)
- [ ] Collection sharing cards
- [ ] Quiz results sharing
- [ ] Social proof integration
- [ ] Community features foundation
- [ ] Viral mechanics implementation

### Phase 1D: Engagement & Retention (Week 4)
- [ ] Progressive collection building flow
- [ ] Email integration for collection growth
- [ ] Gamification elements
- [ ] Analytics dashboard
- [ ] Performance optimization

## Success Metrics (Phase 1)

### Primary KPIs
- **Collection Conversion Rate**: % of quiz completers who save recommendations
- **Collection Growth**: Average fragrances per user over time
- **User Retention**: 7-day, 30-day return rates for collection users
- **Social Sharing**: Quiz results and collection shares per user

### Secondary KPIs
- **Engagement Depth**: Time spent in collection management
- **Discovery Effectiveness**: % of saved recommendations that users rate highly
- **Community Growth**: User referrals from social sharing
- **Feature Adoption**: Usage of advanced collection features

## Technical Implementation Details

### File Structure
```
components/
├── quiz/
│   ├── collection-preview.tsx (NEW)
│   ├── enhanced-conversion-flow.tsx (ENHANCE)
│   └── quiz-to-collection-bridge.tsx (NEW)
├── collection/
│   ├── collection-dashboard.tsx (NEW)
│   ├── collection-analytics.tsx (NEW)
│   ├── collection-organizer.tsx (NEW)
│   └── collection-insights.tsx (NEW)
├── social/
│   ├── collection-share-card.tsx (NEW)
│   ├── quiz-results-share.tsx (NEW)
│   └── social-proof-signals.tsx (NEW)

lib/
├── actions/
│   ├── quiz-collection.ts (NEW)
│   └── social-sharing.ts (NEW)
├── services/
│   ├── collection-analytics.ts (NEW)
│   └── viral-mechanics.ts (NEW)

app/
├── collection/
│   ├── page.tsx (NEW)
│   └── analytics/page.tsx (NEW)
```

### Database Migrations Required
1. **Collection Social Metrics**: Track social engagement per fragrance
2. **Quiz Attribution**: Link collections to specific quiz sessions
3. **Engagement Analytics**: Track user behavior patterns
4. **Viral Tracking**: Monitor social sharing performance

## Risk Mitigation

### Technical Risks
- **Performance**: Collection analytics queries could slow down UX
  - *Mitigation*: Implement caching layer, async processing
- **Data Privacy**: Social features must respect user privacy
  - *Mitigation*: Granular privacy controls, opt-in sharing

### Product Risks  
- **User Adoption**: Users might not engage with collection features
  - *Mitigation*: A/B test different collection onboarding flows
- **Social Sharing**: Sharing features might not drive viral growth
  - *Mitigation*: Test multiple sharing formats, incentivize sharing

## Next Steps

1. **Technical Architecture Review** with @technical-architect
2. **Database Schema Planning** with @database-operations-expert  
3. **Component Implementation** with @react-component-expert
4. **Testing Strategy** with @qa-specialist
5. **Performance Planning** with @performance-optimizer

---

**Estimated Timeline**: 4 weeks for Phase 1 complete implementation
**Team Required**: 1 full-stack developer + specialists for complex components
**Success Definition**: 25% quiz-to-collection conversion rate, 10k+ active users with collections