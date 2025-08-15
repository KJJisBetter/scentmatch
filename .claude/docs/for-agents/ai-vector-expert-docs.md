# AI/Vector Search Expert Agent Documentation

## pgvector with Supabase Best Practices

### Vector Extension Setup

**Enable pgvector Extension**
```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Check extension is available
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**Vector Column Configuration**
```sql
-- Add embedding column (1536 for OpenAI text-embedding-3-small)
ALTER TABLE fragrances ADD COLUMN embedding vector(1536);

-- For different embedding models:
-- text-embedding-3-small: 1536 dimensions
-- text-embedding-3-large: 3072 dimensions  
-- voyage-2: 1024 dimensions
```

### Vector Index Optimization

**Index Types for Different Use Cases**
```sql
-- IVFFlat index (faster build, good for < 1M vectors)
CREATE INDEX ON fragrances USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- HNSW index (better accuracy, slower build, good for > 1M vectors)
CREATE INDEX ON fragrances USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

**Distance Operators**
```sql
-- Cosine similarity (most common for text embeddings)
SELECT * FROM fragrances ORDER BY embedding <=> query_vector LIMIT 10;

-- Euclidean distance
SELECT * FROM fragrances ORDER BY embedding <-> query_vector LIMIT 10;

-- Dot product (for normalized vectors)
SELECT * FROM fragrances ORDER BY embedding <#> query_vector LIMIT 10;
```

### Embedding Generation Patterns

**OpenAI Embeddings Integration**
```typescript
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small', // 1536 dimensions
    input: text,
    encoding_format: 'float',
  })
  
  return response.data[0].embedding
}

// Batch processing for multiple texts
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts, // Can process up to 2048 inputs at once
  })
  
  return response.data.map(item => item.embedding)
}
```

**Fragrance Text Preparation**
```typescript
export function prepareFragranceText(fragrance: Fragrance): string {
  // Combine relevant fields for embedding
  const parts = [
    fragrance.name,
    fragrance.brand_name,
    fragrance.accords?.join(' '),
    fragrance.perfumers?.join(' '),
    fragrance.gender,
  ].filter(Boolean)
  
  return parts.join(' ')
}
```

### Similarity Search Implementation

**Basic Similarity Search**
```typescript
export async function findSimilarFragrances(
  fragranceId: string,
  limit: number = 10
): Promise<Fragrance[]> {
  const supabase = createClient()
  
  // Get the target fragrance embedding
  const { data: targetFragrance } = await supabase
    .from('fragrances')
    .select('embedding')
    .eq('id', fragranceId)
    .single()
    
  if (!targetFragrance?.embedding) throw new Error('No embedding found')
  
  // Find similar fragrances using cosine similarity
  const { data: similarFragrances } = await supabase
    .from('fragrances')
    .select('*')
    .not('id', 'eq', fragranceId) // Exclude target fragrance
    .order('embedding', { 
      ascending: true,
      referencedTable: null,
      // Use pgvector similarity operator
    })
    .limit(limit)
    
  return similarFragrances || []
}
```

**Hybrid Search (Text + Vector)**
```sql
-- Combine full-text search with vector similarity
SELECT 
  f.*,
  ts_rank(search_vector, to_tsquery('english', $1)) as text_score,
  1 - (embedding <=> $2) as similarity_score,
  -- Weighted combination of text and vector scores
  (ts_rank(search_vector, to_tsquery('english', $1)) * 0.3 + 
   (1 - (embedding <=> $2)) * 0.7) as combined_score
FROM fragrances f
WHERE 
  search_vector @@ to_tsquery('english', $1) -- Text match required
  OR embedding <=> $2 < 0.8 -- Or high vector similarity
ORDER BY combined_score DESC
LIMIT $3;
```

### Recommendation Engine Patterns

**User Preference Learning**
```typescript
export async function generateUserPreferenceEmbedding(
  userId: string
): Promise<number[]> {
  const supabase = createClient()
  
  // Get user's favorite fragrances
  const { data: favorites } = await supabase
    .from('user_collections')
    .select(`
      fragrances (embedding, rating_value)
    `)
    .eq('user_id', userId)
    .eq('collection_type', 'owned')
    .gte('rating', 7) // High ratings only
    
  if (!favorites?.length) return []
  
  // Average embeddings weighted by user ratings
  const weightedEmbeddings = favorites.map(item => {
    const weight = item.fragrances.rating_value / 10
    return item.fragrances.embedding.map(val => val * weight)
  })
  
  // Average all dimensions
  const avgEmbedding = new Array(1536).fill(0)
  weightedEmbeddings.forEach(embedding => {
    embedding.forEach((val, idx) => {
      avgEmbedding[idx] += val / weightedEmbeddings.length
    })
  })
  
  return avgEmbedding
}
```

**Personalized Recommendations**
```typescript
export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = 20
): Promise<Fragrance[]> {
  // Generate user preference embedding
  const userEmbedding = await generateUserPreferenceEmbedding(userId)
  
  if (!userEmbedding.length) {
    // Fallback to popular fragrances
    return getPopularFragrances(limit)
  }
  
  const supabase = createClient()
  
  // Get user's existing collection to exclude
  const { data: userFragrances } = await supabase
    .from('user_collections')
    .select('fragrance_id')
    .eq('user_id', userId)
    
  const excludeIds = userFragrances?.map(item => item.fragrance_id) || []
  
  // Find similar fragrances
  const { data: recommendations } = await supabase
    .from('fragrances')
    .select('*')
    .not('id', 'in', excludeIds)
    .order('embedding', { ascending: true }) // Cosine similarity
    .limit(limit)
    
  return recommendations || []
}
```

### Performance Optimization

**Embedding Storage Optimization**
```sql
-- Use TOAST compression for large embeddings
ALTER TABLE fragrances ALTER COLUMN embedding SET STORAGE EXTENDED;

-- Partial indexes for common queries
CREATE INDEX idx_fragrances_embedding_not_null 
ON fragrances USING ivfflat (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL;
```

**Batch Embedding Updates**
```typescript
export async function updateFragranceEmbeddings(
  fragrances: Array<{id: string, text: string}>
): Promise<void> {
  // Process in batches to avoid rate limits
  const batchSize = 100
  
  for (let i = 0; i < fragrances.length; i += batchSize) {
    const batch = fragrances.slice(i, i + batchSize)
    const texts = batch.map(f => f.text)
    
    // Generate embeddings for batch
    const embeddings = await generateEmbeddings(texts)
    
    // Update database in batch
    const updates = batch.map((fragrance, idx) => ({
      id: fragrance.id,
      embedding: embeddings[idx]
    }))
    
    await supabase
      .from('fragrances')
      .upsert(updates)
  }
}
```

### Vector Search Quality

**Similarity Thresholds**
```typescript
// Cosine similarity ranges (1536-dimensional embeddings)
const SIMILARITY_THRESHOLDS = {
  VERY_SIMILAR: 0.9,    // Almost identical
  SIMILAR: 0.8,         // Good match
  SOMEWHAT_SIMILAR: 0.7, // Acceptable match
  DIFFERENT: 0.6,       // Different but related
  UNRELATED: 0.5        // No meaningful relation
}

export function filterBySimilarity(
  results: Array<{fragrance: Fragrance, similarity: number}>,
  threshold: number = SIMILARITY_THRESHOLDS.SIMILAR
) {
  return results.filter(result => result.similarity >= threshold)
}
```

### Common Vector Operations

**Vector Normalization**
```typescript
export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
  return vector.map(val => val / magnitude)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, idx) => sum + val * b[idx], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}
```

### Migration and Maintenance

**Embedding Version Management**
```sql
-- Track embedding model versions
ALTER TABLE fragrances ADD COLUMN embedding_model TEXT DEFAULT 'text-embedding-3-small';
ALTER TABLE fragrances ADD COLUMN embedding_version INTEGER DEFAULT 1;

-- Migration function for new embedding models
CREATE OR REPLACE FUNCTION migrate_embeddings(
  old_model TEXT,
  new_model TEXT
) RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Mark fragrances needing re-embedding
  UPDATE fragrances 
  SET embedding = NULL, embedding_model = new_model, embedding_version = embedding_version + 1
  WHERE embedding_model = old_model;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
```