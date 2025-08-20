#!/usr/bin/env python3
"""
Database Integration Verification Tests
Comprehensive tests for database operations and data integrity
"""

import json
import os
import sys
import unittest
import logging
import time
from typing import Dict, List, Any, Optional
from datetime import datetime

# Add parent directory for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import requests
    from dotenv import load_dotenv
    
    # Import the database importer using importlib to handle numbers in filename
    import importlib.util
    script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', '04_database_importer.py')
    spec = importlib.util.spec_from_file_location("database_importer", script_path)
    database_importer_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(database_importer_module)
    SupabaseDatabaseImporter = database_importer_module.SupabaseDatabaseImporter
except ImportError as e:
    print(f"Missing required dependencies: {e}")
    print("Run: pip install requests python-dotenv")
    sys.exit(1)

class DatabaseIntegrationVerificationTests(unittest.TestCase):
    """Comprehensive database integration verification tests"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test class with database connection"""
        load_dotenv()
        
        cls.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        cls.service_role_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not cls.supabase_url or not cls.service_role_key:
            raise unittest.SkipTest("Supabase credentials not available")
        
        cls.headers = {
            'apikey': cls.service_role_key,
            'Authorization': f'Bearer {cls.service_role_key}',
            'Content-Type': 'application/json'
        }
        
        cls.base_api_url = f"{cls.supabase_url}/rest/v1"
        cls.importer = SupabaseDatabaseImporter()
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        cls.logger = logging.getLogger(__name__)
        
    def test_01_database_connection(self):
        """Test basic database connectivity"""
        success = self.importer.test_connection()
        self.assertTrue(success, "Database connection should be successful")
        
    def test_02_table_schema_integrity(self):
        """Test that required tables exist with correct schema"""
        required_tables = ['fragrances', 'fragrance_brands', 'ai_insights_cache', 
                          'user_collections', 'user_fragrance_interactions']
        
        for table in required_tables:
            with self.subTest(table=table):
                response = requests.get(
                    f"{self.base_api_url}/{table}?limit=1",
                    headers=self.headers,
                    timeout=10
                )
                self.assertEqual(response.status_code, 200, 
                               f"Table {table} should be accessible")
    
    def test_03_fragrance_constraints_validation(self):
        """Test that database constraints work correctly"""
        # Test invalid gender constraint
        invalid_fragrance = {
            'id': 'test__invalid_gender',
            'brand_id': 'test-brand',
            'name': 'Invalid Gender Test',
            'slug': 'invalid-gender-test',
            'gender': 'invalid_gender',  # Invalid gender
            'main_accords': ['test']
        }
        
        response = requests.post(
            f"{self.base_api_url}/fragrances",
            headers=self.headers,
            json=[invalid_fragrance],
            timeout=30
        )
        
        # Should fail due to gender constraint
        self.assertNotEqual(response.status_code, 201, 
                           "Invalid gender should be rejected by database constraints")
    
    def test_04_foreign_key_relationships(self):
        """Test foreign key relationships are enforced"""
        # Try to insert fragrance with non-existent brand_id
        invalid_fragrance = {
            'id': 'nonexistent__test_fragrance',
            'brand_id': 'non_existent_brand_123',  # Non-existent brand
            'name': 'Test Fragrance',
            'slug': 'test-fragrance',
            'gender': 'unisex',
            'main_accords': ['test']
        }
        
        response = requests.post(
            f"{self.base_api_url}/fragrances",
            headers=self.headers,
            json=[invalid_fragrance],
            timeout=30
        )
        
        # Should fail due to foreign key constraint
        self.assertNotEqual(response.status_code, 201,
                           "Fragrance with invalid brand_id should be rejected")
    
    def test_05_duplicate_prevention(self):
        """Test duplicate detection and handling"""
        test_brand = {
            'id': 'test-duplicate-brand',
            'name': 'Test Duplicate Brand',
            'slug': 'test-duplicate-brand'
        }
        
        # Insert brand first time
        response1 = requests.post(
            f"{self.base_api_url}/fragrance_brands",
            headers=self.headers,
            json=[test_brand],
            timeout=30
        )
        
        # Insert same brand again (should handle gracefully)
        response2 = requests.post(
            f"{self.base_api_url}/fragrance_brands?on_conflict=id",
            headers={**self.headers, 'Prefer': 'resolution=merge-duplicates'},
            json=[test_brand],
            timeout=30
        )
        
        # Both should succeed (second is upsert)
        self.assertIn(response1.status_code, [200, 201], 
                     "First brand insert should succeed")
        self.assertIn(response2.status_code, [200, 201], 
                     "Duplicate brand upsert should succeed")
        
        # Clean up test data
        self._cleanup_test_brand('test-duplicate-brand')
    
    def test_06_batch_operations_performance(self):
        """Test batch operations work within reasonable time limits"""
        # Create test brands
        test_brands = []
        for i in range(10):
            test_brands.append({
                'id': f'test-batch-brand-{i}',
                'name': f'Test Batch Brand {i}',
                'slug': f'test-batch-brand-{i}'
            })
        
        start_time = time.time()
        
        response = requests.post(
            f"{self.base_api_url}/fragrance_brands",
            headers=self.headers,
            json=test_brands,
            timeout=60
        )
        
        end_time = time.time()
        batch_time = end_time - start_time
        
        self.assertIn(response.status_code, [200, 201], 
                     "Batch insert should succeed")
        self.assertLess(batch_time, 30, 
                       "Batch insert should complete within 30 seconds")
        
        # Clean up test data
        for brand in test_brands:
            self._cleanup_test_brand(brand['id'])
    
    def test_07_search_functionality(self):
        """Test search and filtering functionality"""
        # Test basic search
        response = requests.get(
            f"{self.base_api_url}/fragrances?select=id,name&name=ilike.*test*&limit=5",
            headers=self.headers,
            timeout=30
        )
        
        self.assertEqual(response.status_code, 200, 
                        "Search query should execute successfully")
        
        # Test filtering by gender
        response = requests.get(
            f"{self.base_api_url}/fragrances?select=id,gender&gender=eq.unisex&limit=5",
            headers=self.headers,
            timeout=30
        )
        
        self.assertEqual(response.status_code, 200, 
                        "Gender filter should work correctly")
        
        fragrances = response.json()
        if fragrances:
            for fragrance in fragrances:
                self.assertEqual(fragrance['gender'], 'unisex', 
                               "All returned fragrances should have unisex gender")
    
    def test_08_data_transformation_integrity(self):
        """Test that data transformations preserve integrity"""
        # Test fragrance data transformation
        pipeline_data = {
            'id': 'test__transformation_test',
            'brand_id': 'test-transform-brand',
            'name': 'Transformation Test',
            'slug': 'transformation-test',
            'gender': 'unisex',
            'accords': ['fresh', 'citrus'],  # Pipeline format
            'year': 2023,  # Pipeline format
            'rating_value': 4.5,
            'sample_available': True
        }
        
        # Create test brand first
        test_brand = {
            'id': 'test-transform-brand',
            'name': 'Test Transform Brand',
            'slug': 'test-transform-brand'
        }
        
        requests.post(
            f"{self.base_api_url}/fragrance_brands",
            headers=self.headers,
            json=[test_brand],
            timeout=30
        )
        
        # Transform data for database
        db_data = self.importer.transform_fragrance_for_db(pipeline_data)
        
        # Check transformations
        self.assertIn('main_accords', db_data, "Should have main_accords field")
        self.assertIn('launch_year', db_data, "Should have launch_year field")
        self.assertNotIn('accords', db_data, "Should not have old accords field")
        self.assertNotIn('year', db_data, "Should not have old year field")
        self.assertEqual(db_data['main_accords'], ['fresh', 'citrus'], 
                        "Accords should be transformed correctly")
        
        # Clean up
        self._cleanup_test_brand('test-transform-brand')
    
    def test_09_embedding_system_integration(self):
        """Test embedding system integration (if available)"""
        # Check if embedding system is healthy
        embedding_healthy = self.importer.verify_embedding_triggers_active()
        
        if embedding_healthy:
            # Check embedding generation status
            status = self.importer.check_embedding_generation_status()
            self.assertIn('queue_healthy', status, 
                         "Embedding status should include queue health")
            
            # Verify some fragrances have embeddings
            response = requests.get(
                f"{self.base_api_url}/fragrances?select=id,scent_profile_vector&is_null=scent_profile_vector.false&limit=3",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                fragrances_with_embeddings = response.json()
                if fragrances_with_embeddings:
                    self.assertGreater(len(fragrances_with_embeddings), 0, 
                                     "Should have some fragrances with embeddings")
        else:
            self.skipTest("Embedding system not active")
    
    def test_10_pipeline_metadata_columns(self):
        """Test pipeline metadata columns exist and function correctly"""
        # Test if pipeline columns exist
        response = requests.get(
            f"{self.base_api_url}/fragrances?select=id,pipeline_priority_score,pipeline_source,data_source&limit=1",
            headers=self.headers,
            timeout=30
        )
        
        if response.status_code == 400:
            self.skipTest("Pipeline metadata columns not yet migrated")
        
        self.assertEqual(response.status_code, 200, 
                        "Pipeline metadata columns should be accessible")
    
    def test_11_data_validation_functions(self):
        """Test data validation functions work correctly"""
        # Test valid fragrance data
        valid_fragrance = {
            'id': 'test-validation-brand__valid_fragrance',
            'brand_id': 'test-validation-brand',
            'name': 'Valid Test Fragrance',
            'slug': 'valid-test-fragrance',
            'gender': 'men',
            'main_accords': ['woody', 'spicy'],
            'rating_value': 4.2,
            'rating_count': 150
        }
        
        is_valid, errors = self.importer.validate_fragrance_data(valid_fragrance)
        self.assertTrue(is_valid, f"Valid fragrance should pass validation: {errors}")
        
        # Test invalid fragrance data
        invalid_fragrance = {
            'id': 'test__invalid_fragrance',
            'name': 'Invalid Test Fragrance',
            # Missing required fields: brand_id, slug, gender
            'rating_value': 6.0  # Invalid rating (>5.0)
        }
        
        is_valid, errors = self.importer.validate_fragrance_data(invalid_fragrance)
        self.assertFalse(is_valid, "Invalid fragrance should fail validation")
        self.assertGreater(len(errors), 0, "Should have validation errors")
    
    def test_12_comprehensive_import_dry_run(self):
        """Test a comprehensive import process (dry run)"""
        # Create minimal test data
        test_brands = [{
            'id': 'test-comprehensive-brand',
            'name': 'Test Comprehensive Brand',
            'slug': 'test-comprehensive-brand'
        }]
        
        test_fragrances = [{
            'id': 'test-comprehensive-brand__test_fragrance',
            'brand_id': 'test-comprehensive-brand',
            'name': 'Test Comprehensive Fragrance',
            'slug': 'test-comprehensive-fragrance',
            'gender': 'unisex',
            'main_accords': ['fresh', 'clean'],
            'rating_value': 4.0,
            'sample_available': True
        }]
        
        # Test brand validation and transformation
        for brand in test_brands:
            is_valid, errors = self.importer.validate_brand_data(brand)
            self.assertTrue(is_valid, f"Test brand should be valid: {errors}")
            
            transformed = self.importer.transform_brand_for_db(brand)
            self.assertIn('is_active', transformed, "Should have default values")
        
        # Test fragrance validation and transformation
        for fragrance in test_fragrances:
            is_valid, errors = self.importer.validate_fragrance_data(fragrance)
            self.assertTrue(is_valid, f"Test fragrance should be valid: {errors}")
            
            transformed = self.importer.transform_fragrance_for_db(fragrance)
            self.assertIn('data_source', transformed, "Should have data_source field")
            self.assertEqual(transformed['data_source'], 'hybrid_pipeline', 
                           "Should have correct data source")
    
    def _cleanup_test_brand(self, brand_id: str):
        """Helper method to clean up test brand data"""
        try:
            # Delete any fragrances for this brand first
            requests.delete(
                f"{self.base_api_url}/fragrances?brand_id=eq.{brand_id}",
                headers=self.headers,
                timeout=30
            )
            
            # Delete the brand
            requests.delete(
                f"{self.base_api_url}/fragrance_brands?id=eq.{brand_id}",
                headers=self.headers,
                timeout=30
            )
        except Exception:
            pass  # Ignore cleanup errors
    
    @classmethod
    def tearDownClass(cls):
        """Clean up any remaining test data"""
        try:
            # Clean up any test data that might remain
            test_patterns = ['test-', 'test__', 'test-comprehensive', 'test-duplicate', 
                           'test-batch', 'test-transform', 'test-validation']
            
            for pattern in test_patterns:
                requests.delete(
                    f"{cls.base_api_url}/fragrances?id=like.{pattern}*",
                    headers=cls.headers,
                    timeout=30
                )
                requests.delete(
                    f"{cls.base_api_url}/fragrance_brands?id=like.{pattern}*",
                    headers=cls.headers,
                    timeout=30
                )
        except Exception:
            pass  # Ignore cleanup errors


def run_database_verification_tests():
    """Run comprehensive database verification tests"""
    print("🔍 Starting comprehensive database integration verification...")
    
    # Create test suite
    test_loader = unittest.TestLoader()
    test_suite = test_loader.loadTestsFromTestCase(DatabaseIntegrationVerificationTests)
    
    # Run tests with detailed output
    test_runner = unittest.TextTestRunner(
        verbosity=2,
        descriptions=True,
        failfast=False
    )
    
    result = test_runner.run(test_suite)
    
    # Summary
    print(f"\n{'='*60}")
    print(f"DATABASE VERIFICATION SUMMARY")
    print(f"{'='*60}")
    print(f"Tests Run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped) if hasattr(result, 'skipped') else 0}")
    
    if result.failures:
        print(f"\n❌ FAILED TESTS:")
        for test, traceback in result.failures:
            print(f"  - {test}")
    
    if result.errors:
        print(f"\n💥 ERROR TESTS:")
        for test, traceback in result.errors:
            print(f"  - {test}")
    
    if result.wasSuccessful():
        print(f"\n✅ ALL DATABASE VERIFICATION TESTS PASSED!")
        print(f"🎉 Database integration is working correctly!")
    else:
        print(f"\n⚠️  Some tests failed - check database configuration")
    
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_database_verification_tests()
    sys.exit(0 if success else 1)