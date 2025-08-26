'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Award, 
  Star, 
  Crown, 
  Trophy,
  Gift,
  Sparkles,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  Zap
} from 'lucide-react';
import type { MilestoneProgress } from '@/lib/types/collection-analytics';
import type { ProgressiveJourney } from '@/lib/services/progressive-engagement';

interface CollectionMilestonesProps {
  userId: string;
  currentMilestones?: MilestoneProgress[];
  progressiveJourney?: ProgressiveJourney;
  showCelebrations?: boolean;
  compact?: boolean;
  onMilestoneClick?: (milestone: MilestoneProgress) => void;
}

interface MilestoneCelebration {
  milestone_type: string;
  celebration_message: string;
  reward_unlocked: string;
  show: boolean;
}

/**
 * Collection Milestones Component - Task 4.1 (Phase 1D)
 * 
 * Displays milestone progress, achievements, and celebrations to drive
 * progressive collection building. Shows clear goals and rewards to
 * encourage continued engagement.
 * 
 * Features:
 * - Visual milestone progress tracking
 * - Achievement celebrations with animations
 * - Reward unlock notifications
 * - Timeline visualization
 * - Personalized milestone recommendations
 * - Social sharing integration for achievements
 */
export function CollectionMilestones({
  userId,
  currentMilestones = [],
  progressiveJourney,
  showCelebrations = true,
  compact = false,
  onMilestoneClick
}: CollectionMilestonesProps) {
  const [celebrations, setCelebrations] = useState<MilestoneCelebration[]>([]);
  const [showDetails, setShowDetails] = useState(!compact);

  // Default milestones if none provided
  const defaultMilestones: MilestoneProgress[] = [
    {
      milestone_type: 'First Steps',
      current_progress: 3,
      target: 5,
      completed: false,
      estimated_completion: '3-5 days',
      reward_unlocked: 'Basic Insights',
      next_milestone: 'Collection Builder'
    },
    {
      milestone_type: 'Collection Builder',
      current_progress: 8,
      target: 15,
      completed: false,
      estimated_completion: '2-3 weeks',
      reward_unlocked: 'Advanced Analytics',
      next_milestone: 'Fragrance Explorer'
    },
    {
      milestone_type: 'Fragrance Explorer',
      current_progress: 0,
      target: 25,
      completed: false,
      estimated_completion: '1-2 months',
      reward_unlocked: 'Community Features'
    },
    {
      milestone_type: 'Connoisseur',
      current_progress: 0,
      target: 50,
      completed: false,
      estimated_completion: '3-6 months',
      reward_unlocked: 'Expert Recommendations'
    }
  ];

  const milestones = currentMilestones.length > 0 ? currentMilestones : defaultMilestones;

  // Check for new completions
  useEffect(() => {
    const newCelebrations: MilestoneCelebration[] = [];

    milestones.forEach(milestone => {
      if (milestone.completed && milestone.reward_unlocked && showCelebrations) {
        // Check if we should show celebration (e.g., recently completed)
        const shouldCelebrate = true; // Would check if celebration was already shown
        
        if (shouldCelebrate) {
          newCelebrations.push({
            milestone_type: milestone.milestone_type,
            celebration_message: `Amazing! You've reached the ${milestone.milestone_type} milestone!`,
            reward_unlocked: milestone.reward_unlocked,
            show: true
          });
        }
      }
    });

    setCelebrations(newCelebrations);
  }, [milestones, showCelebrations]);

  // Get milestone icon and styling
  const getMilestoneIcon = (milestoneType: string, completed: boolean) => {
    const iconMap: Record<string, any> = {
      'First Steps': Target,
      'Collection Builder': Star,
      'Fragrance Explorer': Sparkles,
      'Active Collector': TrendingUp,
      'Connoisseur': Crown,
      'Expert': Trophy,
      'Master': Award
    };

    const IconComponent = iconMap[milestoneType] || Target;
    const colorClass = completed 
      ? 'text-green-600 bg-green-100' 
      : 'text-purple-600 bg-purple-100';

    return { IconComponent, colorClass };
  };

  // Get progress color
  const getProgressColor = (progress: number): string => {
    if (progress === 100) return 'bg-green-600';
    if (progress >= 75) return 'bg-blue-600';
    if (progress >= 50) return 'bg-purple-600';
    if (progress >= 25) return 'bg-yellow-600';
    return 'bg-gray-400';
  };

  // Dismiss celebration
  const dismissCelebration = (milestoneType: string) => {
    setCelebrations(prev => 
      prev.map(celebration => 
        celebration.milestone_type === milestoneType 
          ? { ...celebration, show: false }
          : celebration
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Milestone Celebrations */}
      {celebrations.filter(c => c.show).map((celebration) => (
        <Card key={celebration.milestone_type} className="border-green-300 bg-green-50 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-4xl animate-bounce">🎉</div>
              <div>
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  {celebration.celebration_message}
                </h3>
                <p className="text-green-700">
                  You've unlocked: <strong>{celebration.reward_unlocked}</strong>
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-3">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    // Handle claim reward action
                    console.log('Claim reward:', celebration.reward_unlocked);
                  }}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Claim Reward
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dismissCelebration(celebration.milestone_type)}
                >
                  Continue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Milestone Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              <span>Collection Milestones</span>
            </CardTitle>
            
            {!compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Collapse' : 'Expand'}
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {milestones.map((milestone, index) => {
              const { IconComponent, colorClass } = getMilestoneIcon(
                milestone.milestone_type, 
                milestone.completed
              );
              const progressPercentage = (milestone.current_progress / milestone.target) * 100;

              return (
                <div 
                  key={milestone.milestone_type}
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    milestone.completed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200 hover:border-purple-300'
                  } ${onMilestoneClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onMilestoneClick?.(milestone)}
                >
                  <div className="flex items-center space-x-4">
                    {/* Milestone Icon */}
                    <div className={`p-3 rounded-full ${colorClass}`}>
                      {milestone.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <IconComponent className="w-6 h-6" />
                      )}
                    </div>

                    {/* Milestone Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-lg">
                          {milestone.milestone_type}
                        </h4>
                        
                        {milestone.completed && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                        
                        {!milestone.completed && index === 0 && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Current Goal
                          </Badge>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            Progress: {milestone.current_progress} / {milestone.target}
                          </span>
                          {!milestone.completed && milestone.estimated_completion && (
                            <span className="text-gray-500">
                              Est. {milestone.estimated_completion}
                            </span>
                          )}
                        </div>
                        
                        <Progress 
                          value={progressPercentage}
                          className="h-3"
                        />
                        
                        {showDetails && (
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{Math.round(progressPercentage)}% complete</span>
                            {milestone.reward_unlocked && (
                              <span className="flex items-center">
                                <Gift className="w-3 h-3 mr-1" />
                                Unlocks: {milestone.reward_unlocked}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Next Milestone Preview */}
                      {milestone.completed && milestone.next_milestone && showDetails && (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          <div className="flex items-center text-blue-700">
                            <ArrowRight className="w-3 h-3 mr-1" />
                            Next: {milestone.next_milestone}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {!milestone.completed && index === 0 && (
                      <div className="text-center">
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle "work on milestone" action
                            console.log('Work on milestone:', milestone.milestone_type);
                          }}
                        >
                          <Zap className="w-4 h-4 mr-1" />
                          Continue
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Milestone Summary */}
          {showDetails && (
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-purple-600">
                    {milestones.filter(m => m.completed).length}
                  </div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {milestones.filter(m => !m.completed).length}
                  </div>
                  <div className="text-xs text-gray-600">Remaining</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {milestones.filter(m => m.reward_unlocked && m.completed).length}
                  </div>
                  <div className="text-xs text-gray-600">Rewards</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600">
                    {Math.round(milestones.reduce((sum, m) => sum + (m.current_progress / m.target), 0) / milestones.length * 100)}%
                  </div>
                  <div className="text-xs text-gray-600">Overall</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    {/* Progressive Journey Stage */}
    {progressiveJourney && (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Your Journey Stage</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Stage */}
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-blue-800">
                  {progressiveJourney.current_stage.stage_name}
                </h4>
                <p className="text-sm text-blue-700">
                  {progressiveJourney.current_stage.description}
                </p>
                <div className="mt-2">
                  <Progress 
                    value={progressiveJourney.current_stage.current_progress}
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-blue-600 mt-1">
                    <span>{progressiveJourney.current_stage.current_progress}% complete</span>
                    <span>Target: {progressiveJourney.current_stage.target_collection_size} fragrances</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Journey Health Score */}
            <div className="border-t border-blue-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Journey Health</span>
                <Badge className={`text-xs ${
                  progressiveJourney.journey_health_score >= 80 ? 'bg-green-100 text-green-800' :
                  progressiveJourney.journey_health_score >= 60 ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {progressiveJourney.journey_health_score}/100
                </Badge>
              </div>
              
              <Progress 
                value={progressiveJourney.journey_health_score}
                className="h-2"
              />
              
              <div className="text-xs text-blue-600 mt-2">
                {progressiveJourney.journey_health_score >= 80 && 'Excellent progress! You\'re on track for all milestones.'}
                {progressiveJourney.journey_health_score >= 60 && progressiveJourney.journey_health_score < 80 && 'Good progress! Consider rating more fragrances.'}
                {progressiveJourney.journey_health_score < 60 && 'Keep exploring! Add more fragrances to improve your journey health.'}
              </div>
            </div>

            {/* Upcoming Triggers Preview */}
            {progressiveJourney.upcoming_triggers.length > 0 && (
              <div className="border-t border-blue-200 pt-4">
                <h5 className="font-medium text-blue-800 mb-2">What's Next</h5>
                <div className="space-y-2">
                  {progressiveJourney.upcoming_triggers.slice(0, 2).map((trigger, index) => (
                    <div key={trigger.trigger_id} className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-blue-700">{trigger.content.title}</span>
                      {trigger.priority === 'high' && (
                        <Badge variant="secondary" className="text-xs">
                          Priority
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Estimate */}
            {progressiveJourney.estimated_completion_timeline && (
              <div className="border-t border-blue-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">
                    Next Milestone Timeline
                  </span>
                  <span className="text-sm text-blue-600">
                    {progressiveJourney.estimated_completion_timeline.days_to_next_milestone} days
                  </span>
                </div>
                
                <div className="text-xs text-blue-600 mt-1">
                  Est. completion: {new Date(progressiveJourney.estimated_completion_timeline.estimated_completion_date).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Milestone Timeline View */}
    {!compact && showDetails && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span>Milestone Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-300" />
            
            <div className="space-y-8">
              {milestones.map((milestone, index) => {
                const { IconComponent, colorClass } = getMilestoneIcon(
                  milestone.milestone_type,
                  milestone.completed
                );
                const isActive = !milestone.completed && index === milestones.findIndex(m => !m.completed);
                const progressPercentage = (milestone.current_progress / milestone.target) * 100;

                return (
                  <div key={milestone.milestone_type} className="flex items-start space-x-4">
                    {/* Timeline Node */}
                    <div className={`relative z-10 p-2 rounded-full ${
                      milestone.completed ? 'bg-green-100' : 
                      isActive ? 'bg-purple-100 ring-4 ring-purple-200' :
                      'bg-gray-100'
                    }`}>
                      <IconComponent className={`w-4 h-4 ${
                        milestone.completed ? 'text-green-600' :
                        isActive ? 'text-purple-600' :
                        'text-gray-400'
                      }`} />
                    </div>

                    {/* Timeline Content */}
                    <div className="flex-1 min-w-0 pb-8">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className={`font-semibold ${
                          milestone.completed ? 'text-green-800' :
                          isActive ? 'text-purple-800' :
                          'text-gray-600'
                        }`}>
                          {milestone.milestone_type}
                        </h4>
                        
                        {milestone.completed && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            ✓ Complete
                          </Badge>
                        )}
                        
                        {isActive && (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            → Current
                          </Badge>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <Progress 
                          value={progressPercentage}
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{milestone.current_progress} / {milestone.target}</span>
                          <span>{Math.round(progressPercentage)}%</span>
                        </div>
                      </div>

                      {/* Milestone Details */}
                      <div className="text-sm text-gray-600">
                        {!milestone.completed && milestone.estimated_completion && (
                          <div className="flex items-center space-x-2 mb-1">
                            <Clock className="w-3 h-3" />
                            <span>Estimated completion: {milestone.estimated_completion}</span>
                          </div>
                        )}
                        
                        {milestone.reward_unlocked && (
                          <div className="flex items-center space-x-2">
                            <Gift className="w-3 h-3" />
                            <span>
                              {milestone.completed ? 'Unlocked:' : 'Unlocks:'} {milestone.reward_unlocked}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Button for Active Milestone */}
                      {isActive && (
                        <div className="mt-3">
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to action that helps complete milestone
                              console.log('Continue milestone:', milestone.milestone_type);
                            }}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Continue Building
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Milestone Tips and Motivation */}
    {!compact && (
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-4">
          <div className="space-y-3">
            <h4 className="font-medium text-purple-800 flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              Milestone Tips
            </h4>
            
            <div className="grid md:grid-cols-2 gap-3 text-sm text-purple-700">
              <div className="flex items-start space-x-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full mt-0.5 flex-shrink-0" />
                <span>Rate fragrances as you try them to improve recommendations</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1 h-4 bg-blue-500 rounded-full mt-0.5 flex-shrink-0" />
                <span>Explore different scent families to diversify your collection</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1 h-4 bg-green-500 rounded-full mt-0.5 flex-shrink-0" />
                <span>Add notes about when and where you like each fragrance</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1 h-4 bg-pink-500 rounded-full mt-0.5 flex-shrink-0" />
                <span>Share your collection to unlock community features</span>
              </div>
            </div>

            {/* Current Goal Focus */}
            {milestones.length > 0 && !milestones[0]?.completed && (
              <div className="mt-4 p-3 bg-white border border-purple-200 rounded-lg">
                <div className="flex items-center space-x-2 text-purple-800">
                  <Target className="w-4 h-4" />
                  <span className="font-medium">Current Focus</span>
                </div>
                <p className="text-sm text-purple-700 mt-1">
                  Add {(milestones[0]?.target || 0) - (milestones[0]?.current_progress || 0)} more fragrances 
                  to complete your {milestones[0]?.milestone_type} milestone and unlock {milestones[0]?.reward_unlocked}!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )}
  </div>
  );
}