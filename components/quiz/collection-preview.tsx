'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles, 
  Heart, 
  Star, 
  Users, 
  CheckCircle, 
  ArrowRight,
  BookmarkPlus,
  TrendingUp
} from 'lucide-react';
import type { RecommendationItem as FragranceRecommendation } from '@/lib/ai-sdk/unified-recommendation-engine';

interface CollectionPreviewProps {
  recommendations: FragranceRecommendation[];
  quiz_session_token: string;
  onSaveCollection: (data: CollectionSaveData) => Promise<void>;
  onSkip: () => void;
  socialProofData?: {
    total_users: number;
    users_this_week: number;
    collections_created_today: number;
  };
}

interface CollectionSaveData {
  quiz_session_token: string;
  fragrance_ids: string[];
  collection_name?: string;
}

/**
 * Collection Preview Component - Task 1.1
 * 
 * Transforms quiz recommendations into a collection-focused preview with
 * one-click save functionality. Critical for quiz-to-collection conversion.
 * 
 * Features:
 * - Collection-focused messaging and design
 * - One-click "Save My Matches" button
 * - Social proof integration
 * - Mobile-responsive collection grid
 * - Integration with existing recommendation display patterns
 */
export function CollectionPreview({
  recommendations,
  quiz_session_token,
  onSaveCollection,
  onSkip,
  socialProofData = {
    total_users: 47832,
    users_this_week: 1243,
    collections_created_today: 89
  }
}: CollectionPreviewProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Ensure exactly 3 recommendations for collection preview
  const top3Recommendations = recommendations.slice(0, 3);

  if (top3Recommendations.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">
            No recommendations available for collection preview.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSaveCollection = async () => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      await onSaveCollection({
        quiz_session_token,
        fragrance_ids: top3Recommendations.map(r => r.fragrance_id),
        collection_name: "My Quiz Matches"
      });
    } catch (error) {
      console.error('Failed to save collection:', error);
      setSaveError('Failed to save your collection. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const avgMatchScore = Math.round(
    top3Recommendations.reduce((sum, r) => sum + (r.score || 0) * 100, 0) / 
    top3Recommendations.length
  );

  const totalSamplePrice = top3Recommendations.reduce(
    (sum, r) => sum + (r.sample_price_usd || 0), 
    0
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Collection Header - 2025 Editorial Style */}
      <div className="text-center space-y-8 relative">
        {/* Floating molecules */}
        <div className="scent-molecule w-12 h-12 top-0 left-1/4" style={{ animationDelay: '2s' }} />
        <div className="scent-molecule w-8 h-8 top-10 right-1/3" style={{ animationDelay: '7s' }} />
        
        <div className="space-y-6">
          {/* 2025: Big Typography */}
          <h2 className="hero-title-2025 text-4xl md:text-6xl lg:text-7xl">
            Save Your
            <br />
            Perfect
            <br />
            <span className="editorial-title">Matches</span>
          </h2>
          
          <div className="editorial-body max-w-3xl mx-auto">
            These fragrances were chosen specifically for your scent personality. 
            Save them as your personal collection and never lose track of your perfect matches.
          </div>
        </div>

        {/* Enhanced Social Proof - Organic Design */}
        <div className="nav-2025 inline-flex items-center space-x-8 py-4 px-8">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-medium">{socialProofData.total_users.toLocaleString()}+ users</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            <span className="font-medium">{socialProofData.collections_created_today} collections today</span>
          </div>
        </div>
      </div>

      {/* Collection Preview - Bento Grid Layout */}
      <div className="bento-grid grid-cols-1 lg:grid-cols-3">
        {top3Recommendations.map((recommendation, index) => (
          <div
            key={recommendation.fragrance_id}
            className={`fragrance-card group ${
              index === 0
                ? 'lg:col-span-1 collection-preview-2025'
                : 'bento-item'
            }`}
          >
            {/* Collection Position Badge */}
            <div className="absolute top-4 right-4 z-10">
              <Badge className={`${
                index === 0 
                  ? 'bg-purple-600 text-white' 
                  : index === 1 
                    ? 'bg-blue-600 text-white'
                    : 'bg-green-600 text-white'
              }`}>
                <Star className="w-3 h-3 mr-1" />
                #{index + 1} Match
              </Badge>
            </div>

            <div className="p-6">
              {/* Fragrance Display - 2025 Style */}
              <div className="text-center mb-6">
                {recommendation.image_url ? (
                  <div className="relative w-24 h-24 mx-auto mb-4 interactive-2025">
                    <Image
                      src={recommendation.image_url}
                      alt={`${recommendation.name} by ${recommendation.brand}`}
                      fill
                      className="object-cover rounded-2xl"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-accent/10 to-primary/10 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                )}

                <h3 className="text-xl font-bold mb-2 text-foreground">
                  {recommendation.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {recommendation.brand}
                </p>

                {/* Match Score - Enhanced */}
                <div className="flex items-center justify-center mb-4">
                  <div className="px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
                    <span className="text-lg font-bold text-primary">
                      {Math.round((recommendation.score || 0) * 100)}% Match
                    </span>
                  </div>
                </div>

                {/* Gender Badge - Refined */}
                <div className="flex justify-center mb-4">
                  <Badge 
                    className={`px-3 py-1 font-medium rounded-full ${
                      recommendation.gender === 'men' 
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : recommendation.gender === 'women'
                          ? 'bg-accent/10 text-accent border-accent/20'
                          : 'bg-secondary/10 text-secondary border-secondary/20'
                    }`}
                  >
                    {recommendation.gender === 'men' 
                      ? '👨 Men'
                      : recommendation.gender === 'women'
                        ? '👩 Women'
                        : '🌟 Unisex'}
                  </Badge>
                </div>
              </div>

              {/* AI Insight - Enhanced */}
              <div className="bento-item p-4 mb-4 bg-gradient-to-br from-card to-accent/5">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-primary/20 flex-shrink-0">
                    <Heart className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground leading-relaxed">
                      {recommendation.adaptive_explanation?.summary || 
                       recommendation.explanation?.substring(0, 120) + '...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sample Price - Modern */}
              <div className="text-center py-4 border-t border-border/30">
                <div className="text-sm text-muted-foreground mb-1">Sample Price</div>
                <div className="text-2xl font-bold text-accent">${recommendation.sample_price_usd}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Collection Summary & Save Actions */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Collection Stats */}
        <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 border-2 border-purple-200">
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-purple-900">
                Your Collection Summary
              </h3>
              
              <div className="flex items-center justify-center space-x-8 text-sm">
                <div className="text-center">
                  <div className="font-bold text-2xl text-purple-800">{avgMatchScore}%</div>
                  <div className="text-purple-600">Average Match</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl text-purple-800">3</div>
                  <div className="text-purple-600">Perfect Matches</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl text-purple-800">${totalSamplePrice}</div>
                  <div className="text-purple-600">Total Samples</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Collection Actions - 2025 Design */}
        <div className="space-y-6">
          {saveError && (
            <Alert variant="destructive" className="max-w-md mx-auto">
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}

          <div className="text-center space-y-6">
            <button
              onClick={handleSaveCollection}
              disabled={isSaving}
              className="btn-organic text-lg font-bold py-5 px-12 mx-auto block group"
            >
              {isSaving ? (
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="relative z-10">Saving Your Collection...</span>
                </div>
              ) : (
                <>
                  <BookmarkPlus className="w-6 h-6 mr-3 relative z-10" />
                  <span className="relative z-10">Save My Perfect Matches</span>
                  <ArrowRight className="w-6 h-6 ml-3 relative z-10 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Value Props - Why Save */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-sm">
              <div className="flex items-center space-x-2 text-purple-800">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Never lose your perfect matches</span>
              </div>
              <div className="flex items-center space-x-2 text-purple-800">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Track which samples you've tried</span>
              </div>
              <div className="flex items-center space-x-2 text-purple-800">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Get notified of restocks & sales</span>
              </div>
              <div className="flex items-center space-x-2 text-purple-800">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Build your fragrance profile</span>
              </div>
            </div>

            {/* Skip Option */}
            <button
              onClick={onSkip}
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
              disabled={isSaving}
            >
              Skip for now (results will be lost)
            </button>
          </div>
        </div>

        {/* Social Proof Footer */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-4 bg-gray-50 rounded-lg py-3 px-6 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">
                <span className="font-semibold">{socialProofData.users_this_week}</span> users saved collections this week
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}