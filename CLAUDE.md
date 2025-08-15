# PROJECT_NAME

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

### Troubleshooting "Browser is already in use" Error

**Error:** `Browser is already in use for ~/.cache/ms-playwright/mcp-chrome, use --isolated to run multiple instances`

**Root Cause:** Multiple MCP server processes running simultaneously, causing browser profile conflicts.

**Immediate Solutions:**

1. **Check running processes:** `ps aux | grep -E '(chrome|chromium|playwright)' | grep -v grep`
2. **Kill stale processes manually:**
   ```bash
   # Find process IDs
   ps aux | grep playwright | grep -v grep
   # Kill them (replace PIDs with actual ones)
   kill [PID1] [PID2] [PID3]
   ```
3. **Clear browser cache:** `rm -rf ~/.cache/ms-playwright/mcp-chrome*` (if safe to do)
4. **Restart Claude Code** to reset MCP connections

**Prevention:**

- Only one Claude Code instance should use Playwright MCP at a time
- Always close browser properly with `mcp__playwright__browser_close`
- Monitor for zombie MCP processes after sessions

**Fallback Method (if MCP unavailable):**
If MCP tools aren't working, use Node.js script:

```javascript
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3001');
  await page.screenshot({ path: 'screenshot.png', fullPage: true });
  await browser.close();
})();
```

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

## Strict Development Phases

### Phase 0: Branch Setup (Always First)

```
CHECK git status
IF on main:
  CREATE feature/[spec-name]
  SWITCH to feature branch
ELSE:
  ASK: "Currently on [branch]. Create new branch from main or continue here?"
  HANDLE based on response
```

### Phase 1: Planning Only (No Code Yet)

```
IF user requests feature:
  IF uncertain about requirements:
    ASK clarifying questions
    WAIT for answers

  SEQUENCED PLANNERS (with explicit gates):
  1) @Task: product-manager - "Produce PRD v1 (problem, users, scope, success metrics, risks)"
     GATE: PRD v1 ready
     NOTE: system-architect may run a 30–60 min feasibility spike in parallel ONLY to flag blockers; no code.

  2) @Task: qa-tester - "Define acceptance criteria (Given/When/Then), test plan stub, mobile CWV/a11y thresholds, test data needs"
     GATE: Definition of Ready = PRD + acceptance criteria

  3) @Task: ui-ux-designer - "Design UX brief, user flows, mobile-first wireframes, component spec (Radix/shadcn + Tailwind), content/states, a11y checklist"
     GATE: Wireframes cover acceptance criteria

  4) @Task: system-architect - "Confirm feasibility, data model, integrations, and non-functional budgets (perf/security); outline migration/rollback"
     GATE: Feasibility + NFRs align with UX and acceptance criteria

  COMPILE plan from .claude/handoffs/team-activity.md
  PRESENT comprehensive plan

  ASK: "Does this plan look good?"
  WAIT for approval
  STOP until approved
```

#### Definitions

- Definition of Ready (DoR): PRD v1 + acceptance criteria + test plan stub present.
- Definition of Done (DoD): All tests pass (unit/integration/e2e), mobile CWV targets met (LCP < 2.5s, INP < 200ms, CLS < 0.1), basic a11y checks pass (WCAG 2.2 AA), QA sign-off.

### Phase 2: Implementation (After Approval Only)

```
ONLY after explicit approval:

CHECK .claude/docs/internal/solutions/ for similar implementations
IF found:
  APPLY cached patterns

PARALLEL LAUNCH (coders only):
@Task: frontend-specialist - "Build UI components"
@Task: backend-specialist - "Create API endpoints"
@Task: database-specialist - "Set up data layer"

COORDINATE through .claude/handoffs/team-activity.md
KEEP CONCISE: Use bullet points, not paragraphs
LIMIT: Maximum 5 lines per task update

IF any coder uncertain:
  STOP that agent
  ESCALATE uncertainty to user
  WAIT for clarification
```

### Phase 3: Quality Gates (Sequential - Must Pass)

```
RUN in strict order:

1. @Task: qa-tester - "Test all functionality"
   MUST include: mobile CWV thresholds and a11y smoke checks for core flows
   IF tests fail:
     STOP
     REPORT failures
     ASK: "Should I fix these test failures?"

2. @Task: security-specialist - "Security audit"
   IF vulnerabilities found:
     STOP
     REPORT security issues
     ASK: "How should I address these security concerns?"

3. @Task: quality-guardian - "Final harsh review"
   IF quality issues:
     STOP
     REPORT issues
     ASK: "Should I refactor to address these?"

ALL must pass before proceeding
```

### Phase 4: Deployment Decision (Always PR)

```
AFTER all quality gates pass:

STATE: "All checks passed. Creating PR for your review."

@Task: git-workflow - "Create PR from [branch] to main with:
  - Comprehensive description
  - Test results
  - Security check results
  - Quality review notes"

PROVIDE: PR link
STATE: "Please review and merge in GitHub when ready."

IF user says "push to main directly":
  RESPOND: "For safety, I've created a PR instead. You can merge it in GitHub."
  STILL create PR
```

## Team Activity Log Management

### Size Limits - STRICT

```
.claude/handoffs/team-activity.md:
  MAXIMUM: 100 lines total
  PER TASK: 5 lines max
  FORMAT: Bullet points only

  IF file > 100 lines:
    CONDENSE immediately:
    - Remove code blocks
    - Convert paragraphs to bullets
    - Archive old completed tasks
    - Keep only active/recent items
```

### Writing Rules

```
NEVER write in team-activity.md:
- Code blocks or examples
- Technical architecture details
- Long explanations or paragraphs
- Duplicate information

ALWAYS write:
- Brief bullet points (< 1 line each)
- Status markers (✅ ⚠️ ❌)
- File paths created/modified
- One-line summaries
```

## Cache Management Enhancement

### Before Agent OS Commands

```
When user types /create-spec [name]:
  CHECK .claude/docs/internal/patterns/[similar-specs]
  IF found:
    LOAD patterns into context
    Let Agent OS proceed with enhanced context
```

### After Agent OS Commands

```
When Agent OS completes any command:
  EXTRACT new patterns discovered
  SAVE to .claude/docs/internal/patterns/
  UPDATE .claude/metrics/performance.md
```

## Tracking and Metrics

### After Each Session

```
UPDATE .claude/metrics/performance.md:
- Command execution times
- Cache hit rates
- Patterns reused
- Uncertainty points encountered
```

### Pattern Library Growth

```
SAVE successful patterns to:
.claude/docs/internal/patterns/[feature-type].md
```

## Code Quality Standards - MANDATORY

### File Size Limits - STRICT

```
IF FILE IS GETTING BIGGER THAN 100 LINES:
  ASK: "How can I divide this?"

RULES:
- ANY BIG FUNCTION, TYPE, OR WHATEVER SHOULD HAVE THEIR OWN FILE
- FILES SHOULD NOT EXCEED 100 LINES
- Split complex components into smaller, focused files
- Extract types, constants, and utilities to separate files
- Prefer composition over large monolithic components
```

### Library Usage Policy - STRICT

```
AVOID EXTERNAL LIBRARIES - USE NEXT.JS FIRST

BEFORE adding ANY external library:
  1. CHECK: Can Next.js built-ins handle this?
  2. CHECK: Can we build this internally?
  3. CHECK: Can React built-ins handle this?
  4. MANDATORY: ASK USER: "Should I add [library] or build internal solution?"
  5. WAIT for explicit approval before adding

ABSOLUTE RULES:
- NEVER add external libraries without asking first
- ALWAYS prefer Next.js built-in solutions
- BUILD internal solutions when possible
- ASK PERMISSION for every npm install

NEXT.JS HAS BUILT-IN:
- Image optimization (next/image)
- Font optimization (next/font)
- API routes and server actions
- Routing and navigation
- Form handling and validation
- State management (React built-ins)
- CSS and styling (TailwindCSS)
```

### Examples:

- ✅ Next.js Image optimization (built-in)
- ❌ Installing image optimization library without asking
- ✅ React useState/useEffect (built-in)
- ❌ Installing state management library without asking
- ✅ Custom hooks and utilities (internal)
- ❌ Installing utility library without asking

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

## Project-Specific Configuration

**Tech Stack**: [Your stack from .agent-os/product/tech-stack.md]
**Standards**: [Your standards from .agent-os/product/]
**Current Sprint**: [Check .agent-os/product/roadmap.md]

---

Remember: Check date first, then when uncertain, STOP and ASK. No fake confidence. Always PR to main.
