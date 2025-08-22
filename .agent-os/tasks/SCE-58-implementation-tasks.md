# SCE-58: Ultra-Deep Refactor - Implementation Tasks

## Week 1: Foundation Phase

### Phase 1.1: Type System Consolidation
**Target**: Reduce 2,472 type definitions to 200-300 Zod schemas

- [ ] **Task 1.1.1**: Audit existing type definitions
  - Analyze all files in `types/` directory
  - Identify redundant and duplicate types
  - Map type relationships and dependencies

- [ ] **Task 1.1.2**: Create core Zod schemas
  - Create `lib/schemas/user.ts` with UserSchema
  - Create `lib/schemas/fragrance.ts` with FragranceSchema  
  - Create `lib/schemas/collection.ts` with CollectionSchema
  - Create `lib/schemas/recommendation.ts` with RecommendationSchema

- [ ] **Task 1.1.3**: Replace interface imports
  - Update all components using UserPreferences interface
  - Update all components using RecommendationSettings interface
  - Update all components using NotificationSettings interface
  - Run type check after each batch of replacements

- [ ] **Task 1.1.4**: Remove redundant type files
  - Delete `types/` directory (50+ files)
  - Delete `interfaces/` directory (30+ files)
  - Delete `lib/types/` utility files
  - Clean up TypeScript imports

### Phase 1.2: API Route Migration to Server Actions
**Target**: Reduce 30 API routes to 6 routes + 4 Server Actions

- [ ] **Task 1.2.1**: Extend existing Server Actions
  - Extend `lib/actions/collections.ts` with updateUserCollection function
  - Add rate, wishlist, remove functionality to collections action
  - Test Server Action functionality matches API behavior

- [ ] **Task 1.2.2**: Create new Server Actions
  - Create `lib/actions/user.ts` for user preferences
  - Create `lib/actions/recommendations.ts` for feedback
  - Implement proper error handling and validation

- [ ] **Task 1.2.3**: Migrate API route functionality
  - Replace `/api/collection/*` calls with Server Actions
  - Replace `/api/wishlist/*` calls with Server Actions  
  - Replace `/api/user/preferences/*` calls with Server Actions
  - Replace `/api/recommendations/feedback` calls with Server Actions

- [ ] **Task 1.2.4**: Remove eliminated API routes
  - Delete `app/api/collection/` directory (8 files)
  - Delete `app/api/wishlist/` directory (6 files)
  - Delete `app/api/user/preferences/` directory (4 files)
  - Delete `app/api/recommendations/feedback/` directory (3 files)

### Phase 1.3: Supabase Client Unification
**Target**: Single modern @supabase/ssr pattern

- [ ] **Task 1.3.1**: Audit existing Supabase usage
  - Find all imports of legacy supabase clients
  - Identify inconsistent client creation patterns
  - Document current usage patterns

- [ ] **Task 1.3.2**: Standardize client usage
  - Replace all legacy client imports with `lib/supabase/server.ts`
  - Replace all legacy client imports with `lib/supabase/client.ts`
  - Update Server Actions to use createClient() consistently

- [ ] **Task 1.3.3**: Remove legacy client files
  - Delete `lib/supabase.ts` 
  - Delete `lib/supabase-client.ts`
  - Clean up related utility functions

## Week 2: Architecture Modernization Phase

### Phase 2.1: Streaming Architecture Implementation
**Target**: 60% perceived performance improvement

- [ ] **Task 2.1.1**: Implement page-level streaming
  - Convert `/recommendations` page to streaming architecture
  - Convert `/collection` page to streaming architecture  
  - Convert `/quiz` page to streaming architecture
  - Convert `/discover` page to streaming architecture

- [ ] **Task 2.1.2**: Create loading components
  - Create `RecommendationsSkeleton` component
  - Create `TrendingSkeleton` component
  - Create `CollectionSkeleton` component
  - Create `QuizResultsSkeleton` component

- [ ] **Task 2.1.3**: Optimize data fetching
  - Implement parallel data fetching for streaming components
  - Add proper error boundaries for each Suspense boundary
  - Test streaming behavior across different network conditions

### Phase 2.2: Component Library Revolution
**Target**: 50% component file reduction via shadcn/ui

- [ ] **Task 2.2.1**: Migrate Collection Dashboard
  - Replace `components/collection/collection-table.tsx` with `@tanstack/react-table`
  - Create new `components/collection/data-table.tsx` (target: 50 lines vs 400)
  - Ensure feature parity with filtering, sorting, pagination
  - Test collection management functionality

- [ ] **Task 2.2.2**: Migrate Search Interface  
  - Replace `components/search/search-interface.tsx` with `Command` component
  - Create new `components/search/command-search.tsx` (target: 100 lines vs 300)
  - Maintain keyboard navigation and search functionality
  - Test search UX and performance

- [ ] **Task 2.2.3**: Migrate Quiz Forms
  - Replace `components/quiz/quiz-forms.tsx` with `React Hook Form + Zod`
  - Create new `components/quiz/form-sections.tsx` (target: 150 lines vs 400)
  - Implement proper validation using Zod schemas
  - Test quiz flow and form validation

### Phase 2.3: Database Query Optimization
**Target**: Modern RLS policies and query patterns

- [ ] **Task 2.3.1**: Optimize RLS policies
  - Review current RLS policies for performance
  - Implement efficient user-scoped queries
  - Add proper indexes for vector similarity queries

- [ ] **Task 2.3.2**: Modernize query patterns
  - Replace complex middleware with Supabase RLS
  - Optimize fragrance search queries
  - Implement efficient collection queries

## Week 3: AI/ML Architecture Optimization Phase

### Phase 3.1: Embedding Service Consolidation
**Target**: Single embedding service using modern patterns

- [ ] **Task 3.1.1**: Create unified embedding service
  - Create `lib/ai-sdk/embedding-service.ts`
  - Implement VoyageAI integration for embeddings
  - Add pgvector similarity search functionality

- [ ] **Task 3.1.2**: Replace multiple AI utilities
  - Identify all current embedding utilities
  - Replace with single EmbeddingService class
  - Update all embedding-related API routes

- [ ] **Task 3.1.3**: Remove redundant AI implementations
  - Delete multiple embedding utility files
  - Delete custom vector implementations  
  - Clean up redundant AI helper functions

### Phase 3.2: Recommendation Engine Finalization  
**Target**: Complete UnifiedRecommendationEngine migration

- [ ] **Task 3.2.1**: Remove legacy quiz engines
  - Delete `lib/ai/quiz-engine-v1.ts`
  - Delete `lib/ai/quiz-engine-v2.ts`  
  - Delete `lib/recommendations/legacy-engine.ts`

- [ ] **Task 3.2.2**: Consolidate recommendation types
  - Update all references to use UnifiedRecommendationEngine
  - Remove legacy type definitions
  - Test recommendation accuracy and performance

## Week 3: Performance & Bundle Optimization

### Phase 4.1: Dependency Audit & Replacements
**Target**: Replace over-engineered dependencies

- [ ] **Task 4.1.1**: Audit current dependencies
  - Run dependency analyzer on package.json
  - Identify oversized or redundant packages
  - Document replacement opportunities

- [ ] **Task 4.1.2**: Replace custom utilities
  - Replace custom utility libraries with native JavaScript
  - Simplify type utilities using Zod inference
  - Remove redundant helper functions

- [ ] **Task 4.1.3**: Optimize imports
  - Configure tree shaking for major libraries
  - Add dynamic imports for heavy components
  - Optimize lucide-react and @supabase/ssr imports

### Phase 4.2: Build Optimization
**Target**: 50% bundle reduction

- [ ] **Task 4.2.1**: Configure build optimization
  - Update `next.config.js` with optimization settings
  - Enable experimental package optimization
  - Configure proper chunk splitting

- [ ] **Task 4.2.2**: Monitor bundle size
  - Set up bundle analyzer in CI/CD
  - Create bundle size budgets
  - Monitor Core Web Vitals regression

## Testing & Quality Assurance Tasks

### Continuous Testing
- [ ] **Task QA.1**: Run test suite after each phase
- [ ] **Task QA.2**: Verify Server Actions match API behavior
- [ ] **Task QA.3**: Test UI components with Playwright MCP
- [ ] **Task QA.4**: Monitor performance metrics
- [ ] **Task QA.5**: Validate type coverage maintenance

### Final Validation
- [ ] **Task QA.6**: Complete user flow testing
- [ ] **Task QA.7**: Performance benchmark comparison
- [ ] **Task QA.8**: Code maintainability assessment
- [ ] **Task QA.9**: Bundle size validation (target: 50% reduction)
- [ ] **Task QA.10**: Core Web Vitals verification (all green)

## Success Metrics Tracking

### Automated Metrics
- [ ] Lines of code: 25,000+ → 15,000 (40% reduction)
- [ ] Type definitions: 2,472 → 300 (88% reduction)  
- [ ] API routes: 30 → 8 (73% reduction)
- [ ] Bundle size: 50% reduction target
- [ ] First Contentful Paint: <1.2s target
- [ ] Time to Interactive: <2.5s target

### Manual Validation
- [ ] User experience testing
- [ ] Developer experience validation
- [ ] Code review and maintainability assessment
- [ ] Performance perception testing

## Risk Mitigation
- Each task implemented on feature branch
- Comprehensive testing before merge to main
- Feature flags for gradual rollout
- Complete rollback plan documented

---

**Implementation Note**: This refactor will be executed in strict phases to minimize risk while maximizing impact. Each phase must be completed and tested before proceeding to the next.