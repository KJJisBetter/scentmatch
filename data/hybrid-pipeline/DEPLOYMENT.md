# Deployment Guide: Hybrid Data Pipeline System

> **Production Deployment Instructions for ScentMatch Hybrid Pipeline**

## 🎯 Pre-Deployment Checklist

### Prerequisites Verification
- [ ] **Supabase Project**: Active project with API credentials
- [ ] **Database Schema**: Latest migrations applied
- [ ] **Environment Variables**: All required variables configured
- [ ] **Python Environment**: Python 3.8+ available
- [ ] **Server Access**: Deployment target accessible
- [ ] **Monitoring Setup**: Email notifications configured

### Required Environment Variables
```bash
# Core Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key

# Optional: Email Notifications
NOTIFICATION_EMAIL=admin@scentmatch.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Optional: Environment Detection
DEPLOYMENT_ENVIRONMENT=production  # development, staging, production
```

## 🚀 Deployment Steps

### Step 1: Server Preparation

#### On Ubuntu/Debian Server:
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Python 3.9+
sudo apt install python3 python3-pip python3-venv -y

# Install system dependencies
sudo apt install curl wget git -y

# Create application user (recommended for security)
sudo useradd -m -s /bin/bash scentmatch
sudo su - scentmatch
```

#### On CentOS/RHEL Server:
```bash
# Update system packages
sudo yum update -y

# Install Python 3.9+
sudo yum install python3 python3-pip -y

# Install system dependencies
sudo yum install curl wget git -y
```

### Step 2: Application Deployment

```bash
# 1. Clone or copy the pipeline system
cd /opt
sudo mkdir -p scentmatch/hybrid-pipeline
sudo chown scentmatch:scentmatch scentmatch/hybrid-pipeline
cd scentmatch/hybrid-pipeline

# 2. Copy pipeline files
# (Copy all files from your development machine)
# - scripts/
# - config/
# - tests/
# - requirements.txt

# 3. Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# 4. Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 5. Create required directories
mkdir -p logs
mkdir -p output
mkdir -p archive

# 6. Set proper permissions
chmod +x scripts/*.py
chmod 644 config/*.json
chmod 755 logs output archive
```

### Step 3: Database Setup

```bash
# 1. Verify database connection
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

python scripts/04_database_importer.py --test-connection

# 2. Apply pipeline metadata migration (if not already applied)
# Run the SQL migration: supabase/migrations/20250819000010_hybrid_pipeline_metadata.sql

# 3. Verify database schema
python tests/test_database_schema_compatibility.py

# 4. Run integration tests
python tests/test_database_integration_verification.py
```

### Step 4: Configuration Setup

```bash
# 1. Select environment configuration
export DEPLOYMENT_ENVIRONMENT=production

# 2. Validate configuration
python tests/test_configuration_system.py

# 3. Test monitoring system
python scripts/05_ongoing_monitor.py --health-check
python scripts/05_ongoing_monitor.py --status
```

### Step 5: Initial Data Import (Optional)

```bash
# If you have processed data ready for import:
python scripts/04_database_importer.py \\
  --fragrances output/fragrances_final_latest.json \\
  --brands output/brands_final_latest.json
```

## ⏰ Production Scheduling

### Option 1: systemd Service (Recommended)

Create service file: `/etc/systemd/system/scentmatch-pipeline.service`
```ini
[Unit]
Description=ScentMatch Hybrid Pipeline Monitoring
After=network.target

[Service]
Type=simple
User=scentmatch
Group=scentmatch
WorkingDirectory=/opt/scentmatch/hybrid-pipeline
Environment=NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
Environment=SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
Environment=DEPLOYMENT_ENVIRONMENT=production
ExecStart=/opt/scentmatch/hybrid-pipeline/venv/bin/python scripts/05_ongoing_monitor.py
Restart=always
RestartSec=300
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable scentmatch-pipeline
sudo systemctl start scentmatch-pipeline

# Check status
sudo systemctl status scentmatch-pipeline
```

### Option 2: Cron Job (Alternative)

```bash
# Add to crontab for scentmatch user
crontab -e

# Add this line for weekly Sunday 2 AM execution:
0 2 * * 0 cd /opt/scentmatch/hybrid-pipeline && ./venv/bin/python scripts/05_ongoing_monitor.py --run-once >> logs/cron.log 2>&1
```

### Option 3: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

# Copy application files
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY scripts/ scripts/
COPY config/ config/
COPY tests/ tests/

# Create required directories
RUN mkdir -p logs output archive

# Set permissions
RUN chmod +x scripts/*.py

# Health check
HEALTHCHECK --interval=1h --timeout=30s --start-period=5s --retries=3 \\
  CMD python scripts/05_ongoing_monitor.py --health-check || exit 1

# Default command
CMD ["python", "scripts/05_ongoing_monitor.py"]
```

Build and run:
```bash
docker build -t scentmatch-pipeline .
docker run -d \\
  --name scentmatch-pipeline \\
  --env-file .env.local \\
  --restart unless-stopped \\
  -v $(pwd)/logs:/app/logs \\
  -v $(pwd)/output:/app/output \\
  scentmatch-pipeline
```

## 🔧 Post-Deployment Verification

### Immediate Verification (First 24 Hours)
```bash
# 1. Verify service is running
sudo systemctl status scentmatch-pipeline
# OR for Docker:
docker ps | grep scentmatch-pipeline

# 2. Check logs for startup
tail -f logs/ongoing_monitor_*.log

# 3. Verify database connectivity
python scripts/05_ongoing_monitor.py --health-check

# 4. Run manual cycle test
python scripts/05_ongoing_monitor.py --run-once

# 5. Check system status
python scripts/05_ongoing_monitor.py --status
```

### Weekly Verification
```bash
# 1. Check monitoring cycle execution
grep "Monitoring cycle completed" logs/monitoring_cycles.log

# 2. Verify data quality
python tests/test_database_integration_verification.py

# 3. Review performance metrics
python scripts/05_ongoing_monitor.py --status

# 4. Check log file sizes
du -sh logs/

# 5. Verify email notifications (if configured)
# Check that weekly reports are being sent
```

## 📊 Monitoring Dashboard

### Log Locations
```bash
logs/
├── ongoing_monitor_[timestamp].log      # Main monitoring logs
├── database_import_[timestamp].log      # Database operation logs
├── pipeline_info.log                   # General information logs
├── pipeline_errors.log                 # Error logs with details
├── pipeline_performance.log            # Performance metrics (JSON)
└── monitoring_cycles.log               # Monitoring cycle summaries
```

### Key Metrics to Monitor
- **System Health Score**: Target >80%
- **Import Success Rate**: Target >98%
- **Execution Time**: Target <30 minutes
- **Error Rate**: Target <2%
- **Database Growth**: Monitor fragrance count growth

### Performance Alerts
- **Execution time >90 minutes**: Performance degradation
- **System health <80%**: System issues need attention
- **Error rate >5%**: Critical issues requiring intervention
- **Log file size >100MB**: Log rotation or cleanup needed

## 🔄 Rollback Procedures

### Emergency Rollback
```bash
# 1. Stop monitoring service
sudo systemctl stop scentmatch-pipeline

# 2. Restore previous configuration
cp config/backup/previous_config.json config/monitoring_config.json

# 3. Restart with previous version
sudo systemctl start scentmatch-pipeline

# 4. Verify rollback success
python scripts/05_ongoing_monitor.py --health-check
```

### Database Rollback (if needed)
```bash
# 1. Backup current state
pg_dump your_database > backup_before_rollback.sql

# 2. Restore from previous backup
# (Use Supabase dashboard or CLI for restoration)

# 3. Verify data integrity
python tests/test_database_integration_verification.py
```

## 🔐 Security Considerations

### Production Security
- **API Keys**: Store in environment variables, never in config files
- **Service Account**: Run as dedicated user with minimal permissions
- **Network Access**: Restrict outbound connections to necessary domains
- **Log Security**: Ensure logs don't contain sensitive information
- **Regular Updates**: Update dependencies monthly

### Monitoring Security
- **Authentication**: Secure notification endpoints
- **Audit Trail**: Log all configuration changes
- **Access Control**: Restrict who can modify configurations
- **Encryption**: Consider encrypting sensitive configuration data

---

**⚡ Ready for Production**: Follow this guide step-by-step for reliable production deployment of the hybrid pipeline system.