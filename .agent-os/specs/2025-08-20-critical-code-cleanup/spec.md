# Spec Requirements Document

> Spec: Critical Code Cleanup - Remove 89% Unused AI Files
> Created: 2025-08-20
> Status: Planning

## Overview

Remove massive technical debt blocking development by systematically eliminating 89% unused AI files (32/36), consolidating 56+ scripts, and removing conflicting systems to create a clean foundation for future redesign work and improved team velocity.

## User Stories

### Development Team Efficiency

As a developer working on ScentMatch, I want a clean, understandable codebase so that I can quickly identify which systems are active, understand the architecture, and implement new features without confusion from unused code.

**Detailed Workflow:** Developer examines AI recommendation system → sees only 4 working files instead of 36 → understands system immediately → implements changes confidently → no conflicts with unused systems → faster development cycle.

### System Performance and Reliability

As a platform user, I want fast page loads and reliable functionality so that my fragrance discovery experience is smooth and responsive without bundle bloat affecting performance.

**Detailed Workflow:** User visits recommendation page → system loads only necessary AI modules → faster response times → cleaner error handling → no interference from unused code paths → better user experience.

### Future Development Foundation

As a product team, I want a maintainable codebase foundation so that the upcoming platform redesign can build on proven, working systems without technical debt interference.

**Detailed Workflow:** Team starts redesign work → examines clean, documented system → identifies core functionality → builds confidently on solid foundation → faster development cycles → no confusion from legacy code.

## Spec Scope

1. **AI File Audit and Cleanup** - Remove 32/36 unused AI files, keeping only the 4 actively used systems (ai-search.ts, recommendation-engine.ts, thompson-sampling.ts, voyage-client.ts)
2. **Script Consolidation** - Clean up 56+ scripts, removing development experiments and keeping essential tools only
3. **System Deduplication** - Remove conflicting recommendation engines, keeping single working system
4. **Dependency Cleanup** - Remove unused imports, types, and functions throughout codebase
5. **Bundle Size Optimization** - Achieve measurable bundle size reduction through dead code elimination

## Out of Scope

- Adding new functionality or features
- Modifying working AI recommendation logic
- Database schema changes
- UI/UX improvements
- Performance optimizations beyond cleanup

## Expected Deliverable

1. **Reduced file count** - From 223 to ~150 TypeScript files (-30% reduction)
2. **Clean AI architecture** - Only 4 essential AI files remaining, clearly documented
3. **Consolidated scripts** - Essential tools only, development debris removed
4. **Working system verification** - All existing functionality confirmed operational after cleanup
5. **Bundle size reduction** - Measurable performance improvement from dead code removal