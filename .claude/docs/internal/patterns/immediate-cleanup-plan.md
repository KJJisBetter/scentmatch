# Immediate Pattern Cleanup Plan

## Current State Analysis
- **23+ solution files** in `.claude/docs/internal/solutions/`
- **568-line team activity file** (archived)
- **Pattern conflicts and duplicates**

## Cleanup Action Plan

### Step 1: Consolidate Core Patterns
```
CREATE 5 focused pattern files:

1. api-patterns.md
   - Search API brand mapping
   - Quiz API response formatting
   - Error handling patterns

2. database-patterns.md  
   - Session token type fixes
   - Migration execution patterns
   - RPC function updates

3. algorithm-patterns.md
   - Quiz recommendation scoring
   - Tie-breaking and randomization
   - Brand diversity selection

4. component-patterns.md
   - Component import strategies
   - Error boundary patterns
   - Loading state handling

5. build-patterns.md
   - TypeScript error resolution
   - Next.js configuration fixes
   - Development server issues
```

### Step 2: Archive Old Solutions
```
MOVE TO ARCHIVE (> 7 days old):
- 2025-08-14-* files (5+ days old)
- 2025-08-15-* files (4+ days old)  
- Any solutions not used recently

KEEP ACTIVE (< 7 days):
- 2025-08-18-* and newer
- Recently validated patterns
- Current project solutions
```

### Step 3: Enforce Size Limits
```
TEAM ACTIVITY: 50 lines max (currently 27 ✅)
PATTERN FILES: 20 patterns max per file
SOLUTION FILES: Clean weekly, keep < 10 active
```

## Quality Standards Going Forward

### Pattern Validation
```
BEFORE using any cached pattern:
1. Check date (< 30 days preferred)
2. Verify tech stack compatibility
3. Test in current context first
4. Update if modifications needed
```

### New Pattern Creation
```
ONLY create new patterns for:
✅ Problems solved 2+ times successfully
✅ Solutions that work reliably
✅ Patterns likely to be reused

DOCUMENT format:
- Problem (1 line)
- Solution (2-3 lines)  
- When to use (1 line)
- Last validated (date)
```

## Implementation Priority

### High Priority (Do Now)
1. ✅ Team activity cleaned (568 → 27 lines)
2. ✅ New management protocols created
3. **TODO:** Consolidate 23 solution files → 5 pattern files
4. **TODO:** Archive files older than 7 days

### Medium Priority (This Week)
- Create automated cleanup script
- Set up pattern validation checks
- Implement size limit enforcement

### Low Priority (Next Sprint)
- Pattern effectiveness tracking
- Usage analytics for patterns
- Pattern recommendation system