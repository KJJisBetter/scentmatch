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
- **nextjs-specialist**: Complete Next.js features (pages, components, Server Actions)
- **database-specialist**: All Supabase operations (queries, migrations, RLS)
- **component-specialist**: UI implementation with shadcn/ui patterns
- **api-specialist**: Complex search/AI endpoints requiring optimization
- **ai-vector-researcher**: AI architecture decisions only

## Code Standards
- Files under 200 lines
- shadcn/ui components only (no custom)
- @supabase/ssr pattern throughout
- React Hook Form + Zod for forms
- Browser testing required for UI work

## Performance Rules
- Delegate feature building to avoid main context hangs
- Keep main Claude for orchestration only
- Use agents when context window shows performance warning
- Return focused, actionable results from agents