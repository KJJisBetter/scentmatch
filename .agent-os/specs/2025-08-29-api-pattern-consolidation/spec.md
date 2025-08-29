# Spec Requirements Document

> Spec: API Pattern Consolidation
> Created: 2025-08-29
> Status: Planning

## Overview

Consolidate ScentMatch's mixed API architecture into a consistent Server Actions pattern to eliminate performance bottlenecks, reduce complexity, and establish architectural foundation for Phase 1 optimizations. Currently, collections use efficient Server Actions while search and quiz functionality rely on slower API routes, creating inconsistent developer experience and suboptimal performance.

This architectural consolidation will:

- Migrate internal operations from API routes to Server Actions
- Maintain API routes only for external integrations (webhooks, third-party services)
- Establish performance-optimized patterns for AI-heavy operations
- Create consistent error handling and caching strategies
- Enable sub-200ms response times for core user interactions

## User Stories

### As a Developer

- I want consistent Server Actions patterns across all internal operations so I can maintain code efficiently
- I want sub-200ms response times for search and recommendations so users have instant feedback
- I want clear separation between internal operations (Server Actions) and external integrations (API routes)
- I want standardized error handling and timeout patterns across all operations

### As a Product User

- I want instant fragrance search results so I can quickly explore options
- I want fast quiz completion with immediate recommendations so the experience feels responsive
- I want reliable performance across all features so the platform feels professional

### As a System Administrator

- I want consolidated performance monitoring so I can track system health efficiently
- I want consistent caching strategies so I can optimize resource usage
- I want clear architectural patterns so I can scale the platform reliably

## Spec Scope

### Primary Migration Targets

1. **Search Functionality**: Migrate 477-line `/api/search` route to Server Actions
   - Fragrance search with Fuse.js integration
   - Filter and sorting logic
   - Result caching and pagination
   - Performance optimization patterns

2. **Quiz System**: Migrate AI-heavy quiz API routes to Server Actions
   - Quiz question processing
   - AI recommendation generation via UnifiedRecommendationEngine
   - Result persistence to collections
   - Performance monitoring integration

3. **Pattern Standardization**: Establish consistent patterns
   - Error handling with proper TypeScript types
   - Timeout and retry logic
   - Caching layer integration
   - Performance monitoring hooks

### Architecture Consolidation

- **Server Actions**: All internal CRUD operations, user interactions, AI processing
- **API Routes**: External webhooks, third-party integrations, public APIs only
- **Performance Targets**: <200ms response times, <2s first recommendation
- **File Size Limits**: Maintain sub-200 line files through proper decomposition

## Out of Scope

### Explicitly Excluded

- **UI Component Changes**: No modifications to existing React components
- **Database Schema Updates**: No changes to Supabase tables or relationships
- **New Feature Development**: Focus solely on architectural migration
- **External Integration Changes**: Maintain existing third-party service patterns
- **Authentication Flow Changes**: Preserve existing @supabase/ssr patterns

### Future Considerations

- Advanced caching strategies (Phase 2)
- Real-time features with WebSocket integration
- Mobile app API requirements
- Third-party developer API exposure

## Expected Deliverable

### Primary Outputs

1. **Migrated Server Actions**
   - `lib/actions/search-actions.ts`: Fragrance search and filtering
   - `lib/actions/quiz-actions.ts`: Quiz processing and AI recommendations
   - Performance-optimized implementation with caching

2. **Consolidated Architecture Documentation**
   - Updated development patterns in CLAUDE.md
   - Performance monitoring integration points
   - Error handling and timeout specifications

3. **Performance Validation**
   - <200ms response time validation for search operations
   - <2s first recommendation benchmark achievement
   - Automated testing for performance regression prevention

### Quality Gates

- All Server Actions under 200 lines per file
- TypeScript strict mode compliance
- Browser testing verification via @qa-specialist
- Performance benchmarks met with automated monitoring

## Spec Documentation

- Tasks: @.agent-os/specs/2025-08-29-api-pattern-consolidation/tasks.md
- Technical Specification: @.agent-os/specs/2025-08-29-api-pattern-consolidation/sub-specs/technical-spec.md
- API Specification: @.agent-os/specs/2025-08-29-api-pattern-consolidation/sub-specs/api-spec.md
