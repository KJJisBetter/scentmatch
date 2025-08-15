# Test Specifications - Task 2.1: Supabase Setup & Connectivity

## Overview

**Task:** Supabase Project Setup & Configuration  
**Purpose:** Establish database foundation with PostgreSQL extensions, authentication, and email systems  
**Dependencies:** Task 1.1 build stability (✅ Complete)  
**Testing Approach:** Infrastructure validation with security and performance checks  

## Pre-Test Requirements

### Environment Preparation
- [ ] Task 1.1 build stability confirmed
- [ ] Supabase account created and accessible
- [ ] Environment variable template prepared
- [ ] Backup of current configurations
- [ ] Network connectivity to Supabase services verified

### Test Data Preparation
- [ ] Test email addresses prepared for authentication flows
- [ ] Sample user data for testing scenarios
- [ ] Performance baseline metrics defined
- [ ] Security testing credentials prepared

## Test Suite 1: Supabase Project Configuration

### Test Case 1.1: Project Creation and Setup
**Priority:** Critical (Must Pass)

**Setup Steps:**
1. Create new Supabase project with naming convention: `scentmatch-[environment]`
2. Select optimal region (US East for development, production TBD)
3. Configure database password with security requirements
4. Document project URL, API keys, and database credentials

**Test Validation:**
- [ ] Project created successfully with correct naming
- [ ] Region selection accessible and low-latency
- [ ] Database password meets security requirements (12+ chars, mixed case, symbols)
- [ ] Project dashboard accessible and functional
- [ ] Database connection established via Supabase client

**Pass Criteria:**
- Project URL follows format: `https://[project-id].supabase.co`
- API keys generated (anon and service_role)
- Database accessible from project dashboard
- Connection latency < 100ms from development environment

**Failure Response:**
- Document exact error during project creation
- Check Supabase service status
- Verify account permissions and billing status
- Escalate to backend engineer if infrastructure issues

### Test Case 1.2: API Endpoint Connectivity
**Priority:** Critical (Must Pass)

**Test Validation:**
- [ ] REST API endpoint responds correctly
- [ ] GraphQL endpoint accessible (if enabled)
- [ ] Realtime endpoint connection successful
- [ ] Storage API endpoint functional
- [ ] Edge Functions endpoint accessible

**Pass Criteria:**
- HTTP 200 response from `/rest/v1/` endpoint
- Authentication headers accepted
- CORS headers properly configured
- Response times < 200ms for basic queries

### Test Case 1.3: Database Access and Permissions
**Priority:** Critical (Must Pass)

**Test Validation:**
- [ ] Database accessible via SQL editor
- [ ] Service role permissions validated
- [ ] Anon role permissions restricted appropriately
- [ ] Connection pooling configured
- [ ] SSL connections enforced

**Pass Criteria:**
- SQL queries execute successfully in dashboard
- Service role can perform CRUD operations
- Anon role restricted to public schemas only
- SSL certificate validation passes

## Test Suite 2: PostgreSQL Extensions

### Test Case 2.1: UUID-OSSP Extension
**Priority:** High (Should Pass)

**Setup Steps:**
1. Enable uuid-ossp extension via SQL editor
2. Verify extension installation
3. Test UUID generation functions

**Test Validation:**
- [ ] Extension installed without errors
- [ ] `uuid_generate_v4()` function available
- [ ] UUID generation performance within limits
- [ ] Extension accessible to application role

**SQL Test Commands:**
```sql
-- Verify extension
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';

-- Test UUID generation
SELECT uuid_generate_v4();

-- Performance test
EXPLAIN ANALYZE SELECT uuid_generate_v4() FROM generate_series(1,1000);
```

**Pass Criteria:**
- Extension shows as installed in pg_extension table
- UUID generation produces valid v4 UUIDs
- Performance: 1000 UUIDs generated in < 10ms

### Test Case 2.2: pgvector Extension (AI Features)
**Priority:** High (Should Pass)

**Setup Steps:**
1. Enable vector extension via dashboard or SQL
2. Verify vector data type availability
3. Test vector operations and indexing

**Test Validation:**
- [ ] Vector extension installed successfully
- [ ] Vector data type available for table creation
- [ ] Vector similarity functions operational
- [ ] Vector indexing (HNSW/IVFFlat) functional

**SQL Test Commands:**
```sql
-- Verify extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Test vector type
CREATE TABLE test_vectors (
  id serial PRIMARY KEY,
  embedding vector(1536)
);

-- Test similarity functions
SELECT embedding <-> '[1,2,3]'::vector as distance 
FROM test_vectors LIMIT 1;
```

**Pass Criteria:**
- Extension installed without dependency errors
- Vector tables can be created with embedding dimensions
- Similarity operations return expected results
- Index creation succeeds for vector columns

### Test Case 2.3: pg_trgm Extension (Fuzzy Search)
**Priority:** Medium (Should Pass)

**Setup Steps:**
1. Enable pg_trgm extension
2. Test trigram similarity functions
3. Verify GIN/GiST index support

**Test Validation:**
- [ ] Extension installed successfully
- [ ] Similarity functions available
- [ ] Trigram indexes can be created
- [ ] Fuzzy search performance acceptable

**SQL Test Commands:**
```sql
-- Verify extension
SELECT * FROM pg_extension WHERE extname = 'pg_trgm';

-- Test similarity
SELECT similarity('fragrance', 'fragance');

-- Test trigram index
CREATE INDEX test_trgm_idx ON test_table USING gin (name gin_trgm_ops);
```

**Pass Criteria:**
- Similarity function returns values between 0-1
- Trigram indexes created without errors
- Fuzzy search queries execute in reasonable time

## Test Suite 3: Authentication Provider Configuration

### Test Case 3.1: Email/Password Provider Setup
**Priority:** Critical (Must Pass)

**Setup Steps:**
1. Enable email/password authentication in Supabase dashboard
2. Configure email confirmation requirements
3. Set password complexity requirements
4. Configure session settings

**Test Validation:**
- [ ] Email/password provider enabled
- [ ] Email confirmation flow configured
- [ ] Password policy enforced (min 8 chars)
- [ ] Session timeout settings applied
- [ ] Account lockout policies configured

**Pass Criteria:**
- Provider shows as active in auth settings
- Email confirmation required for new accounts
- Password requirements enforced on signup
- Session duration configurable (default 1 hour)

### Test Case 3.2: Authentication Flow Configuration
**Priority:** Critical (Must Pass)

**Test Validation:**
- [ ] Signup flow operational
- [ ] Login flow functional
- [ ] Password reset flow working
- [ ] Email verification process complete
- [ ] Session management working

**Security Tests:**
- [ ] SQL injection protection in auth forms
- [ ] Rate limiting applied to auth endpoints
- [ ] CSRF protection enabled
- [ ] Password hashing algorithm verified (bcrypt/Argon2)

**Pass Criteria:**
- Complete auth flows function without errors
- Security measures prevent common attacks
- Error messages don't reveal user enumeration
- Sessions properly validated and expired

### Test Case 3.3: Session Management Settings
**Priority:** High (Should Pass)

**Test Validation:**
- [ ] JWT expiration time configured (1 hour)
- [ ] Refresh token rotation enabled
- [ ] Session persistence settings validated
- [ ] Multi-session handling configured
- [ ] Session invalidation on logout

**Pass Criteria:**
- JWT tokens expire as configured
- Refresh tokens rotate on use
- Sessions can be invalidated remotely
- Concurrent session limits respected

## Test Suite 4: Email System Configuration

### Test Case 4.1: Email Template Setup
**Priority:** High (Should Pass)

**Setup Steps:**
1. Configure email verification template
2. Setup password reset email template
3. Customize email branding for ScentMatch
4. Test email template rendering

**Test Validation:**
- [ ] Email verification template configured
- [ ] Password reset template functional
- [ ] Magic link template setup (if needed)
- [ ] Email branding applied correctly
- [ ] HTML and plain text versions available

**Pass Criteria:**
- Templates render correctly with variables
- Branding matches ScentMatch identity
- Links in emails resolve correctly
- Both HTML and text formats available

### Test Case 4.2: SMTP Configuration Testing
**Priority:** Critical (Must Pass)

**Test Validation:**
- [ ] Default Supabase SMTP functional
- [ ] Email delivery to test addresses
- [ ] Email deliverability rates acceptable
- [ ] Bounce handling configured
- [ ] SPF/DKIM records verified

**Email Delivery Tests:**
- [ ] Verification emails delivered
- [ ] Password reset emails delivered
- [ ] Delivery time < 30 seconds
- [ ] Emails not marked as spam

**Pass Criteria:**
- Test emails delivered successfully
- Delivery rate > 95% for major email providers
- Bounce notifications received and handled
- Email authentication records configured

### Test Case 4.3: Email Delivery Verification
**Priority:** High (Should Pass)

**Test Matrix:**
- [ ] Gmail delivery and rendering
- [ ] Outlook delivery and rendering
- [ ] Yahoo Mail delivery and rendering
- [ ] Mobile email client compatibility
- [ ] Spam filter avoidance

**Pass Criteria:**
- Emails render correctly across major clients
- No spam classification for properly formatted emails
- Links functional in all tested clients
- Images and styling display correctly

## Test Suite 5: Environment & Connectivity

### Test Case 5.1: Environment Variable Configuration
**Priority:** Critical (Must Pass)

**Required Environment Variables:**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Database
DATABASE_URL=postgresql://[connection-string]

# Authentication
SUPABASE_JWT_SECRET=[jwt-secret]
```

**Test Validation:**
- [ ] All required variables documented
- [ ] Environment-specific configurations separated
- [ ] Sensitive keys properly secured
- [ ] Variable loading verified in application
- [ ] Development vs production separation

**Pass Criteria:**
- All variables load correctly in Next.js app
- No sensitive keys exposed to client-side
- Environment switching works correctly
- Variable validation prevents startup with missing keys

### Test Case 5.2: Redirect URL Configuration
**Priority:** Critical (Must Pass)

**Test Validation:**
- [ ] Development URLs configured (`http://localhost:3000`)
- [ ] Production URLs prepared (Vercel domains)
- [ ] Callback URLs for auth flows working
- [ ] CORS settings allow application domains
- [ ] Wildcard subdomain support configured

**URL Test Matrix:**
- [ ] `http://localhost:3000/auth/callback`
- [ ] `https://scentmatch.vercel.app/auth/callback`
- [ ] `https://[preview-branch].vercel.app/auth/callback`

**Pass Criteria:**
- All configured URLs accept auth callbacks
- CORS errors don't block legitimate requests
- Production domains properly whitelisted

### Test Case 5.3: Client Library Connectivity
**Priority:** Critical (Must Pass)

**Test Validation:**
- [ ] @supabase/ssr client initialization
- [ ] Server-side client configuration
- [ ] Client-side client configuration
- [ ] Connection pooling working
- [ ] Error handling and retries functional

**Code Integration Tests:**
```typescript
// Test client initialization
const supabase = createClient(url, anonKey);

// Test connection
const { data, error } = await supabase.from('test').select('*');

// Test authentication
const { data: authData } = await supabase.auth.getSession();
```

**Pass Criteria:**
- Client initializes without errors
- Database queries execute successfully
- Authentication state accessible
- SSR compatibility verified

## Test Suite 6: Security & Performance

### Test Case 6.1: Connection Security Validation
**Priority:** Critical (Must Pass)

**Security Tests:**
- [ ] SSL/TLS connections enforced
- [ ] Certificate validation working
- [ ] API key rotation capability verified
- [ ] Row Level Security (RLS) configured
- [ ] Database user permissions restricted

**Security Validation:**
- [ ] No plaintext database connections allowed
- [ ] Service role key never exposed to client
- [ ] Anon key permissions appropriately limited
- [ ] Connection encryption verified

**Pass Criteria:**
- All connections use TLS encryption
- Certificate chain validation passes
- API keys can be rotated without downtime
- Database access properly segmented by role

### Test Case 6.2: Performance Benchmarks
**Priority:** Medium (Should Pass)

**Performance Tests:**
- [ ] Connection establishment time < 50ms
- [ ] Simple query response time < 100ms
- [ ] Auth token validation time < 10ms
- [ ] Concurrent connection handling
- [ ] Connection pool efficiency

**Load Testing:**
- [ ] 100 concurrent connections handled
- [ ] Database response time under load
- [ ] Connection pool doesn't exhaust
- [ ] Memory usage remains stable

**Pass Criteria:**
- Response times meet defined thresholds
- System handles expected concurrent load
- No memory leaks during extended testing
- Connection pooling prevents resource exhaustion

### Test Case 6.3: Error Handling and Logging
**Priority:** High (Should Pass)

**Error Scenarios:**
- [ ] Network connectivity loss
- [ ] Invalid credentials
- [ ] Database connection timeout
- [ ] Rate limit exceeded
- [ ] Service unavailable responses

**Logging Validation:**
- [ ] Error messages logged appropriately
- [ ] Sensitive data not logged
- [ ] Log levels configurable
- [ ] Error tracking integration possible

**Pass Criteria:**
- Application handles connection errors gracefully
- Error messages are informative but not exposing
- Logs contain sufficient detail for debugging
- No sensitive credentials appear in logs

## Success Criteria Summary

### Critical Success Requirements (Must Pass)
- [ ] Supabase project created and accessible
- [ ] All required PostgreSQL extensions installed and functional
- [ ] Email/password authentication fully configured and tested
- [ ] Environment variables properly configured and secured
- [ ] Client library connectivity validated for both SSR and client-side

### High Priority Requirements (Should Pass)
- [ ] Email system delivering messages reliably
- [ ] Performance benchmarks met for connection and query times
- [ ] Security measures properly implemented and tested
- [ ] Error handling robust and informative

### Medium Priority Requirements (Nice to Have)
- [ ] Advanced email customization working
- [ ] Load testing passes for expected traffic
- [ ] Monitoring and observability configured

## Failure Response Protocol

### Critical Failures (Stop All Work)
1. Document exact error messages and configuration settings
2. Capture screenshots of Supabase dashboard errors
3. Research with MCP tools for known issues
4. Check Supabase service status and limitations
5. Escalate to system architect if infrastructure limitations found

### High Priority Failures (Continue with Caution)
1. Document issue with workaround potential assessment
2. Check if core authentication/database functionality affected
3. Mark as technical debt if non-blocking for development
4. Continue if basic read/write operations work

### Medium Priority Failures (Document and Continue)
1. Document for future optimization
2. Assess impact on user experience
3. Create follow-up tasks for enhancement phase

## Post-Test Documentation Requirements

### Required Documentation Updates
- [ ] Update `.claude/docs/internal/solutions/2025-08-15-supabase-setup-validation.md`
- [ ] Document working configuration patterns
- [ ] Record any limitations or workarounds discovered
- [ ] Update environment variable templates

### Knowledge Capture
- [ ] Document what configurations work vs what doesn't
- [ ] Save successful setup patterns for future projects
- [ ] Note any Supabase-specific gotchas or limitations
- [ ] Update troubleshooting guides with solutions found

## Final Validation Commands

```bash
# Environment validation
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Anon key present' : 'Missing anon key')"

# Application integration test
npm run dev
# (Manually verify Supabase client initialization in console)

# Security check
npm audit --audit-level=high
```

## Backend Engineer Implementation Guidance

### Implementation Priority Order
1. **Project Setup**: Create Supabase project with proper naming and region
2. **Extensions**: Install PostgreSQL extensions (uuid-ossp, vector, pg_trgm)
3. **Authentication**: Configure email/password provider with security settings
4. **Email System**: Setup email templates and SMTP configuration
5. **Environment**: Configure environment variables and redirect URLs
6. **Client Integration**: Set up @supabase/ssr client in Next.js application
7. **Security**: Implement RLS policies and validate connection security
8. **Testing**: Run all test cases and document results

### Configuration Files to Create
- [ ] `lib/supabase/client.ts` - Client-side Supabase client
- [ ] `lib/supabase/server.ts` - Server-side Supabase client  
- [ ] `lib/supabase/middleware.ts` - Authentication middleware
- [ ] `.env.local.example` - Environment variable template
- [ ] `scripts/database/setup-extensions.sql` - Extension installation script

### Testing Implementation Notes
- Create test utilities for database connection validation
- Implement health check endpoints for monitoring
- Add error boundary components for graceful failure handling
- Configure proper TypeScript types for Supabase client

---

**QA Testing Specialist Notes:**
This specification provides comprehensive coverage of Supabase setup requirements with clear pass/fail criteria. The backend engineer should implement these tests incrementally, validating each component before proceeding to the next. Focus on security and connectivity validation as these are foundational for all subsequent development work.