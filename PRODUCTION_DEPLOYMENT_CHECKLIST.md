# Production Deployment Checklist

## 📋 Pre-Deployment Validation

### Code Quality & Security

- [ ] `npm run quality` - All quality checks pass
- [ ] `npm run test:ci` - All tests pass with coverage >80%
- [ ] `npm audit --audit-level=moderate` - No critical vulnerabilities
- [ ] `npm run validate:supabase` - Database connection verified
- [ ] `npm run test:data-quality` - Data integrity validated
- [ ] Security headers validated in middleware.ts

### Performance Validation

- [ ] `npm run build` - Production build completes successfully
- [ ] `npm run analyze:bundle` - Bundle size within 200KB limit
- [ ] `npm run lighthouse:mobile` - Core Web Vitals targets met:
  - LCP < 2.5s
  - FID/INP < 200ms
  - CLS < 0.1
- [ ] `npm run test:performance` - Performance tests pass

### Environment Setup

- [ ] All environment variables configured in Vercel
- [ ] Production database accessible
- [ ] CDN and edge functions configured
- [ ] Monitoring and error tracking setup

---

## 🚀 Deployment Process

### Automated Deployment (GitHub Actions)

1. **Push to main branch** triggers deployment workflow
2. **Quality Gates** - All checks must pass:
   - TypeScript validation
   - ESLint strict checking
   - Test suite execution
   - Security vulnerability scan
3. **Canary Deployment** - Safe deployment testing:
   - Deploy to staging environment
   - Automated smoke tests
   - Performance validation
4. **Production Deployment** - Only after canary success:
   - Deploy to production
   - Health checks
   - Lighthouse CI validation

### Manual Deployment Commands

```bash
# Complete pre-deployment validation
npm run quality && npm run test:ci && npm run build

# Deploy to production (if GitHub Actions not used)
vercel deploy --prod --token=$VERCEL_TOKEN

# Post-deployment validation
npm run production:health
curl -f https://scentmatch.vercel.app/api/health
```

---

## ✅ Post-Deployment Verification

### Immediate Validation (0-5 minutes)

- [ ] **Health Check**: `npm run production:health`
- [ ] **API Endpoints**: All critical endpoints responding
  - [ ] `/` - Homepage loads
  - [ ] `/api/health` - Health check passes
  - [ ] `/quiz` - Quiz functionality works
  - [ ] `/browse` - Browse page loads
- [ ] **Database Connectivity**: Health check shows database connected
- [ ] **Security Headers**: All required headers present

### Core Functionality (5-15 minutes)

- [ ] **User Registration**: New user signup works
- [ ] **Quiz Flow**: Complete quiz experience functional
- [ ] **Search & Browse**: Fragrance search and filtering works
- [ ] **Collections**: User collection management functional
- [ ] **Mobile Responsiveness**: All core flows work on mobile

### Performance Monitoring (15-30 minutes)

- [ ] **Core Web Vitals**: Monitor real user metrics
- [ ] **Error Rates**: <1% error rate maintained
- [ ] **Response Times**: API responses <500ms average
- [ ] **User Experience**: No reports of broken functionality

---

## 🚨 Emergency Procedures

### Immediate Rollback

If critical issues detected:

```bash
# Quick rollback to previous version
npm run production:rollback:emergency

# Or manual rollback
vercel rollback https://scentmatch.vercel.app --token=$VERCEL_TOKEN
```

### Health Monitoring

```bash
# Continuous health monitoring
npm run production:health

# Check specific endpoints
curl -f https://scentmatch.vercel.app/api/health
curl -f https://scentmatch.vercel.app/
```

### Issue Investigation

1. **Check Vercel Dashboard**: https://vercel.com/dashboard
2. **Review Error Logs**: Vercel Functions logs
3. **Database Health**: Supabase dashboard
4. **Performance Impact**: Vercel Speed Insights
5. **User Impact**: Real User Monitoring data

---

## 📊 Success Criteria

### Performance Targets

- **LCP (Largest Contentful Paint)**: ≤ 2.5s
- **INP (Interaction to Next Paint)**: ≤ 200ms
- **CLS (Cumulative Layout Shift)**: ≤ 0.1
- **TTFB (Time to First Byte)**: ≤ 800ms
- **Bundle Size**: ≤ 200KB gzipped

### Reliability Targets

- **Uptime**: ≥ 99.9%
- **Error Rate**: ≤ 1%
- **API Response Time**: ≤ 500ms average
- **Database Query Time**: ≤ 200ms average

### Security Requirements

- **Security Headers Score**: A+ rating
- **Vulnerability Scan**: Zero critical/high vulnerabilities
- **CSP Violations**: ≤ 0.1% of sessions
- **SSL/TLS**: A+ rating on SSL Labs

---

## 🔧 Troubleshooting Guide

### Common Issues

**Deployment Fails**

1. Check GitHub Actions workflow logs
2. Verify all environment variables set
3. Test build locally: `npm run build`
4. Check for dependency conflicts

**Performance Degradation**

1. Run: `npm run lighthouse:mobile`
2. Check bundle size: `npm run analyze:bundle`
3. Review Core Web Vitals in Vercel dashboard
4. Identify slow API endpoints

**Database Connection Issues**

1. Check Supabase status page
2. Verify connection strings in Vercel
3. Test connection: `npm run validate:supabase`
4. Check database query performance

**Security Alert**

1. Review vulnerability report
2. Update dependencies: `npm audit fix`
3. Check security headers: `npm run production:health`
4. Verify CSP violations in browser console

---

## 📞 Emergency Contacts

### Critical Production Issues

- **Immediate Action**: Run rollback procedure
- **Escalation**: Notify development team
- **Communication**: Update status page if applicable

### Monitoring & Alerts

- **Vercel Dashboard**: Real-time deployment status
- **Supabase Dashboard**: Database health and performance
- **GitHub Actions**: Deployment workflow status
- **Health Monitoring**: Automated via production scripts

---

## 📈 Post-Deployment Review

### Within 24 Hours

- [ ] Review deployment metrics
- [ ] Analyze user feedback
- [ ] Check error rates and performance
- [ ] Document any issues encountered

### Within 1 Week

- [ ] Performance trend analysis
- [ ] User behavior impact assessment
- [ ] Security posture review
- [ ] Process improvement identification

---

**Last Updated**: Generated for ScentMatch mobile-first UX enhancement
**Next Review**: After each major deployment

This checklist ensures zero-risk deployments with comprehensive validation and immediate rollback capabilities.
