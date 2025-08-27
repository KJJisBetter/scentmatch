# API Specification for Critical Production Fixes

## Overview

This specification details API endpoint modifications and fixes required to resolve the critical production issues in ScentMatch, focusing on the quiz processing endpoint and authentication-related APIs.

## Affected API Endpoints

### 1. Quiz Processing API - `/api/quiz` (CRITICAL FIX REQUIRED)

**Current Issue**: Returns "Failed to generate sufficient recommendations" error

#### POST `/api/quiz`

**Purpose**: Process quiz responses and generate AI-powered fragrance recommendations

**Request Body**:

```typescript
interface QuizRequest {
  demographics: {
    age: string;
    gender: string;
    location: string;
  };
  preferences: {
    fragranceTypes: string[];
    intensity: 'light' | 'moderate' | 'bold';
    occasions: string[];
    scents: string[];
  };
  lifestyle: {
    style: string;
    activities: string[];
    personality: string[];
  };
  finalAnswer: string; // Last question response
}
```

**Response (Success)**:

```typescript
interface QuizResponse {
  success: true;
  data: {
    recommendations: Array<{
      id: string;
      name: string;
      brand: string;
      description: string;
      matchQuality: number; // Percentage 0-100
      samplesAvailable: number;
      notes: {
        top: string[];
        middle: string[];
        base: string[];
      };
      price: {
        sample: number;
        bottle: number;
      };
      image_url: string;
    }>;
    totalRecommendations: number;
    processingTime: number;
  };
}
```

**Response (Error)**:

```typescript
interface QuizErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
}
```

**Required Fixes**:

1. **Environment Variable Validation**
   - Verify `OPENAI_API_KEY` is accessible
   - Add proper error handling for missing API key
   - Test API key validity on startup

2. **Database Connectivity**
   - Implement proper Supabase connection with `@supabase/ssr`
   - Add error handling for database connection failures
   - Verify fragrance data exists before processing

3. **Error Handling Improvements**

   ```typescript
   // app/api/quiz/route.ts
   export async function POST(request: Request) {
     try {
       // 1. Validate request body
       const body = await request.json();
       const validatedData = quizSchema.parse(body);

       // 2. Check environment variables
       if (!process.env.OPENAI_API_KEY) {
         throw new Error('OpenAI API key not configured');
       }

       // 3. Test database connection
       const { data: testData, error: dbError } = await supabase
         .from('fragrances')
         .select('id')
         .limit(1);

       if (dbError) {
         throw new Error(`Database connection failed: ${dbError.message}`);
       }

       // 4. Generate recommendations
       const recommendations = await generateRecommendations(validatedData);

       if (!recommendations.length) {
         throw new Error('No recommendations could be generated');
       }

       return Response.json({
         success: true,
         data: {
           recommendations,
           totalRecommendations: recommendations.length,
           processingTime: Date.now() - startTime,
         },
       });
     } catch (error) {
       console.error('Quiz API Error:', error);

       return Response.json(
         {
           success: false,
           error: {
             code: error.code || 'QUIZ_PROCESSING_FAILED',
             message: error.message || 'Failed to process quiz',
             details:
               process.env.NODE_ENV === 'development' ? error.stack : undefined,
           },
         },
         { status: 500 }
       );
     }
   }
   ```

4. **Rate Limiting and Duplicate Prevention**
   - Implement request deduplication using user session
   - Add rate limiting per IP address
   - Cache results to avoid duplicate OpenAI calls

### 2. Authentication APIs - `/api/auth/*` (SECURITY RESTORATION)

#### POST `/api/auth/signup`

**Purpose**: Create new user account with enhanced validation

**Request Body**:

```typescript
interface SignUpRequest {
  email: string;
  password: string;
}
```

**Required Changes**:

- Remove "What should we call you?" field
- Simplify to email/password only
- Add proper validation and error messages
- Integrate with Supabase Auth properly

#### POST `/api/auth/login`

**Purpose**: User authentication

**Required Changes**:

- Ensure session handling works with middleware
- Add proper error handling for failed attempts
- Implement session management for protected routes

#### POST `/api/auth/logout`

**Purpose**: User logout and session cleanup

**Required Changes**:

- Properly clear authentication cookies
- Redirect to appropriate page after logout

### 3. Protected Route APIs - Various (SECURITY RESTORATION)

All APIs serving protected content need to verify authentication:

- `/api/collections/*` - User fragrance collections
- `/api/recommendations/*` - Saved recommendations
- `/api/user/*` - User profile data

**Security Implementation**:

```typescript
// utils/auth-middleware.ts
export async function requireAuth(request: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error('Authentication required');
  }

  return { user: session.user, supabase };
}

// Usage in protected API routes
export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    // Continue with authenticated logic
  } catch (error) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }
}
```

## Error Handling Standards

### Standard Error Response Format

```typescript
interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
    timestamp: string;
  };
}
```

### Error Codes

- `QUIZ_PROCESSING_FAILED` - General quiz processing error
- `OPENAI_API_ERROR` - OpenAI API issues
- `DATABASE_CONNECTION_ERROR` - Supabase connection failures
- `AUTHENTICATION_REQUIRED` - Protected route access without auth
- `VALIDATION_ERROR` - Request body validation failures
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Performance Requirements

1. **Response Times**
   - Quiz processing: < 10 seconds
   - Authentication: < 2 seconds
   - Protected route access: < 3 seconds

2. **Rate Limiting**
   - Quiz API: 5 requests per minute per IP
   - Auth APIs: 10 requests per minute per IP
   - General APIs: 100 requests per minute per IP

3. **Timeout Handling**
   - OpenAI API calls: 30 second timeout
   - Database queries: 10 second timeout
   - Client requests: 45 second timeout (Vercel limit)

## Security Requirements

1. **Input Validation**
   - All request bodies validated with Zod schemas
   - SQL injection prevention through parameterized queries
   - XSS prevention through input sanitization

2. **Authentication**
   - JWT token validation on all protected routes
   - Secure cookie handling with httpOnly flags
   - CSRF protection for state-changing operations

3. **Authorization**
   - User can only access their own data
   - Proper RLS policies in Supabase
   - Role-based access control where needed

## Testing Requirements

### Unit Tests

- Quiz API logic with mocked dependencies
- Authentication middleware functionality
- Error handling scenarios
- Input validation edge cases

### Integration Tests

- End-to-end quiz submission flow
- Authentication and session management
- Protected route access control
- Error scenarios and recovery

### Load Testing

- Quiz API under concurrent load
- Rate limiting effectiveness
- Database connection pooling
- OpenAI API timeout handling
