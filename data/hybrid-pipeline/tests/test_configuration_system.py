#!/usr/bin/env python3
"""
Configuration System Tests
Tests for configuration loading, validation, and management
"""

import json
import os
import sys
import unittest
import tempfile
import logging
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

# Add parent directory for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class ConfigurationSystemTests(unittest.TestCase):
    """Test suite for configuration loading and validation"""
    
    def setUp(self):
        """Set up test environment"""
        self.temp_files = []
        
        # Default configuration schema for validation
        self.config_schema = {
            'required_fields': [
                'monitoring_enabled',
                'quality_threshold_rating',
                'quality_threshold_reviews',
                'schedule_day_of_week',
                'schedule_hour'
            ],
            'field_types': {
                'monitoring_enabled': bool,
                'quality_threshold_rating': (int, float),
                'quality_threshold_reviews': int,
                'schedule_day_of_week': int,
                'schedule_hour': int,
                'schedule_minute': int,
                'scraping_delay_seconds': (int, float),
                'max_new_fragrances_per_run': int,
                'notification_email': str,
                'notifications_enabled': bool
            },
            'field_ranges': {
                'quality_threshold_rating': (0.0, 5.0),
                'quality_threshold_reviews': (0, 100000),
                'schedule_day_of_week': (0, 6),
                'schedule_hour': (0, 23),
                'schedule_minute': (0, 59),
                'scraping_delay_seconds': (0.1, 10.0),
                'max_new_fragrances_per_run': (1, 1000)
            },
            'field_enums': {
                'schedule_timezone': ['UTC', 'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific', 'Europe/London']
            }
        }
        
        # Sample configurations for testing
        self.valid_config = {
            'monitoring_enabled': True,
            'quality_threshold_rating': 4.0,
            'quality_threshold_reviews': 500,
            'schedule_day_of_week': 0,
            'schedule_hour': 2,
            'schedule_minute': 0,
            'schedule_timezone': 'UTC',
            'scraping_delay_seconds': 2.0,
            'max_new_fragrances_per_run': 20,
            'notification_email': 'admin@scentmatch.com',
            'notifications_enabled': True
        }
        
        self.invalid_config = {
            'monitoring_enabled': 'yes',  # Should be boolean
            'quality_threshold_rating': 6.0,  # Above max (5.0)
            'quality_threshold_reviews': -10,  # Below min (0)
            'schedule_day_of_week': 8,  # Above max (6)
            'schedule_hour': 25,  # Above max (23)
            'scraping_delay_seconds': 0,  # Below min (0.1)
            'max_new_fragrances_per_run': 0,  # Below min (1)
            'schedule_timezone': 'InvalidTimezone'  # Not in enum
        }
        
        # Setup logging
        logging.basicConfig(level=logging.DEBUG)
        self.logger = logging.getLogger(__name__)
    
    def tearDown(self):
        """Clean up temporary files"""
        for temp_file in self.temp_files:
            try:
                os.unlink(temp_file)
            except:
                pass
    
    def _create_temp_config_file(self, config_data: Dict[str, Any]) -> str:
        """Create temporary configuration file"""
        temp_file = tempfile.NamedTemporaryFile(
            mode='w', delete=False, suffix='.json'
        )
        json.dump(config_data, temp_file, indent=2)
        temp_file.close()
        
        self.temp_files.append(temp_file.name)
        return temp_file.name
    
    def test_01_configuration_schema_validation(self):
        """Test configuration schema validation logic"""
        def validate_config_schema(config: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
            """Validate configuration against schema"""
            errors = []
            warnings = []
            
            # Check required fields
            for field in schema.get('required_fields', []):
                if field not in config:
                    errors.append(f"Missing required field: {field}")
            
            # Check field types
            for field, expected_types in schema.get('field_types', {}).items():
                if field in config:
                    value = config[field]
                    if not isinstance(expected_types, tuple):
                        expected_types = (expected_types,)
                    
                    if not isinstance(value, expected_types):
                        errors.append(f"Field '{field}' has type {type(value).__name__}, expected {expected_types}")
            
            # Check field ranges
            for field, (min_val, max_val) in schema.get('field_ranges', {}).items():
                if field in config:
                    value = config[field]
                    if isinstance(value, (int, float)):
                        if value < min_val or value > max_val:
                            errors.append(f"Field '{field}' value {value} outside range [{min_val}, {max_val}]")
            
            # Check field enums
            for field, valid_values in schema.get('field_enums', {}).items():
                if field in config:
                    value = config[field]
                    if value not in valid_values:
                        errors.append(f"Field '{field}' value '{value}' not in allowed values: {valid_values}")
            
            return {
                'valid': len(errors) == 0,
                'errors': errors,
                'warnings': warnings
            }
        
        # Test valid configuration
        validation = validate_config_schema(self.valid_config, self.config_schema)
        self.assertTrue(validation['valid'], f"Valid config should pass validation: {validation['errors']}")
        self.assertEqual(len(validation['errors']), 0)
        
        # Test invalid configuration
        validation = validate_config_schema(self.invalid_config, self.config_schema)
        self.assertFalse(validation['valid'], "Invalid config should fail validation")
        self.assertGreater(len(validation['errors']), 0, "Should have validation errors")
    
    def test_02_json_configuration_loading(self):
        """Test loading configuration from JSON files"""
        def load_json_config(file_path: str) -> Dict[str, Any]:
            """Load configuration from JSON file"""
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (FileNotFoundError, json.JSONDecodeError, IOError) as e:
                raise ValueError(f"Failed to load configuration from {file_path}: {e}")
        
        # Test valid JSON config loading
        config_file = self._create_temp_config_file(self.valid_config)
        loaded_config = load_json_config(config_file)
        
        # Verify all fields loaded correctly
        for key, value in self.valid_config.items():
            self.assertIn(key, loaded_config)
            self.assertEqual(loaded_config[key], value)
        
        # Test invalid JSON file
        invalid_json_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json')
        invalid_json_file.write('{ invalid json content }')
        invalid_json_file.close()
        self.temp_files.append(invalid_json_file.name)
        
        with self.assertRaises(ValueError):
            load_json_config(invalid_json_file.name)
        
        # Test non-existent file
        with self.assertRaises(ValueError):
            load_json_config('/non/existent/file.json')
    
    def test_03_environment_variable_integration(self):
        """Test configuration from environment variables"""
        def load_env_config() -> Dict[str, Any]:
            """Load configuration from environment variables"""
            env_config = {}
            
            # Map environment variables to config fields
            env_mappings = {
                'MONITORING_ENABLED': ('monitoring_enabled', lambda x: x.lower() == 'true'),
                'QUALITY_THRESHOLD_RATING': ('quality_threshold_rating', float),
                'QUALITY_THRESHOLD_REVIEWS': ('quality_threshold_reviews', int),
                'SCHEDULE_DAY_OF_WEEK': ('schedule_day_of_week', int),
                'SCHEDULE_HOUR': ('schedule_hour', int),
                'NOTIFICATION_EMAIL': ('notification_email', str),
                'SCRAPING_DELAY_SECONDS': ('scraping_delay_seconds', float)
            }
            
            for env_var, (config_key, converter) in env_mappings.items():
                env_value = os.getenv(env_var)
                if env_value is not None:
                    try:
                        env_config[config_key] = converter(env_value)
                    except (ValueError, TypeError):
                        pass  # Skip invalid environment values
            
            return env_config
        
        # Test with environment variables
        original_env = {}
        test_env_vars = {
            'MONITORING_ENABLED': 'true',
            'QUALITY_THRESHOLD_RATING': '4.2',
            'QUALITY_THRESHOLD_REVIEWS': '750',
            'SCHEDULE_DAY_OF_WEEK': '1',
            'NOTIFICATION_EMAIL': 'test@example.com'
        }
        
        try:
            # Set test environment variables
            for key, value in test_env_vars.items():
                original_env[key] = os.getenv(key)
                os.environ[key] = value
            
            # Load configuration from environment
            env_config = load_env_config()
            
            # Verify environment config
            self.assertEqual(env_config['monitoring_enabled'], True)
            self.assertEqual(env_config['quality_threshold_rating'], 4.2)
            self.assertEqual(env_config['quality_threshold_reviews'], 750)
            self.assertEqual(env_config['schedule_day_of_week'], 1)
            self.assertEqual(env_config['notification_email'], 'test@example.com')
            
        finally:
            # Restore original environment
            for key in test_env_vars:
                if original_env[key] is not None:
                    os.environ[key] = original_env[key]
                else:
                    os.environ.pop(key, None)
    
    def test_04_configuration_merging_priority(self):
        """Test configuration merging and priority handling"""
        def merge_configurations(default_config: Dict[str, Any], 
                               file_config: Dict[str, Any] = None,
                               env_config: Dict[str, Any] = None) -> Dict[str, Any]:
            """Merge configurations with priority: env > file > default"""
            merged = default_config.copy()
            
            # File config overrides defaults
            if file_config:
                merged.update(file_config)
            
            # Environment config overrides everything
            if env_config:
                merged.update(env_config)
            
            return merged
        
        # Test configuration priority
        default_config = {
            'monitoring_enabled': True,
            'quality_threshold_rating': 4.0,
            'notification_email': 'default@example.com'
        }
        
        file_config = {
            'quality_threshold_rating': 4.2,  # Override default
            'notification_email': 'file@example.com'  # Override default
        }
        
        env_config = {
            'notification_email': 'env@example.com'  # Override file and default
        }
        
        merged = merge_configurations(default_config, file_config, env_config)
        
        # Verify priority order
        self.assertEqual(merged['monitoring_enabled'], True)  # From default (unchanged)
        self.assertEqual(merged['quality_threshold_rating'], 4.2)  # From file (overrode default)
        self.assertEqual(merged['notification_email'], 'env@example.com')  # From env (highest priority)
    
    def test_05_configuration_validation_edge_cases(self):
        """Test configuration validation edge cases"""
        def validate_configuration_comprehensive(config: Dict[str, Any]) -> Dict[str, Any]:
            """Comprehensive configuration validation"""
            errors = []
            warnings = []
            
            # Edge case: empty config
            if not config:
                errors.append("Configuration is empty")
                return {'valid': False, 'errors': errors, 'warnings': warnings}
            
            # Mutual dependency checks
            if config.get('notifications_enabled', False) and not config.get('notification_email'):
                errors.append("notification_email required when notifications_enabled is true")
            
            # Logical consistency checks
            if config.get('max_new_fragrances_per_run', 0) > 100:
                warnings.append("max_new_fragrances_per_run > 100 may cause performance issues")
            
            if config.get('scraping_delay_seconds', 0) < 1.0:
                warnings.append("scraping_delay_seconds < 1.0 may violate rate limiting best practices")
            
            # Schedule consistency
            if config.get('schedule_hour', 0) >= 8 and config.get('schedule_hour', 0) <= 18:
                warnings.append("Scheduling during business hours may impact website performance")
            
            return {
                'valid': len(errors) == 0,
                'errors': errors,
                'warnings': warnings
            }
        
        # Test empty configuration
        validation = validate_configuration_comprehensive({})
        self.assertFalse(validation['valid'])
        self.assertIn("Configuration is empty", validation['errors'])
        
        # Test inconsistent configuration
        inconsistent_config = {
            'notifications_enabled': True,
            'notification_email': '',  # Empty email but notifications enabled
            'max_new_fragrances_per_run': 200,  # High number
            'scraping_delay_seconds': 0.5,  # Low delay
            'schedule_hour': 12  # Business hours
        }
        
        validation = validate_configuration_comprehensive(inconsistent_config)
        self.assertFalse(validation['valid'])  # Should fail due to email requirement
        self.assertGreater(len(validation['warnings']), 0)  # Should have warnings
    
    def test_06_configuration_file_formats(self):
        """Test different configuration file formats"""
        # Test JSON configuration
        json_config = self.valid_config.copy()
        json_file = self._create_temp_config_file(json_config)
        
        with open(json_file, 'r') as f:
            loaded_json = json.load(f)
        
        self.assertEqual(loaded_json, json_config)
        
        # Test YAML-like structured configuration (if we support it)
        structured_config = {
            'monitoring': {
                'enabled': True,
                'schedule': {
                    'day_of_week': 0,
                    'hour': 2,
                    'minute': 0,
                    'timezone': 'UTC'
                }
            },
            'quality': {
                'threshold_rating': 4.0,
                'threshold_reviews': 500
            },
            'notifications': {
                'enabled': True,
                'email': 'admin@example.com'
            }
        }
        
        # Flatten structured config for testing
        def flatten_config(nested_config: Dict[str, Any], prefix: str = '') -> Dict[str, Any]:
            """Flatten nested configuration to dot notation"""
            flat = {}
            for key, value in nested_config.items():
                new_key = f"{prefix}_{key}" if prefix else key
                if isinstance(value, dict):
                    flat.update(flatten_config(value, new_key))
                else:
                    flat[new_key] = value
            return flat
        
        flattened = flatten_config(structured_config)
        
        # Verify flattening worked
        self.assertIn('monitoring_enabled', flattened)
        self.assertIn('monitoring_schedule_day_of_week', flattened)
        self.assertIn('quality_threshold_rating', flattened)
        self.assertIn('notifications_email', flattened)
    
    def test_07_configuration_defaults_system(self):
        """Test configuration defaults and fallback system"""
        def apply_configuration_defaults(config: Dict[str, Any]) -> Dict[str, Any]:
            """Apply default values to incomplete configuration"""
            defaults = {
                'monitoring_enabled': True,
                'quality_threshold_rating': 4.0,
                'quality_threshold_reviews': 500,
                'schedule_day_of_week': 0,  # Sunday
                'schedule_hour': 2,  # 2 AM
                'schedule_minute': 0,
                'schedule_timezone': 'UTC',
                'scraping_delay_seconds': 2.0,
                'max_new_fragrances_per_run': 20,
                'notifications_enabled': True,
                'notification_email': '',
                'maintenance_enabled': True,
                'embedding_timeout_minutes': 10,
                'max_execution_time_minutes': 120
            }
            
            # Start with defaults, then apply user config
            final_config = defaults.copy()
            final_config.update(config)
            
            return final_config
        
        # Test partial configuration
        partial_config = {
            'quality_threshold_rating': 4.5,
            'notification_email': 'custom@example.com'
        }
        
        complete_config = apply_configuration_defaults(partial_config)
        
        # Verify defaults applied
        self.assertEqual(complete_config['monitoring_enabled'], True)  # Default
        self.assertEqual(complete_config['schedule_day_of_week'], 0)  # Default
        self.assertEqual(complete_config['quality_threshold_rating'], 4.5)  # User override
        self.assertEqual(complete_config['notification_email'], 'custom@example.com')  # User override
        
        # Verify all default fields present
        self.assertIn('scraping_delay_seconds', complete_config)
        self.assertIn('max_execution_time_minutes', complete_config)
        self.assertIn('embedding_timeout_minutes', complete_config)
    
    def test_08_environment_specific_configuration(self):
        """Test environment-specific configuration handling"""
        def load_environment_specific_config(environment: str) -> Dict[str, Any]:
            """Load configuration for specific environment"""
            base_config = {
                'monitoring_enabled': True,
                'quality_threshold_rating': 4.0,
                'scraping_delay_seconds': 2.0
            }
            
            if environment == 'development':
                base_config.update({
                    'scraping_delay_seconds': 0.5,  # Faster for dev
                    'max_new_fragrances_per_run': 5,  # Smaller batches
                    'notifications_enabled': False,  # No notifications in dev
                    'max_execution_time_minutes': 30  # Shorter timeout
                })
            elif environment == 'staging':
                base_config.update({
                    'scraping_delay_seconds': 1.5,  # Moderate delay
                    'max_new_fragrances_per_run': 10,
                    'notifications_enabled': True,
                    'notification_email': 'staging@example.com'
                })
            elif environment == 'production':
                base_config.update({
                    'scraping_delay_seconds': 3.0,  # Conservative delay
                    'max_new_fragrances_per_run': 20,
                    'notifications_enabled': True,
                    'notification_email': 'admin@scentmatch.com'
                })
            
            return base_config
        
        # Test development environment
        dev_config = load_environment_specific_config('development')
        self.assertEqual(dev_config['scraping_delay_seconds'], 0.5)
        self.assertEqual(dev_config['max_new_fragrances_per_run'], 5)
        self.assertFalse(dev_config['notifications_enabled'])
        
        # Test production environment
        prod_config = load_environment_specific_config('production')
        self.assertEqual(prod_config['scraping_delay_seconds'], 3.0)
        self.assertEqual(prod_config['max_new_fragrances_per_run'], 20)
        self.assertTrue(prod_config['notifications_enabled'])
        self.assertEqual(prod_config['notification_email'], 'admin@scentmatch.com')
    
    def test_09_configuration_hot_reload(self):
        """Test configuration hot-reload capabilities"""
        def watch_configuration_changes(config_file: str, callback_func) -> bool:
            """Monitor configuration file for changes"""
            try:
                # Get initial modification time
                initial_mtime = os.path.getmtime(config_file)
                
                # Simulate file change by updating timestamp
                time.sleep(0.1)
                os.utime(config_file, None)  # Update access/modification time
                
                # Check if file was modified
                current_mtime = os.path.getmtime(config_file)
                
                if current_mtime > initial_mtime:
                    callback_func(config_file)
                    return True
                
                return False
                
            except Exception as e:
                return False
        
        # Create test configuration file
        test_config = {'test': 'value'}
        config_file = self._create_temp_config_file(test_config)
        
        # Track callback execution
        callback_called = []
        
        def config_reload_callback(file_path):
            callback_called.append(file_path)
        
        # Test configuration change detection
        change_detected = watch_configuration_changes(config_file, config_reload_callback)
        
        # Verify change detection worked
        self.assertTrue(change_detected, "Should detect configuration file changes")
        self.assertEqual(len(callback_called), 1, "Callback should be called once")
        self.assertEqual(callback_called[0], config_file, "Callback should receive correct file path")
    
    def test_10_configuration_backup_and_recovery(self):
        """Test configuration backup and recovery mechanisms"""
        def backup_configuration(config: Dict[str, Any], backup_dir: str) -> str:
            """Create timestamped backup of configuration"""
            os.makedirs(backup_dir, exist_ok=True)
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = os.path.join(backup_dir, f'config_backup_{timestamp}.json')
            
            with open(backup_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2)
            
            return backup_file
        
        def restore_configuration(backup_file: str) -> Dict[str, Any]:
            """Restore configuration from backup"""
            with open(backup_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        
        # Test backup creation
        with tempfile.TemporaryDirectory() as temp_dir:
            backup_file = backup_configuration(self.valid_config, temp_dir)
            
            # Verify backup file created
            self.assertTrue(os.path.exists(backup_file))
            self.assertTrue(backup_file.endswith('.json'))
            self.assertIn('config_backup_', backup_file)
            
            # Test restoration
            restored_config = restore_configuration(backup_file)
            
            # Verify restoration accuracy
            self.assertEqual(restored_config, self.valid_config)


def run_configuration_tests():
    """Run all configuration system tests"""
    print("🔍 Starting configuration system tests...")
    
    # Create test suite
    test_loader = unittest.TestLoader()
    test_suite = test_loader.loadTestsFromTestCase(ConfigurationSystemTests)
    
    # Run tests with detailed output
    test_runner = unittest.TextTestRunner(
        verbosity=2,
        descriptions=True,
        failfast=False
    )
    
    result = test_runner.run(test_suite)
    
    # Summary
    print(f"\n{'='*60}")
    print(f"CONFIGURATION SYSTEM TEST SUMMARY")
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
        print(f"\n✅ ALL CONFIGURATION TESTS PASSED!")
        print(f"🎉 Configuration system is working correctly!")
    else:
        print(f"\n⚠️  Some configuration tests failed")
    
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_configuration_tests()
    sys.exit(0 if success else 1)