-- Analytics Infrastructure for A/B Testing and User Metrics
-- Migration: 20250826000001_analytics_infrastructure

-- Core analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT analytics_events_session_id_check CHECK (session_id <> ''),
  CONSTRAINT analytics_events_event_name_check CHECK (event_name <> '')
);

-- A/B Test assignments tracking
CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_key TEXT NOT NULL,
  variant TEXT NOT NULL CHECK (variant IN ('control', 'treatment')),
  test_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one assignment per user per test
  UNIQUE(user_id, test_key),
  UNIQUE(session_id, test_key)
);

-- A/B Test conversions tracking
CREATE TABLE IF NOT EXISTS ab_test_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_key TEXT NOT NULL,
  variant TEXT NOT NULL CHECK (variant IN ('control', 'treatment')),
  conversion_type TEXT NOT NULL,
  conversion_value DECIMAL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  converted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Reference the assignment
  FOREIGN KEY (user_id, test_key) REFERENCES ab_test_assignments(user_id, test_key) ON DELETE CASCADE,
  FOREIGN KEY (session_id, test_key) REFERENCES ab_test_assignments(session_id, test_key) ON DELETE CASCADE
);

-- Navigation analytics for bottom nav tracking
CREATE TABLE IF NOT EXISTS navigation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  navigation_type TEXT NOT NULL DEFAULT 'bottom_nav',
  tab_clicked TEXT NOT NULL,
  is_mobile BOOLEAN NOT NULL DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT navigation_analytics_tab_check CHECK (tab_clicked IN ('discover', 'search', 'collections', 'quiz', 'profile'))
);

-- Quiz funnel analytics
CREATE TABLE IF NOT EXISTS quiz_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  is_mobile BOOLEAN NOT NULL DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT quiz_funnel_events_type_check CHECK (event_type IN ('quiz_started', 'quiz_completed', 'quiz_abandoned'))
);

-- Collection activity analytics
CREATE TABLE IF NOT EXISTS collection_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  fragrance_id UUID NOT NULL,
  source TEXT NOT NULL,
  is_mobile BOOLEAN NOT NULL DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT collection_analytics_action_check CHECK (action IN ('save', 'remove', 'view', 'share'))
);

-- Performance metrics tracking
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value DECIMAL NOT NULL,
  viewport_width INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT performance_metrics_name_check CHECK (metric_name IN ('page_load_time', 'time_to_interactive', 'first_contentful_paint', 'largest_contentful_paint', 'cumulative_layout_shift')),
  CONSTRAINT performance_metrics_value_positive CHECK (metric_value >= 0)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);

CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_test_key ON ab_test_assignments(test_key);
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_assigned_at ON ab_test_assignments(assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_user_test ON ab_test_assignments(user_id, test_key) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ab_test_conversions_test_key ON ab_test_conversions(test_key);
CREATE INDEX IF NOT EXISTS idx_ab_test_conversions_converted_at ON ab_test_conversions(converted_at DESC);
CREATE INDEX IF NOT EXISTS idx_ab_test_conversions_type ON ab_test_conversions(conversion_type);

CREATE INDEX IF NOT EXISTS idx_navigation_analytics_clicked_at ON navigation_analytics(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_navigation_analytics_tab ON navigation_analytics(tab_clicked);
CREATE INDEX IF NOT EXISTS idx_navigation_analytics_mobile ON navigation_analytics(is_mobile);

CREATE INDEX IF NOT EXISTS idx_quiz_funnel_events_occurred_at ON quiz_funnel_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_funnel_events_type ON quiz_funnel_events(event_type);
CREATE INDEX IF NOT EXISTS idx_quiz_funnel_events_mobile ON quiz_funnel_events(is_mobile);

CREATE INDEX IF NOT EXISTS idx_collection_analytics_performed_at ON collection_analytics(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_collection_analytics_action ON collection_analytics(action);
CREATE INDEX IF NOT EXISTS idx_collection_analytics_fragrance_id ON collection_analytics(fragrance_id);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_measured_at ON performance_metrics(measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_viewport ON performance_metrics(viewport_width);

-- Row Level Security (RLS) Policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access" ON analytics_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON ab_test_assignments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON ab_test_conversions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON navigation_analytics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON quiz_funnel_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON collection_analytics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON performance_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- Users can only see their own data
CREATE POLICY "Users see own analytics" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users see own assignments" ON ab_test_assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users see own conversions" ON ab_test_conversions
  FOR SELECT USING (auth.uid() = user_id);

-- Anonymous users can insert events (for guest tracking)
CREATE POLICY "Anyone can insert events" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Views for common analytics queries
CREATE OR REPLACE VIEW ab_test_summary AS
SELECT 
  test_key,
  test_name,
  variant,
  COUNT(DISTINCT COALESCE(user_id::text, session_id)) as unique_users,
  COUNT(*) as total_assignments,
  COALESCE(
    (SELECT COUNT(*) FROM ab_test_conversions c 
     WHERE c.test_key = a.test_key AND c.variant = a.variant), 
    0
  ) as conversions,
  CASE 
    WHEN COUNT(*) > 0 THEN 
      COALESCE(
        (SELECT COUNT(*) FROM ab_test_conversions c 
         WHERE c.test_key = a.test_key AND c.variant = a.variant), 
        0
      ) * 100.0 / COUNT(*)
    ELSE 0
  END as conversion_rate
FROM ab_test_assignments a
WHERE assigned_at >= NOW() - INTERVAL '30 days'
GROUP BY test_key, test_name, variant
ORDER BY test_key, variant;

CREATE OR REPLACE VIEW mobile_usage_summary AS
SELECT 
  DATE_TRUNC('day', clicked_at) as date,
  tab_clicked,
  COUNT(*) as total_clicks,
  COUNT(*) FILTER (WHERE is_mobile = true) as mobile_clicks,
  COUNT(*) FILTER (WHERE is_mobile = false) as desktop_clicks,
  ROUND(
    COUNT(*) FILTER (WHERE is_mobile = true) * 100.0 / COUNT(*), 
    2
  ) as mobile_percentage
FROM navigation_analytics
WHERE clicked_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', clicked_at), tab_clicked
ORDER BY date DESC, tab_clicked;

-- Grant permissions to authenticated users
GRANT SELECT ON ab_test_summary TO authenticated;
GRANT SELECT ON mobile_usage_summary TO authenticated;

-- Comments for documentation
COMMENT ON TABLE analytics_events IS 'Raw analytics events from client applications';
COMMENT ON TABLE ab_test_assignments IS 'A/B test variant assignments for users and sessions';
COMMENT ON TABLE ab_test_conversions IS 'Conversion events for A/B test analysis';
COMMENT ON TABLE navigation_analytics IS 'Navigation interactions, particularly mobile bottom nav';
COMMENT ON TABLE quiz_funnel_events IS 'Quiz completion funnel tracking';
COMMENT ON TABLE collection_analytics IS 'Fragrance collection activity tracking';
COMMENT ON TABLE performance_metrics IS 'Client-side performance measurements';
COMMENT ON VIEW ab_test_summary IS 'Aggregated A/B test results with conversion rates';
COMMENT ON VIEW mobile_usage_summary IS 'Daily mobile vs desktop navigation usage patterns';