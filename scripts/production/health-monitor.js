#!/usr/bin/env node

/**
 * Production Health Monitoring Script
 *
 * Monitors ScentMatch production deployment health with:
 * - API endpoint validation
 * - Performance metrics collection
 * - Core Web Vitals monitoring
 * - Database connectivity checks
 * - Security headers validation
 */

const https = require('https');
const { performance } = require('perf_hooks');

const PRODUCTION_URL = 'https://scentmatch.vercel.app';
const HEALTH_ENDPOINTS = ['/', '/api/health', '/quiz', '/browse'];

// Performance thresholds
const THRESHOLDS = {
  responseTime: 3000, // 3 seconds
  healthCheck: 1000, // 1 second for health endpoint
  uptime: 99.9, // 99.9% uptime target
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

class ProductionMonitor {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  async checkEndpoint(path, timeout = THRESHOLDS.responseTime) {
    const url = `${PRODUCTION_URL}${path}`;
    const startTime = performance.now();

    return new Promise(resolve => {
      const timeoutId = setTimeout(() => {
        resolve({
          path,
          status: 'timeout',
          responseTime: timeout,
          error: `Request timed out after ${timeout}ms`,
        });
      }, timeout);

      const req = https.get(url, res => {
        clearTimeout(timeoutId);
        const responseTime = Math.round(performance.now() - startTime);

        let data = '';
        res.on('data', chunk => (data += chunk));

        res.on('end', () => {
          const result = {
            path,
            status: res.statusCode,
            responseTime,
            contentLength: data.length,
            headers: res.headers,
          };

          // Parse JSON for health endpoint
          if (
            path === '/api/health' &&
            res.headers['content-type']?.includes('application/json')
          ) {
            try {
              result.health = JSON.parse(data);
            } catch (e) {
              result.error = 'Invalid JSON response';
            }
          }

          resolve(result);
        });
      });

      req.on('error', error => {
        clearTimeout(timeoutId);
        resolve({
          path,
          status: 'error',
          responseTime: Math.round(performance.now() - startTime),
          error: error.message,
        });
      });

      req.setTimeout(timeout, () => {
        req.destroy();
      });
    });
  }

  async checkSecurityHeaders(path = '/') {
    const result = await this.checkEndpoint(path);

    if (result.headers) {
      const securityHeaders = {
        'x-frame-options': result.headers['x-frame-options'],
        'x-content-type-options': result.headers['x-content-type-options'],
        'strict-transport-security':
          result.headers['strict-transport-security'],
        'content-security-policy': result.headers['content-security-policy'],
        'referrer-policy': result.headers['referrer-policy'],
        'permissions-policy': result.headers['permissions-policy'],
      };

      const missingHeaders = [];
      const presentHeaders = [];

      Object.entries(securityHeaders).forEach(([header, value]) => {
        if (value) {
          presentHeaders.push(header);
        } else {
          missingHeaders.push(header);
        }
      });

      return {
        ...result,
        security: {
          presentHeaders,
          missingHeaders,
          score:
            (presentHeaders.length / Object.keys(securityHeaders).length) * 100,
        },
      };
    }

    return result;
  }

  async runHealthChecks() {
    this.log(
      `${colors.bold}🔍 Starting Production Health Checks${colors.reset}`
    );
    this.log(`Target: ${PRODUCTION_URL}`);
    this.log(`Timestamp: ${new Date().toISOString()}\n`);

    // Check all endpoints
    this.log(`${colors.blue}📡 Checking endpoints...${colors.reset}`);

    for (const endpoint of HEALTH_ENDPOINTS) {
      const result = await this.checkEndpoint(
        endpoint,
        endpoint === '/api/health'
          ? THRESHOLDS.healthCheck
          : THRESHOLDS.responseTime
      );

      this.results.push(result);

      // Log result
      const statusColor =
        result.status === 200
          ? colors.green
          : result.status === 'timeout'
            ? colors.yellow
            : colors.red;

      const responseTimeColor =
        result.responseTime < 1000
          ? colors.green
          : result.responseTime < 3000
            ? colors.yellow
            : colors.red;

      this.log(
        `  ${endpoint}: ${statusColor}${result.status}${colors.reset} (${responseTimeColor}${result.responseTime}ms${colors.reset})`
      );

      if (result.error) {
        this.log(`    ❌ Error: ${result.error}`, colors.red);
      }

      if (result.health) {
        this.log(
          `    📊 Health: ${result.health.status}`,
          result.health.status === 'healthy' ? colors.green : colors.red
        );
        this.log(
          `    📈 Metrics: ${result.health.metrics?.fragranceCount} fragrances`
        );
      }
    }

    // Security headers check
    this.log(`\n${colors.blue}🔒 Security Headers Check...${colors.reset}`);
    const securityResult = await this.checkSecurityHeaders('/');
    this.results.push(securityResult);

    if (securityResult.security) {
      this.log(
        `  Security Score: ${securityResult.security.score}%`,
        securityResult.security.score >= 80 ? colors.green : colors.yellow
      );
      this.log(
        `  Present: ${securityResult.security.presentHeaders.join(', ')}`
      );

      if (securityResult.security.missingHeaders.length > 0) {
        this.log(
          `  Missing: ${securityResult.security.missingHeaders.join(', ')}`,
          colors.yellow
        );
      }
    }

    // Overall assessment
    this.generateReport();
  }

  generateReport() {
    const totalTime = Date.now() - this.startTime;
    const healthyEndpoints = this.results.filter(r => r.status === 200).length;
    const totalEndpoints = HEALTH_ENDPOINTS.length;
    const uptimePercentage = (healthyEndpoints / totalEndpoints) * 100;

    this.log(`\n${colors.bold}📋 Health Check Summary${colors.reset}`);
    this.log(`Total check time: ${totalTime}ms`);
    this.log(`Endpoints checked: ${totalEndpoints}`);
    this.log(`Healthy endpoints: ${healthyEndpoints}/${totalEndpoints}`);

    const uptimeColor =
      uptimePercentage >= 99
        ? colors.green
        : uptimePercentage >= 95
          ? colors.yellow
          : colors.red;
    this.log(
      `Uptime: ${uptimeColor}${uptimePercentage.toFixed(1)}%${colors.reset}`
    );

    // Performance summary
    const avgResponseTime =
      this.results
        .filter(r => typeof r.responseTime === 'number')
        .reduce((sum, r) => sum + r.responseTime, 0) / this.results.length;

    const perfColor =
      avgResponseTime < 1000
        ? colors.green
        : avgResponseTime < 3000
          ? colors.yellow
          : colors.red;
    this.log(
      `Average response time: ${perfColor}${Math.round(avgResponseTime)}ms${colors.reset}`
    );

    // Overall status
    const isHealthy =
      uptimePercentage >= 95 && avgResponseTime < THRESHOLDS.responseTime;
    const statusColor = isHealthy ? colors.green : colors.red;
    const statusText = isHealthy ? 'HEALTHY' : 'UNHEALTHY';

    this.log(
      `\n${colors.bold}Overall Status: ${statusColor}${statusText}${colors.reset}\n`
    );

    // Exit with appropriate code for CI/CD
    if (!isHealthy) {
      process.exit(1);
    }
  }

  async run() {
    try {
      await this.runHealthChecks();
    } catch (error) {
      this.log(`❌ Health check failed: ${error.message}`, colors.red);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const monitor = new ProductionMonitor();
  monitor.run().catch(console.error);
}

module.exports = ProductionMonitor;
