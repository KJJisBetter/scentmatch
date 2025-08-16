# Database Migration Strategy

## Migration Files Structure

### Migration 001: Enable Extensions

```sql
-- migrations/001_enable_extensions.sql
-- Enable required PostgreSQL extensions for ScentMatch

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vector similarity search (for AI embeddings)
CREATE EXTENSION IF NOT EXISTS "vector";

-- Text search capabilities
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Compound index optimization
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Scheduled jobs (for cache refresh)
CREATE EXTENSION IF NOT EXISTS "pg_cron";
```

### Migration 002: Core User Tables

```sql
-- migrations/002_user_tables.sql
-- Core user profile and authentication tables

-- User profiles extending Supabase auth
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'enthusiast', 'collector')),
  scent_preferences JSONB DEFAULT '{
    "favorite_families": [],
    "favorite_seasons": [],
    "favorite_occasions": [],
    "intensity_preference": "moderate"
  }'::jsonb,
  onboarding_completed BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'expert')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Indexes for profile lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_experience ON public.profiles(experience_level);
CREATE INDEX idx_profiles_subscription ON public.profiles(subscription_tier) WHERE subscription_tier != 'free';

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### Migration 003: Fragrance Catalog Tables

```sql
-- migrations/003_fragrance_catalog.sql
-- Fragrance brands and main fragrance table

-- Brand catalog
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  country TEXT,
  founded_year INTEGER,
  luxury_level TEXT CHECK (luxury_level IN ('designer', 'niche', 'indie', 'celebrity')),
  parent_company TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand indexes
CREATE INDEX idx_brands_slug ON public.brands(slug);
CREATE INDEX idx_brands_name_gin ON public.brands USING gin(name gin_trgm_ops);
CREATE INDEX idx_brands_luxury ON public.brands(luxury_level);
CREATE INDEX idx_brands_active ON public.brands(is_active) WHERE is_active = true;

-- Main fragrances table
CREATE TABLE public.fragrances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  year_released INTEGER CHECK (year_released >= 1900 AND year_released <= EXTRACT(YEAR FROM NOW()) + 1),
  perfumer TEXT[],
  concentration TEXT CHECK (concentration IN ('parfum', 'edp', 'edt', 'edc', 'cologne', 'oil', 'extrait', 'absolute')),
  gender TEXT CHECK (gender IN ('masculine', 'feminine', 'unisex')),

  -- Scent DNA
  scent_profile JSONB DEFAULT '{
    "pyramid": {
      "top": [],
      "heart": [],
      "base": []
    },
    "accords": [],
    "families": [],
    "descriptors": []
  }'::jsonb,
  top_notes TEXT[] DEFAULT '{}',
  heart_notes TEXT[] DEFAULT '{}',
  base_notes TEXT[] DEFAULT '{}',
  accords TEXT[] DEFAULT '{}',

  -- Performance metrics (1-5 scale)
  longevity DECIMAL(3,2) CHECK (longevity >= 0 AND longevity <= 5),
  sillage DECIMAL(3,2) CHECK (sillage >= 0 AND sillage <= 5),
  value_rating DECIMAL(3,2) CHECK (value_rating >= 0 AND value_rating <= 5),
  versatility DECIMAL(3,2) CHECK (versatility >= 0 AND versatility <= 5),

  -- AI embeddings
  embedding VECTOR(1024), -- Voyage AI voyage-3.5
  embedding_model TEXT DEFAULT 'voyage-3.5',
  embedding_version INTEGER DEFAULT 1,
  embedding_generated_at TIMESTAMPTZ,

  -- Content
  description TEXT,
  story TEXT,
  image_url TEXT,
  thumbnail_url TEXT,

  -- Commerce
  affiliate_links JSONB DEFAULT '[]'::jsonb,
  sample_available BOOLEAN DEFAULT false,
  travel_size_available BOOLEAN DEFAULT false,
  avg_price_full DECIMAL(10,2),
  avg_price_sample DECIMAL(10,2),

  -- Status
  discontinued BOOLEAN DEFAULT false,
  limited_edition BOOLEAN DEFAULT false,
  seasonal BOOLEAN DEFAULT false,

  -- Computed statistics (denormalized)
  avg_rating DECIMAL(3,2),
  total_ratings INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_owners INTEGER DEFAULT 0,
  popularity_score DECIMAL(10,2) DEFAULT 0,
  trending_score DECIMAL(10,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_brand_fragrance UNIQUE (brand_id, name),
  CONSTRAINT valid_year CHECK (year_released IS NULL OR (year_released >= 1900 AND year_released <= EXTRACT(YEAR FROM NOW()) + 1))
);

-- Fragrance indexes
CREATE INDEX idx_fragrances_brand ON public.fragrances(brand_id);
CREATE INDEX idx_fragrances_slug ON public.fragrances(slug);
CREATE INDEX idx_fragrances_name_gin ON public.fragrances USING gin(name gin_trgm_ops);
CREATE INDEX idx_fragrances_gender ON public.fragrances(gender);
CREATE INDEX idx_fragrances_concentration ON public.fragrances(concentration);
CREATE INDEX idx_fragrances_year ON public.fragrances(year_released);

-- Composite indexes for common queries
CREATE INDEX idx_fragrances_notes_gin ON public.fragrances
  USING gin((top_notes || heart_notes || base_notes));
CREATE INDEX idx_fragrances_accords_gin ON public.fragrances USING gin(accords);

-- Vector index for similarity search (IVFFlat for performance)
CREATE INDEX idx_fragrances_embedding ON public.fragrances
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Indexes for filtering
CREATE INDEX idx_fragrances_available ON public.fragrances(discontinued, sample_available)
  WHERE discontinued = false;
CREATE INDEX idx_fragrances_popularity ON public.fragrances(popularity_score DESC NULLS LAST);
CREATE INDEX idx_fragrances_trending ON public.fragrances(trending_score DESC NULLS LAST)
  WHERE trending_score > 0;

-- Update trigger
CREATE TRIGGER fragrances_updated_at
  BEFORE UPDATE ON public.fragrances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### Migration 004: User Collection Tables

```sql
-- migrations/004_user_collections.sql
-- User fragrance collections and preferences

-- User fragrance collection
CREATE TABLE public.user_fragrances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  fragrance_id UUID REFERENCES public.fragrances(id) ON DELETE CASCADE,

  -- Collection categorization
  status TEXT NOT NULL CHECK (status IN ('owned', 'wishlist', 'tested', 'decant', 'sample', 'had')),
  acquisition_date DATE,
  bottle_size INTEGER CHECK (bottle_size > 0), -- in ml
  purchase_price DECIMAL(10,2) CHECK (purchase_price >= 0),
  purchase_location TEXT,

  -- Personal ratings (nullable for wishlist items)
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  longevity_rating DECIMAL(3,2) CHECK (longevity_rating >= 0 AND longevity_rating <= 5),
  sillage_rating DECIMAL(3,2) CHECK (sillage_rating >= 0 AND sillage_rating <= 5),
  versatility_rating DECIMAL(3,2) CHECK (versatility_rating >= 0 AND versatility_rating <= 5),

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_worn DATE,
  favorite_seasons TEXT[] DEFAULT '{}',
  favorite_occasions TEXT[] DEFAULT '{}',
  favorite_layering TEXT[], -- Other fragrance IDs for layering

  -- Personal notes
  personal_notes TEXT,
  would_repurchase BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_fragrance UNIQUE (user_id, fragrance_id)
);

-- Collection indexes
CREATE INDEX idx_user_fragrances_user ON public.user_fragrances(user_id);
CREATE INDEX idx_user_fragrances_fragrance ON public.user_fragrances(fragrance_id);
CREATE INDEX idx_user_fragrances_status ON public.user_fragrances(user_id, status);
CREATE INDEX idx_user_fragrances_rating ON public.user_fragrances(user_id, rating DESC)
  WHERE rating IS NOT NULL;
CREATE INDEX idx_user_fragrances_worn ON public.user_fragrances(user_id, last_worn DESC NULLS LAST);

-- Update trigger
CREATE TRIGGER user_fragrances_updated_at
  BEFORE UPDATE ON public.user_fragrances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to update fragrance statistics after collection change
CREATE OR REPLACE FUNCTION public.update_fragrance_stats()
RETURNS trigger AS $$
BEGIN
  -- Update total owners count
  UPDATE public.fragrances
  SET total_owners = (
    SELECT COUNT(DISTINCT user_id)
    FROM public.user_fragrances
    WHERE fragrance_id = COALESCE(NEW.fragrance_id, OLD.fragrance_id)
      AND status IN ('owned', 'decant', 'sample')
  )
  WHERE id = COALESCE(NEW.fragrance_id, OLD.fragrance_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fragrance_stats_on_collection_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_fragrances
  FOR EACH ROW EXECUTE FUNCTION public.update_fragrance_stats();
```

### Migration 005: Reviews and Ratings

```sql
-- migrations/005_reviews_ratings.sql
-- User reviews and ratings system

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  fragrance_id UUID REFERENCES public.fragrances(id) ON DELETE CASCADE,

  -- Overall rating (required)
  rating DECIMAL(3,2) NOT NULL CHECK (rating >= 0 AND rating <= 5),

  -- Review content
  title TEXT,
  content TEXT NOT NULL CHECK (char_length(content) >= 10),

  -- Detailed ratings (optional)
  longevity_rating DECIMAL(3,2) CHECK (longevity_rating >= 0 AND longevity_rating <= 5),
  sillage_rating DECIMAL(3,2) CHECK (sillage_rating >= 0 AND sillage_rating <= 5),
  value_rating DECIMAL(3,2) CHECK (value_rating >= 0 AND value_rating <= 5),
  versatility_rating DECIMAL(3,2) CHECK (versatility_rating >= 0 AND versatility_rating <= 5),

  -- Review metadata
  verified_purchase BOOLEAN DEFAULT false,
  ownership_status TEXT CHECK (ownership_status IN ('owned', 'sample', 'decant', 'tested')),
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,

  -- Moderation
  is_visible BOOLEAN DEFAULT true,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderation_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_review UNIQUE (user_id, fragrance_id),
  CONSTRAINT review_content_length CHECK (char_length(content) >= 10 AND char_length(content) <= 5000)
);

-- Review indexes
CREATE INDEX idx_reviews_fragrance ON public.reviews(fragrance_id, is_visible, rating DESC);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_reviews_recent ON public.reviews(created_at DESC) WHERE is_visible = true;
CREATE INDEX idx_reviews_helpful ON public.reviews(fragrance_id, helpful_count DESC) WHERE is_visible = true;
CREATE INDEX idx_reviews_moderation ON public.reviews(moderation_status) WHERE moderation_status = 'pending';

-- Review helpfulness tracking
CREATE TABLE public.review_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'unhelpful')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_review_vote UNIQUE (review_id, user_id)
);

CREATE INDEX idx_review_votes_review ON public.review_votes(review_id);
CREATE INDEX idx_review_votes_user ON public.review_votes(user_id);

-- Update review counts trigger
CREATE OR REPLACE FUNCTION public.update_review_counts()
RETURNS trigger AS $$
BEGIN
  -- Update helpful/unhelpful counts
  UPDATE public.reviews
  SET
    helpful_count = (
      SELECT COUNT(*) FROM public.review_votes
      WHERE review_id = NEW.review_id AND vote_type = 'helpful'
    ),
    unhelpful_count = (
      SELECT COUNT(*) FROM public.review_votes
      WHERE review_id = NEW.review_id AND vote_type = 'unhelpful'
    )
  WHERE id = NEW.review_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_review_counts_on_vote
  AFTER INSERT OR UPDATE OR DELETE ON public.review_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_review_counts();

-- Update fragrance ratings after review
CREATE OR REPLACE FUNCTION public.update_fragrance_ratings()
RETURNS trigger AS $$
BEGIN
  UPDATE public.fragrances
  SET
    avg_rating = (
      SELECT AVG(rating)
      FROM public.reviews
      WHERE fragrance_id = COALESCE(NEW.fragrance_id, OLD.fragrance_id)
        AND is_visible = true
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE fragrance_id = COALESCE(NEW.fragrance_id, OLD.fragrance_id)
        AND is_visible = true
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE fragrance_id = COALESCE(NEW.fragrance_id, OLD.fragrance_id)
        AND is_visible = true
        AND content IS NOT NULL
    )
  WHERE id = COALESCE(NEW.fragrance_id, OLD.fragrance_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fragrance_ratings_on_review
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_fragrance_ratings();

-- Update triggers
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### Migration 006: AI and Recommendations

```sql
-- migrations/006_ai_recommendations.sql
-- AI-powered preference learning and recommendations

-- User preference profiles
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,

  -- Learned preference vectors
  preference_embedding VECTOR(1024), -- What they like
  anti_preference_embedding VECTOR(1024), -- What they dislike
  exploration_embedding VECTOR(1024), -- For discovering new scents

  -- Structured preferences
  favorite_notes TEXT[] DEFAULT '{}',
  disliked_notes TEXT[] DEFAULT '{}',
  favorite_accords TEXT[] DEFAULT '{}',
  disliked_accords TEXT[] DEFAULT '{}',
  favorite_brands UUID[] DEFAULT '{}', -- Brand IDs

  -- Preference settings
  preferred_concentration TEXT[],
  preferred_gender TEXT[],
  preferred_seasons TEXT[],
  preferred_occasions TEXT[],
  preferred_longevity_min DECIMAL(3,2),
  preferred_sillage_min DECIMAL(3,2),

  -- Budget and shopping preferences
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  prefer_samples BOOLEAN DEFAULT true,
  prefer_niche BOOLEAN DEFAULT false,
  prefer_designer BOOLEAN DEFAULT true,

  -- Discovery settings
  include_discontinued BOOLEAN DEFAULT false,
  include_limited_edition BOOLEAN DEFAULT true,
  adventure_level INTEGER DEFAULT 3 CHECK (adventure_level >= 1 AND adventure_level <= 5),
  similarity_threshold DECIMAL(3,2) DEFAULT 0.7 CHECK (similarity_threshold >= 0 AND similarity_threshold <= 1),

  -- Computation metadata
  last_computed_at TIMESTAMPTZ,
  computation_version INTEGER DEFAULT 1,
  sample_size INTEGER, -- Number of fragrances used to compute

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Preference indexes
CREATE INDEX idx_user_preferences_user ON public.user_preferences(user_id);
CREATE INDEX idx_preferences_embedding ON public.user_preferences
  USING ivfflat (preference_embedding vector_cosine_ops)
  WITH (lists = 50);
CREATE INDEX idx_anti_preferences_embedding ON public.user_preferences
  USING ivfflat (anti_preference_embedding vector_cosine_ops)
  WITH (lists = 50);

-- Recommendation cache
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  fragrance_id UUID REFERENCES public.fragrances(id) ON DELETE CASCADE,

  -- Recommendation scoring
  overall_score DECIMAL(5,4) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 1),
  similarity_score DECIMAL(5,4),
  novelty_score DECIMAL(5,4),
  trending_score DECIMAL(5,4),

  -- Recommendation metadata
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
    'similar', 'complementary', 'adventure', 'trending', 'seasonal',
    'occasion', 'layering', 'upgrade', 'budget', 'discovery'
  )),
  reason TEXT NOT NULL, -- Human-readable explanation
  context JSONB DEFAULT '{}', -- Additional context

  -- User interaction tracking
  viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  purchased BOOLEAN DEFAULT false,
  feedback TEXT CHECK (feedback IN ('love', 'like', 'neutral', 'dislike', 'hate')),

  -- Recommendation lifecycle
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_active_recommendation
    UNIQUE (user_id, fragrance_id, recommendation_type)
    WHERE is_active = true
);

-- Recommendation indexes
CREATE INDEX idx_recommendations_user ON public.recommendations(user_id, expires_at DESC)
  WHERE is_active = true;
CREATE INDEX idx_recommendations_type ON public.recommendations(user_id, recommendation_type, overall_score DESC)
  WHERE is_active = true;
CREATE INDEX idx_recommendations_unviewed ON public.recommendations(user_id, viewed)
  WHERE is_active = true AND viewed = false;
CREATE INDEX idx_recommendations_expiry ON public.recommendations(expires_at)
  WHERE is_active = true;

-- Recommendation feedback for learning
CREATE TABLE public.recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  action TEXT NOT NULL CHECK (action IN (
    'view', 'click', 'dismiss', 'wishlist', 'purchase', 'rate'
  )),
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  feedback_text TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_feedback_action UNIQUE (recommendation_id, action)
);

CREATE INDEX idx_recommendation_feedback_rec ON public.recommendation_feedback(recommendation_id);
CREATE INDEX idx_recommendation_feedback_user ON public.recommendation_feedback(user_id);

-- Update triggers
CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to expire old recommendations
CREATE OR REPLACE FUNCTION public.expire_old_recommendations()
RETURNS void AS $$
BEGIN
  UPDATE public.recommendations
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Schedule recommendation expiry (runs daily)
SELECT cron.schedule('expire-recommendations', '0 0 * * *', 'SELECT public.expire_old_recommendations()');
```

### Migration 007: Performance Optimizations

```sql
-- migrations/007_performance_optimizations.sql
-- Materialized views and performance enhancements

-- Popular fragrances view
CREATE MATERIALIZED VIEW public.popular_fragrances AS
SELECT
  f.*,
  COUNT(DISTINCT uf.user_id) as owner_count,
  COUNT(DISTINCT r.id) as review_count,
  AVG(r.rating)::DECIMAL(3,2) as calculated_avg_rating,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY r.rating) as median_rating
FROM public.fragrances f
LEFT JOIN public.user_fragrances uf ON f.id = uf.fragrance_id
  AND uf.status IN ('owned', 'decant', 'sample')
LEFT JOIN public.reviews r ON f.id = r.fragrance_id
  AND r.is_visible = true
GROUP BY f.id
ORDER BY owner_count DESC, calculated_avg_rating DESC;

CREATE UNIQUE INDEX idx_popular_fragrances_id ON public.popular_fragrances(id);
CREATE INDEX idx_popular_fragrances_owners ON public.popular_fragrances(owner_count DESC);
CREATE INDEX idx_popular_fragrances_rating ON public.popular_fragrances(calculated_avg_rating DESC);

-- Trending fragrances (last 30 days)
CREATE MATERIALIZED VIEW public.trending_fragrances AS
WITH recent_activity AS (
  SELECT
    fragrance_id,
    COUNT(*) as activity_count,
    COUNT(DISTINCT user_id) as unique_users
  FROM (
    SELECT fragrance_id, user_id, created_at
    FROM public.user_fragrances
    WHERE created_at > NOW() - INTERVAL '30 days'
    UNION ALL
    SELECT fragrance_id, user_id, created_at
    FROM public.reviews
    WHERE created_at > NOW() - INTERVAL '30 days'
  ) combined
  GROUP BY fragrance_id
)
SELECT
  f.*,
  ra.activity_count,
  ra.unique_users,
  (ra.activity_count * 0.7 + ra.unique_users * 0.3) as trending_score_calc
FROM public.fragrances f
INNER JOIN recent_activity ra ON f.id = ra.fragrance_id
ORDER BY trending_score_calc DESC;

CREATE UNIQUE INDEX idx_trending_fragrances_id ON public.trending_fragrances(id);
CREATE INDEX idx_trending_fragrances_score ON public.trending_fragrances(trending_score_calc DESC);

-- Seasonal recommendations
CREATE MATERIALIZED VIEW public.seasonal_fragrances AS
SELECT
  f.*,
  season,
  COUNT(*) as season_mentions,
  AVG(uf.rating)::DECIMAL(3,2) as season_avg_rating
FROM public.fragrances f
INNER JOIN public.user_fragrances uf ON f.id = uf.fragrance_id
CROSS JOIN LATERAL unnest(uf.favorite_seasons) AS season
WHERE uf.rating IS NOT NULL
GROUP BY f.id, season
HAVING COUNT(*) >= 5  -- Minimum mentions
ORDER BY season, season_mentions DESC;

CREATE INDEX idx_seasonal_fragrances_season ON public.seasonal_fragrances(season, season_mentions DESC);

-- Fragrance similarity pre-computation (top 20 similar for each)
CREATE TABLE public.fragrance_similarities (
  fragrance_id UUID REFERENCES public.fragrances(id) ON DELETE CASCADE,
  similar_fragrance_id UUID REFERENCES public.fragrances(id) ON DELETE CASCADE,
  similarity_score DECIMAL(5,4) NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (fragrance_id, similar_fragrance_id)
);

CREATE INDEX idx_fragrance_similarities_score ON public.fragrance_similarities(fragrance_id, similarity_score DESC);

-- Refresh functions
CREATE OR REPLACE FUNCTION public.refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.popular_fragrances;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.trending_fragrances;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.seasonal_fragrances;
END;
$$ LANGUAGE plpgsql;

-- Schedule hourly refresh
SELECT cron.schedule('refresh-views', '0 * * * *', 'SELECT public.refresh_materialized_views()');

-- Compute fragrance similarities function
CREATE OR REPLACE FUNCTION public.compute_fragrance_similarities(
  fragrance_id_param UUID,
  limit_param INTEGER DEFAULT 20
)
RETURNS void AS $$
BEGIN
  -- Delete existing similarities for this fragrance
  DELETE FROM public.fragrance_similarities
  WHERE fragrance_id = fragrance_id_param;

  -- Insert new similarities
  INSERT INTO public.fragrance_similarities (fragrance_id, similar_fragrance_id, similarity_score)
  SELECT
    fragrance_id_param,
    f.id,
    1 - (f.embedding <=> source.embedding) as similarity
  FROM public.fragrances f
  CROSS JOIN (
    SELECT embedding
    FROM public.fragrances
    WHERE id = fragrance_id_param
  ) source
  WHERE f.id != fragrance_id_param
    AND f.embedding IS NOT NULL
    AND source.embedding IS NOT NULL
  ORDER BY f.embedding <=> source.embedding
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;
```

### Migration 008: Row-Level Security

```sql
-- migrations/008_row_level_security.sql
-- Enable RLS and create security policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fragrances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_fragrances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fragrance_similarities ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Brands policies (public read)
CREATE POLICY "Brands are viewable by everyone"
  ON public.brands FOR SELECT
  USING (true);

-- Fragrances policies (public read)
CREATE POLICY "Fragrances are viewable by everyone"
  ON public.fragrances FOR SELECT
  USING (true);

-- User fragrances policies (private)
CREATE POLICY "Users can view own collection"
  ON public.user_fragrances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own collection"
  ON public.user_fragrances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collection"
  ON public.user_fragrances FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own collection"
  ON public.user_fragrances FOR DELETE
  USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (is_visible = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Review votes policies
CREATE POLICY "Review votes are viewable by review authors"
  ON public.review_votes FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.reviews WHERE id = review_id
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Users can create own votes"
  ON public.review_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON public.review_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON public.review_votes FOR DELETE
  USING (auth.uid() = user_id);

-- User preferences policies (private)
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recommendations policies (private)
CREATE POLICY "Users can view own recommendations"
  ON public.recommendations FOR SELECT
  USING (auth.uid() = user_id);

-- Recommendation feedback policies
CREATE POLICY "Users can view own feedback"
  ON public.recommendation_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own feedback"
  ON public.recommendation_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Fragrance similarities (public read)
CREATE POLICY "Similarities are viewable by everyone"
  ON public.fragrance_similarities FOR SELECT
  USING (true);

-- Service role policies (for backend operations)
CREATE POLICY "Service role has full access to recommendations"
  ON public.recommendations FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to similarities"
  ON public.fragrance_similarities FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

## Rollback Scripts

### Rollback 008 to 007

```sql
-- rollback/008_to_007.sql
-- Disable RLS policies

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
-- ... (drop all policies)

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;
-- ... (disable RLS on all tables)
```

### Rollback 007 to 006

```sql
-- rollback/007_to_006.sql
-- Drop performance optimizations

DROP MATERIALIZED VIEW IF EXISTS public.seasonal_fragrances;
DROP MATERIALIZED VIEW IF EXISTS public.trending_fragrances;
DROP MATERIALIZED VIEW IF EXISTS public.popular_fragrances;
DROP TABLE IF EXISTS public.fragrance_similarities;
DROP FUNCTION IF EXISTS public.refresh_materialized_views();
DROP FUNCTION IF EXISTS public.compute_fragrance_similarities(UUID, INTEGER);
```

## Migration Execution Plan

### Local Development

```bash
# Run migrations
npx supabase migration up

# Check status
npx supabase migration list

# Create new migration
npx supabase migration new <name>
```

### Production Deployment

```bash
# 1. Test on staging
supabase db push --db-url $STAGING_DATABASE_URL

# 2. Backup production
supabase db dump --db-url $PRODUCTION_DATABASE_URL > backup_$(date +%Y%m%d).sql

# 3. Deploy to production
supabase db push --db-url $PRODUCTION_DATABASE_URL

# 4. Verify deployment
supabase migration list --db-url $PRODUCTION_DATABASE_URL
```

## Data Validation Queries

```sql
-- Verify all tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Verify indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check extensions
SELECT extname, extversion
FROM pg_extension;
```
