# TailwindCSS Version Compatibility Research

**Date Cached:** 2025-08-15
**Sources:** Exa AI web search
**Relevance:** Critical for fixing PostCSS v4 build issues

## Key Findings

### TailwindCSS v4 Issues Confirmed
1. **v4 is experimental/beta** - Not production ready
2. **Breaking changes** - Config moved from tailwind.config.ts to CSS @theme directive
3. **Build failures** - Missing "@tailwindcss/postcss" module on Next.js 15
4. **Browser requirements** - Chrome 111+, Safari 16.4+, Firefox 128+

### Recommended Stable Version
**TailwindCSS v3.4.x** - Current stable, production-ready
- ✅ Next.js 15 compatibility confirmed
- ✅ React 19 compatibility confirmed  
- ✅ Standard tailwind.config.js approach
- ✅ No browser version restrictions

### Migration Issues Found
- v4 uses `@reference` instead of `@apply`
- Config moved from JS/TS file to CSS @theme directive
- Linux ARM build issues requiring optional dependencies
- CSS-first configuration paradigm shift

## Action Items
1. Use TailwindCSS v3.4.x (stable)
2. Avoid v4 until production ready
3. Keep standard tailwind.config.js approach
4. Monitor v4 stability for future upgrade

**Sources:**
- https://medium.com/@yarema1815/migrating-from-tailwind-3-4-to-4-1-in-next-js-15-quick-fixes-without-the-headache-b702bf9b1c93
- https://www.rexwang.cc/articles/2025-issues-with-tailwind-v4
- https://www.9thco.com/labs/moving-from-tailwind-3-to-tailwind-4