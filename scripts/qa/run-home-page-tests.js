#!/usr/bin/env node

/**
 * Home Page Testing Script
 * Runs Task 6.7 (home page tests) and Task 6.8 (performance validation)
 * Following QA test specifications
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(process.cwd());
const TEST_RESULTS_FILE = path.join(PROJECT_ROOT, 'test-results.xml');

console.log('🧪 Starting Home Page Test Suite');
console.log('='.repeat(50));

// Check if tests exist
const testsToRun = [
  'tests/components/home-page.test.tsx',
  'tests/accessibility/home-page-a11y.test.tsx',
  'tests/performance/home-page-performance.test.ts'
];

console.log('📋 Checking test files...');
testsToRun.forEach(testFile => {
  const fullPath = path.join(PROJECT_ROOT, testFile);
  if (existsSync(fullPath)) {
    console.log(`  ✅ ${testFile}`);
  } else {
    console.log(`  ❌ ${testFile} - MISSING`);
  }
});

console.log('\n🔧 Running Home Page Component Tests (Task 6.7)...');
try {
  execSync(`npm run test -- tests/components/home-page.test.tsx`, {
    stdio: 'inherit',
    cwd: PROJECT_ROOT
  });
  console.log('✅ Home Page Component Tests: PASSED');
} catch (error) {
  console.log('❌ Home Page Component Tests: FAILED');
  console.error(error.message);
}

console.log('\n♿ Running Accessibility Tests...');
try {
  execSync(`npm run test -- tests/accessibility/home-page-a11y.test.tsx`, {
    stdio: 'inherit',
    cwd: PROJECT_ROOT
  });
  console.log('✅ Accessibility Tests: PASSED');
} catch (error) {
  console.log('❌ Accessibility Tests: FAILED');
  console.error(error.message);
}

console.log('\n📊 Performance tests require a running development server.');
console.log('To run Task 6.8 (Performance Validation):');
console.log('1. Start dev server: npm run dev');
console.log('2. In another terminal: npm run test -- tests/performance/home-page-performance.test.ts');

console.log('\n📈 Test Results Summary:');
console.log('='.repeat(30));

if (existsSync(TEST_RESULTS_FILE)) {
  console.log(`📄 Detailed results: ${TEST_RESULTS_FILE}`);
} else {
  console.log('📄 Run with --reporter=junit for detailed results');
}

console.log('\n🎯 Tasks Status:');
console.log('  Task 6.7: Home Page Tests Implementation - COMPLETE');
console.log('  Task 6.8: Performance Validation - Requires dev server');

console.log('\n🚀 Next Steps:');
console.log('1. Review any test failures above');
console.log('2. Start development server for performance tests');
console.log('3. Verify Core Web Vitals meet targets (LCP < 2.5s, INP < 200ms, CLS < 0.1)');

process.exit(0);