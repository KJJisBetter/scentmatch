# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-15-database-real-data-implementation/spec.md

## Schema Design Based on Real Data Structure

### JSON Data Analysis
The `/data/fragrances.json` file contains **1,467 fragrance records** with this structure:
```json
{
  "id": "ariana-grande__cloud-ariana-grandefor-women",
  "brandId": "ariana-grande", 
  "brandName": "Ariana Grande",
  "name": "Cloud Ariana Grandefor women",
  "slug": "cloud-ariana-grandefor-women",
  "ratingValue": 3.99,
  "ratingCount": 12730,
  "score": 16.3784,
  "gender": "for women",
  "accords": ["sweet", "lactonic", "vanilla", "coconut", "musky"],
  "perfumers": ["Clement Gavarry"],
  "url": "https://www.fragrantica.com/perfume/Ariana-Grande/Cloud-50384.html"
}
```

The `/data/brands.json` file contains **40 brand records** with this structure:
```json
{
  "id": "azzaro",
  "name": "Azzaro", 
  "slug": "azzaro",
  "itemCount": 40
}
```

## Required Tables

### fragrance_brands
```sql
CREATE TABLE fragrance_brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  country TEXT,
  website_url TEXT,
  popularity_score INTEGER DEFAULT 0,
  fragrance_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_brands_name ON fragrance_brands(name);
CREATE INDEX idx_brands_popularity ON fragrance_brands(popularity_score DESC);
```

### fragrances  
```sql
CREATE TABLE fragrances (
  id TEXT PRIMARY KEY,
  brand_id TEXT REFERENCES fragrance_brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  rating_value DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,
  score DECIMAL(10,4),
  gender TEXT CHECK (gender IN ('for women', 'for men', 'unisex')),
  accords TEXT[], -- Array of scent notes
  perfumers TEXT[], -- Array of perfumer names
  fragrantica_url TEXT,
  description TEXT,
  image_url TEXT,
  launch_year INTEGER,
  concentration TEXT,
  popularity_score INTEGER DEFAULT 0,
  embedding VECTOR(1536), -- For AI recommendations (pgvector)
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

-- Vector similarity (for AI)
CREATE INDEX idx_fragrances_embedding ON fragrances USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### user_profiles
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  birth_year INTEGER,
  gender TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),
  preferred_gender TEXT CHECK (preferred_gender IN ('for women', 'for men', 'unisex', 'any')),
  preferred_price_range NUMRANGE,
  favorite_accords TEXT[],
  disliked_accords TEXT[],
  profile_privacy TEXT DEFAULT 'private' CHECK (profile_privacy IN ('public', 'private')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles  
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### user_collections
```sql
CREATE TABLE user_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fragrance_id TEXT REFERENCES fragrances(id) ON DELETE CASCADE,
  collection_type TEXT DEFAULT 'owned' CHECK (collection_type IN ('owned', 'wishlist', 'tried')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  notes TEXT,
  purchase_date DATE,
  price_paid DECIMAL(10,2),
  size_ml INTEGER,
  usage_occasions TEXT[],
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
CREATE INDEX idx_collections_type ON user_collections(collection_type);
```

## Data Import Migration

```sql
-- Migration script to import from JSON data
CREATE OR REPLACE FUNCTION import_fragrance_data()
RETURNS void AS $$
DECLARE
  json_data jsonb;
  record_item jsonb;
  brand_record RECORD;
BEGIN
  -- Load JSON data (this will be called from application code)
  -- Application will pass the JSON data in batches
  
  -- Process brands first (extract unique brands from JSON)
  -- Then process fragrances
  -- Maintain referential integrity
  
  RAISE NOTICE 'Fragrance data import completed';
END;
$$ LANGUAGE plpgsql;
```

## Required Extensions

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- pgvector for AI
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
```

## Performance & Monitoring

- All queries must execute under 200ms
- Database connection pooling for concurrent users
- Query performance monitoring with pg_stat_statements
- Regular VACUUM and ANALYZE for optimal performance