import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Star,
  Target,
  Award,
  Sparkles
} from 'lucide-react';
import type { CollectionInsights } from '@/lib/types/collection-analytics';

interface CollectionInsightsProps {
  insights: CollectionInsights;
}

/**
 * Collection Insights Component - Task 2.1 (Phase 1B)
 * 
 * Displays comprehensive collection analytics and insights.
 * Shows scent profile analysis, discovery stats, social context, and engagement metrics.
 */
export function CollectionInsights({ insights }: CollectionInsightsProps) {
  const {
    scent_profile_analysis,
    discovery_stats,
    social_context,
    engagement_metrics,
  } = insights;

  // Format seasonal preferences
  const topSeasons = scent_profile_analysis.seasonal_patterns
    .sort((a, b) => b.preference_strength - a.preference_strength)
    .slice(0, 2);

  // Get engagement level color
  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'expert':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'intermediate':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Scent Profile Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
            Your Scent Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dominant Families */}
          <div>
            <h4 className="text-sm font-medium mb-2">Favorite Families</h4>
            <div className="flex flex-wrap gap-2">
              {scent_profile_analysis.dominant_families.slice(0, 3).map((family) => (
                <Badge key={family} variant="secondary" className="text-xs">
                  {family}
                </Badge>
              ))}
            </div>
          </div>

          {/* Seasonal Preferences */}
          {topSeasons.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Seasonal Preferences</h4>
              <div className="space-y-2">
                {topSeasons.map((season) => (
                  <div key={season.season} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{season.season}</span>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={season.preference_strength * 100} 
                        className="w-16 h-2"
                      />
                      <span className="text-xs text-gray-500 w-8">
                        {Math.round(season.preference_strength * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complexity Preference */}
          <div className="flex items-center justify-between">
            <span className="text-sm">Complexity Style</span>
            <Badge variant="outline" className="text-xs capitalize">
              {scent_profile_analysis.complexity_preference}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Discovery Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Discovery Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {discovery_stats.quiz_accuracy_score}%
              </div>
              <div className="text-xs text-gray-500">Quiz Accuracy</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {Math.round(discovery_stats.exploration_diversity)}%
              </div>
              <div className="text-xs text-gray-500">Diversity Score</div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Collection Growth</span>
              <span className="text-sm font-medium">
                {discovery_stats.collection_growth_rate.toFixed(1)}x
              </span>
            </div>
            <Progress 
              value={Math.min(100, discovery_stats.collection_growth_rate * 20)} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Users className="w-5 h-5 mr-2 text-orange-600" />
            Community Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Similar Users</span>
            <span className="text-sm font-medium">
              {social_context.similar_users_count}+ people
            </span>
          </div>

          {social_context.trending_in_collection.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Trending in Your Collection</h4>
              <div className="space-y-1">
                {social_context.trending_in_collection.slice(0, 3).map((fragrance, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span className="text-sm truncate">{fragrance}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm">Social Engagement</span>
            <Badge variant={social_context.sharing_activity > 0 ? 'default' : 'outline'}>
              {social_context.sharing_activity > 0 ? 'Active' : 'Private'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Award className="w-5 h-5 mr-2 text-purple-600" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Engagement Level */}
          <div className="flex items-center justify-between">
            <span className="text-sm">Level</span>
            <Badge className={getEngagementColor(engagement_metrics.engagement_level)}>
              {engagement_metrics.engagement_level}
            </Badge>
          </div>

          {/* Score Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Engagement Score</span>
              <span className="text-sm font-medium">
                {engagement_metrics.engagement_score}/1000
              </span>
            </div>
            <Progress 
              value={(engagement_metrics.engagement_score / 1000) * 100} 
              className="h-2"
            />
          </div>

          {/* Days Active */}
          <div className="flex items-center justify-between">
            <span className="text-sm">Days Active</span>
            <span className="text-sm font-medium">
              {engagement_metrics.days_active} days
            </span>
          </div>

          {/* Milestone Progress */}
          {engagement_metrics.milestone_progress.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Milestone Progress</h4>
              <div className="space-y-2">
                {engagement_metrics.milestone_progress.slice(0, 2).map((milestone) => (
                  <div key={milestone.milestone_type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">
                        {milestone.milestone_type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {milestone.current_progress}/{milestone.target}
                      </span>
                    </div>
                    <Progress 
                      value={(milestone.current_progress / milestone.target) * 100}
                      className="h-1.5"
                    />
                    {milestone.completed && (
                      <div className="flex items-center mt-1">
                        <Target className="w-3 h-3 text-green-600 mr-1" />
                        <span className="text-xs text-green-600">Completed!</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center text-lg text-purple-800">
            <Star className="w-5 h-5 mr-2" />
            Insights Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {/* Personalized insights based on data */}
            {scent_profile_analysis.dominant_families.length > 0 && (
              <p className="text-purple-700">
                <strong>Your Style:</strong> You gravitate toward{' '}
                {scent_profile_analysis.dominant_families.slice(0, 2).join(' and ')}{' '}
                fragrances with a {scent_profile_analysis.complexity_preference} approach.
              </p>
            )}

            {topSeasons.length > 0 && (
              <p className="text-purple-700">
                <strong>Seasonal Pattern:</strong> You prefer{' '}
                {topSeasons[0]?.season} scents ({Math.round((topSeasons[0]?.preference_strength || 0) * 100)}% of collection).
              </p>
            )}

            {engagement_metrics.engagement_level === 'beginner' && (
              <p className="text-purple-700">
                <strong>Next Steps:</strong> Try rating more fragrances and exploring new scent families to unlock deeper insights.
              </p>
            )}

            {engagement_metrics.engagement_level === 'intermediate' && (
              <p className="text-purple-700">
                <strong>Growing Collection:</strong> You're building a diverse collection. Consider sharing your favorites with the community!
              </p>
            )}

            {engagement_metrics.engagement_level === 'expert' && (
              <p className="text-purple-700">
                <strong>Collection Expert:</strong> Your curated collection shows sophisticated taste. Perfect for discovering niche recommendations!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}