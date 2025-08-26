# ScentMatch Affiliate Demo Readiness Spec

**Date:** August 23, 2025  
**Priority:** P0 - Critical for Revenue  
**Timeline:** 2-3 days to demo-ready state  

## Executive Summary

ScentMatch is 85% ready for affiliate demos with a professional UI, complete user journey, and strong value proposition. However, **3 critical search/navigation bugs** must be fixed immediately to prevent demo failures.

## Current Strengths for Affiliates

### ✅ **Professional Product Presentation**
- Modern, trustworthy design builds affiliate confidence
- Clear value proposition: "AI-powered fragrance discovery"
- Strong trust signals (10,000+ users, testimonials, ratings)
- Sample-first approach reduces commitment barriers ($13-15 vs $100+ bottles)

### ✅ **Complete Core Journey**
- Homepage → Quiz → Personalized Recommendations → Sample ordering
- Beginner-friendly 3-question progressive disclosure
- AI explanations for why each fragrance matches
- Mobile-optimized experience (critical for TikTok affiliates)

### ✅ **Competitive Differentiation**
- AI personalization vs generic fragrance sites
- Educational approach for fragrance beginners
- Social validation and peer context
- Budget-conscious user experience (resolved SCE-76)

## 🚨 Critical Blockers (Must Fix)

### **P0-1: Search Results 404 Errors (SCE-74)**
**Risk:** Core user journey broken - affiliate demo failure guaranteed  
**Impact:** Search results link to non-existent fragrance IDs  
**Fix Required:** Database ID mismatch resolution in `/app/api/search/route.ts`

### **P0-2: Sauvage Search Failure (SCE-72)**  
**Risk:** Most common beginner search appears broken  
**Impact:** Search "Sauvage" doesn't show Dior Sauvage prominently  
**Fix Required:** Search algorithm prioritization and database audit

### **P0-3: Server Stability Issues**
**Risk:** App crash during live affiliate demo  
**Impact:** Memory leaks cause server unresponsiveness  
**Fix Required:** Memory management and error boundaries

## Implementation Plan

### **Phase 1: Critical Bug Fixes (2 days)**

#### Task 1.1: Fix Search Result 404s (SCE-74)
```typescript
// File: /app/api/search/route.ts
// Issue: result.fragrance_id doesn't match database IDs
// Fix: Map canonical IDs to actual database records
```

**Acceptance Criteria:**
- [ ] Search results link to valid fragrance detail pages
- [ ] All fragrance detail pages load without 404 errors
- [ ] User can complete: Search → Click result → View fragrance

#### Task 1.2: Fix Sauvage Search Prominence (SCE-72)
```sql
-- Verify Dior Sauvage variants exist in database
SELECT * FROM fragrances WHERE name ILIKE '%sauvage%';
-- Implement popularity-based search ranking
```

**Acceptance Criteria:**
- [ ] Search "Sauvage" shows Dior Sauvage as top result
- [ ] Clear variant hierarchy (EDP → EDT → Parfum)
- [ ] Popular fragrances appear before alternatives

#### Task 1.3: Server Stability Fix
```typescript
// Add proper error boundaries to quiz components
// Investigate memory leaks in AI recommendation processing
// Implement cleanup in useEffect hooks
```

**Acceptance Criteria:**
- [ ] Server handles 30-minute demo session without restart
- [ ] Memory usage stays under 2GB during extended use
- [ ] Graceful error handling for all user flows

### **Phase 2: Affiliate Demo Enhancements (1 day)**

#### Task 2.1: Add Professional Touches
- [ ] Add proper favicon (eliminate console errors)
- [ ] Implement loading states for AI processing
- [ ] Add demo mode with pre-populated successful results

#### Task 2.2: Affiliate-Specific Features  
- [ ] Create affiliate tracking parameters
- [ ] Add conversion analytics for affiliate attribution
- [ ] Implement referral link generation

## Success Metrics

### **Pre-Demo Validation**
- [ ] Complete user journey test: Homepage → Quiz → Recommendations → Details
- [ ] Mobile responsiveness verification
- [ ] Server stability under 30-minute continuous use
- [ ] All critical Linear issues resolved

### **Affiliate Demo KPIs**
- **Engagement:** Time spent on quiz and results pages
- **Conversion:** Quiz completion → Sample interest rate
- **Trust:** Affiliate confidence in recommending platform
- **Technical:** Zero crashes or 404s during demos

## Risk Mitigation

### **Demo Day Preparation**
- [ ] Server restart before each demo session
- [ ] Backup screenshots for all key pages
- [ ] Pre-test all demo flows 30 minutes prior
- [ ] Have technical support on standby

### **Fallback Options**
- Focus on mobile-first demo (most stable)
- Use pre-captured quiz results if processing fails
- Emphasize AI explanation quality over real-time generation

## Business Impact

**Current State:** Strong product with critical technical gaps  
**Target State:** Demo-ready platform that builds affiliate confidence  
**Revenue Impact:** Enable affiliate partnership revenue stream  
**Timeline:** 2-3 days to fully demo-ready state

## Definition of Done

### **Technical Requirements**
- [ ] All P0 Linear issues resolved
- [ ] Complete user journey functional end-to-end
- [ ] Server stability tested for 30+ minute sessions
- [ ] Mobile experience optimized and tested

### **Business Requirements**  
- [ ] Professional presentation builds affiliate trust
- [ ] Clear value proposition and differentiation
- [ ] Sample ordering flow demonstrates monetization
- [ ] Analytics in place for affiliate attribution

### **Demo Requirements**
- [ ] Reproducible demo flow documented
- [ ] Error handling prevents embarrassing failures
- [ ] Strong opening impression (homepage + quiz)
- [ ] Clear conversion path (recommendations + samples)

---

**Next Steps:**
1. Assign P0 issues to @database-operations-expert and @qa-specialist
2. Implement critical fixes in 2-day sprint
3. Full demo rehearsal with affiliate scenarios
4. Go-live for affiliate demonstrations

**Dependencies:**
- Database ID mapping resolution (SCE-74)
- Search algorithm improvements (SCE-72) 
- Memory management fixes (server stability)