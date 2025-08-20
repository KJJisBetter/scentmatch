# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-20-homepage-search-quiz-gender-linear-fixes/spec.md

## Technical Requirements

### Homepage Navigation 404 Fix (SCE-46) - CRITICAL

- **Route Investigation**: Debug Next.js routing issues preventing homepage access from dynamic routes
- **Navigation Analysis**: Check Link components and programmatic navigation to homepage (`/`)  
- **Build Configuration**: Verify Next.js build configuration and static page generation
- **Dynamic Route Conflicts**: Check if `/fragrance/[id]` routes are interfering with homepage routing
- **Browser Testing**: Test navigation from fragrance detail pages back to homepage using Playwright MCP

### Search Functionality Restoration (SCE-47) - CRITICAL

- **API Endpoint**: Debug `/api/search` route configuration and verify endpoint exists
- **Error Analysis**: Investigate "TypeError: Failed to fetch" in FragranceBrowseClient component  
- **Network Request**: Check fetch request format, URL construction, and headers in search handler
- **CORS Issues**: Verify no CORS or network policy issues preventing API calls on browse page
- **Database Connection**: Ensure search API can connect to Supabase and return fragrance results

### Quiz Navigation 404 Fix (SCE-42/43) - CRITICAL  

- **Fragrance ID Format**: Debug fragrance ID format from quiz recommendations (e.g., "valentino__valentina-pink")
- **Route Mapping**: Verify `/app/fragrance/[id]/page.tsx` can handle quiz-generated fragrance IDs
- **Database Query**: Test fragrance detail database queries with IDs from quiz API responses
- **Learn More Links**: Check link generation in quiz recommendation components
- **Error Handling**: Add proper error handling and fallbacks for fragrance not found cases

### Gender Balance Correction (SCE-44/48) - CRITICAL

- **Database Audit**: Analyze current fragrance gender distribution (reported: 80% men, 0% women)
- **Browse Algorithm**: Update browse page fragrance selection to include women's and unisex options
- **Gender Classification**: Verify fragrance gender values are correctly set ("men", "women", "unisex")  
- **Recommendation Logic**: Ensure recommendation algorithms don't over-index on men's fragrances
- **Popular Fragrance Selection**: Balance popular fragrances across all gender categories

### Database Gender Investigation and Fixes

- **Data Analysis**: Query Supabase to count fragrances by gender category
- **Classification Accuracy**: Verify fragrances are correctly classified (e.g., "Epic Woman" should be "women" or "unisex")
- **Missing Data**: Identify fragrances with null or incorrect gender classifications
- **Bulk Update**: Create migration scripts to fix gender classifications if needed
- **Algorithm Update**: Modify browse/recommendation algorithms to ensure gender balance

## Technical Constraints

- **Timeline**: All fixes must be completed and tested by end of day August 20th for August 21st launch
- **No Breaking Changes**: Cannot break existing functionality during critical fixes  
- **Browser Testing Required**: All fixes must be verified working in browser using Playwright MCP
- **Production Safety**: Changes must be safe for immediate production deployment
- **Zero Downtime**: Fixes must be deployable without taking platform offline
- **Linear Tracking**: Update corresponding Linear issues (SCE-46, SCE-47, SCE-42/43, SCE-44/48) as fixes are completed