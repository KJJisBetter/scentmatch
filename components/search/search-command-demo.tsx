/**
 * Demo page showing FragranceCommand component features
 * This demonstrates the replacement of custom search components
 */

'use client';

import React, { useState } from 'react';
import { FragranceCommand } from './fragrance-command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Command, Sparkles, Keyboard } from 'lucide-react';

export function SearchCommandDemo() {
  const [lastSearch, setLastSearch] = useState<string>('');
  const [lastSelection, setLastSelection] = useState<any>(null);

  const handleSearch = (query: string) => {
    setLastSearch(query);
    console.log('Search triggered:', query);
  };

  const handleSelect = (item: any) => {
    setLastSelection(item);
    console.log('Item selected:', item);
  };

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-8'>
      <div className='text-center space-y-4'>
        <h1 className='text-3xl font-bold flex items-center justify-center space-x-2'>
          <Sparkles className='h-8 w-8 text-purple-600' />
          <span>Modern Search Command</span>
        </h1>
        <p className='text-muted-foreground max-w-2xl mx-auto'>
          Replacing 500+ lines of custom search code with shadcn/ui Command
          component. Features built-in keyboard navigation, accessibility, and
          better performance.
        </p>
      </div>

      <Tabs defaultValue='inline' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='inline'>Inline Mode</TabsTrigger>
          <TabsTrigger value='dialog'>Dialog Mode</TabsTrigger>
        </TabsList>

        <TabsContent value='inline' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Search className='h-5 w-5' />
                <span>Inline Search</span>
              </CardTitle>
              <CardDescription>
                Direct search component with Command features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FragranceCommand
                mode='inline'
                onSearch={handleSearch}
                onSelect={handleSelect}
                className='w-full max-w-2xl mx-auto'
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='dialog' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Command className='h-5 w-5' />
                <span>Command Dialog</span>
              </CardTitle>
              <CardDescription>
                Press ⌘K or click to open the command palette
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FragranceCommand
                mode='dialog'
                onSearch={handleSearch}
                onSelect={handleSelect}
                className='w-full max-w-2xl mx-auto'
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Features showcase */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Keyboard className='h-5 w-5' />
            <span>Enhanced Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <h4 className='font-medium'>Keyboard Navigation</h4>
              <ul className='text-sm text-muted-foreground space-y-1'>
                <li>• ⌘K / Ctrl+K to open dialog</li>
                <li>• ↑/↓ arrows to navigate</li>
                <li>• Enter to select</li>
                <li>• Escape to close</li>
              </ul>
            </div>
            <div className='space-y-2'>
              <h4 className='font-medium'>Smart Features</h4>
              <ul className='text-sm text-muted-foreground space-y-1'>
                <li>• Recent search history</li>
                <li>• Grouped search results</li>
                <li>• Trending/popular indicators</li>
                <li>• Confidence scoring</li>
              </ul>
            </div>
            <div className='space-y-2'>
              <h4 className='font-medium'>Accessibility</h4>
              <ul className='text-sm text-muted-foreground space-y-1'>
                <li>• Full ARIA support</li>
                <li>• Screen reader friendly</li>
                <li>• Focus management</li>
                <li>• Semantic HTML</li>
              </ul>
            </div>
            <div className='space-y-2'>
              <h4 className='font-medium'>Performance</h4>
              <ul className='text-sm text-muted-foreground space-y-1'>
                <li>• Virtual scrolling (cmdk)</li>
                <li>• Debounced search</li>
                <li>• Efficient re-renders</li>
                <li>• Lightweight bundle</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug info */}
      {(lastSearch || lastSelection) && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Info</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {lastSearch && (
              <div>
                <Badge variant='outline'>Last Search</Badge>
                <code className='ml-2 text-sm'>{lastSearch}</code>
              </div>
            )}
            {lastSelection && (
              <div>
                <Badge variant='outline'>Last Selection</Badge>
                <pre className='mt-2 text-xs bg-muted p-2 rounded overflow-auto'>
                  {JSON.stringify(lastSelection, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
