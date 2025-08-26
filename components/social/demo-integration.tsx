'use client';

/**
 * Demo Integration Component
 * Shows how to integrate all social validation components for SCE-69
 * 
 * This demonstrates the complete social validation system for 18-year-old beginners
 * who need peer context and social proof to feel confident about fragrance choices.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Star, 
  Info,
  ArrowRight
} from 'lucide-react';

// Import our new social validation components
import { SocialValidationSuite } from './social-validation-suite';
import { PeerValidation } from './peer-validation';
import { BeginnerConfidenceSignals } from './beginner-confidence-signals';
import { DemographicContext } from './demographic-context';
import { PopularityGuidance } from './popularity-guidance';
import type { SocialContext } from '@/lib/services/social-context';

interface DemoIntegrationProps {
  className?: string;
}

/**
 * Demo showing the complete social validation system
 */
export function DemoIntegration({ className = '' }: DemoIntegrationProps) {
  // Mock data for demonstration - in real app this would come from API
  const mockContext: SocialContext = {
    overall: {
      demographic_groups: 8,
      avg_approval: 4.3,
      total_approvals: 847,
      love_percentage: 82,
      confidence: 0.89
    },
    peer_context: {
      approval_rating: 4.5,
      approval_count: 234,
      love_percentage: 87,
      beginner_friendly: 4.6,
      experienced_approval: 4.1,
      confidence: 0.91
    },
    trending: {
      trending_score: 7.2,
      velocity: 0.15,
      rank_in_category: 3,
      percentile: 85
    },
    uniqueness: {
      popularity_level: 6.8,
      distinctiveness: 5.2,
      market_saturation: 23.4,
      conformity_pressure: 5.5
    }
  };

  const userProfile = {
    ageGroup: '18-24',
    experienceLevel: 'beginner' as const,
    uniquenessPreference: 4 // Moderate preference for popular choices
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Demo Header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Social Validation Demo - SCE-69
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This demonstrates the complete social validation system designed for 18-year-old 
              fragrance beginners who need peer context to feel confident about their choices.
            </p>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Age: {userProfile.ageGroup}</Badge>
              <Badge variant="outline">Experience: {userProfile.experienceLevel}</Badge>
              <Badge variant="outline">Preference: Balanced</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-2 bg-white rounded border">
                <div className="font-semibold text-blue-600">{mockContext.overall.total_approvals}</div>
                <div className="text-xs text-muted-foreground">Total Reviews</div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <div className="font-semibold text-green-600">{mockContext.overall.avg_approval}/5</div>
                <div className="text-xs text-muted-foreground">Avg Rating</div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <div className="font-semibold text-purple-600">{mockContext.peer_context?.approval_count}</div>
                <div className="text-xs text-muted-foreground">Peer Reviews</div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <div className="font-semibold text-orange-600">{mockContext.peer_context?.love_percentage}%</div>
                <div className="text-xs text-muted-foreground">Peer Approval</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Social Validation Suite */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Complete Social Validation Suite
        </h2>
        
        <SocialValidationSuite
          fragranceId="demo-fragrance"
          fragranceName="Demo Fragrance"
          context={mockContext}
          userAgeGroup={userProfile.ageGroup}
          userExperienceLevel={userProfile.experienceLevel}
          userUniquenessPreference={userProfile.uniquenessPreference}
        />
      </div>

      {/* Individual Component Demos */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Peer Validation */}
        <div className="space-y-3">
          <h3 className="font-medium text-primary">Peer Validation Component</h3>
          <PeerValidation
            context={mockContext}
            userAgeGroup={userProfile.ageGroup}
            userExperienceLevel={userProfile.experienceLevel}
          />
        </div>

        {/* Beginner Confidence */}
        <div className="space-y-3">
          <h3 className="font-medium text-primary">Beginner Confidence Signals</h3>
          <BeginnerConfidenceSignals
            context={mockContext}
            userExperienceLevel={userProfile.experienceLevel}
            userAgeGroup={userProfile.ageGroup}
          />
        </div>

        {/* Demographic Context */}
        <div className="space-y-3">
          <h3 className="font-medium text-primary">Demographic Context</h3>
          <DemographicContext
            context={mockContext}
            userAgeGroup={userProfile.ageGroup}
            userExperienceLevel={userProfile.experienceLevel}
          />
        </div>

        {/* Popularity Guidance */}
        <div className="space-y-3">
          <h3 className="font-medium text-primary">Popularity Guidance</h3>
          <PopularityGuidance
            context={mockContext}
            userUniquenessPreference={userProfile.uniquenessPreference}
          />
        </div>
      </div>

      {/* Integration Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Integration Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium mb-1">Key Features Implemented:</h4>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong>Demographic Context:</strong> "Popular with 18-24 year olds (87% satisfaction)"</li>
                <li><strong>Peer Validation:</strong> "847 people with similar preferences rated this 4+ stars"</li>
                <li><strong>Uniqueness Scale:</strong> "Popularity level: 7/10 (popular but not overdone)"</li>
                <li><strong>Social Occasions:</strong> "Perfect for college, work, dates"</li>
                <li><strong>Confidence Building:</strong> "Safe choice for fragrance beginners"</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-1">Design Principles:</h4>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>shadcn/ui components only (no custom components)</li>
                <li>Mobile-first responsive design</li>
                <li>Accessibility compliant (ARIA labels, keyboard navigation)</li>
                <li>Educational tone that builds confidence</li>
                <li>Visual indicators (badges, progress bars, icons)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-1">Social Psychology Focus:</h4>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Reduces choice anxiety through peer validation</li>
                <li>Balances "fitting in" vs "being unique" needs</li>
                <li>Provides age-appropriate social context</li>
                <li>Builds confidence without creating pressure</li>
                <li>Acknowledges social aspects of fragrance choices</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm">
              <Info className="h-4 w-4 mr-1" />
              View Documentation
            </Button>
            <Button size="sm">
              <ArrowRight className="h-4 w-4 mr-1" />
              Implement in Production
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DemoIntegration;