# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-15-phase-1-supabase-auth-pages/spec.md

## Technology Stack Research Requirements

### Version Compatibility Research
- Research Supabase client stable versions for Next.js 15 + React 19
- Verify TailwindCSS stable version (not v4) compatibility
- Document PostCSS stable configuration 
- Research Shadcn/ui component library latest stable
- Validate all dependencies work together without conflicts

### Build Configuration
- Fix PostCSS v4 incompatibility causing build failures
- Configure TailwindCSS v3.4.0 (stable) instead of experimental v4
- Ensure clean production builds without warnings
- Optimize font loading with next/font
- Configure proper TypeScript paths and imports

## Supabase Setup Specifications

### Project Configuration
- Create new Supabase project or configure existing
- Enable authentication with email/password provider
- Configure email templates for verification and password reset
- Set up proper redirect URLs for development and production
- Configure CORS settings for Next.js application

### Database Extensions
```sql
-- Required extensions for functionality
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- UUID generation
CREATE EXTENSION IF NOT EXISTS "vector";       -- pgvector for AI features
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Fuzzy text search
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Authentication Implementation

### Supabase Client Configuration
- Separate client and server-side Supabase clients
- Proper cookie handling for SSR authentication
- Session persistence and automatic refresh
- Error handling and retry logic

### Authentication Flows
- User registration with email verification
- Sign-in with session creation
- Password reset with email tokens
- Sign-out with session cleanup
- Protected route middleware

### Security Measures
- Input validation with Zod schemas
- Rate limiting on auth endpoints
- CSRF protection via middleware
- Secure session management
- Password strength requirements

## Database Import Implementation

### Data Processing Pipeline
- JSON file parsing and validation using existing schema
- Brand data import with deduplication
- Fragrance data import with relationship validation
- Batch processing for performance
- Error handling and rollback capabilities

### Import Scripts
- Utilize existing data processing scripts from `/scripts/data-processing/`
- Leverage proven validation from `/lib/data-validation/fragrance-schema.ts`
- Implement progress tracking for large imports
- Add data integrity verification post-import

## Page Implementation Specifications

### Home Page Components
- Hero section with gradient background and value proposition
- Feature showcase grid with icons and descriptions
- Call-to-action buttons with hover effects
- Responsive layout with mobile-first breakpoints
- Loading states and skeleton placeholders

### Authentication Pages
- Consistent form styling with Shadcn/ui components
- Input validation with real-time feedback
- Loading states during authentication operations
- Error display with user-friendly messages
- Success states and redirect handling

### Design System
- Color palette based on fragrance/luxury theme
- Typography hierarchy with readable fonts
- Consistent spacing using TailwindCSS utilities
- Interactive elements with hover and focus states
- Mobile-optimized touch targets (44px minimum)