# Next.js Expert Agent Documentation

## App Router Best Practices (Next.js 15)

### Server vs Client Component Patterns

**Server Components (Default)**
```typescript
// Runs on server, can access databases directly
export default async function Page() {
  const user = await getUser() // Direct database access
  return <div>Welcome {user.name}</div>
}
```

**Client Components (Interactive)**
```typescript
'use client'
// Runs in browser, for interactive features
export default function InteractiveComponent() {
  const [state, setState] = useState()
  return <button onClick={() => setState(!state)}>Toggle</button>
}
```

### Authentication Integration

**Protected Route Pattern**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Protected routes
  if (pathname.startsWith('/dashboard')) {
    const supabase = createServerClient(...)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }
  
  return NextResponse.next()
}
```

**Server Action Patterns**
```typescript
'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  // Perform database operation
  const { error } = await supabase
    .from('posts')
    .insert({ title: formData.get('title'), user_id: user.id })
    
  if (error) throw error
  redirect('/dashboard')
}
```

### Performance Optimization

**Core Web Vitals Optimization**
```typescript
// Image optimization
import Image from 'next/image'

<Image
  src="/fragrance-hero.jpg"
  alt="Fragrance discovery"
  width={800}
  height={600}
  priority // Above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// Font optimization
import { Inter, Playfair_Display } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // Prevents FOUT
})
```

**Loading and Streaming**
```typescript
// loading.tsx - Instant loading states
export default function Loading() {
  return <Skeleton />
}

// Streaming with Suspense
<Suspense fallback={<Loading />}>
  <DatabaseComponent />
</Suspense>
```

### Data Fetching Patterns

**Server Component Data Fetching**
```typescript
// Fetch data directly in server components
export default async function FragrancePage() {
  const fragrances = await getFragrances() // Direct database call
  return <FragranceList fragrances={fragrances} />
}
```

**Client Component Data Fetching**
```typescript
'use client'
import { useEffect, useState } from 'react'

export default function ClientFragranceList() {
  const [fragrances, setFragrances] = useState([])
  
  useEffect(() => {
    fetch('/api/fragrances')
      .then(res => res.json())
      .then(setFragrances)
  }, [])
  
  return <FragranceList fragrances={fragrances} />
}
```

### Route Organization

**App Router Structure**
```
app/
├── page.tsx                    # Home page
├── layout.tsx                  # Root layout
├── loading.tsx                 # Global loading
├── error.tsx                   # Global error boundary
├── not-found.tsx              # 404 page
├── auth/
│   ├── login/page.tsx         # Login page
│   ├── signup/page.tsx        # Signup page
│   └── callback/route.ts      # Auth callback
├── dashboard/
│   ├── page.tsx               # Dashboard home
│   ├── layout.tsx             # Dashboard layout
│   └── profile/page.tsx       # User profile
└── api/
    ├── auth/route.ts          # Auth endpoints
    └── fragrances/route.ts    # Fragrance API
```

### Error Handling

**Error Boundaries**
```typescript
'use client'
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

**API Route Error Handling**
```typescript
// app/api/fragrances/route.ts
export async function GET() {
  try {
    const fragrances = await getFragrances()
    return Response.json(fragrances)
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch fragrances' },
      { status: 500 }
    )
  }
}
```

### SEO & Metadata

**Dynamic Metadata**
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const fragrance = await getFragrance(params.id)
  
  return {
    title: `${fragrance.name} - ScentMatch`,
    description: fragrance.description,
    openGraph: {
      title: fragrance.name,
      description: fragrance.description,
      images: [fragrance.image_url],
    },
  }
}
```

## Performance Best Practices

### Bundle Optimization
- Use dynamic imports for heavy components
- Implement code splitting at route level
- Lazy load below-the-fold content

### Caching Strategies
```typescript
// Static generation for public data
export default async function StaticPage() {
  const fragrances = await getFragrances()
  return <FragranceGrid fragrances={fragrances} />
}

// ISR for frequently updated data
export const revalidate = 3600 // Revalidate hourly
```

### Memory Management
- Clean up event listeners in useEffect
- Avoid memory leaks with proper dependency arrays
- Use React.memo for expensive components

## Common Patterns

### Form Handling with Server Actions
```typescript
// Server action
'use server'
export async function updateProfile(formData: FormData) {
  const name = formData.get('name') as string
  // Process form data
}

// Form component
<form action={updateProfile}>
  <input name="name" />
  <button type="submit">Update</button>
</form>
```

### Environment-Specific Logic
```typescript
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
const isPreview = process.env.VERCEL_ENV === 'preview'
```