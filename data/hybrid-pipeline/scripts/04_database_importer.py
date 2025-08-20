#!/usr/bin/env python3
"""
Database Importer for Hybrid Pipeline
Imports fragrance and brand data into Supabase with duplicate detection and validation
"""

import json
import os
import sys
import logging
import time
from datetime import datetime
from typing import Dict, List, Any, Tuple, Optional
from decimal import Decimal

# Add parent directory for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Check for required dependencies
try:
    import requests
    from dotenv import load_dotenv
except ImportError as e:
    print(f"Missing required dependencies: {e}")
    print("Run: pip install requests python-dotenv")
    sys.exit(1)

class SupabaseDatabaseImporter:
    """Supabase database importer with batch operations and validation"""
    
    def __init__(self, supabase_url: str = None, service_role_key: str = None, embedding_timeout: int = 5):
        """Initialize with Supabase connection details"""
        # Load environment variables
        load_dotenv()
        
        self.supabase_url = supabase_url or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.service_role_key = service_role_key or os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.service_role_key:
            raise ValueError("Supabase URL and Service Role Key are required")
        
        # API endpoints
        self.base_api_url = f"{self.supabase_url}/rest/v1"
        self.headers = {
            'apikey': self.service_role_key,
            'Authorization': f'Bearer {self.service_role_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
        
        # Setup logging
        self.logger = self._setup_logging()
        
        # Import tracking
        self.import_stats = {
            'brands_processed': 0,
            'brands_imported': 0,
            'brands_skipped': 0,
            'fragrances_processed': 0,
            'fragrances_imported': 0,
            'fragrances_skipped': 0,
            'duplicates_detected': 0,
            'validation_errors': 0,
            'start_time': datetime.now()
        }
        
        self.batch_size = 100  # Supabase batch size limit
        self.embedding_timeout = embedding_timeout  # Timeout for embedding generation
        
    def _setup_logging(self) -> logging.Logger:
        """Setup logging configuration"""
        log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
        os.makedirs(log_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_file = os.path.join(log_dir, f'database_import_{timestamp}.log')
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )
        
        return logging.getLogger(__name__)
    
    def test_connection(self) -> bool:
        """Test Supabase connection"""
        try:
            response = requests.get(
                f"{self.base_api_url}/fragrances?limit=1",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                self.logger.info("✅ Supabase connection successful")
                return True
            else:
                self.logger.error(f"❌ Supabase connection failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.logger.error(f"❌ Supabase connection error: {e}")
            return False
    
    def validate_fragrance_data(self, fragrance: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate fragrance data against schema requirements"""
        errors = []
        
        # Required fields check
        required_fields = ['id', 'brand_id', 'name', 'slug', 'gender']
        for field in required_fields:
            if field not in fragrance or not fragrance[field]:
                errors.append(f"Missing required field: {field}")
        
        # Check for accords/main_accords
        if 'main_accords' not in fragrance and 'accords' not in fragrance:
            errors.append("Missing accords data (need 'main_accords' or 'accords')")
        
        # Gender validation
        if 'gender' in fragrance:
            valid_genders = ['men', 'women', 'unisex']
            if fragrance['gender'] not in valid_genders:
                errors.append(f"Invalid gender: {fragrance['gender']} (must be one of: {valid_genders})")
        
        # Rating validation
        if 'rating_value' in fragrance and fragrance['rating_value'] is not None:
            rating = fragrance['rating_value']
            if not (0.0 <= rating <= 5.0):
                errors.append(f"Invalid rating_value: {rating} (must be 0.0-5.0)")
        
        # Sample price validation
        if 'sample_price_usd' in fragrance and fragrance['sample_price_usd'] is not None:
            price = fragrance['sample_price_usd']
            if not (0 <= price <= 100):
                errors.append(f"Invalid sample_price_usd: {price} (must be 0-100)")
        
        # ID format validation
        if 'id' in fragrance and 'brand_id' in fragrance:
            if not fragrance['id'].startswith(fragrance['brand_id'] + '__'):
                errors.append(f"ID format mismatch: {fragrance['id']} should start with {fragrance['brand_id']}__")
        
        return len(errors) == 0, errors
    
    def validate_brand_data(self, brand: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate brand data against schema requirements"""
        errors = []
        
        # Required fields
        required_fields = ['id', 'name', 'slug']
        for field in required_fields:
            if field not in brand or not brand[field]:
                errors.append(f"Missing required field: {field}")
        
        # Brand tier validation
        if 'brand_tier' in brand and brand['brand_tier'] is not None:
            valid_tiers = ['luxury', 'premium', 'designer', 'mass', 'niche', 'celebrity']
            if brand['brand_tier'] not in valid_tiers:
                errors.append(f"Invalid brand_tier: {brand['brand_tier']} (must be one of: {valid_tiers})")
        
        # Sample availability score validation
        if 'sample_availability_score' in brand and brand['sample_availability_score'] is not None:
            score = brand['sample_availability_score']
            if not (0 <= score <= 100):
                errors.append(f"Invalid sample_availability_score: {score} (must be 0-100)")
        
        return len(errors) == 0, errors
    
    def transform_fragrance_for_db(self, fragrance: Dict[str, Any]) -> Dict[str, Any]:
        """Transform pipeline fragrance data to database format"""
        db_fragrance = fragrance.copy()
        
        # Map 'accords' to 'main_accords' if needed
        if 'accords' in db_fragrance and 'main_accords' not in db_fragrance:
            db_fragrance['main_accords'] = db_fragrance['accords']
            del db_fragrance['accords']
        
        # Map 'year' to 'launch_year' if needed
        if 'year' in db_fragrance and 'launch_year' not in db_fragrance:
            db_fragrance['launch_year'] = db_fragrance['year']
            del db_fragrance['year']
        
        # Map 'priority_score' to 'popularity_score' (use existing schema)
        if 'priority_score' in db_fragrance and 'popularity_score' not in db_fragrance:
            db_fragrance['popularity_score'] = db_fragrance['priority_score']
            del db_fragrance['priority_score']
        
        # Remove brand_name field (it's redundant with brands table relationship)
        if 'brand_name' in db_fragrance:
            del db_fragrance['brand_name']
        
        # Set defaults for required fields
        if 'sample_available' not in db_fragrance:
            db_fragrance['sample_available'] = True
        
        if 'data_source' not in db_fragrance:
            db_fragrance['data_source'] = 'hybrid_pipeline'
        
        if 'is_verified' not in db_fragrance:
            db_fragrance['is_verified'] = True  # Pipeline data is considered verified
        
        # Handle perfected data fields (optional - only include if present)
        perfected_fields = [
            'concentration', 'enhanced_description', 'brand_tier', 'bayesian_rating',
            'full_bottle_price', 'retail_price', 'discount_percent', 'price_per_ml',
            'format_version'
        ]
        
        # Keep perfected fields if they exist
        for field in perfected_fields:
            if field in fragrance and field not in db_fragrance:
                db_fragrance[field] = fragrance[field]
        
        # Convert string notes to arrays if they're not already
        for notes_field in ['top_notes', 'middle_notes', 'base_notes']:
            if notes_field in db_fragrance and isinstance(db_fragrance[notes_field], str):
                # Split by comma and clean up
                db_fragrance[notes_field] = [
                    note.strip() for note in db_fragrance[notes_field].split(',')
                    if note.strip()
                ]
        
        # Ensure perfumers is a list
        if 'perfumers' in db_fragrance and isinstance(db_fragrance['perfumers'], str):
            db_fragrance['perfumers'] = [db_fragrance['perfumers']]
        
        return db_fragrance
    
    def transform_brand_for_db(self, brand: Dict[str, Any]) -> Dict[str, Any]:
        """Transform pipeline brand data to database format"""
        db_brand = brand.copy()
        
        # Remove fields that don't exist in current schema
        fields_to_remove = ['fragrance_count']  # This field doesn't exist in current schema
        for field in fields_to_remove:
            if field in db_brand:
                del db_brand[field]
        
        # Set defaults
        if 'is_active' not in db_brand:
            db_brand['is_active'] = True
        
        if 'affiliate_supported' not in db_brand:
            db_brand['affiliate_supported'] = False
        
        if 'sample_availability_score' not in db_brand:
            db_brand['sample_availability_score'] = 50  # Default medium availability
        
        # Handle perfected brand fields
        if 'brand_name' in brand and 'display_name' not in db_brand:
            db_brand['display_name'] = brand['brand_name']
        elif 'display_name' not in db_brand:
            # Create display name from ID
            db_brand['display_name'] = brand.get('name', brand.get('id', '')).title()
        
        # Handle brand tier and prestige score
        if 'brand_tier' in brand:
            db_brand['brand_tier'] = brand['brand_tier']
            
            # Set prestige score based on tier
            prestige_scores = {
                'luxury': 1.20, 'premium': 1.15, 'niche': 1.18,
                'designer': 1.10, 'celebrity': 0.95, 'mass': 1.0
            }
            db_brand['prestige_score'] = prestige_scores.get(brand.get('brand_tier', 'designer'), 1.0)
        
        return db_brand
    
    def check_existing_records(self, table: str, ids: List[str]) -> set:
        """Check which records already exist in the database"""
        if not ids:
            return set()
        
        try:
            # Use 'in' operator to check multiple IDs
            ids_filter = ','.join([f'"{id_}"' for id_ in ids])
            response = requests.get(
                f"{self.base_api_url}/{table}?select=id&id=in.({ids_filter})",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                existing_records = response.json()
                return {record['id'] for record in existing_records}
            else:
                self.logger.warning(f"Failed to check existing records: {response.status_code}")
                return set()
                
        except Exception as e:
            self.logger.error(f"Error checking existing records: {e}")
            return set()
    
    def batch_upsert(self, table: str, records: List[Dict[str, Any]]) -> Tuple[int, int]:
        """Batch upsert records to Supabase"""
        if not records:
            return 0, 0
        
        inserted = 0
        updated = 0
        
        for i in range(0, len(records), self.batch_size):
            batch = records[i:i + self.batch_size]
            
            try:
                response = requests.post(
                    f"{self.base_api_url}/{table}?on_conflict=id",
                    headers={**self.headers, 'Prefer': 'resolution=merge-duplicates'},
                    json=batch,
                    timeout=60
                )
                
                if response.status_code in [200, 201]:
                    batch_size = len(batch)
                    inserted += batch_size
                    self.logger.info(f"✅ Batch upserted {batch_size} {table} records")
                else:
                    self.logger.error(f"❌ Batch upsert failed for {table}: {response.status_code}")
                    self.logger.error(f"Response: {response.text}")
                    
            except Exception as e:
                self.logger.error(f"❌ Error batch upserting {table}: {e}")
        
        return inserted, updated
    
    def import_brands(self, brands_data: List[Dict[str, Any]]) -> int:
        """Import brand data with validation and duplicate detection"""
        self.logger.info(f"🔄 Starting brand import: {len(brands_data)} brands")
        
        valid_brands = []
        
        # Validate and transform brands
        for brand in brands_data:
            self.import_stats['brands_processed'] += 1
            
            is_valid, errors = self.validate_brand_data(brand)
            if not is_valid:
                self.logger.warning(f"⚠️  Invalid brand {brand.get('id', 'unknown')}: {'; '.join(errors)}")
                self.import_stats['validation_errors'] += 1
                continue
            
            # Transform for database
            db_brand = self.transform_brand_for_db(brand)
            valid_brands.append(db_brand)
        
        # Check for existing brands
        brand_ids = [brand['id'] for brand in valid_brands]
        existing_brand_ids = self.check_existing_records('fragrance_brands', brand_ids)
        
        # Filter out existing brands or mark for update
        new_brands = []
        for brand in valid_brands:
            if brand['id'] in existing_brand_ids:
                self.import_stats['brands_skipped'] += 1
                self.import_stats['duplicates_detected'] += 1
                self.logger.info(f"⏭️  Skipping existing brand: {brand['id']}")
            else:
                new_brands.append(brand)
        
        # Import new brands
        if new_brands:
            inserted, updated = self.batch_upsert('fragrance_brands', new_brands)
            self.import_stats['brands_imported'] = inserted
            self.logger.info(f"✅ Imported {inserted} new brands")
        
        return len(new_brands)
    
    def import_fragrances(self, fragrances_data: List[Dict[str, Any]]) -> int:
        """Import fragrance data with validation and duplicate detection"""
        self.logger.info(f"🔄 Starting fragrance import: {len(fragrances_data)} fragrances")
        
        valid_fragrances = []
        
        # Validate and transform fragrances
        for fragrance in fragrances_data:
            self.import_stats['fragrances_processed'] += 1
            
            is_valid, errors = self.validate_fragrance_data(fragrance)
            if not is_valid:
                self.logger.warning(f"⚠️  Invalid fragrance {fragrance.get('id', 'unknown')}: {'; '.join(errors)}")
                self.import_stats['validation_errors'] += 1
                continue
            
            # Transform for database
            db_fragrance = self.transform_fragrance_for_db(fragrance)
            valid_fragrances.append(db_fragrance)
        
        # Check for existing fragrances
        fragrance_ids = [frag['id'] for frag in valid_fragrances]
        existing_fragrance_ids = self.check_existing_records('fragrances', fragrance_ids)
        
        # Filter out existing fragrances
        new_fragrances = []
        for fragrance in valid_fragrances:
            if fragrance['id'] in existing_fragrance_ids:
                self.import_stats['fragrances_skipped'] += 1
                self.import_stats['duplicates_detected'] += 1
                self.logger.info(f"⏭️  Skipping existing fragrance: {fragrance['id']}")
            else:
                new_fragrances.append(fragrance)
        
        # Import new fragrances in batches
        if new_fragrances:
            inserted, updated = self.batch_upsert('fragrances', new_fragrances)
            self.import_stats['fragrances_imported'] = inserted
            self.logger.info(f"✅ Imported {inserted} new fragrances")
        
        return len(new_fragrances)
    
    def check_embedding_generation_status(self) -> Dict[str, Any]:
        """Check the status of automatic embedding generation"""
        try:
            # Query AI processing queue for pending embedding generation
            response = requests.get(
                f"{self.base_api_url}/ai_processing_queue?select=id,fragrance_id,status&operation_type=eq.generate_embedding&status=neq.completed&limit=100",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                pending_embeddings = response.json()
                return {
                    'pending_count': len(pending_embeddings),
                    'pending_fragrances': [item['fragrance_id'] for item in pending_embeddings],
                    'queue_healthy': True
                }
            else:
                self.logger.warning(f"⚠️  Could not check embedding queue: {response.status_code}")
                return {'queue_healthy': False}
                
        except Exception as e:
            self.logger.error(f"❌ Error checking embedding status: {e}")
            return {'queue_healthy': False}
    
    def verify_embedding_triggers_active(self) -> bool:
        """Verify that embedding generation triggers are active"""
        try:
            # Test by checking if fragrances have embedding vectors
            response = requests.get(
                f"{self.base_api_url}/fragrances?select=id,scent_profile_vector&is_null=scent_profile_vector.false&limit=5",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                fragrances_with_embeddings = response.json()
                has_embeddings = len(fragrances_with_embeddings) > 0
                
                if has_embeddings:
                    self.logger.info("✅ Embedding system appears to be working - found fragrances with vectors")
                else:
                    self.logger.warning("⚠️  No fragrances with embeddings found - trigger may not be working")
                
                return has_embeddings
            else:
                self.logger.warning(f"⚠️  Could not verify embedding system: {response.status_code}")
                return False
                
        except Exception as e:
            self.logger.error(f"❌ Error verifying embedding system: {e}")
            return False
    
    def wait_for_embedding_processing(self, timeout_minutes: int = 10) -> bool:
        """Wait for embedding processing to complete for imported fragrances"""
        if timeout_minutes <= 0:
            return True  # Skip waiting if timeout is 0 or negative
        
        self.logger.info(f"⏳ Waiting for embedding generation (max {timeout_minutes} minutes)...")
        
        timeout_seconds = timeout_minutes * 60
        start_time = time.time()
        check_interval = 30  # Check every 30 seconds
        
        while (time.time() - start_time) < timeout_seconds:
            status = self.check_embedding_generation_status()
            
            if status.get('queue_healthy', False):
                pending_count = status.get('pending_count', 0)
                
                if pending_count == 0:
                    self.logger.info("✅ All embeddings generated successfully")
                    return True
                else:
                    remaining_time = timeout_seconds - (time.time() - start_time)
                    self.logger.info(f"⏳ {pending_count} embeddings still generating... ({remaining_time:.0f}s remaining)")
            
            time.sleep(check_interval)
        
        # Final check after timeout
        final_status = self.check_embedding_generation_status()
        pending_count = final_status.get('pending_count', 0)
        
        if pending_count > 0:
            self.logger.warning(f"⚠️  Timeout reached - {pending_count} embeddings still pending")
            return False
        else:
            self.logger.info("✅ All embeddings completed just within timeout")
            return True

    def create_import_tracking_record(self) -> None:
        """Create a record in import tracking table"""
        tracking_data = {
            'import_batch': int(time.time()),  # Use timestamp as batch ID
            'source_file': 'hybrid_pipeline',
            'total_records_processed': (
                self.import_stats['brands_processed'] + 
                self.import_stats['fragrances_processed']
            ),
            'brands_imported': self.import_stats['brands_imported'],
            'fragrances_imported': self.import_stats['fragrances_imported'],
            'duplicates_skipped': self.import_stats['duplicates_detected'],
            'errors_encountered': self.import_stats['validation_errors'],
            'completion_time': str(datetime.now() - self.import_stats['start_time']),
            'notes': f"Hybrid pipeline import completed successfully"
        }
        
        try:
            response = requests.post(
                f"{self.base_api_url}/kaggle_import_tracking",
                headers=self.headers,
                json=[tracking_data],
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                self.logger.info("✅ Import tracking record created")
            else:
                self.logger.warning(f"⚠️  Failed to create tracking record: {response.status_code}")
                
        except Exception as e:
            self.logger.error(f"❌ Error creating tracking record: {e}")
    
    def import_pipeline_data(self, 
                           fragrances_file: str = None, 
                           brands_file: str = None) -> Dict[str, Any]:
        """Main import function for pipeline data"""
        self.logger.info("🚀 Starting hybrid pipeline database import")
        
        # Test connection first
        if not self.test_connection():
            raise Exception("Failed to connect to Supabase")
        
        # Determine file paths
        if not fragrances_file or not brands_file:
            output_dir = os.path.join(os.path.dirname(__file__), '..', 'output')
            
            # Find latest files
            fragrance_files = [f for f in os.listdir(output_dir) 
                             if f.startswith('fragrances_final_') and f.endswith('.json')]
            brand_files = [f for f in os.listdir(output_dir) 
                          if f.startswith('brands_final_') and f.endswith('.json')]
            
            if fragrance_files:
                fragrances_file = os.path.join(output_dir, sorted(fragrance_files)[-1])
            
            if brand_files:
                brands_file = os.path.join(output_dir, sorted(brand_files)[-1])
        
        if not fragrances_file or not brands_file:
            raise Exception("Could not find fragrance or brand data files")
        
        self.logger.info(f"📁 Fragrances file: {fragrances_file}")
        self.logger.info(f"📁 Brands file: {brands_file}")
        
        # Load data
        try:
            with open(brands_file, 'r', encoding='utf-8') as f:
                brands_data = json.load(f)
            
            with open(fragrances_file, 'r', encoding='utf-8') as f:
                fragrances_data = json.load(f)
                
        except Exception as e:
            raise Exception(f"Failed to load data files: {e}")
        
        # Verify embedding system is working before import
        embedding_system_healthy = self.verify_embedding_triggers_active()
        
        # Import brands first (fragrances reference brands)
        brands_imported = self.import_brands(brands_data)
        
        # Import fragrances (this will trigger automatic embedding generation)
        fragrances_imported = self.import_fragrances(fragrances_data)
        
        # Wait for embedding processing to complete if fragrances were imported
        embedding_success = True
        embedding_timeout = getattr(self, 'embedding_timeout', 5)  # Default 5 minutes
        if fragrances_imported > 0 and embedding_system_healthy:
            self.logger.info(f"🧠 Starting embedding generation for {fragrances_imported} new fragrances...")
            embedding_success = self.wait_for_embedding_processing(timeout_minutes=embedding_timeout)
        elif fragrances_imported > 0:
            self.logger.warning("⚠️  Embedding system may not be active - skipping embedding wait")
        
        # Create tracking record
        self.create_import_tracking_record()
        
        # Calculate completion time
        completion_time = datetime.now() - self.import_stats['start_time']
        
        # Final embedding status check
        final_embedding_status = self.check_embedding_generation_status() if embedding_system_healthy else None
        
        # Final summary
        summary = {
            'completion_time': str(completion_time),
            'brands_imported': brands_imported,
            'fragrances_imported': fragrances_imported,
            'duplicates_skipped': self.import_stats['duplicates_detected'],
            'validation_errors': self.import_stats['validation_errors'],
            'total_records': brands_imported + fragrances_imported,
            'embedding_system_healthy': embedding_system_healthy,
            'embedding_generation_success': embedding_success,
            'pending_embeddings': final_embedding_status.get('pending_count', 0) if final_embedding_status else 'unknown'
        }
        
        self.logger.info("🎉 Import completed successfully!")
        self.logger.info(f"📊 Summary: {summary}")
        
        return summary


def main():
    """Main function for command-line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Import hybrid pipeline data to Supabase')
    parser.add_argument('--fragrances', help='Path to fragrances JSON file')
    parser.add_argument('--brands', help='Path to brands JSON file')
    parser.add_argument('--test-connection', action='store_true', 
                       help='Test database connection only')
    parser.add_argument('--skip-embeddings', action='store_true',
                       help='Skip waiting for embedding generation')
    parser.add_argument('--embedding-timeout', type=int, default=5,
                       help='Timeout in minutes for embedding generation (default: 5)')
    
    args = parser.parse_args()
    
    try:
        importer = SupabaseDatabaseImporter(embedding_timeout=args.embedding_timeout)
        
        if args.test_connection:
            success = importer.test_connection()
            sys.exit(0 if success else 1)
        
        # Configure embedding options
        if args.skip_embeddings:
            # Modify the importer to skip embedding processing
            original_wait = importer.wait_for_embedding_processing
            importer.wait_for_embedding_processing = lambda timeout_minutes: True
            
        # Run import  
        summary = importer.import_pipeline_data(
            fragrances_file=args.fragrances,
            brands_file=args.brands
        )
        
        print(f"\n✅ Import completed successfully!")
        print(f"📊 Imported {summary['total_records']} records in {summary['completion_time']}")
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()