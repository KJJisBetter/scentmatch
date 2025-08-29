import { Ratelimit } from '@upstash/ratelimit';
import { headers } from 'next/headers';
import { securityLogger } from '@/lib/security/logger';

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // Authentication endpoints
  auth_login: { requests: 5, window: '15m' as const }, // 5 attempts per 15 minutes
  auth_signup: { requests: 3, window: '15m' as const }, // 3 signups per 15 minutes
  auth_reset: { requests: 3, window: '15m' as const }, // 3 reset attempts per 15 minutes

  // Search endpoints
  search: { requests: 60, window: '1m' as const }, // 60 searches per minute
  search_suggestions: { requests: 30, window: '1m' as const }, // 30 suggestions per minute

  // AI/Quiz endpoints (resource-intensive)
  quiz_analyze: { requests: 10, window: '1m' as const }, // 10 quiz analyses per minute
  recommendations: { requests: 20, window: '1m' as const }, // 20 recommendations per minute

  // Collection/CRUD operations
  collection: { requests: 30, window: '1m' as const }, // 30 collection ops per minute
  wishlist: { requests: 30, window: '1m' as const }, // 30 wishlist ops per minute

  // General API endpoints
  api_general: { requests: 100, window: '1m' as const }, // 100 general API calls per minute

  // Data quality/reporting (stricter limits)
  data_quality: { requests: 5, window: '1m' as const }, // 5 data quality reports per minute
  missing_products: { requests: 10, window: '1m' as const }, // 10 missing product reports per minute
};

// Simple in-memory rate limiting for development
interface MemoryRateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const memoryStore: MemoryRateLimitStore = {};

// Simple in-memory rate limiter
function createSimpleRateLimiter(limit: number, windowMs: number) {
  return {
    limit: async (key: string) => {
      const now = Date.now();

      // Clean up expired entries
      for (const [k, v] of Object.entries(memoryStore)) {
        if (v.resetTime <= now) {
          delete memoryStore[k];
        }
      }

      // Get or create entry
      let entry = memoryStore[key];

      if (!entry || entry.resetTime <= now) {
        // Create new window
        entry = {
          count: 0,
          resetTime: now + windowMs,
        };
        memoryStore[key] = entry;
      }

      // Increment counter
      entry.count++;

      const success = entry.count <= limit;
      const remaining = Math.max(0, limit - entry.count);

      return {
        success,
        remaining,
        reset: entry.resetTime,
        limit,
      };
    },
  };
}

// Create rate limiters
const createRateLimiter = (requests: number, window: string) => {
  // Convert window string to milliseconds
  const windowMs = window === '1m' ? 60000 : window === '15m' ? 900000 : 60000;

  // If Redis is not available, use simple in-memory storage for development
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    securityLogger.warn(
      'Redis not configured - using in-memory rate limiting (development only)'
    );

    return createSimpleRateLimiter(requests, windowMs);
  }

  // Production Redis rate limiter
  return new Ratelimit({
    redis: {
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    },
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: 'scentmatch:ratelimit',
  });
};

// Rate limiters for each endpoint type
export const rateLimiters = {
  auth_login: createRateLimiter(
    RATE_LIMITS.auth_login.requests,
    RATE_LIMITS.auth_login.window
  ),
  auth_signup: createRateLimiter(
    RATE_LIMITS.auth_signup.requests,
    RATE_LIMITS.auth_signup.window
  ),
  auth_reset: createRateLimiter(
    RATE_LIMITS.auth_reset.requests,
    RATE_LIMITS.auth_reset.window
  ),
  search: createRateLimiter(
    RATE_LIMITS.search.requests,
    RATE_LIMITS.search.window
  ),
  search_suggestions: createRateLimiter(
    RATE_LIMITS.search_suggestions.requests,
    RATE_LIMITS.search_suggestions.window
  ),
  quiz_analyze: createRateLimiter(
    RATE_LIMITS.quiz_analyze.requests,
    RATE_LIMITS.quiz_analyze.window
  ),
  recommendations: createRateLimiter(
    RATE_LIMITS.recommendations.requests,
    RATE_LIMITS.recommendations.window
  ),
  collection: createRateLimiter(
    RATE_LIMITS.collection.requests,
    RATE_LIMITS.collection.window
  ),
  wishlist: createRateLimiter(
    RATE_LIMITS.wishlist.requests,
    RATE_LIMITS.wishlist.window
  ),
  api_general: createRateLimiter(
    RATE_LIMITS.api_general.requests,
    RATE_LIMITS.api_general.window
  ),
  data_quality: createRateLimiter(
    RATE_LIMITS.data_quality.requests,
    RATE_LIMITS.data_quality.window
  ),
  missing_products: createRateLimiter(
    RATE_LIMITS.missing_products.requests,
    RATE_LIMITS.missing_products.window
  ),
};

export type RateLimitType = keyof typeof rateLimiters;

// Enhanced rate limit result interface
export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
  used: number;
  limitType: RateLimitType;
}

// Get client identifier (IP + user agent hash for better uniqueness)
export async function getClientIdentifier(request?: Request): Promise<string> {
  try {
    if (request) {
      // For API routes with request object
      const ip =
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        'unknown';
      const userAgent = request.headers.get('user-agent') || '';
      return `${ip}:${hashString(userAgent)}`;
    } else {
      // For Server Actions using Next.js headers
      const headersList = await headers();
      const ip =
        headersList.get('x-forwarded-for') ||
        headersList.get('x-real-ip') ||
        headersList.get('cf-connecting-ip') ||
        'unknown';
      const userAgent = headersList.get('user-agent') || '';
      return `${ip}:${hashString(userAgent)}`;
    }
  } catch (error) {
    securityLogger.warn('Failed to get client identifier', { error });
    return 'unknown';
  }
}

// Simple hash function for user agent
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Enhanced rate limiting function
export async function checkRateLimit(
  limitType: RateLimitType,
  identifier?: string,
  request?: Request
): Promise<RateLimitResult> {
  try {
    const clientId = identifier || (await getClientIdentifier(request));
    const rateLimiter = rateLimiters[limitType];

    if (!rateLimiter) {
      throw new Error(`Invalid rate limit type: ${limitType}`);
    }

    const key = `${limitType}:${clientId}`;
    const result = await rateLimiter.limit(key);

    return {
      success: result.success,
      remaining: result.remaining,
      resetTime: result.reset,
      limit: result.limit,
      used: result.limit - result.remaining,
      limitType,
    };
  } catch (error) {
    securityLogger.error(`Rate limit check failed for ${limitType}`, { error });

    // Fail open - allow request if rate limiting fails
    return {
      success: true,
      remaining: 999,
      resetTime: Date.now() + 60000,
      limit: 999,
      used: 0,
      limitType,
    };
  }
}

// Middleware helper for API routes
export async function withRateLimit(
  request: Request,
  limitType: RateLimitType,
  options?: {
    identifier?: string;
    errorMessage?: string;
  }
) {
  const result = await checkRateLimit(limitType, options?.identifier, request);

  if (!result.success) {
    const resetTimeFormatted = new Date(result.resetTime).toISOString();
    const errorMessage =
      options?.errorMessage || 'Too many requests. Please try again later.';

    // Log rate limit violation for security monitoring
    securityLogger.rateLimit(
      limitType,
      options?.identifier || 'unknown',
      result.limit,
      {
        used: result.used,
        resetTime: resetTimeFormatted,
      }
    );

    return {
      blocked: true,
      response: new Response(
        JSON.stringify({
          error: errorMessage,
          rate_limit: {
            limit: result.limit,
            used: result.used,
            remaining: result.remaining,
            reset_time: resetTimeFormatted,
            retry_after: Math.ceil((result.resetTime - Date.now()) / 1000),
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil(
              (result.resetTime - Date.now()) / 1000
            ).toString(),
          },
        }
      ),
    };
  }

  return {
    blocked: false,
    result,
  };
}

// Server Action helper
export async function checkServerActionRateLimit(
  limitType: RateLimitType,
  identifier?: string
): Promise<{ success: boolean; error?: string; details?: any }> {
  const result = await checkRateLimit(limitType, identifier);

  if (!result.success) {
    const resetTimeFormatted = new Date(result.resetTime).toISOString();
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

    return {
      success: false,
      error: 'Too many requests. Please try again later.',
      details: {
        limit: result.limit,
        used: result.used,
        remaining: result.remaining,
        reset_time: resetTimeFormatted,
        retry_after: retryAfter,
      },
    };
  }

  return { success: true };
}

// Clean up old in-memory entries (only for development)
export function clearMemoryRateLimitStore() {
  for (const key in memoryStore) {
    delete memoryStore[key];
  }
}

// Automatic cleanup for memory store
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of Object.entries(memoryStore)) {
        if (entry.resetTime <= now) {
          delete memoryStore[key];
        }
      }
    },
    5 * 60 * 1000
  ); // Clean every 5 minutes
}
