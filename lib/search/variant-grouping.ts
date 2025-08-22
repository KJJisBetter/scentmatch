/**
 * Fragrance Variant Grouping System - SCE-68
 * 
 * Solves choice paralysis by intelligently grouping fragrance variants
 * and identifying primary variants for better user experience.
 */

// Import will be handled by the API route that uses this module

export interface FragranceVariant {
  id: string;
  name: string;
  brand: string;
  brand_id: string;
  description?: string;
  notes?: string[];
  intensity_score?: number;
  longevity_hours?: number;
  sample_available?: boolean;
  sample_price_usd?: number;
  popularity_score?: number;
  fragrance_family?: string;
  recommended_occasions?: string[];
  recommended_seasons?: string[];
  image_url?: string;
}

export interface VariantGroup {
  primary_variant: FragranceVariant;
  related_variants: FragranceVariant[];
  group_id: string;
  group_name: string;
  total_variants: number;
  popularity_score: number;
  badges: VariantBadge[];
  experience_recommendations: ExperienceRecommendation[];
}

export interface VariantBadge {
  type: 'most_popular' | 'strongest' | 'lightest' | 'best_value' | 'discontinued' | 'limited_edition';
  label: string;
  description: string;
}

export interface ExperienceRecommendation {
  level: 'beginner' | 'enthusiast' | 'collector';
  recommended_variant_id: string;
  reasoning: string;
  confidence: number;
}

/**
 * Smart variant detection algorithm
 */
export class VariantDetector {
  private static readonly SIMILARITY_THRESHOLD = 0.7;
  private static readonly NAME_SIMILARITY_WEIGHT = 0.4;
  private static readonly BRAND_WEIGHT = 0.3;
  private static readonly NOTES_WEIGHT = 0.2;
  private static readonly FAMILY_WEIGHT = 0.1;

  /**
   * Detect if two fragrances are variants of each other
   */
  static detectVariants(fragrance1: FragranceVariant, fragrance2: FragranceVariant): number {
    // Same brand is required
    if (fragrance1.brand_id !== fragrance2.brand_id) {
      return 0;
    }

    let similarity = 0;

    // Name similarity (most important)
    const nameSimilarity = this.calculateNameSimilarity(fragrance1.name, fragrance2.name);
    similarity += nameSimilarity * this.NAME_SIMILARITY_WEIGHT;

    // Brand match (automatic since checked above)
    similarity += 1.0 * this.BRAND_WEIGHT;

    // Notes overlap
    const notesOverlap = this.calculateNotesOverlap(fragrance1.notes || [], fragrance2.notes || []);
    similarity += notesOverlap * this.NOTES_WEIGHT;

    // Family match
    const familyMatch = fragrance1.fragrance_family === fragrance2.fragrance_family ? 1.0 : 0;
    similarity += familyMatch * this.FAMILY_WEIGHT;

    return Math.min(similarity, 1.0);
  }

  /**
   * Calculate name similarity for variant detection
   */
  private static calculateNameSimilarity(name1: string, name2: string): number {
    const clean1 = this.cleanFragranceName(name1);
    const clean2 = this.cleanFragranceName(name2);

    // Extract base name (remove concentration indicators)
    const base1 = this.extractBaseName(clean1);
    const base2 = this.extractBaseName(clean2);

    if (base1 === base2) {
      return 1.0;
    }

    // Check for common variant patterns
    const patterns = [
      /(.+?)\s+(edt|edp|parfum|cologne|elixir|intense|extreme|sport|noir|blanc|blue)/i,
      /(.+?)\s+(eau\s+de\s+toilette|eau\s+de\s+parfum|eau\s+de\s+cologne)/i,
      /(.+?)\s+(for\s+men|for\s+women|homme|femme)/i
    ];

    for (const pattern of patterns) {
      const match1 = clean1.match(pattern);
      const match2 = clean2.match(pattern);
      
      if (match1 && match2 && match1[1].toLowerCase() === match2[1].toLowerCase()) {
        return 0.9;
      }
    }

    // Levenshtein distance for similar names
    const distance = this.levenshteinDistance(base1, base2);
    const maxLength = Math.max(base1.length, base2.length);
    return Math.max(0, 1 - (distance / maxLength));
  }

  /**
   * Clean fragrance name for comparison
   */
  private static cleanFragranceName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract base name by removing concentration indicators
   */
  private static extractBaseName(cleanName: string): string {
    const concentrationPatterns = [
      /\s+(edt|edp|parfum|cologne|elixir|intense|extreme|sport|noir|blanc|blue)$/i,
      /\s+(eau\s+de\s+toilette|eau\s+de\s+parfum|eau\s+de\s+cologne)$/i,
      /\s+(for\s+men|for\s+women|homme|femme)$/i,
      /\s+\d{4}$/,  // Remove years
      /\s+(limited|edition|collector)$/i
    ];

    let baseName = cleanName;
    for (const pattern of concentrationPatterns) {
      baseName = baseName.replace(pattern, '');
    }

    return baseName.trim();
  }

  /**
   * Calculate notes overlap percentage
   */
  private static calculateNotesOverlap(notes1: string[], notes2: string[]): number {
    if (!notes1.length || !notes2.length) {
      return 0;
    }

    const set1 = new Set(notes1.map(n => n.toLowerCase()));
    const set2 = new Set(notes2.map(n => n.toLowerCase()));
    
    const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);
    
    return intersection.size / union.size;
  }

  /**
   * Levenshtein distance for string similarity
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator  // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}

/**
 * Primary variant identification system
 */
export class PrimaryVariantSelector {
  /**
   * Identify the primary variant from a group of related fragrances
   */
  static selectPrimary(variants: FragranceVariant[]): FragranceVariant {
    if (variants.length === 0) {
      throw new Error('Cannot select primary from empty variant list');
    }

    if (variants.length === 1) {
      return variants[0];
    }

    // Scoring system for primary variant selection
    const scores = variants.map(variant => ({
      variant,
      score: this.calculatePrimaryScore(variant, variants)
    }));

    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);

    return scores[0].variant;
  }

  /**
   * Calculate primary score for a variant
   */
  private static calculatePrimaryScore(variant: FragranceVariant, allVariants: FragranceVariant[]): number {
    let score = 0;

    // Popularity score (40% weight)
    if (variant.popularity_score) {
      score += (variant.popularity_score / 100) * 0.4;
    }

    // Availability score (30% weight)
    if (variant.sample_available) {
      score += 0.3;
    }

    // Concentration preference (20% weight) - EDP > EDT > Parfum > Cologne
    const concentrationScore = this.getConcentrationScore(variant.name);
    score += concentrationScore * 0.2;

    // Recency/mainstream appeal (10% weight)
    const mainstreamScore = this.getMainstreamScore(variant.name);
    score += mainstreamScore * 0.1;

    return score;
  }

  /**
   * Score based on concentration type preference
   */
  private static getConcentrationScore(name: string): number {
    const cleanName = name.toLowerCase();
    
    if (cleanName.includes('edp') || cleanName.includes('eau de parfum')) {
      return 1.0;  // Most popular concentration
    }
    if (cleanName.includes('edt') || cleanName.includes('eau de toilette')) {
      return 0.8;  // Second most popular
    }
    if (cleanName.includes('parfum') && !cleanName.includes('eau de parfum')) {
      return 0.6;  // Strong but niche
    }
    if (cleanName.includes('cologne') || cleanName.includes('eau de cologne')) {
      return 0.4;  // Less popular
    }
    if (cleanName.includes('elixir') || cleanName.includes('intense')) {
      return 0.5;  // Specialty concentrations
    }
    
    return 0.7;  // Default for unknown concentrations
  }

  /**
   * Score based on mainstream appeal indicators
   */
  private static getMainstreamScore(name: string): number {
    const cleanName = name.toLowerCase();
    
    // Higher score for mainstream indicators
    if (cleanName.match(/\b(original|classic|signature)\b/)) {
      return 1.0;
    }
    
    // Lower score for specialty variants
    if (cleanName.match(/\b(extreme|intense|elixir|royal|limited|exclusive|collector)\b/)) {
      return 0.3;
    }
    
    // Lower score for seasonal/sport variants
    if (cleanName.match(/\b(sport|summer|winter|noir|blue|white)\b/)) {
      return 0.5;
    }
    
    return 0.7;  // Default
  }
}

/**
 * Badge assignment system
 */
export class BadgeAssigner {
  /**
   * Assign badges to variants in a group
   */
  static assignBadges(variants: FragranceVariant[], primaryVariant: FragranceVariant): VariantBadge[] {
    const badges: VariantBadge[] = [];

    // Most Popular badge
    const mostPopular = variants.reduce((prev, current) => 
      (current.popularity_score || 0) > (prev.popularity_score || 0) ? current : prev
    );
    
    if (mostPopular.id === primaryVariant.id) {
      badges.push({
        type: 'most_popular',
        label: 'Most Popular',
        description: 'The version everyone talks about'
      });
    }

    // Strongest/Lightest badges based on intensity
    const intensities = variants.filter(v => v.intensity_score).map(v => v.intensity_score!);
    if (intensities.length > 1) {
      const maxIntensity = Math.max(...intensities);
      const minIntensity = Math.min(...intensities);
      
      if (primaryVariant.intensity_score === maxIntensity) {
        badges.push({
          type: 'strongest',
          label: 'Strongest',
          description: 'Long-lasting version for experienced users'
        });
      } else if (primaryVariant.intensity_score === minIntensity) {
        badges.push({
          type: 'lightest',
          label: 'Lighter',
          description: 'Fresher, everyday version'
        });
      }
    }

    // Best Value badge
    if (primaryVariant.sample_available && primaryVariant.sample_price_usd) {
      const samplePrices = variants
        .filter(v => v.sample_available && v.sample_price_usd)
        .map(v => v.sample_price_usd!);
      
      if (samplePrices.length > 1 && primaryVariant.sample_price_usd === Math.min(...samplePrices)) {
        badges.push({
          type: 'best_value',
          label: 'Best Value',
          description: 'Great quality at the best price'
        });
      }
    }

    return badges;
  }
}

/**
 * Experience-based recommendation system
 */
export class ExperienceRecommender {
  /**
   * Generate experience-based recommendations for a variant group
   */
  static generateRecommendations(variants: FragranceVariant[], primaryVariant: FragranceVariant): ExperienceRecommendation[] {
    const recommendations: ExperienceRecommendation[] = [];

    // Beginner recommendation
    const beginnerChoice = this.selectForBeginner(variants);
    recommendations.push({
      level: 'beginner',
      recommended_variant_id: beginnerChoice.id,
      reasoning: beginnerChoice.id === primaryVariant.id 
        ? 'Perfect starting point with the most balanced profile'
        : 'Lighter and more approachable than the signature version',
      confidence: 0.85
    });

    // Enthusiast recommendation  
    const enthusiastChoice = this.selectForEnthusiast(variants);
    recommendations.push({
      level: 'enthusiast',
      recommended_variant_id: enthusiastChoice.id,
      reasoning: enthusiastChoice.id === primaryVariant.id
        ? 'The definitive version that showcases the full character'
        : 'Enhanced version with deeper complexity',
      confidence: 0.9
    });

    // Collector recommendation
    const collectorChoice = this.selectForCollector(variants);
    recommendations.push({
      level: 'collector',
      recommended_variant_id: collectorChoice.id,
      reasoning: collectorChoice.id === primaryVariant.id
        ? 'Essential version that defines the fragrance family'
        : 'Rare or unique variant worth collecting',
      confidence: 0.8
    });

    return recommendations;
  }

  private static selectForBeginner(variants: FragranceVariant[]): FragranceVariant {
    // Prefer EDT, lower intensity, available samples
    return variants.reduce((best, current) => {
      let currentScore = 0;
      let bestScore = 0;

      // Sample availability
      if (current.sample_available) currentScore += 0.4;
      if (best.sample_available) bestScore += 0.4;

      // Concentration preference (EDT for beginners)
      if (current.name.toLowerCase().includes('edt')) currentScore += 0.3;
      if (best.name.toLowerCase().includes('edt')) bestScore += 0.3;

      // Lower intensity preferred
      const currentIntensity = current.intensity_score || 5;
      const bestIntensity = best.intensity_score || 5;
      currentScore += (10 - currentIntensity) / 10 * 0.3;
      bestScore += (10 - bestIntensity) / 10 * 0.3;

      return currentScore > bestScore ? current : best;
    });
  }

  private static selectForEnthusiast(variants: FragranceVariant[]): FragranceVariant {
    // Prefer EDP, balanced intensity, good longevity
    return variants.reduce((best, current) => {
      let currentScore = 0;
      let bestScore = 0;

      // Concentration preference (EDP for enthusiasts)
      if (current.name.toLowerCase().includes('edp')) currentScore += 0.4;
      if (best.name.toLowerCase().includes('edp')) bestScore += 0.4;

      // Balanced intensity (6-8 range)
      const currentIntensity = current.intensity_score || 5;
      const bestIntensity = best.intensity_score || 5;
      const currentIntensityScore = currentIntensity >= 6 && currentIntensity <= 8 ? 0.3 : 0.1;
      const bestIntensityScore = bestIntensity >= 6 && bestIntensity <= 8 ? 0.3 : 0.1;
      currentScore += currentIntensityScore;
      bestScore += bestIntensityScore;

      // Longevity preference
      const currentLongevity = current.longevity_hours || 4;
      const bestLongevity = best.longevity_hours || 4;
      currentScore += Math.min(currentLongevity / 12, 1) * 0.3;
      bestScore += Math.min(bestLongevity / 12, 1) * 0.3;

      return currentScore > bestScore ? current : best;
    });
  }

  private static selectForCollector(variants: FragranceVariant[]): FragranceVariant {
    // Prefer unique, rare, or strongest variants
    return variants.reduce((best, current) => {
      let currentScore = 0;
      let bestScore = 0;

      // Rarity indicators
      const rarityTerms = ['limited', 'exclusive', 'collector', 'elixir', 'parfum', 'extreme'];
      const currentRarity = rarityTerms.some(term => current.name.toLowerCase().includes(term));
      const bestRarity = rarityTerms.some(term => best.name.toLowerCase().includes(term));
      if (currentRarity) currentScore += 0.4;
      if (bestRarity) bestScore += 0.4;

      // Higher intensity preferred
      const currentIntensity = current.intensity_score || 5;
      const bestIntensity = best.intensity_score || 5;
      currentScore += currentIntensity / 10 * 0.3;
      bestScore += bestIntensity / 10 * 0.3;

      // Lower popularity can indicate rarity
      const currentPop = current.popularity_score || 50;
      const bestPop = best.popularity_score || 50;
      currentScore += (100 - currentPop) / 100 * 0.3;
      bestScore += (100 - bestPop) / 100 * 0.3;

      return currentScore > bestScore ? current : best;
    });
  }
}

/**
 * Main variant grouping orchestrator
 */
export class VariantGrouper {
  /**
   * Group fragrances by variants and identify primary variants
   */
  static async groupVariants(fragrances: FragranceVariant[]): Promise<VariantGroup[]> {
    const groups: Map<string, FragranceVariant[]> = new Map();
    const processed = new Set<string>();

    // Group fragrances by similarity
    for (let i = 0; i < fragrances.length; i++) {
      if (processed.has(fragrances[i].id)) continue;

      const currentGroup: FragranceVariant[] = [fragrances[i]];
      processed.add(fragrances[i].id);

      // Find similar fragrances
      for (let j = i + 1; j < fragrances.length; j++) {
        if (processed.has(fragrances[j].id)) continue;

        const similarity = VariantDetector.detectVariants(fragrances[i], fragrances[j]);
        if (similarity >= VariantDetector['SIMILARITY_THRESHOLD']) {
          currentGroup.push(fragrances[j]);
          processed.add(fragrances[j].id);
        }
      }

      // Create group ID based on the base name
      const baseName = this.generateGroupId(currentGroup[0].name, currentGroup[0].brand);
      groups.set(baseName, currentGroup);
    }

    // Process each group
    const variantGroups: VariantGroup[] = [];
    groups.forEach((variants, groupId) => {
      const primaryVariant = PrimaryVariantSelector.selectPrimary(variants);
      const relatedVariants = variants.filter(v => v.id !== primaryVariant.id);
      
      const badges = BadgeAssigner.assignBadges(variants, primaryVariant);
      const experienceRecommendations = ExperienceRecommender.generateRecommendations(variants, primaryVariant);

      // Calculate group popularity score
      const popularityScores = variants.map(v => v.popularity_score || 0);
      const groupPopularityScore = Math.max(...popularityScores);

      variantGroups.push({
        primary_variant: primaryVariant,
        related_variants: relatedVariants.sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0)),
        group_id: groupId,
        group_name: this.generateGroupName(primaryVariant.name),
        total_variants: variants.length,
        popularity_score: groupPopularityScore,
        badges,
        experience_recommendations: experienceRecommendations
      });
    });

    // Sort groups by popularity
    return variantGroups.sort((a, b) => b.popularity_score - a.popularity_score);
  }

  /**
   * Generate a unique group ID
   */
  private static generateGroupId(name: string, brand: string): string {
    const cleanName = name.toLowerCase()
      .replace(/\s+(edt|edp|parfum|cologne|elixir|intense|extreme|sport|noir|blanc|blue)/g, '')
      .replace(/\s+(eau\s+de\s+toilette|eau\s+de\s+parfum|eau\s+de\s+cologne)/g, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    
    const cleanBrand = brand.toLowerCase().replace(/[^\w]/g, '');
    
    return `${cleanBrand}-${cleanName}`;
  }

  /**
   * Generate a human-readable group name
   */
  private static generateGroupName(primaryName: string): string {
    return primaryName
      .replace(/\s+(edt|edp|parfum|cologne|elixir|intense|extreme)$/i, '')
      .replace(/\s+(eau\s+de\s+toilette|eau\s+de\s+parfum|eau\s+de\s+cologne)$/i, '')
      .trim();
  }
}