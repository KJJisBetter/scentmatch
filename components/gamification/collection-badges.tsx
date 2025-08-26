'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Crown, 
  Star, 
  Heart,
  Target,
  Sparkles,
  Trophy,
  Calendar,
  Users,
  Zap,
  Gift,
  Share2,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';
import type { Badge as GamificationBadge, BadgeCategory } from '@/lib/services/gamification';

interface CollectionBadgesProps {
  badges: GamificationBadge[];
  displayMode?: 'showcase' | 'compact' | 'profile' | 'sharing';
  maxDisplay?: number;
  editable?: boolean;
  onBadgeShare?: (badge: GamificationBadge) => void;
  onDisplaySettingsChange?: (settings: BadgeDisplaySettings) => void;
}

interface BadgeDisplaySettings {
  show_in_profile: boolean;
  show_rarity: boolean;
  show_earned_date: boolean;
  sort_by: 'earned_date' | 'rarity' | 'social_value' | 'category';
  visible_categories: BadgeCategory[];
}

/**
 * Collection Badges Component - Task 4.2 (Phase 1D)
 * 
 * Displays and manages user's earned badges with rich visual presentation.
 * Supports multiple display modes for different contexts and provides
 * customization options for profile display.
 * 
 * Features:
 * - Beautiful badge showcase with animations
 * - Category-based organization
 * - Rarity-based visual effects
 * - Social sharing integration
 * - Profile display customization
 * - Badge earning celebrations
 * - Social proof value display
 */
export function CollectionBadges({
  badges,
  displayMode = 'showcase',
  maxDisplay = 12,
  editable = false,
  onBadgeShare,
  onDisplaySettingsChange
}: CollectionBadgesProps) {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  const [displaySettings, setDisplaySettings] = useState<BadgeDisplaySettings>({
    show_in_profile: true,
    show_rarity: true,
    show_earned_date: true,
    sort_by: 'earned_date',
    visible_categories: ['milestone', 'expertise', 'social', 'seasonal', 'special']
  });
  const [showSettings, setShowSettings] = useState(false);

  // Filter and sort badges
  const filteredBadges = badges
    .filter(badge => {
      if (selectedCategory !== 'all' && badge.category !== selectedCategory) {
        return false;
      }
      return displaySettings.visible_categories.includes(badge.category);
    })
    .sort((a, b) => {
      switch (displaySettings.sort_by) {
        case 'rarity':
          return this.getRarityOrder(b) - this.getRarityOrder(a);
        case 'social_value':
          return b.social_proof_value - a.social_proof_value;
        case 'category':
          return a.category.localeCompare(b.category);
        case 'earned_date':
        default:
          return new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime();
      }
    })
    .slice(0, maxDisplay);

  // Get badge styling based on category and social value
  const getBadgeStyling = (badge: GamificationBadge) => {
    const baseStyles = {
      milestone: { bg: 'bg-blue-100 border-blue-300 text-blue-800', glow: false },
      expertise: { bg: 'bg-purple-100 border-purple-300 text-purple-800', glow: true },
      social: { bg: 'bg-green-100 border-green-300 text-green-800', glow: false },
      seasonal: { bg: 'bg-orange-100 border-orange-300 text-orange-800', glow: false },
      special: { bg: 'bg-pink-100 border-pink-300 text-pink-800', glow: true },
      community: { bg: 'bg-indigo-100 border-indigo-300 text-indigo-800', glow: false }
    };

    const style = baseStyles[badge.category] || baseStyles.milestone;
    
    // Add glow effect for high social proof value
    if (badge.social_proof_value > 30) {
      style.glow = true;
    }

    return style;
  };

  // Get category icon
  const getCategoryIcon = (category: BadgeCategory) => {
    const icons = {
      milestone: Target,
      expertise: Star,
      social: Users,
      seasonal: Calendar,
      special: Gift,
      community: Trophy
    };
    return icons[category] || Award;
  };

  // Get rarity order for sorting
  const getRarityOrder = (badge: GamificationBadge): number => {
    const rarityOrder = { 'common': 1, 'uncommon': 2, 'rare': 3, 'legendary': 4, 'mythic': 5 };
    // Badge doesn't have rarity property in current type, so we'll estimate from social_proof_value
    if (badge.social_proof_value > 40) return 5; // mythic
    if (badge.social_proof_value > 30) return 4; // legendary
    if (badge.social_proof_value > 20) return 3; // rare
    if (badge.social_proof_value > 10) return 2; // uncommon
    return 1; // common
  };

  // Update display settings
  const updateDisplaySettings = (updates: Partial<BadgeDisplaySettings>) => {
    const newSettings = { ...displaySettings, ...updates };
    setDisplaySettings(newSettings);
    onDisplaySettingsChange?.(newSettings);
  };

  // Format earned date
  const formatEarnedDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Render based on display mode
  switch (displayMode) {
    case 'compact':
      return (
        <div className="flex flex-wrap gap-2">
          {filteredBadges.slice(0, 6).map((badge) => {
            const styling = getBadgeStyling(badge);
            return (
              <div
                key={badge.badge_id}
                className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full border ${styling.bg} ${
                  styling.glow ? 'shadow-lg' : ''
                }`}
                title={badge.description}
              >
                <span className="text-sm">{badge.icon}</span>
                <span className="text-xs font-medium">{badge.name}</span>
              </div>
            );
          })}
          
          {badges.length > 6 && (
            <div className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
              +{badges.length - 6} more
            </div>
          )}
        </div>
      );

    case 'profile':
      return (
        <div className="space-y-4">
          {/* Profile Badge Showcase */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {filteredBadges.slice(0, 6).map((badge) => {
              const styling = getBadgeStyling(badge);
              return (
                <div
                  key={badge.badge_id}
                  className={`text-center p-3 rounded-lg border-2 ${styling.bg} ${
                    styling.glow ? 'shadow-lg transform hover:scale-105' : ''
                  } transition-all duration-200`}
                >
                  <div className="text-2xl mb-2">{badge.icon}</div>
                  <div className="text-xs font-medium truncate">{badge.name}</div>
                  {displaySettings.show_rarity && (
                    <div className="text-xs text-gray-600 mt-1">
                      Social Value: {badge.social_proof_value}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Badge Count Summary */}
          <div className="text-center text-sm text-gray-600">
            Displaying {Math.min(filteredBadges.length, 6)} of {badges.length} earned badges
            {badges.length > 6 && (
              <Button variant="ghost" size="sm" className="ml-2 text-xs">
                View All
              </Button>
            )}
          </div>
        </div>
      );

    case 'sharing':
      return (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">My Achievement Badges</h3>
            <p className="text-sm text-gray-600">
              Earned {badges.length} badges on my fragrance journey
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredBadges.slice(0, 8).map((badge) => {
              const styling = getBadgeStyling(badge);
              return (
                <div
                  key={badge.badge_id}
                  className={`text-center p-4 rounded-xl border-2 ${styling.bg} ${
                    styling.glow ? 'shadow-xl' : 'shadow-lg'
                  }`}
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className="text-sm font-semibold">{badge.name}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {formatEarnedDate(badge.earned_at)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Button onClick={() => onBadgeShare?.(badges[0])}>
              <Share2 className="w-4 h-4 mr-2" />
              Share Badge Collection
            </Button>
          </div>
        </div>
      );

    case 'showcase':
    default:
      return (
        <div className="space-y-6">
          {/* Badge Display Settings */}
          {editable && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Badge Display</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    {showSettings ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              
              {showSettings && (
                <CardContent className="space-y-4">
                  {/* Sort Options */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort by:</label>
                    <select
                      value={displaySettings.sort_by}
                      onChange={(e) => updateDisplaySettings({ sort_by: e.target.value as any })}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="earned_date">Date Earned</option>
                      <option value="rarity">Rarity</option>
                      <option value="social_value">Social Value</option>
                      <option value="category">Category</option>
                    </select>
                  </div>

                  {/* Display Options */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={displaySettings.show_rarity}
                        onChange={(e) => updateDisplaySettings({ show_rarity: e.target.checked })}
                        className="rounded"
                      />
                      <label className="text-sm">Show rarity indicators</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={displaySettings.show_earned_date}
                        onChange={(e) => updateDisplaySettings({ show_earned_date: e.target.checked })}
                        className="rounded"
                      />
                      <label className="text-sm">Show earned dates</label>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All ({badges.length})
            </Button>
            
            {(['milestone', 'expertise', 'social', 'seasonal', 'special', 'community'] as BadgeCategory[]).map(category => {
              const categoryBadges = badges.filter(b => b.category === category);
              if (categoryBadges.length === 0) return null;
              
              const CategoryIcon = getCategoryIcon(category);
              
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  <CategoryIcon className="w-3 h-3 mr-1" />
                  {category} ({categoryBadges.length})
                </Button>
              );
            })}
          </div>

          {/* Badges Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredBadges.map((badge) => {
              const styling = getBadgeStyling(badge);
              const CategoryIcon = getCategoryIcon(badge.category);
              
              return (
                <Card 
                  key={badge.badge_id}
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl group ${
                    styling.glow ? 'shadow-lg' : ''
                  }`}
                >
                  <CardContent className="p-0">
                    {/* Badge Header */}
                    <div className={`p-4 border-b-2 ${styling.bg}`}>
                      <div className="text-center space-y-2">
                        <div className="text-4xl">{badge.icon}</div>
                        <h4 className={`font-bold ${styling.bg.includes('text-') ? '' : styling.bg.split(' ').find(c => c.startsWith('text-')) || 'text-gray-800'}`}>
                          {badge.name}
                        </h4>
                        
                        {displaySettings.show_rarity && (
                          <div className="flex items-center justify-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              <CategoryIcon className="w-3 h-3 mr-1" />
                              {badge.category}
                            </Badge>
                            {badge.social_proof_value > 20 && (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Rare
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Badge Details */}
                    <div className="p-4 space-y-3">
                      <p className="text-sm text-gray-700 text-center">
                        {badge.description}
                      </p>

                      {/* Social Proof Value */}
                      {badge.social_proof_value > 0 && (
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-gray-600">
                            Social Value: {badge.social_proof_value}
                          </span>
                        </div>
                      )}

                      {/* Earned Date */}
                      {displaySettings.show_earned_date && (
                        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>Earned {formatEarnedDate(badge.earned_at)}</span>
                        </div>
                      )}

                      {/* Share Button */}
                      {onBadgeShare && (
                        <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onBadgeShare(badge)}
                            className="w-full"
                          >
                            <Share2 className="w-3 h-3 mr-1" />
                            Share Badge
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Glow Effect for Special Badges */}
                    {styling.glow && (
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-transparent to-yellow-400/20 pointer-events-none" />
                    )}

                    {/* High Value Badge Indicator */}
                    {badge.social_proof_value > 30 && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredBadges.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Award className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {selectedCategory === 'all' ? 'No Badges Yet' : `No ${selectedCategory} Badges`}
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedCategory === 'all' 
                    ? 'Complete achievements to earn your first badges!'
                    : `Unlock ${selectedCategory} achievements to earn badges in this category.`
                  }
                </p>
                <Button variant="outline" onClick={() => setSelectedCategory('all')}>
                  <Target className="w-4 h-4 mr-2" />
                  View All Categories
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Badge Statistics */}
          {badges.length > 0 && !compact && (
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span>Badge Collection Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-purple-600">{badges.length}</div>
                    <div className="text-sm text-gray-600">Total Badges</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-blue-600">
                      {badges.filter(b => b.social_proof_value > 20).length}
                    </div>
                    <div className="text-sm text-gray-600">Rare Badges</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">
                      {Math.round(badges.reduce((sum, b) => sum + b.social_proof_value, 0) / badges.length) || 0}
                    </div>
                    <div className="text-sm text-gray-600">Avg Social Value</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-orange-600">
                      {new Set(badges.map(b => b.category)).size}
                    </div>
                    <div className="text-sm text-gray-600">Categories</div>
                  </div>
                </div>

                {/* Most Recent Badge */}
                {badges.length > 0 && (
                  <div className="mt-6 p-3 bg-white border border-purple-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{badges[0].icon}</span>
                      <div>
                        <div className="font-medium">Latest Badge: {badges[0].name}</div>
                        <div className="text-sm text-gray-600">
                          Earned {formatEarnedDate(badges[0].earned_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      );
  }
}

// Badge showcase for homepage/profile display
export function BadgeShowcase({ 
  badges, 
  title = 'Recent Achievements',
  maxDisplay = 4 
}: { 
  badges: GamificationBadge[]; 
  title?: string;
  maxDisplay?: number;
}) {
  const displayBadges = badges
    .sort((a, b) => b.social_proof_value - a.social_proof_value)
    .slice(0, maxDisplay);

  if (displayBadges.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-medium flex items-center space-x-2">
        <Trophy className="w-4 h-4 text-purple-600" />
        <span>{title}</span>
      </h4>
      
      <div className="flex space-x-3">
        {displayBadges.map((badge) => (
          <div
            key={badge.badge_id}
            className="text-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            title={badge.description}
          >
            <div className="text-2xl mb-1">{badge.icon}</div>
            <div className="text-xs font-medium text-gray-800 truncate max-w-16">
              {badge.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}