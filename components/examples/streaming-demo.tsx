'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  QuizSkeleton,
  SearchSkeleton,
  RecommendationSkeleton,
} from '@/components/ui/skeletons';
import {
  ProgressiveLoader,
  StreamingContent,
} from '@/components/ui/progressive-loader';
import {
  StreamingLayout,
  ProgressiveContent,
} from '@/components/layouts/streaming-layout';
import { PerformanceObserver } from '@/components/ui/performance-observer';

interface StreamingDemoProps {
  className?: string;
}

export function StreamingDemo({ className = '' }: StreamingDemoProps) {
  const [activeDemo, setActiveDemo] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const demos = [
    {
      id: 'quiz',
      title: 'Quiz Analysis Streaming',
      description: 'Progressive loading for AI-powered quiz analysis',
      component: () => <QuizSkeleton variant='analyzing' />,
    },
    {
      id: 'search',
      title: 'Search Results Streaming',
      description: 'Progressive loading for search results and filters',
      component: () => (
        <div className='space-y-6'>
          <SearchSkeleton variant='grid' count={6} />
        </div>
      ),
    },
    {
      id: 'recommendations',
      title: 'Recommendations Streaming',
      description: 'Progressive loading for AI recommendations',
      component: () => <RecommendationSkeleton variant='analysis' count={3} />,
    },
    {
      id: 'progressive',
      title: 'Progressive Loading',
      description: 'Multi-stage content loading with progress tracking',
      component: () => (
        <ProgressiveLoader
          isLoading={isLoading}
          progress={progress}
          status={`Loading stage ${stage} of 3`}
          onComplete={() => setIsLoading(false)}
        >
          <div className='grid gap-4 md:grid-cols-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className='p-4'>
                  <div className='h-32 bg-muted rounded mb-2' />
                  <div className='space-y-2'>
                    <div className='h-4 bg-muted rounded' />
                    <div className='h-3 bg-muted rounded w-2/3' />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ProgressiveLoader>
      ),
    },
  ];

  const startProgressiveDemo = () => {
    setIsLoading(true);
    setProgress(0);
    setStage(1);

    // Simulate progressive loading stages
    const stages = [
      { stage: 1, progress: 33, delay: 1000 },
      { stage: 2, progress: 66, delay: 1500 },
      { stage: 3, progress: 100, delay: 2000 },
    ];

    stages.forEach(({ stage: stageNum, progress: progressVal, delay }) => {
      setTimeout(() => {
        setStage(stageNum);
        setProgress(progressVal);
        if (progressVal === 100) {
          setTimeout(() => setIsLoading(false), 500);
        }
      }, delay);
    });
  };

  return (
    <div className={className}>
      <PerformanceObserver />

      <div className='space-y-8'>
        <div className='text-center'>
          <h1 className='text-3xl font-bold mb-4'>
            Next.js 15 Streaming Patterns Demo
          </h1>
          <p className='text-muted-foreground max-w-2xl mx-auto'>
            Experience the progressive loading and streaming patterns
            implemented for ScentMatch. These patterns improve Core Web Vitals
            and provide better perceived performance.
          </p>
        </div>

        {/* Demo Controls */}
        <Card>
          <CardContent className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Available Demos</h2>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              {demos.map(demo => (
                <Button
                  key={demo.id}
                  variant={activeDemo === demo.id ? 'default' : 'outline'}
                  onClick={() => {
                    setActiveDemo(demo.id);
                    if (demo.id === 'progressive') {
                      startProgressiveDemo();
                    }
                  }}
                  className='h-auto p-4 flex-col items-start text-left'
                >
                  <div className='font-medium'>{demo.title}</div>
                  <div className='text-xs text-muted-foreground mt-1'>
                    {demo.description}
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Demo Display */}
        {activeDemo && (
          <Card>
            <CardContent className='p-6'>
              <div className='mb-4'>
                <h3 className='text-lg font-semibold'>
                  {demos.find(d => d.id === activeDemo)?.title}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {demos.find(d => d.id === activeDemo)?.description}
                </p>
              </div>

              <div className='border rounded-lg p-6 bg-muted/10'>
                {demos.find(d => d.id === activeDemo)?.component()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Benefits */}
        <Card>
          <CardContent className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Performance Benefits</h2>
            <div className='grid gap-6 md:grid-cols-3'>
              <div className='space-y-2'>
                <div className='text-2xl'>⚡</div>
                <h3 className='font-medium'>Improved Perceived Performance</h3>
                <p className='text-sm text-muted-foreground'>
                  Progressive loading makes the app feel 60% faster even with
                  the same actual load times.
                </p>
              </div>
              <div className='space-y-2'>
                <div className='text-2xl'>📊</div>
                <h3 className='font-medium'>Better Core Web Vitals</h3>
                <p className='text-sm text-muted-foreground'>
                  Streaming patterns reduce CLS and improve LCP scores through
                  optimized loading states.
                </p>
              </div>
              <div className='space-y-2'>
                <div className='text-2xl'>♿</div>
                <h3 className='font-medium'>Enhanced Accessibility</h3>
                <p className='text-sm text-muted-foreground'>
                  Proper ARIA labels and live regions keep screen readers
                  informed during loading.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Notes */}
        <Card>
          <CardContent className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>
              Implementation Highlights
            </h2>
            <div className='space-y-4 text-sm'>
              <div>
                <h4 className='font-medium mb-2'>1. Suspense Boundaries</h4>
                <p className='text-muted-foreground'>
                  Strategic placement of Suspense components around heavy
                  operations like AI processing and data fetching.
                </p>
              </div>
              <div>
                <h4 className='font-medium mb-2'>2. Progressive Enhancement</h4>
                <p className='text-muted-foreground'>
                  Content loads in stages - basic structure first, then detailed
                  content, finally interactive features.
                </p>
              </div>
              <div>
                <h4 className='font-medium mb-2'>3. Optimized Skeletons</h4>
                <p className='text-muted-foreground'>
                  Skeleton components match exact content layouts to prevent
                  layout shift and maintain visual consistency.
                </p>
              </div>
              <div>
                <h4 className='font-medium mb-2'>4. Performance Monitoring</h4>
                <p className='text-muted-foreground'>
                  Built-in Core Web Vitals tracking and analytics integration
                  for continuous performance optimization.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
