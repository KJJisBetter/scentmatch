import OpenAI from 'openai';

export type ExperienceLevel = 'beginner' | 'enthusiast' | 'collector';

interface PersonalityAnalysis {
  personality_type: string;
  experience_level: ExperienceLevel;
  dimensions: Record<string, number>;
  confidence_score: number;
  occasion_preferences?: string[];
  seasonal_preferences?: string[];
  brand_preferences?: string[];
  lifestyle_factors?: any;
}

interface ProfileData {
  profile_name: string;
  personality_analysis: PersonalityAnalysis;
  selected_favorites: Array<{ id: string; name: string; brand: string }>;
}

interface GeneratedProfile {
  profile_name: string;
  style_descriptor: string;
  description: string;
  uniqueness_score: number;
  experience_context: ExperienceLevel;
  generation_method: 'ai' | 'hybrid' | 'template_fallback';
  ai_token_usage?: number;
  personality_insights?: string[];
  seasonal_preferences?: string[];
}

/**
 * AI Profile Generation System
 *
 * Generates unique, personalized fragrance profile names and descriptions
 * using a hybrid approach of AI generation and template fallbacks for
 * performance and cost optimization.
 */
export class AIProfileGenerator {
  private openai: OpenAI | null = null;
  private readonly UNIQUENESS_THRESHOLD = 0.6;
  private readonly MAX_GENERATION_ATTEMPTS = 3;

  constructor() {
    // Initialize OpenAI client if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Generate unique profile name following adjective + noun + place pattern
   */
  generateUniqueProfileName(personalityData: any): string {
    const { experience_level, dimensions, personality_type } = personalityData;

    // Experience-level appropriate adjectives
    const adjectives = {
      beginner: [
        'Discovering',
        'Gentle',
        'Fresh',
        'Sweet',
        'Bright',
        'Charming',
        'Delightful',
        'Pure',
      ],
      enthusiast: [
        'Refined',
        'Elegant',
        'Sophisticated',
        'Harmonious',
        'Curated',
        'Balanced',
        'Graceful',
        'Polished',
      ],
      collector: [
        'Discerning',
        'Connoisseur',
        'Avant-garde',
        'Masterful',
        'Visionary',
        'Distinguished',
        'Exquisite',
        'Sublime',
      ],
    };

    // Dimension-based nouns
    const nouns = {
      fresh: [
        'Breeze',
        'Dawn',
        'Mist',
        'Spring',
        'Dewdrop',
        'Zephyr',
        'Aurora',
        'Ozone',
      ],
      floral: [
        'Bloom',
        'Bouquet',
        'Petal',
        'Rose',
        'Jasmine',
        'Iris',
        'Lily',
        'Orchid',
      ],
      oriental: [
        'Mystic',
        'Spice',
        'Incense',
        'Amber',
        'Saffron',
        'Oud',
        'Frankincense',
        'Cardamom',
      ],
      woody: [
        'Cedar',
        'Sandalwood',
        'Oak',
        'Grove',
        'Forest',
        'Timber',
        'Bark',
        'Root',
      ],
      fruity: [
        'Berry',
        'Citrus',
        'Nectar',
        'Essence',
        'Juice',
        'Zest',
        'Pulp',
        'Rind',
      ],
      gourmand: [
        'Confection',
        'Dessert',
        'Treat',
        'Delicacy',
        'Cream',
        'Honey',
        'Caramel',
        'Vanilla',
      ],
    };

    // Evocative places
    const places = [
      'Secret Gardens',
      'Midnight Forests',
      'Ancient Temples',
      'Hidden Valleys',
      'Moonlit Orchards',
      'Crystal Caves',
      'Starry Meadows',
      'Whispering Woods',
      'Golden Sanctuaries',
      'Velvet Libraries',
      'Silk Pavilions',
      'Emerald Groves',
      'Pearl Chambers',
      'Ruby Courtyards',
      'Sapphire Halls',
      'Diamond Galleries',
    ];

    // Find dominant dimension
    const dominantDimension = Object.entries(dimensions).reduce((a, b) =>
      dimensions[a[0]] > dimensions[b[0]] ? a : b
    )[0] as keyof typeof nouns;

    // Select words based on experience level and dimension
    const selectedAdjectives =
      adjectives[experience_level as keyof typeof adjectives] ||
      adjectives.enthusiast;
    const selectedNouns = nouns[dominantDimension] || nouns.fresh;

    const adjective =
      selectedAdjectives[Math.floor(Math.random() * selectedAdjectives.length)];
    const noun =
      selectedNouns[Math.floor(Math.random() * selectedNouns.length)];
    const place = places[Math.floor(Math.random() * places.length)];

    return `${adjective} ${noun} of ${place}`;
  }

  /**
   * Generate AI-powered description using OpenAI GPT-4o-mini with fast fallback
   */
  async generateAIDescription(profileData: ProfileData): Promise<string> {
    // Always use template for development to avoid timeout issues
    if (!this.openai || process.env.NODE_ENV === 'development') {
      return this.generateTemplateDescription(profileData);
    }

    try {
      const { profile_name, personality_analysis, selected_favorites } =
        profileData;
      const {
        experience_level,
        personality_type,
        dimensions,
        confidence_score,
      } = personality_analysis;

      // Create AI prompt based on experience level
      const prompt = this.createAIPrompt(
        profile_name,
        personality_analysis,
        selected_favorites
      );

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a master perfumer and fragrance psychologist who creates deeply personal fragrance personality profiles. Write in an inspiring, poetic style that makes each person feel uniquely understood.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 400,
        temperature: 0.8,
      });

      const aiDescription = completion.choices[0]?.message?.content;

      if (!aiDescription) {
        throw new Error('No AI response received');
      }

      // Validate and enhance the AI description
      return this.validateAndEnhanceDescription(aiDescription, profileData);
    } catch (error) {
      console.error('AI description generation failed:', error);
      return this.generateTemplateDescription(profileData);
    }
  }

  /**
   * Create AI prompt based on experience level and data
   */
  private createAIPrompt(
    profileName: string,
    personalityAnalysis: PersonalityAnalysis,
    selectedFavorites: Array<{ id: string; name: string; brand: string }>
  ): string {
    const { experience_level, personality_type, dimensions, confidence_score } =
      personalityAnalysis;

    let prompt = `Create a deeply personal fragrance personality profile for "${profileName}" who is a ${experience_level}-level fragrance user.\n\n`;

    prompt += `Personality Type: ${personality_type}\n`;
    prompt += `Confidence Score: ${Math.round(confidence_score * 100)}%\n\n`;

    prompt += `Fragrance Dimensions:\n`;
    Object.entries(dimensions).forEach(([dim, score]) => {
      if (score > 0.1) {
        prompt += `- ${dim}: ${Math.round(score * 100)}%\n`;
      }
    });

    if (selectedFavorites.length > 0) {
      prompt += `\nCurrent Favorites:\n`;
      selectedFavorites.forEach(fav => {
        prompt += `- ${fav.brand} ${fav.name}\n`;
      });
    }

    prompt += `\nWrite exactly 3 paragraphs that:\n`;
    prompt += `1. IDENTITY: Describe their fragrance identity and what makes them unique\n`;
    prompt += `2. LIFESTYLE: How fragrance integrates into their daily life and self-expression\n`;
    prompt += `3. DISCOVERY: Their journey and what kind of fragrances they should explore\n\n`;

    // Experience-level specific instructions
    if (experience_level === 'beginner') {
      prompt += `Use encouraging, accessible language. Focus on emotions and discovery. Avoid technical terms like "accord" or "sillage".`;
    } else if (experience_level === 'enthusiast') {
      prompt += `Use sophisticated but accessible language. Include some fragrance terminology. Balance education with inspiration.`;
    } else {
      prompt += `Use sophisticated perfumery language. Reference artistry, composition, and craftsmanship. Acknowledge their expertise.`;
    }

    return prompt;
  }

  /**
   * Validate and enhance AI-generated description
   */
  private validateAndEnhanceDescription(
    aiDescription: string,
    profileData: ProfileData
  ): string {
    // Basic validation
    if (!aiDescription || aiDescription.length < 100) {
      return this.generateTemplateDescription(profileData);
    }

    // Remove any inappropriate content
    const cleanDescription = aiDescription
      .replace(/\b(sex|drug|alcohol|inappropriate)\b/gi, '')
      .trim();

    // Ensure it has proper paragraph structure
    const paragraphs = cleanDescription
      .split('\n\n')
      .filter(p => p.trim().length > 0);

    if (paragraphs.length < 2) {
      // If AI didn't generate proper paragraphs, create structure
      const sentences = cleanDescription.split('. ');
      const thirdPoint = Math.floor(sentences.length / 3);
      const twoThirds = Math.floor((sentences.length * 2) / 3);

      const paragraph1 = sentences.slice(0, thirdPoint).join('. ') + '.';
      const paragraph2 =
        sentences.slice(thirdPoint, twoThirds).join('. ') + '.';
      const paragraph3 = sentences.slice(twoThirds).join('. ');

      return [paragraph1, paragraph2, paragraph3].join('\n\n');
    }

    return cleanDescription;
  }

  /**
   * Generate template-based description as fallback
   */
  private generateTemplateDescription(profileData: ProfileData): string {
    const { profile_name, personality_analysis, selected_favorites } =
      profileData;
    const { experience_level, personality_type, dimensions } =
      personality_analysis;

    // Find dominant dimension for template selection
    const dominantDim = Object.entries(dimensions).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];

    const templates = {
      beginner: {
        fresh: `You are the ${profile_name}, someone who loves the feeling of fresh, clean scents that make you feel confident and ready for anything. Your style is all about feeling good in your own skin and choosing fragrances that enhance your natural charm.\n\nFragrance is becoming an important part of how you express yourself. You gravitate toward scents that feel approachable and comforting, preferring compositions that speak to your heart rather than challenging your senses.\n\nAs you continue exploring, you'll discover fragrances that perfectly capture your fresh, optimistic spirit. Your growing collection will reflect your personal journey and evolving confidence.`,

        floral: `You are the ${profile_name}, drawn to the romantic beauty of floral fragrances that make you feel feminine and graceful. Your style celebrates the soft, pretty side of perfumery with scents that feel like a gentle embrace.\n\nFlowers in fragrance speak to your romantic soul, whether it's the innocent sweetness of roses or the delicate charm of jasmine. You appreciate scents that enhance your natural femininity and make you feel beautiful.\n\nYour fragrance journey is one of romantic discovery, finding scents that tell the story of your gentle strength and timeless elegance. Each fragrance you choose adds another layer to your beautiful personal narrative.`,

        woody: `You are the ${profile_name}, someone who finds comfort in the grounding, natural warmth of woody fragrances. Your style is authentic and down-to-earth, with a preference for scents that feel honest and real.\n\nWoody scents connect you to nature and give you a sense of stability and confidence. You appreciate fragrances that feel substantial and comforting, like a warm hug on a cool day.\n\nAs you explore the world of fragrance, you'll find yourself drawn to scents that reflect your genuine, unpretentious nature. Your collection will grow to include beautiful woody compositions that feel like home.`,
      },

      enthusiast: {
        fresh: `You are the ${profile_name}, a fragrance enthusiast with a refined appreciation for fresh, invigorating compositions. Your sophisticated palate seeks scents that balance complexity with the pure joy of clean, energizing notes.\n\nYour fragrance choices reflect your dynamic lifestyle and appreciation for quality craftsmanship. You understand the art of layering and seasonal rotation, choosing fresh fragrances that enhance your confidence and complement your personal style.\n\nYour journey continues toward discovering exceptional fresh fragrances that showcase both classic techniques and modern innovation. You seek compositions that surprise and delight while maintaining the clean elegance you love.`,

        floral: `You are the ${profile_name}, an enthusiast who has developed a sophisticated appreciation for floral compositions in all their forms. Your refined taste seeks the perfect balance between romantic femininity and modern elegance.\n\nYou understand the nuances between different floral families and appreciate both classic rose compositions and innovative floral blends. Your collection reflects thoughtful curation, balancing beloved signatures with adventurous floral discoveries.\n\nYour path leads toward discovering exceptional floral masterpieces that showcase the artistry of perfumery. You seek fragrances that tell compelling stories while celebrating the timeless beauty of flowers in fragrance.`,

        woody: `You are the ${profile_name}, a knowledgeable enthusiast with a deep appreciation for woody fragrances and their grounding, sophisticated character. Your refined palate seeks compositions that balance warmth with complexity.\n\nYou appreciate the craftsmanship behind exceptional woody fragrances, from the comfort of sandalwood to the richness of cedar and the earthiness of vetiver. Your choices reflect both sophistication and authenticity.\n\nYour journey continues toward discovering rare woody treasures that showcase both traditional techniques and contemporary innovation. You seek fragrances that ground you while inspiring your continued exploration of olfactory artistry.`,
      },

      collector: {
        fresh: `You are the ${profile_name}, a sophisticated collector whose expertise in fresh compositions spans from classic citrus masterpieces to avant-garde aquatic innovations. Your discerning palate appreciates the technical artistry behind seemingly simple fresh fragrances.\n\nYour collection represents a carefully curated library of fresh olfactory experiences, from vintage treasures to cutting-edge contemporary creations. You understand the complexity behind creating truly exceptional fresh compositions and seek out master perfumers who excel in this challenging category.\n\nAs a connoisseur, you seek fresh fragrances that push boundaries and redefine expectations. Your expertise allows you to appreciate both the subtle sophistication of minimalist compositions and the bold creativity of experimental fresh interpretations.`,

        floral: `You are the ${profile_name}, a master collector whose deep knowledge of floral perfumery encompasses rare vintage treasures, modern masterpieces, and emerging artisanal creations. Your sophisticated palate can discern the finest nuances in floral composition.\n\nYour collection tells the complete story of floral perfumery, from iconic classics to revolutionary interpretations. You appreciate the technical mastery required to create truly exceptional floral fragrances and seek out compositions that represent the highest levels of artistry.\n\nYour pursuit centers on discovering floral compositions that challenge conventions and showcase innovative techniques. You seek fragrances that represent the evolution of floral perfumery and the visionary work of master perfumers.`,

        woody: `You are the ${profile_name}, an expert collector whose profound understanding of woody compositions encompasses everything from precious sandalwood treasures to innovative synthetic wood molecules. Your expertise spans traditional and contemporary woody artistry.\n\nYour collection represents the finest examples of woody perfumery across cultures and eras. You appreciate both the meditative quality of pure woods and the complexity of modern woody compositions that blend natural materials with cutting-edge innovation.\n\nAs a connoisseur, you seek woody fragrances that represent the pinnacle of perfumery artistry. Your deep knowledge allows you to appreciate both time-honored techniques and revolutionary approaches to woody composition.`,
      },
    };

    const experienceTemplates = templates[experience_level];
    const dimensionTemplate =
      experienceTemplates[dominantDim as keyof typeof experienceTemplates] ||
      experienceTemplates.fresh;

    return dimensionTemplate;
  }

  /**
   * Calculate uniqueness score based on name complexity and characteristics
   */
  calculateUniquenessScore(profile: any): number {
    let score = 0;

    // Name complexity (more words = more unique)
    const wordCount = profile.profile_name.split(' ').length;
    score += Math.min(wordCount * 0.15, 0.4);

    // Style descriptor complexity
    const descriptorLength = profile.style_descriptor?.length || 0;
    score += Math.min(descriptorLength * 0.01, 0.2);

    // Experience level bonus
    const experienceBonus =
      {
        beginner: 0.1,
        enthusiast: 0.2,
        collector: 0.3,
      }[
        profile.experience_level as keyof {
          beginner: number;
          enthusiast: number;
          collector: number;
        }
      ] || 0.1;
    score += experienceBonus;

    // Uncommon words bonus
    const uncommonWords = [
      'velvet',
      'midnight',
      'ancient',
      'whisper',
      'crystal',
      'emerald',
      'sapphire',
    ];
    const hasUncommonWords = uncommonWords.some(word =>
      profile.profile_name.toLowerCase().includes(word)
    );
    if (hasUncommonWords) score += 0.1;

    return Math.min(score, 1);
  }

  /**
   * Generate complete unique profile with validation
   */
  async generateUniqueProfile(
    personalityData: any,
    existingNames: string[] = []
  ): Promise<GeneratedProfile> {
    let attempts = 0;
    let profile: GeneratedProfile;

    do {
      attempts++;

      // Generate profile name
      const profileName = this.generateUniqueProfileName(personalityData);

      // Check if name is unique
      if (
        existingNames.includes(profileName) &&
        attempts < this.MAX_GENERATION_ATTEMPTS
      ) {
        continue;
      }

      // Generate style descriptor
      const styleDescriptor = this.generateStyleDescriptor(personalityData);

      // Generate description
      const description = await this.generateAIDescription({
        profile_name: profileName,
        personality_analysis: personalityData,
        selected_favorites: personalityData.selected_favorites || [],
      });

      profile = {
        profile_name: profileName,
        style_descriptor: styleDescriptor,
        description,
        uniqueness_score: 0,
        experience_context: personalityData.experience_level,
        generation_method: this.openai ? 'hybrid' : 'template_fallback',
        personality_insights: this.extractPersonalityInsights(personalityData),
        seasonal_preferences: personalityData.seasonal_preferences || [],
      };

      // Calculate uniqueness score
      profile.uniqueness_score = this.calculateUniquenessScore(profile);

      // Check if uniqueness meets threshold
      if (
        profile.uniqueness_score >= this.UNIQUENESS_THRESHOLD ||
        attempts >= this.MAX_GENERATION_ATTEMPTS
      ) {
        break;
      }
    } while (attempts < this.MAX_GENERATION_ATTEMPTS);

    return profile!;
  }

  /**
   * Generate style descriptor appropriate for experience level
   */
  private generateStyleDescriptor(personalityData: any): string {
    const { experience_level, dimensions, personality_type } = personalityData;

    const descriptors = {
      beginner: [
        'approachable',
        'fresh',
        'delightful',
        'charming',
        'sweet',
        'gentle',
        'lovely',
      ],
      enthusiast: [
        'sophisticated',
        'balanced',
        'refined',
        'harmonious',
        'elegant',
        'curated',
        'graceful',
      ],
      collector: [
        'complex',
        'avant-garde',
        'masterful',
        'distinguished',
        'exquisite',
        'visionary',
        'sublime',
      ],
    };

    // Find dominant dimension for additional descriptors
    const dominantDim = Object.entries(dimensions).reduce((a, b) =>
      dimensions[a[0]] > dimensions[b[0]] ? a : b
    )[0];

    const dimensionDescriptors = {
      fresh: ['crisp', 'invigorating', 'pure'],
      floral: ['romantic', 'feminine', 'blooming'],
      oriental: ['mysterious', 'exotic', 'warm'],
      woody: ['grounding', 'natural', 'authentic'],
      fruity: ['joyful', 'vibrant', 'playful'],
      gourmand: ['comforting', 'indulgent', 'cozy'],
    };

    const baseDescriptors =
      descriptors[experience_level as keyof typeof descriptors] ||
      descriptors.enthusiast;
    const dimDescriptors =
      dimensionDescriptors[dominantDim as keyof typeof dimensionDescriptors] ||
      [];

    const allDescriptors = [...baseDescriptors, ...dimDescriptors];
    return (
      allDescriptors[Math.floor(Math.random() * allDescriptors.length)] ||
      'sophisticated'
    );
  }

  /**
   * Extract personality insights from analysis
   */
  private extractPersonalityInsights(personalityData: any): string[] {
    const insights: string[] = [];
    const { dimensions, occasion_preferences, experience_level } =
      personalityData;

    // Dimension-based insights
    Object.entries(dimensions).forEach(([dim, score]) => {
      if ((score as number) > 0.6) {
        const dimensionInsights = {
          fresh: 'loves clean, energizing scents',
          floral: 'appreciates romantic, feminine fragrances',
          oriental: 'drawn to mysterious, exotic compositions',
          woody: 'prefers grounding, natural scents',
          fruity: 'enjoys vibrant, joyful fragrances',
          gourmand: 'attracted to comforting, sweet scents',
        };
        insights.push(dimensionInsights[dim as keyof typeof dimensionInsights]);
      }
    });

    // Occasion preferences
    if (occasion_preferences) {
      if (occasion_preferences.includes('romantic'))
        insights.push('values fragrance for romantic moments');
      if (occasion_preferences.includes('professional'))
        insights.push('appreciates appropriate scents for work');
      if (occasion_preferences.includes('evening'))
        insights.push('loves sophisticated evening fragrances');
    }

    // Experience level insight
    const experienceInsights = {
      beginner: 'just beginning their fragrance journey',
      enthusiast: 'developing sophisticated fragrance taste',
      collector: 'possesses deep fragrance expertise',
    };
    insights.push(
      experienceInsights[experience_level as keyof typeof experienceInsights] ||
        experienceInsights.enthusiast
    );

    return insights.slice(0, 4); // Limit to top 4 insights
  }

  /**
   * Generate profile from quiz results (main integration point)
   */
  async generateProfileFromQuizResults(
    quizResults: any
  ): Promise<GeneratedProfile> {
    const { experience_level, personality_analysis, selected_favorites } =
      quizResults;

    const profileData = {
      ...personality_analysis,
      experience_level,
      selected_favorites: selected_favorites || [],
    };

    return await this.generateUniqueProfile(profileData, []);
  }
}
