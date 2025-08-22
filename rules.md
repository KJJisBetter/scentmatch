# Claude Behavioral Rules

## How You Should Behave
- Always delegate feature building to implementation specialists when context >30k tokens
- Never research patterns documented in CLAUDE.md
- Always browser test UI changes using @testing-specialist  
- Never create custom components (use shadcn/ui only)
- Always ask "Should I [A] or [B]?" when uncertain

## Implementation Rules
- Files MUST stay under 200 lines (split if larger)
- Use Server Actions for collections/wishlist/feedback only
- Use API routes for search/AI processing only
- Use @supabase/ssr pattern throughout (no other patterns)
- Use proven libraries, never build custom utilities

## Quality Rules
- NEVER mark tasks complete without browser verification
- Always run type-check and lint before any commit
- Always use appropriate specialist agents for their domains
- Always return focused results (no verbose explanations)
- Always work on max 2 features simultaneously

## Communication Rules
- Be direct and concise in responses
- Delegate immediately when hitting context limits
- Ask for clarification rather than guessing
- Update "Recently Learned" section after discoveries
- Keep all file updates minimal and focused

## Don'ts for Claude
- Don't build features in main context (use specialists)
- Don't research documented patterns
- Don't create custom components or utilities
- Don't skip browser testing for UI work
- Don't work without specialist coordination when complex

## Tool Usage Guidelines

### Strategic Tool Selection
**Core Principle**: Use the most specialized tool for each task type

#### Development & Deployment
- **Vercel**: Deployment management, preview generation, domain configuration
- **Supabase**: Database operations, user auth, RLS policies, project branching  
- **Playwright**: Browser testing, UI validation, accessibility verification
- **Linear**: Issue tracking, sprint management, team coordination

#### Research & Content
- **Exa**: Neural semantic search (understands meaning, not just keywords)
- **Firecrawl**: Single-page content extraction with caching (maxAge for performance)
- **Apify**: Specialized scrapers (Fragrantica data, market research)
- **Ref**: Technical documentation and API references

### Performance & Safety Rules
- **Always test UI changes**: Use Playwright for browser verification before marking tasks complete
- **Database safety**: Use Supabase read-only mode for exploration, full access only for confirmed changes
- **Search efficiency**: Exa for semantic queries, Firecrawl for known URLs, Apify for structured data
- **Caching strategy**: Use Firecrawl maxAge parameter for 500% faster repeat requests
- **GitHub operations**: Always use GitHub CLI (gh) via Bash tool for ALL GitHub tasks

### Never Do
- Use multiple heavy automation tools simultaneously (performance)
- Deploy without Playwright browser verification (quality)
- Skip Linear issue tracking for user-facing changes (accountability)
- Use keyword search when semantic search (Exa) would be more effective