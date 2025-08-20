# Spec Tasks

## Tasks

- [ ] 1. Pre-Cleanup Analysis and Setup
  - [ ] 1.1 Create comprehensive import analysis script to map all file dependencies
  - [ ] 1.2 Install and configure next-bundle-analyzer for size measurement
  - [ ] 1.3 Generate baseline bundle analysis report (before cleanup)
  - [ ] 1.4 Create git backup branch: backup-before-cleanup-2025-08-20
  - [ ] 1.5 Document current system architecture and file count (223 files baseline)
  - [ ] 1.6 Run full test suite to establish baseline functionality

- [ ] 2. AI Files Audit and Safe Removal
  - [ ] 2.1 Write import scanning script to identify unused AI files
  - [ ] 2.2 Verify the 4 essential AI files are actively imported by app/components
  - [ ] 2.3 Create list of 32 confirmed unused AI files with zero import references
  - [ ] 2.4 Remove first batch of 10 unused AI files using git rm
  - [ ] 2.5 Run test suite after first batch removal
  - [ ] 2.6 Remove remaining 22 unused AI files in batches of 5-10
  - [ ] 2.7 Verify TypeScript compilation success after each batch
  - [ ] 2.8 Verify all tests pass after AI file cleanup

- [ ] 3. Scripts Directory Consolidation
  - [ ] 3.1 Audit scripts/ directory and categorize essential vs experimental files
  - [ ] 3.2 Identify scripts referenced in package.json, CI/CD, or documentation
  - [ ] 3.3 Remove 31 identified experimental/debug scripts
  - [ ] 3.4 Preserve only migration scripts, build scripts, and deployment tools
  - [ ] 3.5 Verify development and build processes work after script cleanup
  - [ ] 3.6 Update package.json scripts section if any referenced files removed

- [ ] 4. System Deduplication and Import Cleanup
  - [ ] 4.1 Identify and remove conflicting recommendation engine implementations
  - [ ] 4.2 Consolidate to single working recommendation system
  - [ ] 4.3 Update all import paths affected by file removals
  - [ ] 4.4 Remove unused TypeScript types and interfaces
  - [ ] 4.5 Clean up package.json dependencies for unused imports
  - [ ] 4.6 Verify all imports resolve correctly with TypeScript compiler

- [ ] 5. Documentation and Configuration Updates
  - [ ] 5.1 Update CLAUDE.md to reflect cleaned AI architecture
  - [ ] 5.2 Update tech-stack.md with simplified system description
  - [ ] 5.3 Update any tsconfig.json references to removed files
  - [ ] 5.4 Update next.config.js if any removed modules were referenced
  - [ ] 5.5 Document the 4 remaining essential AI systems and their purposes

- [ ] 6. Final Verification and Performance Measurement
  - [ ] 6.1 Run complete test suite to verify no functionality regression
  - [ ] 6.2 Test all user workflows: authentication, quiz, search, recommendations
  - [ ] 6.3 Generate post-cleanup bundle analysis report
  - [ ] 6.4 Measure and document file count reduction (target: 223 → ~150 files)
  - [ ] 6.5 Benchmark page load times for /, /quiz, /browse routes
  - [ ] 6.6 Verify production build completes successfully without errors
  - [ ] 6.7 Document bundle size reduction and performance improvements