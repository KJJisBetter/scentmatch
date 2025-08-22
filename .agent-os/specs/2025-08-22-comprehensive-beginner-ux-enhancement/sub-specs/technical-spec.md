# Technical Specification

## Architecture Overview

This enhancement suite requires changes across multiple layers:
- **Database**: Data quality fixes and schema updates
- **API**: Enhanced quiz flow and recommendation logic  
- **UI Components**: Progressive engagement and educational features
- **Server Actions**: Improved conversion flows

## Issue-Specific Implementation

### SCE-62: Missing Fragrance Data - Family Shows as 'Unknown'

**Technical Approach:**
```typescript
// Update fragrance import/normalization logic
const normalizeFragranceFamily = (family: string | null): string => {
  if (!family || family.toLowerCase() === 'unknown') {
    // Implement ML-based family classification using notes
    return inferFamilyFromNotes(fragrance.notes) || 'Unclassified'
  }
  return standardizeFamilyName(family)
}

// Database migration to fix existing records
UPDATE fragrances 
SET family = COALESCE(inferred_family, 'Unclassified')
WHERE family IS NULL OR family = 'Unknown'
```

**Files to Modify:**
- `lib/data-quality/missing-product-detector.ts`
- Database migration script
- Fragrance import pipeline

### SCE-63: 404 Errors for Missing Resources

**Technical Approach:**
```typescript
// Implement resource validation middleware
export async function validateImageResource(url: string): Promise<string> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    if (!response.ok) {
      return DEFAULT_FRAGRANCE_IMAGE
    }
    return url
  } catch {
    return DEFAULT_FRAGRANCE_IMAGE
  }
}

// Add resource validation to fragrance queries
const fragranceWithValidatedImages = {
  ...fragrance,
  image_url: await validateImageResource(fragrance.image_url),
  brand_logo: await validateImageResource(fragrance.brand_logo)
}
```

**Files to Modify:**
- API routes serving fragrance data
- Image handling utilities
- Error logging for resource tracking

### SCE-64: Inconsistent Empty States on Browse Page

**Technical Approach:**
```typescript
// Standardize empty state component
const EmptyState = ({ 
  type, 
  title, 
  description, 
  action 
}: EmptyStateProps) => (
  <div className="text-center py-12">
    {getEmptyStateIcon(type)}
    <h3 className="mt-4 text-lg font-medium">{title}</h3>
    <p className="mt-2 text-gray-600">{description}</p>
    {action && <Button className="mt-4">{action}</Button>}
  </div>
)

// Implement consistent empty state logic
const getEmptyStateConfig = (context: BrowseContext) => {
  switch (context) {
    case 'no-results': return { type: 'search', title: 'No fragrances found', ... }
    case 'loading-error': return { type: 'error', title: 'Something went wrong', ... }
    case 'no-filters': return { type: 'browse', title: 'Discover fragrances', ... }
  }
}
```

**Files to Modify:**
- `app/browse/page.tsx`
- `components/ui/empty-state.tsx` (new)
- Browse page loading states

### SCE-65: Quiz-to-Account Conversion Flow

**Technical Approach:**
```typescript
// Implement progressive engagement without forced auth
const QuizResultsFlow = () => {
  const [guestSession, setGuestSession] = useState<GuestSession>()
  
  // Allow exploration without account
  const exploreRecommendations = async () => {
    // Store session in localStorage/cookies
    await saveGuestProgress({
      recommendations,
      favorites: [],
      timestamp: Date.now()
    })
  }
  
  // Natural conversion points
  const showConversionPrompt = () => {
    if (guestSession.favorites.length >= 3) {
      return <SaveProgressPrompt session={guestSession} />
    }
  }
}

// Server Action for guest session management
export async function saveGuestSession(data: GuestSessionData) {
  // Store in secure httpOnly cookie or session storage
  const sessionId = generateSecureId()
  await storeGuestSession(sessionId, data)
  return { sessionId }
}
```

**Files to Modify:**
- `components/quiz/conversion-flow.tsx`
- `lib/quiz/guest-session-manager.ts`
- Quiz result pages

### SCE-66: AI Explanations Too Verbose

**Technical Approach:**
```typescript
// Experience-adaptive AI prompt system
const getAIPromptByExperience = (level: ExperienceLevel) => {
  const prompts = {
    beginner: `Explain in 30-40 words max. Use simple language. 
               Focus on: why it matches, who wears it, what it's like.
               Format: ✅ Fresh & clean ✓ 👍 Works for school/work 💡 Like Sauvage but unique`,
    
    advanced: `Provide detailed analysis including note breakdown, 
              occasion suitability, and collection synergy...`
  }
  return prompts[level] || prompts.beginner
}

// Modify AI service calls
const getPersonalizedExplanation = async (fragrance, userProfile) => {
  const prompt = getAIPromptByExperience(userProfile.experience_level)
  return await aiService.generateExplanation(fragrance, prompt)
}
```

**Files to Modify:**
- `lib/ai-sdk/unified-recommendation-engine.ts`
- AI prompt configuration
- Recommendation display components

### SCE-67: Missing Fragrance Education Foundation

**Technical Approach:**
```typescript
// Educational tooltip system
const EducationalTooltip = ({ term, definition, examples }: Props) => (
  <Tooltip>
    <TooltipTrigger className="underline decoration-dotted">
      {term}
    </TooltipTrigger>
    <TooltipContent>
      <div className="max-w-xs">
        <p className="font-medium">{definition}</p>
        {examples && <p className="text-sm text-gray-600">e.g., {examples}</p>}
      </div>
    </TooltipContent>
  </Tooltip>
)

// Education data structure
const FRAGRANCE_EDUCATION = {
  concentrations: {
    EDP: { name: 'Eau de Parfum', strength: 'stronger, lasts 6-8 hours' },
    EDT: { name: 'Eau de Toilette', strength: 'lighter, lasts 3-5 hours' }
  },
  noteTypes: {
    fresh: { description: 'Clean, crisp feeling', examples: 'lemon, mint, ocean breeze' }
  }
}
```

**Files to Modify:**
- `components/ui/educational-tooltip.tsx` (new)
- Fragrance detail pages
- Quiz interface

### SCE-68: Choice Paralysis from Too Many Variants

**Technical Approach:**
```typescript
// Smart variant grouping algorithm
const groupFragranceVariants = (fragrances: Fragrance[]) => {
  const groups = groupBy(fragrances, f => f.base_name)
  
  return Object.entries(groups).map(([baseName, variants]) => ({
    baseName,
    primary: findPrimaryVariant(variants), // Most popular/recommended
    alternatives: variants
      .filter(v => v.id !== primary.id)
      .map(v => ({
        ...v,
        differentiator: getVariantDifferentiator(v, primary)
      }))
  }))
}

// Smart result hierarchy
const FragranceVariantGroup = ({ group }: Props) => (
  <div className="space-y-2">
    <FragranceCard 
      fragrance={group.primary} 
      badge="Most Popular"
      prominence="primary"
    />
    <CollapsibleSection title={`${group.alternatives.length} more variants`}>
      {group.alternatives.map(variant => (
        <FragranceCard 
          key={variant.id}
          fragrance={variant}
          badge={variant.differentiator}
          prominence="secondary"
        />
      ))}
    </CollapsibleSection>
  </div>
)
```

**Files to Modify:**
- Search results components
- Fragrance grouping logic
- Browse page variant display

### SCE-69: Missing Social Validation

**Technical Approach:**
```typescript
// Social context data structure
interface SocialContext {
  demographics: {
    popularWith: string[] // ['college students', 'young professionals']
    ageRange: [number, number]
    approvalRating: number
  }
  popularity: {
    level: 'very common' | 'popular' | 'unique' | 'niche'
    score: number // 1-10
    trending: boolean
  }
  peerData: {
    similarUsersApproval: number
    beginnerFriendly: number
  }
}

// Social proof component
const SocialProofBadges = ({ context }: { context: SocialContext }) => (
  <div className="flex gap-2 text-sm">
    <Badge>👥 Popular with {context.demographics.popularWith[0]}</Badge>
    <Badge>🎯 Age {context.demographics.ageRange.join('-')}</Badge>
    <Badge>⭐ {context.peerData.beginnerFriendly}/10 beginner-friendly</Badge>
  </div>
)
```

**Files to Modify:**
- Fragrance database schema (add social metrics)
- Social context calculation service
- Fragrance card components

### SCE-70: Add Context Questions to Quiz

**Technical Approach:**
```typescript
// Enhanced quiz flow with context collection
const ContextCollectionStep = ({ userLevel }: Props) => {
  if (userLevel === 'beginner') {
    return (
      <FormField name="knownFragrances">
        <Label>Any fragrances you've heard about?</Label>
        <CheckboxGroup>
          <Checkbox value="sauvage">Sauvage by Dior</Checkbox>
          <Checkbox value="bleu">Bleu de Chanel</Checkbox>
          <Checkbox value="acqua">Acqua di Gio</Checkbox>
          <Checkbox value="store">Something I smelled at a store</Checkbox>
          <Checkbox value="none">I haven't heard of any</Checkbox>
        </CheckboxGroup>
        <Input placeholder="Other..." />
      </FormField>
    )
  }
  
  return <CurrentCollectionInput /> // For advanced users
}

// AI prompt enhancement with context
const enhanceRecommendationPrompt = (basePrompt: string, context: QuizContext) => {
  if (context.knownFragrances.includes('sauvage')) {
    return `${basePrompt} 
            User is interested in Sauvage. Include Sauvage in recommendations 
            and suggest similar alternatives.`
  }
  return basePrompt
}
```

**Files to Modify:**
- Quiz flow components
- Quiz context management
- AI recommendation prompts

## Dependencies & Libraries

**Required:**
- React Hook Form (form handling)
- Zod (validation schemas)
- shadcn/ui Tooltip component
- @supabase/ssr (database operations)

**Optional Additions:**
- React Query (caching for social metrics)
- Framer Motion (progressive disclosure animations)

## Testing Strategy

**Unit Tests:**
- Data normalization functions
- AI prompt generation logic
- Variant grouping algorithms

**Integration Tests:**
- Quiz flow with context collection
- Guest session management
- Resource validation pipeline

**Browser Tests:**
- Complete beginner user journey
- Conversion flow optimization
- Educational tooltip interactions

## Performance Considerations

- Cache social metrics data (update weekly)
- Lazy load educational content
- Optimize image resource validation
- Progressive enhancement for JavaScript-disabled users

## Rollout Strategy

**Phase 1**: Technical fixes (SCE-62, 63, 64) - Foundation stability
**Phase 2**: Conversion optimization (SCE-65) - Business impact
**Phase 3**: Educational features (SCE-66, 67) - User experience  
**Phase 4**: Social features (SCE-68, 69, 70) - Engagement enhancement