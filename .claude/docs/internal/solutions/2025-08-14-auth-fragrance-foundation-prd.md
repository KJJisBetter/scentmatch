# Product Requirements Document (PRD v1)

**Spec:** User Authentication & Fragrance Database Foundation
**Created:** 2025-08-14
**Status:** Planning

## Problem Statement

ScentMatch users need secure accounts to build personal fragrance collections and receive AI-powered recommendations. Without a foundational authentication system and core fragrance database, we cannot deliver our core value proposition of personalized fragrance discovery.

**Current Pain Points:**

- No way for users to save discovered fragrances
- No personalization without user accounts
- No foundation for AI recommendation engine
- No data persistence for user preferences

## Target Users & Needs

### Primary: Fragrance Beginners (Sarah, 25-35)

**Needs:**

- Simple, secure account creation without friction
- Safe way to build fragrance wishlist/collection
- Trust that personal scent preferences are protected
- Easy access to fragrance discovery tools

**Auth Requirements:**

- Email/password registration (familiar)
- Email verification (builds trust)
- Password recovery (essential for busy professionals)
- Mobile-responsive experience

### Secondary: Fragrance Enthusiasts (Marcus, 28-40)

**Needs:**

- Persistent collection management across devices
- Historical tracking of tried/owned fragrances
- Privacy for personal collection data
- Advanced features as they engage more

**Auth Requirements:**

- Profile customization options
- Data export capabilities (future)
- Account security features

### Tertiary: Fragrance Collectors (Elena, 30-50)

**Needs:**

- Secure storage of valuable collection data
- Advanced privacy controls
- Community features (future)
- Data portability

**Auth Requirements:**

- Strong security posture
- Future 2FA support
- Premium feature access controls

## Scope Definition

### In Scope - Authentication System

1. **Email/Password Registration**
   - Email validation and verification
   - Password strength requirements
   - Terms of service acceptance
   - Privacy policy consent

2. **Secure Login System**
   - Session management with secure cookies
   - Rate limiting protection
   - "Remember me" functionality
   - Account lockout protection

3. **Password Recovery**
   - Magic link reset via email
   - Secure token generation
   - Password update with confirmation

4. **Basic Profile Management**
   - Display name customization
   - Email update capability
   - Account deletion option
   - Privacy preference controls

### In Scope - Fragrance Database Foundation

1. **Core Fragrance Data Model**
   - Essential metadata (name, brand, family, launch year)
   - Note structure (top/middle/base)
   - Gender classification (unisex, masculine, feminine)
   - Basic fragrance description

2. **Initial Dataset**
   - 500-1000 popular mainstream fragrances
   - Focus on major brands (Dior, Chanel, Tom Ford, etc.)
   - Balanced across fragrance families
   - Clean, structured data for AI embedding

3. **Database Schema**
   - PostgreSQL tables with proper relationships
   - Vector embedding columns for future AI
   - Scalable structure for phase 2 expansion
   - Performance indexes for search

4. **Basic CRUD Operations**
   - Admin interface for fragrance management
   - Data validation and integrity
   - Bulk import capabilities
   - Search functionality

### Out of Scope (Future Phases)

- Social login (Google, Apple)
- Two-factor authentication
- Advanced role management
- Niche/discontinued fragrance database
- User-generated fragrance reviews
- Community features
- Advanced recommendation algorithms
- Mobile app authentication

## Success Metrics

### Authentication Success Metrics

- **Registration Completion Rate:** >85% (users who start registration complete email verification)
- **Login Success Rate:** >95% (successful logins after email verification)
- **Password Recovery Success:** >90% (users successfully reset passwords)
- **Account Security:** Zero unauthorized access incidents
- **User Retention:** >70% of registered users return within 7 days

### Database Success Metrics

- **Data Quality:** 100% of fragrances have complete core metadata
- **Search Performance:** <100ms average response time
- **Data Completeness:** 95% of popular fragrances (top 1000) represented
- **AI Readiness:** 100% of fragrances have embeddings generated
- **Admin Efficiency:** Fragrance data entry <5 minutes per item

### User Experience Metrics

- **Mobile Usability:** Authentication works seamlessly on mobile
- **Registration Friction:** <2 minutes average time to complete signup
- **Error Recovery:** Clear error messages guide users to resolution
- **Privacy Confidence:** Users understand data usage via clear privacy policy

## Key Risks & Assumptions

### High-Risk Items

1. **Email Deliverability**
   - Risk: Verification emails land in spam
   - Mitigation: Use Resend with proper domain setup, test multiple providers
   - Impact: High - blocks user onboarding

2. **Data Privacy Compliance**
   - Risk: GDPR/privacy violations due to scent preference tracking
   - Mitigation: Clear consent flows, privacy-by-design architecture
   - Impact: High - legal/reputation damage

3. **Database Performance**
   - Risk: Poor search performance kills user experience
   - Mitigation: Proper indexing, caching strategy, performance testing
   - Impact: Medium - user frustration

### Critical Assumptions

1. **Users prefer email/password** over social login for personal fragrance data
2. **500-1000 fragrances sufficient** for MVP recommendation engine
3. **Supabase Auth reliability** meets our uptime requirements (>99.9%)
4. **OpenAI embedding costs** remain within budget for initial dataset
5. **Users willing to verify email** for account security

### Technical Dependencies

- Supabase service availability and performance
- Email delivery service (Resend) reliability
- Next.js App Router stability
- PostgreSQL pgvector extension functionality
- OpenAI API rate limits and costs

## Expected Deliverables

### Must-Have Deliverables

1. **Complete Authentication Flow**
   - Registration with email verification
   - Login/logout with session management
   - Password reset functionality
   - Basic profile management

2. **Fragrance Database Core**
   - PostgreSQL schema with 500+ fragrances
   - Admin interface for data management
   - Search and filtering capabilities
   - API endpoints for frontend consumption

3. **Security Implementation**
   - Rate limiting on auth endpoints
   - Input validation and sanitization
   - HTTPS enforcement
   - Secure session management

4. **Privacy & Legal Foundation**
   - Privacy policy for fragrance data
   - Terms of service
   - GDPR-compliant consent flows
   - Account deletion functionality

### Nice-to-Have Deliverables

- Email preference management
- Account activity logging
- Basic analytics dashboard
- Performance monitoring setup

## Technical Architecture Notes

### Authentication Stack

- **Frontend:** Next.js App Router with TypeScript
- **Backend:** Supabase Auth + Next.js API routes
- **Database:** Supabase PostgreSQL with row-level security
- **Email:** Resend for transactional emails
- **Session Management:** Supabase session cookies

### Database Design

- **Users Table:** Core user data with Supabase Auth integration
- **Fragrances Table:** Core fragrance metadata with embedding columns
- **User_Fragrances Table:** Collection/wishlist relationships
- **Notes Table:** Fragrance note classifications
- **Vector Indexes:** pgvector for future AI recommendations

### Security Measures

- Row-level security policies in Supabase
- Input validation with Zod schemas
- Rate limiting with Upstash Redis
- CORS configuration for API protection
- Environment variable security

## Next Steps After PRD Approval

1. Create detailed technical specification
2. Design database schema and relationships
3. Set up development environment with Supabase
4. Implement authentication flow with testing
5. Build fragrance database structure
6. Create admin interface for data management
7. Implement search and API endpoints
8. Add privacy policy and legal pages
9. Perform security testing and rate limiting
10. Deploy to staging for user acceptance testing

This foundation enables Phase 2 AI recommendations and Phase 3 social features while maintaining security, performance, and user trust.
