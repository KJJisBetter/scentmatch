# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-17-enhanced-quiz-ai-recommendations/spec.md

## API Endpoints

### POST /api/quiz/start-enhanced

**Purpose**: Start new quiz session with experience level detection
**Parameters**:

- `experience_level`: Optional string ('beginner', 'enthusiast', 'collector')
- `referral_source`: Optional tracking string
  **Response**:

```json
{
  "session_token": "uuid",
  "session_id": "uuid",
  "first_question": {
    "id": "string",
    "text": "string",
    "options": ["array"],
    "type": "experience_detection"
  },
  "adaptive_ui_mode": "beginner" | "standard" | "advanced"
}
```

**Errors**:

- 500: Session creation failed
- 429: Rate limit exceeded

### POST /api/quiz/submit-experience-level

**Purpose**: Process experience level selection and adapt quiz flow
**Parameters**:

- `session_token`: Required UUID
- `experience_level`: Required string ('beginner', 'enthusiast', 'collector')
- `previous_experience`: Optional text description
  **Response**:

```json
{
  "success": true,
  "adaptive_mode": "beginner" | "standard" | "advanced",
  "next_question": {
    "id": "string",
    "text": "string",
    "options": ["array"],
    "complexity_level": "simple" | "intermediate" | "advanced"
  },
  "show_favorites_input": boolean
}
```

### POST /api/quiz/select-favorites

**Purpose**: Allow advanced users to input favorite fragrances
**Parameters**:

- `session_token`: Required UUID
- `fragrance_ids`: Array of UUIDs from database
- `confidence_scores`: Array of numbers (0.0-1.0) matching fragrance_ids
  **Response**:

```json
{
  "success": true,
  "favorites_processed": 5,
  "personality_hints": {
    "emerging_families": ["oriental", "woody"],
    "style_indicators": ["sophisticated", "bold"]
  },
  "skip_basic_questions": boolean,
  "next_question": {...}
}
```

### GET /api/fragrances/search-favorites

**Purpose**: Autocomplete search for favorite fragrance selection
**Parameters**:

- `query`: Search string (minimum 3 characters)
- `limit`: Optional integer (default 10, max 50)
- `sample_only`: Optional boolean (default false)
  **Response**:

```json
{
  "fragrances": [{
    "id": "uuid",
    "name": "string",
    "brand": "string",
    "scent_family": "string",
    "popularity_score": number,
    "sample_available": boolean
  }],
  "total_matches": number
}
```

### POST /api/quiz/generate-profile

**Purpose**: Generate AI-powered unique profile name and description
**Parameters**:

- `session_token`: Required UUID
- `force_new`: Optional boolean (default false)
- `experience_level`: Required string
  **Response**:

```json
{
  "success": true,
  "unique_profile_name": "Velvet Wanderer of Midnight Gardens",
  "profile_description": {
    "paragraph_1": "Core identity description...",
    "paragraph_2": "Lifestyle integration...",
    "paragraph_3": "Discovery potential..."
  },
  "personality_type": "sophisticated",
  "confidence_score": 0.87,
  "generation_method": "ai" | "template" | "cached"
}
```

### GET /api/recommendations/enhanced

**Purpose**: Get real fragrance recommendations with AI explanations
**Parameters**:

- `session_token`: Required UUID
- `max_results`: Optional integer (default 8, max 20)
- `include_adventurous`: Optional boolean (default true)
- `price_max`: Optional number (filter by sample price)
  **Response**:

```json
{
  "recommendations": [{
    "fragrance_id": "uuid",
    "name": "string",
    "brand": "string",
    "match_score": 0.89,
    "quiz_reasoning": "Based on your sophisticated yet playful nature...",
    "experience_relevance": "Perfect for collectors seeking unique signatures",
    "sample_available": true,
    "sample_price_usd": 8.50,
    "notes": ["bergamot", "sandalwood", "vanilla"],
    "scent_family": "oriental"
  }],
  "total_found": number,
  "recommendation_categories": {
    "perfect_matches": 3,
    "adventurous": 2,
    "seasonal": 3
  }
}
```

### POST /api/auth/convert-session

**Purpose**: Convert guest quiz session to authenticated account
**Parameters**:

- `session_token`: Required UUID
- `email`: Required string
- `password`: Required string
- `display_name`: Optional string
  **Response**:

```json
{
  "success": true,
  "user_id": "uuid",
  "profile_transferred": true,
  "recommendations_preserved": true,
  "account_creation_bonus": {
    "sample_discount": 0.2,
    "expires_at": "iso_string"
  }
}
```

**Errors**:

- 400: Invalid session token or expired session
- 409: Email already exists
- 422: Password validation failed

## Controllers

### QuizEnhancedController

**Actions**:

- `startEnhanced()`: Initialize experience-adaptive quiz session
- `submitExperienceLevel()`: Process experience selection and branch logic
- `selectFavorites()`: Handle favorite fragrance input for advanced users
- `generateProfile()`: Create AI-powered unique profiles

**Business Logic**:

- Experience level detection and UI mode selection
- Dynamic question branching based on user expertise
- Favorite fragrance processing and preference extraction
- AI profile generation with caching and fallback strategies

### RecommendationsEnhancedController

**Actions**:

- `getEnhanced()`: Provide real database recommendations with AI explanations
- `refreshWithFavorites()`: Update recommendations based on selected favorites
- `explainMatch()`: Generate detailed reasoning for specific recommendations

**Business Logic**:

- Hybrid recommendation scoring (vector + collaborative + behavioral)
- Experience-level appropriate recommendation filtering
- AI-generated match explanations with fragrance-specific reasoning
- Performance optimization with multi-layer caching

### AuthConversionController

**Actions**:

- `convertSession()`: Transfer guest session to authenticated account
- `preserveProfile()`: Maintain quiz data through account creation
- `applyCreationBonus()`: Reward successful account conversion

**Business Logic**:

- Atomic session transfer to prevent data loss
- Profile preservation across authentication boundaries
- Conversion rate optimization with incentives and rewards
