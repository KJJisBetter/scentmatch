'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  TrendingUp, 
  Eye,
  ArrowDown,
  Sparkles
} from 'lucide-react';

interface ChoiceReductionDisplayProps {
  totalResults: number;
  showingCount: number;
  onShowAll: () => void;
}

export function ChoiceReductionDisplay({
  totalResults,
  showingCount,
  onShowAll
}: ChoiceReductionDisplayProps) {
  const hiddenCount = totalResults - showingCount;
  
  if (hiddenCount <= 0) return null;

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-2">
              <Filter className="h-4 w-4 text-purple-600" />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-purple-900">
                  Showing top {showingCount} results
                </h3>
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Curated for you
                </Badge>
              </div>
              
              <p className="text-sm text-purple-700">
                We found {totalResults} total results, but we're showing the most relevant ones first to avoid choice overload.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onShowAll}
            className="border-purple-200 text-purple-700 hover:bg-purple-100 ml-4"
          >
            <Eye className="h-4 w-4 mr-2" />
            Show all {totalResults}
          </Button>
        </div>

        {/* Helpful Context */}
        <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600 mt-0.5" />
            <div className="text-xs text-purple-700">
              <strong>Why we do this:</strong> Research shows that too many options can make decisions harder. 
              We've prioritized the most popular and beginner-friendly options above.
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-3 flex items-center gap-4 text-xs text-purple-600">
          <div className="flex items-center gap-1">
            <ArrowDown className="h-3 w-3" />
            <span>{hiddenCount} more options below</span>
          </div>
          <span>•</span>
          <span>Sorted by popularity & relevance</span>
        </div>
      </CardContent>
    </Card>
  );
}