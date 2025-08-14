# Security & Monitoring Architecture

## Security Architecture Overview

### Defense in Depth Strategy

```
Layer 1: Network Security (Cloudflare/Vercel)
  ↓
Layer 2: Application Security (Next.js)
  ↓
Layer 3: API Security (Rate Limiting, Validation)
  ↓
Layer 4: Authentication (Supabase Auth)
  ↓
Layer 5: Database Security (RLS Policies)
  ↓
Layer 6: Data Security (Encryption, PII Protection)
```

## Authentication Security

### Supabase Auth Configuration

```typescript
// lib/auth/config.ts
export const authConfig = {
  // Password requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true,
    preventUserInfo: true // Prevent using email/username in password
  },
  
  // Session configuration
  session: {
    expiryTime: 3600, // 1 hour
    refreshWindow: 86400 * 30, // 30 days
    absoluteTimeout: 86400 * 90, // 90 days max
    idleTimeout: 1800, // 30 minutes idle
    sameSite: 'lax' as const,
    secure: true, // HTTPS only
    httpOnly: true
  },
  
  // MFA configuration
  mfa: {
    enabled: true,
    factors: ['totp'],
    enrollmentRequired: false, // Optional for now
    verificationRequired: true
  },
  
  // OAuth providers
  oauth: {
    google: {
      enabled: true,
      scopes: ['email', 'profile'],
      allowUnverifiedEmail: false
    },
    apple: {
      enabled: true,
      scopes: ['email', 'name'],
      allowUnverifiedEmail: false
    }
  },
  
  // Email verification
  email: {
    requireVerification: true,
    verificationTimeout: 86400, // 24 hours
    allowDisposableEmails: false,
    doubleOptIn: true
  },
  
  // Security headers
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline';"
  }
}
```

### Session Management

```typescript
// lib/auth/session.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getSession() {
  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )
  
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Session error:', error)
    return null
  }
  
  // Validate session
  if (session) {
    // Check if session is expired
    const expiresAt = new Date(session.expires_at!)
    if (expiresAt < new Date()) {
      await supabase.auth.signOut()
      return null
    }
    
    // Check idle timeout
    const lastActivity = cookieStore.get('last_activity')?.value
    if (lastActivity) {
      const idleTime = Date.now() - parseInt(lastActivity)
      if (idleTime > authConfig.session.idleTimeout * 1000) {
        await supabase.auth.signOut()
        return null
      }
    }
    
    // Update last activity
    cookieStore.set('last_activity', Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
  }
  
  return session
}

// Middleware for protected routes
export async function requireAuth() {
  const session = await getSession()
  
  if (!session) {
    redirect('/auth/login')
  }
  
  return session
}

// Check specific permissions
export async function checkPermission(
  resource: string,
  action: string
): Promise<boolean> {
  const session = await getSession()
  if (!session) return false
  
  // Check subscription tier for premium features
  if (resource === 'ai_recommendations' && action === 'generate') {
    const profile = await getProfile(session.user.id)
    return profile?.subscription_tier !== 'free'
  }
  
  // Add more permission checks as needed
  return true
}
```

## Input Validation & Sanitization

### Validation Schemas

```typescript
// lib/validation/schemas.ts
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Custom validators
const safeString = (maxLength: number) =>
  z.string()
    .max(maxLength)
    .transform(val => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] }))

const username = z.string()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
  .transform(val => val.toLowerCase())

const email = z.string()
  .email()
  .toLowerCase()
  .refine(async (email) => {
    // Check against disposable email list
    const domain = email.split('@')[1]
    const isDisposable = await checkDisposableEmail(domain)
    return !isDisposable
  }, 'Disposable email addresses are not allowed')

// Auth schemas
export const SignupSchema = z.object({
  email,
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  username,
  displayName: safeString(50),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept terms')
})

export const LoginSchema = z.object({
  email,
  password: z.string(),
  rememberMe: z.boolean().optional()
})

// Fragrance schemas
export const FragranceReviewSchema = z.object({
  fragranceId: z.string().uuid(),
  rating: z.number().min(0).max(5).multipleOf(0.5),
  title: safeString(100).optional(),
  content: safeString(5000).min(10),
  longevityRating: z.number().min(0).max(5).optional(),
  sillageRating: z.number().min(0).max(5).optional(),
  valueRating: z.number().min(0).max(5).optional()
})

export const CollectionItemSchema = z.object({
  fragranceId: z.string().uuid(),
  status: z.enum(['owned', 'wishlist', 'tested', 'decant', 'sample']),
  bottleSize: z.number().positive().max(5000).optional(),
  purchasePrice: z.number().positive().max(10000).optional(),
  rating: z.number().min(0).max(5).multipleOf(0.5).optional(),
  notes: safeString(1000).optional()
})

// Search schemas
export const SearchSchema = z.object({
  query: safeString(100).min(2),
  filters: z.object({
    gender: z.enum(['masculine', 'feminine', 'unisex']).optional(),
    concentration: z.enum(['parfum', 'edp', 'edt', 'edc', 'cologne']).optional(),
    minPrice: z.number().positive().max(10000).optional(),
    maxPrice: z.number().positive().max(10000).optional(),
    brands: z.array(z.string().uuid()).max(20).optional(),
    notes: z.array(safeString(50)).max(20).optional()
  }).optional(),
  page: z.number().positive().max(100).default(1),
  limit: z.number().positive().max(100).default(20)
})
```

### SQL Injection Prevention

```typescript
// lib/database/queries.ts
import { sql } from '@vercel/postgres'

// NEVER use string concatenation for queries
// BAD:
// const query = `SELECT * FROM users WHERE email = '${email}'`

// GOOD: Use parameterized queries
export async function getUserByEmail(email: string) {
  return await sql`
    SELECT * FROM profiles 
    WHERE email = ${email}
    LIMIT 1
  `
}

// For Supabase, always use the query builder
export async function searchFragrances(
  searchTerm: string,
  filters: SearchFilters
) {
  let query = supabase
    .from('fragrances')
    .select('*')
  
  // Safe text search using Supabase's built-in functions
  if (searchTerm) {
    query = query.textSearch('name', searchTerm, {
      type: 'websearch',
      config: 'english'
    })
  }
  
  // Safe filtering
  if (filters.gender) {
    query = query.eq('gender', filters.gender)
  }
  
  if (filters.minPrice && filters.maxPrice) {
    query = query.gte('avg_price_full', filters.minPrice)
               .lte('avg_price_full', filters.maxPrice)
  }
  
  return await query
}
```

## Rate Limiting & DDoS Protection

### Rate Limiting Implementation

```typescript
// lib/security/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

// Different rate limiters for different actions
export const rateLimiters = {
  // Auth endpoints
  login: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: 'rl:login'
  }),
  
  signup: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: 'rl:signup'
  }),
  
  passwordReset: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    analytics: true,
    prefix: 'rl:password-reset'
  }),
  
  // API endpoints
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'rl:api'
  }),
  
  // AI endpoints (expensive)
  aiRecommendations: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: 'rl:ai'
  }),
  
  // Search endpoints
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'rl:search'
  })
}

// Middleware
export async function rateLimit(
  request: Request,
  limiterName: keyof typeof rateLimiters
) {
  const ip = getClientIp(request)
  const limiter = rateLimiters[limiterName]
  
  const { success, limit, reset, remaining } = await limiter.limit(ip)
  
  if (!success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString(),
        'Retry-After': Math.floor((reset - Date.now()) / 1000).toString()
      }
    })
  }
  
  return null // Continue
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  const cloudflare = request.headers.get('cf-connecting-ip')
  
  return cloudflare || forwarded?.split(',')[0] || real || 'unknown'
}
```

### DDoS Protection

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Cloudflare DDoS protection headers
  const country = request.headers.get('cf-ipcountry')
  const threatScore = request.headers.get('cf-threat-score')
  
  // Block high-risk traffic
  if (threatScore && parseInt(threatScore) > 50) {
    return new NextResponse('Forbidden', { status: 403 })
  }
  
  // Geo-blocking (if needed)
  const blockedCountries = process.env.BLOCKED_COUNTRIES?.split(',') || []
  if (country && blockedCountries.includes(country)) {
    return new NextResponse('Service not available in your region', { status: 451 })
  }
  
  // Apply rate limiting based on path
  const path = request.nextUrl.pathname
  
  if (path.startsWith('/api/auth/login')) {
    const rateLimitResponse = await rateLimit(request, 'login')
    if (rateLimitResponse) return rateLimitResponse
  }
  
  if (path.startsWith('/api/')) {
    const rateLimitResponse = await rateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/auth/:path*']
}
```

## Monitoring & Logging

### Application Monitoring

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Integrations
  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ['localhost', /^\//],
      routingInstrumentation: Sentry.nextRouterInstrumentation,
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Filtering
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
  
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies
    }
    
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Event:', event, hint)
      return null
    }
    
    return event
  },
})

// Custom error logging
export function logError(
  error: Error,
  context?: Record<string, any>
) {
  console.error('Application Error:', error, context)
  
  Sentry.captureException(error, {
    tags: {
      component: context?.component,
      action: context?.action,
    },
    extra: context,
  })
}

// Performance monitoring
export function measurePerformance(
  name: string,
  fn: () => Promise<any>
) {
  return Sentry.startSpan(
    {
      name,
      op: 'function',
    },
    async () => {
      const start = performance.now()
      try {
        return await fn()
      } finally {
        const duration = performance.now() - start
        
        // Log slow operations
        if (duration > 1000) {
          Sentry.captureMessage(`Slow operation: ${name}`, {
            level: 'warning',
            tags: { operation: name },
            extra: { duration },
          })
        }
      }
    }
  )
}
```

### Metrics Collection

```typescript
// lib/monitoring/metrics.ts
import { Counter, Histogram, Gauge, register } from 'prom-client'

// Define metrics
export const metrics = {
  // HTTP metrics
  httpRequestDuration: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5],
  }),
  
  httpRequestsTotal: new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
  }),
  
  // Business metrics
  userSignups: new Counter({
    name: 'user_signups_total',
    help: 'Total number of user signups',
    labelNames: ['source'],
  }),
  
  fragranceSearches: new Counter({
    name: 'fragrance_searches_total',
    help: 'Total number of fragrance searches',
    labelNames: ['type'],
  }),
  
  recommendationGenerations: new Counter({
    name: 'recommendation_generations_total',
    help: 'Total number of recommendation generations',
    labelNames: ['type'],
  }),
  
  collectionAdditions: new Counter({
    name: 'collection_additions_total',
    help: 'Total number of fragrances added to collections',
    labelNames: ['status'],
  }),
  
  // System metrics
  databaseConnections: new Gauge({
    name: 'database_connections_active',
    help: 'Number of active database connections',
  }),
  
  cacheHitRate: new Gauge({
    name: 'cache_hit_rate',
    help: 'Cache hit rate percentage',
    labelNames: ['cache_type'],
  }),
  
  aiApiLatency: new Histogram({
    name: 'ai_api_latency_seconds',
    help: 'Latency of AI API calls',
    labelNames: ['provider', 'operation'],
    buckets: [0.5, 1, 2, 5, 10],
  }),
}

// Register all metrics
Object.values(metrics).forEach(metric => register.registerMetric(metric))

// Metrics endpoint
export async function GET() {
  const metricsData = await register.metrics()
  
  return new Response(metricsData, {
    headers: {
      'Content-Type': register.contentType,
    },
  })
}

// Helper to track metrics
export function trackMetric(
  metric: keyof typeof metrics,
  value: number = 1,
  labels?: Record<string, string>
) {
  const m = metrics[metric]
  
  if (m instanceof Counter) {
    m.inc(labels, value)
  } else if (m instanceof Gauge) {
    m.set(labels || {}, value)
  } else if (m instanceof Histogram) {
    m.observe(labels || {}, value)
  }
}
```

### Audit Logging

```typescript
// lib/monitoring/audit.ts
interface AuditLog {
  id: string
  timestamp: Date
  userId?: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ip?: string
  userAgent?: string
  result: 'success' | 'failure'
  errorMessage?: string
}

export class AuditLogger {
  private async log(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const auditEntry: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...entry,
    }
    
    // Store in database
    await supabase
      .from('audit_logs')
      .insert(auditEntry)
    
    // Critical actions also go to external log
    if (this.isCriticalAction(entry.action)) {
      await this.sendToExternalLog(auditEntry)
    }
  }
  
  private isCriticalAction(action: string): boolean {
    const criticalActions = [
      'user.delete',
      'user.password_reset',
      'admin.access',
      'data.export',
      'payment.process',
    ]
    return criticalActions.includes(action)
  }
  
  private async sendToExternalLog(entry: AuditLog) {
    // Send to external logging service (e.g., Datadog, CloudWatch)
    console.log('Critical audit log:', entry)
  }
  
  // Audit methods
  async logAuth(
    action: 'login' | 'logout' | 'signup' | 'password_reset',
    userId?: string,
    success: boolean = true,
    details?: any
  ) {
    await this.log({
      action: `auth.${action}`,
      resource: 'auth',
      userId,
      result: success ? 'success' : 'failure',
      details,
    })
  }
  
  async logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'view' | 'create' | 'update' | 'delete'
  ) {
    await this.log({
      action: `data.${action}`,
      resource,
      resourceId,
      userId,
      result: 'success',
    })
  }
  
  async logApiCall(
    endpoint: string,
    method: string,
    userId?: string,
    statusCode: number = 200
  ) {
    await this.log({
      action: 'api.call',
      resource: endpoint,
      userId,
      result: statusCode < 400 ? 'success' : 'failure',
      details: { method, statusCode },
    })
  }
}

export const auditLogger = new AuditLogger()
```

## Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    api: 'healthy',
    database: 'unknown',
    cache: 'unknown',
    storage: 'unknown',
    ai: 'unknown',
  }
  
  // Check database
  try {
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single()
    
    checks.database = error ? 'unhealthy' : 'healthy'
  } catch {
    checks.database = 'unhealthy'
  }
  
  // Check Redis cache
  try {
    await redis.ping()
    checks.cache = 'healthy'
  } catch {
    checks.cache = 'unhealthy'
  }
  
  // Check Supabase Storage
  try {
    const { error } = await supabase.storage
      .from('avatars')
      .list('', { limit: 1 })
    
    checks.storage = error ? 'unhealthy' : 'healthy'
  } catch {
    checks.storage = 'unhealthy'
  }
  
  // Check AI service (with timeout)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch('https://api.voyageai.com/health', {
      signal: controller.signal,
    })
    
    clearTimeout(timeout)
    checks.ai = response.ok ? 'healthy' : 'unhealthy'
  } catch {
    checks.ai = 'unhealthy'
  }
  
  const overall = Object.values(checks).every(status => status === 'healthy')
    ? 'healthy'
    : 'degraded'
  
  return NextResponse.json(
    {
      status: overall,
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: overall === 'healthy' ? 200 : 503,
    }
  )
}
```

## Security Headers

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
          }
        ]
      }
    ]
  }
}

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.supabase.co;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  media-src 'self' https:;
  connect-src 'self' https://*.supabase.co https://api.voyageai.com wss://*.supabase.co;
  frame-src 'self' https://www.youtube.com https://player.vimeo.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  block-all-mixed-content;
  upgrade-insecure-requests;
`
```

## Incident Response Plan

### Severity Levels

1. **Critical (P0)**: Complete service outage, data breach, security vulnerability
2. **High (P1)**: Major feature broken, significant performance degradation
3. **Medium (P2)**: Minor feature broken, moderate performance issue
4. **Low (P3)**: Cosmetic issues, minor bugs

### Response Procedures

```typescript
// lib/monitoring/incident.ts
export class IncidentManager {
  async createIncident(
    severity: 'P0' | 'P1' | 'P2' | 'P3',
    title: string,
    description: string
  ) {
    const incident = {
      id: crypto.randomUUID(),
      severity,
      title,
      description,
      status: 'open',
      createdAt: new Date(),
      timeline: [],
    }
    
    // Store incident
    await this.storeIncident(incident)
    
    // Notify based on severity
    switch (severity) {
      case 'P0':
        await this.pageOnCall()
        await this.notifySlack('#incidents-critical')
        await this.createStatusPage(incident)
        break
      case 'P1':
        await this.notifySlack('#incidents')
        await this.emailTeam()
        break
      case 'P2':
        await this.notifySlack('#incidents')
        break
      case 'P3':
        await this.createJiraTicket(incident)
        break
    }
    
    return incident
  }
  
  async updateIncident(
    incidentId: string,
    update: string,
    status?: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  ) {
    // Add to timeline
    await this.addTimelineEntry(incidentId, update)
    
    if (status) {
      await this.updateStatus(incidentId, status)
      
      if (status === 'resolved') {
        await this.schedulePostMortem(incidentId)
      }
    }
  }
}
```

## Compliance & Privacy

### GDPR Compliance

```typescript
// lib/privacy/gdpr.ts
export class GDPRManager {
  // Data export
  async exportUserData(userId: string) {
    const data = {
      profile: await this.getProfile(userId),
      fragrances: await this.getUserFragrances(userId),
      reviews: await this.getUserReviews(userId),
      preferences: await this.getUserPreferences(userId),
      auditLogs: await this.getUserAuditLogs(userId),
    }
    
    return this.formatForExport(data)
  }
  
  // Data deletion
  async deleteUserData(userId: string) {
    // Soft delete first
    await this.anonymizeUser(userId)
    
    // Schedule hard delete after 30 days
    await this.scheduleHardDelete(userId, 30)
    
    // Log deletion request
    await auditLogger.logDataAccess(
      userId,
      'user_data',
      userId,
      'delete'
    )
  }
  
  // Consent management
  async updateConsent(
    userId: string,
    consents: {
      marketing: boolean
      analytics: boolean
      personalization: boolean
    }
  ) {
    await supabase
      .from('user_consents')
      .upsert({
        user_id: userId,
        ...consents,
        updated_at: new Date(),
      })
  }
}
```

## Security Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] SSL certificates valid
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Authentication flow tested
- [ ] RLS policies verified
- [ ] Monitoring configured
- [ ] Backup strategy tested
- [ ] Incident response plan documented

### Post-Deployment

- [ ] Security scan with OWASP ZAP
- [ ] Penetration testing scheduled
- [ ] Monitor error rates
- [ ] Review audit logs
- [ ] Check performance metrics
- [ ] Verify backup automation
- [ ] Test disaster recovery
- [ ] Update security documentation