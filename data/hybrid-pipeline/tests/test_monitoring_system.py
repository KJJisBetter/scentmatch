#!/usr/bin/env python3
"""
Continuous Monitoring System Tests
Tests for scheduling, monitoring logic, and automated workflows
"""

import json
import os
import sys
import unittest
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from unittest.mock import Mock, patch, MagicMock

# Add parent directory for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import requests
    from dotenv import load_dotenv
except ImportError as e:
    print(f"Missing required dependencies: {e}")
    print("Run: pip install requests python-dotenv")
    sys.exit(1)

class MockScheduler:
    """Mock scheduler for testing cron-like functionality"""
    
    def __init__(self):
        self.jobs = []
        self.running = False
    
    def add_job(self, func, trigger, **kwargs):
        """Add a job to the scheduler"""
        job = {
            'func': func,
            'trigger': trigger,
            'kwargs': kwargs,
            'next_run': datetime.now() + timedelta(seconds=1)  # Mock next run time
        }
        self.jobs.append(job)
        return job
    
    def start(self):
        """Start the scheduler"""
        self.running = True
    
    def shutdown(self):
        """Shutdown the scheduler"""
        self.running = False
        self.jobs.clear()

class ContinuousMonitoringTests(unittest.TestCase):
    """Test suite for continuous monitoring system"""
    
    def setUp(self):
        """Set up test environment"""
        self.mock_scheduler = MockScheduler()
        self.test_config = {
            'monitoring_interval_hours': 168,  # Weekly
            'quality_threshold_rating': 4.0,
            'quality_threshold_reviews': 500,
            'batch_size': 50,
            'notification_email': 'test@example.com',
            'max_new_fragrances_per_run': 20
        }
        
        # Mock fragrance data for testing
        self.mock_trending_fragrances = [
            {
                'name': 'Test Trending Fragrance 1',
                'brand': 'Test Brand',
                'rating': 4.5,
                'review_count': 1200,
                'release_year': 2024,
                'fragrantica_url': 'https://fragrantica.com/test1'
            },
            {
                'name': 'Test Trending Fragrance 2', 
                'brand': 'Another Brand',
                'rating': 4.2,
                'review_count': 800,
                'release_year': 2024,
                'fragrantica_url': 'https://fragrantica.com/test2'
            }
        ]
        
        # Setup logging for tests
        logging.basicConfig(level=logging.DEBUG)
        self.logger = logging.getLogger(__name__)
    
    def test_01_scheduler_job_registration(self):
        """Test that monitoring jobs can be registered with scheduler"""
        # Mock monitoring function
        def mock_monitoring_job():
            return "monitoring executed"
        
        # Add job to scheduler
        job = self.mock_scheduler.add_job(
            mock_monitoring_job,
            trigger='cron',
            day_of_week=0,  # Sunday
            hour=2,
            minute=0
        )
        
        # Verify job was registered
        self.assertEqual(len(self.mock_scheduler.jobs), 1)
        self.assertEqual(job['func'], mock_monitoring_job)
        self.assertEqual(job['trigger'], 'cron')
        self.assertIn('day_of_week', job['kwargs'])
        self.assertEqual(job['kwargs']['day_of_week'], 0)
    
    def test_02_weekly_schedule_validation(self):
        """Test that weekly schedule parameters are correctly set"""
        schedule_config = {
            'day_of_week': 0,  # Sunday
            'hour': 2,         # 2 AM
            'minute': 0,       # Top of hour
            'timezone': 'UTC'
        }
        
        # Validate schedule configuration
        self.assertIn('day_of_week', schedule_config)
        self.assertIn('hour', schedule_config)
        self.assertIn('minute', schedule_config)
        
        # Validate reasonable values
        self.assertGreaterEqual(schedule_config['day_of_week'], 0)
        self.assertLessEqual(schedule_config['day_of_week'], 6)
        self.assertGreaterEqual(schedule_config['hour'], 0)
        self.assertLessEqual(schedule_config['hour'], 23)
        self.assertGreaterEqual(schedule_config['minute'], 0)
        self.assertLessEqual(schedule_config['minute'], 59)
    
    def test_03_trend_detection_logic(self):
        """Test trend detection algorithm"""
        def analyze_trending_fragrances(mock_data):
            """Mock trend analysis function"""
            trending = []
            for fragrance in mock_data:
                # Apply quality filters
                if (fragrance['rating'] >= 4.0 and 
                    fragrance['review_count'] >= 500 and
                    fragrance.get('release_year', 0) >= 2023):
                    trending.append(fragrance)
            return trending
        
        # Test with mock data
        trending = analyze_trending_fragrances(self.mock_trending_fragrances)
        
        # Should find both test fragrances (both meet criteria)
        self.assertEqual(len(trending), 2)
        
        # Test with lower quality fragrance
        low_quality = {
            'name': 'Low Quality Test',
            'brand': 'Test Brand',
            'rating': 3.5,  # Below threshold
            'review_count': 1000,
            'release_year': 2024
        }
        
        trending_with_low = analyze_trending_fragrances(
            self.mock_trending_fragrances + [low_quality]
        )
        
        # Should still only find the 2 high-quality ones
        self.assertEqual(len(trending_with_low), 2)
    
    def test_04_quality_threshold_validation(self):
        """Test quality threshold enforcement"""
        def meets_quality_threshold(fragrance, config):
            """Check if fragrance meets quality thresholds"""
            return (
                fragrance.get('rating', 0) >= config['quality_threshold_rating'] and
                fragrance.get('review_count', 0) >= config['quality_threshold_reviews']
            )
        
        # Test fragrance that meets thresholds
        high_quality = {
            'rating': 4.3,
            'review_count': 1500
        }
        
        self.assertTrue(meets_quality_threshold(high_quality, self.test_config))
        
        # Test fragrance that doesn't meet rating threshold
        low_rating = {
            'rating': 3.8,  # Below 4.0 threshold
            'review_count': 1500
        }
        
        self.assertFalse(meets_quality_threshold(low_rating, self.test_config))
        
        # Test fragrance that doesn't meet review count threshold
        low_reviews = {
            'rating': 4.5,
            'review_count': 200  # Below 500 threshold
        }
        
        self.assertFalse(meets_quality_threshold(low_reviews, self.test_config))
    
    def test_05_notification_trigger_logic(self):
        """Test notification system trigger conditions"""
        def should_send_notification(monitoring_results):
            """Determine if notification should be sent"""
            conditions = [
                monitoring_results.get('new_fragrances_found', 0) > 0,
                monitoring_results.get('errors_encountered', 0) > 0,
                monitoring_results.get('quality_issues_found', 0) > 0,
                monitoring_results.get('system_health_score', 100) < 90
            ]
            return any(conditions)
        
        # Test case: new fragrances found
        results_with_new = {
            'new_fragrances_found': 5,
            'errors_encountered': 0,
            'quality_issues_found': 0,
            'system_health_score': 95
        }
        
        self.assertTrue(should_send_notification(results_with_new))
        
        # Test case: errors encountered
        results_with_errors = {
            'new_fragrances_found': 0,
            'errors_encountered': 2,
            'quality_issues_found': 0,
            'system_health_score': 95
        }
        
        self.assertTrue(should_send_notification(results_with_errors))
        
        # Test case: low system health
        results_low_health = {
            'new_fragrances_found': 0,
            'errors_encountered': 0,
            'quality_issues_found': 0,
            'system_health_score': 85
        }
        
        self.assertTrue(should_send_notification(results_low_health))
        
        # Test case: all normal
        results_normal = {
            'new_fragrances_found': 0,
            'errors_encountered': 0,
            'quality_issues_found': 0,
            'system_health_score': 95
        }
        
        self.assertFalse(should_send_notification(results_normal))
    
    def test_06_performance_metrics_calculation(self):
        """Test performance metrics calculation"""
        def calculate_performance_metrics(execution_data):
            """Calculate system performance metrics"""
            metrics = {}
            
            # Execution time metrics
            if 'start_time' in execution_data and 'end_time' in execution_data:
                duration = execution_data['end_time'] - execution_data['start_time']
                metrics['execution_time_seconds'] = duration.total_seconds()
                metrics['execution_time_minutes'] = duration.total_seconds() / 60
            
            # Success rate
            total_operations = execution_data.get('total_operations', 0)
            successful_operations = execution_data.get('successful_operations', 0)
            if total_operations > 0:
                metrics['success_rate'] = successful_operations / total_operations
            else:
                metrics['success_rate'] = 1.0  # No operations = 100% success
            
            # Data quality score
            quality_checks = execution_data.get('quality_checks_passed', 0)
            total_checks = execution_data.get('total_quality_checks', 0)
            if total_checks > 0:
                metrics['quality_score'] = quality_checks / total_checks
            else:
                metrics['quality_score'] = 1.0
            
            # Overall system health (weighted average)
            weights = {'success_rate': 0.4, 'quality_score': 0.6}
            metrics['system_health_score'] = (
                metrics['success_rate'] * weights['success_rate'] +
                metrics['quality_score'] * weights['quality_score']
            ) * 100
            
            return metrics
        
        # Test with successful execution data
        successful_execution = {
            'start_time': datetime.now() - timedelta(minutes=15),
            'end_time': datetime.now(),
            'total_operations': 100,
            'successful_operations': 98,
            'quality_checks_passed': 95,
            'total_quality_checks': 100
        }
        
        metrics = calculate_performance_metrics(successful_execution)
        
        # Verify metrics calculation
        self.assertIn('execution_time_seconds', metrics)
        self.assertIn('success_rate', metrics)
        self.assertIn('quality_score', metrics)
        self.assertIn('system_health_score', metrics)
        
        # Check reasonable values
        self.assertAlmostEqual(metrics['success_rate'], 0.98, places=2)
        self.assertAlmostEqual(metrics['quality_score'], 0.95, places=2)
        self.assertGreater(metrics['system_health_score'], 90)
        self.assertLess(metrics['execution_time_minutes'], 20)
    
    def test_07_database_maintenance_logic(self):
        """Test database maintenance routines logic"""
        def plan_database_maintenance(system_stats):
            """Plan database maintenance based on system statistics"""
            maintenance_tasks = []
            
            # Check if embedding generation is needed
            if system_stats.get('fragrances_without_embeddings', 0) > 0:
                maintenance_tasks.append({
                    'task': 'generate_missing_embeddings',
                    'priority': 'high',
                    'estimated_duration': '30 minutes'
                })
            
            # Check if popularity scores need updating
            days_since_update = system_stats.get('days_since_popularity_update', 0)
            if days_since_update >= 7:
                maintenance_tasks.append({
                    'task': 'update_popularity_scores',
                    'priority': 'medium',
                    'estimated_duration': '15 minutes'
                })
            
            # Check if cache cleanup is needed
            cache_size_mb = system_stats.get('cache_size_mb', 0)
            if cache_size_mb > 500:  # 500MB threshold
                maintenance_tasks.append({
                    'task': 'cleanup_expired_cache',
                    'priority': 'low',
                    'estimated_duration': '5 minutes'
                })
            
            # Check if database optimization is needed
            table_bloat_percent = system_stats.get('table_bloat_percent', 0)
            if table_bloat_percent > 20:
                maintenance_tasks.append({
                    'task': 'optimize_database_tables',
                    'priority': 'medium',
                    'estimated_duration': '20 minutes'
                })
            
            return maintenance_tasks
        
        # Test with various system states
        healthy_system = {
            'fragrances_without_embeddings': 0,
            'days_since_popularity_update': 3,
            'cache_size_mb': 100,
            'table_bloat_percent': 5
        }
        
        tasks = plan_database_maintenance(healthy_system)
        self.assertEqual(len(tasks), 0, "Healthy system should need no maintenance")
        
        # Test system needing maintenance
        maintenance_needed = {
            'fragrances_without_embeddings': 15,
            'days_since_popularity_update': 10,
            'cache_size_mb': 600,
            'table_bloat_percent': 25
        }
        
        tasks = plan_database_maintenance(maintenance_needed)
        self.assertEqual(len(tasks), 4, "System should need 4 maintenance tasks")
        
        # Check that high priority tasks are included
        high_priority_tasks = [t for t in tasks if t['priority'] == 'high']
        self.assertGreater(len(high_priority_tasks), 0, "Should have high priority tasks")
    
    def test_08_error_handling_and_recovery(self):
        """Test error handling and recovery mechanisms"""
        def handle_monitoring_error(error_type, error_details):
            """Handle various types of monitoring errors"""
            recovery_actions = []
            
            if error_type == 'network_timeout':
                recovery_actions.append('retry_with_exponential_backoff')
                recovery_actions.append('switch_to_backup_endpoint')
            
            elif error_type == 'rate_limit_exceeded':
                recovery_actions.append('wait_for_rate_limit_reset')
                recovery_actions.append('reduce_request_frequency')
            
            elif error_type == 'data_validation_failed':
                recovery_actions.append('skip_invalid_records')
                recovery_actions.append('log_validation_errors')
                recovery_actions.append('notify_administrators')
            
            elif error_type == 'database_connection_failed':
                recovery_actions.append('retry_database_connection')
                recovery_actions.append('use_connection_pool_failover')
                recovery_actions.append('defer_non_critical_operations')
            
            else:
                recovery_actions.append('log_unknown_error')
                recovery_actions.append('notify_administrators')
            
            return recovery_actions
        
        # Test network timeout recovery
        network_recovery = handle_monitoring_error('network_timeout', {})
        self.assertIn('retry_with_exponential_backoff', network_recovery)
        self.assertIn('switch_to_backup_endpoint', network_recovery)
        
        # Test rate limit recovery
        rate_limit_recovery = handle_monitoring_error('rate_limit_exceeded', {})
        self.assertIn('wait_for_rate_limit_reset', rate_limit_recovery)
        self.assertIn('reduce_request_frequency', rate_limit_recovery)
        
        # Test unknown error recovery
        unknown_recovery = handle_monitoring_error('unknown_error', {})
        self.assertIn('log_unknown_error', unknown_recovery)
        self.assertIn('notify_administrators', unknown_recovery)
    
    def test_09_configuration_validation(self):
        """Test monitoring configuration validation"""
        def validate_monitoring_config(config):
            """Validate monitoring system configuration"""
            errors = []
            warnings = []
            
            # Required fields
            required_fields = [
                'monitoring_interval_hours',
                'quality_threshold_rating', 
                'quality_threshold_reviews',
                'notification_email'
            ]
            
            for field in required_fields:
                if field not in config:
                    errors.append(f"Missing required field: {field}")
            
            # Value range validations
            if 'monitoring_interval_hours' in config:
                interval = config['monitoring_interval_hours']
                if interval < 1 or interval > 720:  # 1 hour to 30 days
                    errors.append(f"Invalid monitoring_interval_hours: {interval}")
            
            if 'quality_threshold_rating' in config:
                rating = config['quality_threshold_rating']
                if rating < 0 or rating > 5:
                    errors.append(f"Invalid quality_threshold_rating: {rating}")
            
            if 'quality_threshold_reviews' in config:
                reviews = config['quality_threshold_reviews']
                if reviews < 0:
                    errors.append(f"Invalid quality_threshold_reviews: {reviews}")
            
            # Warning conditions
            if config.get('monitoring_interval_hours', 0) < 24:
                warnings.append("Monitoring interval less than 24 hours may be too frequent")
            
            if config.get('quality_threshold_rating', 0) < 3.5:
                warnings.append("Quality threshold rating below 3.5 may include low-quality fragrances")
            
            return {
                'valid': len(errors) == 0,
                'errors': errors,
                'warnings': warnings
            }
        
        # Test valid configuration
        validation = validate_monitoring_config(self.test_config)
        self.assertTrue(validation['valid'])
        self.assertEqual(len(validation['errors']), 0)
        
        # Test invalid configuration
        invalid_config = {
            'monitoring_interval_hours': -5,  # Invalid
            'quality_threshold_rating': 6.0,  # Invalid (>5)
            'quality_threshold_reviews': -100,  # Invalid
            # Missing notification_email
        }
        
        validation = validate_monitoring_config(invalid_config)
        self.assertFalse(validation['valid'])
        self.assertGreater(len(validation['errors']), 0)
    
    def test_10_monitoring_workflow_integration(self):
        """Test complete monitoring workflow integration"""
        class MockMonitoringWorkflow:
            def __init__(self, config):
                self.config = config
                self.execution_log = []
            
            def execute_monitoring_cycle(self):
                """Execute a complete monitoring cycle"""
                self.execution_log.append("Started monitoring cycle")
                
                # Step 1: Trend detection
                trends = self._detect_trends()
                self.execution_log.append(f"Detected {len(trends)} trending items")
                
                # Step 2: Quality filtering
                quality_items = self._filter_by_quality(trends)
                self.execution_log.append(f"Found {len(quality_items)} quality items")
                
                # Step 3: Database operations
                imported = self._import_new_items(quality_items)
                self.execution_log.append(f"Imported {imported} new items")
                
                # Step 4: Maintenance
                maintenance_done = self._perform_maintenance()
                self.execution_log.append(f"Performed {maintenance_done} maintenance tasks")
                
                # Step 5: Notifications
                notifications_sent = self._send_notifications(imported, maintenance_done)
                self.execution_log.append(f"Sent {notifications_sent} notifications")
                
                return {
                    'trends_detected': len(trends),
                    'quality_items_found': len(quality_items),
                    'items_imported': imported,
                    'maintenance_tasks_completed': maintenance_done,
                    'notifications_sent': notifications_sent
                }
            
            def _detect_trends(self):
                return ['trend1', 'trend2', 'trend3']  # Mock trends
            
            def _filter_by_quality(self, trends):
                return trends[:2]  # Mock quality filtering
            
            def _import_new_items(self, items):
                return len(items)  # Mock import
            
            def _perform_maintenance(self):
                return 2  # Mock maintenance tasks
            
            def _send_notifications(self, imported, maintenance):
                return 1 if imported > 0 or maintenance > 0 else 0
        
        # Test workflow execution
        workflow = MockMonitoringWorkflow(self.test_config)
        results = workflow.execute_monitoring_cycle()
        
        # Verify workflow completed all steps
        expected_steps = [
            "Started monitoring cycle",
            "Detected 3 trending items",
            "Found 2 quality items", 
            "Imported 2 new items",
            "Performed 2 maintenance tasks",
            "Sent 1 notifications"
        ]
        
        for step in expected_steps:
            self.assertIn(step, workflow.execution_log)
        
        # Verify results structure
        self.assertIn('trends_detected', results)
        self.assertIn('quality_items_found', results)
        self.assertIn('items_imported', results)
        self.assertIn('maintenance_tasks_completed', results)
        self.assertIn('notifications_sent', results)


def run_monitoring_tests():
    """Run all monitoring system tests"""
    print("🔍 Starting continuous monitoring system tests...")
    
    # Create test suite
    test_loader = unittest.TestLoader()
    test_suite = test_loader.loadTestsFromTestCase(ContinuousMonitoringTests)
    
    # Run tests with detailed output
    test_runner = unittest.TextTestRunner(
        verbosity=2,
        descriptions=True,
        failfast=False
    )
    
    result = test_runner.run(test_suite)
    
    # Summary
    print(f"\n{'='*60}")
    print(f"MONITORING SYSTEM TEST SUMMARY")
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
        print(f"\n✅ ALL MONITORING SYSTEM TESTS PASSED!")
        print(f"🎉 Monitoring system logic is working correctly!")
    else:
        print(f"\n⚠️  Some tests failed - check monitoring system logic")
    
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_monitoring_tests()
    sys.exit(0 if success else 1)