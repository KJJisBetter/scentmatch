/**
 * Timeout Wrapper for AI Operations
 *
 * Fixes the critical production issue where AI SDK calls hang indefinitely
 * Provides timeout handling, fallback mechanisms, and proper error handling
 */

import { AI_TIMEOUTS } from './config';

export interface TimeoutOptions {
  timeout?: number;
  operation?: string;
  fallback?: () => Promise<any>;
}

export class AITimeoutError extends Error {
  public readonly operation: string;
  public readonly timeout: number;

  constructor(operation: string, timeout: number) {
    super(`AI operation '${operation}' timed out after ${timeout}ms`);
    this.name = 'AITimeoutError';
    this.operation = operation;
    this.timeout = timeout;
  }
}

/**
 * Wraps any Promise-based AI operation with timeout and fallback handling
 * Critical fix for production blocking issue SCE-95
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  options: TimeoutOptions = {}
): Promise<T> {
  const {
    timeout = AI_TIMEOUTS.STANDARD,
    operation: operationName = 'AI operation',
    fallback,
  } = options;

  const startTime = Date.now();

  try {
    // Race between the operation and timeout
    const result = await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new AITimeoutError(operationName, timeout));
        }, timeout);
      }),
    ]);

    const duration = Date.now() - startTime;
    console.log(`✅ ${operationName} completed in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof AITimeoutError) {
      console.error(
        `⏰ ${operationName} TIMED OUT after ${duration}ms (limit: ${timeout}ms)`
      );

      if (fallback) {
        console.log(`🔄 ${operationName} using fallback mechanism`);
        try {
          const fallbackResult = await fallback();
          console.log(`✅ ${operationName} fallback succeeded`);
          return fallbackResult;
        } catch (fallbackError) {
          console.error(
            `❌ ${operationName} fallback also failed:`,
            fallbackError
          );
          throw new Error(`Both ${operationName} and fallback failed`);
        }
      }
    } else {
      console.error(`❌ ${operationName} failed after ${duration}ms:`, error);
    }

    throw error;
  }
}

/**
 * Wraps multiple AI operations with timeout and provides aggregated fallback
 * Useful for batch operations where some failures are acceptable
 */
export async function withBatchTimeout<T>(
  operations: Array<{
    promise: Promise<T>;
    name: string;
    timeout?: number;
    fallback?: () => Promise<T>;
  }>
): Promise<Array<T | null>> {
  const results = await Promise.allSettled(
    operations.map(
      ({ promise, name, timeout = AI_TIMEOUTS.STANDARD, fallback }) =>
        withTimeout(promise, { timeout, operation: name, fallback })
    )
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.warn(
        `Batch operation ${operations[index].name} failed:`,
        result.reason
      );
      return null;
    }
  });
}

/**
 * Database-only fallback for when all AI operations fail
 * Critical safety net for production deployment
 */
export const DATABASE_FALLBACK = {
  PERSONALITY: {
    personality_type: 'natural' as const,
    confidence: 0.8,
    traits: ['curious', 'exploring', 'open-minded'],
    description:
      'New to fragrance exploration with great potential to discover preferences',
  },

  EXPLANATION: (fragranceName: string, scentFamily: string = 'fragrance') =>
    `Great choice! This ${scentFamily} fragrance is popular with beginners and matches your quiz preferences. Consider trying a sample to see how it works with your skin chemistry.`,

  BEGINNER_EXPLANATION: (fragranceName: string, brand: string) => ({
    explanation: `Perfect match for your style! ${fragranceName} by ${brand} is ideal for exploring new scents.`,
    summary: `Great beginner choice with excellent community ratings`,
    educationalContent: {
      terms: {},
      tips: [
        'Start with samples',
        'Test on skin first',
        'Give fragrances time to develop',
      ],
      confidenceBooster: 'Trust your instincts when trying new fragrances!',
    },
  }),
};
