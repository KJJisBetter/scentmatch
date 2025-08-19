# ScentMatch Development Guidelines

> **Agent OS Enhanced with Production Workflow**

## Date Check Protocol - MANDATORY FIRST STEP

BEFORE starting ANY work session:

```
ALWAYS check current date first:
- Use date-checker agent if available
- Confirm actual date before creating files/folders
- Ensure timestamps are accurate in reports
- Never assume or guess the current date
```

Examples:

- ❌ Creating "2025-08-13-bug-report.md" on wrong date
- ✅ "@agent:date-checker" → confirm → create with correct date

## Uncertainty Protocol - CRITICAL

When uncertain about ANYTHING:

```
STOP immediately
STATE: "I'm uncertain about [specific thing]"
ASK: "Should I [option A] or [option B]?"
WAIT for response

NEVER:
- Guess and hope
- Write code you're unsure about
- Pretend to know
- Make assumptions
- Show fake confidence
```

Examples:

- ❌ "Implementing auth..." [while unsure]
- ✅ "I'm unsure which auth pattern you prefer. JWT or sessions?"

## Research Protocol - MANDATORY

When ANY issue, error, or unfamiliar pattern is found:

```
BEFORE coding any "solution":
1. INVESTIGATE thoroughly:
   - Check console logs for exact error messages
   - Take screenshots of error states with Playwright
   - Capture network tab for failed requests
   - Document error context (what user was doing)

2. RESEARCH with MCP servers:
   - mcp__firecrawl__firecrawl_search for web research
   - mcp__Ref__ref_search_documentation for technical docs
   - mcp__exa__web_search_exa for current solutions

2. CACHE external research:
   - SAVE to .claude/docs/external/[source-name]/[topic].md
   - Include: URL, date cached, key findings, relevance

3. DOCUMENT solution:
   - Issue: Exact problem description
   - Research: What you found from MCP servers
   - Solution: Chosen approach with rationale
   - Result: What actually worked

4. SAVE to .claude/docs/internal/solutions/[date]-[issue-name].md

NEVER skip research when encountering:
- Unfamiliar error messages
- Library/framework issues
- Performance problems
- Accessibility violations
- Build/compilation errors

## Issue Documentation Protocol - MANDATORY

For EVERY issue encountered during development:
```

1. DOCUMENT the issue immediately:
   - Create .claude/docs/internal/solutions/[date]-[issue-name].md
   - Include: exact error message, context, attempted solutions
2. RESEARCH before fixing:
   - Use MCP servers to find established solutions
   - Document research findings and sources
3. IMPLEMENT solution:
   - Document chosen approach and rationale
   - Include code examples and patterns
4. VALIDATE result:
   - Test thoroughly and document outcomes
   - Note any side effects or limitations

PURPOSE: Build knowledge base for future issues, prevent repeated mistakes

```

Examples:
- ❌ Fix error and move on [no documentation]
- ✅ Document issue → Research → Implement → Validate → Save pattern
```

## Documentation Structure - MANDATORY

```
.claude/docs/
├── external/           # CACHE - External research from MCP servers
│   ├── next-js/       # Next.js documentation and solutions
│   ├── react/         # React patterns and solutions
│   ├── tailwind/      # TailwindCSS research
│   ├── accessibility/ # WCAG and a11y research
│   └── libraries/     # Third-party library documentation
├── internal/          # LEARNED - Our pain points, solutions, patterns
│   ├── solutions/     # Issues we solved (YYYY-MM-DD-issue-name.md)
│   ├── patterns/      # Reusable code patterns we developed
│   └── architecture/ # System design decisions we made
└── docs/              # REPO - Public documentation for the repository
    ├── api/           # API documentation for developers
    ├── components/    # Component usage guides
    ├── deployment/    # Deployment and setup guides
    └── troubleshooting/ # User-facing help documentation
```

Examples:

- ❌ "I'll fix the useState error..." [without researching]
- ✅ "I found a useState error. Let me research Next.js client component patterns first."

## Testing Protocol - PLAYWRIGHT MCP ONLY

When testing pages or checking if server is running:

```
NEVER use curl, wget, or similar tools
ALWAYS use Playwright MCP for page testing:
- Use mcp__playwright__* tools for all browser testing
- Take screenshots to see actual state
- Capture console errors for debugging
- Never use npx playwright or local playwright scripts
```

**IMPORTANT:** When user mentions "playwright" they ALWAYS mean Playwright MCP tools (mcp**playwright**\*), not local/CLI playwright.

Examples:

- ❌ `curl -I http://localhost:3000`
- ❌ `npx playwright test`
- ✅ Use mcp**playwright**browser_navigate and mcp**playwright**browser_snapshot

## Git Branch Protocol - NO EXCEPTIONS

### Branch Creation Rules

```
BEFORE any work:
CHECK current branch
IF main:
  CREATE feature/[descriptive-name]
  SWITCH to new branch
ELSE:
  ASK: "Create branch from main or current [branch-name]?"
  WAIT for answer
  CREATE based on response
```

### Absolute Rules

- **NEVER** push to main directly (even if user asks)
- **NEVER** delete branches (preserve history)
- **ALWAYS** create PR for main
- **ALWAYS** work on feature branches

### Branch Naming (Solo Dev Friendly)

- `feature/` - Planned features
- `fix/` - Bug fixes
- `wip/` - Work in progress
- `try/` - Experiments
- `done/` - Merged but preserved

## Agent OS Integration

### Load Context First

- @.agent-os/product/mission.md
- @.agent-os/product/tech-stack.md
- @.agent-os/product/roadmap.md
- @~/.agent-os/instructions/create-spec.md
- @~/.agent-os/instructions/execute-tasks.md

### Check Cache Before Work

- @.claude/docs/internal/patterns/
- @.claude/docs/internal/solutions/
- @.claude/handoffs/team-activity.md (keep under 100 lines)

## Critical Reminders

1. **Check Date First**: Always verify date before starting work
2. **Uncertainty = STOP**: Never proceed when unsure
3. **Main is Sacred**: Never push directly, always PR
4. **Phases are Strict**: Planning → Approval → Coding → Quality → PR
5. **Cache First**: Always check for existing solutions
6. **Preserve History**: Never delete branches
7. **File Size Limit**: 100 lines maximum per file
8. **Library Approval**: Ask before adding external dependencies
9. **Investigate First**: Console logs + screenshots before fixing
10. **Next.js First**: Use built-ins before external libraries

---

Remember: Check date first, then when uncertain, STOP and ASK. No fake confidence. Always PR to main.
