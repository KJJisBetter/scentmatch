# ScentMatch Deployment Documentation

## Quick Start Deployment

### Prerequisites

- Node.js 22 LTS installed locally
- GitHub repository set up (git@github.com:KJJisBetter/scentmatch.git)
- Vercel account (free tier works)
- Supabase project with credentials

### 1. One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKJJisBetter%2Fscentmatch&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&envDescription=Required%20environment%20variables%20for%20Supabase%20integration&project-name=scentmatch&repository-name=scentmatch)

### 2. Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 3. Automated Setup Script

```bash
# Run our setup script
chmod +x scripts/setup-vercel.sh
./scripts/setup-vercel.sh
```

## Environment Variables

### Required for Production

| Variable                        | Description               | Where to Find                       |
| ------------------------------- | ------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL      | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key      | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service role key (secret) | Supabase Dashboard → Settings → API |

### Optional (Future Features)

| Variable                 | Description    | Required For         |
| ------------------------ | -------------- | -------------------- |
| `OPENAI_API_KEY`         | OpenAI API key | AI recommendations   |
| `VOYAGE_AI_API_KEY`      | Voyage AI key  | Embedding generation |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN     | Error tracking       |

## Deployment Environments

### Production

- **Branch**: `main`
- **URL**: https://scentmatch.vercel.app (or custom domain)
- **Auto-deploy**: Yes, on push to main
- **Environment**: Production variables

### Preview

- **Branch**: All feature branches
- **URL**: Dynamic preview URLs
- **Auto-deploy**: Yes, on push to any branch
- **Environment**: Preview variables (can be same as production)

### Local Development

- **URL**: http://localhost:3000
- **Environment**: `.env.local` file
- **Command**: `npm run dev`

## Performance Monitoring

### Vercel Analytics

- Automatically enabled in production
- Tracks Core Web Vitals
- Real user monitoring
- No configuration needed

### Speed Insights

- Page-level performance metrics
- User experience scores
- Automatically integrated

### Health Check Endpoint

- **URL**: `/api/health`
- **Purpose**: Monitoring and uptime checks
- **Response**: JSON with health status

## GitHub Actions CI/CD

The project includes GitHub Actions workflows for:

- ✅ Automated testing on PR
- ✅ Code quality checks
- ✅ Preview deployments
- ✅ Production deployments
- ✅ Performance monitoring
- ✅ Security scanning

### Required GitHub Secrets

Add these in GitHub → Settings → Secrets:

```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## Custom Domain Setup

### 1. Add Domain in Vercel

1. Go to Project Settings → Domains
2. Add your domain (e.g., `scentmatch.com`)
3. Follow DNS configuration instructions

### 2. DNS Configuration

#### For apex domain (scentmatch.com):

```
Type: A
Name: @
Value: 76.76.21.21
```

#### For subdomain (www.scentmatch.com):

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. SSL Certificate

- Automatically provisioned by Vercel
- Uses Let's Encrypt
- Auto-renewal enabled

## Troubleshooting

### Build Failures

```bash
# Test build locally
npm run build

# Check for TypeScript errors
npm run type-check

# Check for linting issues
npm run lint:strict
```

### Environment Variable Issues

```bash
# Verify in Vercel Dashboard
vercel env ls

# Pull environment variables locally
vercel env pull
```

### Performance Issues

1. Check Vercel Analytics dashboard
2. Review bundle size: `npm run build`
3. Check Core Web Vitals in Speed Insights

### Database Connection Issues

1. Verify Supabase credentials
2. Check health endpoint: `/api/health`
3. Review Vercel function logs

## Rollback Procedures

### Instant Rollback (Recommended)

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

### Git Rollback

```bash
# Revert last commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

## Monitoring & Alerts

### Set Up Monitoring

1. **Uptime Monitoring**: Use Vercel's built-in monitoring or services like UptimeRobot
2. **Error Tracking**: Configure Sentry (optional)
3. **Performance Budgets**: Set in Vercel dashboard
4. **Custom Alerts**: Configure in Vercel project settings

### Key Metrics to Monitor

- Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- Error rate < 1%
- API response time < 200ms
- Build time < 5 minutes

## Security Best Practices

### Environment Variables

- Never commit `.env` files
- Use different keys for production/preview
- Rotate keys regularly
- Limit service role key usage

### Headers & CSP

- Security headers configured in `middleware.ts`
- CSP policy enforced in production
- HSTS enabled for HTTPS enforcement

### Access Control

- Use Vercel teams for collaboration
- Implement proper RBAC
- Enable 2FA for all team members

## Support & Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Project Issues**: https://github.com/KJJisBetter/scentmatch/issues
- **Deployment Guide**: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing (`npm test`)
- [ ] Code quality checks pass (`npm run quality`)
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Performance budgets met
- [ ] Security headers configured
- [ ] Health check endpoint working
- [ ] Monitoring set up
- [ ] Rollback plan ready
- [ ] Team notified of deployment
