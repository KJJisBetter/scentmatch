# Technical Stack

## Frontend Framework
- **App Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript 5.0+
- **React Version:** React 19 (latest stable)
- **Build Tool:** Next.js built-in (Turbopack)
- **Package Manager:** npm
- **Node Version:** 22 LTS

## Styling & UI
- **CSS Framework:** TailwindCSS 4.0+
- **UI Component Library:** Shadcn/ui (latest)
- **Icons:** Lucide React components
- **Font Provider:** Google Fonts
- **Font Loading:** Self-hosted via next/font for performance

## Database & Backend
- **Primary Database:** Supabase (PostgreSQL 17+ with pgvector)
- **Vector Database:** Supabase Vector (built-in pgvector extension)
- **ORM/Database Toolkit:** Supabase JavaScript Client + TypeScript types
- **API Strategy:** Next.js API Routes + Server Actions + Supabase Edge Functions
- **Authentication:** Supabase Auth (built-in with social providers)
- **File Storage:** Supabase Storage (for fragrance images/assets)

## AI & Recommendations (Research-Backed)
- **AI Platform:** OpenAI GPT-4 API (for recommendations and analysis)
- **Embedding Model:** Voyage AI voyage-3.5 (best performance for retrieval)
- **Embedding Fallback:** OpenAI text-embedding-3-large (if Voyage unavailable)
- **Vector Similarity:** Supabase pgvector with automatic embedding pipeline
- **AI SDK:** Vercel AI SDK + Supabase Edge Functions

## Deployment & Infrastructure
- **Application Hosting:** Vercel (optimal for Next.js)
- **Database Hosting:** Supabase (managed PostgreSQL with real-time)
- **CDN:** Vercel Edge Network (built-in)
- **Analytics:** Vercel Analytics + Vercel Speed Insights
- **Monitoring:** Sentry for error tracking + Supabase logs

## Development & Quality
- **Testing Framework:** Vitest + React Testing Library
- **E2E Testing:** Playwright
- **Code Quality:** ESLint + Prettier + TypeScript strict mode
- **Git Hooks:** Husky + lint-staged
- **CI/CD:** Vercel automatic deployments
- **Environment Management:** Vercel environments (production/preview)

## Performance & SEO
- **Image Optimization:** Next.js Image component
- **Caching Strategy:** Next.js built-in caching + Redis for sessions
- **SEO:** Next.js Metadata API
- **Performance Monitoring:** Vercel Speed Insights + Core Web Vitals

## Third-Party Services
- **Embedding API:** Voyage AI API (primary) + OpenAI API (fallback)
- **Affiliate Management:** Impact Radius or Commission Junction
- **Video Integration:** YouTube Data API v3
- **Social Media APIs:** TikTok API, Facebook Graph API  
- **Email Service:** Resend (better Next.js integration)
- **Payment Processing:** Stripe (for premium features)

## AI Architecture Rationale
- **Supabase Choice:** Unified platform eliminates separate vector database costs, provides real-time updates, ACID transactions for fragrance data consistency
- **Voyage AI Choice:** Latest 2024-2025 technology optimized for retrieval tasks, outperforms OpenAI in similarity search benchmarks, 50% cost savings
- **Automatic Embeddings:** Supabase triggers + Edge Functions auto-generate embeddings when fragrance data changes, ensuring recommendations stay current

## Code Repository
- **Version Control:** Git with GitHub
- **Repository Structure:** Monorepo with Next.js app
- **Branch Strategy:** main (production), develop (staging), feature branches