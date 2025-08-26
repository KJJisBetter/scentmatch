# AGENTS.md - ScentMatch Agent Coordination

## Performance Guidelines
- **Main Claude**: Orchestration, planning, user communication only
- **Implementation agents**: Feature building to prevent context hangs
- **Context limits**: Delegate to agents when main context >50k tokens
- **Agent coordination**: Each agent returns focused results, no cross-context pollution

## Build/Test Commands
```bash
npm run type-check         # TypeScript validation
npm run lint              # ESLint + Prettier
npm run test              # Vitest unit tests
npm run dev               # Development server
npm run build             # Production build
```

## Agent Usage Rules
- **database-operations-expert**: Supabase MCP (queries, migrations, RLS)
- **qa-specialist**: Playwright MCP (browser testing, screenshots, validation)
- **react-component-expert**: shadcn/ui components + testing
- **devops-engineer**: Vercel MCP + GitHub CLI (deployments, infrastructure)
- **market-researcher**: Exa/Firecrawl MCP (data research, competitive analysis)
- **project-manager**: Linear MCP (issue tracking, task management)

## Code Standards
- Files under 200 lines
- shadcn/ui components only (no custom)
- @supabase/ssr pattern throughout
- React Hook Form + Zod for forms
- Browser testing required for UI work

## Performance Rules
- Delegate feature building to MCP-equipped agents
- Keep main Claude for orchestration and planning only
- Use agents when context >30k tokens or need specialized tools
- Always use GitHub CLI (gh) for GitHub operations
- Return focused, actionable results from agents