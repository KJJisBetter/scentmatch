/**
 * Voyage AI client for generating embeddings
 * 
 * UPDATED: Now uses the new multi-provider AI infrastructure with fallback support
 * while maintaining backward compatibility with existing code.
 */

import { getAIService, generateQueryEmbedding as newGenerateQueryEmbedding, generateBatchFragranceEmbeddings, isAIFeatureEnabled } from './index';

// Maintain backward compatibility interface
export interface VoyageEmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    total_tokens: number;
  };
}

/**
 * Generate query embedding using the new AI infrastructure
 * Maintains backward compatibility while using multi-provider system
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    // Use new AI infrastructure with fallback support
    const result = await newGenerateQueryEmbedding(query);
    return result.embedding;
    
  } catch (error) {
    // Fallback to direct Voyage API if new system fails (backward compatibility)
    if (isAIFeatureEnabled('debug_logging')) {
      console.warn('New AI system failed, attempting direct Voyage fallback:', error);
    }
    
    return await directVoyageCall(query, 'query');
  }
}

/**
 * Generate batch embeddings using the new AI infrastructure
 * Maintains backward compatibility while using multi-provider system
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    // Use new AI infrastructure with fallback support
    const results = await generateBatchFragranceEmbeddings(texts);
    return results.map(result => result.embedding);
    
  } catch (error) {
    // Fallback to direct Voyage API if new system fails
    if (isAIFeatureEnabled('debug_logging')) {
      console.warn('New AI system batch failed, attempting direct Voyage fallback:', error);
    }
    
    return await directVoyageBatchCall(texts);
  }
}

// Direct Voyage API calls for fallback compatibility
async function directVoyageCall(text: string, inputType: 'query' | 'document'): Promise<number[]> {
  const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
  const VOYAGE_BASE_URL = 'https://api.voyageai.com/v1';
  
  if (!VOYAGE_API_KEY) {
    throw new Error('VOYAGE_API_KEY environment variable is required');
  }

  const response = await fetch(`${VOYAGE_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: [text],
      model: 'voyage-3.5', // Use fallback model for compatibility
      input_type: inputType,
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

  return result.data[0].embedding;
}

async function directVoyageBatchCall(texts: string[]): Promise<number[][]> {
  const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
  const VOYAGE_BASE_URL = 'https://api.voyageai.com/v1';
  
  if (!VOYAGE_API_KEY) {
    throw new Error('VOYAGE_API_KEY environment variable is required');
  }

  const response = await fetch(`${VOYAGE_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: texts,
      model: 'voyage-3.5',
      input_type: 'document',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Voyage AI API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data.map(item => item.embedding);
}

/**
 * Generate text using Voyage AI (for fragrance descriptions)
 * Note: Using OpenAI for text generation since Voyage specializes in embeddings
 */
export async function generateText(prompt: string): Promise<string> {
  try {
    // For MVP, use OpenAI for text generation since Voyage specializes in embeddings
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY required for text generation');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert fragrance consultant who writes engaging, personality-focused descriptions that help people understand if a fragrance matches their style. Focus on character, mood, and lifestyle rather than technical details.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating text description:', error);
    throw error;
  }
}
