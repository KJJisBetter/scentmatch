# Team Activity Management Protocol

## Size Enforcement - AUTOMATIC

### Hard Limits
```
.claude/handoffs/team-activity.md:
- MAXIMUM: 50 lines total (strictly enforced)
- CURRENT WORK: 30 lines max
- COMPLETED ARCHIVE: 20 lines max
- PER UPDATE: 2 lines max

IF > 50 lines: AUTOMATIC CLEANUP
```

### Auto-Cleanup Rules
```
WHEN file reaches 45+ lines:
1. Move completed work to archive section
2. Keep only last 7 days of activity
3. Summarize old work in 1-2 lines
4. Delete implementation details

EXAMPLE CLEANUP:
BEFORE (too much detail):
**Task 1.1:** Created comprehensive database schema tests (12 test categories)
- Created 4 comprehensive test suites (26 total tests)  
- 15 tests passing (validating existing functionality)
- 11 tests documenting required changes/implementations
- Tests cover: schema validation, new features, security, RLS, functions
- Key findings: Missing user_preferences, security issues with RLS

AFTER (cleaned):
**Task 1:** ✅ Database schema tests complete (26 tests)
```

## Current Work Format

### Active Work Only
```
## Current Work - [Spec Name]
**Started:** [Date]

### In Progress
- **Task X:** [Brief description] - [Status]

### Completed Today  
- **Task Y:** ✅ [Brief result]

### Blocked/Issues
- **Issue:** [Problem] - [Next step]
```

### Archive Format
```
## Recent Completed Work
- 2025-08-19: ✅ Pre-launch bug fixes (search, quiz, transfer)
- 2025-08-18: ✅ AI enhancement system implementation  
- 2025-08-17: ✅ Database schema foundation
```

## Writing Discipline

### What to Include
- Current task status (1 line)
- Completion markers (✅ ❌ ⏳)
- Blockers needing user input
- File paths for reference

### What to Exclude  
- Implementation details
- Code snippets
- Long explanations
- Research findings (goes to docs/external/)
- Architecture decisions (goes to docs/internal/patterns/)

## Rotation Protocol

### Daily Rotation
```
AT START OF DAY:
1. Archive yesterday's completed work (move to archive section)
2. Keep only active/blocked items in current section
3. Update status markers
4. Clean up stale items

MAX RETENTION:
- Current work: Keep until complete
- Completed work: 7 days in archive section
- Old archive: Delete after 30 days
```

### Emergency Reset
```
IF file becomes unmanageable:
1. Save current file to .claude/docs/archive/YYYY-MM-DD-team-activity-backup.md
2. Create fresh team-activity.md with only current work
3. Keep 3-line summary of previous work

TEMPLATE:
## Current Work - [Active Spec]
**Started:** [Today]

### Previous Work Summary  
- ✅ Completed: Search fixes, quiz algorithm, database migrations
- 📁 Details archived: 2025-08-19-team-activity-backup.md

### Active Work
[Current tasks only]
```