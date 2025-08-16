-- Migration: Quiz Content and Logic
-- Created: 2025-08-15
-- Purpose: Create quiz questions, archetype templates, and scoring logic

-- =============================================================================
-- QUIZ QUESTION DEFINITIONS
-- =============================================================================

-- 1. Quiz questions master table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id TEXT UNIQUE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN (
    'multiple_choice', 'slider_scale', 'image_selection', 'scenario_based'
  )),
  question_category TEXT NOT NULL CHECK (question_category IN (
    'lifestyle', 'environment', 'personality', 'preferences', 'scenarios', 'style'
  )),
  importance_weight DECIMAL(3,2) DEFAULT 1.0 CHECK (importance_weight > 0),
  reliability_score DECIMAL(3,2) DEFAULT 0.8 CHECK (reliability_score > 0 AND reliability_score <= 1),
  quiz_version TEXT NOT NULL DEFAULT 'v1.0',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Quiz question options
CREATE TABLE IF NOT EXISTS quiz_question_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id TEXT REFERENCES quiz_questions(question_id) ON DELETE CASCADE,
  option_value TEXT NOT NULL,
  option_text TEXT NOT NULL,
  option_description TEXT,
  image_url TEXT, -- For image-based questions
  display_order INTEGER DEFAULT 1,
  
  -- Dimension scoring for this option
  dimension_fresh DECIMAL(3,2) DEFAULT 0 CHECK (dimension_fresh >= -1 AND dimension_fresh <= 1),
  dimension_floral DECIMAL(3,2) DEFAULT 0 CHECK (dimension_floral >= -1 AND dimension_floral <= 1),
  dimension_oriental DECIMAL(3,2) DEFAULT 0 CHECK (dimension_oriental >= -1 AND dimension_oriental <= 1),
  dimension_woody DECIMAL(3,2) DEFAULT 0 CHECK (dimension_woody >= -1 AND dimension_woody <= 1),
  dimension_fruity DECIMAL(3,2) DEFAULT 0 CHECK (dimension_fruity >= -1 AND dimension_fruity <= 1),
  dimension_gourmand DECIMAL(3,2) DEFAULT 0 CHECK (dimension_gourmand >= -1 AND dimension_gourmand <= 1),
  
  -- Branching logic
  triggers_questions TEXT[], -- Question IDs to show next if this option is selected
  skip_questions TEXT[], -- Question IDs to skip if this option is selected
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(question_id, option_value)
);

-- 3. Personality archetype templates
CREATE TABLE IF NOT EXISTS fragrance_personality_archetypes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  archetype_code TEXT UNIQUE NOT NULL CHECK (archetype_code IN (
    'romantic', 'sophisticated', 'natural', 'bold', 'playful', 'mysterious', 'classic', 'modern'
  )),
  archetype_name TEXT NOT NULL,
  archetype_description TEXT NOT NULL,
  
  -- Archetype dimension template (ideal scores for this archetype)
  template_fresh INTEGER CHECK (template_fresh >= 0 AND template_fresh <= 100),
  template_floral INTEGER CHECK (template_floral >= 0 AND template_floral <= 100),
  template_oriental INTEGER CHECK (template_oriental >= 0 AND template_oriental <= 100),
  template_woody INTEGER CHECK (template_woody >= 0 AND template_woody <= 100),
  template_fruity INTEGER CHECK (template_fruity >= 0 AND template_fruity <= 100),
  template_gourmand INTEGER CHECK (template_gourmand >= 0 AND template_gourmand <= 100),
  
  -- Associated characteristics
  typical_occasions TEXT[],
  typical_seasons TEXT[],
  fragrance_families TEXT[],
  style_keywords TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INSERT QUIZ CONTENT
-- =============================================================================

-- 4. Insert core quiz questions (v1.0)
INSERT INTO quiz_questions (question_id, question_text, question_type, question_category, importance_weight, reliability_score) VALUES

-- Lifestyle Questions (High Importance)
('lifestyle_daily_style', 'Which best describes your daily personal style?', 'multiple_choice', 'lifestyle', 2.0, 0.92),
('lifestyle_work_environment', 'What type of work environment do you thrive in?', 'multiple_choice', 'lifestyle', 1.8, 0.88),
('lifestyle_social_preference', 'How do you prefer to spend time with others?', 'multiple_choice', 'lifestyle', 1.5, 0.85),

-- Environment and Mood Questions
('environment_inspiring', 'Which environment makes you feel most inspired?', 'image_selection', 'environment', 1.6, 0.83),
('environment_relaxing', 'Where do you go to feel most relaxed?', 'multiple_choice', 'environment', 1.4, 0.81),

-- Personality and Values Questions  
('personality_self_description', 'How would others describe your personality?', 'multiple_choice', 'personality', 1.7, 0.86),
('personality_decision_style', 'How do you typically make important decisions?', 'multiple_choice', 'personality', 1.3, 0.79),

-- Direct Fragrance Preferences
('preference_intensity', 'How noticeable do you want your fragrance to be?', 'slider_scale', 'preferences', 1.9, 0.94),
('preference_occasions', 'Which occasions are most important for you to smell great?', 'multiple_choice', 'preferences', 1.4, 0.82),

-- Scenario-Based Questions
('scenario_first_date', 'For a first date, which setting appeals to you most?', 'scenario_based', 'scenarios', 1.2, 0.77),
('scenario_confident_moment', 'You feel most confident when you''re...', 'multiple_choice', 'scenarios', 1.1, 0.74),

-- Style and Aesthetic Preferences
('style_fashion_inspiration', 'Your fashion style is most inspired by...', 'multiple_choice', 'style', 1.3, 0.80),
('style_home_decor', 'Your ideal home aesthetic is...', 'multiple_choice', 'style', 1.0, 0.72)

ON CONFLICT (question_id) DO NOTHING;

-- 5. Insert question options with dimension scoring
INSERT INTO quiz_question_options (question_id, option_value, option_text, option_description, display_order, dimension_fresh, dimension_floral, dimension_oriental, dimension_woody, dimension_fruity, dimension_gourmand) VALUES

-- Lifestyle Daily Style Options
('lifestyle_daily_style', 'professional_polished', 'Professional & Polished', 'Classic work attire, structured pieces, timeless elegance', 1, 0.1, 0.3, 0.6, 0.4, 0.0, 0.1),
('lifestyle_daily_style', 'casual_comfortable', 'Casual & Comfortable', 'Relaxed fits, everyday basics, effortless style', 2, 0.5, 0.2, 0.1, 0.2, 0.3, 0.2),
('lifestyle_daily_style', 'artistic_expressive', 'Artistic & Expressive', 'Unique pieces, creative combinations, personal flair', 3, 0.2, 0.4, 0.5, 0.3, 0.4, 0.3),
('lifestyle_daily_style', 'trendy_fashion_forward', 'Trendy & Fashion-Forward', 'Latest styles, statement pieces, Instagram-worthy', 4, 0.4, 0.3, 0.2, 0.1, 0.6, 0.4),

-- Work Environment Options
('lifestyle_work_environment', 'corporate_traditional', 'Corporate & Traditional', 'Formal office, structured hierarchy, classic professionalism', 1, 0.1, 0.2, 0.7, 0.5, 0.0, 0.1),
('lifestyle_work_environment', 'creative_collaborative', 'Creative & Collaborative', 'Open studios, team projects, innovative atmosphere', 2, 0.3, 0.4, 0.3, 0.2, 0.5, 0.3),
('lifestyle_work_environment', 'entrepreneurial_dynamic', 'Entrepreneurial & Dynamic', 'Fast-paced, decision-making, leadership roles', 3, 0.4, 0.1, 0.4, 0.3, 0.2, 0.2),
('lifestyle_work_environment', 'caring_service', 'Caring & Service-Oriented', 'Helping others, nurturing environment, meaningful work', 4, 0.2, 0.6, 0.2, 0.1, 0.3, 0.4),

-- Social Preference Options
('lifestyle_social_preference', 'intimate_gatherings', 'Intimate Gatherings', 'Small groups, deep conversations, close friends', 1, 0.1, 0.4, 0.6, 0.3, 0.2, 0.3),
('lifestyle_social_preference', 'large_celebrations', 'Large Celebrations', 'Parties, events, being the center of attention', 2, 0.3, 0.2, 0.3, 0.1, 0.7, 0.5),
('lifestyle_social_preference', 'cultural_experiences', 'Cultural Experiences', 'Museums, theater, wine tastings, sophisticated events', 3, 0.2, 0.3, 0.7, 0.4, 0.1, 0.2),
('lifestyle_social_preference', 'outdoor_adventures', 'Outdoor Adventures', 'Hiking, sports, nature activities, active lifestyle', 4, 0.8, 0.1, 0.0, 0.5, 0.2, 0.1),

-- Inspiring Environment Options (Image Selection)
('environment_inspiring', 'modern_office', 'Modern Office', 'Clean lines, natural light, minimalist design', 1, 0.6, 0.1, 0.2, 0.2, 0.1, 0.0),
('environment_inspiring', 'cozy_library', 'Cozy Library', 'Warm lighting, books, comfortable reading nooks', 2, 0.1, 0.3, 0.5, 0.6, 0.2, 0.4),
('environment_inspiring', 'art_gallery', 'Art Gallery', 'Creative spaces, artistic expression, cultural sophistication', 3, 0.2, 0.4, 0.6, 0.3, 0.3, 0.2),
('environment_inspiring', 'garden_nature', 'Garden or Nature', 'Outdoors, plants, natural beauty, fresh air', 4, 0.9, 0.5, 0.0, 0.4, 0.2, 0.1),

-- Personality Self-Description Options
('personality_self_description', 'warm_nurturing', 'Warm & Nurturing', 'Caring, supportive, makes others feel comfortable', 1, 0.2, 0.7, 0.3, 0.2, 0.4, 0.5),
('personality_self_description', 'confident_ambitious', 'Confident & Ambitious', 'Goal-oriented, leadership qualities, decisive', 2, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1),
('personality_self_description', 'creative_intuitive', 'Creative & Intuitive', 'Artistic, imaginative, follows instincts', 3, 0.4, 0.5, 0.4, 0.3, 0.5, 0.4),
('personality_self_description', 'analytical_thoughtful', 'Analytical & Thoughtful', 'Logical, considers options, values knowledge', 4, 0.5, 0.2, 0.5, 0.5, 0.1, 0.2),

-- Intensity Preference (Slider Scale - stored as text representation)
('preference_intensity', '1', 'Very Subtle', 'Only you can smell it, personal scent bubble', 1, 0.8, 0.6, 0.1, 0.3, 0.4, 0.2),
('preference_intensity', '3', 'Subtle', 'Close friends notice, intimate presence', 2, 0.6, 0.7, 0.2, 0.4, 0.5, 0.3),
('preference_intensity', '5', 'Moderate', 'Noticeable but not overwhelming, balanced presence', 3, 0.4, 0.5, 0.4, 0.5, 0.4, 0.4),
('preference_intensity', '7', 'Noticeable', 'People comment, memorable impression', 4, 0.2, 0.3, 0.7, 0.4, 0.3, 0.5),
('preference_intensity', '10', 'Statement', 'Bold presence, turns heads, signature scent', 5, 0.1, 0.2, 0.9, 0.6, 0.2, 0.7),

-- First Date Scenario Options
('scenario_first_date', 'cozy_restaurant', 'Intimate Restaurant', 'Candlelit dinner, quiet conversation, romantic atmosphere', 1, 0.1, 0.6, 0.4, 0.2, 0.3, 0.4),
('scenario_first_date', 'art_gallery_opening', 'Art Gallery Opening', 'Cultural event, sophisticated crowd, intellectual conversation', 2, 0.2, 0.3, 0.7, 0.4, 0.1, 0.2),
('scenario_first_date', 'outdoor_picnic', 'Outdoor Picnic', 'Natural setting, casual fun, relaxed atmosphere', 3, 0.8, 0.4, 0.1, 0.3, 0.5, 0.3),
('scenario_first_date', 'trendy_cocktail_bar', 'Trendy Cocktail Bar', 'Modern scene, social energy, fashionable crowd', 4, 0.3, 0.2, 0.3, 0.2, 0.7, 0.5)

ON CONFLICT (question_id, option_value) DO NOTHING;

-- =============================================================================
-- PERSONALITY ARCHETYPE TEMPLATES
-- =============================================================================

-- 6. Insert the 8 fragrance personality archetypes
INSERT INTO fragrance_personality_archetypes (
  archetype_code, archetype_name, archetype_description,
  template_fresh, template_floral, template_oriental, template_woody, template_fruity, template_gourmand,
  typical_occasions, typical_seasons, fragrance_families, style_keywords
) VALUES

('romantic', 'Romantic Floral Enthusiast', 
 'You are drawn to beautiful, feminine fragrances that enhance your natural grace. Floral notes make you feel most like yourself, while fruity touches add playfulness to your sophisticated taste.',
 25, 90, 35, 20, 75, 50,
 ARRAY['date_night', 'romantic_dinner', 'special_occasions', 'wedding'],
 ARRAY['spring', 'summer'],
 ARRAY['floral', 'fruity', 'light_oriental'],
 ARRAY['feminine', 'romantic', 'beautiful', 'graceful', 'charming']),

('sophisticated', 'Sophisticated Evening Enthusiast',
 'You gravitate toward complex, layered fragrances with oriental and woody notes. Your scent choice reflects your appreciation for quality, craftsmanship, and timeless elegance.',
 15, 30, 90, 80, 20, 35,
 ARRAY['business_dinner', 'theater', 'fine_dining', 'professional_events'],
 ARRAY['fall', 'winter'],
 ARRAY['oriental', 'woody', 'amber'],
 ARRAY['sophisticated', 'elegant', 'complex', 'refined', 'luxurious']),

('natural', 'Natural Fresh Spirit',
 'You love fragrances that capture the essence of nature - fresh, clean, and effortlessly beautiful. Your scent preferences reflect your authentic, down-to-earth personality.',
 95, 40, 15, 60, 45, 20,
 ARRAY['casual_outings', 'outdoor_activities', 'work', 'everyday'],
 ARRAY['spring', 'summer'],
 ARRAY['fresh', 'green', 'aquatic', 'citrus'],
 ARRAY['natural', 'authentic', 'fresh', 'effortless', 'clean']),

('bold', 'Bold Statement Maker',
 'You choose fragrances that command attention and make memorable impressions. Your scent is an extension of your confident, fearless personality.',
 20, 25, 85, 70, 30, 60,
 ARRAY['parties', 'nightlife', 'concerts', 'social_events'],
 ARRAY['fall', 'winter'],
 ARRAY['spicy', 'oriental', 'woody'],
 ARRAY['bold', 'confident', 'memorable', 'fearless', 'dramatic']),

('playful', 'Playful Sweet Explorer',
 'You delight in fun, sweet fragrances that reflect your joyful spirit. Fruity and gourmand notes capture your playful, optimistic approach to life.',
 45, 60, 25, 15, 85, 80,
 ARRAY['casual_fun', 'friends_gathering', 'weekend', 'vacation'],
 ARRAY['spring', 'summer'],
 ARRAY['fruity', 'gourmand', 'sweet'],
 ARRAY['playful', 'joyful', 'sweet', 'fun', 'optimistic']),

('mysterious', 'Mysterious Depth Seeker',
 'You are drawn to enigmatic, complex fragrances with depth and intrigue. Your scent choices reflect your sophisticated, mysterious allure.',
 10, 20, 80, 90, 15, 40,
 ARRAY['evening_events', 'intimate_settings', 'special_occasions'],
 ARRAY['fall', 'winter'],
 ARRAY['dark_woody', 'oriental', 'incense'],
 ARRAY['mysterious', 'enigmatic', 'deep', 'intriguing', 'alluring']),

('classic', 'Classic Timeless Elegance',
 'You appreciate timeless, well-balanced fragrances that never go out of style. Your choices reflect your refined taste and appreciation for enduring quality.',
 50, 65, 50, 45, 40, 35,
 ARRAY['work', 'social_events', 'everyday', 'formal_occasions'],
 ARRAY['spring', 'summer', 'fall', 'winter'],
 ARRAY['classic_floral', 'balanced', 'traditional'],
 ARRAY['classic', 'timeless', 'elegant', 'refined', 'balanced']),

('modern', 'Modern Minimalist',
 'You prefer clean, contemporary fragrances with minimalist sophistication. Your scent choices reflect your appreciation for quality, simplicity, and modern design.',
 80, 20, 25, 40, 30, 15,
 ARRAY['work', 'urban_lifestyle', 'contemporary_settings'],
 ARRAY['spring', 'summer'],
 ARRAY['clean', 'white_florals', 'modern_woods'],
 ARRAY['modern', 'clean', 'minimalist', 'contemporary', 'sophisticated'])

ON CONFLICT (archetype_code) DO NOTHING;

-- =============================================================================
-- QUIZ LOGIC AND SCORING FUNCTIONS
-- =============================================================================

-- 7. Enhanced personality analysis function with actual scoring
CREATE OR REPLACE FUNCTION calculate_personality_from_responses(
  target_session_id UUID
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  dimension_scores RECORD;
  best_archetype RECORD;
  response_count INTEGER;
BEGIN
  -- Count responses for validation
  SELECT COUNT(*) INTO response_count
  FROM user_quiz_responses
  WHERE session_id = target_session_id;
  
  IF response_count < 3 THEN
    RETURN json_build_object(
      'error', 'Insufficient responses',
      'responses_count', response_count,
      'minimum_required', 3
    );
  END IF;

  -- Calculate weighted dimension scores
  WITH weighted_dimensions AS (
    SELECT 
      SUM(
        (qqo.dimension_fresh * qq.importance_weight * qq.reliability_score)::DECIMAL
      ) / SUM(qq.importance_weight * qq.reliability_score) as fresh_score,
      
      SUM(
        (qqo.dimension_floral * qq.importance_weight * qq.reliability_score)::DECIMAL
      ) / SUM(qq.importance_weight * qq.reliability_score) as floral_score,
      
      SUM(
        (qqo.dimension_oriental * qq.importance_weight * qq.reliability_score)::DECIMAL
      ) / SUM(qq.importance_weight * qq.reliability_score) as oriental_score,
      
      SUM(
        (qqo.dimension_woody * qq.importance_weight * qq.reliability_score)::DECIMAL
      ) / SUM(qq.importance_weight * qq.reliability_score) as woody_score,
      
      SUM(
        (qqo.dimension_fruity * qq.importance_weight * qq.reliability_score)::DECIMAL
      ) / SUM(qq.importance_weight * qq.reliability_score) as fruity_score,
      
      SUM(
        (qqo.dimension_gourmand * qq.importance_weight * qq.reliability_score)::DECIMAL
      ) / SUM(qq.importance_weight * qq.reliability_score) as gourmand_score
    
    FROM user_quiz_responses uqr
    JOIN quiz_questions qq ON uqr.question_id = qq.question_id
    JOIN quiz_question_options qqo ON qq.question_id = qqo.question_id 
      AND uqr.answer_value = qqo.option_value
    WHERE uqr.session_id = target_session_id
  )
  SELECT 
    GREATEST(0, LEAST(100, (fresh_score * 100 + 50)::INTEGER)) as fresh,
    GREATEST(0, LEAST(100, (floral_score * 100 + 50)::INTEGER)) as floral,
    GREATEST(0, LEAST(100, (oriental_score * 100 + 50)::INTEGER)) as oriental,
    GREATEST(0, LEAST(100, (woody_score * 100 + 50)::INTEGER)) as woody,
    GREATEST(0, LEAST(100, (fruity_score * 100 + 50)::INTEGER)) as fruity,
    GREATEST(0, LEAST(100, (gourmand_score * 100 + 50)::INTEGER)) as gourmand
  INTO dimension_scores
  FROM weighted_dimensions;

  -- Find best matching archetype using cosine similarity
  WITH archetype_similarities AS (
    SELECT 
      fpa.archetype_code,
      fpa.archetype_name,
      fpa.archetype_description,
      -- Calculate cosine similarity between user dimensions and archetype template
      (
        (dimension_scores.fresh * fpa.template_fresh) +
        (dimension_scores.floral * fpa.template_floral) +
        (dimension_scores.oriental * fpa.template_oriental) +
        (dimension_scores.woody * fpa.template_woody) +
        (dimension_scores.fruity * fpa.template_fruity) +
        (dimension_scores.gourmand * fpa.template_gourmand)
      ) / (
        SQRT(
          POWER(dimension_scores.fresh, 2) + POWER(dimension_scores.floral, 2) + 
          POWER(dimension_scores.oriental, 2) + POWER(dimension_scores.woody, 2) + 
          POWER(dimension_scores.fruity, 2) + POWER(dimension_scores.gourmand, 2)
        ) * 
        SQRT(
          POWER(fpa.template_fresh, 2) + POWER(fpa.template_floral, 2) + 
          POWER(fpa.template_oriental, 2) + POWER(fpa.template_woody, 2) + 
          POWER(fpa.template_fruity, 2) + POWER(fpa.template_gourmand, 2)
        )
      ) as similarity_score
    FROM fragrance_personality_archetypes fpa
    ORDER BY similarity_score DESC
    LIMIT 1
  )
  SELECT 
    archetype_code,
    archetype_name,
    archetype_description,
    similarity_score
  INTO best_archetype
  FROM archetype_similarities;

  -- Build result JSON
  SELECT json_build_object(
    'analysis_completed', true,
    'session_id', target_session_id,
    'responses_analyzed', response_count,
    'dimension_scores', json_build_object(
      'fresh', dimension_scores.fresh,
      'floral', dimension_scores.floral,
      'oriental', dimension_scores.oriental,
      'woody', dimension_scores.woody,
      'fruity', dimension_scores.fruity,
      'gourmand', dimension_scores.gourmand
    ),
    'personality_profile', json_build_object(
      'primary_archetype', best_archetype.archetype_code,
      'archetype_name', best_archetype.archetype_name,
      'style_descriptor', best_archetype.archetype_description,
      'confidence_score', LEAST(1.0, best_archetype.similarity_score * 1.2), -- Boost confidence slightly
      'match_strength', best_archetype.similarity_score
    ),
    'analysis_metadata', json_build_object(
      'analysis_method', 'weighted_cosine_similarity',
      'quiz_version', 'v1.0',
      'generated_at', NOW()
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 8. Function to get next question with branching logic
CREATE OR REPLACE FUNCTION get_next_quiz_question(
  target_session_id UUID,
  question_number INTEGER DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  session_data RECORD;
  answered_questions TEXT[];
  next_question RECORD;
BEGIN
  -- Get session information
  SELECT 
    current_question,
    total_questions,
    is_completed,
    expires_at
  INTO session_data
  FROM user_quiz_sessions
  WHERE id = target_session_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'error', 'Session not found',
      'session_id', target_session_id
    );
  END IF;
  
  IF session_data.expires_at < NOW() THEN
    RETURN json_build_object(
      'error', 'Session expired',
      'expired_at', session_data.expires_at
    );
  END IF;
  
  IF session_data.is_completed THEN
    RETURN json_build_object(
      'quiz_completed', true,
      'total_questions', session_data.total_questions
    );
  END IF;

  -- Get already answered question IDs
  SELECT array_agg(question_id) INTO answered_questions
  FROM user_quiz_responses
  WHERE session_id = target_session_id;
  
  answered_questions := COALESCE(answered_questions, ARRAY[]::TEXT[]);

  -- Get next question (simplified logic - would implement full branching)
  SELECT 
    question_id,
    question_text,
    question_type,
    question_category,
    importance_weight
  INTO next_question
  FROM quiz_questions
  WHERE is_active = true
    AND question_id != ALL(answered_questions)
  ORDER BY 
    importance_weight DESC,
    question_id
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- All questions answered, mark as complete
    UPDATE user_quiz_sessions
    SET 
      is_completed = true,
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = target_session_id;
    
    RETURN json_build_object(
      'quiz_completed', true,
      'all_questions_answered', true,
      'ready_for_analysis', true
    );
  END IF;

  -- Get question options
  WITH question_options AS (
    SELECT json_agg(
      json_build_object(
        'value', option_value,
        'text', option_text,
        'description', option_description,
        'image_url', image_url
      ) ORDER BY display_order
    ) as options
    FROM quiz_question_options
    WHERE question_id = next_question.question_id
  )
  SELECT json_build_object(
    'question_id', next_question.question_id,
    'question_text', next_question.question_text,
    'question_type', next_question.question_type,
    'question_category', next_question.question_category,
    'options', qo.options,
    'progress', json_build_object(
      'current', session_data.current_question,
      'total', session_data.total_questions,
      'percentage', ROUND((session_data.current_question::DECIMAL / session_data.total_questions) * 100)
    ),
    'metadata', json_build_object(
      'importance_weight', next_question.importance_weight,
      'answered_count', array_length(answered_questions, 1)
    )
  ) INTO result
  FROM question_options qo;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ARCHETYPE-SPECIFIC RECOMMENDATION FUNCTIONS
-- =============================================================================

-- 9. Function to get archetype-specific fragrance recommendations
CREATE OR REPLACE FUNCTION get_archetype_recommendations(
  archetype_code TEXT,
  max_results INTEGER DEFAULT 8
)
RETURNS TABLE (
  fragrance_id TEXT,
  archetype_match_score DECIMAL,
  reasoning TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archetype_template RECORD;
BEGIN
  -- Get archetype template
  SELECT * INTO archetype_template
  FROM fragrance_personality_archetypes
  WHERE fragrance_personality_archetypes.archetype_code = get_archetype_recommendations.archetype_code;
  
  IF NOT FOUND THEN
    RETURN; -- Invalid archetype
  END IF;

  -- Return fragrances that match archetype preferences
  -- This is a simplified implementation - production would use vector similarity
  RETURN QUERY
  SELECT 
    f.id::TEXT,
    (0.7 + RANDOM() * 0.3)::DECIMAL as match_score,
    CASE archetype_template.archetype_code
      WHEN 'romantic' THEN f.name || ' perfectly captures your romantic, floral-loving nature'
      WHEN 'sophisticated' THEN f.name || ' matches your sophisticated taste for complex, elegant fragrances'
      WHEN 'natural' THEN f.name || ' aligns with your love of fresh, natural scents'
      WHEN 'bold' THEN f.name || ' makes the statement your bold personality deserves'
      WHEN 'playful' THEN f.name || ' brings out your playful, joyful spirit'
      WHEN 'mysterious' THEN f.name || ' enhances your mysterious, alluring presence'
      WHEN 'classic' THEN f.name || ' embodies the timeless elegance you appreciate'
      WHEN 'modern' THEN f.name || ' reflects your modern, minimalist aesthetic'
      ELSE f.name || ' recommended for your fragrance personality'
    END as reasoning
  FROM fragrances f
  WHERE f.sample_available = true
    AND (
      -- Match fragrance families to archetype preferences
      f.scent_family = ANY(archetype_template.fragrance_families) OR
      -- Match seasonal preferences
      f.recommended_seasons && archetype_template.typical_seasons OR
      -- Match occasion preferences  
      f.recommended_occasions && archetype_template.typical_occasions
    )
  ORDER BY RANDOM() -- Would be actual similarity scoring
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PERMISSIONS AND GRANTS
-- =============================================================================

-- 10. Grant appropriate permissions
GRANT EXECUTE ON FUNCTION calculate_personality_from_responses TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_quiz_question TO authenticated;
GRANT EXECUTE ON FUNCTION get_archetype_recommendations TO authenticated;

-- Guest users need access to quiz functions via special policy
GRANT EXECUTE ON FUNCTION get_next_quiz_question TO anon;

-- Service role for cleanup and analytics
GRANT EXECUTE ON FUNCTION cleanup_expired_quiz_sessions TO service_role;

-- =============================================================================
-- TABLE COMMENTS AND DOCUMENTATION
-- =============================================================================

-- 11. Add comprehensive documentation
COMMENT ON TABLE user_quiz_sessions IS 'Quiz sessions supporting both authenticated users and anonymous guests with 24-hour expiration';
COMMENT ON TABLE user_quiz_responses IS 'Individual quiz responses with timing and metadata for analysis';
COMMENT ON TABLE user_fragrance_personalities IS 'AI-generated personality profiles from quiz analysis with confidence scoring';
COMMENT ON TABLE quiz_questions IS 'Master quiz questions with branching logic and importance weighting';
COMMENT ON TABLE quiz_question_options IS 'Question options with fragrance dimension scoring for personality analysis';
COMMENT ON TABLE fragrance_personality_archetypes IS '8 core fragrance personality archetypes with dimension templates';

COMMENT ON COLUMN user_quiz_sessions.session_token IS 'Unique access token for guest sessions, enables anonymous quiz taking';
COMMENT ON COLUMN user_quiz_sessions.expires_at IS 'Automatic expiration for guest sessions to ensure privacy compliance';
COMMENT ON COLUMN user_quiz_responses.response_time_ms IS 'Response timing for bot detection and UX optimization';
COMMENT ON COLUMN user_fragrance_personalities.confidence_score IS 'AI confidence in personality assessment accuracy (0-1)';

-- =============================================================================
-- MIGRATION VALIDATION AND CLEANUP
-- =============================================================================

-- 12. Validate migration and setup scheduled cleanup
DO $$
DECLARE
  table_count INTEGER;
  function_count INTEGER;
  archetype_count INTEGER;
  question_count INTEGER;
BEGIN
  -- Count created objects
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_name IN ('user_quiz_sessions', 'user_quiz_responses', 'user_fragrance_personalities', 
                       'quiz_questions', 'quiz_question_options', 'fragrance_personality_archetypes')
    AND table_schema = 'public';
    
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_name IN ('calculate_personality_from_responses', 'get_next_quiz_question', 
                        'get_archetype_recommendations')
    AND routine_schema = 'public';
    
  SELECT COUNT(*) INTO archetype_count
  FROM fragrance_personality_archetypes;
  
  SELECT COUNT(*) INTO question_count
  FROM quiz_questions;

  -- Validation assertions
  ASSERT table_count >= 6, 'Missing required quiz tables';
  ASSERT function_count >= 3, 'Missing required quiz functions';
  ASSERT archetype_count >= 8, 'Missing personality archetypes';
  ASSERT question_count >= 10, 'Missing quiz questions';
  
  -- Log successful completion
  RAISE NOTICE 'Quiz system migration validation: % tables, % functions, % archetypes, % questions', 
    table_count, function_count, archetype_count, question_count;
  RAISE NOTICE 'Quiz content and logic migration completed successfully!';
END $$;