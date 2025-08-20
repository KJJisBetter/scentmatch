-- HYBRID PIPELINE METADATA COLUMNS
-- Date: 2025-08-19
-- Purpose: Add columns for hybrid pipeline data tracking and metadata

-- ============================================================================
-- STEP 1: ADD PIPELINE-SPECIFIC COLUMNS TO FRAGRANCES TABLE
-- ============================================================================

-- Add pipeline priority score (different from popularity_score)
ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS pipeline_priority_score DECIMAL(10,4) DEFAULT NULL;

-- Add pipeline batch tracking
ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS pipeline_batch_id INTEGER DEFAULT NULL;

-- Add pipeline import timestamp
ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS pipeline_imported_at TIMESTAMP DEFAULT NULL;

-- Add pipeline data quality metrics
ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS pipeline_quality_score DECIMAL(3,2) DEFAULT NULL;

-- Add pipeline source tracking (kaggle, scraped, manual)
ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS pipeline_source TEXT DEFAULT NULL
CHECK (pipeline_source IN ('kaggle', 'scraped', 'manual', 'hybrid', NULL));

-- ============================================================================
-- STEP 2: ADD PIPELINE-SPECIFIC COLUMNS TO BRANDS TABLE  
-- ============================================================================

-- Add pipeline import timestamp for brands
ALTER TABLE fragrance_brands 
ADD COLUMN IF NOT EXISTS pipeline_imported_at TIMESTAMP DEFAULT NULL;

-- Add pipeline batch tracking for brands
ALTER TABLE fragrance_brands 
ADD COLUMN IF NOT EXISTS pipeline_batch_id INTEGER DEFAULT NULL;

-- Add brand coverage metrics from pipeline
ALTER TABLE fragrance_brands 
ADD COLUMN IF NOT EXISTS pipeline_fragrance_count INTEGER DEFAULT 0;

-- Add brand priority from pipeline analysis
ALTER TABLE fragrance_brands 
ADD COLUMN IF NOT EXISTS pipeline_brand_priority INTEGER DEFAULT NULL;

-- ============================================================================
-- STEP 3: CREATE PIPELINE EXECUTION LOG TABLE
-- ============================================================================

-- Create table to track pipeline execution history
CREATE TABLE IF NOT EXISTS pipeline_execution_log (
    id SERIAL PRIMARY KEY,
    execution_id TEXT NOT NULL UNIQUE, -- UUID for each pipeline run
    pipeline_phase TEXT NOT NULL CHECK (pipeline_phase IN ('kaggle_processing', 'gap_analysis', 'scraping', 'database_import', 'monitoring')),
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    status TEXT CHECK (status IN ('running', 'completed', 'failed', 'cancelled')) DEFAULT 'running',
    records_processed INTEGER DEFAULT 0,
    records_imported INTEGER DEFAULT 0,
    errors_encountered INTEGER DEFAULT 0,
    execution_metadata JSONB, -- Store detailed execution info
    error_details TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: CREATE PIPELINE QUALITY METRICS TABLE
-- ============================================================================

-- Track data quality metrics across pipeline runs
CREATE TABLE IF NOT EXISTS pipeline_quality_metrics (
    id SERIAL PRIMARY KEY,
    execution_id TEXT NOT NULL REFERENCES pipeline_execution_log(execution_id),
    metric_name TEXT NOT NULL, -- e.g., 'rating_coverage', 'accord_completeness', 'duplicate_rate'
    metric_value DECIMAL(10,4) NOT NULL,
    metric_threshold DECIMAL(10,4), -- Expected threshold for this metric
    passed_threshold BOOLEAN DEFAULT NULL, -- Whether metric met expectations
    measured_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(execution_id, metric_name)
);

-- ============================================================================
-- STEP 5: CREATE PIPELINE CONFIGURATION TABLE
-- ============================================================================

-- Store pipeline configuration and settings
CREATE TABLE IF NOT EXISTS pipeline_configuration (
    id SERIAL PRIMARY KEY,
    config_key TEXT NOT NULL UNIQUE, -- e.g., 'scraping_delay', 'batch_size', 'quality_threshold'
    config_value TEXT NOT NULL,
    config_type TEXT CHECK (config_type IN ('string', 'integer', 'decimal', 'boolean', 'json')) DEFAULT 'string',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by TEXT DEFAULT 'system'
);

-- ============================================================================
-- STEP 6: CREATE INDEXES FOR PIPELINE COLUMNS
-- ============================================================================

-- Indexes for fragrances pipeline columns
CREATE INDEX IF NOT EXISTS idx_fragrances_pipeline_batch 
ON fragrances(pipeline_batch_id) WHERE pipeline_batch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fragrances_pipeline_source 
ON fragrances(pipeline_source) WHERE pipeline_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fragrances_pipeline_priority 
ON fragrances(pipeline_priority_score DESC) WHERE pipeline_priority_score IS NOT NULL;

-- Indexes for brands pipeline columns
CREATE INDEX IF NOT EXISTS idx_brands_pipeline_batch 
ON fragrance_brands(pipeline_batch_id) WHERE pipeline_batch_id IS NOT NULL;

-- Indexes for pipeline tracking tables
CREATE INDEX IF NOT EXISTS idx_pipeline_execution_status 
ON pipeline_execution_log(status, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_pipeline_execution_phase 
ON pipeline_execution_log(pipeline_phase, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_pipeline_quality_execution 
ON pipeline_quality_metrics(execution_id, metric_name);

-- ============================================================================
-- STEP 7: CREATE PIPELINE UTILITY FUNCTIONS
-- ============================================================================

-- Function to generate unique execution ID
CREATE OR REPLACE FUNCTION generate_pipeline_execution_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'pipe_' || EXTRACT(epoch FROM NOW())::INTEGER || '_' || SUBSTR(md5(random()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;

-- Function to start pipeline execution tracking
CREATE OR REPLACE FUNCTION start_pipeline_execution(
    phase TEXT,
    execution_metadata JSONB DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    execution_id TEXT;
BEGIN
    execution_id := generate_pipeline_execution_id();
    
    INSERT INTO pipeline_execution_log (
        execution_id, 
        pipeline_phase, 
        execution_metadata
    ) VALUES (
        execution_id, 
        phase, 
        execution_metadata
    );
    
    RETURN execution_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete pipeline execution tracking
CREATE OR REPLACE FUNCTION complete_pipeline_execution(
    execution_id TEXT,
    final_status TEXT,
    records_processed INTEGER DEFAULT 0,
    records_imported INTEGER DEFAULT 0,
    errors_encountered INTEGER DEFAULT 0,
    error_details TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE pipeline_execution_log 
    SET 
        end_time = NOW(),
        status = final_status,
        records_processed = COALESCE(complete_pipeline_execution.records_processed, 0),
        records_imported = COALESCE(complete_pipeline_execution.records_imported, 0),
        errors_encountered = COALESCE(complete_pipeline_execution.errors_encountered, 0),
        error_details = complete_pipeline_execution.error_details
    WHERE pipeline_execution_log.execution_id = complete_pipeline_execution.execution_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to record pipeline quality metric
CREATE OR REPLACE FUNCTION record_pipeline_metric(
    execution_id TEXT,
    metric_name TEXT,
    metric_value DECIMAL,
    metric_threshold DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    passed BOOLEAN;
BEGIN
    -- Determine if threshold was passed
    IF metric_threshold IS NOT NULL THEN
        passed := metric_value >= metric_threshold;
    END IF;
    
    INSERT INTO pipeline_quality_metrics (
        execution_id,
        metric_name,
        metric_value,
        metric_threshold,
        passed_threshold
    ) VALUES (
        record_pipeline_metric.execution_id,
        record_pipeline_metric.metric_name,
        record_pipeline_metric.metric_value,
        record_pipeline_metric.metric_threshold,
        passed
    )
    ON CONFLICT (execution_id, metric_name) 
    DO UPDATE SET 
        metric_value = EXCLUDED.metric_value,
        metric_threshold = EXCLUDED.metric_threshold,
        passed_threshold = EXCLUDED.passed_threshold,
        measured_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 8: INSERT DEFAULT PIPELINE CONFIGURATIONS
-- ============================================================================

-- Insert default pipeline configurations
INSERT INTO pipeline_configuration (config_key, config_value, config_type, description) VALUES
('scraping_delay_seconds', '2', 'integer', 'Delay between scraping requests for ethical compliance'),
('batch_import_size', '100', 'integer', 'Number of records per database batch import'),
('quality_rating_threshold', '3.5', 'decimal', 'Minimum rating for fragrance inclusion'),
('quality_review_threshold', '100', 'integer', 'Minimum review count for fragrance inclusion'),
('max_fragrances_per_run', '2000', 'integer', 'Maximum fragrances to process in single pipeline run'),
('pipeline_schedule', '0 2 * * 0', 'string', 'Cron schedule for automatic pipeline runs (weekly Sunday 2 AM)'),
('notification_email', '', 'string', 'Email address for pipeline notifications'),
('enable_automatic_embedding', 'true', 'boolean', 'Whether to trigger embedding generation after import')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================================
-- STEP 9: CREATE VIEWS FOR PIPELINE MONITORING
-- ============================================================================

-- View for pipeline execution summary
CREATE OR REPLACE VIEW pipeline_execution_summary AS
SELECT 
    execution_id,
    pipeline_phase,
    status,
    start_time,
    end_time,
    (end_time - start_time) as duration,
    records_processed,
    records_imported,
    errors_encountered,
    CASE 
        WHEN errors_encountered = 0 AND records_imported > 0 THEN 'success'
        WHEN errors_encountered > 0 AND records_imported > 0 THEN 'partial_success'
        WHEN errors_encountered > 0 AND records_imported = 0 THEN 'failure'
        ELSE 'unknown'
    END as execution_quality
FROM pipeline_execution_log
ORDER BY start_time DESC;

-- View for recent pipeline quality metrics
CREATE OR REPLACE VIEW recent_pipeline_quality AS
SELECT 
    pel.execution_id,
    pel.pipeline_phase,
    pel.start_time,
    pqm.metric_name,
    pqm.metric_value,
    pqm.metric_threshold,
    pqm.passed_threshold,
    CASE 
        WHEN pqm.passed_threshold = true THEN '✅'
        WHEN pqm.passed_threshold = false THEN '❌'
        ELSE '⏸️'
    END as status_emoji
FROM pipeline_execution_log pel
JOIN pipeline_quality_metrics pqm ON pel.execution_id = pqm.execution_id
WHERE pel.start_time > (NOW() - INTERVAL '7 days')
ORDER BY pel.start_time DESC, pqm.metric_name;

-- ============================================================================
-- STEP 10: ENABLE ROW LEVEL SECURITY FOR PIPELINE TABLES
-- ============================================================================

-- Enable RLS on pipeline tables
ALTER TABLE pipeline_execution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_configuration ENABLE ROW LEVEL SECURITY;

-- Create policies for pipeline tables (service role can access everything)
CREATE POLICY "Service role manages pipeline execution log" ON pipeline_execution_log
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages pipeline quality metrics" ON pipeline_quality_metrics
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages pipeline configuration" ON pipeline_configuration
    FOR ALL USING (auth.role() = 'service_role');

-- Public read access for monitoring views (if needed)
-- CREATE POLICY "Public read pipeline summary" ON pipeline_execution_log
--     FOR SELECT USING (true);

-- ============================================================================
-- FINAL VALIDATION
-- ============================================================================

DO $$
BEGIN
    -- Verify pipeline columns were added
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fragrances' AND column_name = 'pipeline_priority_score'
    ) THEN
        RAISE EXCEPTION 'Pipeline metadata migration failed: pipeline_priority_score column not added';
    END IF;
    
    -- Verify pipeline tables were created
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pipeline_execution_log'
    ) THEN
        RAISE EXCEPTION 'Pipeline metadata migration failed: pipeline_execution_log table not created';
    END IF;
    
    RAISE NOTICE 'Hybrid pipeline metadata migration completed successfully!';
END $$;