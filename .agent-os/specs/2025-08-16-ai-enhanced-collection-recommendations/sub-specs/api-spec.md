# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-16-ai-enhanced-collection-recommendations/spec.md

## Endpoints

### POST /api/collections/analyze

**Purpose:** Analyze user's collection to generate preference insights and recommendations
**Parameters:**

- `userId: string` - User identifier
- `collectionId?: string` - Optional specific collection ID (defaults to main collection)
- `includeReasons: boolean` - Whether to include detailed AI reasoning (default: true)

**Response:**

```json
{
  "preferenceProfile": {
    "scentFamilies": ["woody", "citrus"],
    "seasonalPreferences": ["spring", "summer"],
    "priceRange": { "min": 50, "max": 200 },
    "brandAffinity": ["Tom Ford", "Creed"],
    "intensityPreference": "moderate"
  },
  "insights": {
    "dominantNotes": ["bergamot", "sandalwood", "vanilla"],
    "occasionGaps": ["formal evening", "winter casual"],
    "recommendations": [
      {
        "fragranceId": "abc123",
        "reasoning": "Detailed AI explanation...",
        "confidenceScore": 0.92,
        "collectionFit": "complements existing woody collection"
      }
    ]
  }
}
```

### POST /api/collections/categorize

**Purpose:** Auto-categorize collection items with AI analysis
**Parameters:**

- `userId: string` - User identifier
- `fragranceIds: string[]` - Array of fragrance IDs to categorize
- `preserveManual: boolean` - Keep existing manual categorizations (default: true)

**Response:**

```json
{
  "categorizations": [
    {
      "fragranceId": "abc123",
      "aiSuggestion": {
        "scentFamily": "woody",
        "occasion": ["casual", "office"],
        "season": ["fall", "winter"],
        "intensity": "moderate"
      },
      "confidence": 0.88,
      "reasoning": "Based on sandalwood and cedar notes..."
    }
  ]
}
```

### GET /api/collections/gaps

**Purpose:** Identify collection gaps and suggest strategic additions
**Parameters:**

- `userId: string` - User identifier
- `analysisType: string` - Type of gap analysis ("scent_family" | "seasonal" | "occasion" | "comprehensive")

**Response:**

```json
{
  "gaps": [
    {
      "type": "scent_family",
      "missing": "fresh_aquatic",
      "impact": "high",
      "reasoning": "No fresh aquatic scents for summer...",
      "suggestions": [
        {
          "fragranceId": "xyz789",
          "fitReason": "Perfect summer complement to woody collection"
        }
      ]
    }
  ],
  "strategicRecommendations": [
    {
      "fragranceId": "def456",
      "priority": "high",
      "reasoning": "Fills major seasonal gap..."
    }
  ]
}
```

### GET /api/collections/insights

**Purpose:** Get visual analytics data for collection dashboard
**Parameters:**

- `userId: string` - User identifier
- `timeframe?: string` - Analysis timeframe ("all_time" | "last_year" | "last_6_months")

**Response:**

```json
{
  "analytics": {
    "scentFamilyDistribution": {
      "woody": 35,
      "citrus": 25,
      "floral": 20,
      "oriental": 20
    },
    "seasonalCoverage": {
      "spring": 4,
      "summer": 6,
      "fall": 5,
      "winter": 3
    },
    "occasionCoverage": {
      "casual": 8,
      "office": 5,
      "evening": 3,
      "formal": 2
    },
    "trends": {
      "recentPreferences": ["citrus", "fresh"],
      "evolvingTastes": "Moving toward lighter scents"
    }
  }
}
```

### POST /api/recommendations/collection-based

**Purpose:** Generate recommendations prioritizing collection analysis
**Parameters:**

- `userId: string` - User identifier
- `context?: string` - Context for recommendations ("homepage" | "fragrance_detail" | "collection_page")
- `limit?: number` - Number of recommendations (default: 10)
- `includeReasoning: boolean` - Include detailed AI reasoning (default: true)

**Response:**

```json
{
  "recommendations": [
    {
      "fragranceId": "abc123",
      "score": 0.94,
      "reasoning": {
        "collectionAlignment": "Perfectly complements your woody collection...",
        "gapFilling": "Addresses your lack of winter evening scents...",
        "preferenceMatch": "Matches your preference for moderate intensity..."
      },
      "tags": ["collection_complement", "gap_filler", "high_confidence"]
    }
  ],
  "meta": {
    "analysisBase": "collection_primary",
    "totalCollectionItems": 15,
    "confidenceLevel": "high"
  }
}
```

## Controllers

### CollectionAnalysisController

- **analyzeCollection()** - Orchestrates collection analysis using OpenAI GPT-4
- **generatePreferenceProfile()** - Creates user preference model from collection data
- **updateProfile()** - Real-time profile updates based on new collection items

### SmartCategorizationController

- **categorizeItems()** - Auto-categorize fragrances using AI analysis
- **handleManualOverride()** - Process manual categorization changes
- **learnFromOverrides()** - Update AI model based on user corrections

### GapAnalysisController

- **identifyGaps()** - Analyze collection for missing scent profiles
- **generateStrategicRecommendations()** - Create gap-filling recommendations
- **calculateCollectionBalance()** - Assess collection coverage across dimensions

### VisualInsightsController

- **generateAnalytics()** - Create visual analytics data for dashboards
- **trackPreferenceTrends()** - Monitor preference evolution over time
- **formatDashboardData()** - Prepare data for frontend visualization
