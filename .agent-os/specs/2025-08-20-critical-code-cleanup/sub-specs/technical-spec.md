# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-20-critical-code-cleanup/spec.md

## Technical Requirements

### Phase 1: Audit and Mapping Requirements

- **Import Analysis Tool:** Use TypeScript compiler API or grep-based analysis to scan all files in app/, components/, lib/ directories for actual import statements
- **Dead Code Detection:** Identify files in lib/ai/ with zero imports from user-facing code (app/ and components/ directories)
- **Dependency Tracking:** Map package.json dependencies to actual usage patterns throughout codebase
- **Bundle Analysis Setup:** Install and configure next-bundle-analyzer for before/after size measurement
- **System Mapping:** Document which recommendation systems are actively called by API routes and components

### Phase 2: Safe Deletion Protocol

- **Incremental Removal:** Delete files in batches of 5-10, testing after each batch
- **Git History Preservation:** Use `git rm` command to maintain file history for potential recovery
- **Import Reference Verification:** Confirm zero references across entire codebase before deletion
- **Test Suite Execution:** Run full test suite after each deletion batch to catch unexpected dependencies
- **TypeScript Compilation Check:** Ensure zero compilation errors after each cleanup phase

### Phase 3: System Consolidation Requirements

- **Single Source of Truth:** Consolidate to one recommendation engine (recommendation-engine.ts)
- **Import Path Updates:** Update all import statements to reflect cleaned file structure
- **Type Definition Cleanup:** Remove unused TypeScript interfaces and types from cleaned modules
- **Configuration File Updates:** Update any tsconfig.json, next.config.js references to removed modules
- **Documentation Synchronization:** Update CLAUDE.md and tech-stack.md to reflect cleaned architecture

### Cleanup Targets (Based on SCE-52 Evidence)

**4 Essential AI Files to Preserve:**
- lib/ai/ai-search.ts
- lib/ai/recommendation-engine.ts
- lib/ai/thompson-sampling.ts
- lib/ai/voyage-client.ts

**32 Unused AI Files to Remove:**
- lib/ai/ai-client.ts
- lib/ai/ai-cost-optimizer.ts
- lib/ai/ai-health-recovery.ts
- lib/ai/embedding-pipeline.ts
- All lib/ai/real-time-*.ts files
- All lib/ai/unified-*.ts files
- All other files not in preservation list

**Scripts Directory Cleanup:**
- Remove 31 test/debug scripts identified as one-off experiments
- Preserve migration scripts only if referenced in package.json or documentation
- Keep only scripts that are part of deployment or CI/CD workflows

### Bundle Size Measurement Requirements

- **Before Cleanup:** Generate bundle analysis report showing current file sizes and dependencies
- **After Cleanup:** Generate comparison report documenting size reductions
- **Performance Benchmarking:** Measure page load times for key routes (/, /quiz, /browse) before and after
- **Memory Usage Analysis:** Document reduction in development server memory usage

### Verification and Testing Requirements

- **Functionality Testing:** All existing user workflows must work identically after cleanup
- **API Endpoint Testing:** Verify all recommendation and search endpoints function correctly
- **UI Component Testing:** Ensure all components render and function without errors
- **Development Server:** Confirm dev server starts without warnings or errors
- **Production Build:** Verify successful production build with no compilation issues

### Risk Mitigation Requirements

- **Backup Strategy:** Create git branch backup before beginning cleanup process
- **Rollback Plan:** Document exact steps to restore any accidentally removed essential files
- **Staged Deployment:** Test cleanup in development → staging → production sequence
- **Monitor Error Tracking:** Set up enhanced error monitoring during cleanup process