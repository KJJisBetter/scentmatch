# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-15-phase-1-supabase-auth-pages/spec.md

## Schema Design for Real Data Import

### Data Source Analysis
Using existing files from research:
- `/data/fragrances.json` - 1,467 fragrance records
- `/data/brands.json` - 40 brand records  
- `/lib/data-validation/fragrance-schema.ts` - Proven validation logic

### Required Extensions
```sql
-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- pgvector for future AI features
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
```

### Core Tables

#### fragrance_brands
```sql
CREATE TABLE fragrance_brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  item_count INTEGER DEFAULT 0,
  description TEXT,
  website_url TEXT,
  popularity_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_brands_name ON fragrance_brands(name);
CREATE INDEX idx_brands_popularity ON fragrance_brands(popularity_score DESC);
```

#### fragrances
```sql
CREATE TABLE fragrances (
  id TEXT PRIMARY KEY,
  brand_id TEXT REFERENCES fragrance_brands(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL, -- Denormalized for performance
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  rating_value DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,
  score DECIMAL(10,4),
  gender TEXT CHECK (gender IN ('for women', 'for men', 'unisex')),
  accords TEXT[], -- Array of scent notes/accords
  perfumers TEXT[], -- Array of perfumer names
  fragrantica_url TEXT,
  description TEXT,
  image_url TEXT,
  concentration TEXT,
  launch_year INTEGER,
  popularity_score INTEGER DEFAULT 0,
  embedding VECTOR(1536), -- For future AI recommendations
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_fragrances_brand ON fragrances(brand_id);
CREATE INDEX idx_fragrances_rating ON fragrances(rating_value DESC);
CREATE INDEX idx_fragrances_gender ON fragrances(gender);
CREATE INDEX idx_fragrances_score ON fragrances(score DESC);
CREATE INDEX idx_fragrances_name_trgm ON fragrances USING gin(name gin_trgm_ops);

-- Full-text search
CREATE INDEX idx_fragrances_search ON fragrances USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
```

#### user_profiles (extends Supabase auth.users)
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  experience_level TEXT DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),
  preferred_gender TEXT CHECK (preferred_gender IN ('for women', 'for men', 'unisex', 'any')),
  favorite_accords TEXT[],
  disliked_accords TEXT[],
  onboarding_completed BOOLEAN DEFAULT FALSE,
  profile_privacy TEXT DEFAULT 'private' CHECK (profile_privacy IN ('public', 'private')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for user isolation
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles  
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### user_collections
```sql
CREATE TABLE user_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fragrance_id TEXT REFERENCES fragrances(id) ON DELETE CASCADE,
  collection_type TEXT DEFAULT 'owned' CHECK (collection_type IN ('owned', 'wishlist', 'tried')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  notes TEXT,
  date_added DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, fragrance_id, collection_type)
);

-- RLS Policies
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own collections" ON user_collections
  FOR ALL USING (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX idx_collections_user ON user_collections(user_id);
CREATE INDEX idx_collections_fragrance ON user_collections(fragrance_id);
```

## Data Import Process

### Brand Import (from brands.json)
```sql
-- Function to import brands
CREATE OR REPLACE FUNCTION import_brands(brands_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  brand_record JSONB;
  imported_count INTEGER := 0;
BEGIN
  FOR brand_record IN SELECT jsonb_array_elements(brands_data)
  LOOP
    INSERT INTO fragrance_brands (id, name, slug, item_count)
    VALUES (
      brand_record->>'id',
      brand_record->>'name', 
      brand_record->>'slug',
      (brand_record->>'itemCount')::INTEGER
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      item_count = EXCLUDED.item_count,
      updated_at = NOW();
    
    imported_count := imported_count + 1;
  END LOOP;
  
  RETURN imported_count;
END;
$$ LANGUAGE plpgsql;
```

### Fragrance Import (from fragrances.json)
```sql
-- Function to import fragrances
CREATE OR REPLACE FUNCTION import_fragrances(fragrances_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  fragrance_record JSONB;
  imported_count INTEGER := 0;
BEGIN
  FOR fragrance_record IN SELECT jsonb_array_elements(fragrances_data)
  LOOP
    INSERT INTO fragrances (
      id, brand_id, brand_name, name, slug, rating_value, rating_count,
      score, gender, accords, perfumers, fragrantica_url
    )
    VALUES (
      fragrance_record->>'id',
      fragrance_record->>'brandId',
      fragrance_record->>'brandName',
      fragrance_record->>'name',
      fragrance_record->>'slug',
      (fragrance_record->>'ratingValue')::DECIMAL,
      (fragrance_record->>'ratingCount')::INTEGER,
      (fragrance_record->>'score')::DECIMAL,
      fragrance_record->>'gender',
      ARRAY(SELECT jsonb_array_elements_text(fragrance_record->'accords')),
      ARRAY(SELECT jsonb_array_elements_text(fragrance_record->'perfumers')),
      fragrance_record->>'url'
    )
    ON CONFLICT (id) DO UPDATE SET
      brand_name = EXCLUDED.brand_name,
      name = EXCLUDED.name,
      rating_value = EXCLUDED.rating_value,
      rating_count = EXCLUDED.rating_count,
      score = EXCLUDED.score,
      updated_at = NOW();
    
    imported_count := imported_count + 1;
  END LOOP;
  
  RETURN imported_count;
END;
$$ LANGUAGE plpgsql;
```

## Authentication Configuration

### Supabase Auth Settings
- Email/password authentication enabled
- Email confirmation required for new accounts
- Session timeout: 24 hours
- Password requirements: minimum 8 characters
- Rate limiting: 5 attempts per 15 minutes per IP

### Security Headers
- Configure CORS for development and production
- Implement CSRF protection
- Add security headers via middleware
- Set up proper redirect URLs for auth flows

## Page Requirements

### Home Page
- Hero section with value proposition
- Feature highlights (AI recommendations, sample-first, community-driven)
- Call-to-action buttons (Get Started, Browse Fragrances)
- Responsive design with mobile-first approach
- Loading states and skeleton components

### Authentication Pages
- **Sign Up**: Email/password form with validation, terms acceptance
- **Sign In**: Email/password form with "Remember me" option
- **Reset Password**: Email input with confirmation flow
- **Verify Email**: Confirmation page with resend option
- Consistent styling and error handling across all auth pages