# Vercel Deployment Guide for ScentMatch

## Overview

This guide covers the complete Vercel deployment setup for ScentMatch, including production and preview environments, environment variables, and monitoring configuration.

## Prerequisites

- GitHub repository connected (git@github.com:KJJisBetter/scentmatch.git)
- Vercel account (free tier is sufficient to start)
- Supabase project with credentials
- Node.js 22 LTS locally for development

## Initial Deployment Setup

### 1. Install Vercel CLI (Optional but Recommended)

```bash
npm i -g vercel
```

### 2. Connect to Vercel

#### Option A: Using Vercel CLI

```bash
vercel login
vercel link
```

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Select `KJJisBetter/scentmatch`

### 3. Configure Project Settings

In the Vercel Dashboard for your project:

#### Framework Preset

- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave as is)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm ci`

#### Node.js Version

- Go to Settings → General
- Set Node.js Version to `22.x`

## Environment Variables Configuration

### Production Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Required Variables (Production)
NEXT_PUBLIC_SUPABASE_URL=https://yekstmwcgyiltxinqamf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your_anon_key]
SUPABASE_SERVICE_ROLE_KEY=[your_service_role_key]

# Optional Variables (Add as needed)
OPENAI_API_KEY=[your_openai_key]
VOYAGE_AI_API_KEY=[your_voyage_key]
NEXT_PUBLIC_SENTRY_DSN=[your_sentry_dsn]
SENTRY_AUTH_TOKEN=[your_sentry_token]
```

### Preview Environment Variables

For preview deployments, you can either:

1. Use the same values as production (for testing)
2. Set up a separate Supabase project for staging

**Important**: Set each variable for the appropriate environments:

- ✅ Production
- ✅ Preview
- ✅ Development (optional, for Vercel dev command)

## Deployment Workflow

### Automatic Deployments

Vercel automatically deploys:

- **Production**: When pushing to `main` branch
- **Preview**: When pushing to any other branch or opening a PR

### Manual Deployment

```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel
```

## Preview Environments

### How Preview Environments Work

1. **Feature Branches**: Every push to a feature branch creates a unique preview URL
2. **Pull Requests**: Each PR gets its own preview environment
3. **Comments**: Vercel bot comments on PRs with preview URLs

### Preview URL Structure

```
https://scentmatch-[branch-name]-[username].vercel.app
https://scentmatch-git-[branch-name]-[username].vercel.app
```

### Testing Preview Deployments

1. Push your feature branch:

```bash
git push origin feature/auth-database-foundation
```

2. Check the deployment:

- GitHub: Look for Vercel bot comment on PR
- Vercel Dashboard: View all deployments
- CLI: Run `vercel ls`

## Performance Monitoring

### Vercel Analytics

1. Enable Analytics in Vercel Dashboard → Analytics
2. Automatically injected into production builds
3. Tracks Core Web Vitals:
   - LCP (Largest Contentful Paint)
   - FID (First Input Delay)
   - CLS (Cumulative Layout Shift)
   - TTFB (Time to First Byte)

### Vercel Speed Insights

1. Enable Speed Insights in Dashboard
2. Real User Monitoring (RUM) data
3. Performance scores by page and device

### Custom Monitoring

The app includes performance tracking:

```typescript
// Automatically tracked in app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
```

## Build Optimizations

### Enabled Optimizations

1. **Image Optimization**: Next.js Image component with Vercel's image optimization
2. **Font Optimization**: Google Fonts loaded via next/font
3. **Code Splitting**: Automatic with Next.js App Router
4. **Edge Runtime**: API routes can use Edge Runtime for better performance
5. **ISR**: Incremental Static Regeneration for dynamic content

### Build Cache

Vercel caches:

- `node_modules` (via package-lock.json)
- `.next/cache`
- Build outputs

## Security Configuration

### Headers (Configured in vercel.json)

- **Strict-Transport-Security**: HTTPS enforcement
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: XSS protection
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

### Environment Variable Security

- `NEXT_PUBLIC_*` variables are exposed to the browser
- Non-prefixed variables are server-side only
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to client

## Domain Configuration

### Adding a Custom Domain

1. Go to Settings → Domains
2. Add your domain (e.g., `scentmatch.com`)
3. Configure DNS:
   - **A Record**: `76.76.21.21`
   - **CNAME**: `cname.vercel-dns.com`

### SSL Certificates

- Automatically provisioned by Vercel
- Let's Encrypt certificates
- Auto-renewal

## Deployment Commands

### Package.json Scripts for Deployment

```json
{
  "scripts": {
    "build": "next build",
    "vercel-build": "npm run build",
    "start": "next start"
  }
}
```

### GitHub Actions Integration (Optional)

See `.github/workflows/deploy.yml` for automated deployment pipeline.

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (should be 22.x)
   - Verify all environment variables are set
   - Run `npm run build` locally first

2. **Runtime Errors**
   - Check Vercel Functions logs
   - Verify Supabase connection
   - Check browser console for client-side errors

3. **Performance Issues**
   - Review Vercel Analytics
   - Check bundle size with `next build`
   - Enable caching headers

### Debugging

```bash
# View deployment logs
vercel logs [deployment-url]

# Check deployment status
vercel inspect [deployment-url]

# List all deployments
vercel ls
```

## Rollback Strategy

### Instant Rollback

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

### Git Rollback

```bash
git revert HEAD
git push origin main
```

## Cost Optimization

### Free Tier Limits

- 100 GB Bandwidth
- 100 GB-Hours for Serverless Functions
- Unlimited preview deployments

### Optimization Tips

1. Use ISR instead of SSR where possible
2. Implement proper caching headers
3. Optimize images with next/image
4. Use Edge Functions for lightweight operations

## Team Collaboration

### Adding Team Members

1. Go to Settings → Team
2. Invite members by email
3. Set appropriate permissions:
   - **Developer**: Deploy previews
   - **Member**: Full access except billing
   - **Owner**: Full access

### Environment Variable Access

- Use Vercel's environment variable UI
- Never commit `.env` files
- Use `.env.local` for local development only

## Monitoring Checklist

- [ ] Vercel Analytics enabled
- [ ] Speed Insights configured
- [ ] Error tracking (Sentry) connected
- [ ] Custom alerts set up
- [ ] Performance budgets defined

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Support](https://vercel.com/support)
- Project Issues: [GitHub Issues](https://github.com/KJJisBetter/scentmatch/issues)
