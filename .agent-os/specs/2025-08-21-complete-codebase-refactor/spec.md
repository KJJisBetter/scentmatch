# Spec Requirements Document

> Spec: Complete Codebase Refactor - 70% Code Reduction
> Created: 2025-08-21
> Status: Planning

## Overview

Transform ScentMatch from an over-engineered prototype into a production-ready, maintainable platform by eliminating 70% of unnecessary code through modern library adoption and architectural consolidation. This critical refactor will replace 13,300+ lines of custom AI implementation with 400 lines using Vercel AI SDK, consolidate 4 redundant quiz engines into a single unified system, and modernize the entire Next.js architecture with Server Actions and streaming.

## User Stories

### Engineering Team Efficiency

As a **developer on the ScentMatch team**, I want a **simplified, maintainable codebase with modern architecture**, so that **I can develop features 5x faster and onboard new team members in hours instead of weeks**.

**Detailed Workflow:** Replace scattered custom implementations across 25,000+ lines with proven libraries and modern Next.js patterns. Consolidate 4 different quiz engines into a single, configurable system. Transform complex API routes into streamlined Server Actions. Eliminate 95% of unused AI code while maintaining full functionality through Vercel AI SDK integration.

### Production Readiness

As a **product owner**, I want **a stable, performant platform using proven libraries**, so that **we can scale reliably without constant maintenance overhead and technical debt**.

**Detailed Workflow:** Replace all custom implementations (rate limiting, validation, search, recommendations) with battle-tested libraries. Eliminate memory leaks and performance bottlenecks. Achieve 60% performance improvement through streaming and proper caching. Reduce bundle size by 30% through dependency optimization.

### Future Development Velocity

As a **new developer joining the team**, I want **clear, understandable code following modern best practices**, so that **I can contribute meaningfully within days instead of struggling with over-engineered custom systems**.

**Detailed Workflow:** Transform 1,935-line monolithic files into focused, single-responsibility modules. Replace custom utilities with standard library patterns. Implement proper TypeScript patterns with 95% type safety improvement. Create clear separation of concerns between database, business logic, and presentation layers.

## Spec Scope

1. **AI System Overhaul** - Replace 13,300+ lines of custom AI code with Vercel AI SDK implementation (400 lines)
2. **Quiz Engine Consolidation** - Merge 4 redundant quiz engines (2,272 lines) into single unified system (200 lines)
3. **Next.js Architecture Modernization** - Convert 25+ API routes to Server Actions, implement streaming and Suspense
4. **Database Layer Simplification** - Consolidate 3 Supabase client patterns into modern @supabase/ssr approach
5. **UI Component Migration** - Replace 25+ custom components with shadcn/ui equivalents
6. **Library Modernization** - Replace 12 custom implementations with proven libraries (nanoid, @upstash/ratelimit, date-fns, etc.)
7. **Bundle Optimization** - Remove unused dependencies, optimize imports, achieve 30% bundle size reduction
8. **File Structure Reorganization** - Split monolithic files, consolidate scattered utilities, implement clear module boundaries

## Out of Scope

- Visual design changes or UI styling modifications
- Database schema changes or migrations
- New feature development during refactor period
- External API integrations or third-party service changes
- Authentication system modifications (already working well)
- Deployment pipeline or infrastructure changes

## Expected Deliverable

1. **68% code reduction achieved** - Codebase reduced from ~25,000 lines to ~8,000 lines with full functionality maintained
2. **Production-ready AI system** - Vercel AI SDK implementation providing same recommendations with 97% less code
3. **Unified quiz architecture** - Single configurable quiz engine replacing 4 conflicting systems with comprehensive test coverage
4. **Modern Next.js patterns** - Server Actions, streaming, and Suspense implemented throughout application
5. **Zero custom implementations** - All solved problems use proven libraries instead of custom code
6. **5x development velocity** - Measurable improvement in feature development speed and developer onboarding time
