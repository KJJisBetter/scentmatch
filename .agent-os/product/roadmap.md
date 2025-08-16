# Product Roadmap

## Phase 1: Foundation & Core MVP

**Goal:** Build essential user accounts, collection management, and basic AI recommendations
**Success Criteria:** Users can create accounts, add fragrances to collections, and receive basic AI recommendations

### Features

- [ ] User authentication and account creation - Set up NextAuth.js with email/password and social login `M`
- [ ] Personal fragrance collection manager - CRUD operations for user's fragrance library `L`
- [ ] Basic fragrance database - Core fragrance data model with popular fragrances `L`
- [ ] Simple AI recommendation engine - Basic preference matching algorithm `L`
- [ ] Responsive UI foundation - Shadcn/ui components and mobile-first design `M`
- [ ] Basic search and filtering - Search fragrances by name, brand, notes `M`

### Dependencies

- Vercel deployment setup
- PostgreSQL database schema
- OpenAI API integration

## Phase 2: AI Enhancement & Sample Discovery

**Goal:** Implement advanced AI recommendations and sample/travel size purchasing
**Success Criteria:** AI provides personalized recommendations with explanations, users can find and purchase samples

### Features

- [ ] Advanced AI recommendation engine - Deep scent profile analysis with reasoning `XL`
- [ ] Sample and travel size discovery - Curated small-format fragrance options `L`
- [ ] Affiliate link integration - Commission-based purchasing links `M`
- [ ] Fragrance relationship mapping - Visual connections between similar scents `L`
- [ ] Preference learning system - AI learns from user ratings and feedback `L`
- [ ] Scent profile analysis - Detailed breakdown of what users prefer and why `M`

### Dependencies

- Vector database for AI embeddings
- Affiliate partnership agreements
- Advanced fragrance data collection

## Phase 3: Social Proof & Community

**Goal:** Integrate video reviews, fragrance battles, and social proof features
**Success Criteria:** Users can see aggregated reviews, battle scores, and social proof for each fragrance

### Features

- [ ] YouTube review integration - Embedded reviews with sentiment analysis `L`
- [ ] TikTok content aggregation - Social media fragrance content discovery `M`
- [ ] Fragrance battle tracking - Head-to-head comparison scoring system `M`
- [ ] Social proof dashboard - Community ratings and review aggregation `M`
- [ ] Video review sentiment analysis - AI-powered review summarization `L`
- [ ] Community voting system - User-driven fragrance rankings `S`

### Dependencies

- YouTube Data API integration
- TikTok API access
- Content moderation system

## Phase 4: Interactive Testing & Advanced Features

**Goal:** Implement blind testing experiences and advanced discovery tools
**Success Criteria:** Users can conduct structured blind tests and access advanced recommendation features

### Features

- [ ] Blind testing guide system - Structured testing experiences with instructions `L`
- [ ] Test strip purchasing integration - Affiliate links for testing materials `S`
- [ ] Progressive complexity recommendations - Gradual sophistication for beginners `M`
- [ ] Advanced filtering and discovery - Complex search with multiple parameters `M`
- [ ] Fragrance education content - Learning modules about fragrance families `M`
- [ ] Collection analytics - Insights about user's fragrance preferences `S`

### Dependencies

- Testing material supplier partnerships
- Educational content creation
- Advanced analytics infrastructure

## Phase 5: Premium Features & Expansion

**Goal:** Introduce premium features and expand to niche/discontinued fragrances
**Success Criteria:** Premium subscription model launched with advanced features for collectors

### Features

- [ ] Premium subscription tier - Advanced AI features and exclusive content `L`
- [ ] Discontinued fragrance marketplace - Secondary market integration `XL`
- [ ] Niche fragrance curation - Rare and artisanal fragrance discovery `L`
- [ ] Expert fragrance analysis - Professional perfumer insights and content `M`
- [ ] Advanced collection management - Detailed notes, usage tracking, valuation `M`
- [ ] Mobile app development - Native iOS/Android applications `XL`

### Dependencies

- Payment processing integration
- Premium content creation
- Mobile development resources
