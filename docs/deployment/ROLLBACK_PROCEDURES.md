# Production Rollback Procedures

## Overview

This document provides comprehensive rollback procedures for the Mobile-First UX Enhancement features. These procedures ensure rapid recovery from deployment issues while maintaining data integrity and user experience.

## Emergency Response Matrix

### Severity Levels

**CRITICAL (P0)** - Immediate Action Required
- Complete service outage
- Data corruption or loss
- Security vulnerability exposed
- >50% error rate
- Payment system failures

**HIGH (P1)** - Response within 15 minutes  
- Major feature failures affecting >25% of users
- Performance degradation >500ms response time
- Accessibility features completely broken
- Mobile conversion rate drop >20%

**MEDIUM (P2)** - Response within 1 hour
- Minor feature issues affecting <25% of users
- Performance degradation 200-500ms
- UI/UX issues not blocking core functionality
- Mobile conversion rate drop 10-20%

**LOW (P3)** - Response within 4 hours
- Cosmetic issues
- Minor performance impact <200ms
- Feature requests or enhancements
- Mobile conversion rate drop <10%

## Immediate Response Procedures

### Critical Issue Response (0-5 minutes)

**1. Incident Declaration**
```bash
# Declare incident in team chat
/incident declare "Mobile-first deployment causing [ISSUE]" severity=P0

# Start incident timeline
echo "$(date): Issue detected - [BRIEF_DESCRIPTION]" >> incident-timeline.md
```

**2. Stop Ongoing Deployments**  
```bash
# Cancel any in-progress deployments
vercel --cancel

# Prevent new deployments
gh repo edit --delete-branch-on-merge=false
```

**3. Assess Impact Scope**
```bash
# Check current error rates
curl https://scentmatch.com/api/health | jq '.error_rate'

# Check affected user percentage  
curl https://scentmatch.com/api/metrics/users-affected

# Monitor real-time metrics
npm run monitor:real-time
```

### High Priority Response (5-15 minutes)

**4. Immediate Mitigation**
```bash
# Option A: Feature flag disable (fastest)
export MOBILE_FIRST_ENABLED=false
export FILTER_CHIPS_ENABLED=false  
export BOTTOM_NAV_ENABLED=false

# Option B: Traffic diversion
vercel env add ROLLBACK_PERCENTAGE 100

# Option C: CDN purge (if asset issues)
npm run cdn:purge-all
```

**5. Communication**
```bash
# Update status page
curl -X POST https://status.scentmatch.com/incidents \
  -H "Authorization: Bearer $STATUS_TOKEN" \
  -d '{"title":"Mobile Features Experiencing Issues","status":"investigating"}'

# Notify team
slack-notify "#incidents" "🚨 P0 Incident: Mobile-first rollback in progress"
```

## Rollback Decision Tree

### Decision Flow Chart

```
Issue Detected
     |
     v
Is service completely down?
     |
   YES → Full Rollback (Procedure A)
     |
    NO
     |
     v  
Are >50% of users affected?
     |
   YES → Partial Rollback (Procedure B)
     |
    NO
     |
     v
Is it a mobile-specific issue?
     |
   YES → Feature Flag Disable (Procedure C)
     |
    NO
     |
     v
Can issue be fixed quickly (<1 hour)?
     |
   YES → Hot Fix (Procedure D)
     |
    NO → Gradual Rollback (Procedure E)
```

## Rollback Procedures

### Procedure A: Full Emergency Rollback

**Use When**: Complete service failure, critical security issue, data corruption

**Execution Time**: 2-5 minutes

**Steps:**
```bash
# 1. Immediate rollback to last known good deployment
vercel rollback --yes

# 2. Disable all new features
export MOBILE_FIRST_ENABLED=false
export FILTER_CHIPS_ENABLED=false
export BOTTOM_NAV_ENABLED=false
export AI_SUGGESTIONS_ENABLED=false

# 3. Purge CDN cache
npm run cdn:purge-all

# 4. Verify rollback success
curl -f https://scentmatch.com/api/health || echo "Health check failed"

# 5. Update DNS if needed (last resort)
# dig scentmatch.com +short
# If needed: Update DNS to backup server
```

**Verification Checklist:**
- [ ] Health check returns 200 OK
- [ ] Error rate drops below 5%
- [ ] Core user journeys functional
- [ ] Performance metrics within normal ranges
- [ ] No 5xx errors in logs

**Communication Template:**
```
🚨 RESOLVED: Emergency rollback completed
⏱️ Duration: X minutes  
🔄 Action: Full rollback to previous deployment
✅ Status: All services restored
📊 Impact: Estimated X% of users affected
🔍 Next: Root cause analysis in progress
```

### Procedure B: Partial Rollback  

**Use When**: Specific feature causing widespread issues

**Execution Time**: 10-15 minutes

**Steps:**
```bash
# 1. Identify problematic features
npm run debug:feature-analysis

# 2. Selective feature disable
export BOTTOM_NAV_ENABLED=false  # If nav issues
export FILTER_CHIPS_ENABLED=false  # If filter issues

# 3. Monitor for 5 minutes
npm run monitor:metrics --duration=300

# 4. If not resolved, disable more features
export MOBILE_FIRST_ENABLED=false

# 5. Cache invalidation for affected components
npm run cdn:purge-selective --components=navigation,filters

# 6. Database rollback if data issues detected
npm run db:rollback-selective --tables=user_preferences,filter_state
```

**Feature Isolation Testing:**
```bash
# Test each feature individually
curl https://scentmatch.com/?feature_test=bottom_nav_only
curl https://scentmatch.com/?feature_test=filter_chips_only  
curl https://scentmatch.com/?feature_test=skeleton_loading_only
```

### Procedure C: Feature Flag Disable

**Use When**: Mobile-specific issues, specific component failures

**Execution Time**: 2-5 minutes

**Steps:**
```bash
# 1. Identify failing feature
npm run debug:mobile-features

# 2. Disable specific feature flags
case "$FAILING_FEATURE" in
  "bottom_nav")
    export BOTTOM_NAV_ENABLED=false
    ;;
  "filter_chips")  
    export FILTER_CHIPS_ENABLED=false
    ;;
  "ai_suggestions")
    export AI_SUGGESTIONS_ENABLED=false
    ;;
  "skeleton_loading")
    export SKELETON_LOADING_ENABLED=false
    ;;
esac

# 3. Graceful degradation check
npm run test:graceful-degradation

# 4. Monitor user impact
npm run monitor:feature-specific --feature="$FAILING_FEATURE"
```

**Feature Flag Configuration:**
```javascript
// lib/feature-flags.ts emergency configuration
export const emergencyConfig = {
  mobile_first: {
    enabled: false,
    rollback_reason: "Performance issues detected",
    rollback_timestamp: Date.now()
  },
  filter_chips: {
    enabled: false, 
    fallback_component: "legacy_filters",
    rollback_reason: "API timeout issues"
  }
};
```

### Procedure D: Hot Fix

**Use When**: Quick fix possible, isolated issue, low risk

**Execution Time**: 15-60 minutes

**Steps:**
```bash
# 1. Create hotfix branch
git checkout -b hotfix/mobile-critical-$(date +%Y%m%d-%H%M)

# 2. Implement minimal fix
# [Make necessary code changes]

# 3. Fast-track testing
npm run test:critical-path
npm run test:mobile-smoke

# 4. Deploy with monitoring
vercel deploy --prod --force

# 5. Monitor closely for 15 minutes
npm run monitor:hotfix --duration=900

# 6. Rollback if issues persist
if [ $? -ne 0 ]; then
  echo "Hotfix failed, executing full rollback"
  vercel rollback
fi
```

**Hotfix Approval Matrix:**
- **Technical Lead**: Required for all hotfixes
- **Product Owner**: Required if user experience changes
- **Security Team**: Required if security-related changes

### Procedure E: Gradual Rollback

**Use When**: Non-critical issues, high user impact risk with full rollback

**Execution Time**: 30-90 minutes

**Steps:**
```bash
# 1. Reduce feature rollout percentage
export MOBILE_FIRST_ROLLOUT_PERCENTAGE=75

# 2. Monitor for 10 minutes
npm run monitor:gradual --percentage=75

# 3. Continue reducing if issues persist
export MOBILE_FIRST_ROLLOUT_PERCENTAGE=50
# Monitor for 10 minutes

export MOBILE_FIRST_ROLLOUT_PERCENTAGE=25
# Monitor for 10 minutes

export MOBILE_FIRST_ROLLOUT_PERCENTAGE=0
# Monitor for 10 minutes

# 4. Full rollback if 0% doesn't resolve
vercel rollback
```

**User Segmentation Strategy:**
```javascript
// Gradual rollback user selection
const rollbackUserSelection = {
  // Rollback order priority
  beta_users: 0,        // First to rollback
  new_users: 25,        // Second phase  
  mobile_users: 50,     // Third phase
  all_users: 75         // Final phase
};
```

## Database Rollback Procedures

### Data Integrity Assessment

**Before Database Rollback:**
```sql
-- Check data consistency
SELECT COUNT(*) FROM user_profiles WHERE created_at > '2025-08-26';
SELECT COUNT(*) FROM fragrance_preferences WHERE updated_at > '2025-08-26';
SELECT COUNT(*) FROM user_sessions WHERE mobile_features_enabled = true;

-- Verify backup integrity
SELECT pg_size_pretty(pg_database_size('scentmatch_backup_20250826'));
```

### Database Rollback Steps

**1. Create Current State Snapshot**
```bash
# Create backup of current state before rollback
supabase db dump --file="pre-rollback-$(date +%Y%m%d-%H%M%S).sql"

# Verify backup
supabase db backup verify --file="pre-rollback-*.sql"
```

**2. Execute Rollback**
```bash
# Stop application traffic
vercel maintenance on

# Rollback to pre-deployment state
supabase db reset --file="backup-pre-mobile-first-20250826.sql"

# Verify data integrity
npm run test:data-integrity

# Resume application traffic
vercel maintenance off
```

**3. Data Migration for User Actions During Rollback**
```sql
-- Preserve user actions that happened during failed deployment
INSERT INTO user_preferences_backup 
SELECT * FROM user_preferences 
WHERE updated_at BETWEEN '2025-08-26 10:00:00' AND NOW();

-- Clean restore strategy
DELETE FROM user_preferences WHERE updated_at > '2025-08-26 09:00:00';
-- Then restore from backup...
```

### Database Rollback Decision Matrix

**Rollback Required When:**
- New database constraints cause failures
- Migration introduces data inconsistencies  
- Performance degradation from schema changes
- User data corruption detected

**Rollback NOT Required When:**
- Only application code changes
- Database additions (no existing data modified)
- Read-only feature additions
- UI/UX changes only

## Communication Procedures

### Internal Communication

**Incident Chat Template:**
```
🚨 INCIDENT DECLARED
📱 Component: Mobile-first features  
🔍 Issue: [Brief description]
⚠️ Severity: P[0-3]
👥 Affected Users: ~X% 
🕐 Started: [Time]
📋 Action: [Current procedure]
👤 IC: [Incident Commander]
```

**Status Updates (Every 15 minutes):**
```
📊 UPDATE [Time]
🔍 Status: [Investigating/Mitigating/Resolved]
📱 Progress: [What's been done]
⏱️ ETA: [Expected resolution time]
👥 User Impact: [Current impact level]
🔄 Next Steps: [Immediate next actions]
```

### User Communication

**Status Page Update Template:**
```
Title: Mobile Features Experiencing Issues
Status: Investigating

We're aware that some users may be experiencing issues with mobile navigation and filtering features. Our team is actively working to resolve this.

Affected Services:
- Mobile navigation
- Filter functionality  
- AI-powered suggestions

Workarounds:
- Use desktop version if possible
- Try refreshing the page
- Clear browser cache

We'll provide updates every 15 minutes until resolved.
```

**Email Communication (if >1 hour outage):**
```
Subject: Service Restoration Update - Mobile Features

Dear ScentMatch Users,

We recently experienced an issue with our mobile features that affected approximately X% of users between [TIME] and [TIME] today.

What happened:
- Mobile navigation and filtering experienced performance issues
- Some users were unable to access certain features

What we did:
- Immediately rolled back to previous stable version
- Restored full functionality within X minutes
- Implemented additional monitoring to prevent recurrence

Your data and account information remained secure throughout this incident.

We apologize for any inconvenience and appreciate your patience.

Best regards,
The ScentMatch Team
```

### Escalation Procedures

**Internal Escalation:**
- **15 minutes**: Engineering Manager notified
- **30 minutes**: CTO notified  
- **45 minutes**: CEO notified
- **60 minutes**: Customer Success team notified
- **90 minutes**: Legal team notified (if needed)

**External Communication:**
- **Immediate**: Status page update
- **15 minutes**: Social media acknowledgment
- **30 minutes**: Customer email (if significant impact)
- **24 hours**: Post-incident report published

## Post-Rollback Procedures

### Immediate Post-Rollback (0-30 minutes)

**1. Verification Suite**
```bash
# Run comprehensive verification
npm run test:post-rollback

# Check all critical user journeys
npm run test:critical-journeys

# Verify performance metrics
npm run test:performance-regression

# Accessibility verification
npm run test:accessibility-regression
```

**2. Monitoring Enhancement**  
```bash
# Increase monitoring frequency
export MONITORING_INTERVAL=30s

# Enable debug logging
export LOG_LEVEL=debug

# Set up enhanced alerting
npm run alerts:post-rollback-enhanced
```

### Short-term Actions (30 minutes - 2 hours)

**3. Root Cause Investigation**
```bash
# Collect logs from failed deployment
vercel logs --since=1h > rollback-analysis-logs.txt

# Database analysis
npm run analyze:db-performance --since="2025-08-26 09:00:00"

# Performance analysis
npm run analyze:performance-regression
```

**4. User Impact Assessment**
```bash
# Calculate affected user count
npm run analytics:user-impact --timeframe="1h"

# Assess conversion rate impact
npm run analytics:conversion-impact

# Customer support ticket analysis
npm run support:ticket-analysis --related="mobile,navigation,filters"
```

### Medium-term Actions (2-24 hours)

**5. Incident Post-Mortem Preparation**
```bash
# Generate incident timeline
npm run incident:generate-timeline

# Collect stakeholder input
npm run incident:collect-feedback

# Prepare post-mortem document
npm run incident:generate-postmortem-template
```

**6. Recovery Planning**
```bash
# Analyze what went wrong
npm run debug:deployment-analysis

# Plan remediation steps
npm run plan:remediation-strategy

# Schedule recovery deployment
npm run plan:recovery-deployment
```

### Long-term Actions (1-7 days)

**7. Process Improvements**
```bash
# Update deployment procedures
npm run update:deployment-procedures

# Enhance testing suite
npm run enhance:testing-coverage

# Improve monitoring
npm run enhance:monitoring-coverage
```

**8. Team Learning**
```bash
# Conduct post-mortem meeting
# Document lessons learned
# Update runbooks and procedures
# Plan preventive measures
```

## Rollback Testing and Validation

### Pre-Production Rollback Testing

**Monthly Rollback Drills:**
```bash
# Schedule monthly rollback drill
npm run drill:rollback-simulation

# Test all rollback procedures
npm run test:rollback-procedures-all

# Verify team response times
npm run drill:response-time-test

# Update procedures based on drill results
npm run update:procedures-from-drill
```

**Rollback Testing Checklist:**
```markdown
## Rollback Testing Checklist

### Technical Testing
- [ ] Full deployment rollback works correctly
- [ ] Feature flag disable functions properly
- [ ] Database rollback preserves data integrity
- [ ] CDN purge completes successfully
- [ ] Health checks pass after rollback
- [ ] Performance metrics return to baseline

### Process Testing  
- [ ] Team notification system works
- [ ] Incident commander process clear
- [ ] Status page updates automatically
- [ ] Customer communication triggered
- [ ] Escalation procedures followed
- [ ] Documentation updated appropriately

### Recovery Testing
- [ ] Post-rollback verification complete
- [ ] Monitoring enhanced appropriately  
- [ ] Root cause analysis initiated
- [ ] Recovery plan developed
- [ ] Timeline for fix established
- [ ] Stakeholders informed of next steps
```

### Rollback Success Criteria

**Technical Success:**
- [ ] Error rate drops below 1%
- [ ] Response times return to <200ms average
- [ ] All health checks pass
- [ ] Core user journeys functional
- [ ] No data corruption detected
- [ ] Performance metrics within normal range

**Business Success:**
- [ ] User impact minimized (<5% affected users)
- [ ] Resolution time <1 hour for P0 issues
- [ ] Customer satisfaction maintained
- [ ] No significant revenue impact
- [ ] Team confidence in rollback procedures
- [ ] Lessons learned documented

## Emergency Contacts

### 24/7 On-Call Contacts

**Technical Escalation:**
- Primary: [Technical Lead] - [Phone] - [Email]
- Secondary: [Senior Developer] - [Phone] - [Email]  
- Database: [DBA] - [Phone] - [Email]

**Business Escalation:**
- Product Owner: [Name] - [Phone] - [Email]
- Engineering Manager: [Name] - [Phone] - [Email]
- CTO: [Name] - [Phone] - [Email]

**External Support:**
- Vercel Support: [Phone] - Priority channel
- Supabase Support: [Phone] - Enterprise support
- CDN Provider: [Phone] - Emergency line

### Communication Channels

**Internal:**
- Incident Room: #incidents-mobile-first
- Status Updates: #engineering-alerts
- Leadership: #leadership-incidents

**External:**  
- Status Page: https://status.scentmatch.com
- Support Email: support@scentmatch.com
- Social Media: @ScentMatchApp

---

## Document Maintenance

**Review Schedule:** Monthly
**Last Updated:** August 26, 2025
**Next Review:** September 26, 2025
**Document Owner:** Technical Lead
**Approval:** CTO, Product Owner

**Change Log:**
- v1.0 (2025-08-26): Initial version for mobile-first rollback procedures
- v1.1 (TBD): Updates based on first production rollback experience

---

*This document is part of the ScentMatch incident response procedures and should be kept up-to-date with current deployment practices and team contacts.*