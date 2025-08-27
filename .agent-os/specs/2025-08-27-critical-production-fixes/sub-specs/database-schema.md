# Database Schema Specification for Critical Production Fixes

## Overview

This specification outlines the database requirements and schema validations needed to support the critical production fixes for ScentMatch, focusing on ensuring proper data availability and authentication security.

## Required Database Tables and Data

### 1. Fragrances Table (CRITICAL - Data Validation Required)

**Issue**: AI recommendation engine fails because no fragrance data is available or accessible.

**Required Schema**:

```sql
-- Verify fragrances table exists and has data
SELECT
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_name = 'fragrances';

-- Check for fragrance data
SELECT
  COUNT(*) as fragrance_count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM fragrances;
```

**Minimum Required Columns**:

```sql
CREATE TABLE IF NOT EXISTS fragrances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  description TEXT,
  notes JSONB, -- { top: [], middle: [], base: [] }
  price JSONB, -- { sample: number, bottle: number }
  image_url TEXT,
  inventory_count INTEGER DEFAULT 0,
  fragrance_type VARCHAR(100), -- e.g., 'woody', 'citrus', 'spicy'
  intensity VARCHAR(50), -- 'light', 'moderate', 'bold'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Required Data Validation Queries**:

```sql
-- 1. Ensure minimum fragrance count (at least 50 for recommendations)
SELECT COUNT(*) FROM fragrances WHERE id IS NOT NULL;

-- 2. Verify required fields are populated
SELECT
  COUNT(*) FILTER (WHERE name IS NULL OR name = '') as missing_names,
  COUNT(*) FILTER (WHERE brand IS NULL OR brand = '') as missing_brands,
  COUNT(*) FILTER (WHERE description IS NULL OR description = '') as missing_descriptions
FROM fragrances;

-- 3. Check fragrance type distribution
SELECT
  fragrance_type,
  COUNT(*) as count
FROM fragrances
WHERE fragrance_type IS NOT NULL
GROUP BY fragrance_type
ORDER BY count DESC;

-- 4. Validate notes structure
SELECT
  COUNT(*) FILTER (WHERE notes IS NULL) as missing_notes,
  COUNT(*) FILTER (WHERE jsonb_array_length(notes->'top') > 0) as has_top_notes,
  COUNT(*) FILTER (WHERE jsonb_array_length(notes->'middle') > 0) as has_middle_notes,
  COUNT(*) FILTER (WHERE jsonb_array_length(notes->'base') > 0) as has_base_notes
FROM fragrances;
```

### 2. Authentication Tables (Row Level Security Verification)

**Issue**: Authentication middleware disabled, need to verify RLS policies are properly configured.

#### User Profiles Table

```sql
-- Verify user profiles table and RLS
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

#### Collections Tables (If they exist)

```sql
-- Verify collections table RLS
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fragrance_id UUID REFERENCES fragrances(id) ON DELETE CASCADE,
  collection_type VARCHAR(50), -- 'wishlist', 'owned', 'tried'
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, fragrance_id, collection_type)
);

-- Enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own collections
CREATE POLICY "Users can manage own collections" ON collections
  FOR ALL USING (auth.uid() = user_id);
```

### 3. Quiz Results Storage (Optional Enhancement)

**Purpose**: Store quiz results to prevent duplicate expensive API calls

```sql
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_data JSONB NOT NULL, -- Store full quiz responses
  recommendations JSONB NOT NULL, -- Store AI recommendations
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Index for efficient lookups
CREATE INDEX idx_quiz_results_user_created ON quiz_results(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own quiz results
CREATE POLICY "Users can view own quiz results" ON quiz_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create quiz results" ON quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-cleanup expired results
CREATE OR REPLACE FUNCTION cleanup_expired_quiz_results()
RETURNS void AS $$
BEGIN
  DELETE FROM quiz_results WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run daily)
SELECT cron.schedule('cleanup-quiz-results', '0 2 * * *', 'SELECT cleanup_expired_quiz_results();');
```

## Database Verification Checklist

### Pre-Deployment Verification

- [ ] Fragrances table contains at least 50 entries
- [ ] All required fragrance fields are populated (name, brand, description)
- [ ] Fragrance notes are properly formatted as JSONB
- [ ] Price information is available for recommendations
- [ ] Authentication tables exist with proper RLS policies
- [ ] Database connection works from Vercel environment

### RLS Policy Validation

```sql
-- Test RLS policies are working
-- 1. As authenticated user, should see own data only
SET ROLE authenticated;
SELECT * FROM profiles WHERE id = auth.uid(); -- Should return user's profile
SELECT * FROM collections WHERE user_id = auth.uid(); -- Should return user's collections

-- 2. As anonymous user, should see no protected data
SET ROLE anon;
SELECT * FROM profiles; -- Should return no rows
SELECT * FROM collections; -- Should return no rows
```

### Data Quality Requirements

#### Fragrance Data Quality

```sql
-- Ensure data quality for AI recommendations
SELECT
  -- Check for empty or poor quality descriptions
  COUNT(*) FILTER (WHERE LENGTH(description) < 50) as short_descriptions,

  -- Check for missing price information
  COUNT(*) FILTER (WHERE price IS NULL OR price = '{}') as missing_prices,

  -- Check for missing notes
  COUNT(*) FILTER (WHERE notes IS NULL OR notes = '{}') as missing_notes,

  -- Check for missing images
  COUNT(*) FILTER (WHERE image_url IS NULL OR image_url = '') as missing_images
FROM fragrances;
```

#### Authentication Data Integrity

```sql
-- Verify auth.users table is properly configured
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_users
FROM auth.users;
```

## Migration Scripts (If Needed)

### Add Missing Indexes for Performance

```sql
-- Optimize fragrance queries for AI recommendations
CREATE INDEX IF NOT EXISTS idx_fragrances_type ON fragrances(fragrance_type);
CREATE INDEX IF NOT EXISTS idx_fragrances_intensity ON fragrances(intensity);
CREATE INDEX IF NOT EXISTS idx_fragrances_brand ON fragrances(brand);

-- Optimize auth queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_fragrance ON collections(fragrance_id);
```

### Seed Basic Fragrance Data (If Empty)

```sql
-- Only if fragrance table is completely empty
INSERT INTO fragrances (name, brand, description, notes, price, fragrance_type, intensity) VALUES
('Coach for Men', 'Coach', 'A woody aromatic fragrance with citrus and spice notes',
 '{"top": ["bergamot", "lime"], "middle": ["cardamom", "coriander"], "base": ["sandalwood", "ambergris"]}',
 '{"sample": 8.99, "bottle": 89.99}', 'woody', 'moderate'),
('Y Eau de Parfum', 'Yves Saint Laurent', 'Bold and intense with white and dark fougere notes',
 '{"top": ["bergamot", "aldehydes"], "middle": ["sage", "juniper berries"], "base": ["amberwood", "tonka bean"]}',
 '{"sample": 12.99, "bottle": 129.99}', 'aromatic', 'bold'),
('Spicebomb Extreme', 'Viktor & Rolf', 'Explosive spicy fragrance with tobacco and vanilla',
 '{"top": ["caraway", "cumin"], "middle": ["saffron", "cinnamon"], "base": ["tobacco", "vanilla"]}',
 '{"sample": 15.99, "bottle": 159.99}', 'spicy', 'bold');
-- Add more sample data as needed for testing...
```

## Environment Configuration

### Required Environment Variables for Database

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database Connection (if using direct connection)
DATABASE_URL=postgresql://postgres:password@host:port/database
```

## Monitoring and Alerting

### Database Health Checks

```sql
-- Monitor fragrance data availability
CREATE OR REPLACE FUNCTION check_fragrance_data()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM fragrances) >= 50;
END;
$$ LANGUAGE plpgsql;

-- Monitor authentication functionality
CREATE OR REPLACE FUNCTION check_auth_system()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM auth.users) > 0;
END;
$$ LANGUAGE plpgsql;
```

### Performance Monitoring

```sql
-- Track query performance
SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE query LIKE '%fragrances%'
ORDER BY mean_time DESC
LIMIT 10;
```
