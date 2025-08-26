/**
 * Production Security Configuration
 *
 * Centralized security settings for production deployment
 */

export const SECURITY_CONFIG = {
  // Environment detection
  isProduction: process.env.NODE_ENV === 'production',
  isPreview: process.env.VERCEL_ENV === 'preview',
  isDevelopment: process.env.NODE_ENV === 'development',

  // Authentication settings
  auth: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    refreshTokenRotation: true,
    requireEmailVerification: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Rate limiting (requests per minute)
  rateLimits: {
    // Authentication endpoints
    auth_login: { requests: 5, window: '15m' },
    auth_signup: { requests: 3, window: '15m' },
    auth_reset: { requests: 3, window: '15m' },

    // API endpoints
    search: { requests: 60, window: '1m' },
    quiz_analyze: { requests: 10, window: '1m' },
    recommendations: { requests: 20, window: '1m' },

    // General API
    api_general: { requests: 100, window: '1m' },
  },

  // Content Security Policy
  csp: {
    // Production CSP - Maximum Security
    production: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: [
        "'self'",
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://api.openai.com',
        'https://api.voyageai.com',
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: true,
    },

    // Preview CSP - Balanced Security
    preview: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        'https://vercel.live',
        'https://va.vercel-scripts.com',
      ],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: [
        "'self'",
        'https://*.supabase.co',
        'https://vercel.live',
        'https://va.vercel-scripts.com',
        'wss://*.supabase.co',
      ],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },

  // Security headers
  headers: {
    // Always set these headers
    common: {
      'X-DNS-Prefetch-Control': 'on',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy':
        'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    },

    // Production-only headers
    production: {
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '0', // Disable legacy XSS filter
      'Strict-Transport-Security':
        'max-age=63072000; includeSubDomains; preload',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Origin-Agent-Cluster': '?1',
    },
  },

  // Input validation rules
  validation: {
    maxStringLength: 1000,
    maxArrayLength: 20,
    maxQueryLength: 200,
    allowedQuestionIds: [
      'gender_preference',
      'experience_level',
      'style',
      'occasions',
      'preferences',
      'intensity',
      'budget',
      'scent_preferences_enthusiast',
      'personality_style',
      'occasions_enthusiast',
      'seasons_vibe',
      'scent_preferences_beginner',
      'occasions_beginner',
    ],
    blockedPatterns: [
      /<script/i,
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
    ],
  },

  // Logging configuration
  logging: {
    // Log levels: error, warn, info, debug
    productionLevel: 'error',
    developmentLevel: 'debug',

    // Security events to always log
    securityEvents: [
      'AUTHENTICATION_FAILURE',
      'RATE_LIMIT_EXCEEDED',
      'VALIDATION_FAILURE',
      'SUSPICIOUS_REQUEST',
      'UNAUTHORIZED_ACCESS',
    ],

    // Sensitive data to never log
    excludeFromLogs: [
      'password',
      'session_token',
      'api_key',
      'secret',
      'authorization',
    ],
  },

  // Database security
  database: {
    // Enable Row Level Security
    enforceRLS: true,

    // Prepared statement patterns to prevent SQL injection
    sanitizeQueries: true,

    // Connection settings
    ssl: true,

    // Query timeouts
    queryTimeout: 30000, // 30 seconds
  },

  // API security
  api: {
    // CORS settings
    cors: {
      origin:
        process.env.NODE_ENV === 'production'
          ? ['https://scentmatch.io', 'https://www.scentmatch.io']
          : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
      optionsSuccessStatus: 200,
    },

    // Request size limits
    maxRequestSize: '1mb',
    maxFileSize: '5mb',

    // Timeout settings
    requestTimeout: 30000, // 30 seconds
  },
} as const;

/**
 * Get current environment's security configuration
 */
export function getSecurityConfig() {
  if (SECURITY_CONFIG.isProduction) {
    return {
      ...SECURITY_CONFIG,
      csp: SECURITY_CONFIG.csp.production,
      headers: {
        ...SECURITY_CONFIG.headers.common,
        ...SECURITY_CONFIG.headers.production,
      },
      logLevel: SECURITY_CONFIG.logging.productionLevel,
    };
  }

  if (SECURITY_CONFIG.isPreview) {
    return {
      ...SECURITY_CONFIG,
      csp: SECURITY_CONFIG.csp.preview,
      headers: SECURITY_CONFIG.headers.common,
      logLevel: SECURITY_CONFIG.logging.developmentLevel,
    };
  }

  // Development
  return {
    ...SECURITY_CONFIG,
    headers: SECURITY_CONFIG.headers.common,
    logLevel: SECURITY_CONFIG.logging.developmentLevel,
  };
}

/**
 * Validate environment variables for security
 */
export function validateSecurityEnvironment(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Check for exposed secrets in public variables
  const publicVars = Object.keys(process.env).filter(key =>
    key.startsWith('NEXT_PUBLIC_')
  );
  const secretPatterns = ['SECRET', 'PRIVATE', 'KEY'];

  for (const publicVar of publicVars) {
    for (const pattern of secretPatterns) {
      if (
        publicVar.includes(pattern) &&
        publicVar !== 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
      ) {
        warnings.push(
          `Potentially sensitive data in public variable: ${publicVar}`
        );
      }
    }
  }

  // Production-specific checks
  if (SECURITY_CONFIG.isProduction) {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      warnings.push('Redis not configured - using in-memory rate limiting');
    }

    if (process.env.NODE_ENV !== 'production') {
      errors.push('NODE_ENV must be "production" in production environment');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
