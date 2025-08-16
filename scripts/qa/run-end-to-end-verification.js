#!/usr/bin/env node

/**
 * End-to-End Frontend UI Verification Runner
 * 
 * Executes comprehensive frontend verification per QA specifications
 * Validates complete user journey and platform integration
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuration
const CONFIG = {
  testFile: 'tests/qa/end-to-end-verification.test.ts',
  devServerPort: 3000,
  devServerUrl: 'http://localhost:3000',
  timeout: 30000, // 30 seconds for server startup
  outputDir: 'test-results',
  reportFile: 'end-to-end-verification-report.json'
}

class EndToEndVerificationRunner {
  constructor() {
    this.devServerProcess = null
    this.results = {
      timestamp: new Date().toISOString(),
      environment: 'development',
      testResults: [],
      performance: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    }
  }

  async run() {
    console.log('🚀 Starting End-to-End Frontend UI Verification')
    console.log('=' .repeat(60))

    try {
      // 1. Pre-flight checks
      await this.preFlightChecks()

      // 2. Start development server
      await this.startDevServer()

      // 3. Wait for server to be ready
      await this.waitForServer()

      // 4. Run end-to-end tests
      await this.runTests()

      // 5. Generate report
      await this.generateReport()

      console.log('\n🎉 End-to-End Verification Complete!')
      console.log(`📊 Results: ${this.results.summary.passed}/${this.results.summary.total} tests passed`)

    } catch (error) {
      console.error('❌ Verification failed:', error.message)
      process.exit(1)
    } finally {
      // 6. Cleanup
      await this.cleanup()
    }
  }

  async preFlightChecks() {
    console.log('\n🔍 Running pre-flight checks...')

    // Check if test file exists
    if (!fs.existsSync(CONFIG.testFile)) {
      throw new Error(`Test file not found: ${CONFIG.testFile}`)
    }
    console.log('✅ Test file found')

    // Check if Playwright is installed
    try {
      execSync('npx playwright --version', { stdio: 'pipe' })
      console.log('✅ Playwright installed')
    } catch {
      throw new Error('Playwright not installed. Run: npm install @playwright/test')
    }

    // Ensure output directory exists
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true })
      console.log('✅ Output directory created')
    }

    // Check environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.warn('⚠️  Supabase environment variables not set - some tests may fail')
    }

    console.log('✅ Pre-flight checks complete')
  }

  async startDevServer() {
    console.log('\n🏁 Starting development server...')

    return new Promise((resolve, reject) => {
      // Check if server is already running
      this.checkServerRunning()
        .then((running) => {
          if (running) {
            console.log('✅ Development server already running')
            resolve()
            return
          }

          // Start new server
          this.devServerProcess = spawn('npm', ['run', 'dev'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, PORT: CONFIG.devServerPort.toString() }
          })

          this.devServerProcess.stdout.on('data', (data) => {
            const output = data.toString()
            if (output.includes('Ready') || output.includes('started server')) {
              console.log('✅ Development server started')
              resolve()
            }
          })

          this.devServerProcess.stderr.on('data', (data) => {
            console.log('📝 Server log:', data.toString().trim())
          })

          this.devServerProcess.on('error', (error) => {
            reject(new Error(`Failed to start dev server: ${error.message}`))
          })

          // Timeout if server doesn't start
          setTimeout(() => {
            reject(new Error('Dev server startup timeout'))
          }, CONFIG.timeout)
        })
        .catch(reject)
    })
  }

  async checkServerRunning() {
    try {
      const fetch = (await import('node-fetch')).default
      const response = await fetch(CONFIG.devServerUrl, { timeout: 2000 })
      return response.ok
    } catch {
      return false
    }
  }

  async waitForServer() {
    console.log('\n⏳ Waiting for server to be ready...')
    
    const maxAttempts = 15
    const delay = 2000

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const fetch = (await import('node-fetch')).default
        const response = await fetch(CONFIG.devServerUrl, { timeout: 3000 })
        
        if (response.ok) {
          console.log('✅ Server is ready')
          return
        }
      } catch {
        // Server not ready yet
      }

      console.log(`🔄 Attempt ${attempt}/${maxAttempts} - waiting...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    throw new Error('Server failed to become ready within timeout period')
  }

  async runTests() {
    console.log('\n🧪 Running end-to-end verification tests...')

    try {
      // Run Playwright tests with detailed reporting
      const result = execSync(
        `npx playwright test ${CONFIG.testFile} --reporter=json --output=${CONFIG.outputDir}/playwright-results`,
        { 
          stdio: 'pipe',
          encoding: 'utf8',
          timeout: 300000 // 5 minutes
        }
      )

      console.log('✅ Test execution completed')
      
      // Parse results if available
      try {
        const resultsPath = path.join(CONFIG.outputDir, 'playwright-results', 'results.json')
        if (fs.existsSync(resultsPath)) {
          const testResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'))
          this.processTestResults(testResults)
        }
      } catch (error) {
        console.log('⚠️  Could not parse test results:', error.message)
      }

    } catch (error) {
      console.log('❌ Some tests failed - checking results...')
      
      // Even if tests failed, try to process results
      try {
        const resultsPath = path.join(CONFIG.outputDir, 'playwright-results', 'results.json')
        if (fs.existsSync(resultsPath)) {
          const testResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'))
          this.processTestResults(testResults)
        }
      } catch (parseError) {
        console.log('⚠️  Could not parse test results after failure')
      }

      // Don't throw here - let report generation happen
    }
  }

  processTestResults(testResults) {
    console.log('\n📊 Processing test results...')

    if (testResults.suites) {
      this.results.testResults = testResults.suites.map(suite => ({
        title: suite.title,
        tests: suite.tests ? suite.tests.map(test => ({
          title: test.title,
          status: test.status,
          duration: test.duration
        })) : []
      }))

      // Calculate summary
      testResults.suites.forEach(suite => {
        if (suite.tests) {
          suite.tests.forEach(test => {
            this.results.summary.total++
            if (test.status === 'passed') {
              this.results.summary.passed++
            } else if (test.status === 'failed') {
              this.results.summary.failed++
            } else if (test.status === 'skipped') {
              this.results.summary.skipped++
            }
          })
        }
      })
    }

    console.log(`✅ Processed ${this.results.summary.total} test results`)
  }

  async generateReport() {
    console.log('\n📝 Generating verification report...')

    const report = {
      ...this.results,
      platformStatus: this.determinePlatformStatus(),
      recommendations: this.generateRecommendations(),
      nextSteps: this.generateNextSteps()
    }

    // Write JSON report
    const reportPath = path.join(CONFIG.outputDir, CONFIG.reportFile)
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    // Write human-readable summary
    const summaryPath = path.join(CONFIG.outputDir, 'verification-summary.md')
    const summaryContent = this.generateSummaryMarkdown(report)
    fs.writeFileSync(summaryPath, summaryContent)

    console.log(`✅ Reports generated:`)
    console.log(`   📄 JSON: ${reportPath}`)
    console.log(`   📄 Summary: ${summaryPath}`)

    // Display summary
    console.log('\n' + '='.repeat(60))
    console.log('📋 VERIFICATION SUMMARY')
    console.log('=' .repeat(60))
    console.log(summaryContent)
  }

  determinePlatformStatus() {
    const passRate = this.results.summary.total > 0 
      ? (this.results.summary.passed / this.results.summary.total) * 100 
      : 0

    if (passRate >= 95 && this.results.summary.failed === 0) {
      return '✅ PRODUCTION READY'
    } else if (passRate >= 80) {
      return '⚠️ CONDITIONAL READY'
    } else {
      return '❌ NOT READY'
    }
  }

  generateRecommendations() {
    const recommendations = []

    if (this.results.summary.failed > 0) {
      recommendations.push('Fix failing tests before user testing')
    }

    if (this.results.summary.passed / this.results.summary.total < 0.95) {
      recommendations.push('Improve test coverage to reach 95% pass rate')
    }

    recommendations.push('Monitor Core Web Vitals in production')
    recommendations.push('Set up continuous testing pipeline')

    return recommendations
  }

  generateNextSteps() {
    const status = this.determinePlatformStatus()
    
    if (status.includes('PRODUCTION READY')) {
      return [
        'Platform is ready for user testing',
        'Deploy to staging environment',
        'Conduct final security review',
        'Prepare production deployment'
      ]
    } else if (status.includes('CONDITIONAL READY')) {
      return [
        'Address non-critical issues',
        'Run verification again',
        'Consider limited user testing',
        'Monitor closely in production'
      ]
    } else {
      return [
        'Fix critical failing tests',
        'Re-run verification suite',
        'Address performance issues',
        'Do not deploy until tests pass'
      ]
    }
  }

  generateSummaryMarkdown(report) {
    return `
# End-to-End Frontend Verification Report

**Date:** ${report.timestamp}
**Environment:** ${report.environment}
**Platform Status:** ${report.platformStatus}

## Test Results Summary

- **Total Tests:** ${report.summary.total}
- **Passed:** ${report.summary.passed} ✅
- **Failed:** ${report.summary.failed} ❌
- **Skipped:** ${report.summary.skipped} ⏭️
- **Pass Rate:** ${report.summary.total > 0 ? Math.round((report.summary.passed / report.summary.total) * 100) : 0}%

## Platform Status Assessment

${report.platformStatus}

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps

${report.nextSteps.map(step => `1. ${step}`).join('\n')}

## Detailed Results

${report.testResults.map(suite => `
### ${suite.title}

${suite.tests.map(test => `- ${test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️'} ${test.title} (${test.duration || 0}ms)`).join('\n')}
`).join('\n')}

---

*Generated by ScentMatch End-to-End Verification System*
    `.trim()
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...')

    if (this.devServerProcess) {
      console.log('🛑 Stopping development server...')
      this.devServerProcess.kill('SIGTERM')
      
      // Give it time to shutdown gracefully
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (!this.devServerProcess.killed) {
        this.devServerProcess.kill('SIGKILL')
      }
      
      console.log('✅ Development server stopped')
    }
  }
}

// Run the verification if called directly
if (require.main === module) {
  const runner = new EndToEndVerificationRunner()
  runner.run().catch(error => {
    console.error('💥 Verification runner failed:', error)
    process.exit(1)
  })
}

module.exports = EndToEndVerificationRunner