# Mobile-First UX Enhancement Deployment Runbook

## Overview

This runbook provides comprehensive deployment procedures for the Mobile-First UX Enhancement features completed as part of the Beginner Experience Optimization project. These procedures ensure safe, reliable deployment with proper monitoring and rollback capabilities.

## Pre-Deployment Checklist

### Code Quality Verification

- [ ] All TypeScript compilation passes (`npm run type-check`)
- [ ] ESLint and Prettier checks pass (`npm run lint`)
- [ ] All unit tests pass (`npm run test`)
- [ ] Performance tests meet benchmarks (< 100ms response times)
- [ ] Accessibility tests pass (WCAG 2.1 AA compliance)
- [ ] Cross-browser testing completed
- [ ] Mobile device testing completed

### Database Migration Verification

- [ ] All migration scripts tested in staging environment
- [ ] Backup procedures verified and tested
- [ ] Data integrity checks completed
- [ ] Performance impact assessment completed

### Environment Configuration

- [ ] Environment variables properly configured
- [ ] API endpoints verified and accessible
- [ ] Third-party service integrations tested
- [ ] CDN configuration optimized for mobile assets

## Deployment Sequence

### Phase 1: Database Migrations (If Required)

```bash
# 1. Create database backup
supabase db dump --file="backup-pre-mobile-first-$(date +%Y%m%d-%H%M%S).sql"

# 2. Run migrations in staging
supabase db push --include-seed

# 3. Verify migration success
npm run test:database

# 4. Run data validation scripts
npm run validate:fragrance-data
npm run validate:user-profiles
```

**Rollback Plan for Phase 1:**
```bash
# Restore from backup if migrations fail
supabase db reset --file="backup-pre-mobile-first-TIMESTAMP.sql"
```

### Phase 2: Application Deployment

```bash
# 1. Build production assets
npm run build

# 2. Run production build verification
npm run start &
curl http://localhost:3000/health || exit 1
kill %1

# 3. Deploy to staging
vercel deploy --prod=false

# 4. Run staging validation suite
npm run test:staging
npm run test:performance:staging
npm run test:accessibility:staging

# 5. Deploy to production
vercel deploy --prod

# 6. Verify production deployment
npm run test:production:smoke
```

**Rollback Plan for Phase 2:**
```bash
# Rollback to previous deployment
vercel rollback
```

### Phase 3: Feature Flag Activation

```bash
# 1. Enable mobile-first components gradually
# Update environment variables for percentage rollout
MOBILE_FIRST_ROLLOUT_PERCENTAGE=25

# 2. Monitor metrics for 15 minutes
npm run monitor:metrics

# 3. Increase rollout if metrics are healthy
MOBILE_FIRST_ROLLOUT_PERCENTAGE=50

# 4. Continue monitoring and increase to 100%
MOBILE_FIRST_ROLLOUT_PERCENTAGE=100
```

## Monitoring and Health Checks

### Key Performance Indicators (KPIs)

Monitor these metrics during and after deployment:

```javascript
// Core Web Vitals Monitoring
const webVitals = {
  firstContentfulPaint: { target: 1500, current: null },
  largestContentfulPaint: { target: 2500, current: null },
  firstInputDelay: { target: 100, current: null },
  cumulativeLayoutShift: { target: 0.1, current: null }
};

// Component Performance Metrics
const componentMetrics = {
  filterResponseTime: { target: 100, current: null },
  bottomNavRenderTime: { target: 50, current: null },
  skeletonLoadTime: { target: 200, current: null }
};

// User Experience Metrics
const userMetrics = {
  quizCompletionRate: { target: 75, current: null },
  mobileEngagementRate: { target: 60, current: null },
  accessibilityErrorRate: { target: 0, current: null }
};
```

### Monitoring Commands

```bash
# 1. Real-time performance monitoring
npm run monitor:performance

# 2. Error rate monitoring
npm run monitor:errors

# 3. User engagement tracking
npm run monitor:engagement

# 4. Accessibility compliance monitoring
npm run monitor:accessibility
```

### Alert Thresholds

**Critical Alerts** (immediate attention):
- Error rate > 5%
- Response time > 500ms
- Accessibility errors detected
- Mobile conversion rate drop > 10%

**Warning Alerts** (monitor closely):
- Response time > 200ms
- Mobile engagement drop > 5%
- Performance score drop > 10 points

## Health Check Endpoints

### Automated Health Checks

```bash
# Production health check
curl https://scentmatch.com/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-08-26T12:00:00Z",
  "services": {
    "database": "healthy",
    "ai_engine": "healthy",
    "search": "healthy"
  },
  "performance": {
    "avg_response_time": 85,
    "filter_response_time": 95,
    "uptime": "99.9%"
  }
}
```

### Component-Specific Health Checks

```bash
# Bottom navigation health check
curl https://scentmatch.com/api/health/bottom-nav

# Filter chips performance check
curl https://scentmatch.com/api/health/filter-chips

# Skeleton loading verification
curl https://scentmatch.com/api/health/skeletons
```

## Rollback Procedures

### Emergency Rollback (< 5 minutes)

**Immediate Issues** (5xx errors, complete failures):

```bash
# 1. Immediate rollback to previous deployment
vercel rollback --yes

# 2. Disable feature flags
export MOBILE_FIRST_ENABLED=false
export FILTER_CHIPS_ENABLED=false
export BOTTOM_NAV_ENABLED=false

# 3. Clear CDN cache
npm run cdn:purge

# 4. Verify rollback success
curl https://scentmatch.com/api/health
```

### Gradual Rollback (Performance Issues)

**Performance Degradation** (response times > targets):

```bash
# 1. Reduce feature flag percentage
export MOBILE_FIRST_ROLLOUT_PERCENTAGE=50

# 2. Monitor for 10 minutes
npm run monitor:performance

# 3. Continue reducing if issues persist
export MOBILE_FIRST_ROLLOUT_PERCENTAGE=25
export MOBILE_FIRST_ROLLOUT_PERCENTAGE=0

# 4. Full rollback if necessary
vercel rollback
```

### Database Rollback (Data Issues)

**Database Migration Issues**:

```bash
# 1. Stop application traffic
vercel disable

# 2. Restore database from backup
supabase db reset --file="backup-pre-mobile-first-TIMESTAMP.sql"

# 3. Verify data integrity
npm run validate:database

# 4. Re-enable application
vercel enable
```

## Post-Deployment Validation

### User Journey Testing

**Critical User Flows to Validate:**

1. **Mobile Navigation Flow**
```bash
# Test bottom navigation functionality
npm run test:e2e:bottom-nav

# Expected: All navigation items work correctly
# Expected: Haptic feedback functions on iOS
# Expected: Accessibility attributes present
```

2. **Search and Filter Flow**
```bash
# Test filter chips functionality
npm run test:e2e:filter-chips

# Expected: Filters respond within 100ms
# Expected: AI suggestions load correctly
# Expected: Count updates work in real-time
```

3. **Progressive Loading Flow**
```bash
# Test skeleton loading states
npm run test:e2e:skeletons

# Expected: Appropriate skeletons show during loading
# Expected: Smooth transitions to real content
# Expected: No layout shifts during loading
```

### Performance Validation

```bash
# Run comprehensive performance suite
npm run test:performance:production

# Validate Core Web Vitals
npm run lighthouse:mobile

# Check accessibility compliance
npm run test:accessibility:production
```

### Browser Compatibility Testing

```bash
# Run cross-browser test suite
npm run test:browsers

# Validate on specific mobile browsers
npm run test:mobile:chrome
npm run test:mobile:safari
npm run test:mobile:samsung
```

## Monitoring Dashboard Setup

### Key Metrics Dashboard

Set up monitoring dashboards to track:

**Performance Metrics:**
- Page load times by device type
- Filter response times
- AI suggestion generation times
- Skeleton-to-content transition times

**User Experience Metrics:**
- Mobile engagement rates
- Quiz completion rates
- Search success rates
- Navigation usage patterns

**Technical Metrics:**
- Error rates by component
- API response times
- Database query performance
- CDN hit rates

### Alert Configuration

```javascript
// Example alert configuration
const alertConfig = {
  performance: {
    filterResponseTime: {
      warning: 150,
      critical: 200,
      action: "Scale up API resources"
    },
    mobilePageLoad: {
      warning: 2000,
      critical: 3000,
      action: "Optimize mobile assets"
    }
  },
  errors: {
    componentErrors: {
      warning: 1,
      critical: 5,
      action: "Investigate and hotfix"
    }
  }
};
```

## Team Communication

### Deployment Communication Template

**Pre-Deployment Announcement:**
```
🚀 Mobile-First UX Enhancement Deployment
📅 Scheduled: [DATE] at [TIME]
⏱️ Expected Duration: 30 minutes
🎯 Features: Bottom navigation, filter chips, skeleton loading
📊 Rollout: Gradual (25% → 50% → 100%)
🔍 Monitoring: Active for 24 hours post-deployment
```

**Post-Deployment Update:**
```
✅ Mobile-First UX Enhancement Deployment Complete
📈 Performance: All metrics within targets
🎯 Features: Successfully deployed and functional
📱 Mobile UX: Significant improvements observed
🔍 Monitoring: Continuing for 24 hours
```

### Escalation Procedures

**Level 1** - Development Team:
- Performance issues
- Minor bugs
- UX feedback

**Level 2** - Technical Lead:
- Service outages
- Database issues
- Security concerns

**Level 3** - Product Team:
- User impact issues
- Business metric impacts
- Rollback decisions

## Documentation Updates

### Post-Deployment Documentation

- [ ] Update component documentation with production learnings
- [ ] Document any deployment-specific configurations
- [ ] Update troubleshooting guides with real-world issues
- [ ] Create performance benchmark documentation
- [ ] Update team runbooks with lessons learned

### Knowledge Transfer

- [ ] Conduct deployment retrospective meeting
- [ ] Update team knowledge base
- [ ] Create video walkthrough of new features
- [ ] Document common support issues and solutions
- [ ] Update new team member onboarding materials

## Success Criteria

### Technical Success Criteria

- [ ] All health checks passing
- [ ] Performance metrics within targets (< 100ms response times)
- [ ] Zero accessibility errors
- [ ] Cross-browser compatibility confirmed
- [ ] Mobile user engagement improved by 25%+

### Business Success Criteria

- [ ] Quiz completion rate increased
- [ ] Mobile conversion rate maintained or improved
- [ ] User satisfaction scores positive
- [ ] Support ticket volume not increased
- [ ] No critical user-facing bugs

### Long-term Success Metrics

Monitor these metrics over the first 30 days:

- Mobile user retention rates
- Quiz-to-account conversion rates
- Search success rates on mobile
- Overall platform performance scores
- Accessibility compliance maintenance

---

## Emergency Contacts

**Development Team Lead:** [Contact Info]
**DevOps Engineer:** [Contact Info]
**Product Owner:** [Contact Info]
**QA Lead:** [Contact Info]

## Additional Resources

- [Component Documentation](./components/mobile-first-components.md)
- [Accessibility Testing Procedures](./accessibility-testing-procedures.md)
- [Performance Monitoring Guide](./performance-monitoring.md)
- [Troubleshooting Guide](./troubleshooting-guide.md)

---

*This runbook should be updated after each deployment with lessons learned and process improvements.*