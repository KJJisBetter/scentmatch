-- MULTI-ARMED BANDIT SYSTEM FOR SCENTMATCH
-- Date: 2025-08-19
-- Purpose: Add Thompson Sampling and contextual bandit capabilities for dynamic recommendation optimization

-- ============================================================================
-- STEP 1: CREATE BANDIT ALGORITHM TRACKING TABLES
-- ============================================================================

-- Algorithm performance tracking with Beta distribution parameters
CREATE TABLE IF NOT EXISTS bandit_algorithms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  algorithm_name VARCHAR(50) NOT NULL CHECK (algorithm_name IN ('content_based', 'collaborative', 'hybrid', 'trending', 'seasonal', 'adventurous')),
  context_hash VARCHAR(64) NOT NULL DEFAULT 'default',
  
  -- Beta distribution parameters for Thompson Sampling
  alpha FLOAT DEFAULT 1.0 CHECK (alpha > 0),
  beta FLOAT DEFAULT 1.0 CHECK (beta > 0),
  
  -- Performance tracking
  total_selections INTEGER DEFAULT 0,
  total_rewards FLOAT DEFAULT 0.0,
  success_rate FLOAT DEFAULT 0.0,
  confidence_interval_lower FLOAT DEFAULT 0.0,
  confidence_interval_upper FLOAT DEFAULT 1.0,
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per user-algorithm-context combination
  UNIQUE(user_id, algorithm_name, context_hash)
);

-- Indexes for efficient bandit queries
CREATE INDEX IF NOT EXISTS bandit_algorithms_user_id_idx ON bandit_algorithms(user_id);
CREATE INDEX IF NOT EXISTS bandit_algorithms_context_idx ON bandit_algorithms(context_hash);
CREATE INDEX IF NOT EXISTS bandit_algorithms_algorithm_idx ON bandit_algorithms(algorithm_name);
CREATE INDEX IF NOT EXISTS bandit_algorithms_performance_idx ON bandit_algorithms(success_rate DESC, total_selections DESC);

-- ============================================================================
-- STEP 2: CREATE RECOMMENDATION FEEDBACK TRACKING
-- ============================================================================

-- Detailed feedback tracking for multi-armed bandit learning
CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fragrance_id TEXT REFERENCES fragrances(id) ON DELETE CASCADE,
  algorithm_used VARCHAR(50) NOT NULL,
  
  -- Action tracking
  action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'click', 'add_to_collection', 'rating', 'purchase_intent', 'sample_purchase', 'ignore')),
  session_id VARCHAR(100),
  
  -- Reward calculation
  immediate_reward FLOAT DEFAULT 0.0 CHECK (immediate_reward >= 0 AND immediate_reward <= 1),
  delayed_reward FLOAT DEFAULT NULL CHECK (delayed_reward IS NULL OR (delayed_reward >= 0 AND delayed_reward <= 1)),
  combined_reward FLOAT DEFAULT 0.0 CHECK (combined_reward >= 0 AND combined_reward <= 1),
  
  -- Context information
  context JSONB DEFAULT '{}',
  contextual_factors JSONB DEFAULT '{}', -- Time, season, device, etc.
  
  -- Timing information
  recommendation_timestamp TIMESTAMPTZ,
  action_timestamp TIMESTAMPTZ DEFAULT NOW(),
  time_to_action_seconds INTEGER,
  
  -- Quality indicators
  confidence_at_selection FLOAT,
  exploration_vs_exploitation VARCHAR(20) CHECK (exploration_vs_exploitation IN ('exploration', 'exploitation', 'mixed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for feedback analysis
CREATE INDEX IF NOT EXISTS recommendation_feedback_user_id_idx ON recommendation_feedback(user_id);
CREATE INDEX IF NOT EXISTS recommendation_feedback_algorithm_idx ON recommendation_feedback(algorithm_used);
CREATE INDEX IF NOT EXISTS recommendation_feedback_action_idx ON recommendation_feedback(action);
CREATE INDEX IF NOT EXISTS recommendation_feedback_timestamp_idx ON recommendation_feedback(action_timestamp);
CREATE INDEX IF NOT EXISTS recommendation_feedback_session_idx ON recommendation_feedback(session_id);
CREATE INDEX IF NOT EXISTS recommendation_feedback_reward_idx ON recommendation_feedback(combined_reward DESC);

-- Composite index for bandit learning queries
CREATE INDEX IF NOT EXISTS recommendation_feedback_bandit_learning_idx 
ON recommendation_feedback(user_id, algorithm_used, action_timestamp DESC);

-- ============================================================================
-- STEP 3: CREATE ALGORITHM PERFORMANCE METRICS TABLES
-- ============================================================================

-- Global algorithm performance tracking (aggregated across all users)
CREATE TABLE IF NOT EXISTS algorithm_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  algorithm_name VARCHAR(50) NOT NULL,
  context_hash VARCHAR(64) DEFAULT 'global',
  
  -- Performance metrics
  total_recommendations INTEGER DEFAULT 0,
  total_positive_feedback INTEGER DEFAULT 0,
  success_rate FLOAT DEFAULT 0.0,
  average_reward FLOAT DEFAULT 0.0,
  
  -- Confidence metrics
  confidence_interval_lower FLOAT DEFAULT 0.0,
  confidence_interval_upper FLOAT DEFAULT 1.0,
  statistical_significance FLOAT DEFAULT 0.0,
  
  -- Time period
  metric_period_start TIMESTAMPTZ NOT NULL,
  metric_period_end TIMESTAMPTZ NOT NULL,
  calculation_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Performance trends
  trend_direction VARCHAR(20) CHECK (trend_direction IN ('improving', 'declining', 'stable', 'unknown')),
  improvement_rate FLOAT DEFAULT 0.0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per algorithm-context-period combination
  UNIQUE(algorithm_name, context_hash, metric_period_start, metric_period_end)
);

-- Indexes for metrics analysis
CREATE INDEX IF NOT EXISTS algorithm_metrics_algorithm_idx ON algorithm_performance_metrics(algorithm_name);
CREATE INDEX IF NOT EXISTS algorithm_metrics_period_idx ON algorithm_performance_metrics(metric_period_start, metric_period_end);
CREATE INDEX IF NOT EXISTS algorithm_metrics_performance_idx ON algorithm_performance_metrics(success_rate DESC, total_recommendations DESC);

-- ============================================================================
-- STEP 4: CREATE A/B TESTING FRAMEWORK TABLES
-- ============================================================================

-- A/B test experiment tracking
CREATE TABLE IF NOT EXISTS ab_test_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  
  -- Test configuration
  control_algorithm VARCHAR(50) NOT NULL,
  treatment_algorithm VARCHAR(50) NOT NULL,
  traffic_allocation JSONB NOT NULL DEFAULT '{"control": 0.5, "treatment": 0.5}',
  
  -- Test status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
  
  -- Statistical parameters
  significance_level FLOAT DEFAULT 0.05 CHECK (significance_level > 0 AND significance_level < 1),
  minimum_sample_size INTEGER DEFAULT 1000,
  maximum_duration_days INTEGER DEFAULT 30,
  
  -- Results tracking
  current_sample_size INTEGER DEFAULT 0,
  statistical_power FLOAT DEFAULT 0.0,
  p_value FLOAT DEFAULT NULL,
  effect_size FLOAT DEFAULT NULL,
  is_statistically_significant BOOLEAN DEFAULT FALSE,
  
  -- Timing
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User assignment to A/B test groups
CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES ab_test_experiments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Assignment details
  group_name VARCHAR(20) NOT NULL CHECK (group_name IN ('control', 'treatment')),
  assignment_hash VARCHAR(64) NOT NULL, -- For deterministic assignment
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Experience tracking
  recommendations_received INTEGER DEFAULT 0,
  feedback_provided INTEGER DEFAULT 0,
  conversion_events INTEGER DEFAULT 0,
  
  -- Ensure one assignment per user per experiment
  UNIQUE(experiment_id, user_id)
);

-- Indexes for A/B testing
CREATE INDEX IF NOT EXISTS ab_test_assignments_experiment_idx ON ab_test_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS ab_test_assignments_user_idx ON ab_test_assignments(user_id);
CREATE INDEX IF NOT EXISTS ab_test_assignments_group_idx ON ab_test_assignments(group_name);

-- ============================================================================
-- STEP 5: CREATE BANDIT ALGORITHM FUNCTIONS
-- ============================================================================

-- Function to select algorithm using Thompson Sampling
CREATE OR REPLACE FUNCTION select_algorithm_thompson_sampling(
  target_user_id UUID,
  context_factors JSONB DEFAULT '{}'
)
RETURNS TABLE (
  algorithm_name TEXT,
  selection_confidence FLOAT,
  sampling_score FLOAT,
  is_exploration BOOLEAN
) AS $$
DECLARE
  context_hash_value VARCHAR(64);
  algorithm_record RECORD;
  max_sample FLOAT := 0;
  selected_algorithm TEXT := 'hybrid'; -- Default fallback
  sample_value FLOAT;
  total_algorithms INTEGER := 0;
  exploration_threshold FLOAT := 0.1;
BEGIN
  -- Generate context hash for contextual bandit
  context_hash_value := encode(
    digest(COALESCE(context_factors::TEXT, '{}'), 'sha256'), 'hex'
  )::VARCHAR(64);
  
  -- Count available algorithms for this user-context
  SELECT COUNT(*) INTO total_algorithms
  FROM bandit_algorithms 
  WHERE user_id = target_user_id 
    AND context_hash = context_hash_value;
  
  -- Initialize algorithms if none exist for this context
  IF total_algorithms = 0 THEN
    INSERT INTO bandit_algorithms (user_id, algorithm_name, context_hash)
    VALUES 
      (target_user_id, 'content_based', context_hash_value),
      (target_user_id, 'collaborative', context_hash_value),
      (target_user_id, 'hybrid', context_hash_value)
    ON CONFLICT (user_id, algorithm_name, context_hash) DO NOTHING;
  END IF;
  
  -- Sample from each algorithm's beta distribution and select maximum
  FOR algorithm_record IN
    SELECT ba.algorithm_name, ba.alpha, ba.beta, ba.total_selections
    FROM bandit_algorithms ba
    WHERE ba.user_id = target_user_id 
      AND ba.context_hash = context_hash_value
  LOOP
    -- Generate sample from Beta(alpha, beta) distribution
    -- Simplified approximation: sample = alpha / (alpha + beta) + noise
    sample_value := algorithm_record.alpha / (algorithm_record.alpha + algorithm_record.beta) + 
                   (RANDOM() - 0.5) * 0.2 * (2 / (algorithm_record.alpha + algorithm_record.beta));
    sample_value := GREATEST(0, LEAST(1, sample_value)); -- Clamp to [0,1]
    
    IF sample_value > max_sample THEN
      max_sample := sample_value;
      selected_algorithm := algorithm_record.algorithm_name;
    END IF;
  END LOOP;
  
  -- Update selection count
  UPDATE bandit_algorithms 
  SET total_selections = total_selections + 1,
      last_updated = NOW()
  WHERE user_id = target_user_id 
    AND algorithm_name = selected_algorithm 
    AND context_hash = context_hash_value;
  
  -- Determine if this is exploration vs exploitation
  DECLARE
    is_exploration_flag BOOLEAN := max_sample < (0.5 + exploration_threshold);
  BEGIN
    RETURN QUERY SELECT 
      selected_algorithm,
      max_sample,
      max_sample,
      is_exploration_flag;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process recommendation feedback and update bandit parameters
CREATE OR REPLACE FUNCTION process_bandit_feedback(
  target_user_id UUID,
  algorithm_name_param VARCHAR(50),
  reward_value FLOAT,
  context_factors JSONB DEFAULT '{}'
)
RETURNS TABLE (
  success BOOLEAN,
  new_alpha FLOAT,
  new_beta FLOAT,
  updated_success_rate FLOAT
) AS $$
DECLARE
  context_hash_value VARCHAR(64);
  current_alpha FLOAT;
  current_beta FLOAT;
  new_alpha_value FLOAT;
  new_beta_value FLOAT;
  new_success_rate FLOAT;
BEGIN
  -- Generate context hash
  context_hash_value := encode(
    digest(COALESCE(context_factors::TEXT, '{}'), 'sha256'), 'hex'
  )::VARCHAR(64);
  
  -- Get current parameters
  SELECT alpha, beta INTO current_alpha, current_beta
  FROM bandit_algorithms
  WHERE user_id = target_user_id 
    AND algorithm_name = algorithm_name_param 
    AND context_hash = context_hash_value;
  
  -- If no record exists, initialize with default parameters
  IF current_alpha IS NULL THEN
    current_alpha := 1.0;
    current_beta := 1.0;
    
    INSERT INTO bandit_algorithms (user_id, algorithm_name, context_hash, alpha, beta)
    VALUES (target_user_id, algorithm_name_param, context_hash_value, current_alpha, current_beta)
    ON CONFLICT (user_id, algorithm_name, context_hash) DO NOTHING;
  END IF;
  
  -- Update Beta distribution parameters based on reward
  new_alpha_value := current_alpha + reward_value;
  new_beta_value := current_beta + (1.0 - reward_value);
  
  -- Calculate new success rate
  new_success_rate := new_alpha_value / (new_alpha_value + new_beta_value);
  
  -- Update algorithm parameters
  UPDATE bandit_algorithms
  SET 
    alpha = new_alpha_value,
    beta = new_beta_value,
    total_rewards = total_rewards + reward_value,
    success_rate = new_success_rate,
    confidence_interval_lower = GREATEST(0, new_success_rate - 1.96 * SQRT(new_success_rate * (1 - new_success_rate) / (new_alpha_value + new_beta_value))),
    confidence_interval_upper = LEAST(1, new_success_rate + 1.96 * SQRT(new_success_rate * (1 - new_success_rate) / (new_alpha_value + new_beta_value))),
    last_updated = NOW()
  WHERE user_id = target_user_id 
    AND algorithm_name = algorithm_name_param 
    AND context_hash = context_hash_value;
  
  RETURN QUERY SELECT 
    TRUE,
    new_alpha_value,
    new_beta_value,
    new_success_rate;
    
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 
    FALSE,
    0::FLOAT,
    0::FLOAT,
    0::FLOAT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: CREATE CONTEXTUAL BANDIT SUPPORT FUNCTIONS
-- ============================================================================

-- Function to generate context hash for consistent contextual bandit behavior
CREATE OR REPLACE FUNCTION generate_context_hash(context_factors JSONB)
RETURNS VARCHAR(64) AS $$
DECLARE
  normalized_context TEXT;
  sorted_keys TEXT[];
  key TEXT;
  result_hash VARCHAR(64);
BEGIN
  -- Extract and sort keys for consistent hashing
  SELECT ARRAY_AGG(key ORDER BY key) INTO sorted_keys
  FROM jsonb_object_keys(context_factors) AS key;
  
  -- Build normalized context string
  normalized_context := '';
  FOREACH key IN ARRAY sorted_keys
  LOOP
    normalized_context := normalized_context || key || ':' || (context_factors ->> key) || '|';
  END LOOP;
  
  -- Generate SHA-256 hash
  result_hash := encode(digest(normalized_context, 'sha256'), 'hex');
  
  RETURN result_hash::VARCHAR(64);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate reward based on user action
CREATE OR REPLACE FUNCTION calculate_recommendation_reward(
  action_type VARCHAR(50),
  action_value FLOAT DEFAULT NULL,
  time_to_action_seconds INTEGER DEFAULT NULL,
  session_context JSONB DEFAULT '{}'
)
RETURNS FLOAT AS $$
DECLARE
  reward FLOAT := 0.0;
  time_bonus FLOAT := 0.0;
  context_bonus FLOAT := 0.0;
BEGIN
  -- Base reward by action type
  CASE action_type
    WHEN 'view' THEN
      reward := 0.1;
    WHEN 'click' THEN
      reward := 0.3;
    WHEN 'add_to_collection' THEN
      reward := 0.7;
    WHEN 'rating' THEN
      -- Use actual rating value if provided (1-5 scale)
      reward := COALESCE(action_value / 5.0, 0.6);
    WHEN 'purchase_intent' THEN
      reward := 0.8;
    WHEN 'sample_purchase' THEN
      reward := 1.0;
    WHEN 'ignore' THEN
      reward := 0.0;
    ELSE
      reward := 0.0;
  END CASE;
  
  -- Time-based bonus (faster action = higher engagement)
  IF time_to_action_seconds IS NOT NULL AND time_to_action_seconds > 0 THEN
    -- Reward faster engagement, but cap the bonus
    time_bonus := LEAST(0.2, 30.0 / GREATEST(time_to_action_seconds, 1));
    reward := reward + (reward * time_bonus);
  END IF;
  
  -- Context-based adjustments
  IF session_context ? 'high_engagement' THEN
    context_bonus := 0.1;
    reward := reward + (reward * context_bonus);
  END IF;
  
  -- Ensure reward stays in [0, 1] range
  RETURN GREATEST(0.0, LEAST(1.0, reward));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 7: CREATE BANDIT METRICS AND MONITORING VIEWS
-- ============================================================================

-- View for real-time bandit algorithm performance
CREATE OR REPLACE VIEW bandit_performance_summary AS
SELECT 
  algorithm_name,
  COUNT(DISTINCT user_id) as active_users,
  SUM(total_selections) as total_selections,
  AVG(success_rate) as avg_success_rate,
  STDDEV(success_rate) as success_rate_stddev,
  AVG(alpha / (alpha + beta)) as avg_posterior_mean,
  MIN(confidence_interval_lower) as min_confidence_lower,
  MAX(confidence_interval_upper) as max_confidence_upper,
  COUNT(*) FILTER (WHERE last_updated > NOW() - INTERVAL '24 hours') as recent_updates
FROM bandit_algorithms
GROUP BY algorithm_name
ORDER BY avg_success_rate DESC;

-- View for A/B testing results
CREATE OR REPLACE VIEW ab_test_results AS
SELECT 
  e.experiment_name,
  e.status,
  e.start_date,
  e.end_date,
  
  -- Control group metrics
  COUNT(*) FILTER (WHERE a.group_name = 'control') as control_sample_size,
  AVG(rf.combined_reward) FILTER (WHERE a.group_name = 'control') as control_success_rate,
  
  -- Treatment group metrics
  COUNT(*) FILTER (WHERE a.group_name = 'treatment') as treatment_sample_size,
  AVG(rf.combined_reward) FILTER (WHERE a.group_name = 'treatment') as treatment_success_rate,
  
  -- Statistical results
  (AVG(rf.combined_reward) FILTER (WHERE a.group_name = 'treatment') - 
   AVG(rf.combined_reward) FILTER (WHERE a.group_name = 'control')) as effect_size,
  
  e.is_statistically_significant,
  e.p_value
  
FROM ab_test_experiments e
LEFT JOIN ab_test_assignments a ON e.id = a.experiment_id
LEFT JOIN recommendation_feedback rf ON a.user_id = rf.user_id
WHERE e.status IN ('running', 'completed')
GROUP BY e.id, e.experiment_name, e.status, e.start_date, e.end_date, e.is_statistically_significant, e.p_value;

-- View for contextual performance analysis
CREATE OR REPLACE VIEW contextual_performance_analysis AS
SELECT 
  context_hash,
  algorithm_name,
  COUNT(*) as total_contexts,
  AVG(success_rate) as avg_success_rate,
  STDDEV(success_rate) as performance_variance,
  
  -- Extract common context patterns
  (SELECT jsonb_agg(DISTINCT (context_factors ->> 'time_of_day')) 
   FROM recommendation_feedback rf 
   WHERE rf.algorithm_used = ba.algorithm_name 
     AND encode(digest(rf.contextual_factors::TEXT, 'sha256'), 'hex') = ba.context_hash
  ) as time_patterns,
  
  (SELECT jsonb_agg(DISTINCT (context_factors ->> 'season'))
   FROM recommendation_feedback rf 
   WHERE rf.algorithm_used = ba.algorithm_name 
     AND encode(digest(rf.contextual_factors::TEXT, 'sha256'), 'hex') = ba.context_hash
  ) as season_patterns,
  
  last_updated
FROM bandit_algorithms ba
GROUP BY context_hash, algorithm_name, last_updated
HAVING COUNT(*) >= 5 -- Only contexts with sufficient data
ORDER BY avg_success_rate DESC;

-- ============================================================================
-- STEP 8: CREATE AUTOMATED BANDIT MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to clean up old bandit data and maintain performance
CREATE OR REPLACE FUNCTION maintain_bandit_system()
RETURNS TABLE (
  maintenance_action TEXT,
  records_affected INTEGER,
  performance_impact TEXT
) AS $$
DECLARE
  old_feedback_count INTEGER;
  stale_algorithms_count INTEGER;
  expired_experiments_count INTEGER;
BEGIN
  -- Clean old recommendation feedback (keep 6 months)
  DELETE FROM recommendation_feedback 
  WHERE created_at < NOW() - INTERVAL '6 months';
  GET DIAGNOSTICS old_feedback_count = ROW_COUNT;
  
  RETURN QUERY SELECT 
    'cleaned_old_feedback',
    old_feedback_count,
    'improved_query_performance';
  
  -- Reset algorithms with very low confidence (potential outliers)
  UPDATE bandit_algorithms
  SET alpha = 1.0, beta = 1.0, total_selections = 0, total_rewards = 0.0
  WHERE total_selections > 100 
    AND success_rate < 0.1 
    AND (alpha + beta) > 50;
  GET DIAGNOSTICS stale_algorithms_count = ROW_COUNT;
  
  RETURN QUERY SELECT 
    'reset_underperforming_algorithms',
    stale_algorithms_count,
    'prevent_exploration_starvation';
  
  -- Close expired A/B tests
  UPDATE ab_test_experiments
  SET status = 'completed', end_date = NOW()
  WHERE status = 'running' 
    AND start_date < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS expired_experiments_count = ROW_COUNT;
  
  RETURN QUERY SELECT 
    'closed_expired_experiments',
    expired_experiments_count,
    'cleanup_ab_testing_state';
  
  -- Update algorithm performance metrics
  INSERT INTO algorithm_performance_metrics (
    algorithm_name, 
    context_hash,
    total_recommendations,
    total_positive_feedback,
    success_rate,
    average_reward,
    metric_period_start,
    metric_period_end
  )
  SELECT 
    algorithm_name,
    'global',
    SUM(total_selections),
    SUM(total_rewards),
    AVG(success_rate),
    AVG(total_rewards / GREATEST(total_selections, 1)),
    NOW() - INTERVAL '24 hours',
    NOW()
  FROM bandit_algorithms
  WHERE last_updated > NOW() - INTERVAL '24 hours'
  GROUP BY algorithm_name
  ON CONFLICT (algorithm_name, context_hash, metric_period_start, metric_period_end)
  DO UPDATE SET
    total_recommendations = EXCLUDED.total_recommendations,
    total_positive_feedback = EXCLUDED.total_positive_feedback,
    success_rate = EXCLUDED.success_rate,
    average_reward = EXCLUDED.average_reward,
    calculation_timestamp = NOW();
  
  RETURN QUERY SELECT 
    'updated_performance_metrics',
    3, -- Number of algorithm types
    'refreshed_analytics_data';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 9: CREATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on bandit tables
ALTER TABLE bandit_algorithms ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE algorithm_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;

-- Bandit algorithms policies
CREATE POLICY "Users can access their own bandit algorithms" ON bandit_algorithms
  FOR ALL USING (auth.uid() = user_id);

-- Recommendation feedback policies
CREATE POLICY "Users can access their own feedback" ON recommendation_feedback
  FOR ALL USING (auth.uid() = user_id);

-- Algorithm metrics policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can read algorithm metrics" ON algorithm_performance_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

-- A/B testing policies (admin access for experiments, user access for assignments)
CREATE POLICY "Service role can manage experiments" ON ab_test_experiments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view their test assignments" ON ab_test_assignments
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 10: CREATE SCHEDULED MAINTENANCE
-- ============================================================================

-- Schedule bandit system maintenance to run daily at 3 AM
SELECT cron.schedule(
  'bandit-system-maintenance',
  '0 3 * * *', -- Daily at 3 AM
  'SELECT maintain_bandit_system();'
);

-- ============================================================================
-- STEP 11: GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions for the application
GRANT SELECT, INSERT, UPDATE ON bandit_algorithms TO authenticated;
GRANT SELECT, INSERT ON recommendation_feedback TO authenticated;
GRANT SELECT ON algorithm_performance_metrics TO authenticated;
GRANT SELECT ON ab_test_assignments TO authenticated;

-- Grant access to views
GRANT SELECT ON bandit_performance_summary TO authenticated;
GRANT SELECT ON ab_test_results TO service_role;
GRANT SELECT ON contextual_performance_analysis TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION select_algorithm_thompson_sampling TO authenticated;
GRANT EXECUTE ON FUNCTION process_bandit_feedback TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_recommendation_reward TO authenticated;
GRANT EXECUTE ON FUNCTION generate_context_hash TO authenticated;
GRANT EXECUTE ON FUNCTION maintain_bandit_system TO service_role;

-- ============================================================================
-- STEP 12: INITIALIZE DEFAULT ALGORITHMS
-- ============================================================================

-- Insert default algorithms for global context (will be overridden per user)
INSERT INTO bandit_algorithms (user_id, algorithm_name, context_hash, alpha, beta) 
VALUES 
  -- Use a special system user ID for global defaults
  ('00000000-0000-0000-0000-000000000000', 'content_based', 'default', 1.0, 1.0),
  ('00000000-0000-0000-0000-000000000000', 'collaborative', 'default', 1.0, 1.0),
  ('00000000-0000-0000-0000-000000000000', 'hybrid', 'default', 1.0, 1.0),
  ('00000000-0000-0000-0000-000000000000', 'trending', 'default', 1.0, 1.0),
  ('00000000-0000-0000-0000-000000000000', 'seasonal', 'default', 1.0, 1.0),
  ('00000000-0000-0000-0000-000000000000', 'adventurous', 'default', 1.0, 1.0)
ON CONFLICT (user_id, algorithm_name, context_hash) DO NOTHING;

-- ============================================================================
-- STEP 13: CREATE PERFORMANCE MONITORING TRIGGERS
-- ============================================================================

-- Trigger to automatically update performance metrics after feedback
CREATE OR REPLACE FUNCTION update_algorithm_metrics_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Update real-time success rate for the algorithm
  UPDATE bandit_algorithms
  SET 
    success_rate = (total_rewards + NEW.combined_reward) / (total_selections + 1),
    last_updated = NOW()
  WHERE user_id = NEW.user_id 
    AND algorithm_name = NEW.algorithm_used
    AND context_hash = generate_context_hash(NEW.contextual_factors);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on recommendation feedback
CREATE TRIGGER recommendation_feedback_metrics_trigger
  AFTER INSERT ON recommendation_feedback
  FOR EACH ROW EXECUTE FUNCTION update_algorithm_metrics_trigger();

-- ============================================================================
-- STEP 14: ANALYZE TABLES FOR QUERY OPTIMIZATION
-- ============================================================================

ANALYZE bandit_algorithms;
ANALYZE recommendation_feedback;
ANALYZE algorithm_performance_metrics;
ANALYZE ab_test_experiments;
ANALYZE ab_test_assignments;

-- ============================================================================
-- STEP 15: LOG MIGRATION COMPLETION
-- ============================================================================

INSERT INTO ai_processing_queue (task_type, task_data, priority)
VALUES (
  'migration_complete',
  json_build_object(
    'migration', '20250819000001_multi_armed_bandit_system',
    'completion_time', NOW(),
    'tables_created', ARRAY[
      'bandit_algorithms',
      'recommendation_feedback',
      'algorithm_performance_metrics',
      'ab_test_experiments', 
      'ab_test_assignments'
    ],
    'functions_created', ARRAY[
      'select_algorithm_thompson_sampling',
      'process_bandit_feedback',
      'calculate_recommendation_reward',
      'generate_context_hash',
      'maintain_bandit_system'
    ],
    'views_created', ARRAY[
      'bandit_performance_summary',
      'ab_test_results',
      'contextual_performance_analysis'
    ],
    'features_enabled', ARRAY[
      'thompson_sampling_algorithm_selection',
      'contextual_bandit_support',
      'real_time_feedback_processing',
      'ab_testing_framework',
      'automated_performance_tracking'
    ]
  ),
  10
);