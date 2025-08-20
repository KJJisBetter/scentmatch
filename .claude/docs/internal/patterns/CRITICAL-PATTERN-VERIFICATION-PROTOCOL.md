# CRITICAL: Pattern Verification Protocol

## THE CORE PROBLEM

**BAD PATTERN CYCLE:**
1. Claude saves "solution" claiming "✅ FIXED"
2. User reports same issue later  
3. Claude reads cached pattern: "This should already be fixed"
4. But it's NOT actually fixed
5. User has to debug from scratch = DOUBLE WORK

**REAL EXAMPLE TODAY:**
- `2025-08-19-search-api-undefined-brand-fix.md` claimed "✅ FIXED"
- User reported exact same search issue today
- Pattern was incomplete/wrong but Claude trusted it
- Had to investigate and fix again

## NEW VERIFICATION PROTOCOL - MANDATORY

### Rule 1: NEVER TRUST CACHED PATTERNS BLINDLY

```
BEFORE applying ANY cached pattern:
1. READ the pattern as GUIDANCE only
2. INVESTIGATE current state independently  
3. VERIFY the pattern actually applies to current situation
4. TEST the claimed solution actually works NOW
5. ONLY THEN implement if verified

NEVER:
❌ Read pattern and claim "this is already fixed"
❌ Apply patterns without current verification
❌ Trust "✅ FIXED" claims from old files
❌ Skip investigation because pattern exists
```

### Rule 2: STRICT PATTERN SAVING CRITERIA

```
ONLY SAVE patterns that are:
✅ VERIFIED working in production/live environment
✅ TESTED by actual user workflow (not just build success)
✅ REPRODUCIBLE by following documented steps
✅ FRESH (< 7 days old when saved)

NEVER SAVE:
❌ Emergency workarounds (temporary fixes)
❌ Speculative solutions (not tested)
❌ "It should work" patterns (not verified)
❌ Build-only validations (not user-tested)
❌ Incomplete solutions (partial fixes)
```

### Rule 3: PATTERN VERIFICATION REQUIREMENTS

```
EVERY pattern MUST include:
✅ EXACT verification steps to test if still working
✅ SPECIFIC environment/context where it was tested
✅ FAILURE INDICATORS - how to tell if pattern doesn't work
✅ FRESHNESS DATE - when last verified working
✅ DEPRECATION CONDITIONS - when pattern should be retired

PATTERN TEMPLATE:
## Problem
[Exact issue description]

## Solution  
[What actually worked]

## Verification Steps
1. [Step to test if solution works]
2. [Step to verify in live environment]
3. [Expected result if working]

## Failure Indicators
- [How to tell if this pattern is broken]
- [Signs the solution no longer works]

## Context
- Date verified: [YYYY-MM-DD]
- Environment: [dev/staging/production]
- Tech versions: [Next.js X.X, etc.]

## Deprecation Triggers
- [Conditions that would make this pattern invalid]
```

## IMMEDIATE CLEANUP REQUIRED

### Phase 1: Pattern Quality Audit
```
REVIEW all 23 solution files:
1. Mark VERIFIED vs SPECULATIVE vs WRONG
2. Delete files that claim "fixed" but aren't actually verified
3. Update remaining files with verification requirements
4. Add quality level markers
```

### Phase 2: Quality Level System
```
FILE NAMING with quality levels:
- VERIFIED-[date]-[issue].md (tested in production)
- EXPERIMENTAL-[date]-[issue].md (needs testing) 
- DEPRECATED-[date]-[issue].md (no longer valid)

CLAUDE BEHAVIOR:
- VERIFIED: Can reference as guidance (still verify current state)
- EXPERIMENTAL: Must research fresh, use as hint only
- DEPRECATED: Ignore completely
```

### Phase 3: Research-First Protocol
```
EVEN WITH VERIFIED PATTERNS:
1. Research current state first
2. Check if pattern context matches current situation
3. Verify pattern still applies
4. Test solution works in current environment  
5. Only then implement

PATTERNS ARE GUIDANCE, NOT GOSPEL
```

## CRITICAL RULES FOR CLAUDE

### NEVER claim something is "fixed" based on cached patterns alone
### ALWAYS verify current state independently
### ALWAYS test solutions work in live environment
### NEVER skip research because patterns exist
### ALWAYS update pattern status after verification

## Emergency Pattern Cleanup

**IMMEDIATE ACTION NEEDED:**
1. Audit the 5 files claiming "FIXED/COMPLETE"
2. Verify which claims are actually true
3. Delete/deprecate false confidence patterns
4. Update CLAUDE.md with strict verification rules