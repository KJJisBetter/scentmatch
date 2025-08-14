# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-14-user-auth-fragrance-db-foundation/spec.md

## Technical Requirements

### Authentication Architecture
- **Supabase Auth Integration** - Complete setup with email/password and OAuth providers (Google, Apple)
- **Session Management** - Secure JWT token handling with automatic refresh and proper cookie security
- **Password Security** - Bcrypt hashing with salt, minimum 8 characters, complexity requirements
- **Email Verification** - Required for account activation with resend capability and expiration handling
- **Password Reset Flow** - Secure token-based reset with email delivery and time-limited validity
- **Rate Limiting** - 5 failed login attempts = 5-minute lockout, API rate limiting per endpoint type

### Database Schema Implementation
- **User Profiles Table** - Complete user data with experience levels, preferences, and privacy settings
- **Fragrance Database Tables** - Brands, fragrances, notes, categories with proper relationships and indexing
- **User Collections Table** - Many-to-many relationship between users and fragrances with ratings/notes
- **Vector Embeddings Preparation** - 1024-dimension vector columns for future AI integration with proper indexing
- **Row-Level Security (RLS)** - Supabase RLS policies ensuring users can only access their own data
- **Database Migrations** - Versioned schema changes with rollback capability

### API Architecture
- **Next.js 15 App Router** - RESTful API routes with proper HTTP methods and status codes
- **TypeScript Type Safety** - Complete type definitions for all API requests/responses
- **Server Actions** - Form mutations using Next.js Server Actions for optimal UX
- **Input Validation** - Zod schema validation for all API inputs with detailed error messages
- **Error Handling** - Standardized error responses with proper HTTP status codes and user-friendly messages
- **Response Caching** - Appropriate cache headers for static fragrance data and user-specific content

### Search & Performance Implementation
- **Database Indexing** - Optimized indexes for fragrance search (name, brand, notes) and user collection queries
- **Full-Text Search** - PostgreSQL tsvector implementation for fragrance search with ranking
- **Filtering System** - Category-based filtering with efficient query optimization
- **Pagination** - Cursor-based pagination for large fragrance lists with proper performance
- **Caching Strategy** - Redis caching for frequent queries and static fragrance data
- **Response Time Targets** - Sub-200ms for search operations, sub-100ms for authentication checks

### Security Implementation
- **Data Protection** - HTTPS enforcement, secure headers (HSTS, CSP, etc.)
- **Input Sanitization** - XSS protection, SQL injection prevention, CSRF tokens
- **Privacy Compliance** - GDPR-ready data handling with user data export/deletion capabilities
- **Audit Logging** - Security event logging for authentication attempts and sensitive operations
- **Environment Security** - Proper secret management and environment variable handling

### UI/UX Technical Requirements
- **Shadcn/ui Components** - Consistent component library implementation with proper theming
- **Responsive Design** - Mobile-first approach with breakpoints at 768px, 1024px, 1440px
- **Accessibility (WCAG 2.2 AA)** - Screen reader support, keyboard navigation, proper contrast ratios
- **Core Web Vitals** - LCP < 2.5s, INP < 200ms, CLS < 0.1 for all auth and search pages
- **Progressive Enhancement** - JavaScript-optional functionality where possible
- **Error States** - User-friendly error messages with recovery suggestions

## External Dependencies

### Required Services
- **Supabase** - Database, authentication, and real-time subscriptions
- **Vercel** - Application hosting with edge functions and analytics
- **Resend** - Transactional email service for verification and password reset emails

### API Integrations
- **Supabase JavaScript Client** - Official client library for database and auth operations
- **@supabase/auth-helpers-nextjs** - Next.js specific auth helpers for session management
- **@supabase/auth-ui-react** - Pre-built auth UI components for consistent experience

### Development Dependencies
- **Zod** - Runtime type validation for API inputs and forms
- **React Hook Form** - Form state management with validation integration
- **TailwindCSS** - Utility-first CSS framework for consistent styling
- **Lucide React** - Icon library for consistent iconography

### Performance Monitoring
- **Vercel Analytics** - Real user monitoring and Core Web Vitals tracking
- **Sentry** - Error tracking and performance monitoring for production issues
- **Supabase Dashboard** - Database performance monitoring and query analysis

### Justification for External Dependencies

**Supabase vs. Self-hosted PostgreSQL:**
- Provides built-in authentication, real-time subscriptions, and Row-Level Security
- Eliminates need for separate auth service and database management
- Integrated dashboard for monitoring and database administration
- Automatic backups and scaling capabilities

**Resend vs. SendGrid:**
- Better Next.js integration with simpler API
- Improved deliverability rates for transactional emails
- More developer-friendly interface and debugging tools

**Shadcn/ui vs. Custom Components:**
- Pre-built accessible components that match design requirements
- Consistent with modern design patterns and best practices
- Reduces development time while maintaining customization capability
- Built on Radix UI primitives for accessibility compliance