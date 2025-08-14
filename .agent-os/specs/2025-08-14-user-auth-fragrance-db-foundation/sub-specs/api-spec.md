# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-14-user-auth-fragrance-db-foundation/spec.md

## Authentication Endpoints

### POST /api/auth/register

**Purpose:** Create new user account with email verification
**Authentication:** None required
**Rate Limit:** 5 requests per minute per IP

**Request Body:**
```typescript
{
  email: string;          // Valid email format, max 255 chars
  password: string;       // Min 8 chars, 1 special char, 1 number
  fullName: string;       // Max 100 chars, trim whitespace
  experienceLevel?: 'beginner' | 'enthusiast' | 'collector';
}
```

**Response (201 Created):**
```typescript
{
  success: true;
  message: "Account created successfully. Please check your email for verification.";
  user: {
    id: string;
    email: string;
    fullName: string;
    emailConfirmed: false;
  };
}
```

**Errors:**
- `400`: Invalid input data, email already exists
- `422`: Password doesn't meet requirements
- `429`: Rate limit exceeded
- `500`: Server error during account creation

### POST /api/auth/login

**Purpose:** Authenticate user with email and password
**Authentication:** None required
**Rate Limit:** 10 requests per minute per IP

**Request Body:**
```typescript
{
  email: string;
  password: string;
  rememberMe?: boolean;   // Extends session duration
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  user: {
    id: string;
    email: string;
    fullName: string;
    experienceLevel: string;
    emailConfirmed: boolean;
  };
  accessToken: string;
  refreshToken: string;
}
```

**Errors:**
- `400`: Missing email or password
- `401`: Invalid credentials
- `423`: Account locked due to failed attempts
- `429`: Rate limit exceeded

### POST /api/auth/logout

**Purpose:** Sign out user and invalidate session
**Authentication:** Bearer token required
**Rate Limit:** 20 requests per minute

**Response (200 OK):**
```typescript
{
  success: true;
  message: "Logged out successfully";
}
```

### POST /api/auth/reset-password

**Purpose:** Send password reset email
**Authentication:** None required
**Rate Limit:** 3 requests per minute per IP

**Request Body:**
```typescript
{
  email: string;
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  message: "Password reset email sent if account exists";
}
```

## User Profile Endpoints

### GET /api/user/profile

**Purpose:** Get current user's profile information
**Authentication:** Bearer token required
**Rate Limit:** 100 requests per minute

**Response (200 OK):**
```typescript
{
  id: string;
  email: string;
  fullName: string;
  experienceLevel: 'beginner' | 'enthusiast' | 'collector';
  preferredScentTypes: string[];
  privacySettings: {
    collectionPublic: boolean;
    recommendationsEnabled: boolean;
  };
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### PUT /api/user/profile

**Purpose:** Update user profile information
**Authentication:** Bearer token required
**Rate Limit:** 20 requests per minute

**Request Body:**
```typescript
{
  fullName?: string;
  experienceLevel?: 'beginner' | 'enthusiast' | 'collector';
  preferredScentTypes?: string[];
  privacySettings?: {
    collectionPublic?: boolean;
    recommendationsEnabled?: boolean;
  };
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  message: "Profile updated successfully";
  profile: UserProfile; // Same as GET response
}
```

## Fragrance Database Endpoints

### GET /api/fragrances

**Purpose:** Search and browse fragrances with filtering
**Authentication:** Bearer token required
**Rate Limit:** 200 requests per minute

**Query Parameters:**
```typescript
{
  search?: string;        // Text search across name, brand, notes
  brand?: number[];       // Array of brand IDs
  gender?: 'Masculine' | 'Feminine' | 'Unisex';
  family?: string;        // Fragrance family filter
  priceRange?: 'Budget' | 'Mid-range' | 'Luxury' | 'Niche';
  limit?: number;         // Max 100, default 20
  offset?: number;        // Pagination offset
  sortBy?: 'popularity' | 'name' | 'year' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}
```

**Response (200 OK):**
```typescript
{
  fragrances: Array<{
    id: number;
    name: string;
    brand: {
      id: number;
      name: string;
    };
    description: string;
    launchYear: number;
    concentration: string;
    gender: string;
    topNotes: string[];
    middleNotes: string[];
    baseNotes: string[];
    fragranceFamily: string;
    priceRange: string;
    popularityScore: number;
    imageUrl: string;
    isInUserCollection?: boolean; // If user has it in collection
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  searchTime: number; // Query execution time in ms
}
```

### GET /api/fragrances/[id]

**Purpose:** Get detailed information about specific fragrance
**Authentication:** Bearer token required
**Rate Limit:** 200 requests per minute

**Response (200 OK):**
```typescript
{
  id: number;
  name: string;
  brand: {
    id: number;
    name: string;
    description: string;
    country: string;
    foundedYear: number;
  };
  description: string;
  launchYear: number;
  concentration: string;
  gender: string;
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  fragranceFamily: string;
  priceRange: string;
  popularityScore: number;
  imageUrl: string;
  bottleImageUrl: string;
  isDiscontinued: boolean;
  createdAt: string;
  updatedAt: string;
  userCollection?: {
    rating: number;
    personalNotes: string;
    isOwned: boolean;
    isWishlist: boolean;
  };
}
```

### GET /api/brands

**Purpose:** Get list of fragrance brands for filtering
**Authentication:** Bearer token required
**Rate Limit:** 100 requests per minute

**Query Parameters:**
```typescript
{
  search?: string;        // Search brand names
  limit?: number;         // Max 100, default 50
  active?: boolean;       // Only active brands
}
```

**Response (200 OK):**
```typescript
{
  brands: Array<{
    id: number;
    name: string;
    description: string;
    country: string;
    foundedYear: number;
    fragranceCount: number; // Number of fragrances in database
  }>;
}
```

## User Collection Endpoints

### GET /api/user/collection

**Purpose:** Get user's fragrance collection
**Authentication:** Bearer token required
**Rate Limit:** 100 requests per minute

**Query Parameters:**
```typescript
{
  owned?: boolean;        // Filter owned vs wishlist
  rating?: number;        // Filter by rating
  sortBy?: 'name' | 'brand' | 'rating' | 'addedDate';
  sortOrder?: 'asc' | 'desc';
  limit?: number;         // Max 100, default 20
  offset?: number;
}
```

**Response (200 OK):**
```typescript
{
  collection: Array<{
    id: number;
    fragrance: {
      id: number;
      name: string;
      brand: {
        id: number;
        name: string;
      };
      imageUrl: string;
      concentration: string;
      gender: string;
    };
    rating: number;
    personalNotes: string;
    purchaseDate: string;
    bottleSizeML: number;
    isWishlist: boolean;
    isOwned: boolean;
    timesWorn: number;
    occasions: string[];
    seasons: string[];
    addedAt: string;
    updatedAt: string;
  }>;
  stats: {
    totalOwned: number;
    totalWishlist: number;
    averageRating: number;
    mostWornFragrance: string;
  };
}
```

### POST /api/user/collection

**Purpose:** Add fragrance to user's collection
**Authentication:** Bearer token required
**Rate Limit:** 50 requests per minute

**Request Body:**
```typescript
{
  fragranceId: number;
  rating?: number;        // 1-5 stars
  personalNotes?: string;
  purchaseDate?: string;  // ISO date
  bottleSizeML?: number;
  isWishlist?: boolean;   // Default false
  isOwned?: boolean;      // Default true
  occasions?: string[];
  seasons?: string[];
}
```

**Response (201 Created):**
```typescript
{
  success: true;
  message: "Fragrance added to collection";
  collectionItem: CollectionItem; // Same as GET response item
}
```

**Errors:**
- `400`: Invalid fragrance ID or duplicate entry
- `404`: Fragrance not found
- `422`: Invalid rating or data format

### PUT /api/user/collection/[id]

**Purpose:** Update collection item (rating, notes, etc.)
**Authentication:** Bearer token required
**Rate Limit:** 50 requests per minute

**Request Body:**
```typescript
{
  rating?: number;
  personalNotes?: string;
  bottleSizeML?: number;
  isWishlist?: boolean;
  isOwned?: boolean;
  timesWorn?: number;
  occasions?: string[];
  seasons?: string[];
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  message: "Collection updated successfully";
  collectionItem: CollectionItem;
}
```

### DELETE /api/user/collection/[id]

**Purpose:** Remove fragrance from collection
**Authentication:** Bearer token required
**Rate Limit:** 50 requests per minute

**Response (200 OK):**
```typescript
{
  success: true;
  message: "Fragrance removed from collection";
}
```

## Error Handling Standards

### Standard Error Response Format
```typescript
{
  success: false;
  error: {
    code: string;           // Machine-readable error code
    message: string;        // User-friendly error message
    details?: any;          // Additional error context
    field?: string;         // Field name for validation errors
  };
  timestamp: string;        // ISO timestamp
  path: string;            // API endpoint path
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_REQUIRED`: Missing or invalid auth token
- `AUTHORIZATION_DENIED`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `DUPLICATE_RESOURCE`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVER_ERROR`: Internal server error

### HTTP Status Code Usage
- `200`: Successful operation
- `201`: Resource created successfully
- `400`: Client error (bad request, validation)
- `401`: Authentication required
- `403`: Authorization denied
- `404`: Resource not found
- `409`: Resource conflict (duplicate)
- `422`: Unprocessable entity (validation)
- `429`: Rate limit exceeded
- `500`: Internal server error

## API Client TypeScript Definitions

### Base Client Configuration
```typescript
interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  authToken?: string;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

interface ApiError {
  message: string;
  status: number;
  code: string;
  details?: any;
}
```

### Authentication Client
```typescript
interface AuthClient {
  register(data: RegisterRequest): Promise<ApiResponse<RegisterResponse>>;
  login(data: LoginRequest): Promise<ApiResponse<LoginResponse>>;
  logout(): Promise<ApiResponse<{success: boolean}>>;
  resetPassword(email: string): Promise<ApiResponse<{success: boolean}>>;
  refreshToken(): Promise<ApiResponse<{accessToken: string}>>;
}
```

### Fragrance Client
```typescript
interface FragranceClient {
  search(params: FragranceSearchParams): Promise<ApiResponse<FragranceSearchResponse>>;
  getById(id: number): Promise<ApiResponse<FragranceDetail>>;
  getBrands(params?: BrandSearchParams): Promise<ApiResponse<BrandListResponse>>;
}
```

### Collection Client
```typescript
interface CollectionClient {
  getCollection(params?: CollectionParams): Promise<ApiResponse<CollectionResponse>>;
  addToCollection(data: AddToCollectionRequest): Promise<ApiResponse<CollectionItemResponse>>;
  updateCollectionItem(id: number, data: UpdateCollectionRequest): Promise<ApiResponse<CollectionItemResponse>>;
  removeFromCollection(id: number): Promise<ApiResponse<{success: boolean}>>;
}
```