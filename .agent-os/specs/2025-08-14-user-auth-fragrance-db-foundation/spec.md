# Spec Requirements Document

> Spec: User Authentication & Fragrance Database Foundation
> Created: 2025-08-14
> Status: Planning

## Overview

Implement foundational user authentication system and core fragrance database for ScentMatch AI-powered fragrance recommendation platform. This foundation enables user account management, secure fragrance collection tracking, and prepares the system for AI-powered personalized recommendations in Phase 1 MVP.

## User Stories

### User Registration & Authentication

As a **fragrance beginner** (like Sarah), I want to create an account quickly and securely, so that I can start building my fragrance collection and receive personalized recommendations without feeling overwhelmed by the process.

**Detailed Workflow:**

- Visit ScentMatch landing page and see clear value proposition
- Choose between email registration or social auth (Google/Apple)
- Complete simple form with name, email, password in under 90 seconds
- Receive email verification and complete account activation
- Optional profile completion to indicate experience level and preferences
- Access welcome dashboard with guided next steps

### Personal Fragrance Collection Management

As a **fragrance enthusiast** (like Marcus), I want to track my existing fragrance collection with ratings and notes, so that I can see what I own, avoid duplicate purchases, and help the AI understand my preferences for better recommendations.

**Detailed Workflow:**

- Search for fragrances from comprehensive database of 500+ popular scents
- Add fragrances to personal collection with custom ratings (1-5 stars)
- Add personal notes about each fragrance (when I wear it, occasions, memories)
- View and edit my collection list with sorting and filtering options
- Remove fragrances I no longer own or want tracked

### Fragrance Discovery & Search

As a **fragrance collector** (like Elena), I want to explore a well-organized database of fragrances with detailed information, so that I can discover new scents, research fragrance details, and find specific fragrances to add to my collection.

**Detailed Workflow:**

- Browse fragrances by brand, fragrance family, or notes
- Search for specific fragrances by name or brand
- View detailed fragrance information (notes, description, brand, year)
- Filter results by categories (fresh, woody, floral, etc.)
- See fragrance popularity and basic community data
- Quick-add fragrances to personal collection from search results

## Spec Scope

1. **User Authentication System** - Complete Supabase Auth integration with email/password and social login options (Google, Apple)
2. **User Profile Management** - Basic profile creation with experience level, preferences, and account settings
3. **Fragrance Database Foundation** - Core database with 500+ popular fragrances including detailed metadata and preparation for AI embeddings
4. **Personal Collection CRUD** - Full create, read, update, delete operations for user fragrance collections with ratings and notes
5. **Basic Search & Filtering** - Search fragrances by name, brand, notes with category-based filtering system

## Out of Scope

- Advanced AI recommendations (reserved for future spec)
- Social features and community interactions
- Sample purchasing and affiliate links
- Advanced fragrance analysis and preference learning
- Video reviews and social proof integration
- Two-factor authentication (2FA)
- Niche or discontinued fragrance database

## Expected Deliverable

1. **Functional Authentication System** - Users can register, sign in, sign out, reset passwords, and manage basic profiles successfully
2. **Populated Fragrance Database** - 500+ fragrances with complete metadata accessible via search and browse functionality
3. **Working Collection Management** - Users can add, view, edit, and remove fragrances from personal collections with ratings and notes
4. **Responsive UI Foundation** - Clean, mobile-first interface using Shadcn/ui components that works seamlessly across devices
5. **Database Performance** - Search and collection operations complete in under 200ms with proper indexing and optimization
