# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-15-fragrance-quiz-onboarding-integration/spec.md

## Endpoints

### GET /api/quiz/questions

**Purpose:** Fetch quiz questions with conditional branching logic
**Parameters:** 
- session_token (optional): Guest session identifier
- current_question (optional): Question number for progressive loading
**Response:** Quiz question with answer options and branching logic
**Errors:** 400 (Invalid session), 500 (Quiz service error)

### POST /api/quiz/answer

**Purpose:** Submit quiz answer and receive next question or results
**Parameters:** 
- session_token: Session identifier
- question_id: Current question identifier
- answer_value: User's selected answer
- response_time_ms: Time taken to answer
**Response:** Next question object or completion status with preliminary insights
**Errors:** 400 (Invalid answer), 404 (Session not found), 429 (Rate limit)

### POST /api/quiz/start

**Purpose:** Initialize new quiz session (guest or authenticated)
**Parameters:** 
- user_id (optional): Authenticated user ID
- referral_source (optional): How user found the quiz
**Response:** Session token and first question
**Errors:** 400 (Invalid user), 500 (Session creation failed)

### GET /api/quiz/results/[session_id]

**Purpose:** Get comprehensive quiz results and fragrance personality profile
**Parameters:** 
- session_id: Quiz session identifier
- include_recommendations (optional): Include initial personalized recommendations
**Response:** Fragrance personality profile with style analysis and recommendation preview
**Errors:** 404 (Session not found), 403 (Access denied), 500 (Analysis failed)

### POST /api/quiz/convert-to-account

**Purpose:** Convert guest quiz session to authenticated user account
**Parameters:** 
- session_token: Guest session identifier
- user_data: Account creation information (email, password, name)
- preserve_quiz_data: Whether to transfer quiz insights to new account
**Response:** Account creation success with quiz data transfer confirmation
**Errors:** 400 (Invalid data), 409 (Email exists), 500 (Account creation failed)

### POST /api/quiz/retake

**Purpose:** Allow authenticated users to retake or update quiz responses
**Parameters:** 
- user_id: Authenticated user identifier
- update_type: 'full_retake' or 'selective_update'
- questions_to_update (optional): Specific question IDs for selective updates
**Response:** New quiz session with pre-filled answers or fresh start
**Errors:** 401 (Not authenticated), 404 (User not found)

### GET /api/onboarding/status

**Purpose:** Get user's onboarding progress and next recommended step
**Parameters:** 
- user_id: Authenticated user identifier
**Response:** Onboarding step status and recommended next actions
**Errors:** 401 (Not authenticated), 404 (User not found)

### POST /api/onboarding/complete

**Purpose:** Mark onboarding as completed and transition to main app experience
**Parameters:** 
- user_id: Authenticated user identifier
- completion_data: Onboarding completion context and user feedback
**Response:** Onboarding completion confirmation and main app redirection
**Errors:** 401 (Not authenticated), 400 (Incomplete onboarding)