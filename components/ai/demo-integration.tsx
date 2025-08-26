'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExplanationLengthAdapter } from './explanation-length-adapter';
import { ConfidenceBuildingMessages } from './confidence-building-messages';
import { FragranceEducationPanel } from './fragrance-education-panel';
import type { RecommendationItem } from '@/lib/ai-sdk/unified-recommendation-engine';

interface DemoIntegrationProps {
  recommendation: RecommendationItem;
  onSampleOrder?: (fragranceId: string) => void;
  onLearnMore?: (fragranceId: string) => void;
}

/**
 * Demo Integration Component
 * 
 * Shows how to integrate the new AI explanation components
 * into the existing fragrance recommendation display system.
 * 
 * This replaces the verbose explanation section (lines 124-137)
 * in fragrance-recommendation-display.tsx with scannable,
 * confidence-building content for beginners.
 */
export function DemoIntegration({
  recommendation,
  onSampleOrder,
  onLearnMore,
}: DemoIntegrationProps) {
  // Mock user experience level (in real app, this would come from props or context)
  const userExperience = 'beginner';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Original Card Structure (for reference) */}
      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-6">
          {/* Basic Fragrance Info (same as original) */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-1">{recommendation.name}</h3>
            <p className="text-muted-foreground text-sm mb-3">{recommendation.brand}</p>
            
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {Math.round((recommendation.score || 0) * 100)}% Match
              </Badge>
            </div>
          </div>

          {/* NEW: Confidence Building Message */}
          <div className="mb-4">
            <ConfidenceBuildingMessages
              userExperience={userExperience}
              context="recommendation"
              fragrance={{
                name: recommendation.name,
                brand: recommendation.brand,
                confidence_level: recommendation.confidence_level,
              }}
            />
          </div>

          {/* NEW: Adaptive Explanation Display */}
          <div className="mb-6">
            <ExplanationLengthAdapter
              recommendation={recommendation}
              userExperience={userExperience}
              onTrySample={onSampleOrder}
              onLearnMore={onLearnMore}
              allowToggle={true}
            />
          </div>

          {/* Sample Information (same as original) */}
          <div className="border-t pt-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Sample Price:</span>
              <span className="font-semibold text-lg">
                ${recommendation.sample_price_usd}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Try before you buy • 30-day wear test • Free shipping on orders over $25
            </p>
          </div>

          {/* Action Buttons (same as original) */}
          <div className="space-y-3">
            <Button
              onClick={() => onSampleOrder?.(recommendation.fragrance_id)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Try Sample - ${recommendation.sample_price_usd}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Education Panel (separate component) */}
      <FragranceEducationPanel
        currentFragrance={{
          name: recommendation.name,
          brand: recommendation.brand,
          scent_family: recommendation.scent_family,
        }}
        userProgress={{
          completedTopics: ['scent-families'],
          currentLevel: 'beginner',
        }}
      />

      {/* Before/After Comparison */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            Before vs After Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="before" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="before">Before (270+ words)</TabsTrigger>
              <TabsTrigger value="after">After (30-40 words)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="before" className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Original Overwhelming Explanation
                </h4>
                <p className="text-sm text-red-700 leading-relaxed">
                  "Bleu de Chanel by Chanel presents a sophisticated fresh composition that aligns exceptionally well with your complex olfactory preferences, demonstrating remarkable versatility across multiple wearing occasions while maintaining an elegant balance between citrus freshness and woody warmth that speaks to your refined taste profile. This masterfully crafted fragrance opens with vibrant bergamot and lemon zest, creating an immediate impression of cleanliness and vitality that transitions seamlessly into a heart of pink pepper and nutmeg, adding complexity without overwhelming the composition..."
                </p>
                <Badge variant="destructive" className="mt-2 text-xs">
                  270+ words • Intimidating • Technical jargon
                </Badge>
              </div>
            </TabsContent>
            
            <TabsContent value="after" className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">
                  New Beginner-Friendly Explanation
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-green-700">
                    <span className="mr-2">✅</span>
                    <span>Fresh & clean like you wanted</span>
                  </div>
                  <div className="flex items-center text-sm text-green-700">
                    <span className="mr-2">👍</span>
                    <span>Perfect for daily wear</span>
                  </div>
                  <div className="flex items-center text-sm text-green-700">
                    <span className="mr-2">🧪</span>
                    <span>Sample for $14</span>
                  </div>
                </div>
                <Badge variant="default" className="mt-2 text-xs bg-green-600">
                  30-40 words • Confidence-building • Visual
                </Badge>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}