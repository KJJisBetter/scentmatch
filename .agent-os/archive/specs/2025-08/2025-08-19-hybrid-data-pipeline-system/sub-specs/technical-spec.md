# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-19-hybrid-data-pipeline-system/spec.md

## Technical Requirements

### Phase 1: Kaggle Data Processing
- **Priority Scoring Algorithm** - Multi-factor scoring system combining rating, review count, brand prestige, recency, and classic status
- **Data Transformation Pipeline** - Clean and normalize fragrance names, gender categories, brand IDs, and accord arrays
- **Filtering Logic** - Process 24,064 records down to exactly 2,000 using computed priority scores
- **Output Format** - JSON structure compatible with existing Supabase schema
- **Performance Target** - Complete processing within 2 hours on standard hardware

### Phase 2: Gap Analysis & Scraping
- **Trend Detection System** - Monitor Fragrantica trending pages and social media mentions
- **Missing Fragrance Identification** - Compare processed Kaggle data against current market trends
- **Ethical Scraping Framework** - 2-second delays, proper headers, sequential requests only
- **Data Validation** - Ensure scraped fragrances meet quality criteria (>4.0 rating, >500 reviews)
- **Rate Limiting** - Maximum 1 request per 2 seconds with exponential backoff on failures

### Phase 3: Continuous Monitoring
- **Automated Scheduling** - Weekly cron job execution every Sunday at 2 AM
- **Intelligence Gathering** - Monitor new releases and trending fragrances automatically  
- **Quality Gates** - Only add fragrances meeting strict criteria (>4.0 rating, >500 reviews)
- **Notification System** - Alert administrators for manual review of potential additions
- **Database Maintenance** - Automatic embedding generation and popularity score updates

### Data Pipeline Architecture
- **Script Organization** - Sequential numbered scripts in `/data/hybrid-pipeline/scripts/`
- **Configuration Management** - JSON config files for scraping ethics and brand priorities
- **Logging System** - Comprehensive logs for scraping activity, imports, and performance metrics
- **Error Handling** - Robust retry logic with exponential backoff and failure notifications
- **Data Validation** - Schema validation at each pipeline stage with quality assurance checks

### Integration Requirements
- **Supabase Compatibility** - Direct integration with existing fragrance table schema
- **Embedding Pipeline** - Automatic trigger of embedding generation for new fragrances
- **Database Constraints** - Maintain referential integrity and handle duplicate detection
- **Performance Optimization** - Batch operations for database imports with proper indexing
- **Monitoring Integration** - Connect with existing application monitoring systems

## External Dependencies

**New Python Libraries:**
- **pandas** - Advanced data processing and filtering operations
- **requests** - HTTP requests for web scraping with proper headers
- **beautifulsoup4** - HTML parsing for Fragrantica page scraping
- **python-dotenv** - Environment variable management for API keys
- **schedule** - Cron-like job scheduling for continuous monitoring

**Justification:** These libraries are industry standard for data processing and web scraping, providing robust functionality for the complex data pipeline requirements while maintaining ethical scraping practices.