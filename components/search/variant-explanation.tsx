'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  Droplets,
  Clock,
  Volume2,
  Thermometer,
  Info
} from 'lucide-react';

interface VariantExplanationProps {
  mainFragranceName?: string;
}

export function VariantExplanation({ mainFragranceName }: VariantExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!mainFragranceName) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardContent className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto text-left"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-amber-600" />
            <span className="font-medium text-amber-900">
              New to fragrance concentrations?
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-amber-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-amber-600" />
          )}
        </Button>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* Quick Overview */}
            <div className="p-3 bg-white rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800 mb-3">
                Fragrances come in different concentrations that affect how strong they are and how long they last. Here's what the abbreviations mean:
              </p>
              
              <div className="grid gap-3">
                <ConcentrationGuide
                  abbrev="EDP"
                  fullName="Eau de Parfum"
                  strength="Strong"
                  duration="6-8 hours"
                  description="Most popular choice - great balance of strength and longevity"
                  recommended={true}
                />
                
                <ConcentrationGuide
                  abbrev="EDT"
                  fullName="Eau de Toilette" 
                  strength="Medium"
                  duration="3-5 hours"
                  description="Lighter and fresher - perfect for daily wear or hot weather"
                />
                
                <ConcentrationGuide
                  abbrev="Parfum"
                  fullName="Parfum/Extrait"
                  strength="Very Strong"
                  duration="8+ hours"
                  description="Most luxurious and long-lasting - usually the most expensive"
                />
                
                <ConcentrationGuide
                  abbrev="EDC"
                  fullName="Eau de Cologne"
                  strength="Light"
                  duration="1-3 hours"
                  description="Refreshing and subtle - great for summer or gym"
                />
              </div>
            </div>

            {/* Specific Recommendations */}
            <div className="p-3 bg-white rounded-lg border border-amber-200">
              <h4 className="font-medium text-amber-900 text-sm mb-2 flex items-center gap-1">
                <Info className="h-4 w-4" />
                For {mainFragranceName} specifically:
              </h4>
              
              <div className="space-y-2 text-sm text-amber-800">
                {getSpecificRecommendations(mainFragranceName).map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="p-3 bg-white rounded-lg border border-amber-200">
              <h4 className="font-medium text-amber-900 text-sm mb-2">
                Quick Tips for Beginners:
              </h4>
              
              <div className="space-y-1 text-xs text-amber-700">
                <p>• Start with EDP if unsure - it's the most versatile</p>
                <p>• EDT is great for first-time fragrance wearers</p>
                <p>• Sample before buying - concentrations can smell different</p>
                <p>• Higher concentration ≠ always better (depends on the fragrance)</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConcentrationGuide({
  abbrev,
  fullName,
  strength,
  duration,
  description,
  recommended = false
}: {
  abbrev: string;
  fullName: string;
  strength: string;
  duration: string;
  description: string;
  recommended?: boolean;
}) {
  const getStrengthColor = (strength: string) => {
    switch (strength.toLowerCase()) {
      case 'light': return 'text-blue-600';
      case 'medium': return 'text-green-600';
      case 'strong': return 'text-orange-600';
      case 'very strong': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStrengthIcon = (strength: string) => {
    switch (strength.toLowerCase()) {
      case 'light': return <Volume2 className="h-3 w-3" />;
      case 'medium': return <Volume2 className="h-3 w-3" />;
      case 'strong': return <Volume2 className="h-3 w-3" />;
      case 'very strong': return <Volume2 className="h-3 w-3" />;
      default: return <Volume2 className="h-3 w-3" />;
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${recommended ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge 
            variant={recommended ? "default" : "outline"} 
            className="text-xs font-mono"
          >
            {abbrev}
          </Badge>
          <span className="font-medium text-sm">{fullName}</span>
          {recommended && (
            <Badge className="bg-green-100 text-green-800 text-xs">
              Recommended
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4 mb-2 text-xs">
        <div className={`flex items-center gap-1 ${getStrengthColor(strength)}`}>
          {getStrengthIcon(strength)}
          <span>{strength}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-600">
          <Clock className="h-3 w-3" />
          <span>{duration}</span>
        </div>
      </div>
      
      <p className="text-xs text-gray-600">{description}</p>
    </div>
  );
}

// Helper Functions

function getSpecificRecommendations(fragranceName: string): string[] {
  const name = fragranceName.toLowerCase();
  
  if (name.includes('sauvage')) {
    return [
      'EDP is the most popular - better performance than EDT',
      'Elixir is very strong and sweet - try a sample first',
      'EDT is great for summer or if you prefer lighter scents'
    ];
  }
  
  if (name.includes('bleu')) {
    return [
      'Parfum is the most sophisticated and refined version',
      'EDP offers the best balance of performance and price',
      'EDT is fresher but doesn\'t last as long'
    ];
  }
  
  if (name.includes('aventus')) {
    return [
      'The original EDP is iconic - most expensive but worth it',
      'Cologne version is lighter and more affordable',
      'Try a sample first due to the high price point'
    ];
  }
  
  if (name.includes('one million')) {
    return [
      'EDP is more refined than the original EDT',
      'Elixir is extremely sweet and strong - polarizing',
      'Lucky is a fresher, more wearable alternative'
    ];
  }
  
  // Generic recommendations
  return [
    'EDP is usually the best starting point for most fragrances',
    'EDT is good if you prefer lighter, fresher scents',
    'Always sample different concentrations - they can smell quite different'
  ];
}