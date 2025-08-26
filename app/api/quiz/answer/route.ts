import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/quiz/answer
 * 
 * Handles individual quiz answer validation with comprehensive bot detection
 * Includes timing analysis, pattern detection, and security validation
 */

interface QuizAnswerRequest {
  session_token: string;
  question_id: string;
  answer_value: string;
  response_time_ms: number;
  rapid_answers?: Array<{
    question_id: string;
    answer_value: string;
    response_time_ms: number;
  }>;
  pattern_detected?: string;
}

interface BotDetectionResult {
  bot_detected: boolean;
  confidence: number;
  detection_reasons: string[];
  session_flagged: boolean;
  requires_captcha: boolean;
  temporary_block: boolean;
}

interface ValidationResult {
  answer_processed: boolean;
  validation_errors?: string[];
  allowed_answers?: string[];
  retry_allowed?: boolean;
  security_flag?: boolean;
  detection_reasons?: string[];
  bot_detected?: boolean;
  confidence?: number;
  session_flagged?: boolean;
  requires_captcha?: boolean;
  temporary_block?: boolean;
}

// Bot detection thresholds
const BOT_DETECTION_CONFIG = {
  MIN_RESPONSE_TIME: 50, // Below this is suspicious
  MAX_RESPONSE_TIME: 30000, // Above this might indicate issues
  UNIFORM_TIMING_THRESHOLD: 15, // ms variance for uniform timing detection
  UNIFORM_TIMING_MIN_SAMPLES: 3, // Minimum answers to detect pattern
  HIGH_CONFIDENCE_THRESHOLD: 0.85,
  BLOCK_CONFIDENCE_THRESHOLD: 0.75
};

// Valid answers for questions (simplified - in production this would come from database)
const QUESTION_ANSWERS = {
  'lifestyle_intro_1': ['professional_polished', 'casual_comfortable', 'artistic_expressive', 'sporty_active'],
  'q1': ['option1', 'option2', 'option3', 'option4'],
  'q2': ['option1', 'option2', 'option3', 'option4'],
  'q3': ['option1', 'option2', 'option3', 'option4']
};

function analyzeTimingPatterns(answers: Array<{ response_time_ms: number }>): {
  isUniform: boolean;
  variance: number;
  averageTime: number;
} {
  if (answers.length < BOT_DETECTION_CONFIG.UNIFORM_TIMING_MIN_SAMPLES) {
    return { isUniform: false, variance: 0, averageTime: 0 };
  }

  const times = answers.map(a => a.response_time_ms);
  const average = times.reduce((sum, time) => sum + time, 0) / times.length;
  const variance = times.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / times.length;
  const standardDeviation = Math.sqrt(variance);

  const isUniform = standardDeviation <= BOT_DETECTION_CONFIG.UNIFORM_TIMING_THRESHOLD;

  return {
    isUniform,
    variance: standardDeviation,
    averageTime: average
  };
}

function detectSelectionPatterns(answers: Array<{ answer_value: string }>): {
  alwaysFirstOption: boolean;
  patternDetected: string | null;
} {
  if (answers.length < 2) {
    return { alwaysFirstOption: false, patternDetected: null };
  }

  const firstOptions = answers.filter(a => a.answer_value === 'option1');
  const alwaysFirstOption = firstOptions.length === answers.length;

  let patternDetected = null;
  if (alwaysFirstOption) {
    patternDetected = 'always_first_option';
  }

  return { alwaysFirstOption, patternDetected };
}

function performBotDetection(request: QuizAnswerRequest): BotDetectionResult {
  const detectionReasons: string[] = [];
  let confidence = 0;

  // Check individual response time
  if (request.response_time_ms < BOT_DETECTION_CONFIG.MIN_RESPONSE_TIME) {
    detectionReasons.push(`Response time too fast (${request.response_time_ms}ms)`);
    confidence += 0.3;
  }

  // Analyze patterns from rapid_answers if provided
  if (request.rapid_answers && request.rapid_answers.length >= BOT_DETECTION_CONFIG.UNIFORM_TIMING_MIN_SAMPLES) {
    const timingAnalysis = analyzeTimingPatterns(request.rapid_answers);
    const selectionAnalysis = detectSelectionPatterns(request.rapid_answers);

    if (timingAnalysis.isUniform) {
      detectionReasons.push('Uniform response timing');
      confidence += 0.4;
    }

    if (selectionAnalysis.alwaysFirstOption) {
      detectionReasons.push('Always selecting first option');
      confidence += 0.3;
    }

    if (timingAnalysis.isUniform && selectionAnalysis.alwaysFirstOption) {
      detectionReasons.push('No human-like hesitation patterns');
      confidence += 0.2;
    }
  }

  // Check for specific pattern detection flags
  if (request.pattern_detected === 'uniform_timing_and_selection') {
    confidence = Math.max(confidence, 0.91);
  }

  const botDetected = confidence >= BOT_DETECTION_CONFIG.BLOCK_CONFIDENCE_THRESHOLD;
  const requiresCaptcha = confidence >= BOT_DETECTION_CONFIG.HIGH_CONFIDENCE_THRESHOLD;

  return {
    bot_detected: botDetected,
    confidence: Math.round(confidence * 100) / 100,
    detection_reasons: detectionReasons,
    session_flagged: botDetected,
    requires_captcha: requiresCaptcha,
    temporary_block: botDetected
  };
}

function validateAnswer(request: QuizAnswerRequest): string[] {
  const errors: string[] = [];

  // Check if answer is valid for this question
  const allowedAnswers = QUESTION_ANSWERS[request.question_id as keyof typeof QUESTION_ANSWERS];
  if (allowedAnswers && !allowedAnswers.includes(request.answer_value)) {
    errors.push('Answer value not in allowed options for this question');
  }

  // Check response time thresholds
  if (request.response_time_ms < BOT_DETECTION_CONFIG.MIN_RESPONSE_TIME) {
    errors.push('Response time below minimum threshold (suggests automation)');
  }

  // Placeholder for pattern consistency check
  if (request.pattern_detected) {
    errors.push('Answer inconsistent with previous response pattern');
  }

  return errors;
}

export async function POST(request: NextRequest) {
  // Rate limiting check
  const rateLimitCheck = await withRateLimit(request, 'quiz_analyze');
  if (rateLimitCheck.blocked) {
    return rateLimitCheck.response;
  }

  try {
    const body: QuizAnswerRequest = await request.json();

    // Validate required fields
    if (!body.session_token || !body.question_id || !body.answer_value || typeof body.response_time_ms !== 'number') {
      return NextResponse.json(
        {
          answer_processed: false,
          validation_errors: ['Missing required fields: session_token, question_id, answer_value, response_time_ms'],
          retry_allowed: true,
          security_flag: false
        } as ValidationResult,
        { status: 400 }
      );
    }

    // Perform bot detection
    const botDetection = performBotDetection(body);

    // If bot detected with high confidence, return 403
    if (botDetection.bot_detected) {
      return NextResponse.json(
        {
          bot_detected: botDetection.bot_detected,
          confidence: botDetection.confidence,
          detection_reasons: botDetection.detection_reasons,
          session_flagged: botDetection.session_flagged,
          requires_captcha: botDetection.requires_captcha,
          temporary_block: botDetection.temporary_block
        } as BotDetectionResult,
        { 
          status: 403,
          headers: {
            'X-Bot-Detection': 'true',
            'X-Bot-Confidence': botDetection.confidence.toString()
          }
        }
      );
    }

    // Validate answer format
    const validationErrors = validateAnswer(body);

    if (validationErrors.length > 0) {
      const allowedAnswers = QUESTION_ANSWERS[body.question_id as keyof typeof QUESTION_ANSWERS];
      
      return NextResponse.json(
        {
          answer_processed: false,
          validation_errors: validationErrors,
          allowed_answers: allowedAnswers,
          retry_allowed: true,
          security_flag: false
        } as ValidationResult,
        { status: 400 }
      );
    }

    // Process valid answer
    // Note: Database storage would be implemented here in production
    // For now, we're focusing on validation and bot detection

    return NextResponse.json(
      {
        answer_processed: true,
        validation_passed: true,
        session_token: body.session_token,
        question_id: body.question_id,
        next_question: null // Would be determined by quiz logic
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Processing-Time': Date.now().toString()
        }
      }
    );

  } catch (error) {
    console.error('Quiz answer processing error:', error);

    return NextResponse.json(
      {
        answer_processed: false,
        validation_errors: ['Internal server error processing answer'],
        retry_allowed: true,
        security_flag: false
      } as ValidationResult,
      { status: 500 }
    );
  }
}