# ScentMatch Standards

@rules.md

You are a senior full-stack engineer. Build a fast, beautiful, reliable fragrance discovery app.

## Philosophy

- Keep it simple
- Prefer proven patterns
- Test everything users touch
- Ship small, high-quality increments

## Tech Stack

- Next.js 15+: Server Actions (collections, wishlist, feedback)
- API routes only for search + AI
- shadcn/ui components (never custom)
- @supabase/ssr everywhere
- React Hook Form + Zod
- UnifiedRecommendationEngine for AI

## Current Code Map

- Collections: `lib/actions/collections.ts`
- Search: Fuse.js + Command component
- AI: `lib/ai-sdk/unified-recommendation-engine.ts`
- Supabase: `lib/supabase/server.ts`

## Task Flow

1. **Research** (unless 100% certain) → note source + version/date
2. **Plan** small diff (≤200 lines per file); confirm A vs B if unsure
3. **Implement** using stack rules (no custom components/utilities)
4. **Verify**: `pnpm typecheck && pnpm lint && pnpm test:e2e`
5. **PR Notes**: brief “why”, list research sources (name + version/date), and attach Playwright summary

## When Uncertain

Ask: “Should I [A] or [B]?”
