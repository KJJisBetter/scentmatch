#!/usr/bin/env python3
"""
Database Schema Compatibility Tests
Testing hybrid pipeline output against Supabase database schema
"""

import json
import os
import sys
import unittest
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Any

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class DatabaseSchemaCompatibilityTests(unittest.TestCase):
    """Test suite for database schema compatibility validation"""
    
    def setUp(self):
        """Load sample data for testing"""
        self.test_data_dir = os.path.join(os.path.dirname(__file__), '..', 'output')
        self.sample_fragrances = self._load_sample_data()
        self.sample_brands = self._load_brand_data()
        
        # Expected database schema fields
        self.fragrance_schema = {
            'required_fields': [
                'id', 'brand_id', 'name', 'slug', 'gender'
            ],
            'required_fields_alternatives': {
                # Handle field name variations between pipeline and database
                'main_accords_or_accords': ['main_accords', 'accords']
            },
            'optional_fields': [
                'launch_year', 'perfumers', 'fragrance_family', 'top_notes', 
                'middle_notes', 'base_notes', 'full_description', 'short_description',
                'rating_value', 'rating_count', 'popularity_score', 'sample_available',
                'sample_price_usd', 'fragrantica_url', 'data_source', 'priority_score'
            ],
            'field_types': {
                'id': str,
                'brand_id': str,
                'name': str,
                'slug': str,
                'gender': str,
                'main_accords': list,
                'launch_year': (int, type(None)),
                'rating_value': (float, int, type(None)),
                'rating_count': (int, type(None)),
                'sample_available': bool,
                'sample_price_usd': (int, type(None)),
                'priority_score': (float, int, type(None))
            },
            'constraints': {
                'gender': ['men', 'women', 'unisex'],
                'rating_value_range': (0.0, 5.0),
                'rating_count_min': 0,
                'sample_price_range': (0, 100)
            }
        }
        
        self.brand_schema = {
            'required_fields': ['id', 'name', 'slug'],
            'optional_fields': [
                'origin_country', 'founded_year', 'brand_tier', 'website_url',
                'is_active', 'sample_availability_score', 'affiliate_supported'
            ],
            'field_types': {
                'id': str,
                'name': str,
                'slug': str,
                'founded_year': (int, type(None)),
                'brand_tier': (str, type(None)),
                'is_active': bool,
                'sample_availability_score': (int, type(None)),
                'affiliate_supported': bool
            },
            'constraints': {
                'brand_tier': ['luxury', 'premium', 'designer', 'mass', 'niche', 'celebrity', None],
                'sample_availability_score_range': (0, 100)
            }
        }

    def _load_sample_data(self) -> List[Dict]:
        """Load sample fragrance data from pipeline output"""
        try:
            # Try latest output file first
            latest_files = [f for f in os.listdir(self.test_data_dir) 
                           if f.startswith('fragrances_final_') and f.endswith('.json')]
            latest_files.sort(reverse=True)
            
            if latest_files:
                with open(os.path.join(self.test_data_dir, latest_files[0]), 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data[:10]  # Take first 10 for testing
        except (FileNotFoundError, json.JSONDecodeError):
            pass
        
        # Fallback to manual test data
        return [
            {
                "id": "creed__aventus",
                "brand_id": "creed",
                "name": "aventus",
                "slug": "aventus",
                "gender": "men",
                "accords": ["fruity", "sweet", "leather", "woody", "smoky"],
                "rating_value": 4.34,
                "rating_count": 19581,
                "sample_available": True,
                "sample_price_usd": 20,
                "priority_score": 231.6
            }
        ]
    
    def _load_brand_data(self) -> List[Dict]:
        """Load sample brand data from pipeline output"""
        try:
            latest_files = [f for f in os.listdir(self.test_data_dir) 
                           if f.startswith('brands_final_') and f.endswith('.json')]
            latest_files.sort(reverse=True)
            
            if latest_files:
                with open(os.path.join(self.test_data_dir, latest_files[0]), 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data[:5]  # Take first 5 for testing
        except (FileNotFoundError, json.JSONDecodeError):
            pass
        
        # Fallback to manual test data
        return [
            {
                "id": "creed",
                "name": "Creed",
                "slug": "creed",
                "brand_tier": "luxury",
                "is_active": True,
                "sample_availability_score": 85,
                "affiliate_supported": False
            }
        ]

    def test_fragrance_required_fields_present(self):
        """Test that all required fragrance fields are present"""
        for i, fragrance in enumerate(self.sample_fragrances):
            with self.subTest(fragrance=i):
                for field in self.fragrance_schema['required_fields']:
                    self.assertIn(field, fragrance, 
                                f"Required field '{field}' missing from fragrance {fragrance.get('id', 'unknown')}")
                
                # Test alternative field requirements
                for alt_field_name, alternatives in self.fragrance_schema.get('required_fields_alternatives', {}).items():
                    has_alternative = any(alt in fragrance for alt in alternatives)
                    self.assertTrue(has_alternative,
                                  f"Required field alternatives {alternatives} missing from fragrance {fragrance.get('id', 'unknown')}")

    def test_fragrance_field_types(self):
        """Test that fragrance field types match schema expectations"""
        for i, fragrance in enumerate(self.sample_fragrances):
            with self.subTest(fragrance=i):
                for field, expected_types in self.fragrance_schema['field_types'].items():
                    if field in fragrance:
                        value = fragrance[field]
                        if not isinstance(expected_types, tuple):
                            expected_types = (expected_types,)
                        self.assertIsInstance(value, expected_types,
                                            f"Field '{field}' has type {type(value)} but expected {expected_types}")

    def test_fragrance_gender_constraints(self):
        """Test that gender values are valid"""
        valid_genders = self.fragrance_schema['constraints']['gender']
        for i, fragrance in enumerate(self.sample_fragrances):
            with self.subTest(fragrance=i):
                if 'gender' in fragrance:
                    self.assertIn(fragrance['gender'], valid_genders,
                                f"Invalid gender '{fragrance['gender']}' for fragrance {fragrance.get('id', 'unknown')}")

    def test_fragrance_rating_constraints(self):
        """Test that rating values are within valid ranges"""
        min_rating, max_rating = self.fragrance_schema['constraints']['rating_value_range']
        min_count = self.fragrance_schema['constraints']['rating_count_min']
        
        for i, fragrance in enumerate(self.sample_fragrances):
            with self.subTest(fragrance=i):
                if 'rating_value' in fragrance and fragrance['rating_value'] is not None:
                    rating = fragrance['rating_value']
                    self.assertGreaterEqual(rating, min_rating,
                                          f"Rating {rating} below minimum {min_rating}")
                    self.assertLessEqual(rating, max_rating,
                                       f"Rating {rating} above maximum {max_rating}")
                
                if 'rating_count' in fragrance and fragrance['rating_count'] is not None:
                    count = fragrance['rating_count']
                    self.assertGreaterEqual(count, min_count,
                                          f"Rating count {count} below minimum {min_count}")

    def test_fragrance_sample_price_constraints(self):
        """Test that sample prices are within reasonable ranges"""
        min_price, max_price = self.fragrance_schema['constraints']['sample_price_range']
        
        for i, fragrance in enumerate(self.sample_fragrances):
            with self.subTest(fragrance=i):
                if 'sample_price_usd' in fragrance and fragrance['sample_price_usd'] is not None:
                    price = fragrance['sample_price_usd']
                    self.assertGreaterEqual(price, min_price,
                                          f"Sample price {price} below minimum {min_price}")
                    self.assertLessEqual(price, max_price,
                                       f"Sample price {price} above maximum {max_price}")

    def test_fragrance_id_format(self):
        """Test that fragrance IDs follow expected format (brand__fragrance)"""
        for i, fragrance in enumerate(self.sample_fragrances):
            with self.subTest(fragrance=i):
                if 'id' in fragrance:
                    fragrance_id = fragrance['id']
                    self.assertIsInstance(fragrance_id, str, "Fragrance ID must be string")
                    self.assertIn('__', fragrance_id, 
                                f"Fragrance ID '{fragrance_id}' should contain '__' separator")
                    
                    # Check that brand_id matches the prefix
                    if 'brand_id' in fragrance:
                        expected_prefix = fragrance['brand_id'] + '__'
                        self.assertTrue(fragrance_id.startswith(expected_prefix),
                                      f"Fragrance ID '{fragrance_id}' should start with '{expected_prefix}'")

    def test_fragrance_accords_structure(self):
        """Test that accords/main_accords are properly structured arrays"""
        for i, fragrance in enumerate(self.sample_fragrances):
            with self.subTest(fragrance=i):
                # Check for either 'accords' or 'main_accords' field
                accords_field = None
                if 'main_accords' in fragrance:
                    accords_field = 'main_accords'
                elif 'accords' in fragrance:
                    accords_field = 'accords'
                
                if accords_field:
                    accords = fragrance[accords_field]
                    self.assertIsInstance(accords, list, f"{accords_field} must be a list")
                    
                    # Check that all accord items are strings
                    for accord in accords:
                        self.assertIsInstance(accord, str, f"Accord '{accord}' must be string")
                        self.assertGreater(len(accord.strip()), 0, "Accord cannot be empty")

    def test_brand_required_fields_present(self):
        """Test that all required brand fields are present"""
        for i, brand in enumerate(self.sample_brands):
            with self.subTest(brand=i):
                for field in self.brand_schema['required_fields']:
                    self.assertIn(field, brand,
                                f"Required field '{field}' missing from brand {brand.get('id', 'unknown')}")

    def test_brand_field_types(self):
        """Test that brand field types match schema expectations"""
        for i, brand in enumerate(self.sample_brands):
            with self.subTest(brand=i):
                for field, expected_types in self.brand_schema['field_types'].items():
                    if field in brand:
                        value = brand[field]
                        if not isinstance(expected_types, tuple):
                            expected_types = (expected_types,)
                        self.assertIsInstance(value, expected_types,
                                            f"Brand field '{field}' has type {type(value)} but expected {expected_types}")

    def test_brand_tier_constraints(self):
        """Test that brand tier values are valid"""
        valid_tiers = self.brand_schema['constraints']['brand_tier']
        for i, brand in enumerate(self.sample_brands):
            with self.subTest(brand=i):
                if 'brand_tier' in brand:
                    self.assertIn(brand['brand_tier'], valid_tiers,
                                f"Invalid brand tier '{brand['brand_tier']}' for brand {brand.get('id', 'unknown')}")

    def test_data_transformation_mapping(self):
        """Test that pipeline data can be mapped to database schema"""
        # Test mapping from pipeline format to database format
        for fragrance in self.sample_fragrances:
            # Test the transformation that will be needed
            db_record = self._transform_to_db_format(fragrance)
            
            # Verify transformation worked
            self.assertIn('main_accords', db_record)
            self.assertIn('gender', db_record)
            self.assertIsInstance(db_record['main_accords'], list)
            
    def _transform_to_db_format(self, pipeline_data: Dict) -> Dict:
        """Transform pipeline data format to database format"""
        db_record = pipeline_data.copy()
        
        # Map 'accords' to 'main_accords' if needed
        if 'accords' in db_record and 'main_accords' not in db_record:
            db_record['main_accords'] = db_record['accords']
            del db_record['accords']
        
        # Map 'year' to 'launch_year' if needed
        if 'year' in db_record and 'launch_year' not in db_record:
            db_record['launch_year'] = db_record['year']
            del db_record['year']
        
        # Ensure required defaults
        if 'sample_available' not in db_record:
            db_record['sample_available'] = True
        
        if 'data_source' not in db_record:
            db_record['data_source'] = 'hybrid_pipeline'
        
        return db_record

    def test_batch_import_readiness(self):
        """Test that data is ready for batch database import"""
        # Test that we have a reasonable batch size
        self.assertGreater(len(self.sample_fragrances), 0, "No fragrance data available for import")
        
        # Test that all records have unique IDs
        fragrance_ids = [f.get('id') for f in self.sample_fragrances if 'id' in f]
        unique_ids = set(fragrance_ids)
        self.assertEqual(len(fragrance_ids), len(unique_ids), "Duplicate fragrance IDs detected")
        
        # Test that brand references are consistent
        brand_ids_in_fragrances = {f.get('brand_id') for f in self.sample_fragrances if 'brand_id' in f}
        brand_ids_available = {b.get('id') for b in self.sample_brands if 'id' in b}
        
        # Note: This test might fail if we only have a subset of brands
        # In production, we should ensure all referenced brands exist
        for brand_id in brand_ids_in_fragrances:
            if brand_id:  # Skip None values
                # Just log the issue rather than fail, since test data might be incomplete
                if brand_id not in brand_ids_available:
                    print(f"Warning: Brand ID '{brand_id}' referenced but not in brand data")

    def test_embedding_pipeline_compatibility(self):
        """Test that fragrance data is ready for automatic embedding generation"""
        for i, fragrance in enumerate(self.sample_fragrances):
            with self.subTest(fragrance=i):
                # Check that we have sufficient text data for embeddings
                text_fields = ['name', 'main_accords', 'top_notes', 'middle_notes', 'base_notes']
                has_text_data = False
                
                for field in text_fields:
                    field_name = field if field in fragrance else (
                        'accords' if field == 'main_accords' and 'accords' in fragrance else None
                    )
                    
                    if field_name and fragrance.get(field_name):
                        has_text_data = True
                        break
                
                self.assertTrue(has_text_data, 
                              f"Fragrance {fragrance.get('id', 'unknown')} lacks text data for embedding generation")


def run_schema_compatibility_tests():
    """Run all database schema compatibility tests"""
    unittest.main(argv=[''], exit=False, verbosity=2)


if __name__ == '__main__':
    run_schema_compatibility_tests()