# Supabase Expert Agent Documentation

## Core SSR Authentication Patterns

### Client Configuration for Next.js App Router

**Browser Client (Client Components)**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server Client (Server Components)**
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
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}
```

**Middleware Configuration**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.getUser()
  return response
}
```

## Row Level Security (RLS) Best Practices

### User Data Isolation Patterns

**User Profiles Table RLS**
```sql
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to access their own data
CREATE POLICY "Users can access own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);
```

**User Collections RLS**
```sql
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own collections" ON user_collections
  FOR ALL USING (auth.uid() = user_id);
```

**Public Data Access**
```sql
-- Allow anonymous read access to public fragrance data
CREATE POLICY "Public read access" ON fragrances
  FOR SELECT USING (true);

CREATE POLICY "Public read access" ON fragrance_brands  
  FOR SELECT USING (true);
```

## Authentication Flow Patterns

### User Registration with Profile Creation
```typescript
export async function signUp(email: string, password: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) throw error

  // Create user profile after successful registration
  if (data.user) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: data.user.id,
        email: data.user.email,
        experience_level: 'beginner'
      })
    
    if (profileError) throw profileError
  }

  return data
}
```

### Session Management
```typescript
export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}
```

## Database Optimization Patterns

### pgvector Integration
```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to fragrances
ALTER TABLE fragrances ADD COLUMN embedding vector(1536);

-- Create vector index for similarity search
CREATE INDEX ON fragrances USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Performance Optimization
```sql
-- Indexes for common queries
CREATE INDEX idx_fragrances_brand_rating ON fragrances(brand_id, rating_value DESC);
CREATE INDEX idx_fragrances_gender ON fragrances(gender);
CREATE INDEX idx_collections_user_type ON user_collections(user_id, collection_type);

-- Full-text search
CREATE INDEX idx_fragrances_search ON fragrances 
USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
```

## Common Pitfalls & Solutions

### Environment Variables
- Use NEXT_PUBLIC_ prefix for client-side variables
- Never expose service role key to client
- Use different keys for development vs production

### Session Refresh
- Middleware required for SSR session refresh
- Call supabase.auth.getUser() in middleware to refresh expired sessions

### Deprecated Packages
- @supabase/auth-helpers-nextjs is deprecated
- Use @supabase/ssr for all new projects
- Migration guide: https://supabase.com/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers

### RLS Policy Testing
```sql
-- Test RLS policies work correctly
SET role TO anon; -- Simulate anonymous user
SELECT * FROM user_profiles; -- Should return no results

SET role TO authenticated; -- Simulate authenticated user  
SET request.jwt.claims TO '{"sub": "user-uuid-here"}';
SELECT * FROM user_profiles; -- Should return only that user's profile
```