# TailwindCSS v4 PostCSS Incompatibility Fix

## Issue
Build failures due to PostCSS v4 incompatibility with experimental TailwindCSS v4.

### Error Message
```
Cannot find module '@tailwindcss/postcss'
```

## Root Cause
- TailwindCSS v4 is experimental and requires specific PostCSS plugin (`@tailwindcss/postcss`)
- The v4 plugin is not production-ready and causes module resolution errors
- TailwindCSS v4 has browser-specific requirements incompatible with Node.js build tools

## Research Findings
- TailwindCSS v4 is in alpha/beta stage (as of 2025)
- Production projects should use stable v3.4.0
- PostCSS config for v3 uses standard `tailwindcss` and `autoprefixer` plugins
- @supabase/auth-helpers-nextjs is deprecated in favor of @supabase/ssr

## Solution

### 1. Package.json Changes
```json
// REMOVE (v4 experimental):
"@tailwindcss/postcss": "^4.1.12"
"tailwindcss": "^4.0.0"
"@supabase/auth-helpers-nextjs": "^0.10.0"

// USE (stable versions):
"tailwindcss": "^3.4.0"
"postcss": "^8.4.0"
"autoprefixer": "^10.4.0"
"@supabase/ssr": "^0.5.2"
```

### 2. PostCSS Configuration
```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},  // Standard plugin for v3
    autoprefixer: {},
  },
};
```

### 3. Middleware Update
Updated from deprecated `@supabase/auth-helpers-nextjs` to `@supabase/ssr` with proper cookie handling.

## Result
✅ Build successful
✅ Dev server runs without errors
✅ PostCSS processes TailwindCSS correctly
✅ All stable, production-ready versions

## Lessons Learned
1. Always verify library stability before using "latest" versions
2. TailwindCSS v4 is not production-ready (as of 2025-08)
3. Research breaking changes before major version upgrades
4. Prefer one version behind for production stability
5. Check for deprecated packages (auth-helpers → ssr)

## Version Compatibility Matrix
| Package | Stable Version | Experimental | Notes |
|---------|---------------|--------------|-------|
| tailwindcss | 3.4.0 | 4.0.0 | v4 requires special PostCSS plugin |
| postcss | 8.4.0 | - | Standard version works with TailwindCSS v3 |
| @supabase/ssr | 0.5.2 | - | Replaces deprecated auth-helpers |

## References
- TailwindCSS v4 Alpha Documentation
- PostCSS Plugin Compatibility Guide
- Supabase SSR Migration Guide