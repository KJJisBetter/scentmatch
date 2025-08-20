# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-20-browse-collection-redesign/spec.md

## Endpoints

### POST /api/collection

**Purpose:** Add or remove a fragrance from user's personal collection
**Parameters:** 
- `fragrance_id` (string, required): ID of the fragrance
- `action` (string, required): "add" or "remove"
**Response:** 
```json
{
  "success": boolean,
  "in_collection": boolean,
  "message": string
}
```
**Errors:** 401 (unauthorized), 400 (invalid fragrance_id), 500 (database error)

### POST /api/wishlist

**Purpose:** Add or remove a fragrance from user's wishlist
**Parameters:**
- `fragrance_id` (string, required): ID of the fragrance  
- `action` (string, required): "add" or "remove"
**Response:**
```json
{
  "success": boolean,
  "in_wishlist": boolean,
  "message": string
}
```
**Errors:** 401 (unauthorized), 400 (invalid fragrance_id), 500 (database error)

### GET /api/collection/status

**Purpose:** Get collection and wishlist status for multiple fragrances
**Parameters:**
- `fragrance_ids` (string, required): Comma-separated list of fragrance IDs
**Response:**
```json
{
  "statuses": {
    "fragrance_id_1": {
      "in_collection": boolean,
      "in_wishlist": boolean
    },
    "fragrance_id_2": {
      "in_collection": boolean,
      "in_wishlist": boolean
    }
  }
}
```
**Errors:** 401 (unauthorized), 400 (invalid parameters)

### GET /api/browse/personalized

**Purpose:** Get personalized fragrance sorting for authenticated users with collection data
**Parameters:**
- `limit` (number, optional): Number of fragrances to return (default: 20)
- `offset` (number, optional): Pagination offset (default: 0)
**Response:**
```json
{
  "fragrances": Array<FragranceResult>,
  "total": number,
  "sorting_strategy": "personalized" | "popularity",
  "user_collection_size": number
}
```
**Errors:** 401 (unauthorized), 500 (AI service error)

### GET /api/affiliates/links

**Purpose:** Get affiliate purchase links for a specific fragrance
**Parameters:**
- `fragrance_id` (string, required): ID of the fragrance
- `link_type` (string, optional): "sample", "travel", "full" (default: all)
**Response:**
```json
{
  "links": {
    "samples": [
      {
        "retailer": string,
        "url": string,
        "price": string,
        "size": string
      }
    ],
    "travel_sizes": Array<RetailerLink>,
    "full_bottles": Array<RetailerLink>
  }
}
```
**Errors:** 404 (fragrance not found), 500 (affiliate service error)

### POST /api/brands/normalize

**Purpose:** Normalize brand variations and return canonical brand information
**Parameters:**
- `brand_names` (array[string], required): List of brand names to normalize
**Response:**
```json
{
  "normalized": {
    "input_brand_1": {
      "canonical_name": string,
      "parent_brand": string,
      "sub_brand": string
    }
  }
}
```
**Errors:** 400 (invalid input), 500 (processing error)

## Controllers

### Collection Controller
- Validates user authentication via Supabase session
- Performs collection CRUD operations on user_collections table
- Returns optimistic response data for immediate UI updates
- Triggers AI recommendation model updates when collection changes

### Wishlist Controller  
- Validates user authentication via Supabase session
- Performs wishlist CRUD operations on user_wishlists table
- Returns optimistic response data for immediate UI updates
- Triggers AI preference learning updates when wishlist changes

### Personalized Browse Controller
- Determines user's collection/wishlist status and size
- Routes to AI recommendation engine for users with collection data
- Falls back to popularity sorting for new/unauthenticated users
- Implements caching strategy for personalized results
- Returns appropriate sorting strategy metadata for UI adaptation

### Affiliate Links Controller
- Retrieves affiliate purchase options for specific fragrances
- Handles multiple retailer integrations (sample sites, department stores, etc.)
- Implements price comparison and availability checking
- Returns organized links by purchase type (sample/travel/full)
- Maintains affiliate tracking parameters for revenue attribution

### Brand Normalization Controller
- Implements brand intelligence algorithm for name variations
- Handles parent/sub-brand relationships (Giorgio Armani/Emporio Armani)
- Caches normalization results for performance
- Returns canonical brand data for consistent display