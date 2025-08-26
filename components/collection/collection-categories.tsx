'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Folder, 
  Edit3, 
  Check, 
  X, 
  Trash2,
  Star,
  Heart,
  Target,
  Calendar,
  Gift,
  Zap,
  Crown,
  Palette
} from 'lucide-react';

interface CollectionCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  item_count: number;
  created_at: string;
  is_default?: boolean;
}

interface CollectionCategoriesProps {
  categories: CollectionCategory[];
  onCategoryUpdate: (categoryId: string, updates: Partial<CollectionCategory>) => void;
  showItemCounts?: boolean;
  editable?: boolean;
}

/**
 * Collection Categories Component - Task 2.2 (Phase 1B)
 * 
 * Manages collection categories with color coding, icons, and editing capabilities.
 * Provides visual organization and quick filtering for large collections.
 */
export function CollectionCategories({
  categories,
  onCategoryUpdate,
  showItemCounts = true,
  editable = true,
}: CollectionCategoriesProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  // Default categories for new users
  const defaultCategories: CollectionCategory[] = [
    {
      id: 'favorites',
      name: 'Favorites',
      description: 'Your highest-rated fragrances',
      color: 'red',
      icon: 'heart',
      item_count: 0,
      created_at: new Date().toISOString(),
      is_default: true,
    },
    {
      id: 'wishlist',
      name: 'Wishlist',
      description: 'Fragrances you want to try',
      color: 'purple',
      icon: 'star',
      item_count: 0,
      created_at: new Date().toISOString(),
      is_default: true,
    },
    {
      id: 'owned',
      name: 'Owned',
      description: 'Fragrances you currently own',
      color: 'green',
      icon: 'check',
      item_count: 0,
      created_at: new Date().toISOString(),
      is_default: true,
    },
    {
      id: 'samples',
      name: 'Samples Tried',
      description: 'Samples you\'ve tested',
      color: 'blue',
      icon: 'target',
      item_count: 0,
      created_at: new Date().toISOString(),
      is_default: true,
    },
  ];

  // Use provided categories or defaults
  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  // Available colors for categories
  const colorOptions = [
    { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
    { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
    { name: 'Green', value: 'green', class: 'bg-green-500' },
    { name: 'Red', value: 'red', class: 'bg-red-500' },
    { name: 'Yellow', value: 'yellow', class: 'bg-yellow-500' },
    { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
    { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
    { name: 'Indigo', value: 'indigo', class: 'bg-indigo-500' },
  ];

  // Available icons for categories
  const iconOptions = {
    heart: Heart,
    star: Star,
    target: Target,
    calendar: Calendar,
    gift: Gift,
    zap: Zap,
    crown: Crown,
    palette: Palette,
    folder: Folder,
  };

  // Get category color classes
  const getCategoryColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Get icon component
  const getIconComponent = (iconName?: string) => {
    if (!iconName) return Folder;
    return iconOptions[iconName as keyof typeof iconOptions] || Folder;
  };

  // Start editing category
  const startEditing = (category: CollectionCategory) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color);
  };

  // Save category edits
  const saveEdits = () => {
    if (editingId && editName.trim()) {
      onCategoryUpdate(editingId, {
        name: editName.trim(),
        color: editColor,
      });
    }
    cancelEditing();
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  // Delete category
  const deleteCategory = (categoryId: string) => {
    if (confirm('Delete this category? Items will be moved to "Uncategorized".')) {
      // Implementation would handle deletion
      console.log('Delete category:', categoryId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Categories Grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {displayCategories.map((category) => {
          const IconComponent = getIconComponent(category.icon);
          const isEditing = editingId === category.id;

          return (
            <Card
              key={category.id}
              className={`relative transition-all duration-200 hover:shadow-md ${
                isEditing ? 'ring-2 ring-purple-300' : ''
              }`}
            >
              <CardContent className="p-4">
                {isEditing ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Category name"
                      className="text-sm"
                    />
                    
                    {/* Color Picker */}
                    <div className="flex flex-wrap gap-1">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setEditColor(color.value)}
                          className={`w-6 h-6 rounded-full ${color.class} ${
                            editColor === color.value ? 'ring-2 ring-gray-400' : ''
                          }`}
                          title={color.name}
                        />
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button size="sm" onClick={saveEdits}>
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEditing}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1.5 rounded-full ${getCategoryColorClass(category.color)}`}>
                          <IconComponent className="w-3 h-3" />
                        </div>
                        <span className="font-medium text-sm">{category.name}</span>
                      </div>

                      {editable && !category.is_default && (
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(category)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCategory(category.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {category.description && (
                      <p className="text-xs text-muted-foreground">
                        {category.description}
                      </p>
                    )}

                    {showItemCounts && (
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getCategoryColorClass(category.color)}`}
                        >
                          {category.item_count} items
                        </Badge>
                        
                        {category.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category Management Help */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="space-y-2">
            <h4 className="font-medium text-blue-800 flex items-center">
              <Palette className="w-4 h-4 mr-2" />
              Organization Guide
            </h4>
            <div className="grid md:grid-cols-2 gap-2 text-sm text-blue-700">
              <div>• <strong>Favorites:</strong> Your 4+ star fragrances</div>
              <div>• <strong>Wishlist:</strong> Fragrances to try next</div>
              <div>• <strong>Owned:</strong> Full bottles you own</div>
              <div>• <strong>Samples Tried:</strong> Testing history</div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Create custom categories for seasonal collections, occasions, or moods
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}