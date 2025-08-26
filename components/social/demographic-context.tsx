'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  Star, 
  BarChart3,
  Calendar,
  GraduationCap,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Target
} from 'lucide-react';
import type { SocialContext } from '@/lib/services/social-context';

interface DemographicContextProps {
  context: SocialContext;
  userAgeGroup?: string;
  userExperienceLevel?: string;
  className?: string;
}

interface AgeGroupData {
  age_group: string;
  approval_rating: number;
  user_count: number;
  love_percentage: number;
  confidence: number;
  dominant_occasions: string[];
  popular_times: string[];
}

interface ExperienceLevelData {
  experience_level: string;
  approval_rating: number;
  user_count: number;
  beginner_friendly_score: number;
  learning_value: number;
}

/**
 * Demographic Context Component  
 * Shows age group popularity indicators and demographic breakdowns
 */
export function DemographicContext({ 
  context, 
  userAgeGroup, 
  userExperienceLevel,
  className = ''
}: DemographicContextProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('age');

  // Mock demographic data - in real implementation, this would come from the social context service
  const ageGroupData: AgeGroupData[] = [
    {
      age_group: '18-24',
      approval_rating: 4.3,
      user_count: 847,
      love_percentage: 82,
      confidence: 0.89,
      dominant_occasions: ['College', 'Dating', 'Work'],
      popular_times: ['Day', 'Evening']
    },
    {
      age_group: '25-34', 
      approval_rating: 4.1,
      user_count: 542,
      love_percentage: 78,
      confidence: 0.86,
      dominant_occasions: ['Work', 'Social Events', 'Travel'],
      popular_times: ['Day', 'Office']
    },
    {
      age_group: '35-44',
      approval_rating: 3.9,
      user_count: 298,
      love_percentage: 71,
      confidence: 0.73,
      dominant_occasions: ['Professional', 'Family Events'],
      popular_times: ['Day']
    }
  ];

  const experienceLevelData: ExperienceLevelData[] = [
    {
      experience_level: 'beginner',
      approval_rating: 4.4,
      user_count: 623,
      beginner_friendly_score: 4.6,
      learning_value: 4.2
    },
    {
      experience_level: 'intermediate',
      approval_rating: 4.1,
      user_count: 389,
      beginner_friendly_score: 3.8,
      learning_value: 3.9
    },
    {
      experience_level: 'experienced',
      approval_rating: 3.8,
      user_count: 156,
      beginner_friendly_score: 3.2,
      learning_value: 3.5
    }
  ];

  if (!context.overall.total_approvals) {
    return null;
  }

  const userAgeData = ageGroupData.find(data => data.age_group === userAgeGroup);
  const userExpData = experienceLevelData.find(data => data.experience_level === userExperienceLevel);

  const getAgeGroupLabel = (ageGroup: string) => {
    const labels = {
      '13-17': 'Teens',
      '18-24': 'College Age',
      '25-34': 'Young Adults', 
      '35-44': 'Mid-Career',
      '45-54': 'Established',
      '55-64': 'Mature',
      '65+': 'Senior'
    };
    return labels[ageGroup as keyof typeof labels] || ageGroup;
  };

  const getPopularityLevel = (percentage: number) => {
    if (percentage >= 85) return { level: 'Extremely Popular', color: 'text-green-600' };
    if (percentage >= 75) return { level: 'Very Popular', color: 'text-blue-600' };
    if (percentage >= 65) return { level: 'Popular', color: 'text-yellow-600' };
    if (percentage >= 50) return { level: 'Moderately Popular', color: 'text-orange-600' };
    return { level: 'Niche Appeal', color: 'text-gray-600' };
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Your Demographic Highlight */}
      {userAgeData && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    Popular with {getAgeGroupLabel(userAgeGroup!)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {userAgeData.user_count} people in your age group rated this
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-lg">
                    {userAgeData.approval_rating.toFixed(1)}
                  </span>
                </div>
                <Badge variant="default" className="text-xs">
                  {userAgeData.love_percentage}% satisfaction
                </Badge>
              </div>
            </div>

            {/* Quick Occasions */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Popular for:</span>
              {userAgeData.dominant_occasions.slice(0, 3).map((occasion, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {occasion}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Demographics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Demographic Breakdown
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        
        {showDetails && (
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="age">By Age Group</TabsTrigger>
                <TabsTrigger value="experience">By Experience</TabsTrigger>
              </TabsList>

              <TabsContent value="age" className="space-y-4 mt-4">
                {ageGroupData.map((data, index) => {
                  const isUserGroup = data.age_group === userAgeGroup;
                  const popularity = getPopularityLevel(data.love_percentage);
                  
                  return (
                    <div 
                      key={data.age_group} 
                      className={`p-3 rounded-lg border ${
                        isUserGroup ? 'border-primary bg-primary/5' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {data.age_group} ({getAgeGroupLabel(data.age_group)})
                          </span>
                          {isUserGroup && (
                            <Badge variant="default" className="text-xs">You</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {data.approval_rating.toFixed(1)}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {data.user_count} users
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Satisfaction rate</span>
                          <span className={`font-medium ${popularity.color}`}>
                            {popularity.level} ({data.love_percentage}%)
                          </span>
                        </div>
                        <Progress value={data.love_percentage} className="h-2" />
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Popular occasions:</span>
                          {data.dominant_occasions.slice(0, 2).map((occasion, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {occasion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="experience" className="space-y-4 mt-4">
                {experienceLevelData.map((data, index) => {
                  const isUserLevel = data.experience_level === userExperienceLevel;
                  
                  return (
                    <div 
                      key={data.experience_level}
                      className={`p-3 rounded-lg border ${
                        isUserLevel ? 'border-primary bg-primary/5' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            {data.experience_level === 'beginner' && <GraduationCap className="h-4 w-4" />}
                            {data.experience_level === 'intermediate' && <Target className="h-4 w-4" />}
                            {data.experience_level === 'experienced' && <Briefcase className="h-4 w-4" />}
                            <span className="font-medium capitalize">
                              {data.experience_level}
                            </span>
                          </div>
                          {isUserLevel && (
                            <Badge variant="default" className="text-xs">You</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {data.approval_rating.toFixed(1)}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {data.user_count} users
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Beginner-friendly:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={data.beginner_friendly_score * 20} className="flex-1 h-1" />
                            <span className="font-medium">
                              {data.beginner_friendly_score.toFixed(1)}/5
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-muted-foreground">Learning value:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={data.learning_value * 20} className="flex-1 h-1" />
                            <span className="font-medium">
                              {data.learning_value.toFixed(1)}/5
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>

      {/* Social Context Summary */}
      {userAgeData && userExpData && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Your Social Context
            </h4>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-muted-foreground">Age group approval:</span>
                <div className="flex items-center gap-2">
                  <Progress value={userAgeData.love_percentage} className="w-16 h-2" />
                  <span className="font-medium">{userAgeData.love_percentage}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-muted-foreground">Experience level match:</span>
                <div className="flex items-center gap-2">
                  <Progress value={userExpData.approval_rating * 20} className="w-16 h-2" />
                  <span className="font-medium">{userExpData.approval_rating.toFixed(1)}/5</span>
                </div>
              </div>

              {userExperienceLevel === 'beginner' && userExpData.beginner_friendly_score >= 4.0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <GraduationCap className="h-4 w-4" />
                    <span className="font-medium text-sm">Perfect for Beginners</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    This fragrance scores {userExpData.beginner_friendly_score.toFixed(1)}/5 for beginner-friendliness 
                    among your experience level.
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

interface QuickDemographicIndicatorProps {
  ageGroup: string;
  approvalRate: number;
  userCount: number;
  className?: string;
}

/**
 * Quick Demographic Indicator for card layouts
 */
export function QuickDemographicIndicator({ 
  ageGroup, 
  approvalRate, 
  userCount,
  className = ''
}: QuickDemographicIndicatorProps) {
  const getAgeEmoji = (age: string) => {
    if (age.includes('18-24')) return '🎓';
    if (age.includes('25-34')) return '💼';
    if (age.includes('35-44')) return '👔';
    return '👥';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm">{getAgeEmoji(ageGroup)}</span>
      <div>
        <span className="text-xs font-medium">
          Popular with {ageGroup.replace('-', '–')}
        </span>
        <div className="text-xs text-muted-foreground">
          {Math.round(approvalRate * 20)}% satisfaction • {userCount} users
        </div>
      </div>
    </div>
  );
}