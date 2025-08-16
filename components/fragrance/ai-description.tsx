import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface AIDescriptionProps {
  fragranceId: string;
  fragrance: {
    name: string;
    brand: string;
    notes?: string[];
    scent_family?: string;
    description?: string;
    intensity_score?: number;
    longevity_hours?: number;
    mood_tags?: string[];
    recommended_occasions?: string[];
    recommended_seasons?: string[];
  };
  className?: string;
}

/**
 * AI-Generated Fragrance Description Component
 *
 * Displays personality-focused, AI-generated descriptions that help users
 * understand the fragrance's character and whether it matches their style.
 */
export async function AIDescription({ fragranceId, fragrance, className = "" }: AIDescriptionProps) {
  // For MVP, let's start with a smart template-based approach
  // that creates personality-focused descriptions using fragrance data
  const aiDescription = await generateSmartDescription(fragrance);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* AI-powered description */}
      <div className="prose prose-stone max-w-none">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-plum-600" />
          <span className="text-sm font-medium text-plum-600">AI Fragrance Analysis</span>
        </div>

        <div className="text-lg leading-relaxed space-y-4">
          {aiDescription.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-foreground">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Mood & Style Tags */}
      {fragrance.mood_tags && fragrance.mood_tags.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Personality & Mood</h4>
          <div className="flex flex-wrap gap-2">
            {fragrance.mood_tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Best Occasions */}
      {fragrance.recommended_occasions && fragrance.recommended_occasions.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Perfect For</h4>
          <div className="flex flex-wrap gap-2">
            {fragrance.recommended_occasions.slice(0, 4).map((occasion) => (
              <Badge key={occasion} variant="outline" className="text-xs">
                {occasion}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Smart template-based description generation for MVP
 * Later this will be replaced with full AI integration
 */
async function generateSmartDescription(fragrance: {
  name: string;
  brand: string;
  notes?: string[];
  scent_family?: string;
  description?: string;
  intensity_score?: number;
  longevity_hours?: number;
  mood_tags?: string[];
  recommended_occasions?: string[];
}): Promise<string> {
  // For MVP, create intelligent template-based descriptions
  // This provides immediate value while we prepare full AI integration

  const personality = getFragrancePersonality(fragrance);
  const strength = getStrengthDescription(fragrance);
  const occasion = getOccasionDescription(fragrance);
  const topNotes = fragrance.notes?.slice(0, 3).join(', ') || 'carefully selected notes';

  return `${fragrance.name} by ${fragrance.brand} is ${personality.character}. ${personality.appeal}

${strength} The composition opens with ${topNotes}, creating ${personality.mood}. ${occasion}

This fragrance speaks to ${personality.wearer} who appreciate ${personality.values}. ${personality.signature}`;
}

function getFragrancePersonality(fragrance: any) {
  const family = fragrance.scent_family?.toLowerCase() || '';
  const mood = fragrance.mood_tags?.[0]?.toLowerCase() || '';
  const intensity = fragrance.intensity_score || 5;

  // Create personality profiles based on fragrance characteristics
  if (family.includes('floral')) {
    return {
      character: intensity > 7 ? 'a bold and captivating floral statement' : 'an elegant and refined floral composition',
      appeal: 'It embodies grace and sophistication with a touch of romantic allure.',
      mood: 'an enchanting aura that's both approachable and memorable',
      wearer: 'those',
      values: 'timeless elegance and natural beauty',
      signature: 'Perfect for making a lasting impression without overwhelming the room.'
    }
    };
  }

  if (family.includes('woody') || family.includes('amber')) {
    return {
      character: 'a warm and sophisticated composition that exudes confidence',
      appeal: 'It projects strength and reliability while maintaining an air of mystery.',
      mood: 'a grounding presence that feels both comforting and powerful',
      wearer: 'individuals',
      values: 'authenticity and depth of character',
      signature: 'An ideal signature scent for those who prefer subtle luxury.'
    };
  }

  if (family.includes('fresh') || family.includes('citrus')) {
    return {
      character: 'a vibrant and energizing fragrance that captures the essence of vitality',
      appeal: 'It radiates optimism and contemporary spirit.',
      mood: 'an invigorating freshness that feels clean and modern',
      wearer: 'people',
      values: 'clarity, energy, and authentic living',
      signature: 'Perfect for daily wear and active lifestyles.'
    };
  }

  if (family.includes('oriental') || family.includes('spicy')) {
    return {
      character: 'an exotic and alluring fragrance that commands attention',
      appeal: 'It speaks to those who aren\'t afraid to stand out.',
      mood: 'a magnetic presence that's both mysterious and inviting',
      wearer: 'bold individuals',
      values: 'uniqueness and self-expression',
      signature: 'Made for special occasions and memorable moments.'
    };
  }

  // Default personality
  return {
    character: 'a distinctive and well-crafted fragrance',
    appeal: 'It offers a unique olfactory experience.',
    mood: 'a pleasant and balanced aura',
    wearer: 'fragrance lovers',
    values: 'quality and craftsmanship',
    signature: 'A versatile choice for various occasions.'
  };
}

function getStrengthDescription(fragrance: any) {
  const intensity = fragrance.intensity_score || 5;
  const longevity = fragrance.longevity_hours || 6;

  if (intensity > 8) {
    return 'This is a powerful fragrance with impressive projection.';
  } else if (intensity > 6) {
    return 'With moderate to strong sillage, this fragrance makes its presence known.';
  } else {
    return 'This fragrance offers intimate sillage perfect for close encounters.';
  }
}

function getOccasionDescription(fragrance: any) {
  const occasions = fragrance.recommended_occasions || [];

  if (occasions.includes('evening') || occasions.includes('date night')) {
    return 'It truly comes alive in the evening, creating an aura of sophistication and allure.';
  } else if (occasions.includes('office') || occasions.includes('work')) {
    return 'Professional yet personal, it\'s perfect for making a refined impression in any setting.';
  } else if (occasions.includes('casual') || occasions.includes('everyday')) {
    return 'Versatile enough for daily wear, it adds a touch of luxury to ordinary moments.';
  } else {
    return 'Its versatile character makes it suitable for a wide range of occasions.';
  }
}
