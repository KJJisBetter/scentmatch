# API Pattern Consolidation - Lite Summary

Consolidate ScentMatch's mixed API architecture (Server Actions for collections, API routes for search/AI) into consistent Server Actions pattern for <200ms response times and simplified development.

## Key Points

- **Migration Scope**: Move 477-line search API route and AI-heavy quiz routes to Server Actions while maintaining API routes only for external integrations
- **Performance Target**: Achieve <200ms search responses and <2s first recommendations through Server Actions optimization and caching
- **Architecture Goal**: Establish consistent Server Actions pattern across all internal operations, matching proven collections.ts implementation for Phase 1 foundation
