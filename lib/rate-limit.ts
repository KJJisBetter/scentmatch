// Simple in-memory rate limiting for development
// In production, this should use Redis or a similar persistent store

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store (use Redis in production)
const store: RateLimitStore = {}

interface RateLimitOptions {
  key: string
  limit: number
  window: number // in milliseconds
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

export async function rateLimit({ key, limit, window }: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now()
  
  // Clean up expired entries
  for (const [k, v] of Object.entries(store)) {
    if (v.resetTime <= now) {
      delete store[k]
    }
  }
  
  // Get or create entry
  let entry = store[key]
  
  if (!entry || entry.resetTime <= now) {
    // Create new window
    entry = {
      count: 0,
      resetTime: now + window
    }
    store[key] = entry
  }
  
  // Increment counter
  entry.count++
  
  const success = entry.count <= limit
  const remaining = Math.max(0, limit - entry.count)
  
  return {
    success,
    remaining,
    resetTime: entry.resetTime
  }
}

// Clear all rate limit data (useful for testing)
export function clearRateLimitStore() {
  for (const key in store) {
    delete store[key]
  }
}

// Get current rate limit status without incrementing
export function getRateLimitStatus(key: string): RateLimitResult | null {
  const entry = store[key]
  
  if (!entry || entry.resetTime <= Date.now()) {
    return null
  }
  
  return {
    success: entry.count <= 5, // Default limit for status check
    remaining: Math.max(0, 5 - entry.count),
    resetTime: entry.resetTime
  }
}