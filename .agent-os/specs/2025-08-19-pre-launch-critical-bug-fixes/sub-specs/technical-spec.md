# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-19-pre-launch-critical-bug-fixes/spec.md

## Technical Requirements

### Search API Brand Field Fix

- Verify current fix from 2025-08-19 is properly implemented in production
- Test search endpoints with "dior" query to confirm proper brand name mapping
- Add cache busting if needed to ensure users get fresh data
- Validate AI search mock data doesn't interfere with normal search flows
- Check database records for any fragrances with genuinely missing brand_id values

### Quiz Recommendation Algorithm Enhancement

- Fix scoring algorithm tie-breaking to prevent alphabetical bias
- Add randomization for equal scores using secure random number generation
- Implement diversity scoring to prevent multiple fragrances from same brand
- Increase score differentiation by incorporating additional preference factors
- Test different quiz combinations produce meaningfully different results
- Maintain existing preference-to-accord mapping logic (no complete rewrite)

### Database Schema Fix for Quiz Data Transfer

- Create and apply migration to change session_token from UUID to TEXT type
- Update transfer_guest_session_to_user RPC function to accept TEXT parameter
- Test complete conversion flow: guest quiz → account creation → data transfer
- Verify RLS policies allow proper data transfer during conversion
- Ensure session expiration and cleanup still work properly

### Integration and Production Readiness

- Add monitoring to track when "unknown brand" fallbacks are triggered
- Add logging for quiz recommendation scoring to verify algorithm improvements
- Test all three fixes in development environment before deployment
- Verify fixes work with existing cached data and user sessions
- Ensure professional error handling for any remaining edge cases

## External Dependencies

**None** - All fixes use existing libraries and infrastructure. No new external dependencies required.
