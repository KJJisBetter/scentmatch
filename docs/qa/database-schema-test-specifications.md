# Database Schema Test Specifications - Task 3.1

> **Test Scope:** Database schema validation, data import compatibility, and constraint testing
> **Data Volume:** 1,467 fragrances, 40 brands from real JSON datasets
> **Target Environment:** Supabase PostgreSQL with pgvector extension

## 1. Table Structure Validation Tests

### 1.1 fragrance_brands Table Tests

**Test ID:** SCHEMA-001  
**Objective:** Validate fragrance_brands table structure matches expected schema

#### Test Cases:

**SCHEMA-001a: Table Creation Validation**
- **Given:** Clean database with extensions enabled
- **When:** Create fragrance_brands table with schema from database-schema.md
- **Then:** 
  - Table created successfully
  - All columns present with correct data types:
    - `id` TEXT PRIMARY KEY
    - `name` TEXT NOT NULL
    - `slug` TEXT UNIQUE NOT NULL
    - `item_count` INTEGER DEFAULT 0
    - `description` TEXT (nullable)
    - `website_url` TEXT (nullable)
    - `popularity_score` INTEGER DEFAULT 0
    - `created_at` TIMESTAMPTZ DEFAULT NOW()
    - `updated_at` TIMESTAMPTZ DEFAULT NOW()

**SCHEMA-001b: Index Creation Validation**
- **Given:** fragrance_brands table exists
- **When:** Create performance indexes
- **Then:**
  - `idx_brands_name` index exists on name column
  - `idx_brands_popularity` index exists on popularity_score DESC
  - Query planner uses indexes for name searches
  - Query planner uses indexes for popularity sorting

**SCHEMA-001c: Constraint Validation**
- **Given:** fragrance_brands table with indexes
- **When:** Test constraint enforcement
- **Then:**
  - PRIMARY KEY constraint prevents duplicate IDs
  - UNIQUE constraint prevents duplicate slugs
  - NOT NULL constraint prevents empty names
  - DEFAULT values applied correctly for new records

### 1.2 fragrances Table Tests

**Test ID:** SCHEMA-002  
**Objective:** Validate fragrances table structure and complex constraints

#### Test Cases:

**SCHEMA-002a: Column Structure Validation**
- **Given:** Clean database with fragrance_brands table
- **When:** Create fragrances table
- **Then:**
  - All columns created with correct types:
    - `id` TEXT PRIMARY KEY
    - `brand_id` TEXT with foreign key to fragrance_brands(id)
    - `rating_value` DECIMAL(3,2) (nullable)
    - `accords` TEXT[] array type
    - `perfumers` TEXT[] array type
    - `embedding` VECTOR(1536) for AI features
  - Foreign key relationship enforced to fragrance_brands
  - CASCADE DELETE configured properly

**SCHEMA-002b: Check Constraint Validation**
- **Given:** fragrances table exists
- **When:** Insert records with various gender values
- **Then:**
  - Valid genders accepted: 'for women', 'for men', 'unisex'
  - Invalid gender values rejected
  - Null gender values accepted (optional field)

**SCHEMA-002c: Array Column Validation**
- **Given:** fragrances table exists
- **When:** Insert records with accords and perfumers arrays
- **Then:**
  - Empty arrays `[]` accepted
  - Multi-element arrays stored correctly
  - Array elements retrievable via SQL queries
  - NULL values handled properly

**SCHEMA-002d: Vector Column Validation**
- **Given:** fragrances table with pgvector extension
- **When:** Insert records with embedding vectors
- **Then:**
  - 1536-dimension vectors accepted
  - Vector similarity queries functional
  - Invalid dimension vectors rejected
  - NULL embeddings accepted for future population

### 1.3 user_profiles Table Tests

**Test ID:** SCHEMA-003  
**Objective:** Validate user profiles structure and RLS policies

#### Test Cases:

**SCHEMA-003a: User Profile Structure**
- **Given:** Supabase auth.users table exists
- **When:** Create user_profiles table
- **Then:**
  - UUID primary key with default generation
  - Foreign key to auth.users(id) with CASCADE DELETE
  - UNIQUE constraint on user_id (one profile per user)
  - Check constraints on experience_level and profile_privacy
  - Array columns for favorite_accords and disliked_accords

**SCHEMA-003b: RLS Policy Enforcement**
- **Given:** user_profiles table with RLS enabled
- **When:** Test access with different user contexts
- **Then:**
  - Authenticated users can view only their own profile
  - Authenticated users can update only their own profile
  - Authenticated users can insert only their own profile
  - Anonymous users cannot access any profiles
  - Cross-user access attempts blocked

### 1.4 user_collections Table Tests

**Test ID:** SCHEMA-004  
**Objective:** Validate user collections structure and relationships

#### Test Cases:

**SCHEMA-004a: Collection Structure Validation**
- **Given:** user_profiles and fragrances tables exist
- **When:** Create user_collections table
- **Then:**
  - Foreign keys to both auth.users and fragrances tables
  - UNIQUE constraint on (user_id, fragrance_id, collection_type)
  - Check constraint on rating (1-10 range)
  - Check constraint on collection_type enum values
  - CASCADE DELETE on both foreign keys

**SCHEMA-004b: Unique Constraint Testing**
- **Given:** user_collections table exists
- **When:** Insert duplicate collection entries
- **Then:**
  - Same user can have same fragrance in different collection types
  - Same user cannot have duplicate fragrance in same collection type
  - Different users can have same fragrance in same collection type

## 2. Data Import Compatibility Tests

### 2.1 Brand Data Import Tests

**Test ID:** IMPORT-001  
**Objective:** Validate brands.json data maps correctly to database schema

#### Test Cases:

**IMPORT-001a: Schema Mapping Validation**
- **Given:** brands.json with 40 brand records
- **When:** Map JSON fields to database columns
- **Then:**
  - `id` maps to `id` (TEXT)
  - `name` maps to `name` (TEXT)
  - `slug` maps to `slug` (TEXT)
  - `itemCount` maps to `item_count` (INTEGER)
  - All 40 records have required fields populated
  - No data type conversion errors

**IMPORT-001b: Batch Import Performance**
- **Given:** 40 brand records in JSON format
- **When:** Execute batch import via import_brands() function
- **Then:**
  - All 40 records imported successfully
  - Import completes in <100ms
  - Function returns correct count (40)
  - No duplicate key violations
  - Proper upsert behavior on conflicts

**IMPORT-001c: Data Validation During Import**
- **Given:** brands.json with edge cases
- **When:** Import brands with missing/invalid data
- **Then:**
  - Required fields (id, name, slug) validated
  - Optional fields (description, website_url) handled properly
  - Invalid itemCount values handled gracefully
  - Import continues despite individual record failures
  - Error logging captures problematic records

### 2.2 Fragrance Data Import Tests

**Test ID:** IMPORT-002  
**Objective:** Validate fragrances.json data import with complex types

#### Test Cases:

**IMPORT-002a: Complex Field Mapping**
- **Given:** fragrances.json with 1,467 records
- **When:** Map JSON to database schema
- **Then:**
  - Arrays (accords, perfumers) converted correctly
  - Decimal values (ratingValue, score) preserve precision
  - URL field (fragrantica_url) mapped from 'url'
  - Foreign key (brand_id) references valid brands
  - NULL/empty values handled appropriately

**IMPORT-002b: Large Dataset Performance**
- **Given:** 1,467 fragrance records
- **When:** Execute batch import via import_fragrances() function
- **Then:**
  - Import completes in <2 seconds
  - Memory usage remains stable during import
  - No connection timeouts or deadlocks
  - Transaction commits successfully
  - Function returns correct count (1,467)

**IMPORT-002c: Data Integrity Validation**
- **Given:** Imported fragrance data
- **When:** Validate data integrity post-import
- **Then:**
  - All brand_id values reference existing brands
  - Rating values within valid ranges (0.0-5.0)
  - Array fields contain valid string elements
  - No orphaned records created
  - Timestamp fields populated with import time

**IMPORT-002d: Error Handling and Recovery**
- **Given:** Corrupted or malformed JSON data
- **When:** Import fragrance data with errors
- **Then:**
  - Invalid JSON rejected with clear error message
  - Missing required fields logged and skipped
  - Invalid data types converted or rejected gracefully
  - Partial imports roll back on critical errors
  - Recovery mechanism allows re-running imports

## 3. Search & Performance Testing

### 3.1 Full-Text Search Tests

**Test ID:** SEARCH-001  
**Objective:** Validate full-text search functionality and performance

#### Test Cases:

**SEARCH-001a: GIN Index Performance**
- **Given:** fragrances table with 1,467 records and search index
- **When:** Execute full-text searches on fragrance names
- **Then:**
  - Search queries complete in <50ms
  - GIN index used by query planner
  - Ranking relevance works correctly
  - Case-insensitive searches supported
  - Partial word matching functional

**SEARCH-001b: Trigram Search Validation**
- **Given:** pg_trgm extension enabled with trigram index
- **When:** Execute fuzzy searches for fragrance names
- **Then:**
  - Typo-tolerant searches work (e.g., "channl" finds "Chanel")
  - Similarity threshold configurable
  - Performance <100ms for fuzzy searches
  - Results ranked by similarity score
  - Index covers name field effectively

**SEARCH-001c: Combined Search Performance**
- **Given:** Multiple search indexes active
- **When:** Execute complex queries combining text search and filters
- **Then:**
  - Multi-condition queries optimized
  - Index intersection used appropriately
  - Performance degradation <2x vs single-condition queries
  - Memory usage remains reasonable
  - Concurrent searches don't block each other

### 3.2 Vector Similarity Tests

**Test ID:** SEARCH-002  
**Objective:** Validate pgvector functionality for AI recommendations

#### Test Cases:

**SEARCH-002a: Vector Storage Validation**
- **Given:** fragrances table with embedding column
- **When:** Store 1536-dimension vectors for test fragrances
- **Then:**
  - Vectors stored without data loss
  - Vector dimensions enforced (reject non-1536)
  - Storage size appropriate for dataset
  - NULL vectors handled correctly
  - Vector data retrievable accurately

**SEARCH-002b: Similarity Query Performance**
- **Given:** 100+ fragrances with populated embeddings
- **When:** Execute cosine similarity searches
- **Then:**
  - Similarity queries complete in <200ms
  - Results ranked by similarity score
  - HNSW index used for performance (when available)
  - Similarity scores in expected range (0-1)
  - Top-K queries return correct result count

**SEARCH-002c: Vector Index Optimization**
- **Given:** Large vector dataset
- **When:** Create and test vector indexes
- **Then:**
  - Index creation completes successfully
  - Query performance improves significantly with index
  - Index size reasonable for dataset
  - Index maintenance doesn't block queries
  - Concurrent vector operations supported

### 3.3 Query Performance Benchmarks

**Test ID:** PERF-001  
**Objective:** Establish performance baselines for production readiness

#### Test Cases:

**PERF-001a: Basic Query Benchmarks**
- **Given:** Full dataset loaded (1,467 fragrances, 40 brands)
- **When:** Execute standard query patterns
- **Then:**
  - Single fragrance lookup by ID: <5ms
  - Brand fragrance listing: <20ms
  - Paginated fragrance browsing: <50ms
  - Filtered searches: <100ms
  - Complex joins with collections: <150ms

**PERF-001b: Concurrent Load Testing**
- **Given:** Database under simulated load
- **When:** 10 concurrent users executing mixed queries
- **Then:**
  - Response times increase <50% under load
  - No query failures or timeouts
  - Connection pool handles concurrent requests
  - Memory usage remains stable
  - Database locks don't cause significant blocking

**PERF-001c: Index Effectiveness Validation**
- **Given:** Various query patterns and indexes
- **When:** Analyze query execution plans
- **Then:**
  - All critical queries use appropriate indexes
  - No table scans on large tables
  - Index hit ratios >95% for repeated queries
  - Query plan caching effective
  - Statistics up-to-date for optimal planning

## 4. Security & RLS Testing

### 4.1 Row Level Security Tests

**Test ID:** SECURITY-001  
**Objective:** Validate user data isolation and security policies

#### Test Cases:

**SECURITY-001a: User Profile Isolation**
- **Given:** Multiple users with profiles
- **When:** User A attempts to access User B's profile
- **Then:**
  - Cross-user SELECT queries return no results
  - Cross-user UPDATE attempts fail
  - Cross-user DELETE attempts fail
  - Policy violations logged appropriately
  - No data leakage through JOIN operations

**SECURITY-001b: Collection Privacy Enforcement**
- **Given:** User collections with different privacy settings
- **When:** Users attempt to access other users' collections
- **Then:**
  - Private collections hidden from other users
  - Public collections visible as intended
  - Collection statistics aggregated safely
  - No private data exposed in public views
  - Proper error messages for unauthorized access

**SECURITY-001c: Anonymous Access Control**
- **Given:** Public fragrance and brand data
- **When:** Anonymous users browse fragrance data
- **Then:**
  - Public fragrance data accessible
  - Brand data accessible
  - User-specific data inaccessible
  - No authentication bypass possible
  - Rate limiting applied appropriately

### 4.2 Data Privacy Compliance Tests

**Test ID:** SECURITY-002  
**Objective:** Ensure GDPR/privacy compliance in data handling

#### Test Cases:

**SECURITY-002a: Data Minimization Validation**
- **Given:** User registration and profile creation
- **When:** Analyze stored user data
- **Then:**
  - Only necessary data fields populated
  - Optional fields remain NULL when not provided
  - No sensitive data stored unnecessarily
  - Data retention policies implemented
  - Audit trail for data modifications

**SECURITY-002b: User Data Deletion**
- **Given:** User requests account deletion
- **When:** Execute user data deletion process
- **Then:**
  - User profile deleted completely
  - User collections removed
  - References to user anonymized where needed
  - Foreign key constraints properly handle deletion
  - No orphaned personal data remains

## 5. Relationship & Constraint Testing

### 5.1 Foreign Key Constraint Tests

**Test ID:** CONSTRAINT-001  
**Objective:** Validate referential integrity enforcement

#### Test Cases:

**CONSTRAINT-001a: Brand-Fragrance Relationship**
- **Given:** Fragrances table with brand references
- **When:** Attempt to delete referenced brand
- **Then:**
  - CASCADE DELETE removes dependent fragrances
  - No orphaned fragrance records remain
  - Transaction completes successfully
  - Dependent collection entries also cleaned up
  - Audit logs capture cascaded deletions

**CONSTRAINT-001b: User-Collection Relationship**
- **Given:** User collections referencing users and fragrances
- **When:** Delete user or fragrance records
- **Then:**
  - Collections properly cascade delete with users
  - Collections cascade delete with fragrances
  - No orphaned collection records
  - Referential integrity maintained throughout
  - Performance acceptable for cascade operations

**CONSTRAINT-001c: Invalid Reference Prevention**
- **Given:** Foreign key constraints in place
- **When:** Attempt to insert invalid references
- **Then:**
  - Invalid brand_id references rejected
  - Invalid user_id references rejected
  - Invalid fragrance_id references rejected
  - Clear error messages provided
  - Transaction rolled back cleanly

### 5.2 Unique Constraint Tests

**Test ID:** CONSTRAINT-002  
**Objective:** Validate unique constraint enforcement

#### Test Cases:

**CONSTRAINT-002a: Brand Slug Uniqueness**
- **Given:** fragrance_brands table with unique slug constraint
- **When:** Attempt to insert duplicate slugs
- **Then:**
  - Duplicate slug insertions rejected
  - Appropriate error message returned
  - Existing data not affected
  - Case sensitivity handled correctly
  - Unicode slugs handled properly

**CONSTRAINT-002b: Fragrance ID Uniqueness**
- **Given:** fragrances table with primary key
- **When:** Attempt to insert duplicate fragrance IDs
- **Then:**
  - Duplicate ID insertions rejected
  - UPSERT operations work correctly
  - Bulk import handles duplicates gracefully
  - Performance not degraded by uniqueness checks
  - Error logging includes duplicate values

**CONSTRAINT-002c: Collection Uniqueness**
- **Given:** user_collections table with composite unique constraint
- **When:** Test (user_id, fragrance_id, collection_type) uniqueness
- **Then:**
  - Duplicate combinations rejected
  - Different collection types allowed for same user/fragrance
  - Same fragrance allowed for different users
  - Constraint covers all specified columns
  - Index supports uniqueness check efficiently

## 6. AI-Ready Feature Testing

### 6.1 Vector Extension Tests

**Test ID:** AI-001  
**Objective:** Validate pgvector extension functionality

#### Test Cases:

**AI-001a: Extension Installation**
- **Given:** Clean PostgreSQL database
- **When:** Install and configure pgvector extension
- **Then:**
  - Extension installs without errors
  - Vector data type available
  - Similarity operators functional
  - Index types available (ivfflat, hnsw)
  - Performance settings configurable

**AI-001b: Vector Operations Validation**
- **Given:** Fragrances with embedding vectors
- **When:** Execute vector similarity operations
- **Then:**
  - Cosine similarity calculations accurate
  - Euclidean distance calculations accurate
  - Dot product operations functional
  - Vector arithmetic operations work
  - Results consistent with mathematical expectations

**AI-001c: Embedding Pipeline Readiness**
- **Given:** Vector storage infrastructure
- **When:** Test embedding generation and storage workflow
- **Then:**
  - Embedding dimensions consistent (1536)
  - Storage format compatible with AI libraries
  - Batch embedding updates efficient
  - NULL embedding handling for new records
  - Embedding metadata tracking available

### 6.2 AI Performance Tests

**Test ID:** AI-002  
**Objective:** Validate AI feature performance requirements

#### Test Cases:

**AI-002a: Similarity Search Performance**
- **Given:** 1,000+ fragrances with embeddings
- **When:** Execute nearest neighbor searches
- **Then:**
  - Top-10 similarity search <100ms
  - Top-50 similarity search <200ms
  - Results deterministic and repeatable
  - Index selection optimal for query size
  - Memory usage reasonable for dataset size

**AI-002b: Recommendation Generation Performance**
- **Given:** User profiles with collection history
- **When:** Generate personalized recommendations
- **Then:**
  - Recommendation queries complete <500ms
  - Batch recommendation generation efficient
  - Complex recommendation logic supports well
  - Caching strategy reduces repeated computation
  - Concurrent recommendation requests supported

## Test Execution Environment

### Prerequisites
- Supabase project with pgvector extension enabled
- Test database with clean schema
- Real data files: brands.json (40 records), fragrances.json (1,467 records)
- Test user accounts for RLS validation
- Performance monitoring tools enabled

### Test Data Management
- Use transaction rollbacks for non-destructive tests
- Maintain separate test datasets for edge cases
- Document test data creation and cleanup procedures
- Implement test data versioning for consistency
- Automate test data refresh for continuous testing

### Success Criteria
- All table creation tests pass
- Data import achieves 100% success rate with real data
- Performance benchmarks meet specified thresholds
- Security policies prevent all unauthorized access attempts
- AI features demonstrate functional vector operations

### Failure Criteria
- Any constraint violation goes undetected
- Performance falls below specified thresholds
- Security policies allow unauthorized data access
- Data import fails or corrupts data integrity
- AI vector operations produce inconsistent results

---

**Next Steps for Data Engineer:**
1. Implement schema creation scripts based on database-schema.md
2. Create test execution framework using these specifications
3. Execute tests against Supabase development environment
4. Document results and any schema adjustments needed
5. Prepare production deployment checklist based on test outcomes