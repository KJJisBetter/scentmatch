'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FragranceTerm } from '../quiz-question-types';

interface FragranceTermsGlossaryProps {
  fragranceTerms: FragranceTerm[];
}

/**
 * FragranceTermsGlossary Component
 *
 * Displays educational fragrance terminology in a beginner-friendly format:
 * - Clear term definitions
 * - Approachable visual design
 * - Accessible content structure
 * - Mobile-optimized layout
 */
export function FragranceTermsGlossary({ fragranceTerms }: FragranceTermsGlossaryProps) {
  if (!fragranceTerms || fragranceTerms.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <span role="img" aria-label="Books">📚</span>
          <span>Fragrance Terms</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {fragranceTerms.map((term, index) => (
            <div 
              key={index} 
              className="flex items-start space-x-3"
              role="definition"
            >
              <Badge 
                variant="outline" 
                className="mt-1 flex-shrink-0"
                aria-label={`Term: ${term.term}`}
              >
                {term.term}
              </Badge>
              <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
                {term.definition}
              </p>
            </div>
          ))}
        </div>
        
        {/* Educational Note */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-muted-foreground italic text-center">
            💡 Don't worry about memorizing these - we'll help you discover what you love!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}