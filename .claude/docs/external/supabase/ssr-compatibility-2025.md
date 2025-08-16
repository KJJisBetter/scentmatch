# Supabase SSR Compatibility Research

**Date Cached:** 2025-08-15
**Sources:** Supabase official docs, Exa AI web search
**Relevance:** Critical for Next.js 15 + React 19 compatibility

## Key Findings

### Current Stable Package: @supabase/ssr
- ✅ **Latest stable** for Next.js 15 SSR
- ✅ **Replaces deprecated** @supabase/auth-helpers-nextjs
- ✅ **Active development** - all bug fixes focused here
- ✅ **Next.js 15 App Router** fully supported

### Deprecated Packages to Avoid
- ❌ `@supabase/auth-helpers-nextjs` - Being deprecated
- ❌ `@supabase/auth-helpers-*` - No longer maintained

### Required Client Setup
1. **Browser Client** - `createBrowserClient` for client components
2. **Server Client** - `createServerClient` for server components  
3. **Middleware** - Session refresh for SSR auth
4. **Environment Variables** - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

### Compatibility Matrix
- ✅ Next.js 13+ App Router
- ✅ Next.js 15 confirmed working
- ✅ React 19 compatible
- ✅ TypeScript full support

### Required Dependencies
```json
{
  "@supabase/ssr": "latest",
  "@supabase/supabase-js": "latest"
}
```

### Implementation Pattern
```typescript
// Browser client for client components
import { createBrowserClient } from '@supabase/ssr'

// Server client for server components
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
```

**Sources:**
- https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://mohamedkadi.com/blog/nextjs-supabase-auth-2025