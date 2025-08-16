# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-15-fragrance-collections-recommendations-pages/spec.md

## Database Changes Required

### New Tables

#### user_collections
```sql
CREATE TABLE user_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fragrance_id UUID REFERENCES fragrances(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'owned' CHECK (status IN ('owned', 'wishlist', 'tried')),
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  size_ml INTEGER,
  usage_frequency TEXT CHECK (usage_frequency IN ('daily', 'weekly', 'occasional', 'special')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  personal_notes TEXT,
  occasions TEXT[], -- ['work', 'date', 'casual', 'special']
  seasons TEXT[], -- ['spring', 'summer', 'fall', 'winter']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, fragrance_id)
);
```

#### user_preferences
```sql
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL, -- 'scent_family', 'intensity', 'longevity', 'occasion'
  preference_value TEXT NOT NULL,
  preference_strength DECIMAL(3,2) DEFAULT 0.5 CHECK (preference_strength >= 0 AND preference_strength <= 1),
  learned_from TEXT, -- 'quiz', 'collection_analysis', 'rating', 'feedback'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, preference_type, preference_value)
);
```

#### user_fragrance_interactions
```sql
CREATE TABLE user_fragrance_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fragrance_id UUID REFERENCES fragrances(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'like', 'dislike', 'sample_request', 'add_to_collection', 'remove_from_collection')),
  interaction_context TEXT, -- 'recommendation', 'search', 'similar', 'browse'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### fragrance_embeddings
```sql
CREATE TABLE fragrance_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fragrance_id UUID REFERENCES fragrances(id) ON DELETE CASCADE,
  embedding_version TEXT NOT NULL DEFAULT 'voyage-3.5',
  embedding VECTOR(1024), -- Voyage AI embedding dimension
  embedding_source TEXT NOT NULL, -- 'notes', 'description', 'reviews', 'combined'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(fragrance_id, embedding_version, embedding_source)
);
```

### Enhanced Existing Tables

#### fragrances (additional columns)
```sql
ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS
  intensity_score INTEGER CHECK (intensity_score >= 1 AND intensity_score <= 10),
  longevity_hours INTEGER CHECK (longevity_hours >= 1 AND longevity_hours <= 24),
  sillage_rating INTEGER CHECK (sillage_rating >= 1 AND sillage_rating <= 10),
  recommended_occasions TEXT[],
  recommended_seasons TEXT[],
  mood_tags TEXT[],
  sample_available BOOLEAN DEFAULT true,
  sample_price_usd DECIMAL(5,2),
  travel_size_available BOOLEAN DEFAULT false,
  travel_size_ml INTEGER,
  travel_size_price_usd DECIMAL(6,2);
```

### Indexes for Performance

```sql
-- Vector similarity search index
CREATE INDEX fragrance_embeddings_vector_idx ON fragrance_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Collection queries
CREATE INDEX user_collections_user_id_idx ON user_collections(user_id);
CREATE INDEX user_collections_added_at_idx ON user_collections(added_at DESC);
CREATE INDEX user_collections_status_idx ON user_collections(status);

-- Preference queries
CREATE INDEX user_preferences_user_id_type_idx ON user_preferences(user_id, preference_type);

-- Interaction analytics
CREATE INDEX user_fragrance_interactions_user_id_idx ON user_fragrance_interactions(user_id);
CREATE INDEX user_fragrance_interactions_created_at_idx ON user_fragrance_interactions(created_at DESC);
CREATE INDEX user_fragrance_interactions_type_idx ON user_fragrance_interactions(interaction_type);

-- Fragrance search and filtering
CREATE INDEX fragrances_sample_available_idx ON fragrances(sample_available) WHERE sample_available = true;
CREATE INDEX fragrances_occasions_idx ON fragrances USING gin(recommended_occasions);
CREATE INDEX fragrances_seasons_idx ON fragrances USING gin(recommended_seasons);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on new tables
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fragrance_interactions ENABLE ROW LEVEL SECURITY;

-- User collections policies
CREATE POLICY "Users can view own collections" ON user_collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections" ON user_collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON user_collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON user_collections
  FOR DELETE USING (auth.uid() = user_id);

-- User preferences policies  
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- User interactions policies
CREATE POLICY "Users can manage own interactions" ON user_fragrance_interactions
  FOR ALL USING (auth.uid() = user_id);

-- Fragrance embeddings are public for similarity search
CREATE POLICY "Fragrance embeddings are publicly readable" ON fragrance_embeddings
  FOR SELECT TO authenticated USING (true);
```

### Database Functions

#### Get Similar Fragrances
```sql
CREATE OR REPLACE FUNCTION get_similar_fragrances(
  target_fragrance_id UUID,
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  fragrance_id UUID,
  similarity_score FLOAT,
  name TEXT,
  brand TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    1 - (fe1.embedding <=> fe2.embedding) as similarity,
    f.name,
    f.brand
  FROM fragrance_embeddings fe1
  JOIN fragrance_embeddings fe2 ON fe1.embedding_version = fe2.embedding_version
  JOIN fragrances f ON fe2.fragrance_id = f.id
  WHERE fe1.fragrance_id = target_fragrance_id
    AND fe2.fragrance_id != target_fragrance_id
    AND fe1.embedding_source = 'combined'
    AND fe2.embedding_source = 'combined'
    AND 1 - (fe1.embedding <=> fe2.embedding) >= similarity_threshold
  ORDER BY similarity DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
```

#### Get User Collection Insights
```sql
CREATE OR REPLACE FUNCTION get_collection_insights(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_fragrances', COUNT(*),
    'dominant_families', (
      SELECT json_agg(family_data)
      FROM (
        SELECT f.scent_family as family, COUNT(*) as count
        FROM user_collections uc
        JOIN fragrances f ON uc.fragrance_id = f.id
        WHERE uc.user_id = target_user_id AND uc.status = 'owned'
        GROUP BY f.scent_family
        ORDER BY count DESC
        LIMIT 5
      ) family_data
    ),
    'average_intensity', ROUND(AVG(f.intensity_score), 1),
    'most_worn_occasion', MODE() WITHIN GROUP (ORDER BY occasion_arr.occasion),
    'collection_diversity_score', (
      SELECT COUNT(DISTINCT f.scent_family)::FLOAT / COUNT(*)
      FROM user_collections uc
      JOIN fragrances f ON uc.fragrance_id = f.id
      WHERE uc.user_id = target_user_id AND uc.status = 'owned'
    )
  ) INTO result
  FROM user_collections uc
  JOIN fragrances f ON uc.fragrance_id = f.id
  LEFT JOIN LATERAL unnest(uc.occasions) as occasion_arr(occasion) ON true
  WHERE uc.user_id = target_user_id AND uc.status = 'owned';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### Migration Script

```sql
-- Run in order:
-- 1. Create new tables
-- 2. Add columns to existing tables  
-- 3. Create indexes
-- 4. Enable RLS and create policies
-- 5. Create functions

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Validate data integrity after migration
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM user_collections WHERE user_id IS NULL) = 0,
    'user_collections must have valid user_id';
  ASSERT (SELECT COUNT(*) FROM fragrance_embeddings WHERE fragrance_id IS NULL) = 0,
    'fragrance_embeddings must have valid fragrance_id';
END $$;
```