-- Migration: Fix session_token data type mismatch for quiz data transfer
-- Issue: session_token column is UUID type but application generates string tokens
-- This causes transfer_guest_session_to_user RPC function to fail
-- Critical for August 21st launch - blocks conversion from guest to registered user

-- 1. Drop the existing RPC function (it expects UUID parameter)
DROP FUNCTION IF EXISTS transfer_guest_session_to_user(UUID, UUID);

-- 2. Alter the session_token column to TEXT type  
ALTER TABLE user_quiz_sessions 
ALTER COLUMN session_token TYPE TEXT USING session_token::TEXT;

-- 3. Update any indexes that reference session_token
DROP INDEX IF EXISTS idx_user_quiz_sessions_token;
CREATE INDEX idx_user_quiz_sessions_token ON user_quiz_sessions(session_token);

-- 4. Recreate the RPC function with TEXT parameter
CREATE OR REPLACE FUNCTION transfer_guest_session_to_user(
  guest_session_token TEXT,  -- Changed from UUID to TEXT
  target_user_id UUID
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guest_session_id UUID;
  transfer_result JSON;
  response_count INTEGER;
  target_session_id UUID;
BEGIN
  -- Find guest session using TEXT token
  SELECT id INTO guest_session_id
  FROM user_quiz_sessions
  WHERE session_token = guest_session_token
    AND is_guest_session = true
    AND expires_at > NOW();
  
  IF guest_session_id IS NULL THEN
    RETURN json_build_object(
      'error', 'Guest session not found or expired',
      'transfer_successful', false
    );
  END IF;
  
  -- Get response count for validation
  SELECT COUNT(*) INTO response_count
  FROM quiz_responses
  WHERE session_id = guest_session_id;
  
  IF response_count = 0 THEN
    RETURN json_build_object(
      'error', 'No quiz responses found for guest session',
      'transfer_successful', false
    );
  END IF;
  
  -- Create new session for the authenticated user
  INSERT INTO user_quiz_sessions (
    user_id, 
    is_guest_session, 
    session_token,
    quiz_completed,
    created_at,
    expires_at
  )
  SELECT 
    target_user_id,
    false, -- Convert from guest to user session
    gen_random_uuid()::TEXT, -- Generate new TEXT token for user session
    quiz_completed,
    NOW(),
    NOW() + INTERVAL '30 days'
  FROM user_quiz_sessions
  WHERE id = guest_session_id
  RETURNING id INTO target_session_id;
  
  -- Transfer quiz responses to new session
  UPDATE quiz_responses
  SET session_id = target_session_id
  WHERE session_id = guest_session_id;
  
  -- Delete the guest session (data is now transferred)
  DELETE FROM user_quiz_sessions WHERE id = guest_session_id;
  
  RETURN json_build_object(
    'transfer_successful', true,
    'new_session_id', target_session_id,
    'responses_transferred', response_count
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'error', SQLERRM,
    'transfer_successful', false
  );
END;
$$ LANGUAGE plpgsql;