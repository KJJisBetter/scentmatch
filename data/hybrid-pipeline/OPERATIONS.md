# Operations Manual: Hybrid Data Pipeline System

> **Day-to-day operations guide for maintaining the ScentMatch hybrid pipeline**

## 📅 Daily Operations

### Morning Health Check (5 minutes)
```bash
# 1. Check system status
python scripts/05_ongoing_monitor.py --status

# 2. Review overnight logs
tail -20 logs/monitoring_cycles.log

# 3. Verify database connectivity
python scripts/05_ongoing_monitor.py --health-check

# 4. Check for error notifications
grep -i error logs/pipeline_errors.log | tail -5
```

### Expected Daily Output
- ✅ **System Status**: monitoring_enabled: true, scheduler_running: true
- ✅ **Health Check**: All components healthy (database_connection: true)
- ✅ **Error Logs**: No new critical errors
- ✅ **Performance**: System health score >80%

## 📊 Weekly Operations (Post-Monitoring Cycle)

### Monday Morning Review (15 minutes)
After Sunday 2 AM monitoring cycle completes:

```bash
# 1. Review monitoring cycle results
grep "Monitoring cycle completed" logs/monitoring_cycles.log | tail -1

# 2. Check for new fragrances imported
python -c "
import json
with open('logs/latest_monitoring_summary.json', 'r') as f:
    data = json.load(f)
    print(f'New fragrances: {data.get(\"new_fragrances_imported\", 0)}')
    print(f'Duration: {data.get(\"execution_time_minutes\", 0):.1f} minutes')
    print(f'Health score: {data.get(\"system_health_score\", 0)}/100')
"

# 3. Verify database growth
python -c "
import requests, os
headers = {'Authorization': f'Bearer {os.getenv(\"SUPABASE_SERVICE_ROLE_KEY\")}'}
resp = requests.get(f'{os.getenv(\"NEXT_PUBLIC_SUPABASE_URL\")}/rest/v1/fragrances?select=count', headers=headers)
if resp.status_code == 200:
    count = resp.json()[0]['count']
    print(f'Total fragrances in database: {count}')
"

# 4. Check embedding generation status
# Look for any pending embeddings that need attention
```

### Weekly Tasks
- **Monday**: Review monitoring cycle results
- **Wednesday**: Check log file sizes and rotation
- **Friday**: Review system performance metrics
- **Sunday**: Monitoring cycle executes automatically

## 🔧 Monthly Maintenance

### First Monday of Each Month (30 minutes)

#### Database Maintenance
```bash
# 1. Check database performance
python -c "
import requests, os
headers = {'Authorization': f'Bearer {os.getenv(\"SUPABASE_SERVICE_ROLE_KEY\")}'}

# Check table sizes
resp = requests.get(f'{os.getenv(\"NEXT_PUBLIC_SUPABASE_URL\")}/rest/v1/rpc/pg_size_pretty', headers=headers)
print('Database size information reviewed')

# Check for fragmentation
print('Manual VACUUM and ANALYZE may be needed')
"

# 2. Archive old logs
find logs/ -name "*.log" -mtime +30 -exec gzip {} \;
find logs/ -name "*.log.gz" -mtime +90 -delete

# 3. Update brand priorities (if needed)
# Review config/brand_priorities.json for new luxury brands

# 4. Performance review
python scripts/05_ongoing_monitor.py --status > monthly_status_$(date +%Y%m).json
```

#### Configuration Review
```bash
# 1. Check for configuration drift
python tests/test_configuration_system.py

# 2. Review scraping ethics compliance
cat config/scraping_ethics.json | jq '.fragrantica.rate_limit'

# 3. Update quality thresholds if needed
# Review config/monitoring_config.json quality_thresholds section
```

## 🚨 Incident Response

### Critical Issues (Immediate Response Required)

#### Database Connection Lost
```bash
# 1. Check Supabase project status
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \\
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/fragrances?limit=1"

# 2. Verify environment variables
echo "URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "Key prefix: $(echo $SUPABASE_SERVICE_ROLE_KEY | cut -c1-10)..."

# 3. Test from different network
# Sometimes firewalls block Supabase connections

# 4. Check Supabase dashboard for outages
# Visit: https://status.supabase.com/

# 5. Restart monitoring service
sudo systemctl restart scentmatch-pipeline
```

#### Monitoring Cycle Failures
```bash
# 1. Check recent error logs
tail -50 logs/pipeline_errors.log

# 2. Run diagnostic cycle
python scripts/05_ongoing_monitor.py --run-once --debug

# 3. Check system resources
free -h  # Memory usage
df -h    # Disk space
top      # CPU usage

# 4. Test individual components
python scripts/04_database_importer.py --test-connection
python tests/test_monitoring_system.py
```

#### High Error Rate (>5% failures)
```bash
# 1. Identify error patterns
grep -i "error\\|failed" logs/pipeline_errors.log | tail -20

# 2. Check rate limiting issues
grep -i "rate limit\\|429\\|timeout" logs/ongoing_monitor_*.log

# 3. Reduce scraping frequency temporarily
# Edit config/scraping_ethics.json to increase delay_ms

# 4. Run reduced scope test
python scripts/05_ongoing_monitor.py --run-once --max-fragrances=5
```

### Non-Critical Issues (24-hour response window)

#### Performance Degradation
```bash
# 1. Check execution times
grep "completed in" logs/monitoring_cycles.log | tail -10

# 2. Review system health scores
grep "System health score" logs/ongoing_monitor_*.log | tail -10

# 3. Check database performance
# Run EXPLAIN ANALYZE on slow queries if identified

# 4. Consider infrastructure scaling
# Monitor server resources and consider upgrades
```

#### Email Notification Issues
```bash
# 1. Test email configuration
python scripts/05_ongoing_monitor.py --test-notifications

# 2. Check SMTP settings
echo "SMTP Host: $SMTP_HOST"
echo "SMTP Username: $SMTP_USERNAME"

# 3. Verify email credentials
# Test SMTP login manually if needed

# 4. Review notification logic
grep "notification" logs/ongoing_monitor_*.log | tail -10
```

## 📊 Performance Monitoring

### Key Performance Indicators (KPIs)

#### System Performance
- **Execution Time**: <30 minutes per cycle (target: <15 minutes)
- **Memory Usage**: <500MB peak (target: <300MB)
- **Database Connections**: <10 concurrent (target: <5)
- **Log File Growth**: <50MB per week (target: <30MB)

#### Data Quality
- **Import Success Rate**: >98% (target: >99%)
- **Validation Pass Rate**: >95% (target: >98%)
- **Duplicate Detection**: >99% accuracy
- **Embedding Generation**: >95% success rate

#### Business Metrics
- **New Fragrances per Week**: 0-20 (varies by market activity)
- **Database Growth Rate**: ~1-2% per month
- **Data Freshness**: <7 days for trending fragrances
- **Coverage Completeness**: >95% of market leaders included

### Performance Optimization

#### If Execution Time >60 Minutes
```bash
# 1. Check for bottlenecks
python -m cProfile scripts/05_ongoing_monitor.py --run-once

# 2. Optimize database queries
# Add indexes for slow queries

# 3. Reduce batch sizes
# Edit config/monitoring_config.json - reduce batch_size

# 4. Implement parallel processing
# Consider breaking down into smaller concurrent jobs
```

#### If Memory Usage >800MB
```bash
# 1. Check for memory leaks
python -m memory_profiler scripts/05_ongoing_monitor.py --run-once

# 2. Implement data streaming
# Process data in smaller chunks rather than loading all at once

# 3. Clear caches more frequently
# Increase cache cleanup frequency in configuration
```

## 🔄 Data Pipeline Workflows

### Standard Weekly Cycle
1. **Sunday 2:00 AM**: Automated monitoring cycle starts
2. **Sunday 2:05 AM**: Trend detection and gap analysis complete
3. **Sunday 2:10 AM**: New fragrance import (if any found)
4. **Sunday 2:15 AM**: Database maintenance and optimization
5. **Sunday 2:20 AM**: Performance metrics calculation
6. **Sunday 2:25 AM**: Email notifications sent
7. **Sunday 2:30 AM**: Cycle complete, next cycle scheduled

### Manual Operations

#### Force Immediate Monitoring Cycle
```bash
# Run out-of-schedule cycle (use sparingly)
python scripts/05_ongoing_monitor.py --run-once

# Check results
python scripts/05_ongoing_monitor.py --status
```

#### Import Specific Dataset
```bash
# Import new fragrance data manually
python scripts/04_database_importer.py \\
  --fragrances path/to/fragrances.json \\
  --brands path/to/brands.json \\
  --embedding-timeout 10
```

#### Regenerate Embeddings
```bash
# If embedding system needs refresh
# Use Supabase dashboard to trigger embedding regeneration
# Or run database maintenance cycle
```

### Emergency Procedures

#### Stop All Operations
```bash
# 1. Stop monitoring service
sudo systemctl stop scentmatch-pipeline

# 2. Kill any running Python processes
pkill -f "05_ongoing_monitor.py"

# 3. Verify all stopped
ps aux | grep scentmatch
```

#### Emergency Data Recovery
```bash
# 1. Create emergency backup
python scripts/04_database_importer.py --backup-current-data

# 2. Restore from known good state
# Use Supabase point-in-time recovery

# 3. Verify data integrity
python tests/test_database_integration_verification.py

# 4. Resume operations
sudo systemctl start scentmatch-pipeline
```

## 📧 Notification Management

### Email Notification Types
1. **Weekly Success Reports**: Normal operation confirmation
2. **New Fragrance Alerts**: When new fragrances are imported
3. **Performance Warnings**: When execution time >60 minutes
4. **Error Alerts**: When critical errors occur
5. **Health Check Failures**: When system health <80%

### Notification Configuration
```bash
# Test email notifications
python scripts/05_ongoing_monitor.py --test-notifications

# Configure notification frequency
# Edit config/monitoring_config.json notifications section

# Add new notification channels
# Extend the notification system in 05_ongoing_monitor.py
```

## 🎚️ Configuration Management

### Safe Configuration Changes
```bash
# 1. Backup current configuration
cp config/monitoring_config.json config/backup/monitoring_config_$(date +%Y%m%d).json

# 2. Make changes to configuration files
# Edit config files as needed

# 3. Validate configuration changes
python tests/test_configuration_system.py

# 4. Test with single cycle
python scripts/05_ongoing_monitor.py --run-once

# 5. Apply changes (restart service)
sudo systemctl restart scentmatch-pipeline
```

### Configuration History
- Keep configuration backups for 90 days
- Document all configuration changes
- Test configuration changes in staging first
- Monitor performance impact after configuration changes

## 📈 Scaling Considerations

### When to Scale Up
- **Execution time** consistently >45 minutes
- **System health score** consistently <85%
- **Error rate** >3% for multiple cycles
- **Memory usage** >80% of available RAM

### Scaling Options
1. **Vertical Scaling**: Increase server resources (CPU, RAM)
2. **Horizontal Scaling**: Distribute processing across multiple servers
3. **Database Scaling**: Upgrade Supabase plan or optimize queries
4. **Caching**: Implement Redis for frequently accessed data

### Infrastructure Monitoring
```bash
# Server resource monitoring
htop                    # CPU and memory usage
iotop                   # Disk I/O monitoring
netstat -tuln          # Network connections
df -h                   # Disk space usage

# Application monitoring
python scripts/05_ongoing_monitor.py --status
grep "System health score" logs/ongoing_monitor_*.log | tail -5
```

---

**🎯 Operations Summary**: This pipeline is designed for autonomous operation with minimal manual intervention. Weekly cycles run automatically, with email notifications for significant events. Monthly reviews ensure optimal performance and data quality.