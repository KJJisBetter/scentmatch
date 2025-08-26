#!/usr/bin/env node

/**
 * Emergency Production Rollback Script
 *
 * Provides immediate rollback capabilities for ScentMatch production:
 * - Lists recent deployments
 * - Performs rollback to previous stable version
 * - Validates rollback success
 * - Notifies team of rollback action
 */

const { execSync } = require('child_process');
const https = require('https');

const PRODUCTION_URL = 'https://scentmatch.vercel.app';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

class EmergencyRollback {
  constructor() {
    this.validateEnvironment();
  }

  validateEnvironment() {
    if (!VERCEL_TOKEN) {
      console.error('❌ VERCEL_TOKEN environment variable is required');
      process.exit(1);
    }
  }

  log(message, color = '') {
    const colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      bold: '\x1b[1m',
      reset: '\x1b[0m',
    };

    console.log(`${colors[color] || ''}${message}${colors.reset}`);
  }

  async execCommand(command) {
    try {
      const output = execSync(command, { encoding: 'utf-8' });
      return output.trim();
    } catch (error) {
      throw new Error(`Command failed: ${command}\nError: ${error.message}`);
    }
  }

  async healthCheck(url = PRODUCTION_URL) {
    return new Promise(resolve => {
      const req = https.get(`${url}/api/health`, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const health = JSON.parse(data);
            resolve({
              status: res.statusCode,
              healthy: res.statusCode === 200 && health.status === 'healthy',
              data: health,
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              healthy: false,
              error: 'Invalid JSON',
            });
          }
        });
      });

      req.on('error', error => {
        resolve({ status: 'error', healthy: false, error: error.message });
      });

      req.setTimeout(10000, () => {
        req.destroy();
        resolve({
          status: 'timeout',
          healthy: false,
          error: 'Request timeout',
        });
      });
    });
  }

  async getCurrentDeployment() {
    try {
      this.log('🔍 Getting current production deployment...', 'blue');
      const output = await this.execCommand(
        `vercel ls --token=${VERCEL_TOKEN} --limit=1`
      );
      const lines = output.split('\n');

      // Parse the current deployment (first non-header line)
      for (const line of lines) {
        if (line.includes('scentmatch') && line.includes('READY')) {
          const parts = line.trim().split(/\s+/);
          return {
            url: parts[0],
            status: parts[1],
            age: parts[2],
            deployment: parts[0],
          };
        }
      }
      throw new Error('No current deployment found');
    } catch (error) {
      throw new Error(`Failed to get current deployment: ${error.message}`);
    }
  }

  async getRecentDeployments(limit = 5) {
    try {
      this.log(`📋 Getting ${limit} most recent deployments...`, 'blue');
      const output = await this.execCommand(
        `vercel ls --token=${VERCEL_TOKEN} --limit=${limit}`
      );
      const lines = output.split('\n');

      const deployments = [];
      for (const line of lines) {
        if (line.includes('scentmatch') && !line.includes('URL')) {
          const parts = line.trim().split(/\s+/);
          deployments.push({
            url: parts[0],
            status: parts[1],
            age: parts[2],
            deployment: parts[0],
          });
        }
      }

      return deployments;
    } catch (error) {
      throw new Error(`Failed to get deployments: ${error.message}`);
    }
  }

  async performRollback(targetDeployment) {
    try {
      this.log(`🔄 Rolling back to: ${targetDeployment}`, 'yellow');

      // Perform the rollback
      const output = await this.execCommand(
        `vercel promote ${targetDeployment} --token=${VERCEL_TOKEN} --yes`
      );

      this.log('✅ Rollback command executed successfully', 'green');
      return output;
    } catch (error) {
      throw new Error(`Rollback failed: ${error.message}`);
    }
  }

  async validateRollback(maxRetries = 5) {
    this.log('🔍 Validating rollback success...', 'blue');

    for (let i = 0; i < maxRetries; i++) {
      this.log(`  Attempt ${i + 1}/${maxRetries}...`);

      const health = await this.healthCheck();

      if (health.healthy) {
        this.log(
          '✅ Rollback validation successful - production is healthy',
          'green'
        );
        return true;
      }

      this.log(
        `  ⚠️ Health check failed (${health.status}): ${health.error || 'Unknown error'}`,
        'yellow'
      );

      if (i < maxRetries - 1) {
        this.log('  ⏳ Waiting 10 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    this.log(
      '❌ Rollback validation failed - production may still be unhealthy',
      'red'
    );
    return false;
  }

  async emergencyRollback() {
    try {
      this.log('🚨 EMERGENCY ROLLBACK INITIATED', 'red');
      this.log(`Timestamp: ${new Date().toISOString()}`, 'bold');
      this.log(`Target: ${PRODUCTION_URL}\n`);

      // Check current health
      this.log('🏥 Checking current production health...', 'blue');
      const currentHealth = await this.healthCheck();

      if (currentHealth.healthy) {
        this.log(
          '✅ Production appears healthy - rollback may not be necessary',
          'green'
        );
        console.log('\nCurrent health status:', currentHealth.data);

        const shouldContinue = process.argv.includes('--force');
        if (!shouldContinue) {
          this.log('\n💡 Use --force flag to rollback anyway', 'yellow');
          return;
        }
      } else {
        this.log(
          `❌ Production is unhealthy: ${currentHealth.error || 'Health check failed'}`,
          'red'
        );
      }

      // Get current and recent deployments
      const current = await this.getCurrentDeployment();
      this.log(`Current deployment: ${current.url} (${current.age})`, 'bold');

      const deployments = await this.getRecentDeployments(10);

      if (deployments.length < 2) {
        throw new Error('No previous deployment found to rollback to');
      }

      // Find the previous deployment (second in list)
      const targetDeployment = deployments[1];
      this.log(
        `Target deployment: ${targetDeployment.url} (${targetDeployment.age})`
      );

      // Show all recent deployments for context
      this.log('\n📚 Recent deployments:', 'blue');
      deployments.slice(0, 5).forEach((dep, i) => {
        const marker =
          i === 0 ? ' (current)' : i === 1 ? ' (rollback target)' : '';
        this.log(`  ${i + 1}. ${dep.url} - ${dep.age}${marker}`);
      });

      // Confirm rollback
      if (!process.argv.includes('--yes')) {
        this.log('\n⚠️ This will rollback production immediately!', 'yellow');
        this.log('Use --yes flag to confirm rollback', 'yellow');
        return;
      }

      // Perform rollback
      const rollbackOutput = await this.performRollback(targetDeployment.url);
      this.log(`\nRollback output:\n${rollbackOutput}`, 'blue');

      // Wait for propagation
      this.log('\n⏳ Waiting 30 seconds for deployment propagation...');
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Validate rollback
      const isValid = await this.validateRollback();

      if (isValid) {
        this.log('\n🎉 EMERGENCY ROLLBACK COMPLETED SUCCESSFULLY', 'green');
        this.log(`Production rolled back to: ${targetDeployment.url}`, 'green');
      } else {
        this.log(
          '\n⚠️ ROLLBACK MAY HAVE FAILED - MANUAL INTERVENTION REQUIRED',
          'red'
        );
      }
    } catch (error) {
      this.log(`\n❌ ROLLBACK FAILED: ${error.message}`, 'red');
      this.log('\n🆘 Manual intervention required:', 'yellow');
      this.log('1. Check Vercel dashboard: https://vercel.com/dashboard');
      this.log('2. Verify deployment status');
      this.log('3. Contact team immediately');
      process.exit(1);
    }
  }

  showUsage() {
    console.log(`
🚨 ScentMatch Emergency Rollback Script

Usage:
  node scripts/production/emergency-rollback.js [options]

Options:
  --yes     Confirm rollback without prompting
  --force   Perform rollback even if production appears healthy
  --help    Show this help message

Environment Variables:
  VERCEL_TOKEN    Required Vercel API token

Examples:
  # Check current status (safe)
  node scripts/production/emergency-rollback.js

  # Perform emergency rollback
  node scripts/production/emergency-rollback.js --yes

  # Force rollback even if production appears healthy
  node scripts/production/emergency-rollback.js --yes --force
`);
  }
}

// CLI interface
if (require.main === module) {
  if (process.argv.includes('--help')) {
    new EmergencyRollback().showUsage();
    process.exit(0);
  }

  const rollback = new EmergencyRollback();
  rollback.emergencyRollback().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = EmergencyRollback;
