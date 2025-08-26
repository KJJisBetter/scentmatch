'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Clock, 
  Users, 
  Heart, 
  Star, 
  TrendingUp,
  Zap,
  Calendar,
  MapPin,
  Award,
  Sparkles
} from 'lucide-react';
import { socialProofService } from '@/lib/services/social-proof';

interface CommunityActivityProps {
  variant?: 'feed' | 'ticker' | 'sidebar' | 'dashboard';
  maxItems?: number;
  refreshInterval?: number;
  showTimestamps?: boolean;
  animated?: boolean;
  filterByLocation?: string;
}

interface ActivityItem {
  id: string;
  user_name: string;
  action: string;
  details?: string;
  timestamp: string;
  location: string;
  action_type?: 'quiz' | 'collection' | 'rating' | 'sharing';
}

/**
 * Community Activity Component - Task 3.2 (Phase 1C)
 * 
 * Displays real-time community activity to create social proof and engagement.
 * Shows what other users are doing to encourage similar actions.
 * 
 * Features:
 * - Real-time activity feed with live updates
 * - Multiple display variants for different contexts
 * - Anonymized user activity for privacy
 * - Action filtering and categorization
 * - Social engagement indicators
 * - Performance optimized with smart refresh
 */
export function CommunityActivity({
  variant = 'feed',
  maxItems = 10,
  refreshInterval = 15000, // 15 seconds for activity feed
  showTimestamps = true,
  animated = true,
  filterByLocation
}: CommunityActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Load real-time activity
  useEffect(() => {
    if (isPaused) return;

    const loadActivity = async () => {
      try {
        const activityData = await socialProofService.getRealTimeActivity(maxItems);
        
        // Filter by location if specified
        const filteredActivity = filterByLocation 
          ? activityData.filter(item => item.location.toLowerCase() === filterByLocation.toLowerCase())
          : activityData;

        setActivities(filteredActivity);
      } catch (error) {
        console.error('Failed to load community activity:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivity();

    // Set up refresh interval
    const interval = setInterval(loadActivity, refreshInterval);
    return () => clearInterval(interval);
  }, [maxItems, refreshInterval, isPaused, filterByLocation]);

  // Get action icon and color
  const getActionStyling = (action: string) => {
    if (action.includes('quiz')) {
      return { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-100' };
    } else if (action.includes('added') || action.includes('collection')) {
      return { icon: Heart, color: 'text-red-500', bg: 'bg-red-100' };
    } else if (action.includes('rated')) {
      return { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-100' };
    } else if (action.includes('shared')) {
      return { icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-100' };
    } else {
      return { icon: Activity, color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return time.toLocaleDateString();
  };

  if (isLoading) {
    return <CommunityActivitySkeleton variant={variant} />;
  }

  // Render different variants
  switch (variant) {
    case 'ticker':
      return (
        <div className="bg-gray-50 border-y border-gray-200 py-2 overflow-hidden">
          <div className={`flex space-x-8 ${animated ? 'animate-scroll' : ''}`}>
            {activities.slice(0, 5).map((activity) => {
              const styling = getActionStyling(activity.action);
              const ActionIcon = styling.icon;
              
              return (
                <div key={activity.id} className="flex items-center space-x-2 text-sm whitespace-nowrap">
                  <ActionIcon className={`w-3 h-3 ${styling.color}`} />
                  <span className="font-medium">{activity.user_name}</span>
                  <span className="text-gray-600">{activity.action}</span>
                  {activity.details && (
                    <Badge variant="secondary" className="text-xs">
                      {activity.details}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'sidebar':
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <span>Live Activity</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
                className="h-6 text-xs"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.slice(0, 5).map((activity) => {
              const styling = getActionStyling(activity.action);
              const ActionIcon = styling.icon;
              
              return (
                <div key={activity.id} className="flex items-start space-x-2">
                  <div className={`p-1 rounded-full ${styling.bg} flex-shrink-0 mt-0.5`}>
                    <ActionIcon className={`w-3 h-3 ${styling.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user_name}</span>
                      <span className="text-gray-600"> {activity.action}</span>
                    </p>
                    {activity.details && (
                      <p className="text-xs text-gray-500">{activity.details}</p>
                    )}
                    {showTimestamps && (
                      <p className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                    )}
                  </div>
                </div>
              );
            })}
            
            {activities.length === 0 && (
              <div className="text-center py-4 text-sm text-gray-500">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>
      );

    case 'dashboard':
      return (
        <div className="space-y-4">
          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <span>Community Pulse</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-purple-600">
                    {activities.filter(a => a.action.includes('quiz')).length}
                  </div>
                  <div className="text-xs text-gray-600">Quizzes</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">
                    {activities.filter(a => a.action.includes('added')).length}
                  </div>
                  <div className="text-xs text-gray-600">Collections</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-600">
                    {activities.filter(a => a.action.includes('rated')).length}
                  </div>
                  <div className="text-xs text-gray-600">Ratings</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {activities.filter(a => a.action.includes('shared')).length}
                  </div>
                  <div className="text-xs text-gray-600">Shares</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Recent Activity</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Last hour
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {activities.map((activity) => {
                  const styling = getActionStyling(activity.action);
                  const ActionIcon = styling.icon;
                  
                  return (
                    <div key={activity.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className={`p-2 rounded-full ${styling.bg}`}>
                        <ActionIcon className={`w-4 h-4 ${styling.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user_name}</span>
                          <span className="text-gray-600"> {activity.action}</span>
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {activity.details && (
                            <Badge variant="outline" className="text-xs">
                              {activity.details}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {activity.location} • {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {activities.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );

    case 'feed':
    default:
      return (
        <div className="space-y-3">
          {activities.map((activity) => {
            const styling = getActionStyling(activity.action);
            const ActionIcon = styling.icon;
            
            return (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${styling.bg}`}>
                      <ActionIcon className={`w-4 h-4 ${styling.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user_name}</span>
                        <span className="text-gray-600"> {activity.action}</span>
                      </p>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        {activity.details && (
                          <Badge variant="outline" className="text-xs">
                            {activity.details}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {activity.location}
                        </Badge>
                        {showTimestamps && (
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action-specific indicators */}
                    {activity.action.includes('quiz') && (
                      <div className="text-purple-600">
                        <Sparkles className="w-5 h-5" />
                      </div>
                    )}
                    
                    {activity.action.includes('shared') && (
                      <div className="text-blue-600">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {activities.length === 0 && (
            <Card className="text-center py-8">
              <CardContent>
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="font-medium text-gray-900 mb-2">No Recent Activity</h3>
                <p className="text-sm text-gray-600">
                  Be the first to take action in the community!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      );
  }
}

/**
 * Community Milestones Component
 * 
 * Shows community-wide achievements and milestones for social proof
 */
export function CommunityMilestones() {
  const [milestones, setMilestones] = useState([
    {
      id: 'users_50k',
      title: '50,000 Users',
      description: 'Reached 50k registered fragrance enthusiasts',
      achieved: true,
      achievement_date: '2025-08-20',
      celebration_emoji: '🎉'
    },
    {
      id: 'collections_10k',
      title: '10,000 Collections',
      description: 'Community created 10k fragrance collections',
      achieved: true,
      achievement_date: '2025-08-22',
      celebration_emoji: '💎'
    },
    {
      id: 'accuracy_90',
      title: '90% Average Accuracy',
      description: 'AI quiz accuracy reached 90% average',
      achieved: false,
      progress: 87,
      target: 90,
      celebration_emoji: '🎯'
    }
  ]);

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-purple-600" />
          <span>Community Milestones</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="flex items-center space-x-3">
              <div className="text-2xl">{milestone.celebration_emoji}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-purple-800">{milestone.title}</span>
                  {milestone.achieved && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      Achieved
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-purple-700">{milestone.description}</p>
                {milestone.achieved && milestone.achievement_date && (
                  <p className="text-xs text-purple-600">
                    Achieved on {new Date(milestone.achievement_date).toLocaleDateString()}
                  </p>
                )}
                {!milestone.achieved && milestone.progress && milestone.target && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-purple-600">
                      <span>Progress</span>
                      <span>{milestone.progress}% / {milestone.target}%</span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(milestone.progress / milestone.target) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Peer Activity Comparison
 * 
 * Shows how user's activity compares to similar users
 */
export function PeerActivityComparison({
  userStats,
  showDetails = false
}: {
  userStats: {
    collection_size: number;
    engagement_level: string;
    days_active: number;
  };
  showDetails?: boolean;
}) {
  // Mock peer data (would be calculated from real user data)
  const peerComparison = {
    collection_size_percentile: Math.min(95, userStats.collection_size * 8),
    engagement_percentile: userStats.engagement_level === 'expert' ? 90 : 
                           userStats.engagement_level === 'intermediate' ? 65 : 35,
    activity_percentile: Math.min(95, userStats.days_active * 2)
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 80) return 'text-green-600';
    if (percentile >= 50) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getPercentileMessage = (percentile: number) => {
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Above Average';
    return 'Growing';
  };

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-base">
          <Users className="w-4 h-4 text-blue-600" />
          <span>Community Standing</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Collection Size</span>
            <div className="flex items-center space-x-2">
              <Badge className={`text-xs ${getPercentileColor(peerComparison.collection_size_percentile)}`}>
                {getPercentileMessage(peerComparison.collection_size_percentile)}
              </Badge>
              {showDetails && (
                <span className="text-xs text-gray-500">
                  {peerComparison.collection_size_percentile}th percentile
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Engagement</span>
            <div className="flex items-center space-x-2">
              <Badge className={`text-xs ${getPercentileColor(peerComparison.engagement_percentile)}`}>
                {getPercentileMessage(peerComparison.engagement_percentile)}
              </Badge>
              {showDetails && (
                <span className="text-xs text-gray-500">
                  {peerComparison.engagement_percentile}th percentile
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Activity Level</span>
            <div className="flex items-center space-x-2">
              <Badge className={`text-xs ${getPercentileColor(peerComparison.activity_percentile)}`}>
                {getPercentileMessage(peerComparison.activity_percentile)}
              </Badge>
              {showDetails && (
                <span className="text-xs text-gray-500">
                  {peerComparison.activity_percentile}th percentile
                </span>
              )}
            </div>
          </div>

          {showDetails && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>You're doing great!</strong> Your engagement level puts you ahead of most users. 
                Keep exploring and rating fragrances to maintain your community standing.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for community activity
 */
function CommunityActivitySkeleton({ variant }: { variant: string }) {
  switch (variant) {
    case 'ticker':
      return (
        <div className="bg-gray-50 border-y border-gray-200 py-2">
          <div className="flex space-x-8 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-300 rounded-full" />
                <div className="h-4 bg-gray-300 rounded w-20" />
                <div className="h-4 bg-gray-300 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      );
      
    case 'sidebar':
      return (
        <Card className="animate-pulse">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-300 rounded" />
              <div className="h-4 bg-gray-300 rounded w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-300 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-full mb-1" />
                  <div className="h-3 bg-gray-300 rounded w-2/3" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      );
      
    default:
      return (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-full mb-2" />
                    <div className="h-3 bg-gray-300 rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
  }
}