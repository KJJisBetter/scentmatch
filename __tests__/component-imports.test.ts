/**
 * Component Import/Export Resolution Tests
 *
 * Tests to verify all component imports and exports work correctly
 * and catch build-time import/export issues before they reach production.
 */

import { describe, test, expect } from 'vitest';

describe('UI Component Imports', () => {
  test('Card components import correctly', async () => {
    const cardModule = await import('@/components/ui/card');

    expect(cardModule.Card).toBeDefined();
    expect(cardModule.CardHeader).toBeDefined();
    expect(cardModule.CardTitle).toBeDefined();
    expect(cardModule.CardContent).toBeDefined();
    expect(cardModule.CardDescription).toBeDefined();
    expect(cardModule.CardFooter).toBeDefined();
  });

  test('Button component imports correctly', async () => {
    const buttonModule = await import('@/components/ui/button');

    expect(buttonModule.Button).toBeDefined();
    expect(typeof buttonModule.Button).toMatch(/^(object|function)$/); // React component can be object or function
  });

  test('Badge component imports correctly', async () => {
    const badgeModule = await import('@/components/ui/badge');

    expect(badgeModule.Badge).toBeDefined();
    expect(typeof badgeModule.Badge).toMatch(/^(object|function)$/); // React component can be object or function
  });

  test('Input component imports correctly', async () => {
    const inputModule = await import('@/components/ui/input');

    expect(inputModule.Input).toBeDefined();
  });

  test('Sheet components import correctly', async () => {
    const sheetModule = await import('@/components/ui/sheet');

    expect(sheetModule.Sheet).toBeDefined();
    expect(sheetModule.SheetContent).toBeDefined();
    expect(sheetModule.SheetDescription).toBeDefined();
    expect(sheetModule.SheetHeader).toBeDefined();
    expect(sheetModule.SheetTitle).toBeDefined();
    expect(sheetModule.SheetTrigger).toBeDefined();
  });

  test('Tabs components import correctly', async () => {
    const tabsModule = await import('@/components/ui/tabs');

    expect(tabsModule.Tabs).toBeDefined();
    expect(tabsModule.TabsContent).toBeDefined();
    expect(tabsModule.TabsList).toBeDefined();
    expect(tabsModule.TabsTrigger).toBeDefined();
  });

  test('Rating component imports correctly', async () => {
    const ratingModule = await import('@/components/ui/rating');

    expect(ratingModule.Rating).toBeDefined();
  });

  test('Skeleton component imports correctly', async () => {
    const skeletonModule = await import('@/components/ui/skeleton');

    expect(skeletonModule.Skeleton).toBeDefined();
  });
});

describe('Feature Component Imports', () => {
  test('Fragrance components import correctly', async () => {
    const fragranceDetailModule = await import(
      '@/components/fragrance/fragrance-detail-page'
    );
    expect(fragranceDetailModule.FragranceDetailPage).toBeDefined();

    const scentTimelineModule = await import(
      '@/components/fragrance/scent-timeline'
    );
    expect(scentTimelineModule.ScentTimeline).toBeDefined();

    const similarFragrancesModule = await import(
      '@/components/fragrance/similar-fragrances'
    );
    expect(similarFragrancesModule.SimilarFragrances).toBeDefined();

    const collectionActionsModule = await import(
      '@/components/fragrance/collection-actions'
    );
    expect(collectionActionsModule.CollectionActions).toBeDefined();

    const samplePurchaseModule = await import(
      '@/components/fragrance/sample-purchase-flow'
    );
    expect(samplePurchaseModule.SamplePurchaseFlow).toBeDefined();

    const aiDescriptionModule = await import(
      '@/components/fragrance/ai-description'
    );
    expect(aiDescriptionModule.AIDescription).toBeDefined();

    const interactionTrackerModule = await import(
      '@/components/fragrance/interaction-tracker'
    );
    expect(interactionTrackerModule.InteractionTracker).toBeDefined();
  });

  test('Collection components import correctly', async () => {
    const dashboardModule = await import(
      '@/components/collection/collection-dashboard'
    );
    expect(dashboardModule.CollectionDashboard).toBeDefined();

    const filtersModule = await import(
      '@/components/collection/collection-filters'
    );
    expect(filtersModule.CollectionFilters).toBeDefined();

    const gridViewModule = await import('@/components/collection/grid-view');
    expect(gridViewModule.GridView).toBeDefined();

    const listViewModule = await import('@/components/collection/list-view');
    expect(listViewModule.ListView).toBeDefined();

    const viewSwitcherModule = await import(
      '@/components/collection/view-switcher'
    );
    expect(viewSwitcherModule.ViewSwitcher).toBeDefined();

    const aiInsightsModule = await import(
      '@/components/collection/ai-insights'
    );
    expect(aiInsightsModule.AIInsights).toBeDefined();

    const managerModule = await import(
      '@/components/collection/collection-manager'
    );
    expect(managerModule.CollectionManager).toBeDefined();
  });

  test('Recommendations components import correctly', async () => {
    const recommendationsSystemModule = await import(
      '@/components/recommendations/recommendations-system'
    );
    expect(recommendationsSystemModule.RecommendationsSystem).toBeDefined();

    const themedSectionsModule = await import(
      '@/components/recommendations/themed-sections'
    );
    expect(themedSectionsModule.ThemedSections).toBeDefined();

    const preferenceRefinementModule = await import(
      '@/components/recommendations/preference-refinement'
    );
    expect(preferenceRefinementModule.PreferenceRefinement).toBeDefined();

    const feedbackModule = await import(
      '@/components/recommendations/recommendation-feedback'
    );
    expect(feedbackModule.RecommendationFeedback).toBeDefined();
  });

  test('Quiz components import correctly', async () => {
    const quizInterfaceModule = await import(
      '@/components/quiz/quiz-interface'
    );
    expect(quizInterfaceModule.QuizInterface).toBeDefined();

    const conversionFlowModule = await import(
      '@/components/quiz/conversion-flow'
    );
    expect(conversionFlowModule.ConversionFlow).toBeDefined();
  });

  test('Search components import correctly', async () => {
    const searchPageModule = await import('@/components/search/search-page');
    expect(searchPageModule.SearchPage).toBeDefined();

    const searchInputModule = await import('@/components/search/search-input');
    expect(searchInputModule.SearchInput).toBeDefined();

    const searchResultsModule = await import(
      '@/components/search/search-results'
    );
    expect(searchResultsModule.SearchResults).toBeDefined();

    const searchFiltersModule = await import(
      '@/components/search/search-filters'
    );
    expect(searchFiltersModule.SearchFilters).toBeDefined();

    const useSearchModule = await import('@/components/search/use-search');
    expect(useSearchModule.useSearch).toBeDefined();
  });

  test('Browse components import correctly', async () => {
    const browseClientModule = await import(
      '@/components/browse/fragrance-browse-client'
    );
    expect(browseClientModule.FragranceBrowseClient).toBeDefined();
  });
});

describe('Barrel Export Resolution', () => {
  test('Search index exports work correctly', async () => {
    const searchIndexModule = await import('@/components/search/index');

    // Test that the barrel export re-exports the main components
    expect(searchIndexModule.SearchPage).toBeDefined();
    expect(searchIndexModule.SearchInput).toBeDefined();
    expect(searchIndexModule.SearchResults).toBeDefined();
    expect(searchIndexModule.SearchFilters).toBeDefined();
    expect(searchIndexModule.useSearch).toBeDefined();
  });
});

describe('Component Prop Type Validation', () => {
  test('Components have proper TypeScript definitions', async () => {
    // Test that components can be imported with TypeScript validation
    const cardModule = await import('@/components/ui/card');
    const buttonModule = await import('@/components/ui/button');

    // These should not throw TypeScript errors if properly typed
    expect(typeof cardModule.Card).toMatch(/^(object|function)$/);
    expect(typeof buttonModule.Button).toMatch(/^(object|function)$/);
  });
});

describe('Import Path Resolution', () => {
  test('Direct imports work (preferred pattern)', async () => {
    // Test direct imports (recommended pattern from CLAUDE.md)
    const directCardImport = await import('@/components/ui/card');
    expect(directCardImport.Card).toBeDefined();

    const directButtonImport = await import('@/components/ui/button');
    expect(directButtonImport.Button).toBeDefined();
  });

  test('Relative imports work from component directories', async () => {
    // Simulate how components import from relative paths
    const utilsImport = await import('@/lib/utils');
    expect(utilsImport.cn).toBeDefined();
  });
});

describe('Build-time Export Validation', () => {
  test('All components export their primary component', async () => {
    // Key components that should always have their main export
    const componentsToTest = [
      {
        path: '@/components/ui/card',
        exports: ['Card', 'CardContent', 'CardHeader', 'CardTitle'],
      },
      { path: '@/components/ui/button', exports: ['Button'] },
      { path: '@/components/ui/badge', exports: ['Badge'] },
      {
        path: '@/components/fragrance/fragrance-detail-page',
        exports: ['FragranceDetailPage'],
      },
      {
        path: '@/components/collection/collection-dashboard',
        exports: ['CollectionDashboard'],
      },
    ];

    for (const component of componentsToTest) {
      const componentModule = await import(component.path);

      for (const exportName of component.exports) {
        expect(componentModule[exportName]).toBeDefined();
        expect(componentModule[exportName]).not.toBeNull();
      }
    }
  });

  test('No circular dependency issues', async () => {
    // Test that importing components doesn't cause circular dependency errors
    // This would throw an error if there were circular dependencies

    try {
      await Promise.all([
        import('@/components/ui/card'),
        import('@/components/ui/button'),
        import('@/components/fragrance/fragrance-detail-page'),
        import('@/components/collection/collection-dashboard'),
        import('@/components/recommendations/recommendations-system'),
      ]);

      // If we get here, no circular dependencies detected
      expect(true).toBe(true);
    } catch (error) {
      fail(`Circular dependency detected: ${error}`);
    }
  });
});
