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

## Technology Research Protocol - CRITICAL

WHEN USING ANY TECHNOLOGY:

```
MANDATORY RESEARCH BEFORE IMPLEMENTATION:
1. RESEARCH STABLE VERSIONS:
   - Always check current stable/LTS versions
   - Avoid beta, alpha, or experimental versions
   - Example: PostCSS v4 is NOT stable yet - use v3.4.0

2. VERIFY COMPATIBILITY:
   - Check framework compatibility matrices
   - Research known issues with current setup
   - Validate dependencies work together

3. RESEARCH PROPER IMPLEMENTATION:
   - Find official documentation
   - Look for best practices guides
   - Check community recommendations
   - Review recent issues/problems

4. CACHE FINDINGS:
   - Save version compatibility research
   - Document recommended configurations
   - Note breaking changes and migrations

EXAMPLES OF PROPER RESEARCH:
✅ "Research TailwindCSS stable version for Next.js 15"
✅ "Find PostCSS v3 configuration for production builds"
✅ "Verify Supabase client compatibility with React 19"

❌ Using latest/experimental versions without research
❌ Assuming new versions are production-ready
❌ Skipping compatibility verification
```

## Agent Role Boundaries - ABSOLUTE

ROLE VIOLATIONS = IMMEDIATE STOP and redirect to correct agent:

### UX/UI Designer - DESIGN SPECIFICATIONS ONLY:
- ✅ DO: Design specs, wireframes, UX research, design documentation
- ❌ DON'T: Write code, edit files, implement designs, run commands

### Senior Reviewer - CODE REVIEW ONLY:  
- ✅ DO: Review code, analyze quality, recommend improvements, create review reports
- ❌ DON'T: Implement fixes, modify files, run commands, "coordinate implementation"

### QA Testing Specialist - TEST SPECIFICATIONS ONLY:
- ✅ DO: Create test specifications, design test approaches, manual testing with browser tools
- ❌ DON'T: Implement test code, modify application code, create functional tests

### Engineers (Backend/Frontend/Data/DevOps) - IMPLEMENTATION ONLY:
- ✅ DO: Implement code, implement QA test specifications, build features, run commands
- ❌ DON'T: Create test specifications, design tests, create requirements, design UI

### Product Manager/System Architect - RESEARCH & SPECIFICATIONS ONLY:
- ✅ DO: Research, create specifications, define requirements, architecture documentation
- ❌ DON'T: Implement code, modify files, run implementation commands

## Task Delegation Protocol - MANDATORY

BEFORE delegating ANY task:

1. **IDENTIFY WORK TYPE:**
   - Design work → UX/UI Designer
   - Code implementation → Appropriate Engineer  
   - Test spec creation → QA Testing Specialist
   - Test implementation → Engineers (per QA specs)
   - Code review → Senior Reviewer
   - Requirements/Architecture → Product Manager/System Architect

2. **SINGLE-ROLE PROMPTS ONLY:**
   ```
   ❌ WRONG: "UX designer: Create and implement login page"
   ✅ RIGHT: "UX designer: Create design specifications for login page"
   ✅ RIGHT: "Frontend engineer: Implement login page per UX specifications"
   
   ❌ WRONG: "Senior reviewer: Review and fix the authentication system"
   ✅ RIGHT: "Senior reviewer: Review authentication system and recommend improvements"
   ✅ RIGHT: "Backend engineer: Implement fixes per reviewer recommendations"
   
   ❌ WRONG: "Backend engineer: Create tests for the API endpoints"
   ✅ RIGHT: "QA tester: Create test specifications for API endpoints"
   ✅ RIGHT: "Backend engineer: Implement tests per QA specifications"
   ```

3. **VERIFY TOOL ALIGNMENT:**
   - Agent must have appropriate tools for requested work
   - No agent should be asked to work without proper tools
   - No agent should have tools that enable role violations

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

## Integration Testing Protocol - CRITICAL

AFTER each major system implementation:

```
MANDATORY INTEGRATION CHECKPOINTS:
1. BUILD VALIDATION: npm run build (must succeed without errors)
2. ENVIRONMENT VERIFICATION: Test real environment variables load correctly
3. FUNCTIONAL INTEGRATION: Test actual user flows work end-to-end
4. PERFORMANCE VALIDATION: Verify integration doesn't break performance targets
5. DOCUMENTATION: Record integration issues and solutions found

INTEGRATION CHECKPOINTS BY TASK:
- After Task 2 (Database setup) → Test database queries execute
- After Task 3 (Schema) → Test schema + data operations work
- After Task 5 (Auth) → Test auth + database + RLS integration  
- After Task 7 (Pages) → Test complete user journey flows
- After every major system → Test with all previous systems

INTEGRATION FAILURE = STOP and fix before proceeding to next major system.

NEVER proceed to next major system without integration validation.
```

## Task Completion Criteria - VERIFICATION-BASED

TASK IS ONLY COMPLETE WHEN:

```
✅ Core functionality implemented AND verified working in real environment
✅ Integration tested with existing systems (build, dev server, user flow)
✅ Build succeeds without errors (npm run build)
✅ Real user flow validated (not just unit tests or implementation)
✅ Environment configuration verified (real env vars, no test mocks)
✅ No role boundary violations occurred during implementation
✅ All agent deliverables properly handed off to next agent

VERIFICATION REQUIRED:
- Test the actual feature works end-to-end
- Verify it integrates with existing systems without breaking them
- Confirm build and dev server start successfully
- Check environment variables load correctly in all contexts
- Validate complete user workflow (not just individual components)

IMPLEMENTATION ≠ COMPLETION
A task is NOT complete just because code was written.
```

## Prompt Discipline Protocol - MANDATORY

BEFORE sending ANY agent prompt, I MUST:

```
1. VERIFY ROLE ALIGNMENT:
   - Is this work within agent's core role?
   - Do they have appropriate tools for this work?
   - Am I asking for single-role work only?

2. LANGUAGE DISCIPLINE:
   - UX Designer: "Create design specifications for..."
   - Engineers: "Implement per [agent] specifications..."
   - Senior Reviewer: "Review and recommend improvements for..."
   - QA Tester: "Create test specifications for..."
   - Product Manager: "Research and define requirements for..."

3. MULTI-ROLE TASK BREAKDOWN:
   - Break complex tasks into single-role subtasks
   - Route each subtask to appropriate agent type
   - Maintain proper sequencing (specs before implementation)
   - Never ask single agent to do multi-role work

4. ROLE VIOLATION PREVENTION:
   - Never use "implement" with design roles
   - Never use "fix" with review roles  
   - Never use "create tests" with engineer roles
   - Never use "coordinate implementation" with any role

ROLE VIOLATION = IMMEDIATE PROMPT CORRECTION and task redelegation
```

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

## Critical Reminders - TOP PRIORITIES

1. **AGENT ROLE BOUNDARIES**: Never ask agents to work outside their role (UX designs, Engineers implement, QA creates test specs, Reviewers review only)
2. **VERIFICATION-BASED COMPLETION**: Tasks are complete only when verified working in real environment, not just implemented
3. **INTEGRATION TESTING**: After each major system, test integration with existing systems before proceeding
4. **PROMPT DISCIPLINE**: Use single-role prompts only, break multi-role tasks into proper subtasks
5. **RESEARCH FIRST**: Technology research mandatory before implementation (stable versions only)
6. **UNCERTAINTY = STOP**: Never proceed when unsure, always ask
7. **BUILD VALIDATION**: npm run build must succeed after any configuration change
8. **REAL DATA ONLY**: Use provided JSON data sources, never generate synthetic data

## Project-Specific Configuration

**Tech Stack**: [Your stack from .agent-os/product/tech-stack.md]
**Standards**: [Your standards from .agent-os/product/]
**Current Sprint**: [Check .agent-os/product/roadmap.md]


---

**REMEMBER**: 
1. **Agent roles are absolute** - never ask agents to work outside their boundaries
2. **Verification-based completion** - tasks complete only when verified working
3. **Integration testing is mandatory** - after each major system  
4. **When uncertain, STOP and ASK** - no fake confidence
5. **Always PR to main** - never push directly
