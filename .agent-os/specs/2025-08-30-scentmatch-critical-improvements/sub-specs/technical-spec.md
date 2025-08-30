# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-30-scentmatch-critical-improvements/spec.md

> Created: 2025-08-30
> Version: 1.0.0

## Technical Requirements

### Priority 1: Critical Production Blockers

#### SCE-96: Email Confirmation Flow

**Current Issue**: Broken email confirmation preventing user registration completion
**Technical Approach**:

- Audit Supabase auth configuration and email templates
- Verify RLS policies for user confirmation workflow
- Test email delivery across providers (Gmail, Yahoo, Outlook)
- Implement fallback confirmation methods

**Acceptance Criteria**:

- [ ] 100% email delivery success rate in testing
- [ ] Confirmation links work across all major email clients
- [ ] Clear error messaging for failed confirmations
- [ ] Fallback manual confirmation process

#### SCE-97: TypeScript Compilation Errors (89+)

**Current Issue**: 89+ TypeScript errors preventing reliable builds
**Technical Approach**:

- Run comprehensive TypeScript audit: `npx tsc --noEmit`
- Prioritize errors by impact: build-breaking > runtime > cosmetic
- Fix in batches: critical types, component props, API responses
- Implement strict TypeScript configuration

**Acceptance Criteria**:

- [ ] Zero TypeScript compilation errors
- [ ] Strict mode enabled in tsconfig.json
- [ ] All component props properly typed
- [ ] API responses match defined interfaces

#### SCE-98: Quiz → Account Conversion Failure

**Current Issue**: Users cannot create accounts after completing quiz
**Technical Approach**:

- Debug quiz result submission flow
- Verify Supabase user creation process
- Check session management and data persistence
- Implement robust error handling and retry logic

**Acceptance Criteria**:

- [ ] 95%+ success rate for quiz → account conversion
- [ ] Quiz results persist during account creation
- [ ] Clear error messages for failed conversions
- [ ] Retry mechanism for transient failures

#### SCE-106: API Routes vs Server Actions Standardization

**Current Issue**: Inconsistent architectural patterns hurting performance
**Technical Approach**:

- **Server Actions**: Collections, wishlist, feedback, profile updates
- **API Routes**: Search processing, AI recommendations, external integrations
- Migrate mixed-pattern endpoints to appropriate architecture
- Update all client-side calls to use correct patterns

**Standards**:

```typescript
// Server Actions (mutations)
'use server';
export async function updateCollection(formData: FormData) {
  // Direct database operations
}

// API Routes (processing/external)
export async function GET(request: Request) {
  // AI processing, search, external APIs
}
```

### Priority 2: Performance & UX Improvements

#### SCE-107: AI Processing Performance

**Current Issue**: 3-5+ second response times for AI recommendations
**Technical Approach**:

- Implement request caching for similar queries
- Optimize UnifiedRecommendationEngine processing
- Add progressive loading states and skeleton screens
- Consider request queuing for high-traffic periods

**Performance Targets**:

- [ ] <2 second average response time
- [ ] <1 second for cached similar queries
- [ ] Progressive loading indicators within 200ms
- [ ] Graceful degradation for slow responses

#### SCE-93: Mobile-First UX Implementation

**Current Issue**: Desktop-first design not optimized for mobile users
**Technical Approach**:

- Implement bottom navigation (87% user expectation)
- Add touch-optimized interaction patterns
- Optimize loading states for mobile performance
- Implement swipe gestures where appropriate

**Mobile Standards**:

```typescript
// Bottom navigation component
<BottomNavigation>
  <NavItem icon="home" href="/" />
  <NavItem icon="search" href="/search" />
  <NavItem icon="heart" href="/collections" />
  <NavItem icon="user" href="/profile" />
</BottomNavigation>
```

## Approach

### Phase 1: Stabilization (Week 1)

1. **Day 1-2**: Fix TypeScript errors in batches (critical → runtime → cosmetic)
2. **Day 3-4**: Resolve email confirmation and quiz conversion flows
3. **Day 5-7**: Standardize API architecture patterns

### Phase 2: Performance (Week 2)

1. **Day 1-3**: Optimize AI recommendation engine and implement caching
2. **Day 4-5**: Add progressive loading states and skeleton screens
3. **Day 6-7**: Implement mobile-first UX patterns

### Phase 3: Technical Debt (Week 3)

1. **Day 1-3**: Remove unused components and optimize file structure
2. **Day 4-5**: Standardize variable naming and code patterns
3. **Day 6-7**: Performance testing and optimization

## External Dependencies

### Required Services

- **Supabase**: Auth, database operations, RLS policies
- **Vercel**: Deployment, preview environments, edge functions
- **AI Services**: Current UnifiedRecommendationEngine integration

### Development Tools

- **TypeScript**: Strict mode compilation
- **Playwright**: Browser testing for all UI changes
- **Next.js 15**: Server Actions and API routes
- **shadcn/ui**: Component library (no custom components)

### Browser Testing Requirements

- **@qa-specialist**: All UI changes must be browser-tested
- **Test Coverage**: Chrome, Safari, Firefox mobile/desktop
- **Performance Testing**: Lighthouse scores >90 for mobile

## Implementation Standards

### Code Quality

- Files under 200 lines (split if larger)
- TypeScript strict mode enabled
- ESLint/Prettier configuration enforced
- Component props fully typed

### Testing Requirements

- Browser testing for all UI changes
- API endpoint testing for critical flows
- Performance testing for AI recommendations
- Mobile responsiveness verification

### Performance Targets

- AI recommendations: <2 seconds
- Page load times: <1 second
- Mobile Lighthouse scores: >90
- TypeScript compilation: <30 seconds
