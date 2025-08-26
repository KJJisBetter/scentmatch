/**
 * Bundle Performance Analyzer - Critical Bundle Size Optimization
 * 
 * Analyzes and optimizes bundle sizes for the collection platform with:
 * - Route-based code splitting analysis
 * - Component lazy loading recommendations
 * - Bundle size monitoring and alerts
 * - Performance budget enforcement
 */

import { PERFORMANCE_TARGETS } from './performance-config';

export interface BundleAnalysis {
  routeName: string;
  bundleSize: number;        // KB gzipped
  chunkCount: number;
  largestChunk: number;      // KB
  loadTime: number;          // Estimated load time on 3G
  components: ComponentAnalysis[];
  recommendations: string[];
  budgetStatus: 'pass' | 'warning' | 'fail';
}

export interface ComponentAnalysis {
  name: string;
  size: number;              // KB
  renderTime: number;        // ms
  isLazyLoaded: boolean;
  dependencies: string[];
  optimization: 'critical' | 'defer' | 'lazy' | 'remove';
}

export interface BundleOptimizationReport {
  totalBundleSize: number;
  routeAnalysis: BundleAnalysis[];
  largestBundles: { route: string; size: number; }[];
  optimizationOpportunities: {
    duplicateCode: number;    // KB of duplicate code
    unusedCode: number;       // KB of unused code
    lazyLoadCandidates: string[];
    splitPoints: string[];
  };
  performanceBudget: {
    current: number;
    target: number;
    status: 'pass' | 'warning' | 'fail';
    savings: number;
  };
}

/**
 * Bundle Performance Analyzer
 * 
 * Provides comprehensive bundle analysis and optimization recommendations
 * for the ScentMatch collection platform.
 */
export class BundlePerformanceAnalyzer {
  private routeConfigs = {
    '/': {
      name: 'Home',
      critical: ['hero', 'navigation', 'search'],
      defer: ['testimonials', 'footer'],
      lazy: ['recommendations', 'featured-products']
    },
    '/quiz': {
      name: 'Quiz',
      critical: ['quiz-interface', 'progress-bar'],
      defer: ['quiz-explanation', 'social-proof'],
      lazy: ['collection-preview', 'recommendation-display']
    },
    '/collection': {
      name: 'Collection Dashboard',
      critical: ['collection-grid', 'collection-stats'],
      defer: ['collection-insights', 'milestones'],
      lazy: ['analytics-charts', 'sharing-features']
    },
    '/browse': {
      name: 'Browse Fragrances',
      critical: ['search-filters', 'fragrance-grid'],
      defer: ['fragrance-details', 'reviews'],
      lazy: ['recommendations', 'social-validation']
    },
    '/fragrance/[id]': {
      name: 'Fragrance Detail',
      critical: ['fragrance-hero', 'add-to-collection'],
      defer: ['fragrance-notes', 'reviews'],
      lazy: ['recommendations', 'similar-fragrances']
    }
  };

  /**
   * Analyze bundle performance for all routes
   */
  async analyzeBundlePerformance(): Promise<BundleOptimizationReport> {
    const routeAnalysis: BundleAnalysis[] = [];
    
    for (const [route, config] of Object.entries(this.routeConfigs)) {
      const analysis = await this.analyzeRouteBundle(route, config);
      routeAnalysis.push(analysis);
    }

    const totalBundleSize = routeAnalysis.reduce((sum, analysis) => sum + analysis.bundleSize, 0);
    
    return {
      totalBundleSize,
      routeAnalysis,
      largestBundles: this.identifyLargestBundles(routeAnalysis),
      optimizationOpportunities: this.identifyOptimizationOpportunities(routeAnalysis),
      performanceBudget: {
        current: totalBundleSize,
        target: PERFORMANCE_TARGETS.totalBundleSize,
        status: this.getBudgetStatus(totalBundleSize),
        savings: Math.max(0, totalBundleSize - PERFORMANCE_TARGETS.totalBundleSize)
      }
    };
  }

  /**
   * Analyze individual route bundle
   */
  private async analyzeRouteBundle(route: string, config: any): Promise<BundleAnalysis> {
    // Simulated analysis - in production this would use webpack bundle analyzer data
    const bundleSize = this.estimateRouteBundleSize(route, config);
    const components = this.analyzeRouteComponents(config);
    const recommendations = this.generateRouteRecommendations(bundleSize, components);
    
    return {
      routeName: config.name,
      bundleSize,
      chunkCount: this.estimateChunkCount(components),
      largestChunk: Math.max(...components.map(c => c.size)),
      loadTime: this.estimateLoadTime(bundleSize),
      components,
      recommendations,
      budgetStatus: this.getRouteBudgetStatus(bundleSize)
    };
  }

  /**
   * Estimate bundle size based on route complexity
   */
  private estimateRouteBundleSize(route: string, config: any): number {
    // Base bundle size estimates (KB gzipped)
    const baseSizes = {
      '/': 45,                    // Home page
      '/quiz': 65,               // Quiz with AI components
      '/collection': 80,         // Collection dashboard
      '/browse': 55,             // Browse with search
      '/fragrance/[id]': 40      // Individual fragrance page
    };

    const baseSize = baseSizes[route as keyof typeof baseSizes] || 50;
    
    // Add size for component complexity
    const componentOverhead = (config.critical?.length || 0) * 8 +
                             (config.defer?.length || 0) * 5 +
                             (config.lazy?.length || 0) * 3;
    
    return baseSize + componentOverhead;
  }

  /**
   * Analyze components for optimization opportunities
   */
  private analyzeRouteComponents(config: any): ComponentAnalysis[] {
    const components: ComponentAnalysis[] = [];
    
    // Critical components (loaded immediately)
    config.critical?.forEach((name: string) => {
      components.push({
        name: name,
        size: this.estimateComponentSize(name, 'critical'),
        renderTime: this.estimateRenderTime(name),
        isLazyLoaded: false,
        dependencies: this.getComponentDependencies(name),
        optimization: 'critical'
      });
    });

    // Deferred components (can be optimized)
    config.defer?.forEach((name: string) => {
      components.push({
        name: name,
        size: this.estimateComponentSize(name, 'defer'),
        renderTime: this.estimateRenderTime(name),
        isLazyLoaded: false,
        dependencies: this.getComponentDependencies(name),
        optimization: 'defer'
      });
    });

    // Lazy loaded components
    config.lazy?.forEach((name: string) => {
      components.push({
        name: name,
        size: this.estimateComponentSize(name, 'lazy'),
        renderTime: this.estimateRenderTime(name),
        isLazyLoaded: true,
        dependencies: this.getComponentDependencies(name),
        optimization: 'lazy'
      });
    });

    return components;
  }

  /**
   * Generate optimization recommendations for route
   */
  private generateRouteRecommendations(bundleSize: number, components: ComponentAnalysis[]): string[] {
    const recommendations: string[] = [];
    
    if (bundleSize > PERFORMANCE_TARGETS.routeBundleSize) {
      recommendations.push(`Route bundle size (${bundleSize}KB) exceeds target (${PERFORMANCE_TARGETS.routeBundleSize}KB)`);
    }

    // Check for components that should be lazy loaded
    const largeCriticalComponents = components.filter(c => 
      c.optimization === 'critical' && c.size > 15
    );
    
    if (largeCriticalComponents.length > 0) {
      recommendations.push(`Consider lazy loading large components: ${largeCriticalComponents.map(c => c.name).join(', ')}`);
    }

    // Check for components that can be deferred
    const deferCandidates = components.filter(c => 
      c.optimization === 'critical' && c.renderTime > 100
    );
    
    if (deferCandidates.length > 0) {
      recommendations.push(`Consider deferring slow components: ${deferCandidates.map(c => c.name).join(', ')}`);
    }

    // Check for unused dependencies
    const heavyDependencies = components.filter(c => 
      c.dependencies.some(dep => ['chart.js', 'three.js', 'd3'].includes(dep))
    );
    
    if (heavyDependencies.length > 0) {
      recommendations.push('Consider lighter alternatives for heavy dependencies');
    }

    if (recommendations.length === 0) {
      recommendations.push('Bundle optimization is already optimal for this route');
    }

    return recommendations;
  }

  /**
   * Identify largest bundles across routes
   */
  private identifyLargestBundles(routeAnalysis: BundleAnalysis[]): { route: string; size: number; }[] {
    return routeAnalysis
      .map(analysis => ({ route: analysis.routeName, size: analysis.bundleSize }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);
  }

  /**
   * Identify optimization opportunities across all routes
   */
  private identifyOptimizationOpportunities(routeAnalysis: BundleAnalysis[]): BundleOptimizationReport['optimizationOpportunities'] {
    const allComponents = routeAnalysis.flatMap(r => r.components);
    
    // Find duplicate components across routes
    const componentCounts = new Map<string, number>();
    allComponents.forEach(c => {
      componentCounts.set(c.name, (componentCounts.get(c.name) || 0) + 1);
    });
    
    const duplicates = Array.from(componentCounts.entries())
      .filter(([name, count]) => count > 1)
      .map(([name]) => name);
    
    // Calculate estimated duplicate code size
    const duplicateCode = duplicates.reduce((sum, name) => {
      const component = allComponents.find(c => c.name === name);
      return sum + (component?.size || 0) * ((componentCounts.get(name) || 1) - 1);
    }, 0);

    // Identify lazy load candidates
    const lazyLoadCandidates = allComponents
      .filter(c => c.optimization === 'critical' && c.size > 10)
      .map(c => c.name);

    // Identify split points for code splitting
    const splitPoints = routeAnalysis
      .filter(r => r.bundleSize > PERFORMANCE_TARGETS.routeBundleSize)
      .map(r => r.routeName);

    return {
      duplicateCode,
      unusedCode: 25, // Estimated from typical Next.js bundles
      lazyLoadCandidates,
      splitPoints
    };
  }

  /**
   * Get performance budget status
   */
  private getBudgetStatus(size: number): 'pass' | 'warning' | 'fail' {
    if (size <= PERFORMANCE_TARGETS.totalBundleSize) return 'pass';
    if (size <= PERFORMANCE_TARGETS.totalBundleSize * 1.2) return 'warning';
    return 'fail';
  }

  private getRouteBudgetStatus(size: number): 'pass' | 'warning' | 'fail' {
    if (size <= PERFORMANCE_TARGETS.routeBundleSize) return 'pass';
    if (size <= PERFORMANCE_TARGETS.routeBundleSize * 1.2) return 'warning';
    return 'fail';
  }

  /**
   * Helper methods for component analysis
   */
  private estimateComponentSize(name: string, type: string): number {
    // Component size estimates (KB gzipped)
    const componentSizes: Record<string, number> = {
      'hero': 12,
      'navigation': 8,
      'search': 15,
      'quiz-interface': 25,
      'collection-grid': 18,
      'collection-stats': 10,
      'collection-insights': 20,
      'fragrance-hero': 12,
      'analytics-charts': 35,
      'recommendations': 22,
      'social-proof': 8,
      'testimonials': 6,
      'footer': 4
    };

    const baseSize = componentSizes[name] || 10;
    
    // Apply type multipliers
    const multipliers = { critical: 1, defer: 0.8, lazy: 0.6 };
    return Math.round(baseSize * (multipliers[type as keyof typeof multipliers] || 1));
  }

  private estimateRenderTime(name: string): number {
    // Component render time estimates (ms)
    const renderTimes: Record<string, number> = {
      'hero': 50,
      'navigation': 30,
      'search': 80,
      'quiz-interface': 120,
      'collection-grid': 150,
      'analytics-charts': 200,
      'recommendations': 100
    };

    return renderTimes[name] || 60;
  }

  private estimateChunkCount(components: ComponentAnalysis[]): number {
    // Estimate chunks based on lazy loaded components
    const lazyComponents = components.filter(c => c.isLazyLoaded).length;
    return Math.max(1, Math.ceil(lazyComponents / 2)) + 1; // +1 for main chunk
  }

  private estimateLoadTime(bundleSize: number): number {
    // Estimate load time on 3G connection (1.6 Mbps effective)
    const bytesPerSecond = 200000; // 200 KB/s on 3G
    const bytes = bundleSize * 1024;
    return Math.round((bytes / bytesPerSecond) * 1000); // Convert to ms
  }

  private getComponentDependencies(name: string): string[] {
    // Map components to their major dependencies
    const dependencies: Record<string, string[]> = {
      'analytics-charts': ['chart.js', 'react'],
      'quiz-interface': ['react-hook-form', 'zod'],
      'collection-grid': ['react', 'lucide-react'],
      'search': ['fuse.js', 'react'],
      'recommendations': ['react', 'ai-sdk']
    };

    return dependencies[name] || ['react'];
  }

  /**
   * Generate performance improvement suggestions
   */
  generateOptimizationPlan(report: BundleOptimizationReport): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    estimatedSavings: number;
  } {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];
    let estimatedSavings = 0;

    // Immediate optimizations (can be done now)
    if (report.optimizationOpportunities.lazyLoadCandidates.length > 0) {
      immediate.push('Implement lazy loading for large components');
      estimatedSavings += 15; // Estimated savings in KB
    }

    if (report.optimizationOpportunities.unusedCode > 10) {
      immediate.push('Remove unused code and dependencies');
      estimatedSavings += report.optimizationOpportunities.unusedCode;
    }

    // Short-term optimizations (1-2 weeks)
    if (report.optimizationOpportunities.duplicateCode > 5) {
      shortTerm.push('Extract shared components to reduce duplication');
      estimatedSavings += report.optimizationOpportunities.duplicateCode;
    }

    if (report.optimizationOpportunities.splitPoints.length > 0) {
      shortTerm.push('Implement route-based code splitting');
      estimatedSavings += 20;
    }

    // Long-term optimizations (1+ months)
    const failingRoutes = report.routeAnalysis.filter(r => r.budgetStatus === 'fail');
    if (failingRoutes.length > 0) {
      longTerm.push('Redesign component architecture for failing routes');
      estimatedSavings += 30;
    }

    longTerm.push('Implement advanced webpack optimization plugins');
    longTerm.push('Consider micro-frontend architecture for large routes');

    return {
      immediate,
      shortTerm,
      longTerm,
      estimatedSavings
    };
  }
}

export const bundleAnalyzer = new BundlePerformanceAnalyzer();