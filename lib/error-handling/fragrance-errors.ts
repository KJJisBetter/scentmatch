/**
 * Fragrance Error Handling Utilities
 * Proper error handling for missing fragrance pages (SCE-63)
 * Spec: @.agent-os/specs/2025-08-22-beginner-experience-optimization/
 */

import { notFound, redirect } from 'next/navigation'

export interface FragranceErrorInfo {
  type: 'not_found' | 'invalid_id' | 'api_error' | 'network_error' | 'server_error'
  fragranceId: string
  message: string
  suggestedAction: 'show_404' | 'redirect_search' | 'redirect_browse' | 'retry'
  metadata?: Record<string, any>
}

export interface FragranceValidationResult {
  isValid: boolean
  normalizedId: string
  issues: string[]
  corrections?: {
    suggestedId: string
    confidence: number
    reason: string
  }[]
}

/**
 * Validates and normalizes fragrance ID format
 */
export function validateFragranceId(id: string | null | undefined): FragranceValidationResult {
  const issues: string[] = []
  let isValid = true
  let normalizedId = ''
  const corrections: Array<{ suggestedId: string; confidence: number; reason: string }> = []

  // Check for null/undefined/empty
  if (!id || typeof id !== 'string') {
    return {
      isValid: false,
      normalizedId: '',
      issues: ['ID is null, undefined, or not a string'],
      corrections: [
        { suggestedId: 'browse', confidence: 0.9, reason: 'Redirect to browse page' }
      ]
    }
  }

  // Normalize the ID
  normalizedId = id.toLowerCase().trim()

  // Check for empty after trimming
  if (normalizedId === '') {
    return {
      isValid: false, 
      normalizedId: '',
      issues: ['ID is empty after normalization'],
      corrections: [
        { suggestedId: 'browse', confidence: 0.9, reason: 'Redirect to browse page' }
      ]
    }
  }

  // Check for valid format (should be kebab-case with underscores for brand-fragrance separator)
  if (!/^[a-z0-9\-_]+$/.test(normalizedId)) {
    isValid = false
    issues.push('ID contains invalid characters (should be lowercase letters, numbers, hyphens, and underscores only)')
    
    // Try to fix common issues (preserve underscores for brand-fragrance separators)
    const suggested = normalizedId
      .replace(/[^a-z0-9\-_\s]/g, '') // Remove invalid chars but keep underscores
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/--+/g, '-') // Remove multiple hyphens
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    
    if (suggested && suggested !== normalizedId) {
      corrections.push({
        suggestedId: suggested,
        confidence: 0.8,
        reason: 'Normalized to valid format'
      })
    }
  }

  // Check for suspicious values
  const suspiciousValues = ['null', 'undefined', 'none', 'empty', 'test', '0', '1']
  if (suspiciousValues.includes(normalizedId)) {
    isValid = false
    issues.push(`ID "${normalizedId}" appears to be a placeholder or test value`)
    corrections.push({
      suggestedId: 'browse',
      confidence: 0.9,
      reason: 'Redirect to browse for placeholder values'
    })
  }

  // Check for extremely long IDs
  if (normalizedId.length > 100) {
    isValid = false
    issues.push('ID is too long (>100 characters)')
  }

  // Check for extremely short IDs
  if (normalizedId.length < 3) {
    isValid = false
    issues.push('ID is too short (<3 characters)')
    corrections.push({
      suggestedId: 'browse',
      confidence: 0.7,
      reason: 'Short IDs are likely invalid'
    })
  }

  return {
    isValid,
    normalizedId,
    issues,
    corrections: corrections.length > 0 ? corrections : undefined
  }
}

/**
 * Creates detailed error info for fragrance errors
 */
export function createFragranceErrorInfo(
  fragranceId: string,
  error: any
): FragranceErrorInfo {
  const baseInfo = {
    fragranceId,
    metadata: {
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'server'
    }
  }

  // Analyze error type
  if (error?.status === 404 || error?.message?.includes('not found')) {
    return {
      ...baseInfo,
      type: 'not_found',
      message: `Fragrance "${fragranceId}" was not found in our database`,
      suggestedAction: 'show_404'
    }
  }

  if (error?.status >= 500) {
    return {
      ...baseInfo,
      type: 'server_error', 
      message: 'Server error while fetching fragrance data',
      suggestedAction: 'retry'
    }
  }

  if (error?.name === 'TypeError' || error?.message?.includes('fetch')) {
    return {
      ...baseInfo,
      type: 'network_error',
      message: 'Network error while loading fragrance data', 
      suggestedAction: 'retry'
    }
  }

  if (error?.message?.includes('Invalid') || error?.message?.includes('validation')) {
    return {
      ...baseInfo,
      type: 'invalid_id',
      message: `Invalid fragrance ID format: "${fragranceId}"`,
      suggestedAction: 'redirect_search'
    }
  }

  // Generic error
  return {
    ...baseInfo,
    type: 'api_error',
    message: `Failed to load fragrance "${fragranceId}"`,
    suggestedAction: 'show_404'
  }
}

/**
 * Handles fragrance errors with appropriate actions
 */
export function handleFragranceError(errorInfo: FragranceErrorInfo): never {
  // Log error for monitoring
  console.error('Fragrance Error:', {
    type: errorInfo.type,
    id: errorInfo.fragranceId,
    message: errorInfo.message,
    timestamp: errorInfo.metadata?.timestamp
  })

  // Take appropriate action based on error type
  switch (errorInfo.suggestedAction) {
    case 'redirect_search':
      // Redirect to search with the fragrance ID as query
      redirect(`/browse?search=${encodeURIComponent(errorInfo.fragranceId)}`)
      break
      
    case 'redirect_browse':
      // Redirect to general browse page
      redirect('/browse')
      break
      
    case 'show_404':
    default:
      // Show 404 page
      notFound()
  }
}

/**
 * Main error handling function for fragrance pages
 */
export function handleFragrancePageError(
  fragranceId: string | null | undefined,
  error?: any
): never {
  // First validate the ID format
  const validation = validateFragranceId(fragranceId)
  
  if (!validation.isValid) {
    // Try to use a suggested correction
    if (validation.corrections && validation.corrections.length > 0) {
      const bestCorrection = validation.corrections
        .sort((a, b) => b.confidence - a.confidence)[0]
      
      if (bestCorrection.confidence >= 0.8) {
        console.log(`Redirecting from "${fragranceId}" to "${bestCorrection.suggestedId}" (${bestCorrection.reason})`)
        
        if (bestCorrection.suggestedId === 'browse') {
          redirect('/browse')
        } else {
          redirect(`/fragrance/${bestCorrection.suggestedId}`)
        }
      }
    }
    
    // Create error info for invalid ID
    const errorInfo = createFragranceErrorInfo(
      fragranceId || 'invalid',
      new Error(`Invalid ID: ${validation.issues.join(', ')}`)
    )
    handleFragranceError(errorInfo)
  }

  // Handle API/fetch errors
  if (error) {
    const errorInfo = createFragranceErrorInfo(validation.normalizedId, error)
    handleFragranceError(errorInfo)
  }

  // If we get here, something went wrong
  notFound()
}

/**
 * Safe fragrance fetcher with error handling
 */
export async function safeFragranceFetch(id: string, baseUrl: string): Promise<{
  fragrance: any | null
  error: FragranceErrorInfo | null
}> {
  try {
    // Validate ID first
    const validation = validateFragranceId(id)
    if (!validation.isValid) {
      return {
        fragrance: null,
        error: createFragranceErrorInfo(id, new Error(`Invalid ID: ${validation.issues.join(', ')}`))
      }
    }

    const response = await fetch(`${baseUrl}/api/fragrances/${validation.normalizedId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
      ;(error as any).status = response.status
      
      return {
        fragrance: null,
        error: createFragranceErrorInfo(validation.normalizedId, error)
      }
    }

    const fragranceData = await response.json()
    
    // Validate response structure
    if (!fragranceData || !fragranceData.id) {
      return {
        fragrance: null,
        error: createFragranceErrorInfo(validation.normalizedId, new Error('Invalid API response structure'))
      }
    }

    return {
      fragrance: fragranceData,
      error: null
    }

  } catch (error: any) {
    return {
      fragrance: null,
      error: createFragranceErrorInfo(id, error)
    }
  }
}

/**
 * Check if route exists in the app directory
 */
export function routeExists(route: string, appDir: string = 'app'): boolean {
  try {
    // Convert route to file path
    const routePath = route === '/' ? 'page.tsx' : `${route}/page.tsx`
    const fullPath = path.join(process.cwd(), appDir, routePath)
    
    return fs.existsSync(fullPath)
  } catch {
    return false
  }
}

/**
 * Get suggestions for missing routes
 */
export function suggestAlternativeRoutes(missingRoute: string): string[] {
  const suggestions: string[] = []
  
  // Common route corrections
  const routeCorrections: Record<string, string[]> = {
    '/samples': ['/browse', '/quiz'],
    '/profile': ['/dashboard'],
    '/account': ['/dashboard'],
    '/settings': ['/dashboard'],
    '/login': ['/auth/login'],
    '/signup': ['/auth/signup'],
    '/register': ['/auth/signup'],
    '/fragrances': ['/browse'],
    '/perfumes': ['/browse'],
    '/scents': ['/browse']
  }

  if (routeCorrections[missingRoute]) {
    suggestions.push(...routeCorrections[missingRoute])
  }

  // If no specific corrections, suggest general alternatives
  if (suggestions.length === 0) {
    suggestions.push('/', '/browse', '/quiz')
  }

  return suggestions
}