import { createServerSupabase } from '@/lib/supabase';
import { generateText } from '@/lib/ai/voyage-client';

interface FragranceData {
  id: string;
  name: string;
  brand: string;
  notes: string[];
  scent_family: string;
  description?: string;
  intensity_score?: number;
  longevity_hours?: number;
  mood_tags?: string[];
  recommended_occasions?: string[];
  recommended_seasons?: string[];
}

/**
 * Generate AI-powered personality-focused fragrance description
 */
export async function generateFragranceDescription(fragrance: FragranceData): Promise<string> {
  try {
    const prompt = createDescriptionPrompt(fragrance);
    const aiDescription = await generateText(prompt);
    
    // Ensure we have a reasonable response
    if (aiDescription && aiDescription.length > 20) {
      return aiDescription.trim();
    }
    
    // Fallback to original description
    return fragrance.description || `A ${fragrance.scent_family} fragrance by ${fragrance.brand}.`;
    
  } catch (error) {
    console.error('AI description generation failed:', error);
    // Always fall back gracefully
    return fragrance.description || `A ${fragrance.scent_family} fragrance by ${fragrance.brand}.`;
  }
}

/**
 * Get existing AI description from cache or generate new one
 */
export async function getOrCreateDescription(fragranceId: string, fragrance: FragranceData): Promise<string> {
  try {
    const supabase = await createServerSupabase();
    
    // Check for existing cached description
    const { data: cached } = await supabase
      .from('fragrance_ai_cache')
      .select('ai_description')
      .eq('fragrance_id', fragranceId)
      .single();
    
    if (cached?.ai_description) {
      return cached.ai_description;
    }
    
    // Generate new description
    const newDescription = await generateFragranceDescription(fragrance);
    
    // Cache the result for future use
    try {
      await supabase
        .from('fragrance_ai_cache')
        .upsert({
          fragrance_id: fragranceId,
          ai_description: newDescription,
          generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } catch (cacheError) {
      console.error('Failed to cache AI description:', cacheError);
      // Don't let caching failure affect the user experience
    }
    
    return newDescription;
    
  } catch (error) {
    console.error('Error in getOrCreateDescription:', error);
    // Always provide fallback
    return fragrance.description || `A ${fragrance.scent_family} fragrance by ${fragrance.brand}.`;
  }
}

/**
 * Create AI prompt for personality-focused fragrance descriptions
 */
function createDescriptionPrompt(fragrance: FragranceData): string {
  const notesText = fragrance.notes?.length > 0 
    ? `Key notes include ${fragrance.notes.slice(0, 5).join(', ')}.`
    : '';
  
  const moodText = fragrance.mood_tags?.length > 0
    ? `It's known for being ${fragrance.mood_tags.join(', ')}.`
    : '';
  
  const occasionText = fragrance.recommended_occasions?.length > 0
    ? `Perfect for ${fragrance.recommended_occasions.slice(0, 2).join(' and ')} occasions.`
    : '';
  
  const intensityText = fragrance.intensity_score 
    ? `This fragrance has an intensity level of ${fragrance.intensity_score}/10.`
    : '';
  
  const longevityText = fragrance.longevity_hours
    ? `It typically lasts around ${fragrance.longevity_hours} hours.`
    : '';

  return `Write a compelling, personality-focused description for ${fragrance.name} by ${fragrance.brand}, a ${fragrance.scent_family} fragrance.

${notesText} ${moodText} ${occasionText} ${intensityText} ${longevityText}

Focus on:
- The personality and character this fragrance projects
- Who would love wearing this (lifestyle, style, mindset)
- The mood and feeling it creates
- When and where it shines best
- Why someone would choose this over other fragrances

Write 2-3 paragraphs that help someone understand if this fragrance matches their personality and style. Be engaging and avoid overly technical language. Focus on the emotional and lifestyle aspects rather than just listing notes.

Keep the tone sophisticated but accessible, like a knowledgeable friend giving personalized advice.`;
}

/**
 * Validate and clean AI-generated descriptions
 */
export function validateDescription(description: string, fragrance: FragranceData): string {
  if (!description || description.length < 20) {
    return fragrance.description || `A ${fragrance.scent_family} fragrance by ${fragrance.brand}.`;
  }
  
  // Basic content validation
  const cleaned = description.trim();
  
  // Ensure it mentions the fragrance name and brand
  if (!cleaned.toLowerCase().includes(fragrance.name.toLowerCase()) && 
      !cleaned.toLowerCase().includes(fragrance.brand.toLowerCase())) {
    // Add context if missing
    return `${fragrance.name} by ${fragrance.brand} is ${cleaned.charAt(0).toLowerCase() + cleaned.slice(1)}`;
  }
  
  return cleaned;
}