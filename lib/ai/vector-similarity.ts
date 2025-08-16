/**
 * Vector Similarity Operations
 * 
 * Core vector similarity functions for fragrance recommendations
 * Implements cosine similarity and user embedding generation
 */

// Calculate cosine similarity between two vectors
export function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  if (vectorA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    const a = vectorA[i] ?? 0;
    const b = vectorB[i] ?? 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generate user embedding from collection data
export async function generateUserEmbedding(
  userId: string, 
  userCollection: any[]
): Promise<number[]> {
  if (userCollection.length === 0) {
    // Return neutral embedding for empty collections
    return new Array(1536).fill(0);
  }

  // Weight fragrances by rating and usage frequency
  const weightedEmbeddings: Array<{ embedding: number[], weight: number }> = [];
  
  for (const item of userCollection) {
    // Calculate weight based on rating and usage
    let weight = 1.0;
    
    if (item.rating) {
      weight *= item.rating / 5; // Normalize rating to 0-1
    }
    
    if (item.usage_frequency) {
      const usageWeights = {
        'daily': 1.0,
        'weekly': 0.8,
        'occasional': 0.5,
        'special': 0.3
      };
      weight *= usageWeights[item.usage_frequency as keyof typeof usageWeights] ?? 0.5;
    }

    // In a real implementation, we'd fetch the actual embedding from the database
    // For now, simulate with a mock embedding based on fragrance_id
    const mockEmbedding = generateMockEmbedding(item.fragrance_id);
    
    weightedEmbeddings.push({
      embedding: mockEmbedding,
      weight: weight
    });
  }

  // Calculate weighted average embedding
  const dimensions = 1536;
  const userEmbedding = new Array(dimensions).fill(0);
  let totalWeight = 0;

  for (const { embedding, weight } of weightedEmbeddings) {
    for (let i = 0; i < dimensions; i++) {
      userEmbedding[i] += (embedding[i] ?? 0) * weight;
    }
    totalWeight += weight;
  }

  // Normalize by total weight
  if (totalWeight > 0) {
    for (let i = 0; i < dimensions; i++) {
      userEmbedding[i] /= totalWeight;
    }
  }

  return userEmbedding;
}

// Calculate user preferences from collection and interactions
export async function calculateUserPreferences(
  userId: string,
  collectionData: any[],
  interactionData: any[]
): Promise<any> {
  const preferences = {
    favorite_families: [] as string[],
    preferred_intensity: 5,
    brand_affinity: {} as Record<string, number>,
    seasonal_preferences: {} as Record<string, number>,
    occasion_preferences: {} as Record<string, number>,
    confidence_score: 0.5
  };

  if (collectionData.length === 0) {
    return preferences;
  }

  // Analyze scent family preferences
  const familyCounts: Record<string, number> = {};
  const familyRatings: Record<string, number[]> = {};

  for (const item of collectionData) {
    const family = item.fragrances?.scent_family;
    if (family) {
      familyCounts[family] = (familyCounts[family] || 0) + 1;
      
      if (item.rating) {
        if (!familyRatings[family]) {
          familyRatings[family] = [];
        }
        familyRatings[family].push(item.rating);
      }
    }
  }

  // Calculate favorite families based on count and average rating
  const familyScores = Object.entries(familyCounts).map(([family, count]) => {
    const ratings = familyRatings[family] || [];
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 3;
    
    return {
      family,
      score: (count / collectionData.length) * 0.7 + (avgRating / 5) * 0.3
    };
  });

  preferences.favorite_families = familyScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.family);

  // Calculate confidence based on data quantity and consistency
  const dataPoints = collectionData.length + interactionData.length;
  const maxConfidence = Math.min(dataPoints / 20, 1.0); // Max confidence at 20+ data points
  
  const ratingVariance = calculateRatingVariance(collectionData);
  const consistencyFactor = Math.max(0.3, 1 - ratingVariance); // Lower variance = higher consistency
  
  preferences.confidence_score = maxConfidence * consistencyFactor;

  return preferences;
}

// Helper function to generate mock embedding (for testing)
function generateMockEmbedding(fragranceId: string): number[] {
  // Generate consistent mock embedding based on fragrance ID
  const seed = fragranceId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const random = seededRandom(seed);
  
  return Array.from({ length: 1536 }, () => (random() - 0.5) * 2);
}

// Helper function for seeded random generation
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// Helper function to calculate rating variance
function calculateRatingVariance(collectionData: any[]): number {
  const ratings = collectionData
    .map(item => item.rating)
    .filter(rating => rating !== null && rating !== undefined);

  if (ratings.length === 0) return 1; // High variance if no ratings

  const mean = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  const variance = ratings.reduce((sum, rating) => sum + Math.pow(rating - mean, 2), 0) / ratings.length;
  
  return Math.sqrt(variance) / 5; // Normalize by max rating (5)
}