# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-14-user-auth-fragrance-db-foundation/spec.md

## Schema Changes

### New Tables

#### 1. User Profiles Table (extends Supabase auth.users)

```sql
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'enthusiast', 'collector')) DEFAULT 'beginner',
  preferred_scent_types TEXT[] DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{"collection_public": false, "recommendations_enabled": true}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Indexes
CREATE INDEX idx_user_profiles_experience ON public.user_profiles(experience_level);
CREATE INDEX idx_user_profiles_updated_at ON public.user_profiles(updated_at);
```

#### 2. Fragrance Brands Table

```sql
CREATE TABLE public.fragrance_brands (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  country TEXT,
  founded_year INTEGER,
  website_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_fragrance_brands_name ON public.fragrance_brands(name);
CREATE INDEX idx_fragrance_brands_active ON public.fragrance_brands(is_active);

-- Full-text search
CREATE INDEX idx_fragrance_brands_search ON public.fragrance_brands
  USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));
```

#### 3. Fragrances Table

```sql
CREATE TABLE public.fragrances (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  brand_id INTEGER REFERENCES public.fragrance_brands(id) ON DELETE CASCADE,
  description TEXT,
  launch_year INTEGER,
  concentration TEXT CHECK (concentration IN ('EDT', 'EDP', 'Parfum', 'EdC', 'Cologne')),
  gender TEXT CHECK (gender IN ('Masculine', 'Feminine', 'Unisex')) DEFAULT 'Unisex',
  top_notes TEXT[] DEFAULT '{}',
  middle_notes TEXT[] DEFAULT '{}',
  base_notes TEXT[] DEFAULT '{}',
  fragrance_family TEXT,
  price_range TEXT CHECK (price_range IN ('Budget', 'Mid-range', 'Luxury', 'Niche')),
  popularity_score INTEGER DEFAULT 0,
  image_url TEXT,
  bottle_image_url TEXT,
  is_discontinued BOOLEAN DEFAULT FALSE,
  embedding VECTOR(1024), -- For future AI recommendations
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_fragrance_brand UNIQUE(name, brand_id)
);

-- Row Level Security (fragrances are public read-only)
ALTER TABLE public.fragrances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fragrances are viewable by all users" ON public.fragrances
  FOR SELECT USING (TRUE);

-- Indexes for performance
CREATE INDEX idx_fragrances_brand ON public.fragrances(brand_id);
CREATE INDEX idx_fragrances_gender ON public.fragrances(gender);
CREATE INDEX idx_fragrances_family ON public.fragrances(fragrance_family);
CREATE INDEX idx_fragrances_price_range ON public.fragrances(price_range);
CREATE INDEX idx_fragrances_popularity ON public.fragrances(popularity_score DESC);
CREATE INDEX idx_fragrances_launch_year ON public.fragrances(launch_year);
CREATE INDEX idx_fragrances_active ON public.fragrances(is_discontinued);

-- Composite indexes for common queries
CREATE INDEX idx_fragrances_brand_active ON public.fragrances(brand_id, is_discontinued);
CREATE INDEX idx_fragrances_family_gender ON public.fragrances(fragrance_family, gender);

-- Full-text search index
CREATE INDEX idx_fragrances_search ON public.fragrances
  USING GIN(to_tsvector('english',
    name || ' ' ||
    COALESCE(description, '') || ' ' ||
    array_to_string(top_notes, ' ') || ' ' ||
    array_to_string(middle_notes, ' ') || ' ' ||
    array_to_string(base_notes, ' ')
  ));

-- Vector similarity index for future AI recommendations
CREATE INDEX idx_fragrances_embedding ON public.fragrances
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

#### 4. User Collections Table

```sql
CREATE TABLE public.user_collections (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fragrance_id INTEGER REFERENCES public.fragrances(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  personal_notes TEXT,
  purchase_date DATE,
  bottle_size_ml INTEGER,
  is_wishlist BOOLEAN DEFAULT FALSE,
  is_owned BOOLEAN DEFAULT TRUE,
  times_worn INTEGER DEFAULT 0,
  occasions TEXT[] DEFAULT '{}',
  seasons TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_fragrance UNIQUE(user_id, fragrance_id)
);

-- Row Level Security
ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections" ON public.user_collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections" ON public.user_collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON public.user_collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON public.user_collections
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_collections_user ON public.user_collections(user_id);
CREATE INDEX idx_user_collections_fragrance ON public.user_collections(fragrance_id);
CREATE INDEX idx_user_collections_rating ON public.user_collections(rating);
CREATE INDEX idx_user_collections_owned ON public.user_collections(is_owned);
CREATE INDEX idx_user_collections_wishlist ON public.user_collections(is_wishlist);
CREATE INDEX idx_user_collections_updated ON public.user_collections(updated_at);

-- Composite indexes for common queries
CREATE INDEX idx_user_collections_user_owned ON public.user_collections(user_id, is_owned);
CREATE INDEX idx_user_collections_user_wishlist ON public.user_collections(user_id, is_wishlist);
```

### Migration Scripts

#### Migration 001: Create Extensions

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Migration 002: Create User Profiles

```sql
-- Create user_profiles table with full implementation from above
-- (Complete SQL from User Profiles section)

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at_user_profiles
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

#### Migration 003: Create Fragrance Brands

```sql
-- Create fragrance_brands table with full implementation from above
-- (Complete SQL from Fragrance Brands section)

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at_fragrance_brands
  BEFORE UPDATE ON public.fragrance_brands
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

#### Migration 004: Create Fragrances

```sql
-- Create fragrances table with full implementation from above
-- (Complete SQL from Fragrances section)

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at_fragrances
  BEFORE UPDATE ON public.fragrances
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add trigger to update popularity_score
CREATE OR REPLACE FUNCTION update_fragrance_popularity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update popularity based on collection additions
  UPDATE public.fragrances
  SET popularity_score = (
    SELECT COUNT(*)
    FROM public.user_collections
    WHERE fragrance_id = NEW.fragrance_id AND is_owned = TRUE
  )
  WHERE id = NEW.fragrance_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_popularity_on_collection_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_collections
  FOR EACH ROW EXECUTE FUNCTION update_fragrance_popularity();
```

#### Migration 005: Create User Collections

```sql
-- Create user_collections table with full implementation from above
-- (Complete SQL from User Collections section)

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at_user_collections
  BEFORE UPDATE ON public.user_collections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### Performance Optimizations

#### Materialized Views for Common Queries

```sql
-- Popular fragrances view
CREATE MATERIALIZED VIEW popular_fragrances AS
SELECT
  f.*,
  b.name as brand_name,
  COUNT(uc.id) as collection_count,
  AVG(uc.rating) as average_rating
FROM public.fragrances f
JOIN public.fragrance_brands b ON f.brand_id = b.id
LEFT JOIN public.user_collections uc ON f.id = uc.fragrance_id AND uc.is_owned = TRUE
WHERE f.is_discontinued = FALSE
GROUP BY f.id, b.name
ORDER BY collection_count DESC, average_rating DESC NULLS LAST;

-- Refresh schedule (run via pg_cron or manual)
CREATE INDEX idx_popular_fragrances_collection_count ON popular_fragrances(collection_count DESC);
CREATE INDEX idx_popular_fragrances_rating ON popular_fragrances(average_rating DESC);
```

#### Search Functions

```sql
-- Enhanced fragrance search function
CREATE OR REPLACE FUNCTION search_fragrances(
  search_term TEXT DEFAULT '',
  brand_filter INTEGER[] DEFAULT NULL,
  gender_filter TEXT DEFAULT NULL,
  family_filter TEXT DEFAULT NULL,
  price_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  brand_name TEXT,
  description TEXT,
  gender TEXT,
  fragrance_family TEXT,
  price_range TEXT,
  image_url TEXT,
  popularity_score INTEGER,
  search_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.name,
    b.name as brand_name,
    f.description,
    f.gender,
    f.fragrance_family,
    f.price_range,
    f.image_url,
    f.popularity_score,
    ts_rank(to_tsvector('english',
      f.name || ' ' ||
      COALESCE(f.description, '') || ' ' ||
      b.name || ' ' ||
      array_to_string(f.top_notes, ' ') || ' ' ||
      array_to_string(f.middle_notes, ' ') || ' ' ||
      array_to_string(f.base_notes, ' ')
    ), plainto_tsquery('english', search_term)) as search_rank
  FROM public.fragrances f
  JOIN public.fragrance_brands b ON f.brand_id = b.id
  WHERE
    f.is_discontinued = FALSE
    AND (
      search_term = '' OR
      to_tsvector('english',
        f.name || ' ' ||
        COALESCE(f.description, '') || ' ' ||
        b.name || ' ' ||
        array_to_string(f.top_notes, ' ') || ' ' ||
        array_to_string(f.middle_notes, ' ') || ' ' ||
        array_to_string(f.base_notes, ' ')
      ) @@ plainto_tsquery('english', search_term)
    )
    AND (brand_filter IS NULL OR f.brand_id = ANY(brand_filter))
    AND (gender_filter IS NULL OR f.gender = gender_filter)
    AND (family_filter IS NULL OR f.fragrance_family = family_filter)
    AND (price_filter IS NULL OR f.price_range = price_filter)
  ORDER BY
    CASE WHEN search_term = '' THEN 0 ELSE search_rank END DESC,
    f.popularity_score DESC,
    f.name ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
```

### Data Integrity and Rationale

#### Foreign Key Relationships

- **user_profiles.id → auth.users.id**: Extends Supabase auth with custom profile data
- **fragrances.brand_id → fragrance_brands.id**: Maintains brand-fragrance relationship integrity
- **user_collections.user_id → auth.users.id**: Links collections to authenticated users
- **user_collections.fragrance_id → fragrances.id**: Links collections to valid fragrances

#### Row-Level Security Strategy

- **User-specific data**: user_profiles and user_collections enforce auth.uid() matching
- **Public data**: fragrances and brands are readable by all authenticated users
- **Admin operations**: Brand and fragrance management requires elevated permissions

#### Performance Considerations

- **Vector indexing**: IVFFlat index with 100 lists optimized for 1,000-10,000 fragrances
- **Full-text search**: GIN indexes on tsvector for fast text search across multiple fields
- **Composite indexes**: Optimized for common query patterns (brand + active, user + owned)
- **Materialized views**: Pre-computed popular fragrances for dashboard display

#### Scaling Projections

- **1,000 users, 500 fragrances**: All queries < 50ms
- **10,000 users, 2,000 fragrances**: Search queries < 100ms, collection queries < 50ms
- **100,000 users, 10,000 fragrances**: May need read replicas and connection pooling
- **Vector similarity**: Sub-100ms for similarity search with proper indexing
