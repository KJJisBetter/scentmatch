/**
 * Global Setup for End-to-End Frontend Verification
 * 
 * Prepares test environment and ensures all prerequisites are met
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up end-to-end verification environment...')
  
  // Launch browser for setup operations
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Wait for development server to be ready
    console.log('⏳ Waiting for development server...')
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    })
    console.log('✅ Development server is ready')

    // Check if database is accessible
    console.log('🗄️ Checking database connectivity...')
    try {
      // Try to access a development API endpoint to verify database
      const response = await page.goto('http://localhost:3000/api/health', {
        timeout: 10000
      })
      
      if (response && response.ok()) {
        console.log('✅ Database connectivity verified')
      } else {
        console.log('⚠️ Database health check unavailable - tests may have limited functionality')
      }
    } catch (error) {
      console.log('⚠️ Database connectivity check failed - proceeding with limited functionality')
    }

    // Verify essential page elements are working
    console.log('🔍 Verifying essential page elements...')
    await page.goto('http://localhost:3000')
    
    // Check for basic page structure
    const titlePresent = await page.locator('title').isVisible().catch(() => false)
    const navigationPresent = await page.locator('nav, header, .navigation').first().isVisible().catch(() => false)
    
    console.log(`✅ Page structure check: Title=${titlePresent}, Navigation=${navigationPresent}`)

    // Verify auth pages are accessible
    console.log('🔐 Verifying authentication pages...')
    await page.goto('http://localhost:3000/auth/login')
    const loginFormPresent = await page.locator('form').isVisible().catch(() => false)
    console.log(`✅ Login page accessible: ${loginFormPresent}`)

    await page.goto('http://localhost:3000/auth/signup')
    const signupFormPresent = await page.locator('form').isVisible().catch(() => false)
    console.log(`✅ Signup page accessible: ${signupFormPresent}`)

    console.log('🎉 Global setup completed successfully')

  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
}

export default globalSetup