#!/usr/bin/env python3
"""
Development Database Reset Script
Complete cleanup and fresh import for development environment
"""

import json
import os
import sys
import logging
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

# Add parent directory for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import requests
    from dotenv import load_dotenv
    
    # Import database importer
    import importlib.util
    script_path = os.path.join(os.path.dirname(__file__), '04_database_importer.py')
    spec = importlib.util.spec_from_file_location("database_importer", script_path)
    database_importer_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(database_importer_module)
    SupabaseDatabaseImporter = database_importer_module.SupabaseDatabaseImporter
    
except ImportError as e:
    print(f"Missing required dependencies: {e}")
    print("Run: pip install requests python-dotenv")
    sys.exit(1)

class DevelopmentDatabaseReset:
    """Complete database reset and fresh import for development"""
    
    def __init__(self):
        """Initialize database reset system"""
        load_dotenv()
        
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.service_role_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.service_role_key:
            raise ValueError("Supabase URL and Service Role Key are required")
        
        self.base_api_url = f"{self.supabase_url}/rest/v1"
        self.headers = {
            'apikey': self.service_role_key,
            'Authorization': f'Bearer {self.service_role_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
        
        # Setup logging
        self.logger = self._setup_logging()
        
        # Reset statistics
        self.reset_stats = {
            'start_time': datetime.now(),
            'tables_cleaned': [],
            'records_deleted': 0,
            'records_imported': 0,
            'errors_encountered': []
        }
    
    def _setup_logging(self) -> logging.Logger:
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[logging.StreamHandler(sys.stdout)]
        )
        return logging.getLogger(__name__)
    
    def confirm_development_environment(self) -> bool:
        """Confirm this is a development environment before proceeding"""
        print("🚨 DATABASE RESET WARNING 🚨")
        print("This will PERMANENTLY DELETE all data in the database:")
        print("  • All fragrances and brands")
        print("  • All user collections and interactions") 
        print("  • All AI insights cache")
        print("  • All quiz data and sessions")
        print("  • All import tracking records")
        print("")
        
        # Check if we're in a development environment
        env = os.getenv('NODE_ENV', 'development')
        deployment_env = os.getenv('DEPLOYMENT_ENVIRONMENT', 'development')
        
        if env == 'production' or deployment_env == 'production':
            print("❌ BLOCKED: This appears to be a production environment!")
            print("Database reset is only allowed in development environments.")
            return False
        
        print(f"Environment: {env} / {deployment_env}")
        print("")
        
        response = input("Type 'RESET_DATABASE' to confirm (anything else will abort): ")
        return response == 'RESET_DATABASE'
    
    def get_current_database_state(self) -> Dict[str, int]:
        """Get current record counts from all tables"""
        tables_to_check = [
            'fragrances',
            'fragrance_brands', 
            'user_collections',
            'user_fragrance_interactions',
            'ai_insights_cache',
            'quiz_sessions',
            'quiz_responses',
            'kaggle_import_tracking'
        ]
        
        current_state = {}
        
        for table in tables_to_check:
            try:
                response = requests.get(
                    f"{self.base_api_url}/{table}?select=count",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    count_data = response.json()
                    current_state[table] = count_data[0]['count'] if count_data else 0
                else:
                    current_state[table] = 'unknown'
                    
            except Exception as e:
                current_state[table] = 'error'
                self.logger.warning(f"⚠️  Could not check {table}: {e}")
        
        return current_state
    
    def clean_table(self, table_name: str) -> int:
        """Clean all records from a specific table"""
        try:
            self.logger.info(f"🧹 Cleaning table: {table_name}")
            
            # Delete all records from table
            response = requests.delete(
                f"{self.base_api_url}/{table_name}?id=neq.never_matches_anything_so_deletes_all",
                headers=self.headers,
                timeout=60
            )
            
            if response.status_code in [200, 204]:
                self.logger.info(f"✅ Cleaned table: {table_name}")
                self.reset_stats['tables_cleaned'].append(table_name)
                return 1
            else:
                self.logger.error(f"❌ Failed to clean {table_name}: {response.status_code}")
                return 0
                
        except Exception as e:
            self.logger.error(f"❌ Error cleaning {table_name}: {e}")
            self.reset_stats['errors_encountered'].append(f"Clean {table_name}: {e}")
            return 0
    
    def clean_all_data(self) -> bool:
        """Clean all data from database in correct order (respecting foreign keys)"""
        self.logger.info("🗑️  Starting complete database cleanup")
        
        # Order matters due to foreign key constraints
        # Clean child tables first, then parent tables
        cleanup_order = [
            'ai_insights_cache',           # References fragrances
            'user_fragrance_interactions', # References fragrances and users
            'user_collections',            # References fragrances and users
            'quiz_responses',              # References quiz_sessions
            'quiz_sessions',               # Standalone table
            'kaggle_import_tracking',      # Standalone table
            'fragrances',                  # References fragrance_brands
            'fragrance_brands'             # Parent table
        ]
        
        success_count = 0
        
        for table in cleanup_order:
            if self.clean_table(table):
                success_count += 1
                time.sleep(1)  # Small delay between operations
        
        self.logger.info(f"🧹 Cleaned {success_count}/{len(cleanup_order)} tables")
        return success_count == len(cleanup_order)
    
    def verify_cleanup(self) -> bool:
        """Verify that cleanup was successful"""
        self.logger.info("🔍 Verifying database cleanup")
        
        verification_tables = ['fragrances', 'fragrance_brands', 'user_collections']
        all_empty = True
        
        for table in verification_tables:
            try:
                response = requests.get(
                    f"{self.base_api_url}/{table}?select=count",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    count_data = response.json()
                    count = count_data[0]['count'] if count_data else 0
                    
                    if count == 0:
                        self.logger.info(f"✅ {table}: empty (cleaned successfully)")
                    else:
                        self.logger.warning(f"⚠️  {table}: still has {count} records")
                        all_empty = False
                else:
                    self.logger.error(f"❌ Could not verify {table}: {response.status_code}")
                    all_empty = False
                    
            except Exception as e:
                self.logger.error(f"❌ Error verifying {table}: {e}")
                all_empty = False
        
        if all_empty:
            self.logger.info("✅ Database cleanup verified - all tables empty")
        else:
            self.logger.warning("⚠️  Database cleanup incomplete - some tables not empty")
        
        return all_empty
    
    def import_hybrid_pipeline_data(self) -> Dict[str, Any]:
        """Import the new hybrid pipeline data"""
        self.logger.info("📥 Starting hybrid pipeline data import")
        
        try:
            # Create database importer
            importer = SupabaseDatabaseImporter()
            
            # Find latest hybrid pipeline data files
            output_dir = os.path.join(os.path.dirname(__file__), '..', 'output')
            
            fragrance_files = [f for f in os.listdir(output_dir) 
                             if f.startswith('fragrances_final_') and f.endswith('.json')]
            brand_files = [f for f in os.listdir(output_dir) 
                          if f.startswith('brands_final_') and f.endswith('.json')]
            
            if not fragrance_files or not brand_files:
                raise Exception("Could not find hybrid pipeline data files")
            
            # Use latest files
            latest_fragrances = os.path.join(output_dir, sorted(fragrance_files)[-1])
            latest_brands = os.path.join(output_dir, sorted(brand_files)[-1])
            
            self.logger.info(f"📁 Using fragrances: {os.path.basename(latest_fragrances)}")
            self.logger.info(f"📁 Using brands: {os.path.basename(latest_brands)}")
            
            # Run import
            import_summary = importer.import_pipeline_data(
                fragrances_file=latest_fragrances,
                brands_file=latest_brands
            )
            
            self.reset_stats['records_imported'] = import_summary.get('total_records', 0)
            
            return import_summary
            
        except Exception as e:
            self.logger.error(f"❌ Import failed: {e}")
            self.reset_stats['errors_encountered'].append(f"Import: {e}")
            raise
    
    def verify_new_data(self) -> bool:
        """Verify the new data was imported correctly"""
        self.logger.info("🔍 Verifying new data import")
        
        try:
            # Check fragrance count
            response = requests.get(
                f"{self.base_api_url}/fragrances?select=count",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                count_data = response.json()
                fragrance_count = count_data[0]['count'] if count_data else 0
                self.logger.info(f"📊 Total fragrances: {fragrance_count}")
                
                # Verify we have the expected ~2,000 fragrances
                if fragrance_count >= 2000:
                    self.logger.info("✅ Fragrance count looks correct")
                else:
                    self.logger.warning(f"⚠️  Expected ~2000 fragrances, got {fragrance_count}")
            
            # Check data source
            response = requests.get(
                f"{self.base_api_url}/fragrances?select=data_source&limit=5",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                sources = response.json()
                hybrid_sources = [f for f in sources if f.get('data_source') == 'hybrid_pipeline']
                
                if len(hybrid_sources) > 0:
                    self.logger.info("✅ New hybrid_pipeline data confirmed")
                    return True
                else:
                    self.logger.warning("⚠️  No hybrid_pipeline data source found")
                    return False
            
            return False
            
        except Exception as e:
            self.logger.error(f"❌ Verification failed: {e}")
            return False
    
    def execute_full_reset(self) -> Dict[str, Any]:
        """Execute complete database reset with new data"""
        self.logger.info("🚀 Starting complete development database reset")
        
        # Step 1: Confirm environment and get user consent
        if not self.confirm_development_environment():
            self.logger.info("🛑 Database reset cancelled by user")
            return {'success': False, 'reason': 'cancelled_by_user'}
        
        # Step 2: Show current state
        self.logger.info("📊 Current database state:")
        current_state = self.get_current_database_state()
        for table, count in current_state.items():
            self.logger.info(f"  {table}: {count} records")
        
        # Step 3: Clean all existing data
        self.logger.info("🧹 Cleaning all existing data...")
        cleanup_success = self.clean_all_data()
        
        if not cleanup_success:
            self.logger.error("❌ Database cleanup failed")
            return {'success': False, 'reason': 'cleanup_failed'}
        
        # Step 4: Verify cleanup
        if not self.verify_cleanup():
            self.logger.error("❌ Database cleanup verification failed")
            return {'success': False, 'reason': 'cleanup_verification_failed'}
        
        # Step 5: Import new hybrid pipeline data
        self.logger.info("📥 Importing fresh hybrid pipeline data...")
        
        try:
            import_summary = self.import_hybrid_pipeline_data()
            self.logger.info("✅ Data import completed successfully")
        except Exception as e:
            self.logger.error(f"❌ Data import failed: {e}")
            return {'success': False, 'reason': 'import_failed', 'error': str(e)}
        
        # Step 6: Verify new data
        if not self.verify_new_data():
            self.logger.warning("⚠️  Data verification had issues")
        
        # Step 7: Final summary
        completion_time = datetime.now() - self.reset_stats['start_time']
        
        summary = {
            'success': True,
            'completion_time': str(completion_time),
            'tables_cleaned': len(self.reset_stats['tables_cleaned']),
            'records_imported': self.reset_stats['records_imported'],
            'errors_encountered': len(self.reset_stats['errors_encountered']),
            'import_summary': import_summary
        }
        
        self.logger.info("🎉 Development database reset completed successfully!")
        self.logger.info(f"📊 Final summary: {summary}")
        
        return summary


def main():
    """Main function for command-line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Reset development database with fresh hybrid pipeline data')
    parser.add_argument('--force', action='store_true', 
                       help='Skip confirmation prompt (use with caution)')
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be deleted without actually deleting')
    parser.add_argument('--verify-only', action='store_true',
                       help='Only verify current database state')
    
    args = parser.parse_args()
    
    try:
        reset_system = DevelopmentDatabaseReset()
        
        if args.verify_only:
            print("🔍 Current database state:")
            current_state = reset_system.get_current_database_state()
            for table, count in current_state.items():
                print(f"  {table}: {count} records")
            return
        
        if args.dry_run:
            print("🔍 DRY RUN - Current database state:")
            current_state = reset_system.get_current_database_state()
            total_records = sum(count for count in current_state.values() if isinstance(count, int))
            
            print(f"\nWould delete {total_records} total records from:")
            for table, count in current_state.items():
                if isinstance(count, int) and count > 0:
                    print(f"  • {table}: {count} records")
            
            print(f"\nWould then import ~2,004 new fragrances from hybrid pipeline")
            print("Run without --dry-run to execute")
            return
        
        # Override confirmation if --force is used
        if args.force:
            reset_system.confirm_development_environment = lambda: True
        
        # Execute full reset
        summary = reset_system.execute_full_reset()
        
        if summary['success']:
            print(f"\n✅ Database reset completed successfully!")
            print(f"📊 Imported {summary['records_imported']} records")
            print(f"⏱️  Completed in {summary['completion_time']}")
        else:
            print(f"\n❌ Database reset failed: {summary.get('reason', 'unknown error')}")
            sys.exit(1)
    
    except KeyboardInterrupt:
        print("\n🛑 Database reset cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Database reset failed: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()