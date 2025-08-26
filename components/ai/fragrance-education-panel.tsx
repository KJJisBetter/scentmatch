'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Lightbulb, 
  Award, 
  ChevronRight, 
  CheckCircle,
  Flower,
  Palette,
  Clock,
  Users
} from 'lucide-react';

interface EducationTopic {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  completed?: boolean;
}

export interface FragranceEducationPanelProps {
  currentFragrance?: {
    name: string;
    brand: string;
    scent_family?: string;
  };
  userProgress?: {
    completedTopics: string[];
    currentLevel: 'beginner' | 'intermediate' | 'advanced';
  };
  onTopicComplete?: (topicId: string) => void;
  onStartLearning?: (topicId: string) => void;
}

/**
 * Progressive education system component
 * Helps beginners learn fragrance concepts step-by-step
 * Builds confidence through guided learning paths
 */
export function FragranceEducationPanel({
  currentFragrance,
  userProgress = { completedTopics: [], currentLevel: 'beginner' },
  onTopicComplete,
  onStartLearning,
}: FragranceEducationPanelProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Education topics organized by difficulty
  const educationTopics: EducationTopic[] = [
    // Beginner topics
    {
      id: 'scent-families',
      title: 'Scent Families 101',
      description: 'Fresh, floral, oriental, woody - learn the basic groups',
      icon: Flower,
      difficulty: 'beginner',
      estimatedTime: 3,
    },
    {
      id: 'fragrance-strength',
      title: 'How Strong Should It Be?',
      description: 'Understanding EDT, EDP, and when to wear each',
      icon: Palette,
      difficulty: 'beginner',
      estimatedTime: 2,
    },
    {
      id: 'when-to-wear',
      title: 'Occasions Made Simple',
      description: 'Day vs night, casual vs formal - easy rules',
      icon: Clock,
      difficulty: 'beginner',
      estimatedTime: 2,
    },
    {
      id: 'first-fragrance',
      title: 'Your First Fragrance',
      description: 'Safe choices that work for everyone',
      icon: Award,
      difficulty: 'beginner',
      estimatedTime: 4,
    },
    // Intermediate topics
    {
      id: 'layering-basics',
      title: 'Fragrance Layering',
      description: 'Combining scents for unique results',
      icon: Palette,
      difficulty: 'intermediate',
      estimatedTime: 5,
    },
    {
      id: 'seasonal-wearing',
      title: 'Seasonal Fragrances',
      description: 'What to wear in different weather',
      icon: Clock,
      difficulty: 'intermediate',
      estimatedTime: 4,
    },
    // Advanced topics
    {
      id: 'niche-vs-designer',
      title: 'Niche vs Designer',
      description: 'Understanding the fragrance market',
      icon: Users,
      difficulty: 'advanced',
      estimatedTime: 6,
    },
  ];

  // Filter topics based on user level and show progression
  const getAvailableTopics = () => {
    const { currentLevel, completedTopics } = userProgress;
    
    return educationTopics.map(topic => ({
      ...topic,
      completed: completedTopics.includes(topic.id),
      available: 
        topic.difficulty === 'beginner' || 
        (topic.difficulty === 'intermediate' && currentLevel !== 'beginner') ||
        (topic.difficulty === 'advanced' && currentLevel === 'advanced')
    }));
  };

  const availableTopics = getAvailableTopics();
  const completedCount = availableTopics.filter(t => t.completed).length;
  const progressPercentage = (completedCount / availableTopics.length) * 100;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'green';
      case 'intermediate': return 'blue';
      case 'advanced': return 'purple';
      default: return 'gray';
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-lg">
              <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
              Fragrance Learning Center
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Build your fragrance knowledge step by step
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {userProgress.currentLevel}
          </Badge>
        </div>
        
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Learning Progress</span>
            <span className="font-medium">
              {completedCount} of {availableTopics.length} completed
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contextual Learning - Based on current fragrance */}
        {currentFragrance && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Learn about your match
                </h4>
                <p className="text-sm text-blue-700">
                  {currentFragrance.name} is a{' '}
                  <span className="font-medium">
                    {currentFragrance.scent_family || 'modern'}
                  </span>{' '}
                  fragrance. Want to understand what that means?
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 text-xs"
                  onClick={() => onStartLearning?.('scent-families')}
                >
                  Learn About Scent Families
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Learning Topics */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Available Learning Topics
          </h4>
          
          {availableTopics.map((topic) => {
            const IconComponent = topic.icon;
            const difficultyColor = getDifficultyColor(topic.difficulty);
            
            return (
              <Card 
                key={topic.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  topic.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'hover:border-gray-300'
                }`}
                onClick={() => setSelectedTopic(
                  selectedTopic === topic.id ? null : topic.id
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-${difficultyColor}-100`}>
                        <IconComponent className={`w-4 h-4 text-${difficultyColor}-600`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h5 className="text-sm font-medium">{topic.title}</h5>
                          {topic.completed && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {topic.description}
                        </p>
                        
                        <div className="flex items-center space-x-3 mt-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs bg-${difficultyColor}-50 text-${difficultyColor}-700`}
                          >
                            {topic.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {topic.estimatedTime} min read
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight 
                      className={`w-4 h-4 text-muted-foreground transition-transform ${
                        selectedTopic === topic.id ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                  
                  {/* Expanded Content */}
                  {selectedTopic === topic.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          This lesson will help you understand {topic.description.toLowerCase()}.
                          Perfect for building confidence in your fragrance choices.
                        </p>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartLearning?.(topic.id);
                            }}
                            className="text-xs"
                          >
                            {topic.completed ? 'Review' : 'Start Learning'}
                          </Button>
                          
                          {!topic.completed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTopicComplete?.(topic.id);
                              }}
                              className="text-xs"
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Achievement Badge */}
        {completedCount > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Award className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="text-sm font-medium text-green-900">
                  Great progress! 🎉
                </h4>
                <p className="text-sm text-green-700">
                  You've completed {completedCount} learning topic{completedCount !== 1 ? 's' : ''}. 
                  You're building real fragrance knowledge!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}