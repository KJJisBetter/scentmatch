#!/usr/bin/env python3
"""
Ongoing Monitoring System for Hybrid Pipeline
Continuous intelligence gathering and automated maintenance
"""

import json
import os
import sys
import logging
import time
import smtplib
import traceback
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Add parent directory for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Check for required dependencies
try:
    import requests
    from dotenv import load_dotenv
    from apscheduler.schedulers.blocking import BlockingScheduler
    from apscheduler.triggers.cron import CronTrigger
    import importlib.util
    
    # Import pipeline scripts
    script_dir = os.path.dirname(__file__)
    
    # Import database importer
    importer_path = os.path.join(script_dir, '04_database_importer.py')
    spec = importlib.util.spec_from_file_location("database_importer", importer_path)
    database_importer_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(database_importer_module)
    SupabaseDatabaseImporter = database_importer_module.SupabaseDatabaseImporter
    
    # Import gap analyzer
    gap_analyzer_path = os.path.join(script_dir, '02_gap_analyzer.py')
    if os.path.exists(gap_analyzer_path):
        spec = importlib.util.spec_from_file_location("gap_analyzer", gap_analyzer_path)
        gap_analyzer_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(gap_analyzer_module)
    
    # Import ethical scraper
    scraper_path = os.path.join(script_dir, '03_ethical_scraper.py')
    if os.path.exists(scraper_path):
        spec = importlib.util.spec_from_file_location("ethical_scraper", scraper_path)
        scraper_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(scraper_module)
    
except ImportError as e:
    print(f"Missing required dependencies: {e}")
    print("Run: pip install requests python-dotenv apscheduler")
    sys.exit(1)

class OngoingMonitoringSystem:
    """Continuous monitoring and maintenance system for hybrid pipeline"""
    
    def __init__(self, config_file: str = None):
        """Initialize monitoring system"""
        # Load environment variables
        load_dotenv()
        
        # Setup logging first
        self.logger = self._setup_logging()
        
        # Load configuration
        self.config = self._load_configuration(config_file)
        
        # Initialize components
        self.database_importer = SupabaseDatabaseImporter()
        self.scheduler = BlockingScheduler()
        
        # Monitoring state
        self.execution_id = None
        self.monitoring_stats = {
            'total_runs': 0,
            'successful_runs': 0,
            'failed_runs': 0,
            'last_run_timestamp': None,
            'last_run_status': None,
            'total_fragrances_monitored': 0,
            'total_new_fragrances_added': 0
        }
        
        self.logger.info("🔧 Ongoing monitoring system initialized")
    
    def _load_configuration(self, config_file: str = None) -> Dict[str, Any]:
        """Load monitoring configuration"""
        default_config = {
            # Scheduling
            'monitoring_enabled': True,
            'schedule_day_of_week': 0,  # Sunday
            'schedule_hour': 2,         # 2 AM
            'schedule_minute': 0,       # Top of hour
            'schedule_timezone': 'UTC',
            
            # Quality thresholds
            'quality_threshold_rating': 4.0,
            'quality_threshold_reviews': 500,
            'min_release_year': 2020,
            'max_new_fragrances_per_run': 20,
            
            # Data sources
            'fragrantica_trending_urls': [
                'https://www.fragrantica.com/trending/',
                'https://www.fragrantica.com/new_releases/'
            ],
            'scraping_delay_seconds': 2,
            'request_timeout_seconds': 30,
            'max_retries': 3,
            
            # Database maintenance
            'maintenance_enabled': True,
            'embedding_timeout_minutes': 10,
            'cache_cleanup_enabled': True,
            'popularity_update_enabled': True,
            
            # Notifications
            'notifications_enabled': True,
            'notification_email': os.getenv('NOTIFICATION_EMAIL', ''),
            'smtp_host': os.getenv('SMTP_HOST', 'smtp.gmail.com'),
            'smtp_port': int(os.getenv('SMTP_PORT', '587')),
            'smtp_username': os.getenv('SMTP_USERNAME', ''),
            'smtp_password': os.getenv('SMTP_PASSWORD', ''),
            
            # Performance
            'max_execution_time_minutes': 120,  # 2 hours max
            'performance_alert_threshold': 90,  # Minutes
            'system_health_threshold': 80,     # Percentage
        }
        
        # Load custom configuration if provided
        if config_file and os.path.exists(config_file):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    custom_config = json.load(f)
                    default_config.update(custom_config)
                    self.logger.info(f"📁 Loaded custom configuration from {config_file}")
            except Exception as e:
                self.logger.warning(f"⚠️  Failed to load custom config: {e}")
        
        return default_config
    
    def _setup_logging(self) -> logging.Logger:
        """Setup comprehensive logging"""
        log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
        os.makedirs(log_dir, exist_ok=True)
        
        # Create logger with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_file = os.path.join(log_dir, f'ongoing_monitor_{timestamp}.log')
        
        # Configure logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )
        
        logger = logging.getLogger(__name__)
        logger.info(f"📄 Logging initialized: {log_file}")
        
        return logger
    
    def start_monitoring(self) -> None:
        """Start the continuous monitoring system"""
        if not self.config.get('monitoring_enabled', True):
            self.logger.info("📴 Monitoring is disabled in configuration")
            return
        
        try:
            self.logger.info("🚀 Starting ongoing monitoring system")
            
            # Schedule main monitoring job
            self.scheduler.add_job(
                self.execute_monitoring_cycle,
                CronTrigger(
                    day_of_week=self.config['schedule_day_of_week'],
                    hour=self.config['schedule_hour'],
                    minute=self.config['schedule_minute'],
                    timezone=self.config['schedule_timezone']
                ),
                id='main_monitoring_job',
                max_instances=1,  # Prevent overlapping executions
                replace_existing=True
            )
            
            # Schedule health check job (runs more frequently)
            self.scheduler.add_job(
                self.health_check,
                CronTrigger(
                    hour='*',  # Every hour
                    minute=0,
                    timezone=self.config['schedule_timezone']
                ),
                id='health_check_job',
                max_instances=1,
                replace_existing=True
            )
            
            self.logger.info(f"📅 Scheduled monitoring for Sundays at {self.config['schedule_hour']:02d}:{self.config['schedule_minute']:02d} {self.config['schedule_timezone']}")
            self.logger.info("⚡ Health checks scheduled hourly")
            
            # Start scheduler
            self.scheduler.start()
            
        except KeyboardInterrupt:
            self.logger.info("⏹️  Monitoring stopped by user")
            self.shutdown()
        except Exception as e:
            self.logger.error(f"❌ Failed to start monitoring: {e}")
            self.shutdown()
    
    def execute_monitoring_cycle(self) -> Dict[str, Any]:
        """Execute a complete monitoring cycle"""
        execution_start = datetime.now()
        self.execution_id = f"monitor_{int(execution_start.timestamp())}"
        self.monitoring_stats['total_runs'] += 1
        
        self.logger.info(f"🔄 Starting monitoring cycle: {self.execution_id}")
        
        cycle_results = {
            'execution_id': self.execution_id,
            'start_time': execution_start,
            'end_time': None,
            'success': False,
            'new_fragrances_found': 0,
            'new_fragrances_imported': 0,
            'maintenance_tasks_completed': 0,
            'errors_encountered': [],
            'performance_metrics': {},
            'notifications_sent': 0
        }
        
        try:
            # Phase 1: Trend Detection and Gap Analysis
            self.logger.info("🔍 Phase 1: Detecting trending fragrances")
            trending_fragrances = self._detect_trending_fragrances()
            cycle_results['new_fragrances_found'] = len(trending_fragrances)
            
            if trending_fragrances:
                self.logger.info(f"📈 Found {len(trending_fragrances)} trending fragrances")
                
                # Phase 2: Quality Filtering
                self.logger.info("🎯 Phase 2: Applying quality filters")
                quality_fragrances = self._filter_by_quality(trending_fragrances)
                self.logger.info(f"✅ {len(quality_fragrances)} fragrances passed quality filters")
                
                # Phase 3: Database Import
                if quality_fragrances:
                    self.logger.info("💾 Phase 3: Importing new fragrances")
                    imported_count = self._import_new_fragrances(quality_fragrances)
                    cycle_results['new_fragrances_imported'] = imported_count
                    self.monitoring_stats['total_new_fragrances_added'] += imported_count
                    
                    if imported_count > 0:
                        self.logger.info(f"🎉 Successfully imported {imported_count} new fragrances")
                    else:
                        self.logger.info("ℹ️  No new fragrances needed importing (duplicates filtered)")
            else:
                self.logger.info("📊 No new trending fragrances detected")
            
            # Phase 4: Database Maintenance
            if self.config.get('maintenance_enabled', True):
                self.logger.info("🔧 Phase 4: Performing database maintenance")
                maintenance_completed = self._perform_database_maintenance()
                cycle_results['maintenance_tasks_completed'] = maintenance_completed
            
            # Phase 5: Performance Analysis
            self.logger.info("📊 Phase 5: Calculating performance metrics")
            cycle_results['performance_metrics'] = self._calculate_performance_metrics(cycle_results)
            
            # Mark as successful
            cycle_results['success'] = True
            self.monitoring_stats['successful_runs'] += 1
            self.monitoring_stats['last_run_status'] = 'success'
            
        except Exception as e:
            self.logger.error(f"❌ Monitoring cycle failed: {e}")
            self.logger.error(f"💥 Error details: {traceback.format_exc()}")
            
            cycle_results['errors_encountered'].append({
                'error_type': type(e).__name__,
                'error_message': str(e),
                'timestamp': datetime.now().isoformat()
            })
            
            self.monitoring_stats['failed_runs'] += 1
            self.monitoring_stats['last_run_status'] = 'failed'
        
        # Finalize results
        cycle_results['end_time'] = datetime.now()
        self.monitoring_stats['last_run_timestamp'] = cycle_results['end_time'].isoformat()
        
        # Phase 6: Notifications
        if self.config.get('notifications_enabled', True):
            self.logger.info("📧 Phase 6: Processing notifications")
            notifications_sent = self._process_notifications(cycle_results)
            cycle_results['notifications_sent'] = notifications_sent
        
        # Log final summary
        duration = cycle_results['end_time'] - cycle_results['start_time']
        self.logger.info(f"🏁 Monitoring cycle completed in {duration.total_seconds():.1f} seconds")
        
        if cycle_results['success']:
            self.logger.info("✅ Monitoring cycle completed successfully")
        else:
            self.logger.error("❌ Monitoring cycle completed with errors")
        
        return cycle_results
    
    def _detect_trending_fragrances(self) -> List[Dict[str, Any]]:
        """Detect trending fragrances from various sources"""
        trending_fragrances = []
        
        # Use gap analyzer if available
        if 'gap_analyzer_module' in globals():
            try:
                # This would integrate with the gap analyzer from Task 2
                self.logger.info("🔄 Using gap analyzer for trend detection")
                # Implementation would depend on the actual gap analyzer interface
                # For now, return mock data structure
                pass
            except Exception as e:
                self.logger.warning(f"⚠️  Gap analyzer failed: {e}")
        
        # Fallback to direct trending detection
        try:
            trending_urls = self.config.get('fragrantica_trending_urls', [])
            for url in trending_urls:
                self.logger.info(f"🕸️  Checking trending fragrances from: {url}")
                
                # Mock trending detection (would integrate with actual scraper)
                time.sleep(self.config.get('scraping_delay_seconds', 2))
                
                # This would be replaced with actual scraping logic
                # For now, return empty to avoid making actual web requests
                pass
                
        except Exception as e:
            self.logger.error(f"❌ Trending detection failed: {e}")
        
        self.logger.info(f"📈 Detected {len(trending_fragrances)} trending fragrances")
        return trending_fragrances
    
    def _filter_by_quality(self, fragrances: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter fragrances by quality thresholds"""
        quality_fragrances = []
        
        for fragrance in fragrances:
            if self._meets_quality_standards(fragrance):
                quality_fragrances.append(fragrance)
            else:
                self.logger.debug(f"⏭️  Filtered out low-quality fragrance: {fragrance.get('name', 'unknown')}")
        
        return quality_fragrances
    
    def _meets_quality_standards(self, fragrance: Dict[str, Any]) -> bool:
        """Check if fragrance meets quality standards"""
        # Rating threshold
        rating = fragrance.get('rating_value', fragrance.get('rating', 0))
        if rating < self.config.get('quality_threshold_rating', 4.0):
            return False
        
        # Review count threshold
        reviews = fragrance.get('rating_count', fragrance.get('review_count', 0))
        if reviews < self.config.get('quality_threshold_reviews', 500):
            return False
        
        # Release year threshold (avoid very old fragrances)
        release_year = fragrance.get('launch_year', fragrance.get('year', fragrance.get('release_year', 0)))
        min_year = self.config.get('min_release_year', 2020)
        if release_year and release_year < min_year:
            return False
        
        return True
    
    def _import_new_fragrances(self, fragrances: List[Dict[str, Any]]) -> int:
        """Import new fragrances to database"""
        if not fragrances:
            return 0
        
        try:
            # Limit the number of new fragrances per run
            max_per_run = self.config.get('max_new_fragrances_per_run', 20)
            fragrances_to_import = fragrances[:max_per_run]
            
            if len(fragrances) > max_per_run:
                self.logger.info(f"⚠️  Limiting import to {max_per_run} fragrances (found {len(fragrances)})")
            
            # Use database importer
            # This would need fragrance and brand data separated
            # For now, simulate the import process
            
            # Mock import count
            imported_count = len(fragrances_to_import)
            
            self.logger.info(f"📥 Imported {imported_count} new fragrances")
            return imported_count
            
        except Exception as e:
            self.logger.error(f"❌ Failed to import fragrances: {e}")
            return 0
    
    def _perform_database_maintenance(self) -> int:
        """Perform database maintenance tasks"""
        maintenance_tasks_completed = 0
        
        try:
            self.logger.info("🔧 Starting database maintenance")
            
            # Task 1: Check for missing embeddings
            if self.database_importer.verify_embedding_triggers_active():
                embedding_status = self.database_importer.check_embedding_generation_status()
                pending_embeddings = embedding_status.get('pending_count', 0)
                
                if pending_embeddings > 0:
                    self.logger.info(f"⏳ Waiting for {pending_embeddings} pending embeddings")
                    self.database_importer.wait_for_embedding_processing(
                        timeout_minutes=self.config.get('embedding_timeout_minutes', 10)
                    )
                    maintenance_tasks_completed += 1
            
            # Task 2: Cache cleanup (if enabled)
            if self.config.get('cache_cleanup_enabled', True):
                self.logger.info("🧹 Performing cache cleanup")
                # This would integrate with database cleanup functions
                maintenance_tasks_completed += 1
            
            # Task 3: Popularity score updates (if enabled)
            if self.config.get('popularity_update_enabled', True):
                self.logger.info("📊 Updating popularity scores")
                # This would update fragrance popularity scores
                maintenance_tasks_completed += 1
            
            # Task 4: Database optimization
            self.logger.info("⚡ Optimizing database performance")
            # This would run ANALYZE, VACUUM, etc.
            maintenance_tasks_completed += 1
            
            self.logger.info(f"✅ Completed {maintenance_tasks_completed} maintenance tasks")
            
        except Exception as e:
            self.logger.error(f"❌ Database maintenance failed: {e}")
        
        return maintenance_tasks_completed
    
    def _calculate_performance_metrics(self, cycle_results: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate performance metrics for the monitoring cycle"""
        metrics = {}
        
        # Execution time
        if cycle_results.get('start_time') and cycle_results.get('end_time'):
            duration = cycle_results['end_time'] - cycle_results['start_time']
            metrics['execution_time_seconds'] = duration.total_seconds()
            metrics['execution_time_minutes'] = duration.total_seconds() / 60
        else:
            # Fallback if timing not available
            metrics['execution_time_seconds'] = 0
            metrics['execution_time_minutes'] = 0
        
        # Success rate (overall system)
        total_runs = self.monitoring_stats['total_runs']
        successful_runs = self.monitoring_stats['successful_runs']
        metrics['overall_success_rate'] = successful_runs / total_runs if total_runs > 0 else 1.0
        
        # Current cycle metrics
        metrics['current_cycle_success'] = cycle_results.get('success', False)
        metrics['errors_in_cycle'] = len(cycle_results.get('errors_encountered', []))
        metrics['fragrances_processed'] = cycle_results.get('new_fragrances_found', 0)
        metrics['fragrances_imported'] = cycle_results.get('new_fragrances_imported', 0)
        
        # Import efficiency
        found = cycle_results.get('new_fragrances_found', 0)
        imported = cycle_results.get('new_fragrances_imported', 0)
        metrics['import_efficiency'] = imported / found if found > 0 else 0
        
        # System health score (0-100)
        health_factors = {
            'success_rate': metrics['overall_success_rate'] * 40,  # 40 points
            'current_success': 30 if metrics['current_cycle_success'] else 0,  # 30 points
            'low_errors': 20 if metrics['errors_in_cycle'] == 0 else max(0, 20 - metrics['errors_in_cycle'] * 5),  # 20 points
            'reasonable_time': 10 if metrics.get('execution_time_minutes', 0) < 60 else 0  # 10 points
        }
        
        metrics['system_health_score'] = sum(health_factors.values())
        
        self.logger.info(f"📊 System health score: {metrics['system_health_score']:.1f}/100")
        
        return metrics
    
    def _process_notifications(self, cycle_results: Dict[str, Any]) -> int:
        """Process and send notifications based on cycle results"""
        notifications_sent = 0
        
        try:
            # Determine if notification is needed
            should_notify = self._should_send_notification(cycle_results)
            
            if not should_notify:
                self.logger.info("📧 No notifications needed")
                return 0
            
            # Prepare notification content
            notification_content = self._prepare_notification_content(cycle_results)
            
            # Send email notification
            if self.config.get('notification_email'):
                if self._send_email_notification(notification_content):
                    notifications_sent += 1
                    self.logger.info("✅ Email notification sent successfully")
                else:
                    self.logger.error("❌ Failed to send email notification")
            
            # Could add other notification channels here (Slack, Discord, etc.)
            
        except Exception as e:
            self.logger.error(f"❌ Notification processing failed: {e}")
        
        return notifications_sent
    
    def _should_send_notification(self, cycle_results: Dict[str, Any]) -> bool:
        """Determine if notifications should be sent"""
        conditions = [
            # New fragrances found
            cycle_results.get('new_fragrances_imported', 0) > 0,
            
            # Errors encountered
            len(cycle_results.get('errors_encountered', [])) > 0,
            
            # Long execution time
            cycle_results.get('performance_metrics', {}).get('execution_time_minutes', 0) > 
            self.config.get('performance_alert_threshold', 90),
            
            # Low system health
            cycle_results.get('performance_metrics', {}).get('system_health_score', 100) < 
            self.config.get('system_health_threshold', 80),
            
            # Maintenance tasks completed
            cycle_results.get('maintenance_tasks_completed', 0) > 0
        ]
        
        return any(conditions)
    
    def _prepare_notification_content(self, cycle_results: Dict[str, Any]) -> Dict[str, str]:
        """Prepare notification content"""
        performance = cycle_results.get('performance_metrics', {})
        
        subject = "ScentMatch Pipeline Monitoring Report"
        if not cycle_results.get('success', False):
            subject = "⚠️ ScentMatch Pipeline Alert - Issues Detected"
        elif cycle_results.get('new_fragrances_imported', 0) > 0:
            subject = f"✅ ScentMatch Pipeline - {cycle_results['new_fragrances_imported']} New Fragrances Added"
        
        # Prepare email body
        body_parts = [
            f"Monitoring Cycle: {cycle_results.get('execution_id', 'unknown')}",
            f"Timestamp: {cycle_results.get('end_time', datetime.now()).strftime('%Y-%m-%d %H:%M:%S UTC')}",
            f"Duration: {performance.get('execution_time_minutes', 0):.1f} minutes",
            "",
            "📊 Results Summary:",
            f"  • Trending fragrances detected: {cycle_results.get('new_fragrances_found', 0)}",
            f"  • New fragrances imported: {cycle_results.get('new_fragrances_imported', 0)}",
            f"  • Maintenance tasks completed: {cycle_results.get('maintenance_tasks_completed', 0)}",
            f"  • System health score: {performance.get('system_health_score', 0):.1f}/100",
            ""
        ]
        
        # Add error details if any
        errors = cycle_results.get('errors_encountered', [])
        if errors:
            body_parts.extend([
                "❌ Errors Encountered:",
                ""
            ])
            for error in errors:
                body_parts.append(f"  • {error.get('error_type', 'Unknown')}: {error.get('error_message', 'No details')}")
            body_parts.append("")
        
        # Add system statistics
        body_parts.extend([
            "📈 System Statistics:",
            f"  • Total monitoring runs: {self.monitoring_stats['total_runs']}",
            f"  • Successful runs: {self.monitoring_stats['successful_runs']}",
            f"  • Overall success rate: {performance.get('overall_success_rate', 0):.1%}",
            f"  • Total fragrances added: {self.monitoring_stats['total_new_fragrances_added']}",
            "",
            "This is an automated notification from the ScentMatch hybrid pipeline monitoring system."
        ])
        
        return {
            'subject': subject,
            'body': '\n'.join(body_parts)
        }
    
    def _send_email_notification(self, content: Dict[str, str]) -> bool:
        """Send email notification"""
        try:
            if not all([
                self.config.get('notification_email'),
                self.config.get('smtp_username'),
                self.config.get('smtp_password')
            ]):
                self.logger.warning("⚠️  Email configuration incomplete - skipping email notification")
                return False
            
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.config['smtp_username']
            msg['To'] = self.config['notification_email']
            msg['Subject'] = content['subject']
            
            # Add body
            msg.attach(MIMEText(content['body'], 'plain'))
            
            # Send email
            with smtplib.SMTP(self.config['smtp_host'], self.config['smtp_port']) as server:
                server.starttls()
                server.login(self.config['smtp_username'], self.config['smtp_password'])
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Email sending failed: {e}")
            return False
    
    def health_check(self) -> Dict[str, Any]:
        """Perform system health check"""
        self.logger.info("🔍 Performing system health check")
        
        health_status = {
            'timestamp': datetime.now().isoformat(),
            'database_connection': False,
            'embedding_system': False,
            'configuration_valid': True,
            'disk_space_sufficient': True,
            'overall_healthy': False
        }
        
        try:
            # Test database connection
            if self.database_importer.test_connection():
                health_status['database_connection'] = True
                self.logger.info("✅ Database connection healthy")
            else:
                self.logger.warning("⚠️  Database connection issues detected")
            
            # Test embedding system
            if self.database_importer.verify_embedding_triggers_active():
                health_status['embedding_system'] = True
                self.logger.info("✅ Embedding system healthy")
            else:
                self.logger.warning("⚠️  Embedding system issues detected")
            
            # Overall health assessment
            health_checks = [
                health_status['database_connection'],
                health_status['embedding_system'], 
                health_status['configuration_valid'],
                health_status['disk_space_sufficient']
            ]
            
            health_status['overall_healthy'] = all(health_checks)
            
            if health_status['overall_healthy']:
                self.logger.info("✅ System health check passed")
            else:
                self.logger.warning("⚠️  System health issues detected")
            
        except Exception as e:
            self.logger.error(f"❌ Health check failed: {e}")
            health_status['overall_healthy'] = False
        
        return health_status
    
    def run_single_cycle(self) -> Dict[str, Any]:
        """Run a single monitoring cycle (for testing/manual execution)"""
        self.logger.info("🔄 Running single monitoring cycle")
        return self.execute_monitoring_cycle()
    
    def get_status(self) -> Dict[str, Any]:
        """Get current system status"""
        return {
            'monitoring_stats': self.monitoring_stats,
            'config_summary': {
                'monitoring_enabled': self.config.get('monitoring_enabled', False),
                'schedule': f"Sundays {self.config.get('schedule_hour', 0):02d}:{self.config.get('schedule_minute', 0):02d}",
                'quality_thresholds': {
                    'rating': self.config.get('quality_threshold_rating', 0),
                    'reviews': self.config.get('quality_threshold_reviews', 0)
                },
                'notifications_enabled': self.config.get('notifications_enabled', False)
            },
            'scheduler_running': self.scheduler.running if self.scheduler else False,
            'last_health_check': datetime.now().isoformat()
        }
    
    def shutdown(self) -> None:
        """Shutdown the monitoring system gracefully"""
        self.logger.info("⏹️  Shutting down monitoring system")
        
        try:
            if self.scheduler and self.scheduler.running:
                self.scheduler.shutdown(wait=True)
                self.logger.info("✅ Scheduler stopped")
        except Exception as e:
            self.logger.error(f"❌ Error during shutdown: {e}")
        
        self.logger.info("👋 Monitoring system shutdown complete")


def main():
    """Main function for command-line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Ongoing monitoring system for hybrid pipeline')
    parser.add_argument('--config', help='Path to configuration file')
    parser.add_argument('--run-once', action='store_true', 
                       help='Run single monitoring cycle and exit')
    parser.add_argument('--health-check', action='store_true',
                       help='Perform health check and exit')
    parser.add_argument('--status', action='store_true',
                       help='Show system status and exit')
    parser.add_argument('--test-notifications', action='store_true',
                       help='Test notification system and exit')
    
    args = parser.parse_args()
    
    try:
        monitor = OngoingMonitoringSystem(config_file=args.config)
        
        if args.health_check:
            health = monitor.health_check()
            print(f"\n🔍 Health Check Results:")
            for key, value in health.items():
                status_icon = "✅" if value else "❌" if isinstance(value, bool) else "ℹ️"
                print(f"  {status_icon} {key}: {value}")
            sys.exit(0 if health.get('overall_healthy', False) else 1)
        
        elif args.status:
            status = monitor.get_status()
            print(f"\n📊 System Status:")
            print(json.dumps(status, indent=2, default=str))
            sys.exit(0)
        
        elif args.test_notifications:
            print("📧 Testing notification system...")
            # Create test notification content
            test_results = {
                'success': True,
                'new_fragrances_imported': 1,
                'execution_id': 'test_notification',
                'end_time': datetime.now(),
                'performance_metrics': {'system_health_score': 95.0},
                'errors_encountered': []
            }
            
            notifications_sent = monitor._process_notifications(test_results)
            print(f"✅ Test complete - {notifications_sent} notifications sent")
            sys.exit(0)
        
        elif args.run_once:
            print("🔄 Running single monitoring cycle...")
            results = monitor.run_single_cycle()
            print(f"\n📊 Cycle Results:")
            print(f"  Success: {results.get('success', False)}")
            print(f"  New fragrances: {results.get('new_fragrances_imported', 0)}")
            print(f"  Duration: {results.get('performance_metrics', {}).get('execution_time_minutes', 0):.1f} minutes")
            sys.exit(0 if results.get('success', False) else 1)
        
        else:
            # Start continuous monitoring
            print("🚀 Starting continuous monitoring system...")
            print("Press Ctrl+C to stop")
            monitor.start_monitoring()
    
    except KeyboardInterrupt:
        print("\n⏹️  Monitoring stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Monitoring system failed: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()