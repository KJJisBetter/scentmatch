# API Architecture

## API Design Principles

- **RESTful where appropriate**: Standard CRUD operations
- **Server Actions for mutations**: Leverage Next.js 15 server actions for form handling
- **Type-safe**: Full TypeScript with generated Supabase types
- **Error boundaries**: Graceful error handling at every level
- **Rate limiting**: Protect against abuse
- **Caching**: Multi-layer caching strategy

## API Route Structure

### Authentication Routes

#### POST `/api/auth/signup`
```typescript
// app/api/auth/signup/route.ts
export async function POST(request: Request) {
  const { email, password, username, displayName } = await request.json()
  
  // Validation
  const validation = validateSignupData({ email, password, username })
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }
  
  // Check username availability
  const usernameExists = await checkUsernameExists(username)
  if (usernameExists) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  }
  
  // Create user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: displayName }
    }
  })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  
  return NextResponse.json({ 
    user: data.user,
    message: 'Check your email for confirmation' 
  })
}
```

#### POST `/api/auth/login`
```typescript
// app/api/auth/login/route.ts
export async function POST(request: Request) {
  const { email, password } = await request.json()
  
  // Rate limiting check
  const rateLimitOk = await checkRateLimit(request, 'login', 10)
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
  
  // Set secure cookie
  const response = NextResponse.json({ user: data.user })
  response.cookies.set('sb-access-token', data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
  
  return response
}
```

#### POST `/api/auth/logout`
```typescript
// app/api/auth/logout/route.ts
export async function POST() {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  
  const response = NextResponse.json({ success: true })
  response.cookies.delete('sb-access-token')
  
  return response
}
```

#### GET `/api/auth/session`
```typescript
// app/api/auth/session/route.ts
export async function GET() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json({ session: null }, { status: 401 })
  }
  
  return NextResponse.json({ session })
}
```

### Fragrance Routes

#### GET `/api/fragrances`
```typescript
// app/api/fragrances/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  // Parse query parameters
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const search = searchParams.get('search')
  const gender = searchParams.get('gender')
  const concentration = searchParams.get('concentration')
  const brands = searchParams.get('brands')?.split(',')
  const notes = searchParams.get('notes')?.split(',')
  const sortBy = searchParams.get('sortBy') || 'popularity'
  
  // Build query
  let query = supabase
    .from('fragrances')
    .select(`
      *,
      brand:brands!inner(*)
    `, { count: 'exact' })
  
  // Apply filters
  if (search) {
    query = query.or(`name.ilike.%${search}%,brand.name.ilike.%${search}%`)
  }
  if (gender) {
    query = query.eq('gender', gender)
  }
  if (concentration) {
    query = query.eq('concentration', concentration)
  }
  if (brands?.length) {
    query = query.in('brand_id', brands)
  }
  if (notes?.length) {
    query = query.contains('top_notes', notes)
      .or(`contains.heart_notes.${notes}`)
      .or(`contains.base_notes.${notes}`)
  }
  
  // Apply sorting
  switch (sortBy) {
    case 'popularity':
      query = query.order('popularity_score', { ascending: false })
      break
    case 'rating':
      query = query.order('avg_rating', { ascending: false })
      break
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    case 'name':
      query = query.order('name', { ascending: true })
      break
  }
  
  // Pagination
  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)
  
  const { data, error, count } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Cache for 5 minutes
  return NextResponse.json(
    {
      fragrances: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
      }
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    }
  )
}
```

#### GET `/api/fragrances/[id]`
```typescript
// app/api/fragrances/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from('fragrances')
    .select(`
      *,
      brand:brands(*),
      reviews:reviews(
        *,
        user:profiles(username, display_name, avatar_url)
      )
    `)
    .eq('id', params.id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Fragrance not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Cache for 1 hour
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
    }
  })
}
```

#### GET `/api/fragrances/[id]/similar`
```typescript
// app/api/fragrances/[id]/similar/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)
  
  // Check cache first
  const cached = await redis.get(`similar:${params.id}:${limit}`)
  if (cached) {
    return NextResponse.json(JSON.parse(cached))
  }
  
  // Get fragrance embedding
  const { data: fragrance, error: fragranceError } = await supabase
    .from('fragrances')
    .select('embedding')
    .eq('id', params.id)
    .single()
  
  if (fragranceError || !fragrance.embedding) {
    return NextResponse.json({ error: 'Fragrance not found' }, { status: 404 })
  }
  
  // Find similar fragrances using vector similarity
  const { data, error } = await supabase.rpc('find_similar_fragrances', {
    query_embedding: fragrance.embedding,
    match_threshold: 0.7,
    match_count: limit
  })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Cache for 1 day
  await redis.set(`similar:${params.id}:${limit}`, JSON.stringify(data), {
    ex: 86400
  })
  
  return NextResponse.json(data)
}
```

### Collection Routes

#### GET `/api/collection`
```typescript
// app/api/collection/route.ts
export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // owned, wishlist, tested, etc.
  
  let query = supabase
    .from('user_fragrances')
    .select(`
      *,
      fragrance:fragrances(
        *,
        brand:brands(*)
      )
    `)
    .eq('user_id', session.user.id)
  
  if (status) {
    query = query.eq('status', status)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
```

### Recommendation Routes

#### GET `/api/recommendations`
```typescript
// app/api/recommendations/route.ts
export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  
  // Check cache
  const cacheKey = `recs:${session.user.id}:${type || 'all'}:${limit}`
  const cached = await redis.get(cacheKey)
  if (cached) {
    return NextResponse.json(JSON.parse(cached))
  }
  
  let query = supabase
    .from('recommendations')
    .select(`
      *,
      fragrance:fragrances(
        *,
        brand:brands(*)
      )
    `)
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
  
  if (type) {
    query = query.eq('recommendation_type', type)
  }
  
  const { data, error } = await query
    .order('overall_score', { ascending: false })
    .limit(limit)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Cache for 1 hour
  await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 })
  
  return NextResponse.json(data)
}
```

#### POST `/api/recommendations/generate`
```typescript
// app/api/recommendations/generate/route.ts
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Rate limit recommendation generation
  const rateLimitOk = await checkRateLimit(request, 'generate_recs', 5)
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  
  try {
    // Trigger Supabase Edge Function for recommendation generation
    const { data, error } = await supabase.functions.invoke('generate-recommendations', {
      body: { userId: session.user.id }
    })
    
    if (error) throw error
    
    // Invalidate cache
    await redis.del(`recs:${session.user.id}:*`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Recommendations generated',
      count: data.count 
    })
  } catch (error) {
    console.error('Recommendation generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
```

## Server Actions

### Collection Management

```typescript
// app/actions/collection.ts
'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const AddToCollectionSchema = z.object({
  fragranceId: z.string().uuid(),
  status: z.enum(['owned', 'wishlist', 'tested', 'decant', 'sample']),
  bottleSize: z.number().positive().optional(),
  purchasePrice: z.number().positive().optional(),
  rating: z.number().min(0).max(5).optional(),
  notes: z.string().max(1000).optional()
})

export async function addToCollection(formData: FormData) {
  const supabase = createServerActionClient({ cookies })
  
  const validatedFields = AddToCollectionSchema.safeParse({
    fragranceId: formData.get('fragranceId'),
    status: formData.get('status'),
    bottleSize: formData.get('bottleSize') ? Number(formData.get('bottleSize')) : undefined,
    purchasePrice: formData.get('purchasePrice') ? Number(formData.get('purchasePrice')) : undefined,
    rating: formData.get('rating') ? Number(formData.get('rating')) : undefined,
    notes: formData.get('notes')
  })
  
  if (!validatedFields.success) {
    return {
      error: 'Invalid input',
      issues: validatedFields.error.issues
    }
  }
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }
  
  const { error } = await supabase
    .from('user_fragrances')
    .upsert({
      user_id: session.user.id,
      fragrance_id: validatedFields.data.fragranceId,
      status: validatedFields.data.status,
      bottle_size: validatedFields.data.bottleSize,
      purchase_price: validatedFields.data.purchasePrice,
      rating: validatedFields.data.rating,
      personal_notes: validatedFields.data.notes
    })
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/collection')
  revalidatePath(`/fragrances/${validatedFields.data.fragranceId}`)
  
  return { success: true }
}

export async function removeFromCollection(fragranceId: string) {
  const supabase = createServerActionClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }
  
  const { error } = await supabase
    .from('user_fragrances')
    .delete()
    .eq('user_id', session.user.id)
    .eq('fragrance_id', fragranceId)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/collection')
  revalidatePath(`/fragrances/${fragranceId}`)
  
  return { success: true }
}

export async function updateFragranceRating(
  fragranceId: string,
  rating: number
) {
  const supabase = createServerActionClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }
  
  const { error } = await supabase
    .from('user_fragrances')
    .update({ rating })
    .eq('user_id', session.user.id)
    .eq('fragrance_id', fragranceId)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/collection')
  revalidatePath(`/fragrances/${fragranceId}`)
  
  return { success: true }
}
```

### Review Management

```typescript
// app/actions/reviews.ts
'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ReviewSchema = z.object({
  fragranceId: z.string().uuid(),
  rating: z.number().min(0).max(5),
  title: z.string().min(3).max(100).optional(),
  content: z.string().min(10).max(5000),
  longevityRating: z.number().min(0).max(5).optional(),
  sillageRating: z.number().min(0).max(5).optional(),
  valueRating: z.number().min(0).max(5).optional()
})

export async function createReview(formData: FormData) {
  const supabase = createServerActionClient({ cookies })
  
  const validatedFields = ReviewSchema.safeParse({
    fragranceId: formData.get('fragranceId'),
    rating: Number(formData.get('rating')),
    title: formData.get('title'),
    content: formData.get('content'),
    longevityRating: formData.get('longevityRating') ? Number(formData.get('longevityRating')) : undefined,
    sillageRating: formData.get('sillageRating') ? Number(formData.get('sillageRating')) : undefined,
    valueRating: formData.get('valueRating') ? Number(formData.get('valueRating')) : undefined
  })
  
  if (!validatedFields.success) {
    return {
      error: 'Invalid input',
      issues: validatedFields.error.issues
    }
  }
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }
  
  // Check if user owns or has tested the fragrance
  const { data: userFragrance } = await supabase
    .from('user_fragrances')
    .select('status')
    .eq('user_id', session.user.id)
    .eq('fragrance_id', validatedFields.data.fragranceId)
    .single()
  
  const { error } = await supabase
    .from('reviews')
    .insert({
      user_id: session.user.id,
      fragrance_id: validatedFields.data.fragranceId,
      rating: validatedFields.data.rating,
      title: validatedFields.data.title,
      content: validatedFields.data.content,
      longevity_rating: validatedFields.data.longevityRating,
      sillage_rating: validatedFields.data.sillageRating,
      value_rating: validatedFields.data.valueRating,
      verified_purchase: userFragrance?.status === 'owned',
      ownership_status: userFragrance?.status
    })
  
  if (error) {
    if (error.code === '23505') { // Unique violation
      return { error: 'You have already reviewed this fragrance' }
    }
    return { error: error.message }
  }
  
  revalidatePath(`/fragrances/${validatedFields.data.fragranceId}`)
  
  return { success: true }
}

export async function voteReview(
  reviewId: string,
  voteType: 'helpful' | 'unhelpful'
) {
  const supabase = createServerActionClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }
  
  const { error } = await supabase
    .from('review_votes')
    .upsert({
      review_id: reviewId,
      user_id: session.user.id,
      vote_type: voteType
    })
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}
```

## Error Handling

```typescript
// app/lib/errors.ts
export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export const ErrorCodes = {
  // Authentication
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Data
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // External Services
  SUPABASE_ERROR: 'SUPABASE_ERROR',
  VOYAGE_AI_ERROR: 'VOYAGE_AI_ERROR',
  
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const

// Error handler middleware
export function handleAPIError(error: unknown): NextResponse {
  console.error('API Error:', error)
  
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details
      },
      { status: error.status }
    )
  }
  
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: ErrorCodes.VALIDATION_FAILED,
        details: error.issues
      },
      { status: 400 }
    )
  }
  
  // Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as any
    return NextResponse.json(
      {
        error: supabaseError.message || 'Database error',
        code: ErrorCodes.SUPABASE_ERROR,
        details: supabaseError.code
      },
      { status: 500 }
    )
  }
  
  // Generic error
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: ErrorCodes.INTERNAL_ERROR
    },
    { status: 500 }
  )
}
```

## Rate Limiting

```typescript
// app/lib/rate-limit.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

interface RateLimitConfig {
  requests: number
  window: number // in seconds
}

const rateLimitConfigs: Record<string, RateLimitConfig> = {
  login: { requests: 10, window: 3600 }, // 10 per hour
  signup: { requests: 5, window: 3600 }, // 5 per hour
  generate_recs: { requests: 5, window: 3600 }, // 5 per hour
  api_default: { requests: 100, window: 60 } // 100 per minute
}

export async function checkRateLimit(
  request: Request,
  action: string,
  customLimit?: number
): Promise<boolean> {
  const config = rateLimitConfigs[action] || rateLimitConfigs.api_default
  const limit = customLimit || config.requests
  
  // Get IP address
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const key = `rate_limit:${action}:${ip}`
  
  try {
    const pipeline = redis.pipeline()
    pipeline.incr(key)
    pipeline.expire(key, config.window)
    
    const results = await pipeline.exec()
    const count = results[0][1] as number
    
    return count <= limit
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Fail open in case of Redis error
    return true
  }
}

// Middleware for API routes
export function withRateLimit(
  handler: (request: Request) => Promise<NextResponse>,
  action?: string
) {
  return async (request: Request) => {
    const limited = await checkRateLimit(request, action || 'api_default')
    
    if (!limited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }
    
    return handler(request)
  }
}
```

## Type Definitions

```typescript
// app/types/api.ts
export interface APIResponse<T = any> {
  data?: T
  error?: string
  code?: string
  details?: any
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface FragranceFilters {
  search?: string
  gender?: 'masculine' | 'feminine' | 'unisex'
  concentration?: string
  brands?: string[]
  notes?: string[]
  minPrice?: number
  maxPrice?: number
  hasS sample?: boolean
  discontinued?: boolean
}

export interface RecommendationFilters {
  type?: 'similar' | 'complementary' | 'adventure' | 'trending' | 'seasonal'
  limit?: number
  excludeOwned?: boolean
}

// Supabase generated types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          experience_level: 'beginner' | 'enthusiast' | 'collector' | null
          scent_preferences: Json
          onboarding_completed: boolean
          subscription_tier: 'free' | 'premium' | 'expert'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          experience_level?: 'beginner' | 'enthusiast' | 'collector' | null
          scent_preferences?: Json
          onboarding_completed?: boolean
          subscription_tier?: 'free' | 'premium' | 'expert'
        }
        Update: {
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          experience_level?: 'beginner' | 'enthusiast' | 'collector' | null
          scent_preferences?: Json
          onboarding_completed?: boolean
          subscription_tier?: 'free' | 'premium' | 'expert'
        }
      }
      // ... other table types
    }
  }
}
```

## API Client

```typescript
// app/lib/api-client.ts
class APIClient {
  private baseURL: string
  
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '/api'
  }
  
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new APIError(
        error.error || 'Request failed',
        error.code || 'UNKNOWN',
        response.status,
        error.details
      )
    }
    
    return response.json()
  }
  
  // Auth methods
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }
  
  async signup(data: SignupData) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  async logout() {
    return this.request('/auth/logout', { method: 'POST' })
  }
  
  // Fragrance methods
  async getFragrances(filters?: FragranceFilters) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','))
          } else {
            params.append(key, String(value))
          }
        }
      })
    }
    
    return this.request<PaginatedResponse<Fragrance>>(
      `/fragrances?${params.toString()}`
    )
  }
  
  async getFragrance(id: string) {
    return this.request<Fragrance>(`/fragrances/${id}`)
  }
  
  async getSimilarFragrances(id: string, limit = 10) {
    return this.request<Fragrance[]>(
      `/fragrances/${id}/similar?limit=${limit}`
    )
  }
  
  // Collection methods
  async getCollection(status?: string) {
    const params = status ? `?status=${status}` : ''
    return this.request<UserFragrance[]>(`/collection${params}`)
  }
  
  // Recommendations
  async getRecommendations(filters?: RecommendationFilters) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }
    
    return this.request<Recommendation[]>(
      `/recommendations?${params.toString()}`
    )
  }
  
  async generateRecommendations() {
    return this.request('/recommendations/generate', {
      method: 'POST'
    })
  }
}

export const apiClient = new APIClient()
```

## Testing Strategy

```typescript
// __tests__/api/fragrances.test.ts
import { GET } from '@/app/api/fragrances/route'
import { createMockRequest } from '@/test/utils'

describe('Fragrances API', () => {
  it('returns paginated fragrances', async () => {
    const request = createMockRequest({
      url: '/api/fragrances?page=1&limit=20'
    })
    
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.fragrances).toBeInstanceOf(Array)
    expect(data.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: expect.any(Number),
      totalPages: expect.any(Number)
    })
  })
  
  it('filters fragrances by gender', async () => {
    const request = createMockRequest({
      url: '/api/fragrances?gender=masculine'
    })
    
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    data.fragrances.forEach((fragrance: any) => {
      expect(fragrance.gender).toBe('masculine')
    })
  })
  
  it('handles search queries', async () => {
    const request = createMockRequest({
      url: '/api/fragrances?search=dior'
    })
    
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.fragrances.length).toBeGreaterThan(0)
  })
})
```