# Spec Tasks

## Tasks

- [ ] 1. AI System Overhaul - Replace 13,300+ lines with Vercel AI SDK
  - [ ] 1.1 Write tests for recommendation API endpoints to ensure compatibility
  - [ ] 1.2 Install and configure Vercel AI SDK with OpenAI integration
  - [ ] 1.3 Implement unified recommendation engine using AI SDK
  - [ ] 1.4 Replace embedding generation with Vercel AI embedding
  - [ ] 1.5 Remove entire lib/ai/ directory and custom AI classes
  - [ ] 1.6 Update all imports and references to use new AI implementation
  - [ ] 1.7 Verify all tests pass and API compatibility maintained

- [ ] 2. Quiz Engine Consolidation - Merge 4 engines into unified system
  - [ ] 2.1 Write comprehensive tests for existing quiz functionality
  - [ ] 2.2 Create unified QuizEngine class with strategy pattern
  - [ ] 2.3 Implement database strategy from existing engines
  - [ ] 2.4 Implement AI strategy using new Vercel AI SDK
  - [ ] 2.5 Implement hybrid strategy combining database and AI
  - [ ] 2.6 Remove 4 separate quiz engine files (2,272 lines)
  - [ ] 2.7 Update all quiz API endpoints to use unified engine
  - [ ] 2.8 Verify all tests pass and quiz functionality works correctly

- [ ] 3. Next.js Architecture Modernization - Convert to Server Actions
  - [ ] 3.1 Write tests for critical API endpoints before conversion
  - [ ] 3.2 Create lib/actions/ directory structure
  - [ ] 3.3 Convert authentication-related API routes to Server Actions
  - [ ] 3.4 Convert quiz-related API routes to Server Actions
  - [ ] 3.5 Convert search and recommendation API routes to Server Actions
  - [ ] 3.6 Implement streaming and Suspense in page components
  - [ ] 3.7 Remove converted API routes from app/api/ directory
  - [ ] 3.8 Verify all functionality works with Server Actions

- [ ] 4. Database Layer Simplification - Unify Supabase patterns
  - [ ] 4.1 Write tests for database operations to ensure compatibility
  - [ ] 4.2 Implement modern @supabase/ssr client configuration
  - [ ] 4.3 Replace all Supabase client instances with unified pattern
  - [ ] 4.4 Consolidate database utility functions into single module
  - [ ] 4.5 Remove duplicate Supabase client files
  - [ ] 4.6 Update TypeScript types from Supabase schema
  - [ ] 4.7 Verify all database operations work correctly

- [ ] 5. UI Component Migration - Replace custom with shadcn/ui
  - [ ] 5.1 Write tests for component behavior before replacement
  - [ ] 5.2 Replace custom search input with Command component
  - [ ] 5.3 Replace collection dashboard with Data Table component
  - [ ] 5.4 Replace mobile navigation with Sheet component
  - [ ] 5.5 Replace custom forms with react-hook-form + shadcn/ui
  - [ ] 5.6 Remove custom component files and CSS
  - [ ] 5.7 Verify all UI functionality and accessibility works

- [ ] 6. Library Modernization - Replace custom utilities
  - [ ] 6.1 Write tests for utility functions before replacement
  - [ ] 6.2 Install modern library dependencies (nanoid, @upstash/ratelimit, etc.)
  - [ ] 6.3 Replace custom ID generation with nanoid
  - [ ] 6.4 Replace custom rate limiting with @upstash/ratelimit
  - [ ] 6.5 Replace custom date handling with date-fns
  - [ ] 6.6 Replace custom search with fuse.js implementation
  - [ ] 6.7 Remove custom utility implementations
  - [ ] 6.8 Verify all utility functionality works correctly

- [ ] 7. File Structure Reorganization - Split monolithic files
  - [ ] 7.1 Write tests for recommendation engine before splitting
  - [ ] 7.2 Create focused modules in lib/recommendations/ directory
  - [ ] 7.3 Split recommendation-engine.ts (1,935 lines) into modules
  - [ ] 7.4 Consolidate scattered utilities into lib/utils/
  - [ ] 7.5 Implement proper barrel exports for clean imports
  - [ ] 7.6 Remove unused files and dead code
  - [ ] 7.7 Update all imports to use new module structure
  - [ ] 7.8 Verify all functionality works with new structure

- [ ] 8. Bundle Optimization - Clean dependencies and optimize
  - [ ] 8.1 Write tests to ensure no functionality breaks during optimization
  - [ ] 8.2 Remove unused dependencies from package.json
  - [ ] 8.3 Optimize imports for better tree-shaking
  - [ ] 8.4 Configure dynamic imports for code splitting
  - [ ] 8.5 Set up bundle analyzer for monitoring
  - [ ] 8.6 Configure TypeScript paths for absolute imports
  - [ ] 8.7 Verify bundle size reduction and performance improvements
