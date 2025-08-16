'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, RotateCcw, Sparkles, Shield, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreferenceRefinementProps {
  userId: string;
  currentPreferences: {
    adventure_level: number;
    price_sensitivity: number;
    brand_openness: number;
    seasonal_adherence?: number;
    occasion_flexibility?: number;
    [key: string]: any;
  };
  onPreferenceChange: (preferences: any) => void;
  showExplanations?: boolean;
  allowAdvancedControls?: boolean;
  className?: string;
}

/**
 * PreferenceRefinement Component
 * 
 * Interactive preference control interface for recommendation tuning
 * Implements research-backed patterns for user control:
 * - Progressive disclosure (basic → advanced controls)
 * - Real-time feedback with debounced updates
 * - Transparent explanations of preference impacts
 * - Accessible slider controls with keyboard support
 * - Privacy-first design with clear data usage explanations
 */
export function PreferenceRefinement({
  userId,
  currentPreferences,
  onPreferenceChange,
  showExplanations = true,
  allowAdvancedControls = true,
  className
}: PreferenceRefinementProps) {
  const [preferences, setPreferences] = useState(currentPreferences);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<NodeJS.Timeout | null>(null);

  // Debounced preference update
  const debouncedUpdate = useCallback((newPreferences: any) => {
    if (pendingUpdate) {
      clearTimeout(pendingUpdate);
    }

    const timeoutId = setTimeout(async () => {
      setIsUpdating(true);
      try {
        await onPreferenceChange(newPreferences);
      } catch (error) {
        console.error('Error updating preferences:', error);
      } finally {
        setIsUpdating(false);
      }
    }, 500); // 500ms debounce

    setPendingUpdate(timeoutId);
  }, [onPreferenceChange, pendingUpdate]);

  // Handle slider changes
  const handleSliderChange = (category: string, value: number) => {
    const newPreferences = { ...preferences, [category]: value };
    setPreferences(newPreferences);
    debouncedUpdate(newPreferences);
  };

  // Handle toggle changes
  const handleToggle = (category: string, enabled: boolean) => {
    const newPreferences = { ...preferences, [category]: enabled };
    setPreferences(newPreferences);
    onPreferenceChange(newPreferences); // Immediate update for toggles
  };

  // Reset to defaults
  const handleReset = () => {
    const defaultPreferences = {
      adventure_level: 0.5,
      price_sensitivity: 0.5,
      brand_openness: 0.8,
      seasonal_adherence: 0.7,
      occasion_flexibility: 0.6,
      samples_only: false,
      include_vintage: false,
      niche_brands: false,
      mainstream_only: false
    };
    
    setPreferences(defaultPreferences);
    onPreferenceChange(defaultPreferences);
  };

  // Preference categories configuration
  const preferenceConfig = {
    adventure_level: {
      label: 'Adventure Level',
      description: 'How willing are you to try unfamiliar or unique fragrances?',
      lowLabel: 'Safe picks',
      highLabel: 'Unique finds',
      icon: '🎯',
      impact: 'Higher values show more niche and experimental fragrances'
    },
    price_sensitivity: {
      label: 'Price Sensitivity', 
      description: 'How important is price in your fragrance decisions?',
      lowLabel: 'Luxury focused',
      highLabel: 'Budget conscious',
      icon: '💰',
      impact: 'Higher values prioritize affordable options and sample discovery'
    },
    brand_openness: {
      label: 'Brand Openness',
      description: 'How open are you to discovering new or lesser-known brands?',
      lowLabel: 'Established brands',
      highLabel: 'Discover new brands',
      icon: '🏷️',
      impact: 'Higher values include more indie and artisan fragrance houses'
    },
    seasonal_adherence: {
      label: 'Seasonal Adherence',
      description: 'How closely do you follow seasonal fragrance traditions?',
      lowLabel: 'Year-round flexibility',
      highLabel: 'Seasonally appropriate',
      icon: '🌱',
      impact: 'Higher values emphasize traditional seasonal fragrance choices'
    },
    occasion_flexibility: {
      label: 'Occasion Flexibility',
      description: 'How strictly do you match fragrances to specific occasions?',
      lowLabel: 'Versatile anywhere',
      highLabel: 'Occasion specific',
      icon: '🎭',
      impact: 'Higher values suggest fragrances for specific contexts and events'
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Preference Controls */}
      <div className="space-y-6">
        {/* Core Preferences (always visible) */}
        {(['adventure_level', 'price_sensitivity', 'brand_openness'] as const).map((category) => {
          const config = preferenceConfig[category];
          const value = preferences[category] || 0.5;

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{config.icon}</span>
                  <label htmlFor={`${category}-slider`} className="font-medium text-foreground">
                    {config.label}
                  </label>
                </div>
                <Badge variant="outline" className="text-xs">
                  {Math.round(value * 100)}%
                </Badge>
              </div>

              {showExplanations && (
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              )}

              {/* Slider */}
              <div className="space-y-2">
                <input
                  id={`${category}-slider`}
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={value}
                  onChange={(e) => handleSliderChange(category, parseFloat(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                  aria-label={`${config.label}: ${config.description}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(value * 100)}
                  aria-valuetext={`${Math.round(value * 100)}% - ${value < 0.5 ? config.lowLabel : config.highLabel}`}
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{config.lowLabel}</span>
                  <span>{config.highLabel}</span>
                </div>

                {showExplanations && (
                  <div className="flex items-start space-x-2 text-xs text-muted-foreground">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{config.impact}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Advanced Controls (collapsible) */}
      {allowAdvancedControls && (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Settings</span>
          </Button>

          {showAdvanced && (
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Advanced Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Advanced Sliders */}
                {(['seasonal_adherence', 'occasion_flexibility'] as const).map((category) => {
                  const config = preferenceConfig[category];
                  const value = preferences[category] || 0.5;

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`${category}-slider`} className="text-sm font-medium">
                          {config.label}
                        </label>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(value * 100)}%
                        </span>
                      </div>

                      <input
                        id={`${category}-slider`}
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={value}
                        onChange={(e) => handleSliderChange(category, parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                        aria-label={config.description}
                      />
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{config.lowLabel}</span>
                        <span>{config.highLabel}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Quick Preference Toggles */}
                <div className="space-y-3">
                  <h5 className="text-sm font-medium">Quick Preferences</h5>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'samples_only', label: 'Samples Only', description: 'Only show fragrances with samples available' },
                      { key: 'include_vintage', label: 'Include Vintage', description: 'Include discontinued and vintage fragrances' },
                      { key: 'niche_brands', label: 'Niche Focus', description: 'Prioritize artisan and niche fragrance houses' },
                      { key: 'mainstream_only', label: 'Mainstream Only', description: 'Stick to well-known designer brands' }
                    ].map(toggle => (
                      <Button
                        key={toggle.key}
                        variant={preferences[toggle.key] ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggle(toggle.key, !preferences[toggle.key])}
                        className="text-xs"
                        aria-pressed={preferences[toggle.key]}
                        title={toggle.description}
                      >
                        {toggle.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Reset and Status Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset to Defaults</span>
        </Button>

        <div className="flex items-center space-x-2 text-sm">
          {isUpdating ? (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-muted-foreground">Updating recommendations...</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-muted-foreground">Preferences saved</span>
            </>
          )}
        </div>
      </div>

      {/* Learning Transparency */}
      {showExplanations && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">How We Learn Your Preferences</h4>
                
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
                    <span>Fragrances you rate highly influence similar recommendations</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
                    <span>Time spent viewing details indicates genuine interest</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
                    <span>Sample orders are strong positive signals for your taste</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
                    <span>Collection additions help us understand your style evolution</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Privacy Settings
                  </Button>
                  
                  <Button variant="outline" size="sm" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Export My Data
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preference Impact Preview */}
      {showExplanations && Object.keys(preferences).some(key => 
        Math.abs(preferences[key] - 0.5) > 0.2 && typeof preferences[key] === 'number'
      ) && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-2">Your Preference Impact</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  {preferences.adventure_level > 0.7 && (
                    <div>• High adventure level will show more niche and experimental fragrances</div>
                  )}
                  {preferences.price_sensitivity > 0.7 && (
                    <div>• High price sensitivity will prioritize samples and budget-friendly options</div>
                  )}
                  {preferences.brand_openness > 0.8 && (
                    <div>• High brand openness will include many indie and artisan houses</div>
                  )}
                  {preferences.adventure_level < 0.3 && (
                    <div>• Low adventure level will focus on popular and familiar fragrances</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom CSS for slider styling */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider:focus {
          outline: none;
        }
        
        .slider:focus::-webkit-slider-thumb {
          ring: 2px solid hsl(var(--ring));
          ring-offset: 2px;
        }
      `}</style>
    </div>
  );
}