'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Award, 
  Star, 
  Crown, 
  Target,
  Zap,
  Gift,
  Share2,
  Lock,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Heart,
  Sparkles,
  Search
} from 'lucide-react';
import type { 
  Achievement, 
  GamificationProfile,
  AchievementCategory 
} from '@/lib/services/gamification';

interface AchievementSystemProps {
  userId: string;
  gamificationProfile?: GamificationProfile;
  showCelebrations?: boolean;
  compact?: boolean;
  onAchievementShare?: (achievement: Achievement) => void;
}

/**
 * Achievement System Component - Task 4.2 (Phase 1D)
 * 
 * Comprehensive achievement tracking and display system that motivates
 * users through clear goals, progress visualization, and celebrations.
 * 
 * Features:
 * - Achievement progress tracking with visual indicators
 * - Category-based achievement organization
 * - Achievement celebrations with animations
 * - Social sharing of achievements
 * - Tier-based progression (Bronze → Silver → Gold → Platinum → Diamond)
 * - Rarity system (Common → Legendary → Mythic)
 * - Experience points and level progression
 */
export function AchievementSystem({
  userId,
  gamificationProfile,
  showCelebrations = true,
  compact = false,
  onAchievementShare
}: AchievementSystemProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);
  const [celebratingAchievement, setCelebratingAchievement] = useState<Achievement | null>(null);

  // Check for new achievements to celebrate
  useEffect(() => {
    if (!gamificationProfile || !showCelebrations) return;

    // Find recently unlocked achievements (within last hour)
    const recentlyUnlocked = gamificationProfile.achievements.filter(achievement => {
      if (!achievement.unlocked || !achievement.unlocked_at) return false;
      
      const unlockedAt = new Date(achievement.unlocked_at);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      return unlockedAt > hourAgo;
    });

    if (recentlyUnlocked.length > 0) {
      setCelebratingAchievement(recentlyUnlocked[0]);
    }
  }, [gamificationProfile, showCelebrations]);

  if (!gamificationProfile) {
    return <AchievementSystemSkeleton compact={compact} />;
  }

  // Filter achievements based on selected category and filters
  const filteredAchievements = gamificationProfile.achievements.filter(achievement => {
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
      return false;
    }
    
    if (showOnlyUnlocked && !achievement.unlocked) {
      return false;
    }
    
    return true;
  });

  // Group achievements by tier
  const achievementsByTier = {
    diamond: filteredAchievements.filter(a => a.tier === 'diamond'),
    platinum: filteredAchievements.filter(a => a.tier === 'platinum'),
    gold: filteredAchievements.filter(a => a.tier === 'gold'),
    silver: filteredAchievements.filter(a => a.tier === 'silver'),
    bronze: filteredAchievements.filter(a => a.tier === 'bronze')
  };

  // Get tier styling
  const getTierStyling = (tier: string, unlocked: boolean) => {
    const styles = {
      diamond: { 
        bg: unlocked ? 'bg-gradient-to-r from-cyan-100 to-blue-100 border-cyan-300' : 'bg-gray-50 border-gray-200',
        text: unlocked ? 'text-cyan-800' : 'text-gray-500',
        icon: '💎'
      },
      platinum: { 
        bg: unlocked ? 'bg-gradient-to-r from-gray-100 to-slate-100 border-gray-400' : 'bg-gray-50 border-gray-200',
        text: unlocked ? 'text-gray-800' : 'text-gray-500',
        icon: '🏆'
      },
      gold: { 
        bg: unlocked ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-400' : 'bg-gray-50 border-gray-200',
        text: unlocked ? 'text-yellow-800' : 'text-gray-500',
        icon: '🥇'
      },
      silver: { 
        bg: unlocked ? 'bg-gradient-to-r from-gray-100 to-blue-100 border-gray-300' : 'bg-gray-50 border-gray-200',
        text: unlocked ? 'text-gray-700' : 'text-gray-500',
        icon: '🥈'
      },
      bronze: { 
        bg: unlocked ? 'bg-gradient-to-r from-orange-100 to-red-100 border-orange-300' : 'bg-gray-50 border-gray-200',
        text: unlocked ? 'text-orange-800' : 'text-gray-500',
        icon: '🥉'
      }
    };
    
    return styles[tier as keyof typeof styles] || styles.bronze;
  };

  // Get rarity styling
  const getRarityBadge = (rarity: string) => {
    const rarityStyles = {
      mythic: { bg: 'bg-purple-100 text-purple-800', label: 'Mythic', glow: true },
      legendary: { bg: 'bg-yellow-100 text-yellow-800', label: 'Legendary', glow: true },
      rare: { bg: 'bg-blue-100 text-blue-800', label: 'Rare', glow: false },
      uncommon: { bg: 'bg-green-100 text-green-800', label: 'Uncommon', glow: false },
      common: { bg: 'bg-gray-100 text-gray-800', label: 'Common', glow: false }
    };
    
    return rarityStyles[rarity as keyof typeof rarityStyles] || rarityStyles.common;
  };

  // Category icons
  const getCategoryIcon = (category: AchievementCategory) => {
    const icons = {
      collection_building: Heart,
      discovery: Sparkles,
      social_engagement: Users,
      expertise: Star,
      community: Trophy,
      seasonal: Calendar,
      special_events: Gift
    };
    
    return icons[category] || Target;
  };

  return (
    <div className="space-y-6">
      {/* Achievement Celebration Modal */}
      {celebratingAchievement && (
        <Card className="border-gold-300 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-6xl animate-bounce">🎉</div>
              <div>
                <h2 className="text-2xl font-bold text-yellow-800 mb-2">
                  Achievement Unlocked!
                </h2>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-3xl">{celebratingAchievement.icon}</span>
                  <span className="text-xl font-bold">{celebratingAchievement.name}</span>
                </div>
                <p className="text-yellow-700">{celebratingAchievement.description}</p>
              </div>

              {/* Rewards Display */}
              <div className="bg-white/70 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Rewards Unlocked</h4>
                <div className="flex justify-center space-x-4">
                  {celebratingAchievement.rewards.map((reward, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl mb-1">
                        {reward.type === 'experience_points' ? '⚡' : 
                         reward.type === 'badge' ? '🏆' : 
                         reward.type === 'coins' ? '🪙' : '🎁'}
                      </div>
                      <div className="text-sm font-medium">{reward.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center space-x-3">
                <Button
                  onClick={() => onAchievementShare?.(celebratingAchievement)}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Achievement
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCelebratingAchievement(null)}
                >
                  Continue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Overview */}
      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-purple-600" />
                <span>Achievements</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-purple-600">{gamificationProfile.total_achievements}</div>
                  <div className="text-gray-600">Unlocked</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600">{gamificationProfile.experience_points}</div>
                  <div className="text-gray-600">XP</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">Level {gamificationProfile.gamification_level}</div>
                  <div className="text-gray-600">
                    {gamificationProfile.next_level_points - gamificationProfile.experience_points} XP to next
                  </div>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Achievement Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Achievements</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={showOnlyUnlocked ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlyUnlocked(!showOnlyUnlocked)}
              >
                {showOnlyUnlocked ? 'Show All' : 'Unlocked Only'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
            <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-6">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="collection_building" className="text-xs">Building</TabsTrigger>
              <TabsTrigger value="discovery" className="text-xs">Discovery</TabsTrigger>
              <TabsTrigger value="social_engagement" className="text-xs">Social</TabsTrigger>
              <TabsTrigger value="expertise" className="text-xs">Expert</TabsTrigger>
              <TabsTrigger value="community" className="text-xs">Community</TabsTrigger>
              <TabsTrigger value="seasonal" className="text-xs">Seasonal</TabsTrigger>
              <TabsTrigger value="special_events" className="text-xs">Special</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="space-y-6">
              {/* Achievements by Tier */}
              {Object.entries(achievementsByTier).map(([tier, achievements]) => {
                if (achievements.length === 0) return null;
                
                const tierStyling = getTierStyling(tier, true);
                
                return (
                  <div key={tier} className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold capitalize">{tier} Tier</span>
                      <span className="text-2xl">{tierStyling.icon}</span>
                      <Badge variant="outline" className="text-xs">
                        {achievements.filter(a => a.unlocked).length} / {achievements.length}
                      </Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {achievements.map((achievement) => {
                        const tierStyle = getTierStyling(achievement.tier, achievement.unlocked);
                        const rarityStyle = getRarityBadge(achievement.rarity);
                        const CategoryIcon = getCategoryIcon(achievement.category);

                        return (
                          <Card 
                            key={achievement.achievement_id}
                            className={`transition-all duration-200 hover:shadow-lg ${tierStyle.bg} ${
                              achievement.unlocked ? '' : 'opacity-75'
                            } ${rarityStyle.glow ? 'shadow-lg' : ''}`}
                          >
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                {/* Achievement Header */}
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-2xl">{achievement.icon}</span>
                                    <div className="min-w-0">
                                      <h4 className={`font-semibold ${tierStyle.text} truncate`}>
                                        {achievement.name}
                                      </h4>
                                      <p className="text-xs text-gray-600 line-clamp-2">
                                        {achievement.description}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col items-end space-y-1">
                                    {achievement.unlocked ? (
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <Lock className="w-5 h-5 text-gray-400" />
                                    )}
                                    <Badge className={`${rarityStyle.bg} text-xs`}>
                                      {rarityStyle.label}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Progress */}
                                {!achievement.unlocked && (
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                      <span>Progress</span>
                                      <span>
                                        {achievement.progress.current} / {achievement.progress.target}
                                      </span>
                                    </div>
                                    <Progress 
                                      value={achievement.progress.percentage}
                                      className="h-2"
                                    />
                                  </div>
                                )}

                                {/* Requirements */}
                                <div className="space-y-1">
                                  {achievement.requirements.slice(0, 2).map((req, index) => (
                                    <div key={index} className="flex items-center space-x-2 text-xs">
                                      <div className={`w-2 h-2 rounded-full ${
                                        (req.current || 0) >= req.target ? 'bg-green-500' : 'bg-gray-300'
                                      }`} />
                                      <span className="text-gray-600">{req.description}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Rewards Preview */}
                                <div className="border-t pt-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-700">Rewards:</span>
                                    <div className="flex space-x-1">
                                      {achievement.rewards.slice(0, 3).map((reward, index) => (
                                        <span key={index} className="text-xs">
                                          {reward.type === 'experience_points' ? '⚡' :
                                           reward.type === 'badge' ? '🏆' :
                                           reward.type === 'coins' ? '🪙' : '🎁'}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                {achievement.unlocked && achievement.social_shareable && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onAchievementShare?.(achievement)}
                                    className="w-full"
                                  >
                                    <Share2 className="w-3 h-3 mr-1" />
                                    Share
                                  </Button>
                                )}

                                {!achievement.unlocked && achievement.progress.percentage > 50 && (
                                  <div className="text-center">
                                    <span className="text-xs text-green-600 font-medium">
                                      🔥 Almost there! {100 - Math.round(achievement.progress.percentage)}% to go
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Achievement Statistics */}
      {!compact && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span>Achievement Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((gamificationProfile.total_achievements / gamificationProfile.achievements.length) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {gamificationProfile.achievements.filter(a => a.unlocked && a.rarity === 'rare').length}
                </div>
                <div className="text-sm text-gray-600">Rare Unlocked</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {gamificationProfile.experience_points}
                </div>
                <div className="text-sm text-gray-600">Total XP</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  Level {gamificationProfile.gamification_level}
                </div>
                <div className="text-sm text-gray-600">Current Level</div>
              </div>
            </div>

            {/* Next Level Progress */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Level {gamificationProfile.gamification_level} Progress</span>
                <span>
                  {gamificationProfile.experience_points} / {gamificationProfile.next_level_points} XP
                </span>
              </div>
              <Progress 
                value={((gamificationProfile.experience_points) / gamificationProfile.next_level_points) * 100}
                className="h-3"
              />
              <div className="text-xs text-center text-gray-600">
                {gamificationProfile.next_level_points - gamificationProfile.experience_points} XP to Level {gamificationProfile.gamification_level + 1}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Achievement Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span>Quick Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Actions that help unlock achievements */}
            <Button
              variant="outline"
              size="sm"
              className="flex-col h-16 p-2"
              onClick={() => {
                // Navigate to quiz
                window.location.href = '/quiz';
              }}
            >
              <Sparkles className="w-5 h-5 mb-1 text-purple-500" />
              <span className="text-xs">Take Quiz</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex-col h-16 p-2"
              onClick={() => {
                // Navigate to collection with rating focus
                window.location.href = '/collection?focus=rating';
              }}
            >
              <Star className="w-5 h-5 mb-1 text-yellow-500" />
              <span className="text-xs">Rate Fragrances</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex-col h-16 p-2"
              onClick={() => {
                // Navigate to browse
                window.location.href = '/fragrance/browse';
              }}
            >
              <Search className="w-5 h-5 mb-1 text-blue-500" />
              <span className="text-xs">Discover More</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex-col h-16 p-2"
              onClick={() => {
                // Open sharing interface
                console.log('Open sharing');
              }}
            >
              <Share2 className="w-5 h-5 mb-1 text-green-500" />
              <span className="text-xs">Share Collection</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {gamificationProfile.achievements.filter(a => a.unlocked).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <span>Recent Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gamificationProfile.achievements
                .filter(a => a.unlocked)
                .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
                .slice(0, 3)
                .map((achievement) => (
                  <div key={achievement.achievement_id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div className="flex-1">
                      <h5 className="font-medium">{achievement.name}</h5>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getRarityBadge(achievement.rarity).bg + ' text-xs'}>
                          {getRarityBadge(achievement.rarity).label}
                        </Badge>
                        {achievement.unlocked_at && (
                          <span className="text-xs text-gray-500">
                            Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {achievement.social_shareable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAchievementShare?.(achievement)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Achievement system loading skeleton
 */
function AchievementSystemSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="space-y-6">
      {!compact && (
        <Card className="animate-pulse">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-gray-300 rounded" />
                <div className="h-6 bg-gray-300 rounded w-32" />
              </div>
              <div className="flex space-x-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="text-center">
                    <div className="h-6 bg-gray-300 rounded w-8 mb-1" />
                    <div className="h-4 bg-gray-300 rounded w-12" />
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <Card className="animate-pulse">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-300 rounded" />
                    <div>
                      <div className="h-4 bg-gray-300 rounded w-24 mb-1" />
                      <div className="h-3 bg-gray-300 rounded w-32" />
                    </div>
                  </div>
                  <div className="w-5 h-5 bg-gray-300 rounded" />
                </div>
                <div className="h-2 bg-gray-300 rounded mb-2" />
                <div className="h-3 bg-gray-300 rounded w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}