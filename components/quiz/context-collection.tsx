'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Star, Plus, X } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { ExperienceLevel } from '@/lib/quiz/natural-quiz-data';

interface FragranceContextItem {
  id: string;
  name: string;
  brand: string;
  rating?: number;
  frequency?: 'daily' | 'weekly' | 'special' | 'rarely';
  likes?: string;
  dislikes?: string;
}

interface ContextCollectionProps {
  experienceLevel: ExperienceLevel;
  onContextComplete: (context: {
    known_fragrances: string[];
    current_collection: FragranceContextItem[];
    context_notes: string;
  }) => void;
}

// Mock fragrance data for search (in real app, this would come from API)
const POPULAR_FRAGRANCES = [
  { id: '1', name: 'Sauvage', brand: 'Dior' },
  { id: '2', name: 'Bleu de Chanel', brand: 'Chanel' },
  { id: '3', name: 'Acqua di Gio', brand: 'Giorgio Armani' },
  { id: '4', name: 'One Million', brand: 'Paco Rabanne' },
  { id: '5', name: 'Light Blue', brand: 'Dolce & Gabbana' },
  { id: '6', name: 'Black Opium', brand: 'Yves Saint Laurent' },
  { id: '7', name: 'Miss Dior', brand: 'Dior' },
  { id: '8', name: 'Flowerbomb', brand: 'Viktor & Rolf' },
  { id: '9', name: 'Tom Ford Noir', brand: 'Tom Ford' },
  { id: '10', name: 'Creed Aventus', brand: 'Creed' },
];

/**
 * Context Collection Component
 * 
 * Collects user's existing fragrance knowledge and preferences:
 * - Beginners: Known fragrances they've heard about
 * - Advanced users: Current collection with ratings and usage
 */
export function ContextCollection({ experienceLevel, onContextComplete }: ContextCollectionProps) {
  const [knownFragrances, setKnownFragrances] = useState<string[]>([]);
  const [currentCollection, setCurrentCollection] = useState<FragranceContextItem[]>([]);
  const [contextNotes, setContextNotes] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const handleKnownFragranceSelect = (fragranceName: string) => {
    if (!knownFragrances.includes(fragranceName)) {
      setKnownFragrances([...knownFragrances, fragranceName]);
    }
  };

  const handleRemoveKnownFragrance = (fragranceName: string) => {
    setKnownFragrances(knownFragrances.filter(f => f !== fragranceName));
  };

  const handleAddToCollection = (fragrance: { id: string; name: string; brand: string }) => {
    const newItem: FragranceContextItem = {
      id: fragrance.id,
      name: fragrance.name,
      brand: fragrance.brand,
      rating: 4,
      frequency: 'weekly',
      likes: '',
      dislikes: ''
    };
    setCurrentCollection([...currentCollection, newItem]);
    setSearchOpen(false);
    setSearchValue('');
  };

  const handleRemoveFromCollection = (itemId: string) => {
    setCurrentCollection(currentCollection.filter(item => item.id !== itemId));
  };

  const handleUpdateCollectionItem = (itemId: string, updates: Partial<FragranceContextItem>) => {
    setCurrentCollection(currentCollection.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const handleComplete = () => {
    onContextComplete({
      known_fragrances: knownFragrances,
      current_collection: currentCollection,
      context_notes: contextNotes
    });
  };

  const filteredFragrances = POPULAR_FRAGRANCES.filter(f =>
    f.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    f.brand.toLowerCase().includes(searchValue.toLowerCase())
  );

  const canProceed = experienceLevel === 'beginner' 
    ? knownFragrances.length >= 1 || contextNotes.length > 0
    : currentCollection.length >= 1 || contextNotes.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="text-center">
        <Badge variant="secondary" className="px-4 py-2">
          🧠 Building Your Fragrance Context
        </Badge>
      </div>

      {experienceLevel === 'beginner' ? (
        // Beginner: Known fragrances question
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Any fragrances you've heard about or want to try?</CardTitle>
            <p className="text-muted-foreground">
              This helps us give you better recommendations based on what you already know.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Popular options */}
            <div className="grid grid-cols-2 gap-3">
              {POPULAR_FRAGRANCES.slice(0, 6).map(fragrance => {
                const isSelected = knownFragrances.includes(`${fragrance.name} by ${fragrance.brand}`);
                return (
                  <button
                    key={fragrance.id}
                    onClick={() => handleKnownFragranceSelect(`${fragrance.name} by ${fragrance.brand}`)}
                    className={`p-3 text-left border-2 rounded-lg transition-colors ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-medium">{fragrance.name}</div>
                    <div className="text-sm text-muted-foreground">{fragrance.brand}</div>
                  </button>
                );
              })}
            </div>

            {/* Other options */}
            <div className="space-y-2">
              <button
                onClick={() => handleKnownFragranceSelect('Something I smelled at a store')}
                className={`w-full p-3 text-left border-2 rounded-lg transition-colors ${
                  knownFragrances.includes('Something I smelled at a store')
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="font-medium">🏪 Something I smelled at a store</div>
                <div className="text-sm text-muted-foreground">Can't remember the name but loved it</div>
              </button>

              <button
                onClick={() => handleKnownFragranceSelect("I haven't heard of any specific ones")}
                className={`w-full p-3 text-left border-2 rounded-lg transition-colors ${
                  knownFragrances.includes("I haven't heard of any specific ones")
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="font-medium">🆕 I haven't heard of any specific ones</div>
                <div className="text-sm text-muted-foreground">I'm completely new to this</div>
              </button>
            </div>

            {/* Custom input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Other fragrance you've heard about:</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Chanel No. 5"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchValue.trim()) {
                      handleKnownFragranceSelect(searchValue.trim());
                      setSearchValue('');
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (searchValue.trim()) {
                      handleKnownFragranceSelect(searchValue.trim());
                      setSearchValue('');
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Selected fragrances */}
            {knownFragrances.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Fragrances you know about:</label>
                <div className="flex flex-wrap gap-2">
                  {knownFragrances.map(fragrance => (
                    <Badge key={fragrance} variant="secondary" className="flex items-center gap-1">
                      {fragrance}
                      <button
                        onClick={() => handleRemoveKnownFragrance(fragrance)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Advanced: Current collection input
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">What fragrances do you currently own?</CardTitle>
            <p className="text-muted-foreground">
              Tell us about your collection so we can find fragrances that complement what you already love.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add fragrance search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search and add fragrances:</label>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Search className="w-4 h-4 mr-2" />
                    Search fragrances...
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search fragrances..." 
                      value={searchValue}
                      onValueChange={setSearchValue}
                    />
                    <CommandList>
                      <CommandEmpty>No fragrance found.</CommandEmpty>
                      <CommandGroup>
                        {filteredFragrances.map(fragrance => (
                          <CommandItem
                            key={fragrance.id}
                            onSelect={() => handleAddToCollection(fragrance)}
                            className="cursor-pointer"
                          >
                            <div>
                              <div className="font-medium">{fragrance.name}</div>
                              <div className="text-sm text-muted-foreground">{fragrance.brand}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Current collection */}
            {currentCollection.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Your current fragrances:</label>
                {currentCollection.map(item => (
                  <Card key={item.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.brand}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveFromCollection(item.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {editingItem === item.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Rating (1-5 stars):</label>
                            <div className="flex gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map(rating => (
                                <button
                                  key={rating}
                                  onClick={() => handleUpdateCollectionItem(item.id, { rating })}
                                  className={`p-1 ${rating <= (item.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                  <Star className="w-4 h-4 fill-current" />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium">How often do you wear it?</label>
                            <div className="grid grid-cols-4 gap-2 mt-1">
                              {[
                                { value: 'daily', label: 'Daily' },
                                { value: 'weekly', label: 'Weekly' },
                                { value: 'special', label: 'Special occasions' },
                                { value: 'rarely', label: 'Rarely' }
                              ].map(freq => (
                                <button
                                  key={freq.value}
                                  onClick={() => handleUpdateCollectionItem(item.id, { frequency: freq.value as any })}
                                  className={`p-2 text-xs border rounded ${
                                    item.frequency === freq.value
                                      ? 'border-purple-500 bg-purple-50'
                                      : 'border-gray-200'
                                  }`}
                                >
                                  {freq.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium">What you like about it:</label>
                            <Input
                              placeholder="e.g., fresh, long-lasting, gets compliments"
                              value={item.likes || ''}
                              onChange={(e) => handleUpdateCollectionItem(item.id, { likes: e.target.value })}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">What you dislike (optional):</label>
                            <Input
                              placeholder="e.g., too strong, doesn't last long"
                              value={item.dislikes || ''}
                              onChange={(e) => handleUpdateCollectionItem(item.id, { dislikes: e.target.value })}
                              className="mt-1"
                            />
                          </div>

                          <Button
                            size="sm"
                            onClick={() => setEditingItem(null)}
                            className="w-full"
                          >
                            Save Details
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span>{item.rating || 'Not rated'}</span>
                            </div>
                            <span className="text-muted-foreground">{item.frequency || 'Not specified'}</span>
                          </div>
                          {item.likes && (
                            <div className="text-sm">
                              <span className="font-medium">Likes:</span> {item.likes}
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingItem(item.id)}
                            className="w-full"
                          >
                            Add Details
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional notes */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Any other preferences or notes? (Optional)
            </label>
            <Input
              placeholder="e.g., I prefer lighter scents, I'm allergic to certain ingredients"
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Continue button */}
      <div className="text-center">
        <Button
          onClick={handleComplete}
          disabled={!canProceed}
          className="px-8 py-3"
        >
          Continue to Quiz Questions
        </Button>
        {!canProceed && (
          <p className="text-sm text-muted-foreground mt-2">
            {experienceLevel === 'beginner' 
              ? 'Select at least one fragrance or add a note to continue'
              : 'Add at least one fragrance or a note to continue'
            }
          </p>
        )}
      </div>
    </div>
  );
}