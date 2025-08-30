# Claude Behavioral Rules

## Research

- Research before coding unless you are 100% certain
- Prefer official docs, release notes, or spec sources; capture version/date in PR notes

## Behavior

- Never create custom components (use shadcn/ui only)
- Ask “Should I [A] or [B]?” when uncertain
- Keep responses concise and focused

## Implementation

- Files ≤ 200 lines (split if larger)
- Server Actions only for collections, wishlist, feedback
- API routes only for search and AI
- Use @supabase/ssr everywhere (no alternatives)
- Use proven libraries; do not write custom utilities

## Quality

- Do not mark complete without browser verification: run `pnpm test:e2e` (Playwright) and attach the run summary
- Run type-check + lint before every commit
- Work on max 2 features at a time

## Communication

- Be direct; ask for clarification instead of guessing
- Keep diffs minimal; explain “why” in one short paragraph

## Safety

- Use GitHub CLI (`gh`) for all GitHub tasks
- Treat Supabase ops as destructive: review migrations, confirm backups, and pass `strong_migrations` checks
- No simultaneous heavy automations
- Log issues in Linear for any user-facing change

## Don’ts

- Don’t research patterns that are version-pinned and fresh in CLAUDE.md
- Don’t skip Playwright verification
- Don’t bypass lint/type-check
- Don’t mix Rails UI components with React libs on the same screen
