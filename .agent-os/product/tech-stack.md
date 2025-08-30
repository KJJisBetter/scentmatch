# Technical Stack

> Last Updated: 2025-08-30
> Version: 1.0.0

## Application Framework

- **Framework:** Next.js 15 with App Router
- **Version:** 15.x (latest stable)
- **Runtime:** React 19 with Server Components
- **Language:** TypeScript 5+ with strict configuration
- **Build System:** Turbopack for development, webpack for production

## Database

- **Primary Database:** Supabase PostgreSQL
- **Authentication:** @supabase/ssr with Row Level Security (RLS)
- **Real-time:** Supabase Realtime subscriptions
- **Migrations:** Supabase CLI with version control
- **Connection Pattern:** @supabase/ssr throughout (server/client separation)

## JavaScript

- **Framework:** React 19 with Server Components
- **State Management:** React hooks + Server Actions for data mutations
- **Forms:** React Hook Form + Zod validation
- **Data Fetching:** Server Components + Server Actions (no API routes for CRUD)
- **Type Safety:** TypeScript with Zod schema validation

## CSS Framework

- **Framework:** Tailwind CSS 3.x
- **Component Library:** shadcn/ui (Radix UI primitives)
- **Design System:** Custom design tokens via Tailwind config
- **Responsive:** Mobile-first approach with Tailwind breakpoints
- **Icons:** Lucide React icon library

## AI & Search

- **AI Provider:** OpenAI GPT-3.5-turbo (upgrading to GPT-5)
- **AI SDK:** Vercel AI SDK for streaming responses
- **AI Architecture:** UnifiedRecommendationEngine with personality analysis
- **Search Engine:** Fuse.js for fuzzy search with shadcn Command component
- **Vector Search:** Planned Supabase pgvector integration

## Data Architecture

- **API Pattern:** Server Actions for collections/wishlist/feedback
- **Search API:** API routes for search/AI processing only
- **Data Flow:** Server Components → Server Actions → Supabase
- **Caching:** Next.js built-in caching + Supabase query caching
- **Real-time:** Supabase subscriptions for live updates

## Testing & Quality

- **Unit Testing:** Vitest with React Testing Library
- **Browser Testing:** Playwright for end-to-end automation
- **Accessibility:** Playwright accessibility testing + axe-core
- **Type Checking:** TypeScript strict mode with eslint-plugin-typescript
- **Linting:** ESLint + Prettier with custom rules
- **Performance:** Vercel Analytics + Web Vitals monitoring

## Deployment & Infrastructure

- **Hosting:** Vercel with optimized Next.js deployment
- **Database:** Supabase managed PostgreSQL
- **CDN:** Vercel Edge Network for global performance
- **Analytics:** Vercel Analytics + Speed Insights
- **Monitoring:** Built-in error tracking and performance metrics
- **CI/CD:** GitHub Actions with Vercel integration

## Development Tools

- **Version Control:** Git with GitHub
- **Package Manager:** npm with package-lock.json
- **Development Server:** Next.js dev server with hot reload
- **Environment:** Node.js 18+ with environment variable management
- **IDE Integration:** VSCode with TypeScript and Tailwind extensions

## Security & Performance

- **Authentication:** Supabase Auth with RLS policies
- **Authorization:** Row Level Security at database level
- **HTTPS:** Enforced SSL/TLS via Vercel
- **Performance:** Image optimization, code splitting, lazy loading
- **SEO:** Next.js metadata API with dynamic meta generation
- **Accessibility:** WCAG 2.1 AA compliance testing

## Build & Development Commands

```bash
# Development
npm run dev              # Start development server
npm run type-check       # TypeScript validation
npm run lint            # ESLint + Prettier
npm run test            # Vitest unit tests

# Production
npm run build           # Production build
npm run start           # Start production server
npm run preview         # Preview production build
```

## Architecture Principles

- **Server-First:** Leverage Server Components and Server Actions
- **Type Safety:** End-to-end TypeScript with Zod validation
- **Performance:** Mobile-first responsive design with optimization
- **Accessibility:** WCAG compliance with automated testing
- **Maintainability:** Files under 200 lines, proven patterns only
- **Testing:** Browser testing required for all UI changes

## Current Implementation Status

**✅ Completed Infrastructure:**

- Next.js 15 with App Router and TypeScript
- Supabase integration with @supabase/ssr pattern
- shadcn/ui component system with Tailwind CSS
- Server Actions for data mutations
- Playwright + Vitest testing setup
- Vercel deployment with analytics

**✅ Core Systems:**

- UnifiedRecommendationEngine for AI recommendations
- Interactive quiz system with state management
- Collection management with Server Actions
- Advanced search with Fuse.js integration
- User authentication and database schema
- Performance monitoring and SEO optimization

**🔄 In Progress:**

- Enhanced search patterns and filtering
- Collection organization improvements
- AI recommendation refinements
- Mobile UX optimizations

**📋 Planned Upgrades:**

- GPT-5 integration for advanced AI features
- Supabase pgvector for semantic search
- Affiliate partnership integrations
- Subscription tier implementation
