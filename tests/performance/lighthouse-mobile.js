const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

/**
 * Lighthouse mobile testing for ScentMatch
 * Automated mobile performance, accessibility, and SEO auditing
 */

// Mobile device configuration
const MOBILE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'mobile',
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 150,
      downloadThroughputKbps: 1638.4,
      uploadThroughputKbps: 675,
    },
    screenEmulation: {
      mobile: true,
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      disabled: false,
    },
    emulatedUserAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
  },
};

// Performance thresholds for ScentMatch
const PERFORMANCE_THRESHOLDS = {
  performance: 85,
  accessibility: 95,
  'best-practices': 90,
  seo: 90,
  // Specific metrics
  'largest-contentful-paint': 2500,
  interactive: 3800,
  'speed-index': 3400,
  'total-blocking-time': 200,
  'cumulative-layout-shift': 0.1,
};

async function runLighthouseMobile(url, outputPath = './lighthouse-results') {
  let chrome;

  try {
    // Launch Chrome
    chrome = await chromeLauncher.launch({
      chromeFlags: [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    // Run Lighthouse
    const options = {
      logLevel: 'info',
      output: ['json', 'html'],
      port: chrome.port,
      ...MOBILE_CONFIG,
    };

    console.log(`🚀 Running Lighthouse audit for ${url}`);
    const runnerResult = await lighthouse(url, options);

    if (!runnerResult) {
      throw new Error('Lighthouse failed to return results');
    }

    // Extract scores and metrics
    const { lhr } = runnerResult;
    const scores = {
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
    };

    const metrics = {
      'largest-contentful-paint':
        lhr.audits['largest-contentful-paint'].numericValue,
      interactive: lhr.audits.interactive.numericValue,
      'speed-index': lhr.audits['speed-index'].numericValue,
      'total-blocking-time': lhr.audits['total-blocking-time'].numericValue,
      'cumulative-layout-shift':
        lhr.audits['cumulative-layout-shift'].numericValue,
    };

    // Create output directory
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // Save detailed results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(
      outputPath,
      `lighthouse-mobile-${timestamp}.json`
    );
    const htmlPath = path.join(
      outputPath,
      `lighthouse-mobile-${timestamp}.html`
    );

    fs.writeFileSync(jsonPath, runnerResult.report[0]);
    fs.writeFileSync(htmlPath, runnerResult.report[1]);

    // Log results
    console.log('\n📊 Lighthouse Mobile Results:');
    console.log(`Performance: ${scores.performance}/100`);
    console.log(`Accessibility: ${scores.accessibility}/100`);
    console.log(`Best Practices: ${scores.bestPractices}/100`);
    console.log(`SEO: ${scores.seo}/100`);

    console.log('\n⏱️  Core Web Vitals:');
    console.log(`LCP: ${Math.round(metrics['largest-contentful-paint'])}ms`);
    console.log(`TTI: ${Math.round(metrics.interactive)}ms`);
    console.log(`Speed Index: ${Math.round(metrics['speed-index'])}ms`);
    console.log(`TBT: ${Math.round(metrics['total-blocking-time'])}ms`);
    console.log(`CLS: ${metrics['cumulative-layout-shift'].toFixed(3)}`);

    // Check thresholds
    let passed = true;
    const failures = [];

    // Check category scores
    for (const [category, score] of Object.entries(scores)) {
      const threshold = PERFORMANCE_THRESHOLDS[category];
      if (score < threshold) {
        passed = false;
        failures.push(`${category}: ${score}/100 (threshold: ${threshold})`);
      }
    }

    // Check specific metrics
    for (const [metric, value] of Object.entries(metrics)) {
      const threshold = PERFORMANCE_THRESHOLDS[metric];
      if (threshold && value > threshold) {
        passed = false;
        failures.push(
          `${metric}: ${Math.round(value)}ms (threshold: ${threshold}ms)`
        );
      }
    }

    if (passed) {
      console.log('\n✅ All mobile performance thresholds passed!');
    } else {
      console.log('\n❌ Performance threshold failures:');
      failures.forEach(failure => console.log(`  - ${failure}`));
    }

    console.log(`\n📁 Reports saved to:`);
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  HTML: ${htmlPath}`);

    return {
      passed,
      scores,
      metrics,
      failures,
      reportPaths: { json: jsonPath, html: htmlPath },
    };
  } catch (error) {
    console.error('❌ Lighthouse audit failed:', error.message);
    throw error;
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

// CLI usage
if (require.main === module) {
  const url = process.argv[2] || 'http://localhost:3000';
  const outputPath = process.argv[3] || './lighthouse-results';

  runLighthouseMobile(url, outputPath)
    .then(results => {
      process.exit(results.passed ? 0 : 1);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runLighthouseMobile, PERFORMANCE_THRESHOLDS, MOBILE_CONFIG };
