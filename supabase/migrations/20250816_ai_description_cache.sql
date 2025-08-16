-- Create table for caching AI-generated fragrance descriptions
-- This improves performance and reduces AI API costs

CREATE TABLE IF NOT EXISTS fragrance_ai_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fragrance_id TEXT NOT NULL,
  ai_description TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Create unique constraint to prevent duplicate cache entries
  CONSTRAINT unique_fragrance_ai_cache UNIQUE (fragrance_id)
);

-- Create index for fast lookups by fragrance_id
CREATE INDEX IF NOT EXISTS idx_fragrance_ai_cache_fragrance_id 
ON fragrance_ai_cache (fragrance_id);

-- Create index for cleanup of old cache entries (if needed)
CREATE INDEX IF NOT EXISTS idx_fragrance_ai_cache_generated_at 
ON fragrance_ai_cache (generated_at);

-- Add RLS (Row Level Security) policy for secure access
ALTER TABLE fragrance_ai_cache ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (public data)
CREATE POLICY "fragrance_ai_cache_select_policy" 
ON fragrance_ai_cache FOR SELECT 
USING (true);

-- Allow insert/update only to service role (for caching)
CREATE POLICY "fragrance_ai_cache_insert_policy" 
ON fragrance_ai_cache FOR INSERT 
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "fragrance_ai_cache_update_policy" 
ON fragrance_ai_cache FOR UPDATE 
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Add helpful comment
COMMENT ON TABLE fragrance_ai_cache IS 'Caches AI-generated fragrance descriptions to improve performance and reduce API costs';
COMMENT ON COLUMN fragrance_ai_cache.fragrance_id IS 'References fragrances.id - the fragrance this description is for';
COMMENT ON COLUMN fragrance_ai_cache.ai_description IS 'The AI-generated personality-focused description';
COMMENT ON COLUMN fragrance_ai_cache.generated_at IS 'When this description was first generated';
COMMENT ON COLUMN fragrance_ai_cache.updated_at IS 'When this description was last updated';