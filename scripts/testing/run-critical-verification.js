#!/usr/bin/env node

/**
 * Critical Platform Verification Runner
 * 
 * Runs the critical end-to-end verification tests to ensure
 * the platform actually works for real users.
 * 
 * Usage: node scripts/testing/run-critical-verification.js
 */

require('dotenv').config({ path: '.env.local' });
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bright: '\x1b[1m'
};

function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`${title}`, colors.cyan + colors.bright);
  log(`${'='.repeat(60)}`, colors.cyan);
}

function logStep(step, description) {
  log(`\n${step}. ${description}`, colors.yellow + colors.bright);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Check if server is running
async function checkServerRunning() {
  try {
    const response = await fetch('http://localhost:3000/api/dev/create-test-user');
    return response.ok;
  } catch {
    return false;
  }
}

// Run command with proper output handling
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
}

// Cleanup function
async function cleanup() {
  logStep('Cleanup', 'Cleaning up test users');
  
  try {
    const response = await fetch('http://localhost:3000/api/dev/create-test-user', {
      method: 'DELETE'
    });
    
    if (response.ok) {
      logSuccess('Test users cleaned up');
    } else {
      logWarning('Could not clean up test users (may not be implemented)');
    }
  } catch (error) {
    logWarning('Could not clean up test users: ' + error.message);
  }
}

async function main() {
  logSection('🧪 CRITICAL PLATFORM VERIFICATION');
  log('Verifying the ScentMatch platform actually works for real users', colors.white);
  
  try {
    // Step 1: Environment check
    logStep('1', 'Checking environment and prerequisites');
    
    const serverRunning = await checkServerRunning();
    if (!serverRunning) {
      logError('Development server not running on localhost:3000');
      log('Please run: npm run dev', colors.white);
      process.exit(1);
    }
    logSuccess('Development server detected');
    
    // Check if test file exists
    const testFile = path.join(process.cwd(), 'tests/verification/critical-platform-verification.test.ts');
    if (!fs.existsSync(testFile)) {
      logError('Critical verification test file not found');
      log(`Expected: ${testFile}`, colors.white);
      process.exit(1);
    }
    logSuccess('Critical verification tests found');
    
    // Step 2: Database connectivity
    logStep('2', 'Verifying database connectivity');
    
    try {
      const testUserResponse = await fetch('http://localhost:3000/api/dev/create-test-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `connectivity-test-${Date.now()}@suspicious.com`,
          password: 'TestPassword123!'
        })
      });
      
      if (testUserResponse.ok) {
        logSuccess('Database connectivity confirmed');
      } else {
        logError('Database connectivity failed');
        const error = await testUserResponse.text();
        log(`Error: ${error}`, colors.red);
        process.exit(1);
      }
    } catch (error) {
      logError('Database connectivity test failed: ' + error.message);
      process.exit(1);
    }
    
    // Step 3: Run critical verification tests
    logStep('3', 'Running critical verification tests');
    logInfo('This will test:');
    log('   • Complete user registration and authentication', colors.white);
    log('   • Database integration with real data', colors.white);
    log('   • End-to-end user journeys', colors.white);
    log('   • Performance under realistic conditions', colors.white);
    log('   • Cross-system integration', colors.white);
    
    try {
      await runCommand('npx', [
        'playwright', 'test',
        'tests/verification/critical-platform-verification.test.ts',
        '--reporter=list',
        '--timeout=60000'
      ]);
      
      logSuccess('All critical verification tests passed!');
      
    } catch (error) {
      logError('Critical verification tests failed');
      log('\nThis means the platform has critical issues that prevent real user usage.', colors.red);
      log('Review the test output above for specific failures.', colors.white);
      throw error;
    }
    
    // Step 4: Test results summary
    logStep('4', 'Verification results summary');
    
    logSuccess('🎯 VERIFICATION COMPLETE - PLATFORM READY');
    log('\nPlatform Status:', colors.bright);
    log('  ✅ Authentication system functional', colors.green);
    log('  ✅ Database integration working', colors.green);
    log('  ✅ User journeys complete successfully', colors.green);
    log('  ✅ Performance targets met', colors.green);
    log('  ✅ Error handling graceful', colors.green);
    log('  ✅ Session management robust', colors.green);
    
    log('\n🚀 The platform is verified and ready for real users!', colors.green + colors.bright);
    
  } catch (error) {
    logSection('❌ VERIFICATION FAILED');
    logError('Critical platform verification failed');
    log('\nThe platform has issues that prevent real user usage:', colors.red);
    log('  • Authentication may not work properly', colors.red);
    log('  • Database integration may be broken', colors.red);
    log('  • User journeys may fail', colors.red);
    log('  • Performance may be unacceptable', colors.red);
    
    log('\n🔧 Next Steps:', colors.yellow);
    log('  1. Review test output for specific failure details', colors.white);
    log('  2. Fix the identified issues', colors.white);
    log('  3. Re-run verification: npm run test:verify', colors.white);
    log('  4. Do not deploy until all tests pass', colors.white);
    
    process.exit(1);
  } finally {
    // Always attempt cleanup
    await cleanup().catch(() => {
      logWarning('Cleanup failed - you may need to manually remove test users');
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  log('\n\nShutting down...', colors.yellow);
  await cleanup().catch(() => {});
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log('\n\nShutting down...', colors.yellow);
  await cleanup().catch(() => {});
  process.exit(0);
});

// Run the verification
main().catch((error) => {
  logError('Verification script failed: ' + error.message);
  process.exit(1);
});