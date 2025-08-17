/**
 * Test Utilities for Enhanced Reliability
 * SCE-19: Enhance test infrastructure for reliable testing
 */

/**
 * Retry function with exponential backoff for flaky operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Performance measurement with statistical analysis
 */
export async function measurePerformance<T>(
  operation: () => Promise<T>,
  samples: number = 3
): Promise<{ result: T; avg: number; max: number; min: number }> {
  const times: number[] = [];
  let result: T;

  for (let i = 0; i < samples; i++) {
    const start = Date.now();
    result = await operation();
    times.push(Date.now() - start);
  }

  return {
    result: result!,
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    max: Math.max(...times),
    min: Math.min(...times),
  };
}

/**
 * Enhanced expect with retry logic for network operations
 */
export async function expectWithRetry<T>(
  operation: () => Promise<T>,
  assertion: (result: T) => void,
  maxRetries: number = 3
): Promise<void> {
  await retryOperation(async () => {
    const result = await operation();
    assertion(result);
    return result;
  }, maxRetries);
}

/**
 * Graceful performance assertion that accounts for network variability
 */
export function expectPerformance(
  actualTime: number,
  targetTime: number,
  tolerance: number = 0.5
): void {
  const maxAllowed = targetTime * (1 + tolerance);

  if (actualTime > maxAllowed) {
    throw new Error(
      `Performance test failed: ${actualTime}ms > ${maxAllowed}ms (target: ${targetTime}ms, tolerance: ${tolerance * 100}%)`
    );
  }
}

/**
 * Test isolation utilities
 */
export class TestDataManager {
  private createdItems: Array<{ table: string; id: string; idField?: string }> =
    [];

  /**
   * Track created test data for cleanup
   */
  track(table: string, id: string, idField: string = 'id'): void {
    this.createdItems.push({ table, id, idField });
  }

  /**
   * Clean up all tracked test data
   */
  async cleanup(supabase: any): Promise<void> {
    // Clean up in reverse order (last created, first deleted)
    for (const item of this.createdItems.reverse()) {
      try {
        await supabase.from(item.table).delete().eq(item.idField, item.id);
      } catch (error) {
        console.warn(`Failed to cleanup ${item.table} ${item.id}:`, error);
      }
    }
    this.createdItems = [];
  }
}

/**
 * Enhanced database test utilities
 */
export class DatabaseTestUtils {
  constructor(private supabase: any) {}

  /**
   * Check if table exists and is accessible
   */
  async isTableAccessible(tableName: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Check if function exists and is callable
   */
  async isFunctionAvailable(
    functionName: string,
    params: any = {}
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc(functionName, params);
      return !error || error.code !== 'PGRST202'; // PGRST202 = function not found
    } catch {
      return false;
    }
  }

  /**
   * Get existing record to avoid foreign key constraints
   */
  async getExistingRecord(table: string, fields: string = '*'): Promise<any> {
    const { data } = await this.supabase
      .from(table)
      .select(fields)
      .limit(1)
      .single();
    return data;
  }
}

/**
 * Skip test if condition not met
 */
export function skipIf(condition: boolean, reason: string) {
  if (condition) {
    console.warn(`Skipping test: ${reason}`);
    return true;
  }
  return false;
}
