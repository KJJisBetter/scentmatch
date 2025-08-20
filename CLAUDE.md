# ScentMatch Development Guidelines

> **Agent OS Enhanced with Research Protocol**

## Core Principles

### Uncertainty Protocol - CRITICAL

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

### Mandatory Research Protocol - REQUIRED

**BEFORE implementing any unfamiliar patterns:**

```
REQUIRED: Use research agents to verify understanding
NEVER: Assume cached knowledge is current
ALWAYS: Confirm approach with domain experts first

RESEARCH AGENTS:
- AI/ML features → ai-vector-researcher
- Database optimization → supabase-researcher
- UI patterns → shadcn-research-expert
- Design systems → tailwind-researcher
- UX optimization → ux-conversion-researcher
- Framework patterns → nextjs-research-expert

RESEARCH SAVES TO:
- .claude/docs/external/[technology]/ - Research findings
- .claude/docs/internal/solutions/ - Implementation patterns
```

### Date Verification Protocol - REQUIRED

**ALWAYS use date-checker agent to verify current date:**

```
BEFORE any date-dependent operations:
USE: date-checker agent to get accurate current date
NEVER: Assume or guess current date
ALWAYS: Use verified date for file naming, timestamps, and date calculations

REQUIRED FOR:
- Spec folder creation (YYYY-MM-DD format)
- Solution documentation dating
- Linear issue creation
- Any time-sensitive operations
```

### Implementation Protocol

```
FOR COMPLEX FEATURES:
1. MANDATORY: Research with domain agents first
2. Verify cached patterns are current and applicable
3. Implement with browser testing (Playwright MCP)
4. Document working patterns

FOR SIMPLE FIXES:
1. Check cached patterns first
2. Apply direct fixes
3. REQUIRED: Test functionality works in browser
4. Document if novel solution
```

## Agent OS Integration

### Load Context First

- @.agent-os/product/mission.md
- @.agent-os/product/tech-stack.md
- @.agent-os/product/roadmap.md

### Check Cache Before Work

- @.claude/docs/internal/patterns/ (fresh patterns only)
- @.claude/docs/internal/solutions/ (last 7 days only)
- @.claude/handoffs/team-activity.md (current work only)

### CRITICAL: Pattern Verification Rules

```
NEVER TRUST CACHED PATTERNS BLINDLY:
1. Read patterns as GUIDANCE only (not final truth)
2. Investigate current state independently
3. Verify pattern actually applies to current situation
4. Test claimed solution works NOW
5. Only implement if verified

NEVER:
❌ Claim "this is already fixed" based on cached patterns
❌ Apply patterns without current verification
❌ Trust "✅ FIXED" claims from old files
❌ Skip investigation because pattern exists
```

## Documentation Structure

```
.claude/docs/
├── external/           # Research from expert agents
│   ├── ai-research/   # AI/ML patterns and algorithms
│   ├── supabase/      # Database optimization patterns
│   ├── nextjs/        # Framework best practices
│   └── tailwindcss/   # Design system patterns
├── internal/          # Our solutions and patterns
│   ├── solutions/     # Issues solved (YYYY-MM-DD-issue-name.md)
│   └── patterns/      # Reusable code patterns
└── handoffs/          # Team coordination
    └── team-activity.md
```

## Git Workflow

### Branch Rules

```
BEFORE any work:
CHECK current branch
IF main: CREATE feature/[name] and SWITCH
ALWAYS: Create PR for main (never push directly)
```

### Absolute Rules

- **NEVER** push to main directly
- **ALWAYS** create PR for main
- **ALWAYS** work on feature branches

## Code Quality

### File Size Guidelines

```
IF FILE > 100 LINES:
  ANALYZE: Can this be split or simplified?
  PREFER: Multiple focused files over large monolithic ones
```

### Library Policy

```
BEFORE adding external libraries:
1. Check if Next.js/React built-ins handle this
2. ASK USER: "Should I add [library] or build internal solution?"
3. WAIT for explicit approval
```

## File Access

**Hidden Files:** Claude can and should read .env.local, .env files for debugging
**Environment Setup:** When database/API issues occur, check environment variables first
**Don't Hesitate:** Read any file needed for proper debugging and development

**Before Database Operations:**

- Always check environment variables are loaded
- Use `node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"` to verify

## Testing Approach - MANDATORY BROWSER TESTING

**FOR ANY UI WORK:**

- **REQUIRED:** Use Playwright MCP to verify what user sees
- **API testing alone is insufficient** for user-facing features
- **VERIFY:** Complete user journey works in browser

**Testing Tools:**

- Browser testing: Playwright MCP (required for UI)
- API testing: curl, fetch, or direct HTTP requests
- Unit testing: Vitest framework
- Integration testing: Browser + API combined

**Critical Rule:** If users interact with it, test it in browser

**Examples:**

- ✅ `curl http://localhost:3000/api/search?q=dior` for API testing
- ✅ **REQUIRED:** Playwright MCP for any UI changes
- ✅ Vitest for unit/integration tests

## Emergency vs Standard Development

### Emergency Situations

- Production users blocked
- < 24h timeline
- Single obvious bug

**Approach:** Apply cached patterns immediately, skip research if solution is clear

### Standard Development

- New features
- Complex investigations
- Multiple related issues

**Approach:** Use research agents for knowledge gaps, apply Agent OS workflow

## Pattern Management

### Cache Hygiene - AUTOMATIC

```
FRESH PATTERNS (< 7 days):
- .claude/docs/internal/solutions/YYYY-MM-DD-*
- Actively useful for current work

MATURE PATTERNS (7-30 days):
- .claude/docs/internal/patterns/[category].md
- Proven, consolidated solutions

ARCHIVED PATTERNS (> 30 days):
- .claude/docs/archive/YYYY-MM/
- Historical reference only

AUTO-CLEANUP:
- Weekly: Consolidate solutions → patterns
- Monthly: Archive old patterns
```

### Pattern Quality Rules

```
ONLY SAVE patterns that:
✅ Actually solved a real problem
✅ Solution was verified working
✅ Likely to be reused
✅ Not already documented

NEVER SAVE:
❌ Speculative solutions
❌ One-off emergency workarounds
❌ Debugging steps that failed
❌ Duplicates of existing patterns
```

## Team Activity Hygiene - AGGRESSIVE CLEANUP

### Living Documentation Rules

```
CURRENT WORK ONLY:
- Delete completed items after 48 hours
- When file > 30 lines: Auto-archive to dated backup
- Keep only: active tasks, current blockers, immediate context

LIVING REFERENCES:
- Reference current files only (verify they exist)
- Clean up dead references to moved/deleted files
- Never claim something works without current verification

AUTO-CLEANUP TRIGGERS:
- IF > 30 lines: Move old sections to archive
- IF referencing non-existent files: Remove dead references
- IF patterns > 14 days old: Verify or archive
```

## Linear Issue Management

```
STANDARD WORKFLOW:
- Document issues with priority labels (🚨🔥⭐💡🚀)
- 🚨 Launch Critical: Blocks release
- 🔥 Pre-Launch: Should fix before release
- ⭐ Nice-to-Have: Improves experience
- 💡🚀 Post-Launch: Future enhancements

COMPLETION WORKFLOW:
- Update Linear status when issues resolved
- Add verification comments with test evidence
- Create tickets for out-of-scope ideas during work
```

## Task Verification Protocol - MANDATORY

### Task Completion Rules

**NEVER mark tasks complete without verification:**

```
BEFORE checking off ANY task or subtask:
1. VERIFY: Code actually works as intended
2. TEST: Functionality in browser (if UI-related)
3. CONFIRM: No errors or console warnings
4. VALIDATE: Meets acceptance criteria

VERIFICATION METHODS:
- Browser testing (Playwright MCP for UI)
- API endpoint testing (curl/fetch)
- Manual verification in development server
- Unit/integration test passes

ABSOLUTE RULE:
❌ NO BLIND CHECKOFFS - Must test and confirm working
✅ Only check off after successful verification
```

### Task Status Protocol

```
SMART GROUPED COMPLETION:
1. Mark parent task as "in_progress" when starting
2. Implement ALL related subtasks together as a family
3. Test the complete feature end-to-end (not piece by piece)
4. ONLY THEN: Check off all subtasks together once verified working
5. Document any issues or edge cases found

EXAMPLE - GOOD:
- ✅ Task 1: Authentication System - VERIFIED complete flow in browser
  - ✅ 1.1: Login form - Part of working auth system
  - ✅ 1.2: Session handling - Part of working auth system  
  - ✅ 1.3: Protected routes - Part of working auth system
  - ✅ 1.4: Logout flow - Part of working auth system

EXAMPLE - BAD (inefficient):
❌ Checking off subtasks one by one without testing full feature
❌ Testing login form alone without session/logout integration
❌ Fragmenting related functionality verification
```

## Critical Reminders

1. **Uncertainty = STOP**: Never proceed when unsure
2. **Research Required**: Use expert agents before complex work
3. **Browser Test Everything**: UI changes must be verified visually
4. **Team Activity = Current Only**: Archive old completed work
5. **Verify Before Claiming**: Test that fixes actually work NOW
6. **Main is Sacred**: Never push directly, always PR
7. **NO BLIND CHECKOFFS**: Every task must be tested and verified before completion

---

Remember: Research first, test in browser, keep documentation current.
