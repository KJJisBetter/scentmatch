import { createServerSupabase } from '@/lib/supabase/server';
import { collectionAnalytics } from './collection-analytics';
import type { EngagementLevel } from '@/lib/types/collection-analytics';

/**
 * Gamification Service - Task 4.2 (Phase 1D)
 * 
 * Comprehensive gamification system that drives engagement through achievements,
 * badges, challenges, and rewards. Creates a compelling progression system
 * that encourages continued collection building and platform usage.
 * 
 * Features:
 * - Achievement system with multiple categories
 * - Badge collection and display
 * - Seasonal challenges and events
 * - Leaderboards and community competitions
 * - Reward redemption system
 * - Progress tracking and celebrations
 * - Social sharing of achievements
 */

export interface Achievement {
  achievement_id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  requirements: AchievementRequirement[];
  rewards: AchievementReward[];
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
  unlocked: boolean;
  unlocked_at?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythic';
  icon: string;
  color: string;
  social_shareable: boolean;
}

export interface Badge {
  badge_id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: BadgeCategory;
  earned_at: string;
  display_priority: number;
  social_proof_value: number; // How impressive this badge is to others
}

export interface SeasonalChallenge {
  challenge_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  requirements: ChallengeRequirement[];
  rewards: ChallengeReward[];
  participants: number;
  completion_rate: number;
  user_progress?: {
    current: number;
    target: number;
    rank?: number;
  };
  status: 'upcoming' | 'active' | 'completed' | 'expired';
}

export interface GamificationProfile {
  user_id: string;
  total_achievements: number;
  total_badges: number;
  gamification_level: number;
  experience_points: number;
  next_level_points: number;
  achievements: Achievement[];
  badges: Badge[];
  current_challenges: SeasonalChallenge[];
  leaderboard_positions: {
    collection_size: number;
    engagement_score: number;
    achievements: number;
    social_influence: number;
  };
  reward_balance: {
    coins: number;
    premium_credits: number;
    discount_tokens: number;
  };
}

export type AchievementCategory = 
  | 'collection_building' 
  | 'discovery' 
  | 'social_engagement' 
  | 'expertise' 
  | 'community' 
  | 'seasonal' 
  | 'special_events';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export type BadgeCategory = 
  | 'milestone' 
  | 'expertise' 
  | 'social' 
  | 'seasonal' 
  | 'special' 
  | 'community';

export interface AchievementRequirement {
  type: 'collection_size' | 'rating_count' | 'social_shares' | 'quiz_completions' | 'days_active' | 'family_diversity';
  target: number;
  current?: number;
  description: string;
}

export interface AchievementReward {
  type: 'experience_points' | 'badge' | 'coins' | 'discount' | 'feature_unlock' | 'premium_access';
  value: number | string;
  description: string;
}

export interface ChallengeRequirement {
  action: string;
  target: number;
  timeframe: 'daily' | 'weekly' | 'challenge_duration';
}

export interface ChallengeReward {
  type: string;
  value: number | string;
  description: string;
  rarity: 'common' | 'rare' | 'legendary';
}

export class GamificationService {
  private supabase: ReturnType<typeof createServerSupabase> | null = null;

  constructor() {
    // Lazy initialization
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createServerSupabase();
    }
    return this.supabase;
  }

  /**
   * Get user's complete gamification profile
   */
  async getUserGamificationProfile(userId: string): Promise<GamificationProfile> {
    try {
      const [
        achievements,
        badges,
        challenges,
        leaderboardPositions,
        rewardBalance,
        experienceData
      ] = await Promise.all([
        this.getUserAchievements(userId),
        this.getUserBadges(userId),
        this.getActiveChallenges(userId),
        this.getLeaderboardPositions(userId),
        this.getRewardBalance(userId),
        this.getExperienceData(userId)
      ]);

      return {
        user_id: userId,
        total_achievements: achievements.filter(a => a.unlocked).length,
        total_badges: badges.length,
        gamification_level: experienceData.level,
        experience_points: experienceData.points,
        next_level_points: experienceData.next_level_threshold,
        achievements,
        badges,
        current_challenges: challenges,
        leaderboard_positions,
        reward_balance: rewardBalance
      };

    } catch (error) {
      console.error('Get gamification profile error:', error);
      throw new Error('Failed to get gamification profile');
    }
  }

  /**
   * Process achievement progress and unlock new achievements
   */
  async processAchievementProgress(
    userId: string,
    actionType: string,
    actionData: Record<string, any>
  ): Promise<{
    achievements_unlocked: Achievement[];
    badges_earned: Badge[];
    experience_gained: number;
    level_up: boolean;
  }> {
    try {
      // Get user's current achievements
      const currentAchievements = await this.getUserAchievements(userId);
      
      // Check for newly unlocked achievements
      const unlockedAchievements = [];
      const newBadges = [];
      let experienceGained = 0;

      for (const achievement of currentAchievements) {
        if (!achievement.unlocked && this.checkAchievementUnlock(achievement, actionType, actionData)) {
          // Unlock achievement
          achievement.unlocked = true;
          achievement.unlocked_at = new Date().toISOString();
          unlockedAchievements.push(achievement);

          // Grant rewards
          for (const reward of achievement.rewards) {
            if (reward.type === 'experience_points') {
              experienceGained += Number(reward.value);
            } else if (reward.type === 'badge') {
              const badge = await this.createBadgeFromReward(reward, achievement);
              if (badge) newBadges.push(badge);
            }
          }

          // Track achievement unlock
          await this.trackGamificationEvent(userId, 'achievement_unlocked', {
            achievement_id: achievement.achievement_id,
            achievement_name: achievement.name,
            tier: achievement.tier,
            experience_gained: experienceGained
          });
        }
      }

      // Update user experience and check for level up
      const levelUpResult = await this.updateUserExperience(userId, experienceGained);

      return {
        achievements_unlocked: unlockedAchievements,
        badges_earned: newBadges,
        experience_gained: experienceGained,
        level_up: levelUpResult.level_increased
      };

    } catch (error) {
      console.error('Process achievement progress error:', error);
      return {
        achievements_unlocked: [],
        badges_earned: [],
        experience_gained: 0,
        level_up: false
      };
    }
  }

  /**
   * Create and manage seasonal challenges
   */
  async createSeasonalChallenge(challengeData: {
    name: string;
    description: string;
    duration_days: number;
    requirements: ChallengeRequirement[];
    rewards: ChallengeReward[];
  }): Promise<SeasonalChallenge> {
    const challenge: SeasonalChallenge = {
      challenge_id: `challenge_${Date.now()}`,
      name: challengeData.name,
      description: challengeData.description,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + challengeData.duration_days * 24 * 60 * 60 * 1000).toISOString(),
      requirements: challengeData.requirements,
      rewards: challengeData.rewards,
      participants: 0,
      completion_rate: 0,
      status: 'active'
    };

    // In production, this would be stored in database
    return challenge;
  }

  /**
   * Get leaderboard rankings
   */
  async getLeaderboards(
    category: 'collection_size' | 'engagement_score' | 'achievements' | 'social_influence',
    timeframe: 'weekly' | 'monthly' | 'all_time' = 'monthly',
    limit = 50
  ): Promise<Array<{
    rank: number;
    user_id: string;
    display_name: string;
    score: number;
    achievement_count?: number;
    badge_count?: number;
    trend: 'rising' | 'stable' | 'falling';
  }>> {
    const supabase = await this.getSupabase();

    try {
      // Build query based on category
      let query = supabase.from('user_engagement_scores');
      let orderColumn = 'engagement_score_raw';

      switch (category) {
        case 'collection_size':
          orderColumn = 'collection_size';
          break;
        case 'achievements':
          // Would join with achievements table
          orderColumn = 'engagement_score_raw'; // Fallback
          break;
        case 'social_influence':
          orderColumn = 'social_engagement_score';
          break;
      }

      // Apply timeframe filter
      if (timeframe !== 'all_time') {
        const cutoffDate = timeframe === 'weekly' 
          ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        query = query.gte('updated_at', cutoffDate.toISOString());
      }

      const { data: leaderboardData, error } = await query
        .select(`
          user_id,
          ${orderColumn},
          collection_size,
          social_engagement_score
        `)
        .order(orderColumn, { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Leaderboard query error: ${error.message}`);
      }

      // Format leaderboard results
      return (leaderboardData || []).map((entry, index) => ({
        rank: index + 1,
        user_id: entry.user_id,
        display_name: this.anonymizeDisplayName(entry.user_id, index),
        score: entry[orderColumn] || 0,
        achievement_count: 0, // Would calculate from achievements
        badge_count: 0, // Would calculate from badges
        trend: 'stable' as const // Would calculate from historical data
      }));

    } catch (error) {
      console.error('Get leaderboards error:', error);
      return [];
    }
  }

  /**
   * Process reward redemption
   */
  async redeemReward(
    userId: string,
    rewardType: 'discount' | 'premium_feature' | 'exclusive_content',
    cost: number
  ): Promise<{
    success: boolean;
    reward_granted?: string;
    new_balance?: number;
    error?: string;
  }> {
    const supabase = await this.getSupabase();

    try {
      // Check user's reward balance
      const balance = await this.getRewardBalance(userId);
      
      if (balance.coins < cost) {
        return {
          success: false,
          error: 'Insufficient coins for redemption'
        };
      }

      // Process redemption (in production, would handle actual rewards)
      const newBalance = balance.coins - cost;
      
      // Track redemption
      await this.trackGamificationEvent(userId, 'reward_redeemed', {
        reward_type: rewardType,
        cost: cost,
        new_balance: newBalance
      });

      return {
        success: true,
        reward_granted: `${rewardType} unlocked`,
        new_balance: newBalance
      };

    } catch (error) {
      console.error('Redeem reward error:', error);
      return {
        success: false,
        error: 'Failed to redeem reward'
      };
    }
  }

  // Private implementation methods

  private async getUserAchievements(userId: string): Promise<Achievement[]> {
    // Get user's collection and engagement data
    const insights = await collectionAnalytics.getCollectionInsights(userId);
    const stats = await collectionAnalytics.getCollectionStats(userId);
    
    // Define all available achievements
    const allAchievements: Achievement[] = [
      {
        achievement_id: 'first_collection',
        name: 'First Steps',
        description: 'Add your first fragrance to your collection',
        category: 'collection_building',
        tier: 'bronze',
        requirements: [
          { type: 'collection_size', target: 1, description: 'Add 1 fragrance' }
        ],
        rewards: [
          { type: 'experience_points', value: 50, description: '50 XP' },
          { type: 'badge', value: 'first_steps', description: 'First Steps Badge' }
        ],
        progress: {
          current: stats.collection_size,
          target: 1,
          percentage: Math.min(100, stats.collection_size * 100)
        },
        unlocked: stats.collection_size >= 1,
        rarity: 'common',
        icon: '🌱',
        color: 'green',
        social_shareable: true
      },
      {
        achievement_id: 'collection_builder',
        name: 'Collection Builder',
        description: 'Build a collection of 10 fragrances',
        category: 'collection_building',
        tier: 'silver',
        requirements: [
          { type: 'collection_size', target: 10, description: 'Add 10 fragrances' }
        ],
        rewards: [
          { type: 'experience_points', value: 200, description: '200 XP' },
          { type: 'badge', value: 'collection_builder', description: 'Collection Builder Badge' },
          { type: 'coins', value: 100, description: '100 ScentCoins' }
        ],
        progress: {
          current: stats.collection_size,
          target: 10,
          percentage: Math.min(100, (stats.collection_size / 10) * 100)
        },
        unlocked: stats.collection_size >= 10,
        rarity: 'uncommon',
        icon: '🏗️',
        color: 'blue',
        social_shareable: true
      },
      {
        achievement_id: 'rating_master',
        name: 'Rating Master',
        description: 'Rate 20 fragrances in your collection',
        category: 'expertise',
        tier: 'gold',
        requirements: [
          { type: 'rating_count', target: 20, description: 'Rate 20 fragrances' }
        ],
        rewards: [
          { type: 'experience_points', value: 300, description: '300 XP' },
          { type: 'badge', value: 'rating_master', description: 'Rating Master Badge' },
          { type: 'feature_unlock', value: 'advanced_insights', description: 'Advanced Insights Unlocked' }
        ],
        progress: {
          current: stats.total_ratings,
          target: 20,
          percentage: Math.min(100, (stats.total_ratings / 20) * 100)
        },
        unlocked: stats.total_ratings >= 20,
        rarity: 'rare',
        icon: '⭐',
        color: 'yellow',
        social_shareable: true
      },
      {
        achievement_id: 'family_explorer',
        name: 'Scent Family Explorer',
        description: 'Explore 6 different scent families',
        category: 'discovery',
        tier: 'silver',
        requirements: [
          { type: 'family_diversity', target: 6, description: 'Explore 6 scent families' }
        ],
        rewards: [
          { type: 'experience_points', value: 250, description: '250 XP' },
          { type: 'badge', value: 'family_explorer', description: 'Explorer Badge' }
        ],
        progress: {
          current: stats.scent_family_breakdown.length,
          target: 6,
          percentage: Math.min(100, (stats.scent_family_breakdown.length / 6) * 100)
        },
        unlocked: stats.scent_family_breakdown.length >= 6,
        rarity: 'uncommon',
        icon: '🧭',
        color: 'purple',
        social_shareable: true
      },
      {
        achievement_id: 'social_influencer',
        name: 'Social Influencer',
        description: 'Share your collection and get 100+ views',
        category: 'social_engagement',
        tier: 'gold',
        requirements: [
          { type: 'social_shares', target: 100, description: 'Get 100 share views' }
        ],
        rewards: [
          { type: 'experience_points', value: 500, description: '500 XP' },
          { type: 'badge', value: 'social_influencer', description: 'Influencer Badge' },
          { type: 'premium_access', value: '30_days', description: '30 days premium access' }
        ],
        progress: {
          current: insights.social_context.sharing_activity,
          target: 100,
          percentage: Math.min(100, insights.social_context.sharing_activity)
        },
        unlocked: insights.social_context.sharing_activity >= 100,
        rarity: 'rare',
        icon: '🌟',
        color: 'gold',
        social_shareable: true
      },
      {
        achievement_id: 'connoisseur',
        name: 'Fragrance Connoisseur',
        description: 'Build a collection of 50+ carefully curated fragrances',
        category: 'expertise',
        tier: 'platinum',
        requirements: [
          { type: 'collection_size', target: 50, description: 'Add 50 fragrances' },
          { type: 'rating_count', target: 35, description: 'Rate 35 fragrances' },
          { type: 'family_diversity', target: 8, description: 'Explore 8 families' }
        ],
        rewards: [
          { type: 'experience_points', value: 1000, description: '1000 XP' },
          { type: 'badge', value: 'connoisseur', description: 'Connoisseur Badge' },
          { type: 'feature_unlock', value: 'expert_recommendations', description: 'Expert Recommendations' }
        ],
        progress: {
          current: Math.min(stats.collection_size, stats.total_ratings * 1.4, stats.scent_family_breakdown.length * 6),
          target: 50,
          percentage: Math.min(100, (stats.collection_size / 50) * 100)
        },
        unlocked: stats.collection_size >= 50 && stats.total_ratings >= 35 && stats.scent_family_breakdown.length >= 8,
        rarity: 'legendary',
        icon: '👑',
        color: 'platinum',
        social_shareable: true
      }
    ];

    return allAchievements;
  }

  private async getUserBadges(userId: string): Promise<Badge[]> {
    // In production, this would fetch from a badges table
    // For now, return based on achievements unlocked
    const achievements = await this.getUserAchievements(userId);
    
    return achievements
      .filter(achievement => achievement.unlocked)
      .map(achievement => ({
        badge_id: `badge_${achievement.achievement_id}`,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        color: achievement.color,
        category: this.mapAchievementCategoryToBadgeCategory(achievement.category),
        earned_at: achievement.unlocked_at || new Date().toISOString(),
        display_priority: this.calculateBadgePriority(achievement),
        social_proof_value: this.calculateSocialProofValue(achievement)
      }));
  }

  private async getActiveChallenges(userId: string): Promise<SeasonalChallenge[]> {
    // Generate seasonal challenges based on current date and user progress
    const now = new Date();
    const currentSeason = this.getCurrentSeason();
    
    const seasonalChallenges: SeasonalChallenge[] = [
      {
        challenge_id: `${currentSeason}_explorer_2025`,
        name: `${currentSeason} Explorer`,
        description: `Discover 5 perfect ${currentSeason} fragrances`,
        start_date: this.getSeasonStartDate(currentSeason).toISOString(),
        end_date: this.getSeasonEndDate(currentSeason).toISOString(),
        requirements: [
          { action: 'add_seasonal_fragrance', target: 5, timeframe: 'challenge_duration' }
        ],
        rewards: [
          { type: 'badge', value: `${currentSeason}_explorer`, description: `${currentSeason} Explorer Badge`, rarity: 'rare' },
          { type: 'coins', value: 200, description: '200 ScentCoins', rarity: 'common' }
        ],
        participants: 1247,
        completion_rate: 23.5,
        status: 'active'
      }
    ];

    // Add user progress to challenges
    for (const challenge of seasonalChallenges) {
      challenge.user_progress = await this.calculateChallengeProgress(userId, challenge);
    }

    return seasonalChallenges;
  }

  private async getLeaderboardPositions(userId: string) {
    // Get user's position in various leaderboards
    const leaderboards = await Promise.all([
      this.getLeaderboards('collection_size'),
      this.getLeaderboards('engagement_score'),
      this.getLeaderboards('achievements'),
      this.getLeaderboards('social_influence')
    ]);

    return {
      collection_size: leaderboards[0].findIndex(entry => entry.user_id === userId) + 1 || 999,
      engagement_score: leaderboards[1].findIndex(entry => entry.user_id === userId) + 1 || 999,
      achievements: leaderboards[2].findIndex(entry => entry.user_id === userId) + 1 || 999,
      social_influence: leaderboards[3].findIndex(entry => entry.user_id === userId) + 1 || 999
    };
  }

  private async getRewardBalance(userId: string) {
    // In production, this would fetch from a rewards/coins table
    // For now, calculate based on achievements and activity
    const insights = await collectionAnalytics.getCollectionInsights(userId);
    
    const baseCoins = insights.engagement_metrics.engagement_score * 0.5;
    const bonusCoins = insights.social_context.sharing_activity * 25;
    
    return {
      coins: Math.round(baseCoins + bonusCoins),
      premium_credits: 0,
      discount_tokens: Math.floor((baseCoins + bonusCoins) / 500)
    };
  }

  private async getExperienceData(userId: string) {
    const insights = await collectionAnalytics.getCollectionInsights(userId);
    const experiencePoints = insights.engagement_metrics.engagement_score;
    
    // Calculate level from experience points
    const level = Math.floor(experiencePoints / 100) + 1;
    const nextLevelThreshold = level * 100;
    
    return {
      points: experiencePoints,
      level: level,
      next_level_threshold: nextLevelThreshold
    };
  }

  private checkAchievementUnlock(
    achievement: Achievement,
    actionType: string,
    actionData: Record<string, any>
  ): boolean {
    // Check if the current action satisfies achievement requirements
    for (const requirement of achievement.requirements) {
      const currentValue = this.getCurrentRequirementValue(requirement, actionData);
      if (currentValue < requirement.target) {
        return false;
      }
    }
    return true;
  }

  private getCurrentRequirementValue(
    requirement: AchievementRequirement,
    actionData: Record<string, any>
  ): number {
    // Extract current value based on requirement type
    switch (requirement.type) {
      case 'collection_size':
        return actionData.collection_size || 0;
      case 'rating_count':
        return actionData.rating_count || 0;
      case 'social_shares':
        return actionData.share_views || 0;
      case 'family_diversity':
        return actionData.families_explored || 0;
      default:
        return 0;
    }
  }

  private async createBadgeFromReward(
    reward: AchievementReward,
    achievement: Achievement
  ): Promise<Badge | null> {
    if (reward.type !== 'badge') return null;

    return {
      badge_id: `badge_${achievement.achievement_id}`,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      color: achievement.color,
      category: this.mapAchievementCategoryToBadgeCategory(achievement.category),
      earned_at: new Date().toISOString(),
      display_priority: this.calculateBadgePriority(achievement),
      social_proof_value: this.calculateSocialProofValue(achievement)
    };
  }

  private async updateUserExperience(
    userId: string,
    experienceGained: number
  ): Promise<{ level_increased: boolean; new_level?: number; old_level?: number }> {
    if (experienceGained === 0) {
      return { level_increased: false };
    }

    try {
      // Get current experience data
      const currentData = await this.getExperienceData(userId);
      const oldLevel = currentData.level;
      const newPoints = currentData.points + experienceGained;
      const newLevel = Math.floor(newPoints / 100) + 1;

      // Track experience gain
      await this.trackGamificationEvent(userId, 'experience_gained', {
        experience_gained: experienceGained,
        total_experience: newPoints,
        old_level: oldLevel,
        new_level: newLevel,
        level_up: newLevel > oldLevel
      });

      return {
        level_increased: newLevel > oldLevel,
        new_level: newLevel,
        old_level: oldLevel
      };

    } catch (error) {
      console.error('Update user experience error:', error);
      return { level_increased: false };
    }
  }

  private async calculateChallengeProgress(
    userId: string,
    challenge: SeasonalChallenge
  ): Promise<{ current: number; target: number; rank?: number }> {
    // Calculate user's progress on challenge requirements
    let totalProgress = 0;
    let totalTarget = 0;

    for (const requirement of challenge.requirements) {
      // This would calculate actual progress based on user actions
      const progress = 0; // Placeholder
      totalProgress += progress;
      totalTarget += requirement.target;
    }

    return {
      current: totalProgress,
      target: totalTarget,
      rank: Math.floor(Math.random() * 100) + 1 // Placeholder ranking
    };
  }

  private mapAchievementCategoryToBadgeCategory(category: AchievementCategory): BadgeCategory {
    const mapping: Record<AchievementCategory, BadgeCategory> = {
      'collection_building': 'milestone',
      'discovery': 'expertise',
      'social_engagement': 'social',
      'expertise': 'expertise',
      'community': 'community',
      'seasonal': 'seasonal',
      'special_events': 'special'
    };
    return mapping[category] || 'milestone';
  }

  private calculateBadgePriority(achievement: Achievement): number {
    const tierPriority = {
      'diamond': 100,
      'platinum': 80,
      'gold': 60,
      'silver': 40,
      'bronze': 20
    };
    
    const rarityBonus = {
      'mythic': 50,
      'legendary': 40,
      'rare': 30,
      'uncommon': 20,
      'common': 10
    };

    return tierPriority[achievement.tier] + rarityBonus[achievement.rarity];
  }

  private calculateSocialProofValue(achievement: Achievement): number {
    // Calculate how impressive this achievement is to others
    const baseValue = {
      'diamond': 50,
      'platinum': 40,
      'gold': 30,
      'silver': 20,
      'bronze': 10
    }[achievement.tier];

    const rarityMultiplier = {
      'mythic': 3,
      'legendary': 2.5,
      'rare': 2,
      'uncommon': 1.5,
      'common': 1
    }[achievement.rarity];

    return Math.round(baseValue * rarityMultiplier);
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  }

  private getSeasonStartDate(season: string): Date {
    const year = new Date().getFullYear();
    const seasonDates = {
      'Spring': new Date(year, 2, 20), // March 20
      'Summer': new Date(year, 5, 21), // June 21
      'Fall': new Date(year, 8, 22),   // September 22
      'Winter': new Date(year, 11, 21) // December 21
    };
    return seasonDates[season as keyof typeof seasonDates] || new Date();
  }

  private getSeasonEndDate(season: string): Date {
    const startDate = this.getSeasonStartDate(season);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3);
    return endDate;
  }

  private anonymizeDisplayName(userId: string, index: number): string {
    // Generate consistent anonymous display names
    const adjectives = ['Swift', 'Clever', 'Mystic', 'Noble', 'Sage', 'Bold', 'Keen', 'Bright'];
    const nouns = ['Explorer', 'Collector', 'Seeker', 'Curator', 'Hunter', 'Finder', 'Discoverer', 'Maven'];
    
    const adjIndex = (userId?.charCodeAt(0) || index) % adjectives.length;
    const nounIndex = (userId?.charCodeAt(1) || index + 1) % nouns.length;
    
    return `${adjectives[adjIndex]} ${nouns[nounIndex]}`;
  }

  private async trackGamificationEvent(
    userId: string,
    eventType: string,
    eventData: Record<string, any>
  ): Promise<void> {
    try {
      await collectionAnalytics.trackEvent({
        user_id: userId,
        event_type: eventType,
        event_data: eventData
      });
    } catch (error) {
      console.warn('Track gamification event error:', error);
    }
  }
}

// Export singleton instance
export const gamificationService = new GamificationService();