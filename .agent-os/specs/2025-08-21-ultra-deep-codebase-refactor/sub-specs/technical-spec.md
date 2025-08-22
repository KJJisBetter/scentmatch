# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-21-ultra-deep-codebase-refactor/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Technical Requirements

### Phase 1: Foundation (Week 1)

**Type System Consolidation**
- Replace interface/type definitions with Zod schema validation throughout codebase
- Implement type inference using `z.infer<typeof Schema>` pattern
- Create unified validation schemas for User, Fragrance, Collection, and Recommendation entities
- Remove redundant type files and consolidate into schema-based definitions
- Ensure 100% type safety through schema validation at runtime boundaries

**API Route Migration to Server Actions**
- Convert collection management endpoints (/api/collection/*) to single Server Action
- Convert wishlist operations (/api/wishlist/*) to unified Server Action
- Convert recommendation feedback (/api/recommendations/feedback) to Server Action
- Maintain /api/search/* for complex search operations (keep as API routes)
- Maintain /api/quiz/analyze for AI processing (keep as API routes)
- Implement form validation using React Hook Form + Zod integration

**Supabase Client Unification**
- Standardize on @supabase/ssr pattern for all database operations
- Remove lib/supabase.ts and lib/supabase-client.ts legacy patterns
- Use single createClient() function from lib/supabase/server.ts and lib/supabase/client.ts
- Implement consistent error handling across all database operations
- Ensure proper TypeScript integration with Supabase generated types

### Phase 2: Architecture (Week 2)

**Streaming Implementation**
- Add Suspense boundaries for all major page components
- Implement progressive loading for AI recommendations
- Create skeleton components for loading states
- Use streaming server components for data-heavy operations
- Optimize route-level loading with parallel data fetching

**Component Migration**
- Replace Collection Dashboard with @tanstack/react-table implementation
- Migrate Search Interface to shadcn/ui Command component
- Convert Quiz Forms to React Hook Form + shadcn/ui form components
- Implement consistent shadcn/ui theming across all components
- Remove all custom component implementations where shadcn/ui equivalents exist

**Database Optimization**
- Optimize query patterns for modern Next.js data fetching
- Implement proper Row Level Security (RLS) policies
- Add database indexes for performance-critical queries
- Optimize vector search operations with pgvector best practices

### Phase 3: AI/Performance (Week 3)

**AI System Finalization**
- Complete removal of legacy quiz engines (keep only UnifiedRecommendationEngine)
- Integrate Voyage AI embedding service with fallback to OpenAI
- Optimize vector similarity search performance
- Consolidate all AI-related utilities into single service layer

**Bundle Optimization**
- Implement dynamic imports for code splitting
- Optimize bundle analysis and tree shaking
- Remove unused dependencies and consolidate similar packages
- Implement proper build-time optimizations for Next.js 15+

**Performance Monitoring**
- Implement Core Web Vitals tracking with specific thresholds
- Add performance regression testing to CI/CD pipeline
- Create performance monitoring dashboard for key metrics
- Establish baseline measurements for all optimization targets

## External Dependencies

**New Dependencies Required:**

- **@tanstack/react-table** - Modern data table implementation
  - **Justification:** Replaces 400+ lines of custom table components with industry-standard solution
  - **Version:** Latest stable (v8+)

- **react-hook-form** - Form state management
  - **Justification:** Eliminates custom form handling and integrates seamlessly with Zod validation
  - **Version:** Latest stable (v7+)

**Dependencies to Remove:**

- Custom table components (replace with @tanstack/react-table)
- Legacy form handling utilities (replace with react-hook-form)
- Redundant utility libraries where native JavaScript suffices