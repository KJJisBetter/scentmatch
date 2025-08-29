# ScentMatch: Remaining Work Specification

**Created:** August 29, 2025  
**Status:** Post-MVP Phase 1-2 Implementation Plan  
**Phase 0 Status:** ✅ COMPLETE - MVP Ready for Launch

## Executive Summary

ScentMatch MVP is **100% functional** with complete quiz → account → email → collections flow working. Remaining work focuses on **technical excellence, performance optimization, and growth features** to transform from working MVP to market-leading platform.

**Current State:** Production-ready MVP with 40+ TypeScript errors in non-critical features  
**Target State:** Scalable, maintainable platform ready for growth and competitive advantage

---

## Phase 1: Technical Foundation & Performance (2-4 weeks)

### 🔧 **Critical Issue 1: TypeScript Compliance & Code Quality**

**Current State:** 40+ TypeScript errors in non-MVP features
**Impact:** Development velocity, code reliability, production stability
**Priority:** P1 - High

**Affected Areas:**

```typescript
// AI SDK Type Mismatches (15 errors)
lib/ai-sdk/client.ts - Optional vs required properties
lib/ai-sdk/embedding-service.ts - VoyageAI import issues

// Collection Component Types (8 errors)
components/collection/collection-dashboard-modern.tsx - scent_family remnants
components/collection/collection-data-table.tsx - Duplicate identifiers

// Service Layer Types (12 errors)
lib/services/ - SupabaseClient vs Promise<SupabaseClient> mismatches
lib/services/ - Database query type inconsistencies

// Social Feature Types (5 errors)
components/social/ - ShareableData interface mismatches
```

**Implementation Tasks:**

1. **AI SDK Type Corrections (Week 1.1 - 4 hours)**
   - Fix optional vs required properties in AI response types
   - Update VoyageAI imports to correct API
   - Ensure generateText/generateObject calls match v5.0+ patterns

2. **Database Service Type Safety (Week 1.2 - 3 hours)**
   - Fix SupabaseClient async/sync inconsistencies
   - Update database query return types
   - Ensure proper null handling

3. **Component Interface Alignment (Week 1.3 - 2 hours)**
   - Fix remaining scent_family references
   - Resolve duplicate identifier issues
   - Update social component interfaces

**Acceptance Criteria:**

- [ ] `npm run type-check` passes with 0 errors
- [ ] `npm run build` completes successfully
- [ ] No TypeScript-related runtime errors
- [ ] Code editor shows no red squiggles

---

### ⚡ **Critical Issue 2: API Pattern Consolidation (SCE-106)**

**Current State:** Mixed API routes vs Server Actions causing maintenance complexity
**Impact:** Developer confusion, inconsistent patterns, performance bottlenecks
**Priority:** P1 - High

**Architecture Analysis:**

```
❌ Current Mixed Patterns:
/app/api/quiz/route.ts (329 lines - heavy AI processing)
/app/api/search/route.ts (477 lines - complex search logic)
/lib/actions/collections.ts (Server Actions for same domain)

✅ Target Unified Pattern:
/lib/actions/ (all user interactions)
/app/api/ (only external webhooks/integrations)
```

**Migration Strategy:**

1. **Quiz Server Action Migration (Week 2.1 - 8 hours)**

   ```typescript
   // Move /app/api/quiz/route.ts → /lib/actions/quiz.ts
   export async function analyzeQuizResponses(responses: QuizResponse[]);
   export async function generateQuizRecommendations(sessionToken: string);
   ```

2. **Search Server Action Migration (Week 2.2 - 6 hours)**

   ```typescript
   // Move /app/api/search/route.ts → /lib/actions/search.ts
   export async function searchFragrances(
     query: string,
     filters?: SearchFilters
   );
   export async function getSearchSuggestions(query: string);
   ```

3. **Performance Optimization (Week 2.3 - 4 hours)**
   - Implement caching for heavy AI operations
   - Add background job processing for recommendations
   - Optimize database queries with proper indexing

**Acceptance Criteria:**

- [ ] All user interactions use Server Actions consistently
- [ ] API routes only handle external system integrations
- [ ] No performance regression in recommendation generation
- [ ] Sub-2 second response times for quiz processing

---

### 🗄️ **Critical Issue 3: Database Architecture Enhancement (SCE-108)**

**Current State:** Basic schema missing industry best practices
**Impact:** Limited recommendation quality, scalability concerns
**Priority:** P1 - High

**Missing Database Patterns:**

```sql
-- Hierarchical Scent Taxonomy (missing)
scent_families (id, name, parent_family_id)

-- Enhanced User Preferences (basic)
user_preferences (user_id, scent_family_id, preference_score, source)

-- Performance Indexes (missing)
CREATE INDEX idx_fragrances_family ON fragrances(fragrance_family);
CREATE INDEX idx_user_collections_user ON user_collections(user_id);
CREATE INDEX idx_fragrance_search ON fragrances USING gin(to_tsvector('english', name || ' ' || brand));
```

**Implementation Tasks:**

1. **Hierarchical Scent Taxonomy (Week 3.1 - 6 hours)**
   - Create scent_families table with parent/child relationships
   - Migrate existing fragrance_family data to hierarchical structure
   - Update recommendation engine to use hierarchy

2. **User Preference Modeling (Week 3.2 - 4 hours)**
   - Enhanced preference tracking beyond quiz responses
   - Behavioral preference learning from user interactions
   - Multi-dimensional preference scoring

3. **Performance Optimization (Week 3.3 - 3 hours)**
   - Add strategic database indexes for fast queries
   - Implement query optimization for recommendation generation
   - Add database monitoring and performance tracking

**Acceptance Criteria:**

- [ ] Database queries average <50ms response time
- [ ] Recommendation quality improves with hierarchical data
- [ ] User preference learning enhances personalization
- [ ] Database can handle 1000+ concurrent users

---

### 📁 **Critical Issue 4: File Structure Simplification (SCE-109)**

**Current State:** 200+ files with complex nested structure
**Impact:** Developer onboarding difficulty, maintenance overhead
**Priority:** P2 - Medium

**Simplification Strategy:**

```
Current Complex Structure → Target Domain Structure:

/components/quiz/ (15 files)     → /components/domains/quiz/ (5 core files)
/components/collection/ (20+ files) → /components/domains/collection/ (8 files)
/components/search/ (12 files)   → /components/domains/search/ (4 files)
/components/social/ (12 files)   → Remove (post-MVP features)
/lib/services/ (8+ files)       → /lib/domains/*/services.ts
```

**Implementation Tasks:**

1. **Domain-Driven Reorganization (Week 4.1 - 6 hours)**
   - Group files by business domain, not technical type
   - Consolidate duplicate components into single implementations
   - Remove unused social/gamification components

2. **Import Path Updates (Week 4.2 - 3 hours)**
   - Update all import statements to new structure
   - Ensure no broken dependencies
   - Update build configuration

3. **Test Consolidation (Week 4.3 - 4 hours)**
   - Merge overlapping test files
   - Remove tests for unused components
   - Organize tests to mirror new domain structure

**Acceptance Criteria:**

- [ ] File count reduced by 50%+ while maintaining functionality
- [ ] Clear domain-driven organization
- [ ] New developer can find files intuitively
- [ ] Build time improves due to simpler structure

---

## Phase 2: Growth Features & Market Leadership (4-8 weeks)

### 🛒 **Growth Feature 1: Sample Purchasing Integration (SCE-110)**

**Current State:** No sample purchasing - users can't buy recommendations
**Impact:** No monetization, incomplete user journey
**Priority:** P2 - Medium (Post-MVP)

**Implementation Requirements:**

1. **Sample Purchase Workflow (Week 5-6)**
   - Integration with fragrance retailers (Sephora, Ulta APIs)
   - Sample kit creation and management
   - Purchase tracking and fulfillment

2. **Affiliate Partnership System (Week 6)**
   - Affiliate link management
   - Commission tracking
   - Revenue analytics

**Acceptance Criteria:**

- [ ] Users can purchase samples directly from recommendations
- [ ] Affiliate revenue tracking functional
- [ ] Sample-to-full-size conversion funnel

---

### 📱 **Growth Feature 2: Mobile-First UX Enhancement (SCE-93)**

**Current State:** Desktop-first design with basic mobile support
**Impact:** Poor mobile UX for 80%+ of users
**Priority:** P2 - Medium

**Mobile Optimizations:**

1. **Bottom Navigation System (Week 7)**
   - Replace top navigation with thumb-friendly bottom nav
   - Progressive Web App (PWA) capabilities
   - Touch-optimized interactions

2. **Performance Enhancement (Week 7)**
   - Core Web Vitals optimization for mobile
   - Progressive image loading
   - Offline functionality

**Acceptance Criteria:**

- [ ] Mobile Core Web Vitals green on 3G networks
- [ ] PWA functionality works across devices
- [ ] Native-like mobile experience

---

### 🧹 **Growth Feature 3: Technical Debt Cleanup (SCE-111, SCE-112)**

**Current State:** Legacy code, unused files, inconsistent patterns
**Impact:** Maintenance overhead, deployment risks
**Priority:** P3 - Low (Ongoing)

**Cleanup Tasks:**

1. **Remove Unused Code (Week 8.1)**
   - Delete disabled API routes
   - Remove unused social/gamification components
   - Clean up commented code blocks

2. **Standardize Patterns (Week 8.2)**
   - Consolidate Supabase client usage
   - Standardize collection type usage across codebase
   - Fix variable naming inconsistencies

**Acceptance Criteria:**

- [ ] Codebase complexity reduced by 50%
- [ ] Consistent patterns throughout
- [ ] Faster development velocity

---

## Success Metrics & Validation

### Phase 1 Success Metrics

- **Technical:** 0 TypeScript errors, <200ms API responses, Core Web Vitals green
- **Developer:** 50% reduction in new feature development time
- **Performance:** <50ms database queries, 99.9% uptime

### Phase 2 Success Metrics

- **Business:** Sample purchasing integration, affiliate revenue tracking
- **User Experience:** Mobile-first design, PWA capabilities
- **Platform:** 50% codebase complexity reduction

### Validation Strategy

- **Continuous Testing:** All changes validated with browser automation
- **Performance Monitoring:** Real-time metrics for API and database performance
- **User Feedback:** A/B testing for UX improvements
- **Code Quality:** Automated TypeScript and linting checks

---

## Resource Requirements

### Development Timeline

- **Phase 1 (Weeks 1-4):** Technical foundation and performance
- **Phase 2 (Weeks 5-8):** Growth features and UX enhancement
- **Ongoing:** Technical debt cleanup and optimization

### Technical Dependencies

- **Supabase:** Enhanced database functions and indexes
- **Vercel:** Performance monitoring and edge optimization
- **Third-party:** Affiliate partner APIs and sample fulfillment
- **AI Services:** Continued OpenAI API usage for recommendations

### Risk Management

- **Rollback Strategy:** Feature flags for all major changes
- **Performance Guards:** Automated regression detection
- **User Impact:** A/B testing for UX changes
- **Security:** Regular audit and penetration testing

---

## Implementation Priority Matrix

| Feature               | Priority | Impact | Effort | Phase |
| --------------------- | -------- | ------ | ------ | ----- |
| TypeScript Compliance | P1       | High   | Low    | 1     |
| API Consolidation     | P1       | High   | Medium | 1     |
| Database Enhancement  | P1       | High   | Medium | 1     |
| File Structure        | P2       | Medium | Low    | 1     |
| Sample Purchasing     | P2       | High   | High   | 2     |
| Mobile UX             | P2       | Medium | Medium | 2     |
| Technical Debt        | P3       | Low    | Medium | 2     |

---

**Document Status:** Ready for stakeholder review and approval  
**Next Step:** Stakeholder approval required before Phase 1 execution begins
