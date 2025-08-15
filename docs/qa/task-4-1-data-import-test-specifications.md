# Task 4.1: Data Import Reliability and Integrity Test Specifications

## Overview

This document provides comprehensive test specifications for importing real fragrance data into ScentMatch. The import process will handle 40 brands and 1,467 fragrance records from JSON files located in `/data/` directory.

## Test Data Summary

- **Brands**: 40 records from `/data/brands.json`
- **Fragrances**: 1,467 records from `/data/fragrances.json`
- **Validation Schema**: `/lib/data-validation/fragrance-schema.ts`
- **Target Tables**: `fragrance_brands`, `fragrances`, related relationship tables

## 1. Data Validation Testing

### 1.1 JSON File Parsing Tests

**Test Cases:**

1. **Valid JSON Structure**
   - Parse `/data/brands.json` successfully
   - Parse `/data/fragrances.json` successfully
   - Verify array structure (both files contain arrays)
   - Confirm record counts: 40 brands, 1,467 fragrances

2. **Malformed JSON Handling**
   - Test with corrupted brand JSON (missing brackets, trailing commas)
   - Test with corrupted fragrance JSON (invalid escape sequences)
   - Verify graceful error messages
   - Ensure no partial imports on JSON parse failure

3. **File Access Tests**
   - Missing file scenarios (`/data/brands.json` not found)
   - Permission denied scenarios
   - Empty file handling
   - File lock scenarios during import

**Expected Results:**
- Valid files parse completely
- Malformed files return specific error messages
- No data written to database on parse failures
- Clear error reporting for file access issues

### 1.2 Schema Compliance Tests

**Test Cases:**

1. **Brand Data Validation**
   ```json
   // Expected structure validation
   {
     "id": "string (required)",
     "name": "string (required)", 
     "slug": "string (required)",
     "itemCount": "number (optional)"
   }
   ```

2. **Fragrance Data to Schema Mapping**
   - Map source data to existing `FragranceSchema`
   - Transform `brandName` → `brand` field
   - Handle missing `concentration` field (default to 'OTHER')
   - Transform `url` → `productUrl` 
   - Validate `accords` → `notes` mapping strategy

3. **Data Type Validation**
   - String normalization using `normalizeBrand()` and `normalizeName()`
   - Rating value bounds (0-5 range validation)
   - Rating count validation (non-negative integers)
   - Array field validation (`accords`, `perfumers`)

4. **Missing Data Handling**
   - Default values for optional fields
   - Required field validation
   - Null vs undefined handling
   - Empty string normalization

**Expected Results:**
- All 40 brands pass validation
- All 1,467 fragrances conform to schema after transformation
- Missing optional fields receive proper defaults
- Required field violations are caught and reported

### 1.3 Data Transformation Tests

**Test Cases:**

1. **Brand Name Normalization**
   - Unicode normalization (NFKC)
   - Whitespace normalization
   - Consistency across brand references

2. **Fragrance Name Processing**
   - Remove brand name redundancy from fragrance names
   - Handle special characters and encoding
   - Concentration extraction from names when possible

3. **URL Validation**
   - Verify `productUrl` field contains valid URLs
   - Handle malformed URLs gracefully
   - Optional image URL validation

**Expected Results:**
- Consistent name formatting across all records
- Valid URL formats where required
- Proper handling of encoding issues

## 2. Import Process Testing

### 2.1 Import Order and Dependencies

**Test Cases:**

1. **Brand Import Precedence**
   - Import all 40 brands first
   - Verify brand table population before fragrance import
   - Test foreign key constraint enforcement
   - Validate brand ID consistency

2. **Fragrance Import Dependencies**
   - Verify all `brandId` references exist in brands table
   - Handle orphaned fragrance records (brandId not found)
   - Test cascade behavior on brand deletion

3. **Transaction Integrity**
   - Rollback on any brand import failure
   - Rollback on any fragrance import failure
   - Test partial import scenarios
   - Verify database state after rollback

**Expected Results:**
- Complete brand import before fragrance processing
- Zero orphaned fragrance records
- Clean rollback on any failure
- Consistent database state maintained

### 2.2 Duplicate Handling and Conflict Resolution

**Test Cases:**

1. **Brand Duplicate Detection**
   - Test duplicate brand IDs
   - Handle case variations in brand names
   - Slug collision resolution

2. **Fragrance Duplicate Detection**
   - Use `canonicalKey()` function for duplicate detection
   - Test same fragrance from different sources
   - Handle concentration variations

3. **Update vs Insert Logic**
   - Upsert behavior for existing records
   - Conflict resolution strategies
   - Data preservation vs overwrite decisions

**Expected Results:**
- No duplicate brands in final dataset
- Intelligent fragrance duplicate resolution
- Preserved existing data where appropriate

### 2.3 Foreign Key Relationship Validation

**Test Cases:**

1. **Brand-Fragrance Relationships**
   - Verify all 1,467 fragrances link to valid brands
   - Test referential integrity constraints
   - Validate cascade behaviors

2. **Missing Brand Resolution**
   - Handle fragrances with unknown `brandId`
   - Auto-create missing brands vs reject fragrance
   - Orphan cleanup procedures

**Expected Results:**
- 100% valid foreign key relationships
- Clear strategy for missing brand references
- No orphaned records in final dataset

## 3. Batch Processing Testing

### 3.1 Large Dataset Handling

**Test Cases:**

1. **Memory Efficiency**
   - Process 1,467 fragrances without memory leaks
   - Batch size optimization (test 50, 100, 250 record batches)
   - Memory usage monitoring during import
   - Garbage collection effectiveness

2. **Batch Size Optimization**
   - Test different batch sizes for optimal performance
   - Balance between memory usage and database round trips
   - Error isolation within batches

3. **Progress Tracking Accuracy**
   - Accurate progress reporting for 1,467 records
   - Progress persistence across batch boundaries
   - Real-time progress updates

**Expected Results:**
- Stable memory usage throughout import
- Optimal batch size identified
- Accurate progress reporting

### 3.2 Performance Benchmarks

**Test Cases:**

1. **Import Speed Targets**
   - Complete 40 brands import in < 5 seconds
   - Complete 1,467 fragrances import in < 30 seconds
   - Total end-to-end import time < 45 seconds
   - Database connection efficiency

2. **Concurrent Operation Handling**
   - Import while other database operations running
   - User query performance during import
   - Lock contention avoidance

**Expected Results:**
- Meet or exceed performance targets
- No blocking of normal application operations
- Efficient database resource usage

### 3.3 Timeout and Retry Logic

**Test Cases:**

1. **Network Interruption Scenarios**
   - Simulate database connection drops
   - Test reconnection logic
   - Partial batch recovery

2. **Retry Mechanisms**
   - Exponential backoff implementation
   - Maximum retry limits
   - Error classification (retryable vs fatal)

3. **Circuit Breaker Patterns**
   - Fail fast on persistent errors
   - Recovery detection and resumption

**Expected Results:**
- Graceful handling of temporary failures
- Successful recovery from interruptions
- Proper error escalation when needed

## 4. Data Integrity Testing

### 4.1 Complete Import Verification

**Test Cases:**

1. **Record Count Validation**
   - Verify exactly 40 brands imported
   - Verify exactly 1,467 fragrances imported
   - Cross-reference source file counts

2. **Data Completeness**
   - All required fields populated
   - Optional fields handled correctly
   - No data truncation or corruption

3. **Relationship Completeness**
   - All fragrances linked to valid brands
   - Brand item counts match actual fragrance counts
   - Referential integrity maintained

**Expected Results:**
- 100% import success rate
- Complete data preservation
- Perfect relationship consistency

### 4.2 Data Preservation Validation

**Test Cases:**

1. **Metadata Preservation**
   - Rating values preserved exactly
   - Rating counts preserved exactly
   - Accord arrays preserved completely
   - Perfumer arrays preserved completely

2. **String Data Integrity**
   - Unicode characters preserved
   - Special characters handled correctly
   - No encoding corruption

3. **Numerical Data Integrity**
   - Decimal precision maintained
   - Range validation respected
   - No rounding errors

**Expected Results:**
- Exact data preservation from source
- No corruption or data loss
- Proper handling of edge cases

### 4.3 Search Functionality Post-Import

**Test Cases:**

1. **Search Index Population**
   - Full-text search functionality works
   - Brand name searches return correct results
   - Fragrance name searches return correct results

2. **Filter Functionality**
   - Accord-based filtering works
   - Brand-based filtering works
   - Rating-based filtering works

3. **Relationship Queries**
   - Brand → fragrances queries perform well
   - Fragrance → brand queries perform well
   - Complex joined queries execute correctly

**Expected Results:**
- All search functionality operational
- Fast query response times
- Accurate search results

## 5. Performance Testing

### 5.1 Import Speed Benchmarks

**Test Cases:**

1. **Baseline Performance Metrics**
   - Brand import: Target < 5 seconds for 40 records
   - Fragrance import: Target < 30 seconds for 1,467 records
   - Memory usage: Peak < 256MB during import
   - Database connections: < 10 concurrent connections

2. **Scalability Testing**
   - Simulate 10x data volume (14,670 fragrances)
   - Test performance degradation curves
   - Identify bottlenecks and limits

3. **Resource Utilization**
   - CPU usage monitoring
   - Memory usage monitoring
   - Database resource monitoring
   - Network bandwidth utilization

**Expected Results:**
- Meet performance targets consistently
- Linear performance scaling
- Efficient resource utilization

### 5.2 Database Performance Impact

**Test Cases:**

1. **Query Performance During Import**
   - User queries maintain < 500ms response time
   - Search functionality remains responsive
   - Admin queries execute normally

2. **Lock Contention Analysis**
   - Minimal table locking during import
   - No user-facing query blocking
   - Efficient transaction management

3. **Index Performance**
   - Search indexes remain efficient
   - No index fragmentation
   - Proper index utilization

**Expected Results:**
- No user experience degradation
- Maintained query performance
- Efficient index management

### 5.3 Memory Usage Monitoring

**Test Cases:**

1. **Memory Leak Detection**
   - Stable memory usage throughout import
   - Proper cleanup after batch processing
   - No memory accumulation across batches

2. **Peak Memory Analysis**
   - Identify maximum memory usage points
   - Optimize memory-intensive operations
   - Validate garbage collection effectiveness

**Expected Results:**
- No memory leaks detected
- Predictable memory usage patterns
- Efficient memory management

## 6. Error Handling Testing

### 6.1 Malformed Data Scenarios

**Test Cases:**

1. **Invalid JSON Content**
   - Missing required fields
   - Invalid data types
   - Malformed array structures
   - Invalid Unicode sequences

2. **Schema Violation Handling**
   - Fields exceeding length limits
   - Invalid enum values
   - Foreign key violations
   - Constraint violations

3. **Data Inconsistency Detection**
   - Fragrance references non-existent brands
   - Duplicate IDs within files
   - Circular references

**Expected Results:**
- Clear error messages for each violation type
- No partial imports on validation failures
- Detailed error logging for debugging

### 6.2 Database Constraint Violations

**Test Cases:**

1. **Primary Key Violations**
   - Duplicate brand IDs
   - Duplicate fragrance IDs
   - Composite key violations

2. **Foreign Key Violations**
   - Invalid brand references
   - Orphaned relationship records
   - Cascade constraint violations

3. **Check Constraint Violations**
   - Invalid rating ranges
   - Invalid date values
   - Invalid enum values

**Expected Results:**
- Graceful constraint violation handling
- Rollback on constraint failures
- Informative error reporting

### 6.3 Network and System Failures

**Test Cases:**

1. **Database Connection Failures**
   - Connection timeout during import
   - Database server restart during import
   - Network partition scenarios

2. **File System Failures**
   - Disk space exhaustion
   - File permission changes during import
   - File corruption scenarios

3. **Process Interruption**
   - Application restart during import
   - System shutdown scenarios
   - Memory exhaustion handling

**Expected Results:**
- Graceful degradation on failures
- Proper cleanup on interruption
- Resumable import capabilities

## 7. Recovery and Rollback Testing

### 7.1 Transaction Rollback Scenarios

**Test Cases:**

1. **Brand Import Rollback**
   - Partial brand import failure
   - Complete rollback verification
   - Database state consistency

2. **Fragrance Import Rollback**
   - Mid-import failure scenarios
   - Batch-level rollback testing
   - Cross-batch transaction integrity

3. **Complete Import Rollback**
   - End-to-end failure scenarios
   - Full database state restoration
   - Cleanup verification

**Expected Results:**
- Clean rollback on any failure
- Consistent database state post-rollback
- No partial data remnants

### 7.2 Partial Import Recovery

**Test Cases:**

1. **Resume Capability**
   - Restart from last successful batch
   - Progress persistence across restarts
   - Duplicate prevention on resume

2. **State Validation**
   - Pre-resume state validation
   - Consistency checks before continuation
   - Conflict resolution on resume

**Expected Results:**
- Reliable resume functionality
- No duplicate imports on resume
- Consistent state maintenance

## Implementation Notes

### Test Environment Setup

1. **Database Preparation**
   - Clean test database instance
   - Proper schema migration application
   - Test data isolation

2. **Test Data Preparation**
   - Backup of original data files
   - Corrupted data files for error testing
   - Various batch size test datasets

3. **Monitoring Setup**
   - Performance monitoring tools
   - Memory usage tracking
   - Database activity monitoring

### Test Execution Strategy

1. **Unit Tests**
   - Individual function validation
   - Schema compliance testing
   - Data transformation testing

2. **Integration Tests**
   - End-to-end import testing
   - Database interaction testing
   - Error scenario testing

3. **Performance Tests**
   - Load testing with full dataset
   - Stress testing with larger datasets
   - Concurrent operation testing

### Success Criteria

**All tests must pass with the following requirements:**

- **Data Integrity**: 100% accurate import of all 1,467 fragrances and 40 brands
- **Performance**: Complete import in < 45 seconds on standard hardware
- **Reliability**: Zero data loss or corruption scenarios
- **Error Handling**: Graceful failure handling with proper rollback
- **Scalability**: Linear performance characteristics for larger datasets

### Deliverables

1. **Test Implementation**: Data engineer implements import scripts based on these specifications
2. **Test Results**: Comprehensive test execution results with performance metrics
3. **Error Documentation**: Catalog of error scenarios and handling mechanisms
4. **Performance Benchmarks**: Baseline performance metrics for future optimization

This specification ensures reliable, efficient, and robust data import functionality for ScentMatch's fragrance database foundation.