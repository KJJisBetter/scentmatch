/**
 * Critical Resource Optimizer
 * Task 7.7: Optimize critical rendering path for key beginner pages
 * 
 * Features:
 * - Critical CSS inlining
 * - Resource prioritization
 * - Preload management  
 * - Font optimization
 * - Critical path analysis
 */

import React from 'react';
import Head from 'next/head';

interface CriticalResourceOptimizerProps {
  page: 'home' | 'quiz' | 'browse' | 'fragrance-detail';
  inlineCriticalCSS?: boolean;
  preloadFonts?: boolean;
  preloadImages?: string[];
  prefetchRoutes?: string[];
  children?: React.ReactNode;
}

interface ResourcePriorityConfig {
  critical: string[];
  important: string[];
  lazy: string[];
}

// Critical CSS for different pages - generated from build analysis
const CRITICAL_CSS = {
  home: `
    /* Critical styles for homepage */
    .font-sans{font-family:Inter,ui-sans-serif,system-ui,sans-serif}
    .font-serif{font-family:"Playfair Display",ui-serif,Georgia,serif}
    .container{width:100%;margin-left:auto;margin-right:auto;padding-left:1rem;padding-right:1rem}
    @media(min-width:640px){.container{max-width:640px}}
    @media(min-width:768px){.container{max-width:768px}}
    @media(min-width:1024px){.container{max-width:1024px}}
    @media(min-width:1280px){.container{max-width:1280px}}
    .bg-background{background-color:hsl(var(--background))}
    .text-foreground{color:hsl(var(--foreground))}
    .bg-primary{background-color:hsl(var(--primary))}
    .text-primary-foreground{color:hsl(var(--primary-foreground))}
    .text-gradient-primary{background:linear-gradient(135deg,hsl(var(--primary)) 0%,hsl(var(--primary)/.8) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .min-h-screen{min-height:100vh}
    .flex{display:flex}
    .items-center{align-items:center}
    .justify-center{justify-content:center}
    .justify-between{justify-content:space-between}
    .space-y-6>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(1.5rem*calc(1-var(--tw-space-y-reverse)));margin-bottom:calc(1.5rem*var(--tw-space-y-reverse))}
    .rounded-full{border-radius:9999px}
    .px-6{padding-left:1.5rem;padding-right:1.5rem}
    .py-3{padding-top:.75rem;padding-bottom:.75rem}
    .text-lg{font-size:1.125rem;line-height:1.75rem}
    .font-medium{font-weight:500}
    .font-bold{font-weight:700}
    .transition-colors{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}
  `,
  
  quiz: `
    /* Critical styles for quiz page */
    .font-sans{font-family:Inter,ui-sans-serif,system-ui,sans-serif}
    .container{width:100%;margin-left:auto;margin-right:auto;padding-left:1rem;padding-right:1rem}
    .bg-background{background-color:hsl(var(--background))}
    .text-foreground{color:hsl(var(--foreground))}
    .border{border-width:1px;border-color:hsl(var(--border))}
    .rounded-lg{border-radius:.5rem}
    .p-6{padding:1.5rem}
    .space-y-4>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(1rem*calc(1-var(--tw-space-y-reverse)));margin-bottom:calc(1rem*var(--tw-space-y-reverse))}
    .flex{display:flex}
    .flex-col{flex-direction:column}
    .w-full{width:100%}
    .text-xl{font-size:1.25rem;line-height:1.75rem}
    .font-semibold{font-weight:600}
    .text-center{text-align:center}
    .bg-primary{background-color:hsl(var(--primary))}
    .text-primary-foreground{color:hsl(var(--primary-foreground))}
    .hover\\:bg-primary\\/90:hover{background-color:hsl(var(--primary)/.9)}
    .transition-colors{transition-property:color,background-color,border-color;transition-duration:.15s}
  `,
  
  browse: `
    /* Critical styles for browse page */
    .font-sans{font-family:Inter,ui-sans-serif,system-ui,sans-serif}
    .container{width:100%;margin-left:auto;margin-right:auto}
    .grid{display:grid}
    .grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}
    @media(min-width:640px){.sm\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(min-width:768px){.md\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(min-width:1024px){.lg\\:grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}}
    .gap-4{gap:1rem}
    .aspect-square{aspect-ratio:1/1}
    .object-cover{object-fit:cover}
    .rounded-lg{border-radius:.5rem}
    .overflow-hidden{overflow:hidden}
    .bg-card{background-color:hsl(var(--card))}
    .border{border-width:1px;border-color:hsl(var(--border))}
    .shadow-sm{box-shadow:0 1px 2px 0 rgb(0 0 0 / 0.05)}
    .hover\\:shadow-md:hover{box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1)}
    .transition-shadow{transition-property:box-shadow;transition-duration:.15s}
  `,
  
  'fragrance-detail': `
    /* Critical styles for fragrance detail page */
    .font-sans{font-family:Inter,ui-sans-serif,system-ui,sans-serif}
    .container{width:100%;margin-left:auto;margin-right:auto}
    .grid{display:grid}
    .lg\\:grid-cols-2{grid-template-columns:repeat(1,minmax(0,1fr))}
    @media(min-width:1024px){.lg\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .gap-8{gap:2rem}
    .aspect-square{aspect-ratio:1/1}
    .w-full{width:100%}
    .object-cover{object-fit:cover}
    .rounded-lg{border-radius:.5rem}
    .space-y-6>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(1.5rem*calc(1-var(--tw-space-y-reverse)));margin-bottom:calc(1.5rem*var(--tw-space-y-reverse))}
    .text-3xl{font-size:1.875rem;line-height:2.25rem}
    .font-bold{font-weight:700}
    .text-muted-foreground{color:hsl(var(--muted-foreground))}
    .bg-primary{background-color:hsl(var(--primary))}
    .text-primary-foreground{color:hsl(var(--primary-foreground))}
    .rounded-full{border-radius:9999px}
    .px-8{padding-left:2rem;padding-right:2rem}
    .py-3{padding-top:.75rem;padding-bottom:.75rem}
  `
};

// Resource priority configurations for different pages
const RESOURCE_PRIORITIES: Record<string, ResourcePriorityConfig> = {
  home: {
    critical: [
      '/fonts/inter-var.woff2',
      '/fonts/playfair-display.woff2',
      '/images/hero-fragrance.webp'
    ],
    important: [
      '/images/feature-icons.svg',
      '/api/stats/popular-fragrances'
    ],
    lazy: [
      '/images/testimonial-avatars.webp',
      '/images/brand-logos.webp'
    ]
  },
  
  quiz: {
    critical: [
      '/fonts/inter-var.woff2',
      '/api/quiz/questions'
    ],
    important: [
      '/images/quiz-icons.svg',
      '/api/user/profile'
    ],
    lazy: [
      '/images/quiz-background.webp'
    ]
  },
  
  browse: {
    critical: [
      '/fonts/inter-var.woff2',
      '/api/search/popular',
      '/images/placeholder-fragrance.webp'
    ],
    important: [
      '/api/search/filters',
      '/images/brand-thumbnails.webp'
    ],
    lazy: [
      '/api/recommendations/trending'
    ]
  },
  
  'fragrance-detail': {
    critical: [
      '/fonts/inter-var.woff2',
      '/api/fragrances/[id]',
      '/images/fragrance-bottle.webp'
    ],
    important: [
      '/api/fragrances/[id]/reviews',
      '/api/fragrances/[id]/similar',
      '/images/notes-visualization.svg'
    ],
    lazy: [
      '/api/social/ratings',
      '/images/ingredient-gallery.webp'
    ]
  }
};

export function CriticalResourceOptimizer({
  page,
  inlineCriticalCSS = true,
  preloadFonts = true,
  preloadImages = [],
  prefetchRoutes = [],
  children
}: CriticalResourceOptimizerProps) {
  const priorities = RESOURCE_PRIORITIES[page] || RESOURCE_PRIORITIES.home;
  const criticalCSS = CRITICAL_CSS[page] || CRITICAL_CSS.home;

  return (
    <>
      <Head>
        {/* Inline critical CSS */}
        {inlineCriticalCSS && (
          <style
            dangerouslySetInnerHTML={{
              __html: criticalCSS
            }}
          />
        )}

        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        <link rel="dns-prefetch" href="//cdn.scentmatch.app" />

        {/* Preconnect for critical third parties */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/* Preload critical fonts */}
        {preloadFonts && (
          <>
            <link
              rel="preload"
              href="/fonts/inter-var.woff2"
              as="font"
              type="font/woff2"
              crossOrigin=""
            />
            <link
              rel="preload"
              href="/fonts/playfair-display-var.woff2"
              as="font"
              type="font/woff2"
              crossOrigin=""
            />
          </>
        )}

        {/* Preload critical images */}
        {priorities.critical
          .filter(url => url.includes('/images/'))
          .map(imageUrl => (
            <link
              key={imageUrl}
              rel="preload"
              href={imageUrl}
              as="image"
              type="image/webp"
            />
          ))}

        {/* Preload custom critical images */}
        {preloadImages.map(imageUrl => (
          <link
            key={imageUrl}
            rel="preload"
            href={imageUrl}
            as="image"
            type="image/webp"
          />
        ))}

        {/* Preload critical API endpoints */}
        {priorities.critical
          .filter(url => url.includes('/api/'))
          .map(apiUrl => (
            <link
              key={apiUrl}
              rel="preload"
              href={apiUrl}
              as="fetch"
              crossOrigin=""
            />
          ))}

        {/* Prefetch important resources */}
        {priorities.important.map(url => (
          <link key={url} rel="prefetch" href={url} />
        ))}

        {/* Prefetch routes for faster navigation */}
        {prefetchRoutes.map(route => (
          <link key={route} rel="prefetch" href={route} />
        ))}

        {/* Page-specific optimizations */}
        {page === 'home' && (
          <>
            {/* Hero section resources */}
            <link rel="preload" href="/api/stats/homepage" as="fetch" crossOrigin="" />
            <link rel="prefetch" href="/quiz" />
            <link rel="prefetch" href="/browse" />
          </>
        )}

        {page === 'quiz' && (
          <>
            {/* Quiz critical path */}
            <link rel="preload" href="/api/quiz/initialize" as="fetch" crossOrigin="" />
            <link rel="prefetch" href="/recommendations" />
          </>
        )}

        {page === 'browse' && (
          <>
            {/* Search and filtering */}
            <link rel="preload" href="/api/search?popular=true" as="fetch" crossOrigin="" />
            <link rel="prefetch" href="/api/search/suggestions" />
          </>
        )}

        {page === 'fragrance-detail' && (
          <>
            {/* Detail page resources */}
            <link rel="prefetch" href="/api/recommendations/similar" />
            <link rel="prefetch" href="/api/social/validation" />
          </>
        )}

        {/* Resource hints for better performance */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#6366f1" />
        
        {/* Next.js Font optimization handles font loading automatically - no manual @font-face needed */}
      </Head>

      {/* Critical path analyzer script */}
      <CriticalPathAnalyzer page={page} />

      {children}
    </>
  );
}

// Component to analyze critical rendering path in development
function CriticalPathAnalyzer({ page }: { page: string }) {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const analyzeCriticalPath = () => {
      if (typeof window === 'undefined') return;

      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource');

      console.group(`🔍 Critical Path Analysis - ${page.toUpperCase()} Page`);
      
      // Analyze navigation timing
      if (navigation) {
        console.log('📊 Navigation Timing:');
        console.log(`  DNS Lookup: ${Math.round(navigation.domainLookupEnd - navigation.domainLookupStart)}ms`);
        console.log(`  TCP Connection: ${Math.round(navigation.connectEnd - navigation.connectStart)}ms`);
        console.log(`  TLS Setup: ${Math.round(navigation.secureConnectionStart ? navigation.connectEnd - navigation.secureConnectionStart : 0)}ms`);
        console.log(`  Request: ${Math.round(navigation.responseStart - navigation.requestStart)}ms`);
        console.log(`  Response: ${Math.round(navigation.responseEnd - navigation.responseStart)}ms`);
        console.log(`  DOM Processing: ${Math.round(navigation.domContentLoadedEventEnd - navigation.responseEnd)}ms`);
        console.log(`  Resource Loading: ${Math.round(navigation.loadEventEnd - navigation.domContentLoadedEventEnd)}ms`);
        
        const totalTime = navigation.loadEventEnd - navigation.navigationStart;
        console.log(`  🚀 Total Load Time: ${Math.round(totalTime)}ms`);
      }

      // Analyze resource loading
      const renderBlockingResources = resources.filter((resource: any) => {
        return resource.name.includes('.css') || 
               (resource.name.includes('.js') && !resource.name.includes('async'));
      });

      console.log('🚫 Render Blocking Resources:', renderBlockingResources.length);
      renderBlockingResources.forEach((resource: any, index) => {
        console.log(`  ${index + 1}. ${resource.name.split('/').pop()} - ${Math.round(resource.duration)}ms`);
      });

      // Analyze image loading
      const images = resources.filter((resource: any) => 
        resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i)
      );
      
      console.log('🖼️ Image Resources:', images.length);
      const largeImages = images.filter((img: any) => img.transferSize > 100000); // > 100KB
      if (largeImages.length > 0) {
        console.warn(`  ⚠️ Large images found: ${largeImages.length}`);
        largeImages.forEach((img: any) => {
          console.warn(`    ${img.name.split('/').pop()} - ${Math.round(img.transferSize / 1024)}KB`);
        });
      }

      // Performance recommendations
      console.log('💡 Recommendations:');
      
      if (renderBlockingResources.length > 3) {
        console.log('  • Consider inlining critical CSS or using media queries to make CSS non-blocking');
      }
      
      if (largeImages.length > 0) {
        console.log('  • Optimize large images with compression and modern formats (WebP, AVIF)');
      }
      
      const totalResourceSize = resources.reduce((size: number, resource: any) => 
        size + (resource.transferSize || 0), 0
      );
      
      if (totalResourceSize > 1500000) { // > 1.5MB
        console.log(`  • Total page size is ${Math.round(totalResourceSize / 1024)}KB. Consider reducing bundle size.`);
      }
      
      console.groupEnd();
    };

    // Run analysis after page load
    window.addEventListener('load', () => {
      setTimeout(analyzeCriticalPath, 1000);
    });
  }, [page]);

  return null;
}

// Higher-order component for automatic critical path optimization
export function withCriticalPathOptimization<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  page: CriticalResourceOptimizerProps['page']
) {
  const OptimizedComponent = (props: P) => (
    <CriticalResourceOptimizer page={page}>
      <WrappedComponent {...props} />
    </CriticalResourceOptimizer>
  );

  OptimizedComponent.displayName = `withCriticalPathOptimization(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return OptimizedComponent;
}

// Helper function to generate page-specific critical CSS
export function generateCriticalCSS(page: string, customSelectors?: string[]): string {
  const baseSelectors = [
    '.font-sans', '.font-serif', '.container', '.bg-background', 
    '.text-foreground', '.flex', '.items-center', '.justify-center'
  ];
  
  const allSelectors = [...baseSelectors, ...(customSelectors || [])];
  
  // In a real implementation, this would extract used CSS from the build
  return `/* Critical CSS for ${page} page - Generated automatically */\n` +
         allSelectors.map(selector => `${selector}{/* styles */}`).join('\n');
}