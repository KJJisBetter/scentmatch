# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-21-complete-codebase-refactor/spec.md

## Technical Requirements

### AI System Overhaul (Priority: CRITICAL)

- Replace entire `lib/ai/` directory (13,300+ lines) with Vercel AI SDK implementation
- Implement unified recommendation engine using `@ai-sdk/openai` and `ai` package
- Migrate embedding generation to Vercel AI SDK with Voyage AI integration
- Remove all custom AI classes, interfaces, and utility functions
- Maintain API compatibility for existing recommendation endpoints
- Implement proper error handling and fallback mechanisms for AI services

### Quiz Engine Consolidation (Priority: CRITICAL)

- Merge 4 separate quiz engines into single `QuizEngine` class with strategy pattern
- Consolidate quiz logic from: `quiz-engine.ts`, `working-recommendation-engine.ts`, `database-recommendation-engine.ts`, `direct-database-engine.ts`
- Implement configurable strategies: database, AI, hybrid approaches
- Remove duplicate scoring algorithms and preference mapping logic
- Maintain backward compatibility with existing quiz API endpoints
- Implement comprehensive unit tests for all quiz strategies

### Next.js Architecture Modernization (Priority: HIGH)

- Convert 25+ API routes in `app/api/` to Server Actions in `lib/actions/`
- Implement streaming and Suspense boundaries for all page components
- Replace client-side data fetching with Server Components where appropriate
- Implement proper error boundaries and loading states
- Migrate to Next.js 15 App Router patterns throughout application
- Implement proper middleware for authentication and rate limiting

### Database Layer Simplification (Priority: HIGH)

- Consolidate Supabase clients: `lib/supabase-client.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase.ts`
- Implement modern `@supabase/ssr` pattern for server and client usage
- Remove duplicate database utility functions and connection patterns
- Standardize query patterns and error handling across all database operations
- Implement proper TypeScript types generation from Supabase schema

### UI Component Migration (Priority: MEDIUM)

- Replace custom search input with shadcn/ui Command component
- Replace collection dashboard with shadcn/ui Data Table component
- Replace mobile navigation with shadcn/ui Sheet component
- Replace custom form components with react-hook-form + shadcn/ui Form components
- Remove all custom CSS and utility classes in favor of Tailwind + shadcn/ui
- Implement proper accessibility patterns throughout component library

### Library Modernization (Priority: MEDIUM)

- Replace custom ID generation with `nanoid` library
- Replace custom rate limiting with `@upstash/ratelimit`
- Replace custom date handling with `date-fns`
- Replace custom search with `fuse.js` for fuzzy search
- Replace custom validation patterns with enhanced Zod schemas
- Replace custom debouncing with `use-debounce` hook

### File Structure Reorganization (Priority: MEDIUM)

- Split `recommendation-engine.ts` (1,935 lines) into focused modules in `lib/recommendations/`
- Consolidate scattered utility functions into `lib/utils/` with proper module boundaries
- Reorganize component structure following shadcn/ui patterns
- Implement proper barrel exports for cleaner import statements
- Remove all unused files and dead code identified during analysis

### Bundle Optimization (Priority: LOW)

- Remove unused dependencies: `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `glob`, `@types/glob`
- Implement proper tree-shaking for all library imports
- Optimize dynamic imports for better code splitting
- Configure proper TypeScript paths for absolute imports
- Implement bundle analyzer integration for ongoing monitoring

## External Dependencies

- **@ai-sdk/openai** - Official OpenAI integration for Vercel AI SDK
- **ai** - Vercel AI SDK core package for streaming and embeddings
- **@upstash/ratelimit** - Production-ready rate limiting with Redis
- **nanoid** - Secure, URL-safe unique ID generation
- **date-fns** - Modern date utility library
- **fuse.js** - Powerful fuzzy search library
- **react-hook-form** - Performant forms with easy validation
- **@tanstack/react-table** - Headless table library for data grids
- **use-debounce** - Debouncing hook for React
- **string-similarity** - String similarity algorithms for brand matching

### Justification for External Dependencies

All selected libraries are industry-standard solutions with active maintenance, comprehensive TypeScript support, and proven production usage. Each library replaces complex custom implementations with battle-tested code, reducing maintenance burden and improving reliability. Total bundle impact is net negative due to removal of larger custom implementations.
