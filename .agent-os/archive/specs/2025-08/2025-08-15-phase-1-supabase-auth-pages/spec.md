# Spec Requirements Document

> Spec: Phase 1 - Supabase Setup, Authentication & Core Pages
> Created: 2025-08-15
> Status: Planning

## Overview

Implement complete Phase 1 foundation including Supabase setup, user authentication system, database population with real fragrance data, and styled home page and authentication pages. This establishes the core platform infrastructure for the ScentMatch fragrance discovery experience.

## User Stories

### Supabase Foundation Setup

As a **development team**, I want a properly configured Supabase backend with stable technology versions, so that we have a reliable, scalable foundation for authentication, database operations, and future AI features.

**Detailed Workflow**: Research and implement stable Supabase configurations, fix PostCSS v4 compatibility issues, enable required extensions (pgvector, uuid-ossp, pg_trgm), and ensure clean builds without warnings.

### User Authentication System

As a **fragrance enthusiast**, I want to create an account and sign in securely, so that I can build my personal fragrance collection, receive personalized recommendations, and track my fragrance journey.

**Detailed Workflow**: User visits auth pages, can register with email/password, verify email, sign in, and access their personalized dashboard with session persistence across browser tabs.

### Real Fragrance Database

As a **fragrance discoverer**, I want to browse authentic fragrance data from real brands and community ratings, so that I can make informed decisions based on actual fragrance information rather than placeholder data.

**Detailed Workflow**: Database is populated with 1,467 real fragrances from 40 brands using the curated JSON data, maintaining all original metadata, ratings, accords, and Fragrantica URLs.

### Styled User Experience

As a **platform user**, I want a beautiful, responsive interface that works perfectly on mobile and desktop, so that I can enjoy discovering fragrances on any device with excellent visual design and user experience.

**Detailed Workflow**: User lands on an attractive home page that showcases the platform's value, navigates through clean authentication flows, and experiences consistent, mobile-first design throughout.

## Spec Scope

1. **Supabase Setup & Configuration** - Research stable versions, configure project, enable extensions, fix build issues
2. **Authentication System** - Complete auth flows with email/password, session management, protected routes
3. **Database Schema & Population** - Implement schema and import 1,467 real fragrances + 40 brands from JSON files
4. **Home Page Styling** - Beautiful landing page that showcases platform value and guides user onboarding
5. **Authentication Pages** - Sign up, sign in, password reset, and email verification pages with excellent UX
6. **Responsive Design Foundation** - Mobile-first approach with TailwindCSS stable version and Shadcn/ui components

## Out of Scope

- AI recommendation engine (Phase 2)
- Advanced search and filtering (Phase 2)
- Social proof and review integration (Phase 3)
- Premium features and payments (Phase 5)

## Expected Deliverable

1. **Working Supabase Backend** - Configured project with authentication and database ready for production
2. **Complete Authentication** - Users can register, verify email, sign in/out, and manage sessions
3. **Populated Database** - 1,467 real fragrances and 40 brands imported with proper relationships and search capabilities
4. **Styled Pages** - Beautiful, responsive home page and authentication pages that work perfectly on mobile and desktop