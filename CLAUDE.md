# ScentMatch Development Guidelines

> **Agent OS Enhanced with Research-Only Workflow**

## Core Development Principles

### Research-First Protocol
```
BEFORE implementing any feature:
1. Identify knowledge gaps (database, framework, UX, AI, etc.)
2. Task relevant expert agents for research plans
3. Expert saves research to .claude/docs/external/[technology]/
4. Read all research before implementing
5. Implement while maintaining full integration context
```

### Available Research Experts
- **Database experts** - Authentication patterns, optimization, security policies
- **Framework experts** - Performance, routing, SSR strategies  
- **Design experts** - UI patterns, responsive design, accessibility
- **Component experts** - Component patterns, composition strategies
- **AI/ML experts** - Embeddings, similarity search, recommendations
- **UX experts** - User psychology, conversion optimization

### Context Management
```
Simple file-based research cache:
- .claude/docs/external/[technology]/ - Research findings from experts
- .claude/docs/internal/solutions/ - Implementation patterns and fixes
- Agent OS handles all planning and specifications
```

## Core Development Rules

### Technology Research Protocol
```
MANDATORY RESEARCH BEFORE IMPLEMENTATION:
1. Research stable versions (avoid beta/experimental)
2. Verify compatibility with existing stack
3. Find official documentation and best practices
4. Cache findings for future reference

Examples:
✅ Research TailwindCSS stable version for framework compatibility
✅ Verify database client compatibility with current setup
❌ Using latest/experimental versions without research
```

### Component Reliability Patterns (Phase 1 Discovery)
```
RELIABLE COMPONENT IMPORT STRATEGY:
✅ Direct imports: import { Button } from '@/components/ui/button'
✅ Explicit file paths when barrel exports fail
✅ Test component exports work in browser context
❌ Complex barrel exports: import { Button } from '@/components'
❌ Assuming TypeScript success = runtime success

ERROR HANDLING REQUIREMENTS:
Every user-facing component MUST have:
1. Loading states (skeleton, spinner, or placeholder)
2. Error boundaries with professional messaging
3. Fallback content when data unavailable
4. Graceful degradation (partial functionality vs complete failure)
5. User-friendly error messages (never expose technical details)

EXAMPLES OF GOOD ERROR HANDLING:
✅ "Something went wrong. Please try again." + retry button
✅ "Search temporarily unavailable" + fallback to cached results
✅ Professional loading skeletons while data loads
❌ Raw error messages: "Server Action not found"
❌ White screen of death with stack traces
❌ Infinite loading states that never resolve

NEXT.JS SPECIFIC LEARNINGS:
✅ Test server/client component boundaries in actual browser
✅ Verify useState/useEffect only in 'use client' components
✅ Test Server Actions work in production-like environment
❌ Trust build success for server/client component validation
```

### Uncertainty Protocol
```
When uncertain about ANYTHING:
STOP immediately
STATE: "I'm uncertain about [specific thing]"
ASK: "Should I [option A] or [option B]?"
WAIT for response

NEVER: Guess, pretend to know, show fake confidence
```

### Technical Debt Prevention (Phase 1 Learnings)
```
COMPONENT IMPORT STRATEGY:
✅ Use direct imports: import { Button } from '@/components/ui/button'
❌ Avoid complex barrel exports: import { Button } from '@/components'
REASONING: Barrel exports can hide circular dependencies and cause runtime failures

SERVER/CLIENT COMPONENT BOUNDARIES:
✅ Explicitly test server components don't use client hooks
✅ Verify client components properly marked with 'use client'
✅ Test actual rendering in browser, not just build
❌ Don't assume TypeScript compilation catches all server/client issues

QUALITY GATES FOR EXTERNAL DEMOS:
Before showing to partners/affiliates/stakeholders:
1. BROWSER WALKTHROUGH: Manually test every critical user flow
2. ERROR STATE VERIFICATION: Test what happens when things break
3. PROFESSIONAL APPEARANCE: Zero tolerance for dev errors, console warnings
4. PERFORMANCE VALIDATION: Ensure fast loading across all pages
5. MOBILE TESTING: Verify responsive design actually works on devices

RUNTIME VALIDATION CHECKLIST:
□ Homepage loads without errors or warnings
□ Authentication (login/signup) actually works in browser  
□ Main feature flows work end-to-end (quiz, browse, recommendations)
□ API endpoints return expected data (test with curl/browser dev tools)
□ Error states show professional messaging, not technical errors
□ Mobile navigation and responsive design work on actual devices
```

### Integration Testing Protocol
```
AFTER each major system implementation:
1. BUILD VALIDATION: npm run build (must succeed)
2. FUNCTIONAL INTEGRATION: Test actual user flows work
3. PERFORMANCE VALIDATION: Verify targets still met
4. DOCUMENTATION: Record integration patterns

INTEGRATION CHECKPOINTS:
- After database changes → Test queries work
- After auth changes → Test login flows work  
- After UI changes → Test complete user journey
```

### End-to-End Validation Requirements (Critical Learning)
```
DISCOVERED: Build success + unit tests ≠ working application
SOLUTION: Mandatory browser testing for task completion

PLAYWRIGHT/E2E TESTING REQUIRED FOR:
- Authentication flows (login, signup, password reset)
- Core user journeys (homepage → quiz → recommendations)
- Browse/search functionality with real data
- Mobile responsive behavior on actual devices
- Error state handling and recovery flows

E2E TESTING PROTOCOL:
1. AUTOMATED WALKTHROUGH: Use Playwright for consistent testing
2. MANUAL VERIFICATION: Human walkthrough of critical paths
3. CROSS-DEVICE TESTING: Mobile, tablet, desktop verification
4. ERROR INJECTION: Test failure scenarios and recovery
5. PERFORMANCE MEASUREMENT: Real-world loading and interaction times

TASK NOT COMPLETE UNTIL:
✅ Browser automation testing passes for critical flows
✅ Manual walkthrough confirms professional user experience  
✅ Error states handled gracefully (no raw error messages)
✅ Mobile experience works on actual devices
✅ All API endpoints return expected data in browser context
```

### Task Completion & Git Integration Workflow
```
IMPLEMENT → VERIFY → COMMIT WORKFLOW:

1. IMPLEMENT: Write the code/feature
2. VERIFY: Test it actually works (build + integration + user flow)
3. IF WORKING: Mark complete → git add → git commit → git push
4. IF NOT WORKING: Continue working until it's fully functional

NO GIT OPERATIONS UNTIL VERIFIED WORKING:
- Don't commit broken code
- Don't push unverified implementations  
- Only mark complete when actually working

TASK IS COMPLETE ONLY WHEN:
✅ Core functionality implemented AND verified working
✅ Integration tested with existing systems
✅ Build succeeds without errors
✅ Real user flow validated
✅ Environment configuration verified
✅ Git operations successful (committed and pushed)

IMPLEMENTATION ≠ COMPLETION
Only commit and mark complete when it actually works
```

### Critical Validation Protocol (Learned from Phase 1)
```
BUILD SUCCESS ≠ WORKING APPLICATION
Discovered critical gap: npm run build can succeed while core features completely fail at runtime

MANDATORY RUNTIME VERIFICATION:
1. BROWSER TESTING: Use Playwright/manual testing for key user flows
2. API ENDPOINT TESTING: Verify actual HTTP requests work (curl/fetch testing)
3. AUTHENTICATION FLOW: Test actual login/signup works in browser
4. COMPONENT RENDERING: Verify components actually render without errors
5. ERROR STATE TESTING: Verify graceful handling of failures

COMPONENT ARCHITECTURE LESSONS:
✅ Direct imports more reliable than barrel exports for UI components
✅ Server/client component boundaries must be explicitly tested
✅ Every user-facing component needs graceful error handling
❌ Complex re-export patterns can break even when TypeScript passes
❌ Assuming build success means working functionality

AFFILIATE/PARTNER QUALITY STANDARD:
When building for external partners (affiliates, integrations, demos):
- Zero tolerance for application error pages
- Professional error handling (no raw error messages)
- All core user flows must work flawlessly
- Performance AND functionality both required
```

## Agent OS Integration

### Use Agent OS for Planning
- `/plan-product` - Product initialization
- `/create-spec` - Feature specifications  
- `/execute-tasks` - Task management
- `/analyze-product` - Product analysis

### Research Agents Complement Agent OS
- Agent OS creates specs and tasks
- Research agents provide implementation strategies
- I implement while maintaining integration context

## File Management Rules

### File Size Limits
```
IF FILE > 100 LINES:
STOP and ANALYZE:
1. Can this be REDUCED? (Remove unnecessary code, simplify logic)
2. Can this be REFACTORED? (Extract reusable functions, simplify structure)
3. Can this be SPLIT? (Separate concerns, create focused modules)

THEN ASK: "This file is getting large. Should I [specific approach based on analysis]?"

SPLITTING STRATEGIES:
- Extract types, constants, utilities to separate files
- Split complex functions into focused modules
- Create composition patterns instead of monolithic components
- Separate concerns (data, UI, logic into different files)

TYPES ORGANIZATION:
- Split large type files by domain (auth.ts, fragrances.ts, collections.ts)
- Use index.ts to re-export all types
- Group related interfaces together
- Keep database.ts focused on core Database interface only
```

### Library Usage Policy
```
BEFORE adding external libraries:
1. Check if framework built-ins handle this
2. Check if we can build internally
3. ASK USER: "Should I add [library] or build internal solution?"
4. WAIT for explicit approval

PREFER: Framework built-ins → Internal solutions → External libraries
```

## Data Usage Requirements

### Use Real Data Only
```
✅ USE provided JSON data sources
❌ NEVER generate synthetic/fake data
✅ Preserve all real metadata (ratings, URLs, brand names)
✅ Import using proper validation schemas
```

## Git Workflow

### Branch Management
```
BEFORE any work:
CHECK current branch
IF main: CREATE feature/[name] and SWITCH
ALWAYS: Create PR for main (never push directly)

BRANCH STRATEGY BY SPEC SIZE:
IF SPEC HAS > 2 MAJOR INDEPENDENT SYSTEMS:
SPLIT into logical dependency order:
1. Infrastructure/Database → merge → verify
2. Core features → merge → verify  
3. UI/Experience → merge → verify

IF SPEC IS SIMPLE SINGLE SYSTEM:
One branch is fine

REASONING: Easier debugging, earlier integration testing, reviewable PRs, risk reduction
```

---

**REMEMBER**: 
1. **Research first** - use expert agents for knowledge gaps
2. **When uncertain, STOP and ASK** - no fake confidence  
3. **Integration testing mandatory** - after each major system
4. **Verification-based completion** - test it actually works
5. **Always PR to main** - never push directly