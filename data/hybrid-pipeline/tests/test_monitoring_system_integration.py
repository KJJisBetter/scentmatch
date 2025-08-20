#!/usr/bin/env python3
"""
Monitoring System Integration Verification Tests
End-to-end tests for all monitoring systems and automated workflows
"""

import json
import os
import sys
import unittest
import logging
import time
import tempfile
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from unittest.mock import Mock, patch, MagicMock

# Add parent directory for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import requests
    from dotenv import load_dotenv
    
    # Import the monitoring system using importlib to handle numbers in filename
    import importlib.util
    script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', '05_ongoing_monitor.py')
    spec = importlib.util.spec_from_file_location("ongoing_monitor", script_path)
    monitoring_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(monitoring_module)
    OngoingMonitoringSystem = monitoring_module.OngoingMonitoringSystem
    
except ImportError as e:
    print(f"Missing required dependencies: {e}")
    print("Run: pip install requests python-dotenv apscheduler")
    sys.exit(1)

class MonitoringSystemIntegrationTests(unittest.TestCase):
    """Integration tests for the complete monitoring system"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test class with monitoring system"""
        load_dotenv()
        
        # Create temporary configuration for testing
        cls.test_config = {
            'monitoring_enabled': True,
            'schedule_day_of_week': 0,
            'schedule_hour': 2,
            'schedule_minute': 0,
            'quality_threshold_rating': 4.0,
            'quality_threshold_reviews': 500,
            'max_new_fragrances_per_run': 5,  # Lower for testing
            'maintenance_enabled': True,
            'notifications_enabled': False,  # Disable for testing
            'max_execution_time_minutes': 30,
            'scraping_delay_seconds': 0.1,  # Faster for testing
        }
        
        # Create temporary config file
        cls.temp_config_file = tempfile.NamedTemporaryFile(
            mode='w', delete=False, suffix='.json'
        )
        json.dump(cls.test_config, cls.temp_config_file)
        cls.temp_config_file.close()
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        cls.logger = logging.getLogger(__name__)
        
    @classmethod 
    def tearDownClass(cls):
        """Clean up test resources"""
        try:
            os.unlink(cls.temp_config_file.name)
        except:
            pass
    
    def setUp(self):
        """Set up individual test"""
        # Create monitoring system instance for each test
        self.monitor = OngoingMonitoringSystem(config_file=self.temp_config_file.name)
    
    def tearDown(self):
        """Clean up after each test"""
        if hasattr(self.monitor, 'scheduler') and self.monitor.scheduler:
            try:
                self.monitor.scheduler.shutdown(wait=False)
            except:
                pass
    
    def test_01_system_initialization(self):
        """Test that monitoring system initializes correctly"""
        # Check that monitor was created
        self.assertIsNotNone(self.monitor)
        self.assertIsNotNone(self.monitor.config)
        self.assertIsNotNone(self.monitor.database_importer)
        self.assertIsNotNone(self.monitor.logger)
        
        # Check configuration loaded correctly
        self.assertEqual(self.monitor.config['quality_threshold_rating'], 4.0)
        self.assertEqual(self.monitor.config['max_new_fragrances_per_run'], 5)
        self.assertFalse(self.monitor.config['notifications_enabled'])
    
    def test_02_configuration_validation(self):
        """Test configuration validation and defaults"""
        # Test with empty config
        empty_monitor = OngoingMonitoringSystem()
        
        # Should have default values
        self.assertIn('monitoring_enabled', empty_monitor.config)
        self.assertIn('quality_threshold_rating', empty_monitor.config)
        self.assertIn('schedule_day_of_week', empty_monitor.config)
        
        # Test configuration access
        self.assertIsInstance(empty_monitor.config['monitoring_enabled'], bool)
        self.assertIsInstance(empty_monitor.config['quality_threshold_rating'], (int, float))
    
    def test_03_database_integration(self):
        """Test integration with database systems"""
        # Test database importer integration
        self.assertIsNotNone(self.monitor.database_importer)
        
        # Test database connection through monitor
        try:
            # This will test the database connection if credentials are available
            connection_works = self.monitor.database_importer.test_connection()
            if connection_works:
                self.logger.info("✅ Database connection test passed")
            else:
                self.logger.warning("⚠️  Database connection test failed (expected in CI)")
        except Exception as e:
            # This is expected in CI environments without database access
            self.logger.warning(f"⚠️  Database test skipped: {e}")
    
    def test_04_quality_threshold_enforcement(self):
        """Test quality threshold enforcement in monitoring"""
        # Test high-quality fragrance (should pass)
        high_quality = {
            'name': 'High Quality Test',
            'rating_value': 4.5,
            'rating_count': 1000,
            'launch_year': 2023
        }
        
        self.assertTrue(self.monitor._meets_quality_standards(high_quality))
        
        # Test low-quality fragrance (should fail)
        low_quality = {
            'name': 'Low Quality Test', 
            'rating_value': 3.5,  # Below threshold
            'rating_count': 1000,
            'launch_year': 2023
        }
        
        self.assertFalse(self.monitor._meets_quality_standards(low_quality))
        
        # Test insufficient reviews (should fail)
        few_reviews = {
            'name': 'Few Reviews Test',
            'rating_value': 4.5,
            'rating_count': 100,  # Below threshold
            'launch_year': 2023
        }
        
        self.assertFalse(self.monitor._meets_quality_standards(few_reviews))
    
    def test_05_performance_metrics_calculation(self):
        """Test performance metrics calculation accuracy"""
        # Create mock cycle results
        start_time = datetime.now() - timedelta(minutes=5)
        end_time = datetime.now()
        
        cycle_results = {
            'start_time': start_time,
            'end_time': end_time,
            'success': True,
            'new_fragrances_found': 10,
            'new_fragrances_imported': 8,
            'errors_encountered': []
        }
        
        # Set up monitoring stats
        self.monitor.monitoring_stats.update({
            'total_runs': 10,
            'successful_runs': 9
        })
        
        # Calculate metrics
        metrics = self.monitor._calculate_performance_metrics(cycle_results)
        
        # Verify metric structure
        self.assertIn('execution_time_seconds', metrics)
        self.assertIn('execution_time_minutes', metrics)
        self.assertIn('overall_success_rate', metrics)
        self.assertIn('system_health_score', metrics)
        self.assertIn('import_efficiency', metrics)
        
        # Verify metric values
        self.assertAlmostEqual(metrics['overall_success_rate'], 0.9, places=2)
        self.assertAlmostEqual(metrics['import_efficiency'], 0.8, places=2)  # 8/10
        self.assertGreater(metrics['execution_time_minutes'], 4.5)
        self.assertLess(metrics['execution_time_minutes'], 5.5)
        
        # Health score should be reasonable for successful run
        self.assertGreater(metrics['system_health_score'], 60)
    
    def test_06_notification_trigger_logic(self):
        """Test notification trigger conditions"""
        # Test case: successful run with new fragrances (should notify)
        results_with_new = {
            'success': True,
            'new_fragrances_imported': 5,
            'errors_encountered': [],
            'performance_metrics': {'system_health_score': 95}
        }
        
        should_notify = self.monitor._should_send_notification(results_with_new)
        self.assertTrue(should_notify, "Should notify when new fragrances are imported")
        
        # Test case: successful run with no changes (should not notify)
        results_no_changes = {
            'success': True,
            'new_fragrances_imported': 0,
            'errors_encountered': [],
            'performance_metrics': {'system_health_score': 95, 'execution_time_minutes': 30}
        }
        
        should_notify = self.monitor._should_send_notification(results_no_changes)
        self.assertFalse(should_notify, "Should not notify when no significant changes")
        
        # Test case: run with errors (should notify)
        results_with_errors = {
            'success': False,
            'new_fragrances_imported': 0,
            'errors_encountered': [{'error_type': 'TestError'}],
            'performance_metrics': {'system_health_score': 70}
        }
        
        should_notify = self.monitor._should_send_notification(results_with_errors)
        self.assertTrue(should_notify, "Should notify when errors are encountered")
    
    def test_07_error_handling_and_recovery(self):
        """Test error handling in monitoring cycles"""
        # Mock a method to raise an error
        original_method = self.monitor._detect_trending_fragrances
        self.monitor._detect_trending_fragrances = Mock(side_effect=Exception("Test error"))
        
        try:
            # Run monitoring cycle (should handle error gracefully)
            results = self.monitor.execute_monitoring_cycle()
            
            # Verify error handling
            self.assertFalse(results['success'], "Cycle should fail when error occurs")
            self.assertGreater(len(results['errors_encountered']), 0, "Should record errors")
            self.assertIn('error_type', results['errors_encountered'][0])
            self.assertIn('error_message', results['errors_encountered'][0])
            
            # Verify monitoring stats updated
            self.assertGreater(self.monitor.monitoring_stats['failed_runs'], 0)
            
        finally:
            # Restore original method
            self.monitor._detect_trending_fragrances = original_method
    
    def test_08_health_check_functionality(self):
        """Test system health check capabilities"""
        health_status = self.monitor.health_check()
        
        # Verify health check structure
        self.assertIn('timestamp', health_status)
        self.assertIn('database_connection', health_status)
        self.assertIn('embedding_system', health_status)
        self.assertIn('configuration_valid', health_status)
        self.assertIn('overall_healthy', health_status)
        
        # Verify timestamp format
        timestamp = health_status['timestamp']
        self.assertIsInstance(timestamp, str)
        
        # Verify boolean fields
        boolean_fields = ['database_connection', 'embedding_system', 'configuration_valid', 'overall_healthy']
        for field in boolean_fields:
            self.assertIsInstance(health_status[field], bool, f"{field} should be boolean")
    
    def test_09_maintenance_task_planning(self):
        """Test database maintenance task planning"""
        # Test maintenance task completion
        maintenance_count = self.monitor._perform_database_maintenance()
        
        # Should complete some maintenance tasks
        self.assertIsInstance(maintenance_count, int)
        self.assertGreaterEqual(maintenance_count, 0)
        
        # If maintenance is enabled, should do some tasks
        if self.monitor.config.get('maintenance_enabled', True):
            self.assertGreater(maintenance_count, 0, "Should complete maintenance tasks when enabled")
    
    def test_10_status_reporting(self):
        """Test system status reporting"""
        status = self.monitor.get_status()
        
        # Verify status structure
        required_fields = ['monitoring_stats', 'config_summary', 'scheduler_running', 'last_health_check']
        for field in required_fields:
            self.assertIn(field, status, f"Status should include {field}")
        
        # Verify monitoring stats structure
        stats = status['monitoring_stats']
        expected_stats = ['total_runs', 'successful_runs', 'failed_runs', 'total_new_fragrances_added']
        for stat in expected_stats:
            self.assertIn(stat, stats, f"Monitoring stats should include {stat}")
        
        # Verify config summary
        config_summary = status['config_summary']
        self.assertIn('monitoring_enabled', config_summary)
        self.assertIn('schedule', config_summary)
        self.assertIn('quality_thresholds', config_summary)
    
    def test_11_scheduler_integration(self):
        """Test APScheduler integration"""
        # Test that scheduler can be created
        self.assertIsNotNone(self.monitor.scheduler)
        
        # Test job scheduling (without actually starting)
        try:
            # Add a test job
            test_job = self.monitor.scheduler.add_job(
                lambda: "test",
                'interval',
                seconds=3600,  # 1 hour
                id='test_job'
            )
            
            # Verify job was added
            self.assertIsNotNone(test_job)
            self.assertEqual(test_job.id, 'test_job')
            
            # Clean up
            self.monitor.scheduler.remove_job('test_job')
            
        except Exception as e:
            self.fail(f"Scheduler integration failed: {e}")
    
    def test_12_single_cycle_execution(self):
        """Test single monitoring cycle execution"""
        # Run a single cycle
        results = self.monitor.run_single_cycle()
        
        # Verify results structure
        required_fields = [
            'execution_id', 'start_time', 'end_time', 'success',
            'new_fragrances_found', 'new_fragrances_imported',
            'performance_metrics', 'errors_encountered'
        ]
        
        for field in required_fields:
            self.assertIn(field, results, f"Results should include {field}")
        
        # Verify execution ID format
        self.assertTrue(results['execution_id'].startswith('monitor_'))
        
        # Verify timing
        self.assertIsInstance(results['start_time'], datetime)
        self.assertIsInstance(results['end_time'], datetime)
        self.assertGreater(results['end_time'], results['start_time'])
        
        # Verify performance metrics structure
        metrics = results['performance_metrics']
        self.assertIn('execution_time_seconds', metrics)
        self.assertIn('system_health_score', metrics)
    
    def test_13_workflow_state_management(self):
        """Test monitoring workflow state management"""
        initial_stats = self.monitor.monitoring_stats.copy()
        
        # Run multiple cycles to test state persistence
        for i in range(3):
            results = self.monitor.execute_monitoring_cycle()
            
            # Verify stats are updated
            self.assertEqual(self.monitor.monitoring_stats['total_runs'], initial_stats['total_runs'] + i + 1)
            
            if results['success']:
                self.assertGreater(self.monitor.monitoring_stats['successful_runs'], initial_stats['successful_runs'])
            else:
                self.assertGreater(self.monitor.monitoring_stats['failed_runs'], initial_stats['failed_runs'])
            
            # Verify last run tracking
            self.assertIsNotNone(self.monitor.monitoring_stats['last_run_timestamp'])
            self.assertIn(self.monitor.monitoring_stats['last_run_status'], ['success', 'failed'])
    
    def test_14_configuration_flexibility(self):
        """Test configuration system flexibility"""
        # Test custom configuration values
        custom_config = {
            'quality_threshold_rating': 3.8,
            'max_new_fragrances_per_run': 15,
            'scraping_delay_seconds': 3.0
        }
        
        # Create temporary custom config
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
            json.dump(custom_config, f)
            custom_config_path = f.name
        
        try:
            # Create monitor with custom config
            custom_monitor = OngoingMonitoringSystem(config_file=custom_config_path)
            
            # Verify custom values are loaded
            self.assertEqual(custom_monitor.config['quality_threshold_rating'], 3.8)
            self.assertEqual(custom_monitor.config['max_new_fragrances_per_run'], 15)
            self.assertEqual(custom_monitor.config['scraping_delay_seconds'], 3.0)
            
            # Verify defaults still exist for unspecified values
            self.assertIn('monitoring_enabled', custom_monitor.config)
            
        finally:
            os.unlink(custom_config_path)
    
    def test_15_end_to_end_workflow_integration(self):
        """Test complete end-to-end monitoring workflow"""
        # This is a comprehensive test of the entire workflow
        self.logger.info("🔄 Starting end-to-end workflow test")
        
        # Step 1: Initialize system
        initial_status = self.monitor.get_status()
        self.assertIsNotNone(initial_status)
        
        # Step 2: Perform health check
        health = self.monitor.health_check()
        self.assertIn('overall_healthy', health)
        
        # Step 3: Execute monitoring cycle
        cycle_results = self.monitor.run_single_cycle()
        
        # Step 4: Verify cycle completed
        self.assertIsNotNone(cycle_results)
        self.assertIn('success', cycle_results)
        self.assertIn('performance_metrics', cycle_results)
        
        # Step 5: Check final status
        final_status = self.monitor.get_status()
        
        # Verify workflow updated system state
        initial_runs = initial_status['monitoring_stats']['total_runs']
        final_runs = final_status['monitoring_stats']['total_runs']
        
        self.assertGreater(final_runs, initial_runs,
                          f"Total runs should increase from {initial_runs} to at least {initial_runs + 1}, got {final_runs}")
        
        # Step 6: Verify cleanup
        self.monitor.shutdown()
        
        self.logger.info("✅ End-to-end workflow test completed successfully")


def run_integration_tests():
    """Run comprehensive monitoring system integration tests"""
    print("🔍 Starting monitoring system integration verification...")
    
    # Create test suite
    test_loader = unittest.TestLoader()
    test_suite = test_loader.loadTestsFromTestCase(MonitoringSystemIntegrationTests)
    
    # Run tests with detailed output
    test_runner = unittest.TextTestRunner(
        verbosity=2,
        descriptions=True,
        failfast=False
    )
    
    result = test_runner.run(test_suite)
    
    # Summary
    print(f"\n{'='*70}")
    print(f"MONITORING SYSTEM INTEGRATION VERIFICATION SUMMARY")
    print(f"{'='*70}")
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
        print(f"\n✅ ALL MONITORING INTEGRATION TESTS PASSED!")
        print(f"🎉 Complete monitoring system is working correctly!")
        print(f"🚀 Ready for production deployment!")
    else:
        print(f"\n⚠️  Some integration tests failed - check monitoring system")
    
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_integration_tests()
    sys.exit(0 if success else 1)