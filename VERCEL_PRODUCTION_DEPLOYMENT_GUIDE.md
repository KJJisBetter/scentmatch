# ScentMatch Vercel Production Deployment Best Practices

## Overview

Comprehensive production deployment guide for ScentMatch's mobile-first UX enhancement with security audit, performance optimization, and zero-risk deployment procedures.

## 🚀 Quick Deployment Checklist

### Pre-Deployment Validation

- [ ] All tests passing: `npm run quality && npm run test:ci`
- [ ] Security scan completed: `npm audit --audit-level=moderate`
- [ ] Performance benchmarks met: `npm run lighthouse:mobile`
- [ ] Environment variables validated: `npm run validate:supabase`
- [ ] Database migrations tested: `npm run test:data-quality`
- [ ] Bundle size within limits: `npm run analyze:bundle`

---

## 1. 🔒 Security Configuration

### 1.1 Environment Variables Management

**Critical Secrets (Never expose in client):**

```bash
# Supabase Service Role Key (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Vercel Deployment Tokens
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

**Public Variables (Safe to expose):**

```bash
# Supabase Public Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=auto-generated
```

**Optional Monitoring:**

```bash
# Error Tracking (recommended for production)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project

# AI Features (if enabled)
OPENAI_API_KEY=your_openai_key
VOYAGE_AI_API_KEY=your_voyage_key
```

### 1.2 Enhanced Security Headers

**Current Configuration (middleware.ts):**
✅ X-Frame-Options: DENY
✅ X-Content-Type-Options: nosniff
✅ X-XSS-Protection: 1; mode=block
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ Permissions-Policy: camera=(), microphone=(), geolocation=()
✅ Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
✅ Content-Security-Policy: Configured for production

**Recommended Enhancements:**

```typescript
// Add to middleware.ts for production
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Enhanced security headers for production
  if (process.env.NODE_ENV === 'production') {
    // Prevent clickjacking with stricter CSP
    res.headers.set('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.headers.set('X-Content-Type-Options', 'nosniff');

    // Enhanced CSP with stricter nonce-based security
    const nonce = crypto.randomUUID();
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' https://va.vercel-scripts.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ];

    res.headers.set('Content-Security-Policy', cspDirectives.join('; '));

    // Report security violations
    res.headers.set(
      'Report-To',
      JSON.stringify({
        group: 'csp-endpoint',
        max_age: 31536000,
        endpoints: [{ url: '/api/csp-report' }],
      })
    );
  }

  return res;
}
```

### 1.3 API Rate Limiting (Enhanced)

**Production Rate Limiting Strategy:**

```typescript
// lib/rate-limiting/production-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const productionRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour
  analytics: true,
});

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(20, '1 m'), // 20 API calls per minute
  analytics: true,
});

export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, '15 m'), // 5 auth attempts per 15 minutes
  analytics: true,
});
```

---

## 2. ⚡ Performance Optimization

### 2.1 Core Web Vitals Targets

**Production Performance Budgets:**

- **LCP (Largest Contentful Paint):** ≤ 2.0s (Current target: 2.0s)
- **FID/INP (Interaction Delay):** ≤ 100ms (Current target: 100ms)
- **CLS (Cumulative Layout Shift):** ≤ 0.1 (Current target: 0.1)
- **TTFB (Time to First Byte):** ≤ 800ms
- **Bundle Size:** ≤ 200KB gzipped

### 2.2 Enhanced Vercel Configuration

**Updated vercel.json for Production:**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci --only=production",

  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    },
    "app/api/ai/**/*.ts": {
      "maxDuration": 30
    }
  },

  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-DNS-Prefetch-Control",
          "value": "on"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, max-age=0"
        }
      ]
    },
    {
      "source": "/_next/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/images/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=86400, s-maxage=31536000"
        }
      ]
    }
  ],

  "regions": ["iad1"],

  "env": {
    "NODE_ENV": "production",
    "NEXT_TELEMETRY_DISABLED": "1"
  },

  "redirects": [
    {
      "source": "/login",
      "destination": "/auth/login",
      "permanent": true
    },
    {
      "source": "/signup",
      "destination": "/auth/signup",
      "permanent": true
    }
  ],

  "crons": [
    {
      "path": "/api/maintenance/cleanup-sessions",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### 2.3 Next.js Production Optimization

**Enhanced next.config.js:**

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimization flags
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,

  // Optimize for Core Web Vitals
  experimental: {
    optimizePackageImports: [
      '@supabase/supabase-js',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
    ],
    scrollRestoration: true,
  },

  // Image optimization for mobile-first UX
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Compiler optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Optimize bundle splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            priority: 20,
          },
        },
      };
    }
    return config;
  },

  // Enhanced security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
```

---

## 3. 📊 Monitoring & Observability

### 3.1 Real User Monitoring (RUM) Setup

**Core Web Vitals Tracking (Already Implemented):**

- ✅ Automatic performance monitoring via `lib/performance/core-web-vitals-monitor.ts`
- ✅ Performance targets defined in `lib/performance/performance-config.ts`
- ✅ Vercel Analytics integration via `@vercel/analytics`
- ✅ Speed Insights integration via `@vercel/speed-insights`

**Enhanced Production Monitoring:**

```typescript
// lib/monitoring/production-monitor.ts
import { track } from '@vercel/analytics';
import { metric } from '@vercel/speed-insights';

export function initProductionMonitoring() {
  // Track Core Web Vitals
  if (typeof window !== 'undefined') {
    import('web-vitals').then(
      ({ onCLS, onFCP, onFID, onLCP, onTTFB, onINP }) => {
        onCLS(metric => {
          track('Core Web Vitals', {
            name: metric.name,
            value: Math.round(metric.value * 1000) / 1000,
            rating: metric.rating,
            id: metric.id,
          });
        });

        onLCP(metric => {
          track('Core Web Vitals', {
            name: metric.name,
            value: Math.round(metric.value),
            rating: metric.rating,
            id: metric.id,
          });
        });

        onFID(metric => {
          track('Core Web Vitals', {
            name: metric.name,
            value: Math.round(metric.value),
            rating: metric.rating,
            id: metric.id,
          });
        });

        onINP(metric => {
          track('Core Web Vitals', {
            name: metric.name,
            value: Math.round(metric.value),
            rating: metric.rating,
            id: metric.id,
          });
        });
      }
    );
  }
}
```

### 3.2 Error Tracking & Alerting

**Recommended Sentry Integration:**

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  beforeSend(event) {
    // Filter out noise
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes('ResizeObserver loop')) {
        return null; // Skip ResizeObserver errors
      }
    }
    return event;
  },

  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ['localhost', 'scentmatch.vercel.app'],
    }),
    new Sentry.Replay(),
  ],
});
```

---

## 4. 🚀 Production Workflow

### 4.1 Zero-Risk Deployment Strategy

**Automated Deployment Pipeline (Current GitHub Actions):**

1. **Quality Gates (deploy.yml):**
   - ✅ TypeScript validation
   - ✅ ESLint strict checking
   - ✅ Format validation
   - ✅ Unit & integration tests
   - ✅ Security vulnerability scan

2. **Preview Deployment:**
   - ✅ Automatic preview for PRs
   - ✅ Quality check requirements
   - ✅ Performance validation

3. **Production Deployment:**
   - ✅ Only from main branch
   - ✅ All quality gates must pass
   - ✅ Lighthouse CI validation
   - ✅ Performance regression testing

### 4.2 Enhanced Deployment Workflow

**Recommended Improvements to .github/workflows/deploy.yml:**

```yaml
# Add canary deployment step
canary-deployment:
  name: Canary Deployment
  runs-on: ubuntu-latest
  needs: quality-checks
  if: github.ref == 'refs/heads/main'
  environment:
    name: Canary
    url: ${{ steps.deploy.outputs.url }}

  steps:
    - name: Deploy to Canary
      id: deploy
      run: |
        CANARY_URL=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }})
        echo "url=$CANARY_URL" >> $GITHUB_OUTPUT

    - name: Run Smoke Tests on Canary
      run: |
        curl -f ${{ steps.deploy.outputs.url }}/api/health
        curl -f ${{ steps.deploy.outputs.url }}/

    - name: Performance Test Canary
      uses: treosh/lighthouse-ci-action@v11
      with:
        urls: ${{ steps.deploy.outputs.url }}
        uploadArtifacts: true
        temporaryPublicStorage: false

# Add production promotion with manual approval
promote-to-production:
  name: Promote to Production
  runs-on: ubuntu-latest
  needs: canary-deployment
  environment: production-promotion

  steps:
    - name: Promote Canary to Production
      run: |
        vercel promote ${{ needs.canary-deployment.outputs.url }} --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 5. 📋 Production Deployment Checklist

### 5.1 Pre-Deployment Security Audit

```bash
# Security Checklist Commands
npm audit --audit-level=moderate                    # Vulnerability scan
npm run lint:strict                                 # Code quality
npx audit-ci --moderate                            # CI security audit
npm run test -- tests/security/                    # Security tests

# Environment validation
npm run validate:supabase                          # Database connection
echo $SUPABASE_SERVICE_ROLE_KEY | wc -c            # Verify secret length
```

### 5.2 Performance Validation

```bash
# Performance Checklist Commands
npm run build                                       # Production build test
npm run analyze:bundle                             # Bundle size analysis
npm run lighthouse:mobile                          # Mobile performance
npm run test:performance                           # Performance tests
npm run validate:home:performance                  # Critical path validation
```

### 5.3 Database & Data Integrity

```bash
# Data Quality Commands
npm run test:data-quality                          # Data consistency
npm run audit:fragrance-data                      # Data completeness
npm run validate:data                              # Data validation
```

### 5.4 Production Health Checks

**API Health Monitoring:**

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();

    // Test database connection
    const { data, error } = await supabase
      .from('fragrances')
      .select('id')
      .limit(1)
      .single();

    if (error) throw error;

    // Test critical metrics
    const { count: fragranceCount } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true });

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      fragrances: fragranceCount,
      environment: process.env.NODE_ENV,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    };

    return NextResponse.json(healthStatus);
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    );
  }
}
```

---

## 6. 🔧 Production Troubleshooting

### 6.1 Common Issues & Solutions

**Bundle Size Optimization:**

```bash
# Analyze bundle and optimize
npm run analyze:bundle
# Look for large dependencies and code-split where possible
```

**Performance Issues:**

```bash
# Check Core Web Vitals
npm run lighthouse:mobile
# Monitor production with Vercel Speed Insights
```

**Security Alerts:**

```bash
# Update dependencies
npm audit fix --force
# Review security advisories
npm audit --audit-level=moderate
```

### 6.2 Rollback Procedures

**Immediate Rollback:**

```bash
# Via Vercel CLI
vercel rollback [deployment-url] --token=$VERCEL_TOKEN

# Via GitHub
git revert [commit-hash]
git push origin main
```

**Database Rollback:**

```bash
# Revert database migrations if needed
npx supabase db reset --linked
```

---

## 7. 🎯 Success Metrics

### 7.1 Production KPIs

**Performance Targets:**

- Core Web Vitals: 95% of visits meet "Good" thresholds
- Page Load Time: < 2s on 3G networks
- Time to Interactive: < 3s
- Bundle Size: < 200KB gzipped

**Reliability Targets:**

- Uptime: 99.9%
- Error Rate: < 1%
- API Response Time: < 500ms average

**Security Metrics:**

- Zero critical vulnerabilities
- Security headers: A+ rating on securityheaders.com
- CSP violations: < 0.1% of sessions

### 7.2 Monitoring Dashboard

**Key Metrics to Track:**

- Real User Monitoring (RUM) via Vercel Analytics
- Core Web Vitals trends
- Error rates and types
- API performance metrics
- Security incident reports

---

## 🚀 Final Production Deployment Command

```bash
# Complete production deployment with all checks
npm run quality && \
npm run test:ci && \
npm audit --audit-level=moderate && \
npm run build && \
vercel deploy --prod --token=$VERCEL_TOKEN
```

**Post-Deployment Verification:**

```bash
# Verify deployment health
curl -f https://scentmatch.vercel.app/api/health
# Run production smoke tests
npm run test:verify:critical
```

---

## 📞 Emergency Contacts

**Critical Issues:**

- Immediate rollback via Vercel Dashboard
- Database issues: Check Supabase status page
- Security incidents: Rotate API keys immediately

**Monitoring Alerts:**

- Performance degradation: Check Vercel Speed Insights
- Error spikes: Review Sentry dashboard
- Security violations: Audit access logs

---

This guide provides a comprehensive, bulletproof approach to deploying ScentMatch to production with security, performance, and reliability as top priorities. All configurations are based on current project analysis and industry best practices.
