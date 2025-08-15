/**
 * Test fixtures for database operations
 * These fixtures provide consistent test data for database-related tests
 */

export const mockFragrance = {
  id: 1,
  name: 'Test Fragrance',
  brand_id: 1,
  description: 'A test fragrance for unit testing',
  gender: 'unisex',
  fragrance_family: 'woody',
  top_notes: ['bergamot', 'lemon'],
  middle_notes: ['rose', 'jasmine'],
  base_notes: ['sandalwood', 'musk'],
  concentration: 'eau_de_toilette',
  longevity_hours: 6,
  sillage: 'moderate',
  price_range: 'mid',
  popularity_score: 85,
  image_url: 'https://example.com/fragrance.jpg',
  created_at: '2025-08-14T00:00:00.000Z',
  updated_at: '2025-08-14T00:00:00.000Z',
};

export const mockBrand = {
  id: 1,
  name: 'Test Brand',
  description: 'A test brand for unit testing',
  country: 'France',
  founded_year: 1990,
  website_url: 'https://testbrand.com',
  logo_url: 'https://example.com/brand-logo.jpg',
  created_at: '2025-08-14T00:00:00.000Z',
  updated_at: '2025-08-14T00:00:00.000Z',
};

export const mockUserCollection = {
  id: 1,
  user_id: 'test-user-id-123',
  fragrance_id: 1,
  status: 'owned',
  rating: 4,
  notes: 'Great for everyday wear',
  purchase_date: '2025-08-14',
  purchase_price: 75.0,
  created_at: '2025-08-14T00:00:00.000Z',
  updated_at: '2025-08-14T00:00:00.000Z',
};

export const mockUserProfile = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  full_name: 'Test User',
  avatar_url: null,
  bio: 'Fragrance enthusiast',
  location: 'New York, NY',
  preferences: {
    favorite_families: ['woody', 'citrus'],
    preferred_concentrations: ['eau_de_toilette', 'eau_de_parfum'],
    budget_range: 'mid',
    email_notifications: true,
  },
  privacy_settings: {
    profile_visibility: 'public',
    collection_visibility: 'public',
  },
  created_at: '2025-08-14T00:00:00.000Z',
  updated_at: '2025-08-14T00:00:00.000Z',
};

export const mockSearchResults = {
  fragrances: [
    mockFragrance,
    {
      ...mockFragrance,
      id: 2,
      name: 'Another Test Fragrance',
      fragrance_family: 'citrus',
    },
  ],
  total_count: 2,
  page: 1,
  per_page: 20,
};

export const mockDatabaseError = {
  code: '23505',
  message: 'duplicate key value violates unique constraint',
  details: 'Key (email)=(test@example.com) already exists.',
  hint: null,
};

export const mockConnectionError = {
  code: 'PGRST116',
  message: 'connection error',
  details: 'Could not connect to database',
  hint: 'Check your network connection',
};

export const mockRLSError = {
  code: '42501',
  message: 'permission denied for table fragrances',
  details: 'Row level security policy violation',
  hint: 'Ensure you are properly authenticated',
};

export const mockValidationError = {
  code: '23514',
  message: 'check constraint violation',
  details: 'Invalid email format',
  hint: 'Email must be a valid email address',
};

export const testDatabaseQueries = {
  selectFragrances: {
    table: 'fragrances',
    operation: 'select',
    columns: '*',
    expectedResult: mockSearchResults,
  },
  insertFragrance: {
    table: 'fragrances',
    operation: 'insert',
    data: mockFragrance,
    expectedResult: { data: mockFragrance, error: null },
  },
  updateUserProfile: {
    table: 'user_profiles',
    operation: 'update',
    data: { full_name: 'Updated Name' },
    condition: { id: 'test-user-id-123' },
    expectedResult: {
      data: { ...mockUserProfile, full_name: 'Updated Name' },
      error: null,
    },
  },
  deleteCollection: {
    table: 'user_collections',
    operation: 'delete',
    condition: { id: 1 },
    expectedResult: { data: null, error: null },
  },
};

export const testSearchParams = {
  byName: {
    query: 'test fragrance',
    filters: {},
    expectedMatches: ['Test Fragrance', 'Another Test Fragrance'],
  },
  byBrand: {
    query: '',
    filters: { brand_id: 1 },
    expectedMatches: ['Test Fragrance'],
  },
  byFamily: {
    query: '',
    filters: { fragrance_family: 'woody' },
    expectedMatches: ['Test Fragrance'],
  },
  byGender: {
    query: '',
    filters: { gender: 'unisex' },
    expectedMatches: ['Test Fragrance'],
  },
  byPriceRange: {
    query: '',
    filters: { price_range: 'mid' },
    expectedMatches: ['Test Fragrance'],
  },
  complex: {
    query: 'test',
    filters: {
      fragrance_family: 'woody',
      gender: 'unisex',
      price_range: 'mid',
    },
    expectedMatches: ['Test Fragrance'],
  },
};

export const testPaginationParams = {
  firstPage: {
    page: 1,
    per_page: 10,
    expectedOffset: 0,
  },
  secondPage: {
    page: 2,
    per_page: 10,
    expectedOffset: 10,
  },
  largePage: {
    page: 1,
    per_page: 100,
    expectedOffset: 0,
  },
};

export const testSortingOptions = {
  byName: {
    column: 'name',
    direction: 'asc',
  },
  byPopularity: {
    column: 'popularity_score',
    direction: 'desc',
  },
  byCreatedDate: {
    column: 'created_at',
    direction: 'desc',
  },
  byPrice: {
    column: 'price_range',
    direction: 'asc',
  },
};
