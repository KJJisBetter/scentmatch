/**
 * Route and Link Audit Script
 * Comprehensive audit of internal links and routes for SCE-63
 * Spec: @.agent-os/specs/2025-08-22-beginner-experience-optimization/
 */

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

interface RouteAuditResult {
  existingRoutes: string[]
  referencedRoutes: string[]
  missingRoutes: string[]
  duplicateRoutes: string[]
  potentialIssues: Array<{
    file: string
    line: number
    route: string
    issue: string
    severity: 'high' | 'medium' | 'low'
  }>
  linkReferences: Array<{
    file: string
    line: number
    route: string
    context: string
  }>
  routerReferences: Array<{
    file: string
    line: number
    route: string
    method: string
    context: string
  }>
}

/**
 * Scan app directory for existing routes
 */
async function scanExistingRoutes(appDir: string): Promise<string[]> {
  const routes: string[] = []
  
  try {
    // Find all page.tsx files
    const pageFiles = await glob('**/page.tsx', { cwd: appDir })
    
    for (const file of pageFiles) {
      // Convert file path to route
      let route = '/' + file.replace('/page.tsx', '').replace('page.tsx', '')
      
      // Handle root page
      if (route === '/') {
        routes.push('/')
      } else {
        // Remove trailing slash
        route = route.replace(/\/$/, '')
        routes.push(route)
      }
    }
    
    // Also check for route groups and special files
    const specialFiles = await glob('**/{layout,loading,error,not-found}.tsx', { cwd: appDir })
    console.log(`Found ${specialFiles.length} special route files`)
    
  } catch (error) {
    console.error('Error scanning routes:', error)
  }
  
  return routes.sort()
}

/**
 * Scan codebase for Link component href references
 */
async function scanLinkReferences(projectRoot: string): Promise<Array<{
  file: string
  line: number
  route: string
  context: string
}>> {
  const linkReferences: Array<{
    file: string
    line: number
    route: string
    context: string
  }> = []
  
  try {
    // Find all TSX and TS files
    const files = await glob('**/*.{tsx,ts}', { 
      cwd: projectRoot,
      ignore: ['node_modules/**', '.next/**', 'dist/**', '**/*.test.{ts,tsx}']
    })
    
    for (const file of files) {
      const filePath = path.join(projectRoot, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')
      
      lines.forEach((line, index) => {
        // Look for Link href patterns
        const linkMatches = line.match(/href=['"`]([^'"`]+)['"`]/g)
        if (linkMatches) {
          linkMatches.forEach(match => {
            const route = match.match(/href=['"`]([^'"`]+)['"`]/)?.[1]
            if (route && route.startsWith('/') && !route.startsWith('//')) {
              linkReferences.push({
                file,
                line: index + 1,
                route,
                context: line.trim()
              })
            }
          })
        }

        // Look for router.push patterns
        const routerMatches = line.match(/\.push\(['"`]([^'"`]+)['"`]\)/g)
        if (routerMatches) {
          routerMatches.forEach(match => {
            const route = match.match(/\.push\(['"`]([^'"`]+)['"`]\)/)?.[1]
            if (route && route.startsWith('/') && !route.startsWith('//')) {
              linkReferences.push({
                file,
                line: index + 1,
                route,
                context: line.trim()
              })
            }
          })
        }

        // Look for handleNavigation calls
        const navMatches = line.match(/handleNavigation\(['"`]([^'"`]+)['"`]\)/g)
        if (navMatches) {
          navMatches.forEach(match => {
            const route = match.match(/handleNavigation\(['"`]([^'"`]+)['"`]\)/)?.[1]
            if (route && route.startsWith('/') && !route.startsWith('//')) {
              linkReferences.push({
                file,
                line: index + 1,
                route,
                context: line.trim()
              })
            }
          })
        }
      })
    }
  } catch (error) {
    console.error('Error scanning link references:', error)
  }
  
  return linkReferences
}

/**
 * Analyze route consistency and identify issues
 */
function analyzeRoutes(existingRoutes: string[], linkReferences: Array<any>): {
  missingRoutes: string[]
  potentialIssues: Array<{
    file: string
    line: number
    route: string
    issue: string
    severity: 'high' | 'medium' | 'low'
  }>
} {
  const referencedRoutes = [...new Set(linkReferences.map(ref => ref.route))]
  const missingRoutes: string[] = []
  const potentialIssues: Array<{
    file: string
    line: number
    route: string
    issue: string
    severity: 'high' | 'medium' | 'low'
  }> = []

  // Find routes referenced but not existing
  referencedRoutes.forEach(route => {
    // Handle dynamic routes
    const isDynamic = route.includes('[') && route.includes(']')
    const routeExists = isDynamic || existingRoutes.includes(route)
    
    if (!routeExists) {
      missingRoutes.push(route)
      
      // Find all references to this missing route
      const references = linkReferences.filter(ref => ref.route === route)
      references.forEach(ref => {
        potentialIssues.push({
          file: ref.file,
          line: ref.line,
          route,
          issue: 'Route referenced but does not exist',
          severity: 'high'
        })
      })
    }
  })

  // Check for common problematic patterns
  linkReferences.forEach(ref => {
    const { route, file, line } = ref
    
    // Check for empty routes
    if (!route || route === '/') {
      // Skip root route
      return
    }
    
    // Check for malformed routes
    if (route.includes('//')) {
      potentialIssues.push({
        file,
        line,
        route,
        issue: 'Double slash in URL',
        severity: 'medium'
      })
    }
    
    if (route.endsWith('/') && route !== '/') {
      potentialIssues.push({
        file,
        line,
        route,
        issue: 'Unnecessary trailing slash',
        severity: 'low'
      })
    }
    
    if (route.includes(' ')) {
      potentialIssues.push({
        file,
        line,
        route,
        issue: 'Space in URL (should be encoded)',
        severity: 'high'
      })
    }
    
    if (/[A-Z]/.test(route)) {
      potentialIssues.push({
        file,
        line,
        route,
        issue: 'Uppercase characters in URL',
        severity: 'medium'
      })
    }

    // Check for potentially problematic dynamic routes
    if (route.includes('undefined') || route.includes('null')) {
      potentialIssues.push({
        file,
        line,
        route,
        issue: 'Route contains undefined/null value',
        severity: 'high'
      })
    }
  })

  return { missingRoutes, potentialIssues }
}

/**
 * Run comprehensive route audit
 */
async function auditRoutes(): Promise<RouteAuditResult> {
  console.log('🔍 Starting comprehensive route audit...')
  
  const projectRoot = process.cwd()
  const appDir = path.join(projectRoot, 'app')
  
  console.log('📂 Scanning existing routes...')
  const existingRoutes = await scanExistingRoutes(appDir)
  
  console.log('🔗 Scanning link references...')  
  const linkReferences = await scanLinkReferences(projectRoot)
  
  console.log('📊 Analyzing route consistency...')
  const { missingRoutes, potentialIssues } = analyzeRoutes(existingRoutes, linkReferences)
  
  // Extract unique referenced routes
  const referencedRoutes = [...new Set(linkReferences.map(ref => ref.route))]
  
  // Find duplicate routes (same route referenced multiple times)
  const routeCounts: Record<string, number> = {}
  referencedRoutes.forEach(route => {
    routeCounts[route] = (routeCounts[route] || 0) + 1
  })
  
  const duplicateRoutes = Object.entries(routeCounts)
    .filter(([, count]) => count > 3) // More than 3 references might indicate duplication
    .map(([route]) => route)

  // Separate router references from link references
  const routerReferences = linkReferences.filter(ref => 
    ref.context.includes('.push(') || ref.context.includes('handleNavigation')
  ).map(ref => ({
    ...ref,
    method: ref.context.includes('.push(') ? 'router.push' : 'handleNavigation'
  }))

  return {
    existingRoutes,
    referencedRoutes,
    missingRoutes,
    duplicateRoutes,
    potentialIssues,
    linkReferences: linkReferences.filter(ref => ref.context.includes('href=')),
    routerReferences
  }
}

/**
 * Generate audit report
 */
function generateRouteAuditReport(result: RouteAuditResult): void {
  console.log('\n' + '='.repeat(60))
  console.log('📋 ROUTE AUDIT REPORT')
  console.log('='.repeat(60))
  
  console.log('\n📈 ROUTE STATISTICS')
  console.log('─'.repeat(30))
  console.log(`Existing Routes: ${result.existingRoutes.length}`)
  console.log(`Referenced Routes: ${result.referencedRoutes.length}`)
  console.log(`Missing Routes: ${result.missingRoutes.length}`)
  console.log(`Link References: ${result.linkReferences.length}`)
  console.log(`Router References: ${result.routerReferences.length}`)
  console.log(`Potential Issues: ${result.potentialIssues.length}`)
  
  console.log('\n📂 EXISTING ROUTES')
  console.log('─'.repeat(30))
  result.existingRoutes.forEach(route => {
    console.log(`  ✅ ${route}`)
  })
  
  if (result.missingRoutes.length > 0) {
    console.log('\n⚠️  MISSING ROUTES')
    console.log('─'.repeat(30))
    result.missingRoutes.forEach(route => {
      const referenceCount = result.linkReferences.filter(ref => ref.route === route).length
      console.log(`  ❌ ${route} (${referenceCount} references)`)
    })
  }
  
  if (result.duplicateRoutes.length > 0) {
    console.log('\n🔄 FREQUENTLY REFERENCED ROUTES')
    console.log('─'.repeat(30))
    result.duplicateRoutes.forEach(route => {
      const count = result.linkReferences.filter(ref => ref.route === route).length
      console.log(`  🔗 ${route} (${count} references)`)
    })
  }
  
  if (result.potentialIssues.length > 0) {
    console.log('\n🚨 POTENTIAL ISSUES')
    console.log('─'.repeat(30))
    
    const issuesBySeverity = {
      high: result.potentialIssues.filter(i => i.severity === 'high'),
      medium: result.potentialIssues.filter(i => i.severity === 'medium'), 
      low: result.potentialIssues.filter(i => i.severity === 'low')
    }

    Object.entries(issuesBySeverity).forEach(([severity, issues]) => {
      if (issues.length > 0) {
        console.log(`\n${severity.toUpperCase()} PRIORITY:`)
        issues.slice(0, 10).forEach(issue => {
          console.log(`  📍 ${issue.file}:${issue.line}`)
          console.log(`      Route: ${issue.route}`)
          console.log(`      Issue: ${issue.issue}`)
        })
        if (issues.length > 10) {
          console.log(`      ... and ${issues.length - 10} more ${severity} priority issues`)
        }
      }
    })
  }
  
  if (result.linkReferences.length > 0) {
    console.log('\n🔗 SAMPLE LINK REFERENCES')
    console.log('─'.repeat(30))
    result.linkReferences.slice(0, 5).forEach(ref => {
      console.log(`  📁 ${ref.file}:${ref.line}`)
      console.log(`      → ${ref.route}`)
      console.log(`      Context: ${ref.context.substring(0, 60)}...`)
    })
    
    if (result.linkReferences.length > 5) {
      console.log(`      ... and ${result.linkReferences.length - 5} more link references`)
    }
  }
  
  console.log('\n📊 RECOMMENDATIONS')
  console.log('─'.repeat(30))
  
  if (result.missingRoutes.length > 0) {
    console.log(`1. Create ${result.missingRoutes.length} missing route pages`)
    console.log(`2. Add redirects for legacy/alternative URLs`)
  }
  
  if (result.potentialIssues.some(i => i.severity === 'high')) {
    console.log(`3. Fix ${result.potentialIssues.filter(i => i.severity === 'high').length} high-priority route issues`)
  }
  
  if (result.duplicateRoutes.length > 0) {
    console.log(`4. Review ${result.duplicateRoutes.length} heavily referenced routes for optimization`)
  }
  
  console.log('5. Implement route validation in CI/CD pipeline')
  console.log('6. Add automated link checking to prevent future issues')
  
  const overallHealth = result.missingRoutes.length === 0 && 
                       result.potentialIssues.filter(i => i.severity === 'high').length === 0
                       ? 'GOOD' : 'NEEDS_ATTENTION'
  
  console.log(`\n🎯 OVERALL ROUTE HEALTH: ${overallHealth}`)
  
  console.log('\n' + '='.repeat(60))
}

/**
 * Check specific route patterns for common issues
 */
function checkRoutePatterns(route: string): Array<{ issue: string; severity: 'high' | 'medium' | 'low' }> {
  const issues: Array<{ issue: string; severity: 'high' | 'medium' | 'low' }> = []
  
  // Check for API routes in client code (potential issue)
  if (route.startsWith('/api/')) {
    issues.push({ issue: 'API route used in client navigation', severity: 'medium' })
  }
  
  // Check for external URLs mistakenly treated as internal
  if (route.includes('http')) {
    issues.push({ issue: 'External URL treated as internal route', severity: 'high' })
  }
  
  // Check for file extensions in routes
  if (route.includes('.')) {
    issues.push({ issue: 'File extension in route URL', severity: 'medium' })
  }
  
  // Check for query parameters in hardcoded routes
  if (route.includes('?')) {
    issues.push({ issue: 'Query parameters in hardcoded route', severity: 'low' })
  }
  
  // Check for fragment identifiers
  if (route.includes('#')) {
    issues.push({ issue: 'Fragment identifier in route', severity: 'low' })
  }
  
  return issues
}

/**
 * Validate route against Next.js conventions
 */
function validateNextJSRoute(route: string): boolean {
  // Should start with /
  if (!route.startsWith('/')) return false
  
  // Should not have double slashes
  if (route.includes('//')) return false
  
  // Should use kebab-case
  if (!/^\/[a-z0-9\-\/\[\]]*$/.test(route)) return false
  
  // Should not end with slash (except root)
  if (route !== '/' && route.endsWith('/')) return false
  
  return true
}

async function main(): Promise<void> {
  try {
    console.log('🚀 Starting route audit...')
    
    const result = await auditRoutes()
    generateRouteAuditReport(result)
    
    // Exit with error code if critical issues found
    const criticalIssues = result.potentialIssues.filter(i => i.severity === 'high').length
    const missingRoutes = result.missingRoutes.length
    
    if (criticalIssues > 0 || missingRoutes > 0) {
      console.error(`\n❌ Audit found ${criticalIssues} critical issues and ${missingRoutes} missing routes`)
      process.exit(1)
    }
    
    console.log('\n✅ Route audit completed successfully')
    
  } catch (error) {
    console.error('❌ Route audit failed:', error)
    process.exit(1)
  }
}

// Run audit if called directly
if (require.main === module) {
  main()
}

export { auditRoutes, generateRouteAuditReport, validateNextJSRoute }