'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface GenderValidationErrorProps {
  errorMessage: string;
  recoveryAction?: {
    type: string;
    step: string;
    message: string;
  };
  onRestart: () => void;
}

/**
 * Gender Validation Error Component
 * 
 * Provides user-friendly error handling when gender preference is missing
 * or invalid during quiz completion. Shows clear guidance and recovery options.
 */
export function GenderValidationError({
  errorMessage,
  recoveryAction,
  onRestart,
}: GenderValidationErrorProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-orange-600" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-orange-900 mb-2">
            Missing Gender Preference
          </h2>
          <p className="text-orange-800">
            We need to know your fragrance preference to provide personalized recommendations.
          </p>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          {/* User-friendly error message */}
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <p className="text-sm text-gray-700">
              {errorMessage}
            </p>
          </div>

          {/* Recovery guidance */}
          {recoveryAction && (
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h3 className="font-medium text-gray-900 mb-2">
                What to do next:
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                {recoveryAction.message}
              </p>
              
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                <span>Choose from:</span>
                <span className="font-medium text-purple-600">For Men</span>
                <span>•</span>
                <span className="font-medium text-pink-600">For Women</span>
                <span>•</span>
                <span className="font-medium text-amber-600">Unisex</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            <Button 
              onClick={onRestart}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over with Gender Selection
            </Button>
            
            <p className="text-xs text-gray-500">
              This will take you back to the beginning of the quiz where you can select your fragrance preference.
            </p>
          </div>

          {/* Why this is important */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 text-left">
            <h4 className="font-medium text-purple-900 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Why we need this information:
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Ensures you only see fragrances you're interested in</li>
              <li>• Prevents recommendations that don't match your preferences</li>
              <li>• Helps us provide better personalized suggestions</li>
              <li>• Required for our recommendation algorithm to work properly</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}