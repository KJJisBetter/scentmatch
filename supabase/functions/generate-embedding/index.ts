// Edge Function for Real-Time Embedding Generation
// Processes AI queue tasks and generates embeddings using Voyage AI

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY')!;

// Initialize Supabase client with service role permissions
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Voyage AI Configuration
const VOYAGE_CONFIG = {
  baseUrl: 'https://api.voyageai.com/v1',
  primaryModel: 'voyage-3-large',
  fallbackModel: 'voyage-3.5',
  maxTokens: 32000,
  dimensions: 2000 // pgvector compatibility limit
};

// Types
interface EmbeddingRequest {
  fragrance_id: string;
  content: {
    name: string;
    brand: string;
    description?: string;
    accords?: string[];
    family?: string;
  };
  options?: {
    model?: string;
    priority?: number;
    retry_count?: number;
  };
}

interface EmbeddingResponse {
  success: boolean;
  fragrance_id: string;
  embedding?: number[];
  model?: string;
  dimensions?: number;
  tokens_used?: number;
  cost?: number;
  processing_time_ms?: number;
  error?: string;
  retry_recommended?: boolean;
}

// Main Edge Function handler
Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const embeddingRequest: EmbeddingRequest = await req.json();
    
    // Validate request
    if (!embeddingRequest.fragrance_id || !embeddingRequest.content) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing fragrance_id or content' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate embedding
    const result = await generateFragranceEmbedding(embeddingRequest);
    
    // Store in database if successful
    if (result.success && result.embedding) {
      await storeEmbeddingInDatabase(result);
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Edge Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Generate embedding using Voyage AI with fallback
async function generateFragranceEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
  const startTime = Date.now();
  
  try {
    // Prepare content for embedding
    const embeddingText = prepareEmbeddingContent(request.content);
    
    // Try primary model first
    const model = request.options?.model || VOYAGE_CONFIG.primaryModel;
    
    try {
      const embedding = await callVoyageAPI(embeddingText, model);
      
      return {
        success: true,
        fragrance_id: request.fragrance_id,
        embedding: embedding.embedding,
        model: embedding.model,
        dimensions: VOYAGE_CONFIG.dimensions,
        tokens_used: embedding.tokens_used,
        cost: calculateCost(embedding.tokens_used, embedding.model),
        processing_time_ms: Date.now() - startTime
      };
      
    } catch (primaryError) {
      console.warn(`Primary model ${model} failed:`, primaryError.message);
      
      // Try fallback model if rate limited
      if (isRateLimitError(primaryError) && model === VOYAGE_CONFIG.primaryModel) {
        console.log('Attempting fallback to voyage-3.5...');
        
        try {
          const fallbackEmbedding = await callVoyageAPI(embeddingText, VOYAGE_CONFIG.fallbackModel);
          
          return {
            success: true,
            fragrance_id: request.fragrance_id,
            embedding: fallbackEmbedding.embedding,
            model: fallbackEmbedding.model,
            dimensions: VOYAGE_CONFIG.dimensions,
            tokens_used: fallbackEmbedding.tokens_used,
            cost: calculateCost(fallbackEmbedding.tokens_used, fallbackEmbedding.model),
            processing_time_ms: Date.now() - startTime
          };
          
        } catch (fallbackError) {
          return handleEmbeddingError(request.fragrance_id, fallbackError, Date.now() - startTime);
        }
      }
      
      return handleEmbeddingError(request.fragrance_id, primaryError, Date.now() - startTime);
    }
    
  } catch (error) {
    return handleEmbeddingError(request.fragrance_id, error, Date.now() - startTime);
  }
}

// Prepare fragrance content for embedding generation
function prepareEmbeddingContent(content: EmbeddingRequest['content']): string {
  const parts = [];
  
  // Add brand and name
  parts.push(`${content.brand} ${content.name}`);
  
  // Add description if available
  if (content.description && content.description.trim()) {
    parts.push(content.description);
  }
  
  // Add accords/notes if available
  if (content.accords && content.accords.length > 0) {
    parts.push(`Notes: ${content.accords.join(', ')}`);
  }
  
  // Add fragrance family if available
  if (content.family && content.family.trim()) {
    parts.push(`Family: ${content.family}`);
  }
  
  return parts.join('. ');
}

// Call Voyage AI API
async function callVoyageAPI(text: string, model: string) {
  const response = await fetch(`${VOYAGE_CONFIG.baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: [text],
      model: model,
      input_type: 'document'
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Voyage AI API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  
  if (!result.data || result.data.length === 0) {
    throw new Error('No embedding returned from Voyage AI');
  }

  return {
    embedding: result.data[0].embedding,
    model: model,
    tokens_used: result.usage.total_tokens
  };
}

// Store embedding in database
async function storeEmbeddingInDatabase(result: EmbeddingResponse): Promise<void> {
  if (!result.embedding || !result.fragrance_id) {
    throw new Error('Invalid embedding result for database storage');
  }

  // Ensure embedding has exactly 2000 dimensions for pgvector compatibility
  let finalEmbedding = result.embedding;
  if (finalEmbedding.length > 2000) {
    finalEmbedding = finalEmbedding.slice(0, 2000);
  } else if (finalEmbedding.length < 2000) {
    // Pad with zeros if too short
    finalEmbedding = [...finalEmbedding, ...Array(2000 - finalEmbedding.length).fill(0)];
  }

  const { error } = await supabase
    .from('fragrances')
    .update({
      embedding: `[${finalEmbedding.join(',')}]`,
      embedding_model: result.model,
      embedding_generated_at: new Date().toISOString(),
      embedding_version: 1
    })
    .eq('id', result.fragrance_id);

  if (error) {
    throw new Error(`Failed to store embedding in database: ${error.message}`);
  }

  console.log(`✅ Stored embedding for fragrance ${result.fragrance_id} using ${result.model}`);
}

// Calculate cost based on model and tokens
function calculateCost(tokens: number, model: string): number {
  const rates: Record<string, number> = {
    'voyage-3-large': 0.18 / 1000000,  // $0.18 per million tokens
    'voyage-3.5': 0.06 / 1000000       // $0.06 per million tokens
  };
  
  return tokens * (rates[model] || rates['voyage-3-large']);
}

// Check if error is due to rate limiting
function isRateLimitError(error: any): boolean {
  return error.message?.includes('429') || 
         error.message?.includes('rate limit') ||
         error.message?.includes('Rate limit');
}

// Handle embedding generation errors
function handleEmbeddingError(fragranceId: string, error: any, processingTime: number): EmbeddingResponse {
  const isRetryable = isRateLimitError(error) || 
                     error.message?.includes('timeout') ||
                     error.message?.includes('network');

  return {
    success: false,
    fragrance_id: fragranceId,
    error: error.message,
    retry_recommended: isRetryable,
    processing_time_ms: processingTime
  };
}