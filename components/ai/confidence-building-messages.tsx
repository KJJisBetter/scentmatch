'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  ThumbsUp, 
  Star, 
  Smile, 
  Trophy,
  Sparkles,
  CheckCircle,
  X
} from 'lucide-react';

export interface ConfidenceBuildingMessagesProps {
  userExperience?: 'beginner' | 'intermediate' | 'advanced';
  context?: 'first-quiz' | 'recommendation' | 'sample-order' | 'learning';
  fragrance?: {
    name: string;
    brand: string;
    confidence_level?: 'high' | 'medium' | 'low';
  };
  onDismiss?: () => void;
  showDismiss?: boolean;
}

interface ConfidenceMessage {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
  color: string;
  context: string[];
  experienceLevel: string[];
}

/**
 * Confidence-building messages component
 * Provides encouragement and reassurance for fragrance beginners
 * Reduces anxiety around making "wrong" choices
 */
export function ConfidenceBuildingMessages({
  userExperience = 'beginner',
  context = 'recommendation',
  fragrance,
  onDismiss,
  showDismiss = true,
}: ConfidenceBuildingMessagesProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Curated confidence-building messages
  const confidenceMessages: ConfidenceMessage[] = [
    {
      id: 'perfect-beginner',
      icon: Heart,
      title: 'Perfect for beginners!',
      message: 'This fragrance is chosen specifically because it\'s approachable and well-loved. You can\'t go wrong with this choice.',
      color: 'pink',
      context: ['recommendation', 'first-quiz'],
      experienceLevel: ['beginner'],
    },
    {
      id: 'no-wrong-choice',
      icon: ThumbsUp,
      title: 'No wrong choices here',
      message: 'Every recommendation is tested by thousands of people. These are safe, crowd-pleasing scents that work for everyone.',
      color: 'green',
      context: ['recommendation'],
      experienceLevel: ['beginner'],
    },
    {
      id: 'sample-smart',
      icon: Sparkles,
      title: 'Smart choice to sample!',
      message: 'You\'re doing exactly what fragrance experts recommend - trying before buying. This shows great judgment.',
      color: 'blue',
      context: ['sample-order'],
      experienceLevel: ['beginner', 'intermediate'],
    },
    {
      id: 'learning-confidence',
      icon: Trophy,
      title: 'You\'re building real knowledge',
      message: 'Every bit you learn makes you more confident in your choices. You\'re on the right path to finding your signature scent.',
      color: 'purple',
      context: ['learning'],
      experienceLevel: ['beginner', 'intermediate'],
    },
    {
      id: 'high-confidence-match',
      icon: Star,
      title: 'This is a great match!',
      message: 'Our AI is highly confident this suits your style. Trust the science - this fragrance aligns perfectly with your preferences.',
      color: 'amber',
      context: ['recommendation'],
      experienceLevel: ['beginner', 'intermediate'],
    },
    {
      id: 'journey-start',
      icon: CheckCircle,
      title: 'Great start to your journey',
      message: 'Finding your perfect fragrance is a fun journey, not a test. Enjoy exploring - there\'s no pressure to get it "right" immediately.',
      color: 'indigo',
      context: ['first-quiz', 'recommendation'],
      experienceLevel: ['beginner'],
    },
    {
      id: 'safe-choice',
      icon: Smile,
      title: 'Completely safe choice',
      message: 'This fragrance has a 95%+ approval rating. It\'s designed to be universally appealing and perfect for building confidence.',
      color: 'emerald',
      context: ['recommendation'],
      experienceLevel: ['beginner'],
    },
  ];

  // Filter messages based on context and experience level
  const getRelevantMessages = () => {
    let relevant = confidenceMessages.filter(msg => 
      msg.context.includes(context) && 
      msg.experienceLevel.includes(userExperience)
    );

    // Special logic for high confidence matches
    if (fragrance?.confidence_level === 'high' && context === 'recommendation') {
      relevant = relevant.filter(msg => 
        msg.id === 'high-confidence-match' || msg.id === 'perfect-beginner'
      );
    }

    // Fallback to general encouraging messages if no specific ones
    if (relevant.length === 0) {
      relevant = confidenceMessages.filter(msg => 
        msg.experienceLevel.includes(userExperience)
      ).slice(0, 2);
    }

    return relevant;
  };

  const relevantMessages = getRelevantMessages();
  const currentMessage = relevantMessages[currentMessageIndex] || relevantMessages[0];

  // Auto-rotate messages if multiple available
  useEffect(() => {
    if (relevantMessages.length > 1) {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => 
          (prev + 1) % relevantMessages.length
        );
      }, 8000); // Change every 8 seconds

      return () => clearInterval(interval);
    }
    return undefined;
  }, [relevantMessages.length]);

  if (!isVisible || !currentMessage) {
    return null;
  }

  const IconComponent = currentMessage.icon;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <Card className={`bg-gradient-to-r from-${currentMessage.color}-50 to-${currentMessage.color}-100 border-${currentMessage.color}-200 transition-all duration-500`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`p-2 rounded-full bg-${currentMessage.color}-200`}>
              <IconComponent className={`w-4 h-4 text-${currentMessage.color}-700`} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className={`text-sm font-medium text-${currentMessage.color}-900`}>
                  {currentMessage.title}
                </h4>
                {userExperience === 'beginner' && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs bg-${currentMessage.color}-100 text-${currentMessage.color}-800 border-${currentMessage.color}-300`}
                  >
                    Beginner-friendly
                  </Badge>
                )}
              </div>
              
              <p className={`text-sm text-${currentMessage.color}-800 leading-relaxed`}>
                {currentMessage.message}
              </p>

              {/* Context-specific additional content */}
              {context === 'recommendation' && fragrance && (
                <div className="mt-2 pt-2 border-t border-white/50">
                  <p className={`text-xs text-${currentMessage.color}-700`}>
                    <strong>{fragrance.name}</strong> by {fragrance.brand} is chosen just for you.
                  </p>
                </div>
              )}

              {/* Multiple messages indicator */}
              {relevantMessages.length > 1 && (
                <div className="flex items-center space-x-1 mt-3">
                  {relevantMessages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentMessageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentMessageIndex
                          ? `bg-${currentMessage.color}-600`
                          : `bg-${currentMessage.color}-300 hover:bg-${currentMessage.color}-400`
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dismiss button */}
          {showDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className={`text-${currentMessage.color}-600 hover:text-${currentMessage.color}-800 hover:bg-${currentMessage.color}-200 p-1 h-auto`}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}