# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-16-ai-enhanced-fragrance-page/spec.md

## Technical Requirements

### 1. AI Fragrance Description System
- **AI Integration**: Use existing Voyage AI client to generate personality-focused fragrance descriptions
- **Input Data**: Fragrance notes, scent family, existing description, user ratings data
- **Output Format**: 2-3 paragraph description focusing on character, mood, and appeal
- **Caching Strategy**: Store generated descriptions in database to avoid repeated AI calls
- **Fallback**: Graceful degradation to existing description if AI generation fails

### 2. Battle Points Performance Metrics
- **Scoring Categories**: 
  - Projection (1-10): How far the fragrance projects
  - Longevity (1-10): How long the fragrance lasts  
  - Uniqueness (1-10): How distinctive and memorable it is
  - Versatility (1-10): How suitable for different occasions
  - Value (1-10): Quality relative to price point
- **Data Source**: Calculate from existing fragrance database fields and user ratings
- **Visual Component**: Interactive radar chart or score cards with professional design
- **Database Schema**: Add battle_points JSON column to fragrances table

### 3. YouTuber Review Integration Framework
- **Data Structure**: Reviews table with YouTuber name, video URL, rating, excerpt, publication date
- **Display Component**: Card-based layout with video thumbnails and review excerpts
- **Placeholder Content**: Framework ready for content population with sample data structure
- **Future Integration**: Prepared for YouTube API integration or manual content management

### 4. Enhanced Page Layout Architecture
- **Route**: `/fragrance/[id]` dynamic route with comprehensive fragrance data
- **Server Component**: Fetch fragrance data, AI descriptions, and battle points server-side
- **Client Components**: Interactive elements like battle points visualization and review carousel
- **Performance**: Optimize for Core Web Vitals with image optimization and progressive loading
- **SEO**: Rich metadata with fragrance-specific structured data

### 5. Sample Purchase Integration
- **Existing System**: Integrate with current sample ordering workflow
- **CTA Placement**: Strategic sample purchase buttons integrated into enhanced layout
- **Recommendation Engine**: Connect to existing recommendation system for similar fragrances
- **User Experience**: Seamless flow from fragrance discovery to sample ordering

## External Dependencies

**No new external dependencies required** - leverages existing Next.js, React, Supabase, and Voyage AI infrastructure