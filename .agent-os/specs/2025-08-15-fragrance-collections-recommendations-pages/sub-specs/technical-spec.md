# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-15-fragrance-collections-recommendations-pages/spec.md

## Technical Requirements

### Page Structure & Routing
- **Individual Fragrance Pages:** `/fragrance/[id]` using Next.js dynamic routes with SSG for popular fragrances, ISR for others
- **Collections Dashboard:** `/dashboard/collection` with nested routes for different views (`/grid`, `/wheel`, `/calendar`)
- **Recommendations Page:** `/recommendations` with URL parameters for refinement state (`?mood=fresh&intensity=light`)

### UI Components & Design System
- **Fragrance Card Component:** Reusable across all three pages with multiple display modes (compact, detailed, collection)
- **Scent Timeline Visualization:** Interactive SVG-based timeline showing fragrance evolution over time
- **Collection Organization Views:** Grid, list, wheel (SVG circular visualization), and calendar components
- **Recommendation Cards:** Swipeable card interface with interactive feedback mechanisms
- **Mobile-First Responsive Design:** Touch targets minimum 44px, thumb-zone CTAs, swipe gesture support

### State Management & Data Flow
- **Next.js App Router:** Server and client components with proper data fetching patterns
- **Supabase Real-time:** Live updates for collection changes and recommendation refinements
- **React Server Components:** For initial page loads with static fragrance data
- **Client-side Hydration:** For interactive features like filtering, sorting, and recommendation feedback
- **URL State Synchronization:** Preserve user preferences and filter states in URL parameters

### Performance Optimization
- **Image Optimization:** Next.js Image component with WebP/AVIF formats for fragrance bottle photos
- **Progressive Loading:** Skeleton screens, lazy loading for below-fold content
- **Caching Strategy:** Static generation for fragrance pages, ISR for dynamic content, client-side caching for user data
- **Core Web Vitals Targets:** LCP < 2.5s, FID < 100ms, CLS < 0.1

### Accessibility Implementation
- **WCAG 2.2 AA Compliance:** All interactive elements keyboard accessible
- **Screen Reader Support:** Detailed alt text for fragrance imagery, structured data for scent descriptions
- **Visual Accessibility:** High contrast mode support, minimum color contrast ratios
- **Focus Management:** Clear focus indicators, logical tab order, skip navigation links

### Integration Points
- **Supabase Database:** Real-time queries for collection data, user preferences, fragrance metadata
- **AI Recommendation Engine:** Integration with vector similarity search for related fragrances
- **Authentication System:** Existing Supabase Auth integration for personalized features
- **Sample Purchase Flow:** Integration with existing checkout system for sample ordering