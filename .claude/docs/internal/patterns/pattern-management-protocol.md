# Pattern Management Protocol

## Pattern Lifecycle

### Fresh Patterns (< 7 days)
- Actively useful for current work
- Located: `.claude/docs/internal/solutions/YYYY-MM-DD-*`
- Auto-referenced when solving similar issues

### Mature Patterns (7-30 days)  
- Proven working solutions
- Located: `.claude/docs/internal/patterns/[category].md`
- Organized by technology/problem type

### Archived Patterns (> 30 days)
- Historical reference only
- Located: `.claude/docs/archive/YYYY-MM/`
- Cleaned up automatically

## Storage Rules

### Solution Files (Fresh)
```
Format: .claude/docs/internal/solutions/YYYY-MM-DD-brief-description.md
Content:
- Exact problem description
- Solution that worked
- Files modified
- Verification steps
- Time to solve
```

### Pattern Files (Mature)
```
Format: .claude/docs/internal/patterns/[category].md
Categories:
- api-patterns.md (API endpoint solutions)
- database-patterns.md (Schema, migration patterns)  
- component-patterns.md (UI component solutions)
- build-patterns.md (Build/config solutions)
- auth-patterns.md (Authentication solutions)

Content per pattern:
- Problem type (1 line)
- Solution approach (1-3 lines)
- Code snippet (minimal)
- When to use (1 line)
```

## Cleanup Protocol

### Weekly Cleanup (Every 7 days)
1. Move solutions older than 7 days to patterns/[category].md
2. Remove duplicate patterns
3. Update pattern effectiveness based on reuse

### Monthly Archive (Every 30 days)  
1. Move patterns older than 30 days to archive/YYYY-MM/
2. Keep only most effective patterns in current
3. Update pattern index with most useful solutions

## Pattern Quality Rules

### Only Save If:
- ✅ Actually solved a real problem
- ✅ Solution was verified working
- ✅ Likely to be needed again
- ✅ Not already documented

### Never Save:
- ❌ Speculative solutions (not verified)
- ❌ One-off workarounds (not reusable)
- ❌ Debugging steps that didn't work
- ❌ Duplicate of existing patterns