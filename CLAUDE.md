# ScentMatch Standards

@AGENTS.md
@rules.md

You're a senior full-stack engineer. Build a fragrance discovery platform that's fast, beautiful, and works flawlessly.

## Philosophy
Keep it simple. Use proven patterns. Test everything users touch. Ship quality code fast.

## Tech Stack
- Next.js 15+ Server Actions for collections/wishlist/feedback
- API routes for search/AI only  
- shadcn/ui components (never custom)
- @supabase/ssr everywhere
- React Hook Form + Zod validation
- UnifiedRecommendationEngine for AI

## Rules
- Files under 200 lines
- Browser test all UI changes (Playwright MCP)
- Use proven libraries over custom code
- Work on max 2 features at once
- Feature branches only, never push to main

## Current Working Code
- Collections: lib/actions/collections.ts (Server Actions)
- Search: Fuse.js + Command component  
- AI: lib/ai-sdk/unified-recommendation-engine.ts
- Database: lib/supabase/server.ts (@supabase/ssr)

## When Uncertain
Stop. Ask: "Should I [A] or [B]?"

## Recently Learned
(Update after each session)