/**
 * Authentic Personality Profiles for Fragrance Discovery
 *
 * Based on UX research for engaging, human-centered personality descriptions
 * that use storytelling, sensory language, and aspirational imagery.
 */

export interface PersonalityProfile {
  id: string;
  name: string;
  archetype: string;
  description: string;
  scentProfile: {
    primary: string[];
    secondary: string[];
    avoid: string[];
  };
  lifestyle: {
    occasions: string[];
    energy: string;
    socialStyle: string;
  };
  keyTraits: string[];
  fragrancePersonality: string;
}

export const authenticPersonalityProfiles: PersonalityProfile[] = [
  {
    id: 'velvet_rebel',
    name: 'The Velvet Rebel',
    archetype: 'Bold yet sophisticated',
    description: `You don't just enter a room - you shift its energy. As **The Velvet Rebel**, your presence is both grounding and electric. Morning coffee becomes a ritual, evening walks turn into adventures, and conversations spiral into philosophy. Others are drawn to your authenticity, that rare combination of depth and spontaneity that makes every interaction memorable. You're equally at home in a vintage leather jacket or flowing silk, because true style isn't about rules - it's about knowing who you are.`,
    scentProfile: {
      primary: ['woody', 'oriental', 'spicy'],
      secondary: ['leather', 'amber', 'incense'],
      avoid: ['overly sweet', 'synthetic fresh'],
    },
    lifestyle: {
      occasions: [
        'evening dinners',
        'art galleries',
        'intimate gatherings',
        'creative projects',
      ],
      energy: 'magnetic and thoughtful',
      socialStyle: 'quality over quantity connections',
    },
    keyTraits: ['authentic', 'magnetic', 'sophisticated', 'independent'],
    fragrancePersonality:
      'You gravitate toward scents with complexity and story - fragrances that unfold throughout the day like chapters in a novel.',
  },
  {
    id: 'serene_voyager',
    name: 'The Serene Voyager',
    archetype: 'Adventurous but grounded',
    description: `Adventure calls to you, but it's the quiet moments that define you. As **The Serene Voyager**, you find magic in both mountain sunrises and afternoon tea. Your passport might be full of stamps, but your heart is always seeking that perfect balance between exploration and peace. Friends describe you as their anchor—someone who brings perspective and calm to any storm. You collect experiences like others collect things, and your presence makes every ordinary moment feel a little more special.`,
    scentProfile: {
      primary: ['fresh', 'green', 'citrus'],
      secondary: ['aquatic', 'herbal', 'mineral'],
      avoid: ['heavy orientals', 'overpowering florals'],
    },
    lifestyle: {
      occasions: [
        'morning rituals',
        'outdoor adventures',
        'casual meetups',
        'solo exploration',
      ],
      energy: 'calm and inspiring',
      socialStyle: 'naturally brings people together',
    },
    keyTraits: ['balanced', 'adventurous', 'peaceful', 'inspiring'],
    fragrancePersonality:
      'You prefer scents that feel like a breath of fresh air - clean, uplifting, and effortlessly elegant.',
  },
  {
    id: 'golden_romantic',
    name: 'The Golden Romantic',
    archetype: 'Warm and passionate',
    description: `Love, in all its forms, is your language. As **The Golden Romantic**, you see poetry in sunrise coffees and magic in handwritten letters. Your warmth isn't just felt—it's transformative. You remember birthdays, notice when someone needs a hug, and have an uncanny ability to make any space feel like home. Whether you're planning surprise celebrations or simply listening with your whole heart, you make the world a little more beautiful just by being in it.`,
    scentProfile: {
      primary: ['floral', 'gourmand', 'warm'],
      secondary: ['vanilla', 'rose', 'honey'],
      avoid: ['cold aquatics', 'harsh woods'],
    },
    lifestyle: {
      occasions: [
        'romantic dinners',
        'celebrations',
        'cozy evenings',
        'meaningful conversations',
      ],
      energy: 'warm and nurturing',
      socialStyle: 'creates intimate connections',
    },
    keyTraits: ['nurturing', 'passionate', 'intuitive', 'generous'],
    fragrancePersonality:
      'You are drawn to scents that feel like a warm embrace - comforting, beautiful, and utterly romantic.',
  },
  {
    id: 'midnight_philosopher',
    name: 'The Midnight Philosopher',
    archetype: 'Deep and mysterious',
    description: `Your mind is a galaxy of questions and connections others miss. As **The Midnight Philosopher**, you find profound beauty in complexity—whether it's a forgotten book, a late-night conversation, or the way moonlight transforms familiar spaces. You're the friend who remembers what someone said six months ago, who notices the stories people tell without words. Your presence invites depth, and those lucky enough to know you discover that the most interesting conversations happen after everyone else has gone to sleep.`,
    scentProfile: {
      primary: ['woody', 'mysterious', 'complex'],
      secondary: ['oud', 'sandalwood', 'dark florals'],
      avoid: ['bright citrus', 'simple compositions'],
    },
    lifestyle: {
      occasions: [
        'evening contemplation',
        'intellectual discussions',
        'cultural events',
        'quiet moments',
      ],
      energy: 'mysterious and thoughtful',
      socialStyle: 'deep, meaningful connections',
    },
    keyTraits: ['thoughtful', 'mysterious', 'intellectual', 'perceptive'],
    fragrancePersonality:
      'You seek fragrances with layers of meaning - scents that reveal new facets each time you wear them.',
  },
  {
    id: 'wild_sophisticate',
    name: 'The Wild Sophisticate',
    archetype: 'Untamed elegance',
    description: `Champagne and hiking boots, boardroom presentations and midnight dancing - you refuse to be just one thing. As **The Wild Sophisticate**, you've mastered the art of being effortlessly elegant while staying authentically free. Your calendar might include gallery openings and camping trips in the same week. Others are fascinated by your ability to find adventure in the everyday and bring grace to the unexpected. You prove that sophistication isn't about conforming - it's about confidently being yourself in every setting.`,
    scentProfile: {
      primary: ['sophisticated', 'unique', 'dynamic'],
      secondary: [
        'green florals',
        'sophisticated woods',
        'unexpected combinations',
      ],
      avoid: ['predictable compositions', 'overly traditional'],
    },
    lifestyle: {
      occasions: [
        'versatile moments',
        'professional settings',
        'spontaneous adventures',
        'elegant events',
      ],
      energy: 'dynamic and confident',
      socialStyle: 'adapts beautifully to any setting',
    },
    keyTraits: ['versatile', 'confident', 'sophisticated', 'free-spirited'],
    fragrancePersonality:
      'You choose scents that are as multifaceted as you are - sophisticated enough for any occasion, unique enough to be memorable.',
  },
  {
    id: 'gentle_maverick',
    name: 'The Gentle Maverick',
    archetype: 'Quiet strength',
    description: `Your power whispers rather than shouts. As **The Gentle Maverick**, you change the world through kindness and quiet innovation. You're the one who finds creative solutions everyone else missed, who stands up for what's right without making it about yourself. Your strength lies in your authenticity - you never pretend to be something you're not, and that genuine nature draws people like flowers toward sunlight. You prove that revolution can be gentle, and that the most lasting changes come from a place of love.`,
    scentProfile: {
      primary: ['soft', 'natural', 'authentic'],
      secondary: ['clean musks', 'gentle florals', 'soft woods'],
      avoid: ['overpowering scents', 'artificial compositions'],
    },
    lifestyle: {
      occasions: [
        'daily authenticity',
        'gentle moments',
        'creative pursuits',
        'meaningful work',
      ],
      energy: 'calm and genuine',
      socialStyle: 'naturally magnetic through authenticity',
    },
    keyTraits: ['authentic', 'gentle', 'innovative', 'strong'],
    fragrancePersonality:
      'You prefer scents that feel like your most authentic self - beautiful, genuine, and quietly powerful.',
  },
  {
    id: 'cosmic_dreamer',
    name: 'The Cosmic Dreamer',
    archetype: 'Imaginative and boundless',
    description: `Your imagination knows no boundaries, and your heart carries the light of distant stars. As **The Cosmic Dreamer**, you see magic where others see ordinary - in rain puddles reflecting neon signs, in the way certain songs transport you across galaxies, in conversations that bend time and space. You're the friend who remembers dreams, who finds meaning in synchronicities, who makes everyone feel like anything is possible. Your presence reminds others that wonder isn't just for children - it's for anyone brave enough to keep dreaming.`,
    scentProfile: {
      primary: ['ethereal', 'imaginative', 'otherworldly'],
      secondary: ['white florals', 'aldehydes', 'unique combinations'],
      avoid: ['heavy earthiness', 'conventional scents'],
    },
    lifestyle: {
      occasions: [
        'creative inspiration',
        'magical moments',
        'artistic pursuits',
        'dream exploration',
      ],
      energy: 'ethereal and inspiring',
      socialStyle: 'brings wonder to every interaction',
    },
    keyTraits: ['imaginative', 'ethereal', 'inspiring', 'magical'],
    fragrancePersonality:
      'You are drawn to scents that feel otherworldly - fragrances that transport you and make everyday moments feel enchanted.',
  },
  {
    id: 'grounded_alchemist',
    name: 'The Grounded Alchemist',
    archetype: 'Earthy wisdom',
    description: `You have an ancient soul and healing hands. As **The Grounded Alchemist**, you understand that the most powerful magic happens in the everyday - in homemade bread, herb gardens, and conversations that heal hearts. Others come to you when they need grounding, when they've lost their way, when they need someone who remembers that true wisdom grows from the earth up. You're equally comfortable discussing moon phases and quarterly reports, because you know that everything is connected if you look closely enough.`,
    scentProfile: {
      primary: ['earthy', 'herbal', 'natural'],
      secondary: ['sage', 'patchouli', 'natural musks'],
      avoid: ['synthetic compositions', 'overly commercial scents'],
    },
    lifestyle: {
      occasions: [
        'nature connection',
        'healing moments',
        'mindful living',
        'seasonal celebrations',
      ],
      energy: 'grounding and wise',
      socialStyle: 'natural healer and advisor',
    },
    keyTraits: ['wise', 'grounding', 'natural', 'healing'],
    fragrancePersonality:
      'You choose scents that connect you to the earth - natural, grounding fragrances that feel like ancient wisdom.',
  },
];

/**
 * Analyzes quiz responses to match with authentic personality profiles
 */
export function matchPersonalityProfile(responses: any[]): PersonalityProfile {
  // Enhanced matching algorithm based on emotional triggers and response patterns
  const scores = authenticPersonalityProfiles.map(profile => ({
    profile,
    score: calculatePersonalityScore(responses, profile),
  }));

  // Sort by score and return the best match
  scores.sort((a, b) => b.score - a.score);
  return scores[0].profile;
}

function calculatePersonalityScore(
  responses: any[],
  profile: PersonalityProfile
): number {
  let score = 0;

  responses.forEach(response => {
    const questionId = response.question_id;
    const answers = Array.isArray(response.answer_value)
      ? response.answer_value
      : response.answer_value.split(',');

    // Profile-specific scoring logic based on question patterns
    switch (questionId) {
      case 'weekend_ritual':
        score += scoreWeekendRitual(answers, profile);
        break;
      case 'texture_affinity':
        score += scoreTextureAffinity(answers, profile);
        break;
      case 'color_emotion':
        score += scoreColorEmotion(answers, profile);
        break;
      case 'memory_scent':
        score += scoreMemoryScent(answers, profile);
        break;
      case 'social_energy':
        score += scoreSocialEnergy(answers, profile);
        break;
      case 'dream_escape':
        score += scoreDreamEscape(answers, profile);
        break;
    }
  });

  return score;
}

// Individual scoring functions for each question type
function scoreWeekendRitual(
  answers: string[],
  profile: PersonalityProfile
): number {
  const scores: { [key: string]: { [key: string]: number } } = {
    coffee_journal: {
      midnight_philosopher: 3,
      gentle_maverick: 2,
      serene_voyager: 1,
    },
    farmers_market: {
      golden_romantic: 3,
      grounded_alchemist: 2,
      serene_voyager: 1,
    },
    trail_adventure: {
      serene_voyager: 3,
      grounded_alchemist: 2,
      wild_sophisticate: 1,
    },
    city_exploration: {
      wild_sophisticate: 3,
      velvet_rebel: 2,
      cosmic_dreamer: 1,
    },
    creative_flow: {
      cosmic_dreamer: 3,
      velvet_rebel: 2,
      midnight_philosopher: 1,
    },
  };

  return answers.reduce((total, answer) => {
    return total + (scores[answer]?.[profile.id] || 0);
  }, 0);
}

function scoreTextureAffinity(
  answers: string[],
  profile: PersonalityProfile
): number {
  const scores: { [key: string]: { [key: string]: number } } = {
    velvet_crush: { velvet_rebel: 3, midnight_philosopher: 2 },
    ocean_glass: { serene_voyager: 3, gentle_maverick: 1 },
    warm_wood: { grounded_alchemist: 3, golden_romantic: 2 },
    silk_whisper: { wild_sophisticate: 3, cosmic_dreamer: 1 },
    leather_story: { velvet_rebel: 2, wild_sophisticate: 1 },
  };

  return answers.reduce((total, answer) => {
    return total + (scores[answer]?.[profile.id] || 0);
  }, 0);
}

function scoreColorEmotion(
  answers: string[],
  profile: PersonalityProfile
): number {
  const scores: { [key: string]: { [key: string]: number } } = {
    champagne_gold: { golden_romantic: 3, wild_sophisticate: 2 },
    deep_forest: { grounded_alchemist: 3, serene_voyager: 2 },
    blush_sunset: { golden_romantic: 2, gentle_maverick: 1 },
    midnight_velvet: { midnight_philosopher: 3, velvet_rebel: 2 },
    pearl_mist: { cosmic_dreamer: 3, gentle_maverick: 2 },
    amber_fire: { velvet_rebel: 2, golden_romantic: 1 },
  };

  return answers.reduce((total, answer) => {
    return total + (scores[answer]?.[profile.id] || 0);
  }, 0);
}

function scoreMemoryScent(
  answers: string[],
  profile: PersonalityProfile
): number {
  const scores: { [key: string]: { [key: string]: number } } = {
    grandmother_kitchen: { golden_romantic: 3, grounded_alchemist: 2 },
    first_garden: { grounded_alchemist: 3, serene_voyager: 2 },
    library_secrets: { midnight_philosopher: 3, cosmic_dreamer: 1 },
    ocean_freedom: { serene_voyager: 3, wild_sophisticate: 1 },
    evening_jasmine: { golden_romantic: 2, cosmic_dreamer: 2 },
    winter_cabin: { grounded_alchemist: 2, gentle_maverick: 2 },
  };

  return answers.reduce((total, answer) => {
    return total + (scores[answer]?.[profile.id] || 0);
  }, 0);
}

function scoreSocialEnergy(
  answers: string[],
  profile: PersonalityProfile
): number {
  const scores: { [key: string]: { [key: string]: number } } = {
    warm_embrace: { golden_romantic: 3, gentle_maverick: 2 },
    magnetic_mystery: { velvet_rebel: 3, midnight_philosopher: 2 },
    confident_grace: { wild_sophisticate: 3, velvet_rebel: 1 },
    playful_joy: { cosmic_dreamer: 3, golden_romantic: 1 },
    authentic_depth: { gentle_maverick: 3, grounded_alchemist: 2 },
  };

  return answers.reduce((total, answer) => {
    return total + (scores[answer]?.[profile.id] || 0);
  }, 0);
}

function scoreDreamEscape(
  answers: string[],
  profile: PersonalityProfile
): number {
  const scores: { [key: string]: { [key: string]: number } } = {
    parisian_atelier: { velvet_rebel: 3, cosmic_dreamer: 2 },
    secret_garden: { grounded_alchemist: 3, golden_romantic: 2 },
    mountain_monastery: { midnight_philosopher: 3, grounded_alchemist: 1 },
    venetian_masquerade: { wild_sophisticate: 3, velvet_rebel: 1 },
    forest_cottage: { gentle_maverick: 3, grounded_alchemist: 2 },
    starship_library: { cosmic_dreamer: 3, midnight_philosopher: 2 },
  };

  return answers.reduce((total, answer) => {
    return total + (scores[answer]?.[profile.id] || 0);
  }, 0);
}

/**
 * Get fragrance recommendations based on personality profile
 */
export function getPersonalityFragranceRecommendations(
  profile: PersonalityProfile
) {
  // This would integrate with your existing fragrance recommendation system
  // For now, return the scent profile preferences
  return {
    primary_families: profile.scentProfile.primary,
    secondary_families: profile.scentProfile.secondary,
    avoid_families: profile.scentProfile.avoid,
    personality_context: profile.fragrancePersonality,
  };
}
