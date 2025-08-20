# Pattern Cleanup Protocol

## Immediate Cleanup Needed

### Current Problems
- `.claude/docs/internal/solutions/` has 20+ files, many outdated
- Patterns conflict with each other
- Hard to find relevant solutions
- No freshness validation

## Cleanup Strategy

### 1. Solutions Folder Audit
```bash
# Check all solution files
ls -la .claude/docs/internal/solutions/
# Look for:
- Files older than 30 days (archive candidates)
- Duplicate problem types
- Solutions that didn't work long-term
- Emergency fixes that became permanent
```

### 2. Pattern Consolidation
```
CONSOLIDATE similar patterns into category files:
- search-api-patterns.md (search/filtering solutions)
- quiz-algorithm-patterns.md (recommendation logic)
- database-schema-patterns.md (migration/schema fixes)
- auth-flow-patterns.md (authentication solutions)
- component-patterns.md (UI/component solutions)
```

### 3. Quality Criteria for Keeping Patterns
```
KEEP patterns that are:
✅ Used multiple times successfully
✅ Solve recurring problems  
✅ Still work with current tech stack
✅ Clear problem description + working solution

ARCHIVE patterns that are:
❌ One-time emergency fixes
❌ Conflicting with newer approaches
❌ For outdated technology versions
❌ Never reused after creation
```

## Suggested Cleanup Actions

### Phase 1: Emergency Pattern Audit
1. **Check for conflicting search patterns**
   - Multiple different approaches to same problem
   - Emergency fixes vs proper solutions

2. **Consolidate quiz/recommendation patterns**
   - Many different algorithm attempts
   - Keep only proven working solutions

3. **Clean up database patterns**
   - Multiple migration approaches
   - Keep current schema strategy only

### Phase 2: Create Category Patterns
```
Create 5 focused pattern files:
1. api-patterns.md - Proven API solutions
2. database-patterns.md - Working database solutions  
3. algorithm-patterns.md - Successful algorithm fixes
4. component-patterns.md - UI component solutions
5. integration-patterns.md - System integration solutions

Each file: MAX 20 patterns, 3-5 lines each
```

### Phase 3: Archive Old Solutions
```
Move to .claude/docs/archive/2025-08/:
- Solutions older than 30 days
- Emergency fixes that worked but aren't reusable
- Debugging sessions that didn't yield patterns
- Experimental approaches that didn't work

Keep in solutions/:
- Only last 7 days of working solutions
- Patterns still being refined
```

## Pattern Usage Protocol

### Before Applying Patterns
1. **Check pattern age** - Is this still relevant?
2. **Verify tech stack compatibility** - Does this work with current versions?
3. **Check for conflicts** - Does this contradict newer patterns?
4. **Test in current context** - Don't blindly apply old solutions

### After Using Patterns Successfully
1. **Update pattern effectiveness** - Note it worked again
2. **Refine pattern if needed** - Improve based on new context
3. **Mark as recently validated** - Update last-used date

### When Patterns Fail
1. **Don't force outdated patterns** - Research new solution
2. **Update or retire pattern** - Mark as outdated/deprecated
3. **Document why it failed** - Context changes, tech evolution