# ScentMatch Hybrid Data Pipeline System

> **Version 1.0** | **Status: Production Ready** | **Last Updated: 2025-08-19**

A sophisticated 3-phase hybrid data pipeline that combines Kaggle's comprehensive fragrance dataset (24K fragrances) with targeted Fragrantica scraping to build the world's best fragrance database. This system filters 24,064 fragrances down to the top 2,000 most relevant entries while maintaining ongoing intelligence gathering for new releases.

## 🎯 System Overview

### What It Does
- **Processes 24K+ fragrances** from Kaggle dataset using priority scoring
- **Filters to top 2,000** highest-quality fragrances using multi-factor algorithms
- **Monitors trending fragrances** with ethical Fragrantica scraping
- **Maintains database** with automatic embedding generation and optimization
- **Provides continuous intelligence** gathering for new releases

### Key Features
- ✅ **Multi-phase processing**: Kaggle → Gap Analysis → Ethical Scraping → Database Import
- ✅ **Quality assurance**: Rating >4.0, Reviews >500, Brand prioritization
- ✅ **Ethical scraping**: 2-second delays, respectful headers, rate limiting
- ✅ **Database integration**: Supabase with automatic embedding generation
- ✅ **Continuous monitoring**: Weekly automated cycles with notifications
- ✅ **Comprehensive logging**: Structured logs with rotation and monitoring

## 📁 Directory Structure

```
data/hybrid-pipeline/
├── README.md                     # This file
├── DEPLOYMENT.md                 # Deployment guide
├── OPERATIONS.md                 # Operations manual
├── config/                       # Configuration files
│   ├── monitoring_config.json    # Main monitoring configuration
│   ├── logging_config.json       # Logging system configuration
│   ├── scraping_ethics.json      # Ethical scraping settings
│   ├── brand_priorities.json     # Brand tier and priority settings
│   ├── market_research_integration.json # Research validation
│   └── environments/             # Environment-specific configs
│       ├── development.json      # Development settings
│       ├── staging.json          # Staging settings
│       └── production.json       # Production settings
├── scripts/                      # Pipeline execution scripts
│   ├── 01_kaggle_processor.py    # Kaggle data processing
│   ├── 02_gap_analyzer.py        # Gap analysis and trend detection
│   ├── 03_ethical_scraper.py     # Ethical Fragrantica scraping
│   ├── 04_database_importer.py   # Supabase database integration
│   └── 05_ongoing_monitor.py     # Continuous monitoring system
├── tests/                        # Comprehensive test suite
│   ├── test_kaggle_processor.py  # Kaggle processing tests
│   ├── test_gap_analyzer.py      # Gap analysis tests
│   ├── test_database_schema_compatibility.py # Schema tests
│   ├── test_database_integration_verification.py # DB integration tests
│   ├── test_monitoring_system.py # Monitoring logic tests
│   ├── test_monitoring_system_integration.py # Full integration tests
│   └── test_configuration_system.py # Configuration tests
├── logs/                         # Automatic log files
├── output/                       # Generated data files
└── venv/                         # Python virtual environment
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Supabase account with API credentials
- Environment variables configured (see `.env.example`)

### Installation
```bash
# 1. Navigate to pipeline directory
cd data/hybrid-pipeline

# 2. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
cp ../../.env.example ../../.env.local
# Edit .env.local with your Supabase credentials

# 5. Test database connection
python scripts/04_database_importer.py --test-connection
```

### Quick Run
```bash
# Run single monitoring cycle (for testing)
python scripts/05_ongoing_monitor.py --run-once

# Check system status
python scripts/05_ongoing_monitor.py --status

# Perform health check
python scripts/05_ongoing_monitor.py --health-check
```

## 📊 Pipeline Phases

### Phase 1: Kaggle Data Processing
**Script**: `01_kaggle_processor.py`
- Loads 24,064 fragrances from Kaggle dataset
- Applies priority scoring algorithm (rating, reviews, brand prestige, recency)
- Filters to top 2,000 fragrances
- Outputs: `fragrances_final_[timestamp].json`, `brands_final_[timestamp].json`

### Phase 2: Gap Analysis & Ethical Scraping  
**Scripts**: `02_gap_analyzer.py`, `03_ethical_scraper.py`
- Analyzes trending fragrances from Fragrantica
- Identifies missing popular fragrances
- Performs ethical scraping with 2-second delays
- Validates quality (>4.0 rating, >500 reviews)

### Phase 3: Database Integration
**Script**: `04_database_importer.py`
- Imports processed data to Supabase
- Handles duplicate detection and validation
- Triggers automatic embedding generation
- Creates import tracking records

### Phase 4: Continuous Monitoring
**Script**: `05_ongoing_monitor.py`
- Weekly automated monitoring cycles
- Performance metrics and health checks
- Database maintenance and optimization
- Email notifications for administrators

## ⚙️ Configuration Management

### Environment Variables Required
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Notification Configuration
NOTIFICATION_EMAIL=admin@scentmatch.com
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=your_email
SMTP_PASSWORD=your_app_password
```

### Configuration Files
- **monitoring_config.json**: Main monitoring system settings
- **logging_config.json**: Logging system configuration with rotation
- **scraping_ethics.json**: Ethical scraping compliance settings
- **brand_priorities.json**: Brand tier system and priority boosts
- **environments/**: Environment-specific overrides

### Configuration Priority
1. **Environment variables** (highest priority)
2. **Environment-specific config files** (staging.json, production.json)
3. **Main config files** (monitoring_config.json, etc.)
4. **Built-in defaults** (lowest priority)

## 🔍 Monitoring & Maintenance

### Automated Monitoring
- **Schedule**: Every Sunday at 2:00 AM UTC
- **Duration**: Typically 5-15 minutes
- **Actions**: Trend detection, quality filtering, database import, maintenance
- **Notifications**: Email alerts for new fragrances, errors, or performance issues

### Health Checks
- **Database connectivity**: Supabase connection and query tests
- **Embedding system**: Vector generation pipeline status
- **System performance**: Memory, execution time, error rates
- **Data quality**: Rating thresholds, schema compliance

### Manual Operations
```bash
# Start continuous monitoring (runs indefinitely)
python scripts/05_ongoing_monitor.py

# Run single cycle for testing
python scripts/05_ongoing_monitor.py --run-once

# Check system health
python scripts/05_ongoing_monitor.py --health-check

# View system status
python scripts/05_ongoing_monitor.py --status

# Test notifications
python scripts/05_ongoing_monitor.py --test-notifications
```

## 🧪 Testing

### Run All Tests
```bash
# Database schema tests
python tests/test_database_schema_compatibility.py

# Database integration tests
python tests/test_database_integration_verification.py

# Monitoring system tests
python tests/test_monitoring_system.py

# Full integration tests
python tests/test_monitoring_system_integration.py

# Configuration tests
python tests/test_configuration_system.py
```

### Test Coverage
- ✅ **Database schema compatibility**: 13 tests
- ✅ **Database integration verification**: 12 tests  
- ✅ **Monitoring system logic**: 10 tests
- ✅ **Monitoring integration**: 15 tests
- ✅ **Configuration system**: 10 tests
- **Total**: 60+ comprehensive tests

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY | cut -c1-10

# Test connection manually
python scripts/04_database_importer.py --test-connection
```

#### Embedding System Not Working
```bash
# Check if pgvector extension is enabled
# Check if embedding triggers are active
# Check AI processing queue for stuck jobs
```

#### Monitoring Cycle Failures
```bash
# Check logs for detailed error information
tail -f logs/ongoing_monitor_*.log

# Run with debug logging
python scripts/05_ongoing_monitor.py --run-once --debug
```

#### Performance Issues
```bash
# Check system health score
python scripts/05_ongoing_monitor.py --health-check

# Monitor log file sizes
du -sh logs/

# Check database performance
# Monitor memory usage during execution
```

## 📈 Performance Specifications

### Expected Performance
- **Kaggle Processing**: ~15 minutes for 24K records
- **Database Import**: ~5 minutes for 2K records  
- **Monitoring Cycle**: ~10 minutes total
- **Memory Usage**: <500MB peak
- **Database Load**: <100 concurrent connections

### Quality Metrics
- **Data Quality Score**: >95% valid records
- **System Health Score**: >80% overall
- **Import Success Rate**: >98% successful imports
- **Uptime**: >99.5% monitoring availability

## 🔐 Security & Compliance

### Ethical Scraping Compliance
- ✅ **Rate limiting**: 2-second delays between requests
- ✅ **Respectful headers**: Proper user agent and contact information
- ✅ **Robots.txt compliance**: Automatic robots.txt checking
- ✅ **Conservative approach**: Maximum 1,000 requests per hour

### Data Privacy
- ✅ **No personal data collection**: Only public fragrance information
- ✅ **API key security**: Service role keys never logged
- ✅ **Audit trail**: Full logging of all operations
- ✅ **Access control**: Database RLS policies enforced

## 🆘 Support

### Documentation
- **DEPLOYMENT.md**: Step-by-step deployment instructions
- **OPERATIONS.md**: Day-to-day operations manual
- **Configuration files**: Inline documentation and examples

### Monitoring
- **Log files**: `logs/` directory with rotating files
- **Health checks**: Automated every hour
- **Email alerts**: Configurable notification system
- **Status dashboard**: Real-time system status via CLI

### Contact
- **Technical Issues**: Check logs in `logs/` directory
- **Configuration Help**: Review `config/` files and examples
- **Integration Questions**: See `OPERATIONS.md` for workflows

---

**🎉 Ready for Production**: This system has been thoroughly tested and validated for production deployment with comprehensive monitoring, error handling, and quality assurance.