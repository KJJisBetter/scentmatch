# Backend Implementation Guide - Task 2.1: Supabase Setup

## Quick Reference for Backend Engineer

**Objective:** Implement Supabase project setup and pass all QA test specifications  
**Testing Framework:** Follow test specifications in `task-2-1-supabase-setup-test-spec.md`  
**Validation:** Use execution checklist in `task-2-1-supabase-execution-checklist.md`

## Implementation Sequence

### Step 1: Supabase Project Creation
```bash
# Navigate to https://supabase.com/dashboard
# Create new project:
# - Name: scentmatch-development
# - Region: US East (Ohio) - us-east-1
# - Database Password: Generate strong password (save securely)
```

**QA Validation Points:**
- Project URL follows format: `https://[unique-id].supabase.co`
- Database accessible via dashboard SQL editor
- API keys generated (anon and service_role)

### Step 2: PostgreSQL Extensions Installation
```sql
-- Run in Supabase SQL Editor
-- Extension 1: UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension 2: Vector embeddings for AI
CREATE EXTENSION IF NOT EXISTS vector;

-- Extension 3: Fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Verify installations
SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector', 'pg_trgm');
```

**QA Validation Points:**
- All three extensions show in query results
- `SELECT uuid_generate_v4();` returns valid UUID
- Vector type available: `SELECT '[1,2,3]'::vector;`
- Trigram similarity works: `SELECT similarity('test', 'tst');`

### Step 3: Authentication Configuration
```bash
# In Supabase Dashboard -> Authentication -> Providers
# 1. Enable Email provider
# 2. Configure settings:
#    - Email confirmations: Enabled
#    - Password policy: Minimum 8 characters
#    - Session duration: 1 hour (3600 seconds)
#    - Refresh token rotation: Enabled
```

**Email Templates (Authentication -> Email Templates):**
- Confirmation: Customize subject "Welcome to ScentMatch - Verify Email"
- Password Reset: Customize subject "ScentMatch Password Reset"
- Magic Link: Customize subject "ScentMatch Login Link"

**QA Validation Points:**
- Test signup with `test+scentmatch@gmail.com`
- Confirmation email delivered within 30 seconds
- Login flow works after email confirmation
- Password reset emails delivered and functional

### Step 4: Environment Configuration

Create environment variables:
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

Update redirect URLs in Supabase Dashboard -> Authentication -> URL Configuration:
```
Site URL: http://localhost:3000
Redirect URLs:
- http://localhost:3000/auth/callback
- https://scentmatch.vercel.app/auth/callback
- https://*.vercel.app/auth/callback
```

**QA Validation Points:**
- Environment variables load in Next.js (`console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)`)
- No sensitive keys exposed to client-side
- Auth callbacks work for all configured URLs

### Step 5: Client Library Setup

Install dependencies:
```bash
npm install @supabase/supabase-js @supabase/ssr
```

Create client configuration files:

**File: `lib/supabase/client.ts`**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**File: `lib/supabase/server.ts`**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

**File: `lib/supabase/middleware.ts`**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object before returning it.

  return supabaseResponse
}
```

**File: `middleware.ts` (root level)**
```typescript
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**QA Validation Points:**
- Client initializes without TypeScript errors
- Server-side client works in API routes
- Client-side client works in components
- Authentication state accessible via `supabase.auth.getUser()`

### Step 6: Database Testing Setup

Create test scripts for extensions:

**File: `scripts/database/test-extensions.sql`**
```sql
-- Test UUID extension
DO $$
DECLARE
    test_uuid uuid;
BEGIN
    -- Test UUID generation
    SELECT uuid_generate_v4() INTO test_uuid;
    RAISE NOTICE 'UUID test passed: %', test_uuid;
    
    -- Performance test
    PERFORM uuid_generate_v4() FROM generate_series(1,1000);
    RAISE NOTICE 'UUID performance test completed';
END $$;

-- Test Vector extension
DO $$
DECLARE
    test_similarity float;
BEGIN
    -- Create test table
    CREATE TEMP TABLE test_vectors (
        id serial PRIMARY KEY,
        embedding vector(3)
    );
    
    -- Insert test data
    INSERT INTO test_vectors (embedding) VALUES 
        ('[1,2,3]'::vector),
        ('[4,5,6]'::vector);
    
    -- Test similarity
    SELECT embedding <-> '[1,2,4]'::vector INTO test_similarity
    FROM test_vectors LIMIT 1;
    
    RAISE NOTICE 'Vector similarity test passed: %', test_similarity;
END $$;

-- Test Trigram extension
DO $$
DECLARE
    test_similarity float;
BEGIN
    -- Test similarity function
    SELECT similarity('fragrance', 'fragance') INTO test_similarity;
    RAISE NOTICE 'Trigram similarity test passed: %', test_similarity;
    
    -- Test with perfume terms
    SELECT similarity('perfume', 'parfum') INTO test_similarity;
    RAISE NOTICE 'Perfume similarity test: %', test_similarity;
END $$;
```

**QA Validation Points:**
- All notices appear without errors when script runs
- UUID generation produces valid v4 format
- Vector similarity returns numeric values
- Trigram similarity returns values between 0-1

### Step 7: Authentication Testing Implementation

Create test pages for authentication flow validation:

**File: `app/test/auth/page.tsx`** (temporary testing page)
```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function AuthTest() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const testSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    setMessage(error ? `Error: ${error.message}` : 'Signup successful! Check email.')
  }

  const testLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setMessage(error ? `Error: ${error.message}` : 'Login successful!')
  }

  return (
    <div className="p-8">
      <h1>Authentication Test</h1>
      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full p-2 border"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full p-2 border"
        />
        <div className="space-x-4">
          <button onClick={testSignup} className="px-4 py-2 bg-blue-500 text-white">
            Test Signup
          </button>
          <button onClick={testLogin} className="px-4 py-2 bg-green-500 text-white">
            Test Login
          </button>
        </div>
        {message && <p className="text-sm">{message}</p>}
      </div>
    </div>
  )
}
```

**QA Validation Points:**
- Test page renders without errors
- Signup creates user and sends confirmation email
- Login works after email confirmation
- Error messages display appropriately

### Step 8: Performance and Security Validation

Create performance test script:

**File: `scripts/database/performance-test.js`**
```javascript
const { createClient } = require('@supabase/supabase-js')

async function runPerformanceTests() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  console.log('Running Supabase performance tests...')

  // Test 1: Connection time
  const connectionStart = Date.now()
  const { data: connectionTest } = await supabase.from('information_schema.tables').select('table_name').limit(1)
  const connectionTime = Date.now() - connectionStart
  console.log(`Connection test: ${connectionTime}ms`)

  // Test 2: Auth validation time
  const authStart = Date.now()
  await supabase.auth.getSession()
  const authTime = Date.now() - authStart
  console.log(`Auth validation: ${authTime}ms`)

  // Test 3: Multiple concurrent requests
  const concurrentStart = Date.now()
  const promises = Array(10).fill().map(() => 
    supabase.from('information_schema.tables').select('table_name').limit(1)
  )
  await Promise.all(promises)
  const concurrentTime = Date.now() - concurrentStart
  console.log(`10 concurrent requests: ${concurrentTime}ms`)

  console.log('Performance tests completed')
}

if (require.main === module) {
  runPerformanceTests().catch(console.error)
}

module.exports = { runPerformanceTests }
```

**QA Validation Points:**
- Connection time < 50ms
- Auth validation < 10ms
- Concurrent requests complete without errors
- No connection pool exhaustion

## Common Issues and Solutions

### Issue: Vector extension not available
**Solution:** Ensure you're using Supabase, not local PostgreSQL. Vector extension comes pre-installed on Supabase.

### Issue: Email delivery slow or failing
**Solution:** Check Supabase email settings, verify test email addresses are valid, check spam folders.

### Issue: Authentication redirects not working
**Solution:** Verify redirect URLs in Supabase dashboard exactly match your application URLs.

### Issue: Environment variables not loading
**Solution:** Restart development server after adding .env.local, verify variable names exactly match.

### Issue: Connection timeout errors
**Solution:** Check database region selection, verify network connectivity, check Supabase status page.

## QA Testing Coordination

1. **Implementation Phase:** Backend engineer implements each step sequentially
2. **Testing Phase:** QA testing specialist validates each component using test specifications
3. **Validation Phase:** Run execution checklist to confirm all requirements met
4. **Documentation Phase:** Update solution documents and patterns for future reference

## Success Confirmation

**Backend Engineer delivers:**
- [ ] Supabase project operational with all extensions
- [ ] Authentication system functional end-to-end
- [ ] Client library integrated in Next.js application
- [ ] Environment configuration properly secured
- [ ] All test cases passing according to QA specifications

**QA Testing Specialist validates:**
- [ ] All critical test cases pass
- [ ] Performance benchmarks met
- [ ] Security measures properly implemented
- [ ] Error handling robust and informative
- [ ] Documentation complete and accurate

---

**Note:** This implementation guide provides the technical steps while the QA specifications provide the validation criteria. Both documents should be used together to ensure complete and tested Supabase setup.