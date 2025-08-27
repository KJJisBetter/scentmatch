# Technical Implementation Specification

## Architecture Overview

This specification details the technical implementation approach for fixing four critical production issues in ScentMatch, a Next.js 15 fragrance discovery platform using Supabase, OpenAI API, and Vercel deployment.

## Issue 1: AI Recommendation Engine Fix (P0 - Showstopper)

### Current Problem

- API returns: `"Failed to generate sufficient recommendations"`
- Results show: `0 fragrances`, `NaN% match quality`, `0 samples available`
- Error: `[ERROR] Quiz completion error: Error: Failed to generate sufficient recommendations`

### Technical Investigation Steps

1. **OpenAI API Configuration**
   - Verify `OPENAI_API_KEY` environment variable is set in Vercel
   - Test API key validity with simple OpenAI client call
   - Check API quota and rate limits
   - Validate model configuration in `lib/ai-sdk/unified-recommendation-engine.ts`

2. **Supabase Database Connectivity**
   - Verify fragrance data exists in database
   - Test Supabase connection with `@supabase/ssr` pattern
   - Check RLS (Row Level Security) policies aren't blocking queries
   - Validate database schema matches expected structure

3. **Data Pipeline Verification**
   - Test recommendation algorithm with mock data
   - Verify JSON parsing and data transformation
   - Check error handling in recommendation engine
   - Validate match quality calculation logic

### Implementation Approach

```typescript
// lib/ai-sdk/unified-recommendation-engine.ts
export async function generateRecommendations(preferences: QuizData) {
  try {
    // 1. Validate OpenAI client initialization
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 2. Test database connectivity
    const { data: fragrances, error } = await supabase
      .from('fragrances')
      .select('*')
      .limit(100);

    if (error) throw new Error(`Database error: ${error.message}`);
    if (!fragrances?.length) throw new Error('No fragrance data available');

    // 3. Generate AI recommendations with fallback
    const recommendations = await generateAIRecommendations(
      preferences,
      fragrances
    );

    // 4. Calculate proper match percentages
    return recommendations.map(rec => ({
      ...rec,
      matchQuality: calculateMatchPercentage(preferences, rec),
      samplesAvailable: rec.inventory_count || 0,
    }));
  } catch (error) {
    // 5. Detailed error logging for debugging
    console.error('Recommendation engine error:', error);
    throw new Error(`Recommendation generation failed: ${error.message}`);
  }
}
```

## Issue 2: Quiz Input Control Fix (P1 - Cost/Security)

### Current Problem

- Multiple quiz submissions possible
- No loading state or input disabling
- Each API call costs money (OpenAI processing)
- Risk of accidental duplicate expensive requests

### Implementation Approach

```typescript
// components/quiz/FinalQuestion.tsx
const [isSubmitting, setIsSubmitting] = useState(false);
const [isComplete, setIsComplete] = useState(false);

const handleFinalAnswer = async (answer: string) => {
  if (isSubmitting || isComplete) return; // Prevent duplicates

  setIsSubmitting(true); // Disable all inputs

  try {
    const response = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...quizData, finalAnswer: answer }),
    });

    if (!response.ok) throw new Error('Quiz submission failed');

    const results = await response.json();
    setIsComplete(true);
    router.push('/results');
  } catch (error) {
    console.error('Quiz submission error:', error);
    setIsSubmitting(false); // Re-enable on error only
    // Show error message to user
  }
};
```

### UI Implementation

```tsx
// Loading state component
{
  isSubmitting && (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white p-6 rounded-lg shadow-xl'>
        <div className='animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4' />
        <p className='text-lg font-semibold'>Processing your results...</p>
      </div>
    </div>
  );
}

// Disabled button states
<Button
  disabled={isSubmitting || isComplete}
  className={cn(
    'transition-opacity',
    (isSubmitting || isComplete) && 'opacity-50 cursor-not-allowed'
  )}
>
  {isSubmitting ? 'Processing...' : 'Get My Recommendations'}
</Button>;
```

## Issue 3: Authentication Security Restoration (P1 - Security)

### Current Problem

- Middleware completely disabled due to CSP conflicts
- No protection on routes: `/dashboard`, `/collection`, `/recommendations`
- Security headers removed

### Implementation Approach

1. **Create CSP-Compatible Middleware**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

  // Create Supabase client with proper CSP headers
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Check authentication for protected routes
  const protectedPaths = ['/dashboard', '/collection', '/recommendations'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Set security headers without CSP conflicts
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/collection/:path*',
    '/recommendations/:path*',
  ],
};
```

2. **Fix CSP in Next.js Config**

```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/((?!api).*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://api.openai.com",
              "img-src 'self' data: https: blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};
```

## Issue 4: Auth Form UX Polish (P2 - Professional)

### Current Problem

- Forms ask "What should we call you?" (unprofessional)
- Generic appearance, poor UX flow
- Discourages conversions

### Implementation Approach

```tsx
// components/auth/SignUpForm.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export function SignUpForm() {
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <div className='space-y-6'>
      <div className='text-center space-y-2'>
        <h1 className='text-2xl font-bold'>Create your ScentMatch account</h1>
        <p className='text-muted-foreground'>
          Join thousands discovering their perfect fragrances
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input placeholder='you@example.com' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='Create a strong password'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type='submit' className='w-full'>
            Create Account
          </Button>
        </form>
      </Form>
    </div>
  );
}
```

## Testing Requirements

### Unit Tests (Vitest)

- AI recommendation engine with mocked OpenAI/Supabase
- Quiz input control state management
- Authentication middleware logic
- Form validation and submission

### Integration Tests (Playwright)

- Complete user journey: quiz → results → signup
- Authentication flow and protected route access
- Error handling for failed API calls
- Loading states and disabled inputs

### Deployment Verification

- Environment variables properly set in Vercel
- Database connectivity from production
- OpenAI API accessibility from serverless functions
- Authentication middleware functioning without CSP conflicts

## Performance Considerations

- Cache fragrance data to reduce database queries
- Implement request deduplication for quiz submissions
- Optimize OpenAI API calls with proper timeout handling
- Use React.memo for expensive form components
- Implement proper error boundaries for graceful failure handling
