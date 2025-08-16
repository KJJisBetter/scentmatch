# Test Execution Checklist - Task 2.1: Supabase Setup

## Pre-Execution Setup

### Environment Verification
- [ ] Task 1.1 build stability confirmed (✅ Complete)
- [ ] Supabase account created and accessible
- [ ] Test email addresses prepared (2-3 different providers)
- [ ] Network connectivity to Supabase services verified (`ping db.supabase.co`)
- [ ] Backup current environment configurations

### Test Data Preparation
- [ ] Sample user credentials for testing authentication flows
- [ ] Test database connection strings documented
- [ ] Performance baseline metrics recorded
- [ ] Security testing checklist prepared

## Critical Test Execution Sequence

### Phase 1: Infrastructure Setup (Must Pass)

#### Test Case 1.1: Supabase Project Creation
- [ ] Create project with naming: `scentmatch-development`
- [ ] Select US East region for optimal performance
- [ ] Configure strong database password (documented securely)
- [ ] Verify project URL and API endpoints accessible
- [ ] **Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

#### Test Case 1.2: PostgreSQL Extensions Installation
- [ ] Install uuid-ossp extension via SQL editor
- [ ] Install vector extension for AI features
- [ ] Install pg_trgm extension for fuzzy search
- [ ] Verify all extensions functional with test queries
- [ ] **Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

#### Test Case 1.3: Database Connectivity Validation
- [ ] Test connection from development environment
- [ ] Verify SSL/TLS encryption enforced
- [ ] Validate connection pooling configuration
- [ ] Check API endpoint response times (< 100ms)
- [ ] **Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

### Phase 2: Authentication Configuration (Must Pass)

#### Test Case 2.1: Email/Password Provider Setup
- [ ] Enable email/password authentication in dashboard
- [ ] Configure email confirmation requirement
- [ ] Set password complexity rules (min 8 chars, mixed case)
- [ ] Test complete signup/login flow
- [ ] **Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

#### Test Case 2.2: Email System Configuration
- [ ] Configure email verification template
- [ ] Setup password reset email template
- [ ] Test email delivery to multiple providers (Gmail, Outlook)
- [ ] Verify email deliverability (< 30 seconds)
- [ ] **Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

#### Test Case 2.3: Session Management Validation
- [ ] Configure JWT expiration (1 hour)
- [ ] Enable refresh token rotation
- [ ] Test session invalidation on logout
- [ ] Verify concurrent session handling
- [ ] **Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

### Phase 3: Client Integration (Should Pass)

#### Test Case 3.1: Environment Variable Configuration
- [ ] Setup NEXT_PUBLIC_SUPABASE_URL
- [ ] Configure NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] Secure SUPABASE_SERVICE_ROLE_KEY
- [ ] Test variable loading in Next.js application
- [ ] **Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

#### Test Case 3.2: @supabase/ssr Client Setup
- [ ] Install and configure client library
- [ ] Test server-side client initialization
- [ ] Test client-side client initialization
- [ ] Verify SSR compatibility
- [ ] **Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

#### Test Case 3.3: Redirect URL Configuration
- [ ] Configure localhost:3000 for development
- [ ] Setup Vercel domain for production
- [ ] Test auth callback flows
- [ ] Verify CORS settings
- [ ] **Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

### Phase 4: Security & Performance (Should Pass)

#### Test Case 4.1: Security Validation
- [ ] Verify SSL/TLS connections enforced
- [ ] Test API key security (no client exposure)
- [ ] Validate Row Level Security (RLS) setup
- [ ] Check rate limiting configuration
- [ ] **Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

#### Test Case 4.2: Performance Benchmarks
- [ ] Connection establishment time < 50ms
- [ ] Simple query response time < 100ms
- [ ] Auth token validation time < 10ms
- [ ] Test 100 concurrent connections
- [ ] **Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

#### Test Case 4.3: Error Handling Validation
- [ ] Test network connectivity loss scenarios
- [ ] Verify invalid credential handling
- [ ] Test database connection timeout recovery
- [ ] Validate error logging (no sensitive data)
- [ ] **Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

## Failure Response Protocol

### Critical Failures (Stop All Work)
If any Phase 1 or Phase 2 test fails:
1. **Document** exact error message and context
2. **Capture** screenshots of Supabase dashboard errors
3. **Research** error with MCP servers:
   - `mcp__firecrawl__firecrawl_search` for Supabase setup issues
   - `mcp__Ref__ref_search_documentation` for official Supabase docs
4. **Document** findings in `.claude/docs/internal/solutions/2025-08-15-supabase-[issue-name].md`
5. **Escalate** to system architect if infrastructure limitations

### High Priority Failures (Continue with Caution)
If Phase 3 tests fail:
1. **Assess** if core database/auth functionality affected
2. **Document** issue with potential workarounds
3. **Mark** as technical debt if non-blocking
4. **Continue** if basic CRUD operations work

### Medium Priority Failures (Document and Continue)
If Phase 4 tests fail:
1. **Document** performance issues for optimization
2. **Check** if security baseline met
3. **Create** follow-up tasks for enhancement
4. **Continue** development if functional

## Critical Extension Testing

### UUID-OSSP Extension Validation
```sql
-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';

-- Test functionality
SELECT uuid_generate_v4();

-- Performance test
EXPLAIN ANALYZE SELECT uuid_generate_v4() FROM generate_series(1,1000);
```

**Expected Results:**
- Extension appears in pg_extension table
- UUID generation produces valid v4 format
- 1000 UUIDs generated in < 10ms

### pgvector Extension Validation
```sql
-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Test vector type
CREATE TABLE test_embeddings (
  id serial PRIMARY KEY,
  content text,
  embedding vector(1536)
);

-- Test similarity search
SELECT content, embedding <-> '[0.1,0.2,0.3]'::vector as distance 
FROM test_embeddings 
ORDER BY distance 
LIMIT 5;
```

**Expected Results:**
- Vector extension installed without errors
- Vector tables created successfully
- Similarity operations return numeric distances

### pg_trgm Extension Validation
```sql
-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'pg_trgm';

-- Test similarity function
SELECT similarity('fragrance', 'fragance');
SELECT similarity('perfume', 'parfum');

-- Test trigram index
CREATE INDEX test_name_trgm_idx ON test_table USING gin (name gin_trgm_ops);
```

**Expected Results:**
- Similarity returns float between 0-1
- Higher similarity for closer matches
- Trigram indexes created successfully

## Authentication Flow Testing

### Complete Signup Flow
1. **Navigate** to signup page
2. **Enter** test email: `test+scentmatch@example.com`
3. **Enter** password meeting complexity requirements
4. **Verify** email confirmation sent
5. **Click** confirmation link in email
6. **Confirm** account activated and login possible

### Password Reset Flow
1. **Navigate** to password reset page
2. **Enter** registered email address
3. **Verify** reset email delivered (< 30 seconds)
4. **Click** reset link from email
5. **Enter** new password meeting requirements
6. **Confirm** login with new password works

### Session Management Testing
1. **Login** with valid credentials
2. **Verify** JWT token in browser storage
3. **Wait** for token expiration (or manipulate for testing)
4. **Verify** automatic refresh token use
5. **Logout** and confirm token invalidation

## Success Criteria Validation

### Minimum Viable Setup Success
- [ ] Supabase project accessible and functional
- [ ] All required PostgreSQL extensions installed
- [ ] Email/password authentication working end-to-end
- [ ] Client library connecting without errors
- [ ] Environment variables properly configured

### Full Setup Success
- [ ] All test phases pass completely
- [ ] Performance benchmarks met consistently
- [ ] Security measures properly implemented
- [ ] Error handling robust and informative
- [ ] Email system delivering reliably

### Ready for Development Criteria
- [ ] Minimum viable setup success achieved
- [ ] Database schema ready for application tables
- [ ] Authentication system ready for user registration
- [ ] Client integration patterns documented

## Post-Execution Documentation

### Required Documentation Updates
- [ ] Update `.claude/docs/internal/solutions/2025-08-15-supabase-setup-complete.md`
- [ ] Document working Supabase configuration patterns
- [ ] Record any limitations or workarounds discovered
- [ ] Update `.env.local.example` with required variables

### Knowledge Capture
- [ ] Document successful configuration steps
- [ ] Save troubleshooting solutions found
- [ ] Note Supabase-specific gotchas or limitations
- [ ] Update team knowledge base with setup patterns

### Configuration Files Created
- [ ] `lib/supabase/client.ts` - Client-side Supabase client
- [ ] `lib/supabase/server.ts` - Server-side Supabase client
- [ ] `lib/supabase/middleware.ts` - Authentication middleware
- [ ] `scripts/database/setup-extensions.sql` - Extension setup
- [ ] `.env.local.example` - Environment variable template

## Final Validation Commands

```bash
# Environment variable check
node -e "
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log('URL:', url ? 'Configured' : 'Missing');
console.log('Key:', key ? 'Configured' : 'Missing');
"

# Client connection test
npm run dev
# Check browser console for Supabase client initialization

# Database connectivity test
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
client.from('test').select('*').then(r => console.log('DB Status:', r.error ? 'Error' : 'Connected'));
"

# Security audit
npm audit --audit-level=high
```

## Sign-off Requirements

**Task 2.1 Complete When:**
- [ ] All critical tests pass (Phase 1 & 2)
- [ ] Supabase project operational and secured
- [ ] Authentication system functional end-to-end
- [ ] Client integration working in Next.js app
- [ ] Documentation complete and patterns saved

**Backend Engineer Confirmation:**
- Implementation: _______________
- Testing: _______________
- Documentation: _______________

**QA Testing Specialist Sign-off:**
- Validation: _______________
- Date: _______________
- Notes: _______________

---

*This checklist follows the QA Testing Specialist protocol for infrastructure validation and security testing*