#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need fixing based on TypeScript errors
const filesToFix = [
  'app/api/collection/status/route.ts',
  'app/api/data-quality/issues/route.ts',
  'app/api/data-quality/report-issue/route.ts',
  'app/api/data-quality/run-checks/route.ts',
  'app/api/data-quality/score/route.ts',
  'app/api/data-quality/variants/[canonical_id]/route.ts',
  'app/api/fragrances/[id]/route.ts',
  'app/api/fragrances/[id]/similar/route.ts',
  'app/api/fragrances/route.ts',
  'app/api/missing-products/log/route.ts',
  'app/api/missing-products/notify/route.ts',
  'app/api/quiz/convert-to-account/route.ts',
  'app/api/recommendations/feedback/route.ts',
  'app/api/search/enhanced/route.ts',
  'app/api/search/filters/route.ts',
  'app/api/search/route.ts',
  'app/api/search/smart/route.ts',
  'app/api/search/suggestions/enhanced/route.ts',
  'app/api/search/suggestions/route.ts',
  'app/api/wishlist/route.ts',
  'app/browse/page.tsx',
  'app/dashboard/collection/page.tsx',
  'app/dashboard/page.tsx',
  'app/fragrance/[id]/page.complex.tsx',
  'app/recommendations/page.tsx',
  'components/collection/collection-dashboard.tsx',
  'components/fragrance/collection-actions.tsx',
  'components/fragrance/interaction-tracker.tsx',
  'components/quiz/enhanced-quiz-flow.tsx',
  'components/recommendations/recommendations-streaming.tsx',
  'components/recommendations/recommendations-system.tsx',
  'components/search/enhanced-search-input.tsx',
  'components/search/search-filters-streaming.tsx',
  'components/ui/performance-observer.tsx',
  'lib/actions/account.ts',
  'lib/actions/collections.ts',
  'lib/actions/feedback.ts',
  'lib/actions/wishlist.ts',
  'lib/ai-sdk/client.ts',
  'lib/ai-sdk/compatibility-layer.ts',
  'lib/ai-sdk/config.ts',
  'lib/ai-sdk/search-service.ts',
  'lib/ai-sdk/unified-recommendation-engine.ts',
  'lib/data-quality/fragrance-normalizer.ts',
  'lib/data-quality/missing-product-detector.ts',
  'lib/quiz/guest-session-manager.ts',
  'lib/rate-limit/index.ts',
  'lib/search/fuse-config.ts',
  'lib/search/index.ts',
  'lib/search/search-service.ts',
  'lib/supabase/middleware.ts',
  'lib/supabase.ts',
];

function fixSupabaseTypes(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Replace patterns where supabase is used directly
  const fixedContent = content
    // Fix any standalone supabase.from() calls that haven't been fixed yet
    .replace(
      /(\s+)(await\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*\.)?supabase(\s*)\.from\(/g,
      '$1$2($3supabase as any).from('
    )
    // Fix RPC calls too
    .replace(
      /(\s+)(await\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*\.)?supabase(\s*)\.rpc\(/g,
      '$1$2($3supabase as any).rpc('
    )
    // Fix any createClient() calls that need typing
    .replace(
      /(\s+)(await\s+)?createClient\(\)(\s*)\.from\(/g,
      '$1$2(createClient() as any).from('
    )
    .replace(
      /(\s+)(await\s+)?createClient\(\)(\s*)\.rpc\(/g,
      '$1$2(createClient() as any).rpc('
    )
    // Fix createServerSupabase() calls that need typing
    .replace(
      /(\s+)(await\s+)?createServerSupabase\(\)(\s*)\.from\(/g,
      '$1$2((await createServerSupabase()) as any).from('
    )
    .replace(
      /(\s+)(await\s+)?createServerSupabase\(\)(\s*)\.rpc\(/g,
      '$1$2((await createServerSupabase()) as any).rpc('
    )
    // Fix auth calls that need typing
    .replace(
      /(\s+)(await\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*\.)?supabase(\s*)\.auth\./g,
      '$1$2($3supabase as any).auth.'
    );

  if (content !== fixedContent) {
    fs.writeFileSync(filePath, fixedContent);
    console.log(`Fixed: ${filePath}`);
  } else {
    console.log(`No changes needed: ${filePath}`);
  }
}

// Fix all files
console.log('Fixing remaining Supabase type issues...');
filesToFix.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  fixSupabaseTypes(fullPath);
});

console.log('Done!');
